import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TelegramService } from '../../core/services/telegram.service';
import { environment } from '../../../environments/environment';
import { MeetupsApiService } from './meetups-api.service';

const apiBase = environment.apiUrl?.replace(/\/$/, '') ?? '';

describe('MeetupsApiService', () => {
  let http: HttpTestingController;
  let service: MeetupsApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MeetupsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TelegramService, useValue: { initData: 'verified-telegram-init-data' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(MeetupsApiService);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('loads real venue plans from the same-origin API without inventing fallback venues', async () => {
    const loading = service.load('2026-11-03');
    const request = http.expectOne((req) => req.url === `${apiBase}/api/meetups` && req.params.get('date') === '2026-11-03');
    expect(request.request.method).toBe('GET');
    request.flush({ date: '2026-11-03', sourceUpdatedAtUtc: '2026-11-03T00:00:00Z', dataSource: 'OpenStreetMap contributors', venues: [] });
    await loading;

    expect(service.plans()).toEqual([]);
    expect(service.error()).toBe(false);
    expect(service.sourceUpdatedAt()).toBe('2026-11-03T00:00:00Z');
  });

  it('sends attendance only with Telegram initData and reloads the shared venue list', async () => {
    const saving = service.saveSelection('node-123', {
      date: '2026-11-03',
      time: '21:15',
      anonymous: true,
      openToMeet: false,
    });
    const write = http.expectOne(`${apiBase}/api/meetups/node-123/attendance`);
    expect(write.request.method).toBe('PUT');
    expect(write.request.headers.get('X-Telegram-Init-Data')).toBe('verified-telegram-init-data');
    expect(write.request.body).toEqual({ date: '2026-11-03', arrivalTime: '21:15', isAnonymous: true, openToMeet: false });
    write.flush(null);
    await Promise.resolve();

    const reload = http.expectOne((req) => req.url === `${apiBase}/api/meetups` && req.params.get('date') === '2026-11-03');
    reload.flush({ date: '2026-11-03', sourceUpdatedAtUtc: '2026-11-03T00:00:00Z', dataSource: 'OpenStreetMap contributors', venues: [] });
    expect(await saving).toBe(true);
  });
});
