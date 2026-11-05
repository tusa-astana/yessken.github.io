import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
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
    service.track('community_open', undefined, 'rollmove-astana');

    const request = http.expectOne('/api/analytics');
    expect(request.request.body.name).toBe('community_open');
    expect(request.request.body.eventId).toBeUndefined();
    expect(request.request.body.ref).toBe('rollmove-astana');
    expect(service.getSummary().community_open).toBe(1);
    request.flush(null);
  });
});
