import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TelegramService } from '../../core/services/telegram.service';
import { environment } from '../../../environments/environment';
import { InterestsApiService } from './interests-api.service';

const apiBase = environment.apiUrl?.replace(/\/$/, '') ?? '';

describe('InterestsApiService', () => {
  let http: HttpTestingController;
  let service: InterestsApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InterestsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TelegramService, useValue: { initData: 'verified-init-data' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(InterestsApiService);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('loads the curated interest groups from the API', async () => {
    const loading = service.load();
    const request = http.expectOne(`${apiBase}/api/interests`);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-init-data');
    request.flush([{ id: 'board-games', name: 'Настольные игры', description: 'Игры', emoji: '♟', memberCount: 2, isMember: true, notifyNewGatherings: false, gatherings: [] }]);
    await expect(loading).resolves.toEqual([{ id: 'board-games', name: 'Настольные игры', description: 'Игры', emoji: '♟', memberCount: 2, isMember: true, notifyNewGatherings: false, gatherings: [] }]);
  });

  it('loads the upcoming public plan feed without private identity headers', async () => {
    const loading = service.loadUpcomingGatherings();
    const request = http.expectOne(`${apiBase}/api/interests/gatherings/upcoming`);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.has('X-Telegram-Init-Data')).toBe(false);
    const item = {
      id: 'public-gathering-1',
      interestId: 'board-games', interestName: 'Настольные игры', interestEmoji: '♟',
      title: 'Партия для новичков', date: '2026-11-08', time: '18:30', place: 'Кофейня в центре',
      details: '', goingCount: 1,
    };
    request.flush([item]);
    await expect(loading).resolves.toEqual([item]);
  });

  it('loads public upcoming gathering previews without Telegram identity or attendee records', async () => {
    const loading = service.loadUpcomingGatherings();
    const request = http.expectOne(`${apiBase}/api/interests/gatherings/upcoming`);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.has('X-Telegram-Init-Data')).toBe(false);
    const preview = {
      interestId: 'board-games', interestName: 'Настольные игры', interestEmoji: '♟',
      title: 'Партия в настолки', date: '2026-11-08', time: '18:30', place: 'Кофейня в центре',
      details: 'Игры для новичков', goingCount: 2,
    };
    request.flush([preview]);
    await expect(loading).resolves.toEqual([preview]);
  });

  it('joins a group with its privacy choices', async () => {
    const joining = service.join('board-games', true, false);
    const request = http.expectOne(`${apiBase}/api/interests/board-games/membership`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ isAnonymous: true, openToMeet: false });
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-init-data');
    request.flush(null);
    await expect(joining).resolves.toBe(true);
  });

  it('sends a behavior-based report for a member in the same interest group', async () => {
    const reporting = service.report('running', 12345, 'harassment', 'Repeated unwanted messages.');
    const request = http.expectOne(`${apiBase}/api/interests/running/reports`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ targetTelegramUserId: 12345, reason: 'harassment', details: 'Repeated unwanted messages.' });
    request.flush(null, { status: 202, statusText: 'Accepted' });
    await expect(reporting).resolves.toBe(true);
  });

  it('creates a scheduled meetup at a public place for a group member', async () => {
    const creation = service.createGathering('board-games', {
      title: 'Партия в настолки',
      date: '2026-11-08',
      time: '18:30',
      place: 'Кофейня в центре',
      details: 'Возьмём лёгкие игры для новичков.',
      isOpen: true,
    });
    const request = http.expectOne(`${apiBase}/api/interests/board-games/gatherings`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      title: 'Партия в настолки',
      date: '2026-11-08',
      time: '18:30',
      place: 'Кофейня в центре',
      details: 'Возьмём лёгкие игры для новичков.',
      isOpen: true,
    });
    request.flush({ id: 'gathering-1' }, { status: 201, statusText: 'Created' });
    await expect(creation).resolves.toBe(true);
  });

  it('creates a closed gathering without implicitly marking it open', async () => {
    const creation = service.createGathering('board-games', {
      title: 'Закрытая партия',
      date: '2026-11-08',
      time: '18:30',
      place: 'Кофейня в центре',
      details: '',
      isOpen: false,
    });
    const request = http.expectOne(`${apiBase}/api/interests/board-games/gatherings`);
    expect(request.request.body.isOpen).toBe(false);
    request.flush({ id: 'gathering-closed' }, { status: 201, statusText: 'Created' });
    await expect(creation).resolves.toBe(true);
  });

  it('saves Telegram gathering notification preference with the Telegram identity header', async () => {
    const saving = service.setGatheringNotifications('board-games', true);
    const request = http.expectOne(`${apiBase}/api/interests/board-games/notifications`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-init-data');
    expect(request.request.body).toEqual({ enabled: true });
    request.flush(null);
    await expect(saving).resolves.toBe(true);
  });

  it('marks a gathering notification read using the authenticated member endpoint', async () => {
    const saving = service.markGatheringNotificationRead('board-games', '0123456789abcdef0123456789abcdef');
    const request = http.expectOne(`${apiBase}/api/interests/board-games/gatherings/0123456789abcdef0123456789abcdef/notification/read`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-init-data');
    request.flush(null);
    await expect(saving).resolves.toBe(true);
  });

  it('RSVPs to a scheduled meetup with the Telegram identity header', async () => {
    const joining = service.joinGathering('board-games', 'gathering-1');
    const request = http.expectOne(`${apiBase}/api/interests/board-games/gatherings/gathering-1/attendance`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe('verified-init-data');
    request.flush(null);
    await expect(joining).resolves.toBe(true);
  });
});
