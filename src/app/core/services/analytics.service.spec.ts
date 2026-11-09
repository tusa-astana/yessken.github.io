import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TelegramService } from './telegram.service';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let http: HttpTestingController;
  let service: AnalyticsService;

  beforeEach(() => {
    window.localStorage.removeItem('tusa-funnel-events');
    TestBed.configureTestingModule({
      providers: [
        AnalyticsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TelegramService, useValue: { initData: 'verified-telegram-init-data' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AnalyticsService);
  });

  afterEach(() => {
    http.verify();
    Reflect.deleteProperty(navigator, 'sendBeacon');
    window.localStorage.removeItem('tusa-funnel-events');
    TestBed.resetTestingModule();
  });

  it('sends event discovery metrics to the API with verified Telegram initData', () => {
    service.track('event_open', 'event-123');

    const request = http.expectOne('/api/analytics');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-telegram-init-data');
    expect(request.request.body.name).toBe('event_open');
    expect(request.request.body.eventId).toBe('event-123');
    request.flush(null);
  });

  it('sends curated community opens as references, not event IDs', () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: sendBeacon });
    service.track('community_open', undefined, 'rollmove-astana', 'beacon');

    expect(sendBeacon).toHaveBeenCalledOnce();
    expect(sendBeacon.mock.calls[0][0]).toBe('/api/analytics/beacon');
    expect(sendBeacon.mock.calls[0][1]).toBeInstanceOf(URLSearchParams);
    expect((sendBeacon.mock.calls[0][1] as URLSearchParams).get('ref')).toBe('rollmove-astana');
    http.expectNone('/api/analytics');
    expect(service.getSummary().community_open).toBe(1);
    sendBeacon.mockRestore();
  });

  it('sends meetup share and invite-open funnel steps with the curated venue reference', () => {
    service.track('meetup_share_intent', undefined, 'bourbon-street-astana');
    const shareRequest = http.expectOne('/api/analytics');
    expect(shareRequest.request.body).toEqual({ name: 'meetup_share_intent', eventId: undefined, ref: 'bourbon-street-astana' });
    shareRequest.flush(null);

    service.track('meetup_invite_open', undefined, 'bourbon-street-astana');
    const openRequest = http.expectOne('/api/analytics');
    expect(openRequest.request.body).toEqual({ name: 'meetup_invite_open', eventId: undefined, ref: 'bourbon-street-astana' });
    expect(service.getSummary().meetup_share_intent).toBe(1);
    expect(service.getSummary().meetup_invite_open).toBe(1);
    openRequest.flush(null);
  });

  it('tracks community meetup shares and opens using only the public gathering reference', () => {
    service.track('community_gathering_share', undefined, 'gathering:0123456789abcdef0123456789abcdef');
    const shareRequest = http.expectOne('/api/analytics');
    expect(shareRequest.request.body).toEqual({
      name: 'community_gathering_share', eventId: undefined, ref: 'gathering:0123456789abcdef0123456789abcdef',
    });
    shareRequest.flush(null);

    service.track('community_gathering_open', undefined, 'gathering:0123456789abcdef0123456789abcdef');
    const openRequest = http.expectOne('/api/analytics');
    expect(openRequest.request.body).toEqual({
      name: 'community_gathering_open', eventId: undefined, ref: 'gathering:0123456789abcdef0123456789abcdef',
    });
    expect(service.getSummary().community_gathering_share).toBe(1);
    expect(service.getSummary().community_gathering_open).toBe(1);
    openRequest.flush(null);
  });

  it('does not let the client emit the server-owned community gathering RSVP metric', () => {
    service.track('community_gathering_rsvp', undefined, 'gathering:0123456789abcdef0123456789abcdef');

    http.expectNone('/api/analytics');
    expect(service.getSummary().community_gathering_rsvp).toBe(0);
  });

  it('sends search terms for server aggregation without storing them in browser localStorage', () => {
    service.track('search_term', undefined, 'jazz');

    const request = http.expectOne('/api/analytics');
    expect(request.request.body).toEqual({ name: 'search_term', eventId: undefined, ref: 'jazz' });
    expect(window.localStorage.getItem('tusa-funnel-events')).toBeNull();
    request.flush(null);
  });

  it('tracks external ticket seller clicks without storing the browsing event locally', () => {
    service.track('ticket_seller_click', 'approved-event-id');

    const request = http.expectOne('/api/analytics');
    expect(request.request.body).toEqual({ name: 'ticket_seller_click', eventId: 'approved-event-id', ref: undefined });
    expect(window.localStorage.getItem('tusa-funnel-events')).toBeNull();
    request.flush(null);
  });

  it('falls back to the regular API request if the browser cannot queue a beacon', () => {
    const sendBeacon = vi.fn().mockReturnValue(false);
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: sendBeacon });
    service.track('community_open', undefined, 'rollmove-astana', 'beacon');

    const request = http.expectOne('/api/analytics');
    expect(sendBeacon).toHaveBeenCalledOnce();
    expect(request.request.body).toEqual({ name: 'community_open', eventId: undefined, ref: 'rollmove-astana' });
    request.flush(null);
  });
});
