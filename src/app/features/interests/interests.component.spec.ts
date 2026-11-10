import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AnalyticsService } from '../../core/services/analytics.service';
import { TelegramService } from '../../core/services/telegram.service';
import { InterestsApiService } from './interests-api.service';
import type { InterestGroup } from './interest.model';
import { InterestsComponent } from './interests.component';

const gatheringId = '0123456789abcdef0123456789abcdef';
const group: InterestGroup = {
  id: 'board-games',
  name: 'Настольные игры',
  description: 'Встречи за настольными играми.',
  emoji: '♟',
  memberCount: 2,
  isMember: false,
  notifyNewGatherings: false,
  communities: [],
  gatherings: [{
    id: gatheringId,
    interestId: 'board-games',
    title: 'Партия для новичков',
    date: '2026-11-08',
    time: '18:30',
    place: 'Кофейня в центре',
    details: 'Простые игры.',
    goingCount: 2,
    userGoing: false,
    isHost: false,
    isOpen: true,
    isNew: false,
  }],
};

describe('InterestsComponent gathering links', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('keeps the Together venue and RSVP experience directly accessible from Interests', async () => {
    await TestBed.configureTestingModule({
      imports: [InterestsComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: TelegramService, useValue: { isInTelegram: false, startParam: '', miniAppLink: vi.fn(), openTelegramLink: vi.fn() } },
        { provide: AnalyticsService, useValue: { track: vi.fn() } },
        { provide: InterestsApiService, useValue: { load: vi.fn(async () => [group]) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(InterestsComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const togetherLink = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.hero a[routerLink="/meetups"]');
    expect(togetherLink?.getAttribute('href')).toBe('/meetups');
    expect(togetherLink?.textContent).toContain('Вместе · Куда идём?');
    fixture.destroy();
  });

  it('highlights and scrolls to the exact gathering from a validated link', async () => {
    let animationFrameCallback: FrameRequestCallback | undefined;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      animationFrameCallback = callback;
      return 1;
    });

    await TestBed.configureTestingModule({
      imports: [InterestsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ gathering: gatheringId }) } },
        },
        { provide: TelegramService, useValue: {
          isInTelegram: false,
          startParam: '',
          miniAppLink: vi.fn((startParam: string) => `https://t.me/tusa_astana_bot?startapp=${startParam}`),
          openTelegramLink: vi.fn(() => true),
        } },
        { provide: AnalyticsService, useValue: { track: vi.fn() } },
        { provide: InterestsApiService, useValue: { load: vi.fn(async () => [group]) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(InterestsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const card = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(`#gathering-${gatheringId}`);
    expect(card).not.toBeNull();
    expect(card?.classList.contains('highlighted-gathering')).toBe(true);
    expect(fixture.componentInstance.highlightedInterestId()).toBe('board-games');
    expect(TestBed.inject(AnalyticsService).track).toHaveBeenCalledWith(
      'community_gathering_open', undefined, `gathering:${gatheringId}`,
    );

    const scrollIntoView = vi.fn();
    if (card) card.scrollIntoView = scrollIntoView;
    animationFrameCallback?.(0);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    fixture.destroy();
  });

  it('shares a gathering from its group with exact deep link and privacy-safe analytics ref', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    await TestBed.configureTestingModule({
      imports: [InterestsComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: TelegramService, useValue: {
          isInTelegram: false,
          startParam: '',
          miniAppLink: vi.fn((startParam: string) => `https://t.me/tusa_astana_bot?startapp=${startParam}`),
          openTelegramLink: vi.fn(() => true),
        } },
        { provide: AnalyticsService, useValue: { track: vi.fn() } },
        { provide: InterestsApiService, useValue: { load: vi.fn(async () => [group]) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(InterestsComponent);
    const telegram = TestBed.inject(TelegramService);
    const analytics = TestBed.inject(AnalyticsService);

    try {
      await fixture.componentInstance.shareGathering(group, group.gatherings[0]);
      expect(telegram.miniAppLink).toHaveBeenCalledWith(`gathering_${gatheringId}`);
      expect(analytics.track).toHaveBeenCalledWith('community_gathering_share', undefined, `gathering:${gatheringId}`);
      expect(share).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Партия для новичков',
        url: `https://t.me/tusa_astana_bot?startapp=gathering_${gatheringId}`,
      }));
      expect(share.mock.calls[0][0].text).toContain('Кофейня в центре');
    } finally {
      Reflect.deleteProperty(navigator, 'share');
      fixture.destroy();
    }
  });

  it('requires a host to cancel their upcoming gathering before leaving the group', async () => {
    const leave = vi.fn(async () => true);
    const hostedGroup: InterestGroup = {
      ...group,
      isMember: true,
      notifyNewGatherings: false,
      gatherings: group.gatherings.map((gathering) => ({ ...gathering, isHost: true })),
    };
    await TestBed.configureTestingModule({
      imports: [InterestsComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: TelegramService, useValue: { isInTelegram: true, startParam: '', miniAppLink: vi.fn(), openTelegramLink: vi.fn() } },
        { provide: AnalyticsService, useValue: { track: vi.fn() } },
        { provide: InterestsApiService, useValue: { load: vi.fn(async () => [hostedGroup]), leave } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(InterestsComponent);
    await fixture.whenStable();

    await fixture.componentInstance.leave(hostedGroup);
    fixture.detectChanges();

    expect(leave).not.toHaveBeenCalled();
    expect(fixture.componentInstance.actionError()).toContain('Сначала отмени свои будущие встречи');
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent)
      .toContain('Сначала отмени свои будущие встречи');
    fixture.destroy();
  });

  it('shows a new open gathering notice only to group members and shows its open label', async () => {
    const newGathering: InterestGroup = {
      ...group,
      isMember: true,
      gatherings: [{ ...group.gatherings[0], isNew: true }],
    };
    await TestBed.configureTestingModule({
      imports: [InterestsComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: TelegramService, useValue: { isInTelegram: true, startParam: '', miniAppLink: vi.fn(), openTelegramLink: vi.fn() } },
        { provide: AnalyticsService, useValue: { track: vi.fn() } },
        { provide: InterestsApiService, useValue: { load: vi.fn(async () => [newGathering]) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(InterestsComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.new-gathering-notices')?.textContent).toContain('Партия для новичков');
    expect(element.querySelector('.new-gathering-label')?.textContent).toContain('НОВАЯ ОТКРЫТАЯ ВСТРЕЧА');
    expect(element.querySelector('.notification-setting input')).not.toBeNull();
    fixture.destroy();
  });

  it('allows a member to opt in to Telegram notifications for open gatherings', async () => {
    const memberGroup: InterestGroup = { ...group, isMember: true };
    const setNotifications = vi.fn(async () => true);
    await TestBed.configureTestingModule({
      imports: [InterestsComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: TelegramService, useValue: { isInTelegram: true, startParam: '', miniAppLink: vi.fn(), openTelegramLink: vi.fn() } },
        { provide: AnalyticsService, useValue: { track: vi.fn() } },
        { provide: InterestsApiService, useValue: { load: vi.fn(async () => [memberGroup]), setGatheringNotifications: setNotifications } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(InterestsComponent);

    await fixture.componentInstance.setGatheringNotifications(memberGroup, true);

    expect(setNotifications).toHaveBeenCalledWith('board-games', true);
    expect(fixture.componentInstance.announcement()).toContain('включены');
    fixture.destroy();
  });

  it('displays an approved Reddit community in its related interest group', async () => {
    const redditCommunity = {
      id: 'community-1',
      title: 'Astana community',
      description: 'Обсуждения города',
      platform: 'reddit' as const,
      url: 'https://www.reddit.com/r/Astana',
    };
    await TestBed.configureTestingModule({
      imports: [InterestsComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: TelegramService, useValue: { isInTelegram: false, startParam: '', miniAppLink: vi.fn(), openTelegramLink: vi.fn() } },
        { provide: AnalyticsService, useValue: { track: vi.fn() } },
        { provide: InterestsApiService, useValue: { load: vi.fn(async () => [{ ...group, communities: [redditCommunity] }]) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(InterestsComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.community-link');
    expect(link?.href).toBe(redditCommunity.url);
    expect(link?.textContent).toContain('Reddit');
    expect(link?.textContent).toContain(redditCommunity.title);
    expect(link?.rel).toContain('noopener');
    fixture.destroy();
  });

  it('places the community suggestion CTA before the long interest list', async () => {
    await TestBed.configureTestingModule({
      imports: [InterestsComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: TelegramService, useValue: { isInTelegram: false, startParam: '', miniAppLink: vi.fn(), openTelegramLink: vi.fn() } },
        { provide: AnalyticsService, useValue: { track: vi.fn() } },
        { provide: InterestsApiService, useValue: { load: vi.fn(async () => [group]) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(InterestsComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const suggestion = element.querySelector('.community-submit');
    const interests = element.querySelector('.group-grid');
    expect(suggestion).not.toBeNull();
    expect(interests).not.toBeNull();
    expect(Boolean(suggestion!.compareDocumentPosition(interests!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    fixture.destroy();
  });

  it('submits a community with all selected interest IDs and explains pending moderation', async () => {
    const submitCommunity = vi.fn(async () => true);
    const secondGroup: InterestGroup = { ...group, id: 'running', name: 'Бег и прогулки' };
    await TestBed.configureTestingModule({
      imports: [InterestsComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: TelegramService, useValue: { isInTelegram: true, startParam: '', miniAppLink: vi.fn(), openTelegramLink: vi.fn() } },
        { provide: AnalyticsService, useValue: { track: vi.fn() } },
        { provide: InterestsApiService, useValue: { load: vi.fn(async () => [group, secondGroup]), submitCommunity } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(InterestsComponent);
    const component = fixture.componentInstance;
    component.communityTitle.set('Группа настольных игр');
    component.communityDescription.set('Встречи и обсуждения');
    component.communityPlatform.set('telegram');
    component.communityUrl.set('https://t.me/boardgames_astana');
    component.toggleCommunityInterest('board-games', true);
    component.toggleCommunityInterest('running', true);

    await component.submitCommunity();

    expect(submitCommunity).toHaveBeenCalledWith({
      title: 'Группа настольных игр',
      description: 'Встречи и обсуждения',
      platform: 'telegram',
      url: 'https://t.me/boardgames_astana',
      interestIds: ['board-games', 'running'],
    });
    expect(component.announcement()).toContain('на проверку');
    fixture.destroy();
  });

  it('does not submit a community without a selected interest even if the form submit handler runs', async () => {
    const submitCommunity = vi.fn(async () => true);
    await TestBed.configureTestingModule({
      imports: [InterestsComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: TelegramService, useValue: { isInTelegram: true, startParam: '', miniAppLink: vi.fn(), openTelegramLink: vi.fn() } },
        { provide: AnalyticsService, useValue: { track: vi.fn() } },
        { provide: InterestsApiService, useValue: { load: vi.fn(async () => [group]), submitCommunity } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(InterestsComponent);

    await fixture.componentInstance.submitCommunity();

    expect(submitCommunity).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('marks an in-app new-gathering notice read and highlights its plan', async () => {
    const newGathering: InterestGroup = {
      ...group,
      isMember: true,
      gatherings: [{ ...group.gatherings[0], isNew: true }],
    };
    const load = vi.fn(async () => [newGathering]);
    const markRead = vi.fn(async () => true);
    await TestBed.configureTestingModule({
      imports: [InterestsComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: TelegramService, useValue: { isInTelegram: true, startParam: '', miniAppLink: vi.fn(), openTelegramLink: vi.fn() } },
        { provide: AnalyticsService, useValue: { track: vi.fn() } },
        { provide: InterestsApiService, useValue: { load, markGatheringNotificationRead: markRead } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(InterestsComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.new-gathering-notices a');
    await fixture.componentInstance.openGatheringNotice(newGathering, newGathering.gatherings[0]);
    fixture.detectChanges();

    expect(link?.getAttribute('href')).toBe(`#gathering-${gatheringId}`);
    expect(markRead).toHaveBeenCalledWith('board-games', gatheringId);
    expect(load).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.newGatherings()).toHaveLength(1);
    expect(fixture.componentInstance.highlightedGatheringId()).toBe(gatheringId);
    expect(link?.hidden).toBe(true);
    fixture.destroy();
  });
});
