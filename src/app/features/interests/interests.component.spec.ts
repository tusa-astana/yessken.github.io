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
  gatherings: [{
    id: gatheringId,
    interestId: 'board-games',
    hostTelegramUserId: 123,
    title: 'Партия для новичков',
    date: '2026-11-08',
    time: '18:30',
    place: 'Кофейня в центре',
    details: 'Простые игры.',
    goingCount: 2,
    userGoing: false,
    isHost: false,
  }],
};

describe('InterestsComponent gathering links', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
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
        { provide: TelegramService, useValue: { isInTelegram: false, startParam: '' } },
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
});
