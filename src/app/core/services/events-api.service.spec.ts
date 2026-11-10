import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { TelegramService } from './telegram.service';
import { EventsApiService } from './events-api.service';
import type { EventItem } from '../types/event.model';

describe('EventsApiService', () => {
  let http: HttpTestingController;
  let service: EventsApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TelegramService, useValue: { initData: 'verified-telegram-init-data' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(EventsApiService);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('loads organizer engagement through the same-origin API with verified initData', async () => {
    const result = firstValueFrom(service.getOrganizerEngagement());
    const request = http.expectOne('/api/organizer/engagement');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-telegram-init-data');
    request.flush([{ eventId: 'event-1', eventTitle: 'Pilot', eventDate: '2026-11-06', views: 7, shares: 2, rsvps: 3 }]);
    await expect(result).resolves.toEqual([
      { eventId: 'event-1', eventTitle: 'Pilot', eventDate: '2026-11-06', views: 7, shares: 2, rsvps: 3 },
    ]);
  });

  it('loads past events from the public archive endpoint', async () => {
    const result = firstValueFrom(service.getPastEvents());
    const request = http.expectOne('/api/events/history');
    expect(request.request.method).toBe('GET');
    const event = { id: 'past-event', title: 'Past event', date: '2026-11-09', isPublicEvent: true, telegramSourceUrl: 'https://t.me/channel/12' };
    request.flush([event]);
    await expect(result).resolves.toEqual([event]);
  });

  it('loads the admin event editor list with verified initData', async () => {
    const result = firstValueFrom(service.getAdminEvents());
    const request = http.expectOne('/api/admin/events');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-telegram-init-data');
    const event = {
      id: 'event-1', title: 'Winter concert', description: '', date: '2026-12-01', time: '19:00',
      place: 'Astana Hall', category: 'концерт', imageUrl: '', status: 'approved',
    };
    request.flush([event]);
    await expect(result).resolves.toEqual([event]);
  });

  it('updates admin event content and manual cover URL with verified initData', async () => {
    const body = {
      title: 'Winter concert', description: 'Updated details', date: '2026-12-01', time: '19:00',
      place: 'Astana Hall', category: 'концерт', imageUrl: 'https://cdn.example.org/poster.webp',
      imagePermissionConfirmed: true,
    };
    const result = firstValueFrom(service.updateAdminEvent('event-1', body));
    const request = http.expectOne('/api/admin/events/event-1');
    expect(request.request.method).toBe('PUT');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-telegram-init-data');
    expect(request.request.body).toEqual(body);
    request.flush({ id: 'event-1', ...body, status: 'approved' });
    await expect(result).resolves.toMatchObject({ id: 'event-1', imageUrl: body.imageUrl, status: 'approved' });
  });

  it('sends public-event confirmation and Telegram source permalink with a submission', async () => {
    const event: Omit<EventItem, 'id'> = {
      title: 'Channel event', description: '', date: '2026-12-01', time: '19:00', place: 'Astana venue',
      address: '', lat: 51.1694, lng: 71.4494, category: 'concert', price: null, imageUrl: '', organizerName: 'Host',
      isPublicEvent: true, telegramSourceUrl: 'https://t.me/astana_events/123',
    };
    const result = firstValueFrom(service.createEvent(event));
    const request = http.expectOne('/api/events');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.isPublicEvent).toBe(true);
    expect(request.request.body.telegramSourceUrl).toBe('https://t.me/astana_events/123');
    request.flush({ id: 'event-1', ...event });
    await expect(result).resolves.toMatchObject({ isPublicEvent: true, telegramSourceUrl: 'https://t.me/astana_events/123' });
  });

  it('loads admin funnel totals with verified initData', async () => {
    const result = firstValueFrom(service.getAdminFunnelSummary());
    const request = http.expectOne('/api/analytics/summary');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-telegram-init-data');
    request.flush([{ name: 'community_open', count: 4 }]);
    await expect(result).resolves.toEqual([{ name: 'community_open', count: 4 }]);
  });

  it('retries admin detection after a transient backend wake-up response', async () => {
    vi.useFakeTimers();
    const result = firstValueFrom(service.getAdminSalesSummary());
    http.expectOne('/api/admin/sales-summary').flush({}, { status: 503, statusText: 'Service Unavailable' });

    await vi.advanceTimersByTimeAsync(2_000);
    const retry = http.expectOne('/api/admin/sales-summary');
    expect(retry.request.headers.get('X-Telegram-Init-Data')).toBe('verified-telegram-init-data');
    retry.flush({ totalOrders: 0, totalTickets: 0, paidOrders: 0, pendingOrders: 0, paidRevenue: 0, requestedRefunds: 0, activeEvents: 0 });

    await expect(result).resolves.toMatchObject({ activeEvents: 0 });
  });

  it('does not retry admin detection when the API denies access', async () => {
    const result = firstValueFrom(service.getAdminSalesSummary());
    http.expectOne('/api/admin/sales-summary').flush({}, { status: 403, statusText: 'Forbidden' });

    await expect(result).resolves.toBeNull();
    http.expectNone('/api/admin/sales-summary');
  });

  it('loads an owner event promotion offer with verified Telegram initData', async () => {
    const result = firstValueFrom(service.getEventPromotionOffer('event-7'));
    const request = http.expectOne('/api/events/event-7/promotion/offer');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-telegram-init-data');
    const offer = {
      eligible: true,
      available: false,
      stars: 500,
      expiresAtEventDate: true,
      ticketUrl: 'https://tickets.example.com/event-7',
      campaignId: null,
      status: null,
      expiresAt: null,
    };
    request.flush(offer);
    await expect(result).resolves.toEqual(offer);
  });

  it('creates a promotion invoice only with the explicit terms version and verified initData', async () => {
    const result = firstValueFrom(service.createEventPromotionInvoice('event-7', '2026-11-09'));
    const request = http.expectOne('/api/events/event-7/promotion/invoice');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-telegram-init-data');
    expect(request.request.body).toEqual({ termsAccepted: true, termsVersion: '2026-11-09' });
    request.flush({ campaignId: 'campaign-1', stars: 500, invoiceUrl: 'https://t.me/$invoice' });
    await expect(result).resolves.toEqual({ campaignId: 'campaign-1', stars: 500, invoiceUrl: 'https://t.me/$invoice' });
  });

  it('cancels a pending promotion invoice through an authenticated owner request', async () => {
    const result = firstValueFrom(service.cancelEventPromotionInvoice('event-7'));
    const request = http.expectOne('/api/events/event-7/promotion/cancel');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-telegram-init-data');
    request.flush(null);
    await expect(result).resolves.toBe(true);
  });

  it('loads the admin work board only through the protected API with verified initData', async () => {
    const result = firstValueFrom(service.getAdminWorkBoard());
    const request = http.expectOne('/api/admin/work-board');
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('text');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-telegram-init-data');
    request.flush('## Active blocks\n');
    await expect(result).resolves.toBe('## Active blocks\n');
  });

  it('loads the admin weekly venue RSVP density with verified initData', async () => {
    const result = firstValueFrom(service.getAdminMeetupDensitySummary());
    const request = http.expectOne('/api/analytics/summary/meetup-density');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-telegram-init-data');
    const summary = {
      fromDate: '2026-11-06',
      throughDate: '2026-11-12',
      plans: [{ venueId: 'astana-joy', venue: 'Joy bar&restaurant', date: '2026-11-08', rsvpCount: 2 }],
    };
    request.flush(summary);
    await expect(result).resolves.toEqual(summary);
  });

  it('loads only public venue options without sending Telegram identity', async () => {
    const result = firstValueFrom(service.getMeetupVenueOptions());
    const request = http.expectOne('/api/meetups/venues');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.has('X-Telegram-Init-Data')).toBe(false);
    request.flush([{ id: 'bourbon-street-astana', name: 'Bourbon Street Bar' }]);
    await expect(result).resolves.toEqual([{ id: 'bourbon-street-astana', name: 'Bourbon Street Bar' }]);
  });
});
