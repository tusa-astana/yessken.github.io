import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EventsApiService } from '../../core/services/events-api.service';
import { I18nService } from '../../core/services/i18n.service';
import { TelegramService } from '../../core/services/telegram.service';
import { AdminAnalyticsComponent } from './admin-analytics.component';

describe('AdminAnalyticsComponent', () => {
  let fixture: ComponentFixture<AdminAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAnalyticsComponent],
      providers: [
        provideRouter([]),
        { provide: EventsApiService, useValue: {
          getAdminFunnelSummary: () => of([{ name: 'community_open', count: 4 }]),
          getAdminDailyFunnelSummary: () => of({ fromDate: '2026-11-03', throughDate: '2026-11-09', rows: [] }),
          getAdminAnalyticsInsights: () => of({
            fromDate: '2026-11-03',
            throughDate: '2026-11-09',
            daily: [],
            topSearchTerms: [],
            popularCategories: [],
            promotionFunnel: { offerViews: 0, invoiceStarts: 0, preCheckout: 0, cancelledOrClosed: 0, ticketSellerClicks: 0, paid: 0, refunded: 0 },
          }),
          getAdminMeetupDensitySummary: () => of({ fromDate: '2026-11-06', throughDate: '2026-11-12', plans: [] }),
          getAdminMeetupCampaignSummary: () => of([]),
          getMeetupVenueOptions: () => of([{ id: 'bourbon-street-astana', name: 'Bourbon Street Bar' }]),
        } },
        { provide: TelegramService, useValue: {
          miniAppLink: (startParam: string) => `https://t.me/tusa_astana_bot?startapp=${startParam}`,
        } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAnalyticsComponent);
    TestBed.inject(I18nService).setLocale('ru');
    fixture.detectChanges();
  });

  it('shows community outbound clicks as actions, not membership', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Переходы в сообщества');
    expect(element.textContent).toContain('4');
    expect(element.textContent).toContain('не число вступивших участников');
  });

  it('offers statistics and task-board tabs inside pilot analytics', () => {
    const tabs = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.analytics-tabs a');

    expect(tabs).toHaveLength(2);
    expect(tabs[0].getAttribute('href')).toBe('/admin/analytics');
    expect(tabs[0].textContent).toContain('Статистика');
    expect(tabs[1].getAttribute('href')).toBe('/admin/analytics/board');
    expect(tabs[1].textContent).toContain('Доска задач');
  });

  it('offers a secure Telegram handoff when opened without admin web-app credentials', () => {
    fixture.componentInstance.summary.set(null);
    fixture.detectChanges();
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.telegram-access');

    expect(link?.getAttribute('href')).toBe('https://t.me/tusa_astana_bot?startapp=admin_analytics');
    expect(link?.textContent).toContain('Открыть админ-статистику в Telegram');
  });

  it('shows seven mobile-friendly daily buckets and fills missing metrics with zero', () => {
    fixture.componentInstance.dailySummary.set({
      fromDate: '2026-11-03',
      throughDate: '2026-11-09',
      rows: [
        { date: '2026-11-09', name: 'catalog_view', count: 8 },
        { date: '2026-11-09', name: 'meetup_invite_open', count: 2 },
      ],
    });
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('section[aria-labelledby="daily-heading"] .metric-grid .metric-card')).toHaveLength(7);
    expect(element.textContent).toContain('Действия по дням · последние 7 дней');
    expect(element.textContent).toContain('8');
    expect(element.textContent).toContain('2');
    expect(element.textContent).toContain('не уникальные пользователи');
  });

  it('renders selectable-period trend, search/category rankings, and promotion funnel', () => {
    fixture.componentInstance.insights.set({
      fromDate: '2026-11-03',
      throughDate: '2026-11-09',
      daily: [
        { date: '2026-11-03', name: 'event_open', count: 1 },
        { date: '2026-11-09', name: 'event_open', count: 4 },
        { date: '2026-11-09', name: 'ticket_seller_click', count: 2 },
      ],
      topSearchTerms: [{ name: 'jazz', count: 3 }],
      popularCategories: [{ name: 'концерт', count: 5 }],
      promotionFunnel: { offerViews: 4, invoiceStarts: 2, preCheckout: 1, cancelledOrClosed: 1, ticketSellerClicks: 2, paid: 1, refunded: 0 },
    });
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('#insights-heading')?.textContent).toContain('Интерес и конверсия');
    expect(element.querySelector('.trend-card svg polyline')?.getAttribute('points')).not.toBe('');
    expect(element.textContent).toContain('jazz');
    expect(element.textContent).toContain('концерт');
    expect(element.textContent).toContain('Закрыто/отменено в Telegram');
    expect(element.textContent).toContain('Переходы к билетному продавцу');
  });

  it('shows meetup share intents and deep-link opens as separate funnel steps', () => {
    fixture.componentInstance.summary.set([
      { name: 'meetup_share_intent', count: 6 },
      { name: 'meetup_invite_open', count: 3 },
    ]);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Отправки планов');
    expect(element.textContent).toContain('Открытия приглашений');
    expect(element.textContent).toContain('6');
    expect(element.textContent).toContain('3');
  });

  it('shows community-created meetup share and open totals separately', () => {
    fixture.componentInstance.summary.set([
      { name: 'community_gathering_share', count: 5 },
      { name: 'community_gathering_open', count: 2 },
      { name: 'community_gathering_rsvp', count: 1 },
    ]);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Отправки встреч участников');
    expect(element.textContent).toContain('Открытия встреч участников');
    expect(element.textContent).toContain('Записи на встречи участников');
    expect(element.textContent).toContain('5');
    expect(element.textContent).toContain('2');
    expect(element.textContent).toContain('1');
  });

  it('shows only venue/date plans that have crossed the two-RSVP threshold', () => {
    fixture.componentInstance.density.set({
      fromDate: '2026-11-06',
      throughDate: '2026-11-12',
      plans: [{ venueId: 'astana-joy', venue: 'Joy bar&restaurant', date: '2026-11-08', rsvpCount: 2 }],
    });
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Планы мест на ближайшие 7 дней с 2+ RSVP');
    expect(element.textContent).toContain('Joy bar&restaurant');
    expect(element.textContent).toContain('2026-11-08');
    expect(element.textContent).toContain('не уникальный охват и не подтверждение посещения');
  });

  it('shows campaign aliases as aggregate counts without identifying hosts', () => {
    fixture.componentInstance.campaigns.set([
      { name: 'meetup_invite_open', campaign: 'host-a', venueId: 'bourbon-street-astana', count: 3 },
    ]);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Каналы seed-host пилота');
    expect(element.textContent).toContain('host-a');
    expect(element.textContent).toContain('bourbon-street-astana');
    expect(element.textContent).toContain('3');
    expect(element.textContent).toContain('не показывает уникальных людей');
  });

  it('builds a date-specific host link from a public venue and allowlisted alias', () => {
    const component = fixture.componentInstance;
    const venueSelect = fixture.nativeElement.querySelector('#campaign-venue') as HTMLSelectElement;
    expect(venueSelect.options).toHaveLength(1);
    expect(venueSelect.options[0].value).toBe('bourbon-street-astana');

    const date = component.campaignDate();
    expect(component.campaignLink()).toBe(
      `https://t.me/tusa_astana_bot?startapp=meetup_bourbon-street-astana_${date.replaceAll('-', '')}_c_host-a`,
    );

    component.campaignDate.set('2026-02-31');
    expect(component.campaignLink()).toBeNull();
  });

  it('translates pilot analytics when the global locale changes', () => {
    TestBed.inject(I18nService).setLocale('en');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Pilot analytics');
    expect(element.textContent).toContain('Community link clicks');
    expect(element.textContent).toContain('not group joins');
  });
});