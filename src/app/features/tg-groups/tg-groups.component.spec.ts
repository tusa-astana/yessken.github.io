import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TelegramService } from '../../core/services/telegram.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { TgGroupsComponent } from './tg-groups.component';

describe('TgGroupsComponent', () => {
  let fixture: ComponentFixture<TgGroupsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TgGroupsComponent],
      providers: [
        { provide: TelegramService, useValue: {} },
        { provide: AnalyticsService, useValue: { track: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TgGroupsComponent);
    fixture.detectChanges();
  });

  it('shows the RollMove community with its public Telegram link', () => {
    const element = fixture.nativeElement as HTMLElement;
    const link = element.querySelector<HTMLAnchorElement>('.join');

    expect(element.querySelector('.title')?.textContent).toContain('Кинь-Двинь');
    expect(link?.getAttribute('href')).toBe('https://t.me/RollMove');
    expect(element.querySelector('.count')).toBeNull();
  });

  it('tracks a community click with its curated ID, not as an event RSVP', () => {
    const analytics = TestBed.inject(AnalyticsService);
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.join');
    link?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(analytics.track).toHaveBeenCalledWith('community_open', undefined, 'rollmove-astana', 'beacon');
  });
});