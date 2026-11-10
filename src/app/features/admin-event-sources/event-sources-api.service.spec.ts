import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TelegramService } from '../../core/services/telegram.service';
import { environment } from '../../../environments/environment';
import { EventSourcesApiService } from './event-sources-api.service';

const apiBase = environment.apiUrl?.replace(/\/$/, '') ?? '';

describe('EventSourcesApiService', () => {
  let http: HttpTestingController;
  let service: EventSourcesApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventSourcesApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TelegramService, useValue: { initData: 'verified-admin-init-data' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(EventSourcesApiService);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('loads RSS candidates only through the protected admin endpoint', async () => {
    const loading = service.loadPending();
    const request = http.expectOne(`${apiBase}/api/admin/event-sources/pending`);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-admin-init-data');
    const candidate = {
      id: 'candidate-1', sourceId: 'kazequestrian-rss', sourceName: 'Federation', externalId: 'entry-1',
      sourceUrl: 'https://kazequestrian.kz/en/archives/1203', title: 'Cup in Astana', summary: 'Schedule',
      hobbyId: 'equestrian', eventDate: '2026-11-18', publishedAtUtc: '2026-11-06T09:00:10Z', importedAtUtc: '2026-11-10T00:00:00Z',
      status: 'pending', eventId: null,
    };
    request.flush([candidate]);
    await expect(loading).resolves.toEqual([candidate]);
  });

  it('retries the protected RSS queue when Render is waking up', async () => {
    vi.useFakeTimers();
    const row = {
      id: 'candidate-1', sourceId: 'kazequestrian-rss', sourceName: 'Federation',
      externalId: 'entry-1', sourceUrl: 'https://kazequestrian.kz/en/archives/1203', title: 'Cup in Astana',
      summary: 'Schedule', hobbyId: 'equestrian', publishedAtUtc: '2026-11-06T09:00:10Z',
      importedAtUtc: '2026-11-10T00:00:00Z', status: 'pending' as const, eventId: null,
    };
    const loading = service.loadPending();
    http.expectOne(`${apiBase}/api/admin/event-sources/pending`).flush([], { status: 503, statusText: 'Service Unavailable' });

    await vi.advanceTimersByTimeAsync(2_000);
    const retry = http.expectOne(`${apiBase}/api/admin/event-sources/pending`);
    expect(retry.request.headers.get('X-Telegram-Init-Data')).toBe('verified-admin-init-data');
    retry.flush([row]);

    await expect(loading).resolves.toEqual([row]);
  });

  it('converts an explicitly reviewed source candidate into a pending event submission', async () => {
    const converting = service.convert('candidate-1', {
      title: 'Astana equestrian cup', date: '2026-11-18', time: '10:00', place: 'Argymak',
      category: 'соревнование', hobbyId: 'equestrian', description: 'Editor-written summary', sourcePermissionConfirmed: true,
    });
    const request = http.expectOne(`${apiBase}/api/admin/event-sources/candidate-1/convert`);
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-admin-init-data');
    expect(request.request.body).toMatchObject({ date: '2026-11-18', hobbyId: 'equestrian', sourcePermissionConfirmed: true });
    request.flush({ id: 'pending-event-1', status: 'pending' }, { status: 201, statusText: 'Created' });
    await expect(converting).resolves.toBe('pending-event-1');
  });
});
