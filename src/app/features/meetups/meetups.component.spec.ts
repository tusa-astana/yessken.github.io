import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AnalyticsService } from '../../core/services/analytics.service';
import { TelegramService } from '../../core/services/telegram.service';
import { MeetupsApiService } from './meetups-api.service';
import type { MeetupPlan } from './meetup.model';
import { MeetupsComponent } from './meetups.component';
import { InterestsApiService } from '../interests/interests-api.service';

const plan: MeetupPlan = {
  id: 'venue-1',
  venue: 'Test Venue',
  type: 'bar',
  address: 'Astana',
  lat: null,
  lng: null,
  mapUrl: 'https://example.com',
  featured: false,
  date: '2026-11-06',
  goingCount: 0,
  openToMeetCount: 0,
  userGoing: false,
  attendees: [],
};

describe('MeetupsComponent privacy defaults', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeetupsComponent],
      providers: [
        provideRouter([]),
        { provide: MeetupsApiService, useValue: {
          plans: signal([]),
          loading: signal(false),
          loaded: signal(true),
          error: signal(false),
          sourceUpdatedAt: signal(null),
          load: async () => undefined,
          saveSelection: vi.fn(async () => true),
        } },
        { provide: TelegramService, useValue: {
          isInTelegram: true,
          miniAppLink: vi.fn((startParam: string) => `https://t.me/tusa_astana_bot?startapp=${startParam}`),
          openTelegramLink: vi.fn(() => true),
        } },
        { provide: AnalyticsService, useValue: { track: vi.fn() } },
        { provide: InterestsApiService, useValue: { loadUpcomingGatherings: vi.fn(async () => []) } },
      ],
    }).compileComponents();
  });

  it('defaults new attendance to anonymous', () => {
    const fixture = TestBed.createComponent(MeetupsComponent);
    fixture.componentInstance.openJoin(plan);

    expect(fixture.componentInstance.draftAnonymous()).toBe(true);
    expect(fixture.componentInstance.draftOpenToMeet()).toBe(false);
  });

  it('preserves an existing explicit choice when editing attendance', () => {
    const fixture = TestBed.createComponent(MeetupsComponent);
    const existing = {
      ...plan,
      userGoing: true,
      attendees: [{ id: 'you', name: 'You', time: '20:30', anonymous: false, openToMeet: true, isYou: true }],
    };
    fixture.componentInstance.openJoin(existing);

    expect(fixture.componentInstance.draftAnonymous()).toBe(false);
    expect(fixture.componentInstance.draftOpenToMeet()).toBe(true);
  });

  it('links the Together page to local Telegram communities', () => {
    const fixture = TestBed.createComponent(MeetupsComponent);
    fixture.detectChanges();

    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.groups-shortcut');
    expect(link?.getAttribute('href')).toBe('/tg-groups');
    expect(link?.textContent).toContain('Telegram-сообщества');
    fixture.destroy();
  });

  it('shows real community-created plans separately from venue listings', async () => {
    const gathering = {
      id: 'public-gathering-1',
      interestId: 'board-games', interestName: 'Настольные игры', interestEmoji: '♟',
      title: 'Партия для новичков', date: '2026-11-08', time: '18:30', place: 'Кофейня в центре',
      details: 'Принесём простые игры', goingCount: 2,
    };
    TestBed.inject(InterestsApiService).loadUpcomingGatherings = vi.fn(async () => [gathering]);
    const fixture = TestBed.createComponent(MeetupsComponent);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.people-plan-card')?.textContent).toContain('Партия для новичков');
    expect(element.querySelector('.people-plan-card')?.textContent).toContain('2 идут');
    expect(element.querySelector<HTMLAnchorElement>('.people-plan-footer a')?.getAttribute('href')).toBe('/interests?group=board-games');
    expect(element.querySelector('.people-plans-disclaimer')?.textContent).toContain('не организованы TUSA');
    fixture.destroy();
  });

  it('shows curated Instagram profile and post links on a venue card', () => {
    const venue = {
      ...plan,
      galleryUrl: 'https://www.instagram.com/22.astana/',
      previewPostUrl: 'https://www.instagram.com/reel/DdCF13PuQ2_/',
    };
    const fixture = TestBed.createComponent(MeetupsComponent);
    fixture.componentInstance.api.plans.set([venue]);
    fixture.detectChanges();

    const links = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.venue-social-links a');
    expect(links).toHaveLength(2);
    expect(links[0].href).toBe(venue.galleryUrl);
    expect(links[1].href).toBe(venue.previewPostUrl);
    expect(links[0].rel).toContain('noopener');
    fixture.destroy();
  });

  it('shows social links in the selected map pin card and limits them to Instagram HTTPS URLs', () => {
    const venue = {
      ...plan,
      goingCount: 3,
      openToMeetCount: 1,
      galleryUrl: 'https://www.instagram.com/22.astana/',
      previewPostUrl: 'https://example.com/post',
    };
    const fixture = TestBed.createComponent(MeetupsComponent);
    fixture.componentInstance.api.plans.set([venue]);
    fixture.componentInstance.view.set('map');
    fixture.componentInstance.mapSelectedPlan.set(venue);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.map-selected-card')?.textContent).toContain('1 открыты к знакомствам');
    expect(element.querySelectorAll('.map-social-links a')).toHaveLength(1);
    expect(element.querySelector<HTMLAnchorElement>('.map-social-links a')?.href).toBe(venue.galleryUrl);
    expect(element.querySelector('.map-quick-join')?.textContent).toContain('Я иду · анонимно · ~20:30');
    expect(element.querySelector('.map-quick-note')?.textContent).toContain('Одно нажатие');
    expect(fixture.componentInstance.instagramUrl('http://instagram.com/22.astana')).toBeNull();
    expect(fixture.componentInstance.instagramUrl('https://example.com/profile')).toBeNull();
    fixture.destroy();
  });

  it('saves a one-tap map RSVP anonymously at the clearly labeled approximate time', async () => {
    const fixture = TestBed.createComponent(MeetupsComponent);
    const saveSelection = fixture.componentInstance.api.saveSelection as ReturnType<typeof vi.fn>;
    fixture.componentInstance.quickJoin(plan);

    expect(saveSelection).toHaveBeenCalledWith(plan.id, {
      date: fixture.componentInstance.selectedDate(),
      time: '20:30',
      anonymous: true,
      openToMeet: false,
    });
    expect(fixture.componentInstance.joiningPlan()).toBeNull();
    fixture.destroy();
  });

  it('shares a venue-specific Telegram deep link with the plan date', async () => {
    const fixture = TestBed.createComponent(MeetupsComponent);
    const telegram = TestBed.inject(TelegramService);
    const analytics = TestBed.inject(AnalyticsService);
    await fixture.componentInstance.share(plan);

    expect(telegram.miniAppLink).toHaveBeenCalledWith('meetup_venue-1_20261106');
    expect(analytics.track).toHaveBeenCalledWith('meetup_share_intent', undefined, 'venue-1');
    fixture.destroy();
  });

  it('tracks an allowlisted campaign on invite open and preserves it when resharing', async () => {
    TestBed.overrideProvider(ActivatedRoute, { useValue: {
      snapshot: { queryParamMap: convertToParamMap({ venue: plan.id, campaign: 'host-a' }) },
    } });
    const api = TestBed.inject(MeetupsApiService);
    api.plans.set([plan]);
    const fixture = TestBed.createComponent(MeetupsComponent);
    const setView = vi.spyOn(fixture.componentInstance, 'setView').mockResolvedValue();
    fixture.detectChanges();
    await Promise.resolve();

    const analytics = TestBed.inject(AnalyticsService);
    const telegram = TestBed.inject(TelegramService);
    expect(analytics.track).toHaveBeenCalledWith('meetup_invite_open', undefined, 'venue-1|c:host-a');

    await fixture.componentInstance.share(plan);
    expect(analytics.track).toHaveBeenCalledWith('meetup_share_intent', undefined, 'venue-1|c:host-a');
    expect(telegram.miniAppLink).toHaveBeenCalledWith('meetup_venue-1_20261106_c_host-a');
    setView.mockRestore();
    fixture.destroy();
  });
});
