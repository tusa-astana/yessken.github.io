import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { TelegramService } from './telegram.service';
import { EventsApiService } from './events-api.service';

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

  it('loads admin funnel totals with verified initData', async () => {
    const result = firstValueFrom(service.getAdminFunnelSummary());
    const request = http.expectOne('/api/analytics/summary');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-telegram-init-data');
    request.flush([{ name: 'community_open', count: 4 }]);
    await expect(result).resolves.toEqual([{ name: 'community_open', count: 4 }]);
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
