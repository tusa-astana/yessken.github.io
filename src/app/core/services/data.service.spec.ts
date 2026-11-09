import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import type { EventItem } from '../types/event.model';
import { environment } from '../../../environments/environment';
import { DataService } from './data.service';
import { EventsApiService } from './events-api.service';
import { MockDataService } from './mock-data.service';

describe('DataService production event source', () => {
  const sampleEvent: EventItem = {
    id: 'mock-event',
    title: 'Mock event',
    description: 'Sample only',
    date: '2099-01-01',
    time: '19:00',
    place: 'Test venue',
    address: '',
    lat: 0,
    lng: 0,
    category: 'concert',
    price: null,
    imageUrl: '',
    organizerName: 'Sample',
    isDemo: true,
  };

  let api: {
    eventsError: ReturnType<typeof signal<boolean>>;
    eventSubmissionRateLimited: ReturnType<typeof signal<boolean>>;
    getEvents: ReturnType<typeof vi.fn>;
    getEventById: ReturnType<typeof vi.fn>;
  };
  let mock: { getEvents: ReturnType<typeof vi.fn>; getEventById: ReturnType<typeof vi.fn> };
  let service: DataService;
  let originalUrl: string;
  let originalProduction: boolean;

  beforeEach(() => {
    originalUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    originalProduction = environment.production;
    environment.production = true;
    window.history.replaceState({}, '', '/?api=1');
    api = {
      eventsError: signal(false),
      eventSubmissionRateLimited: signal(false),
      getEvents: vi.fn(() => of([])),
      getEventById: vi.fn(() => of(null)),
    };
    mock = {
      getEvents: vi.fn(() => [sampleEvent]),
      getEventById: vi.fn(() => sampleEvent),
    };
    TestBed.configureTestingModule({
      providers: [
        DataService,
        { provide: EventsApiService, useValue: api },
        { provide: MockDataService, useValue: mock },
      ],
    });
    service = TestBed.inject(DataService);
  });

  afterEach(() => {
    environment.production = originalProduction;
    window.history.replaceState({}, '', originalUrl || '/');
    TestBed.resetTestingModule();
  });

  it('does not replace an empty production API event list with fictional demo events', async () => {
    await expect(firstValueFrom(service.getEvents())).resolves.toEqual([]);
    expect(mock.getEvents).not.toHaveBeenCalled();
  });

  it('does not replace an API error with fictional events marked as advertising', async () => {
    api.eventsError.set(true);
    await expect(firstValueFrom(service.getEvents())).resolves.toEqual([]);
    expect(mock.getEvents).not.toHaveBeenCalled();
  });

  it('does not resolve a missing production API event from local demo data', async () => {
    await expect(firstValueFrom(service.getEventById('mock-event'))).resolves.toBeNull();
    expect(mock.getEventById).not.toHaveBeenCalled();
  });

  it('preserves the paid-ad status supplied by the production API', async () => {
    const paidEvent = { ...sampleEvent, id: 'api-paid-event', featured: true, isDemo: false };
    api.getEvents.mockReturnValue(of([paidEvent]));

    await expect(firstValueFrom(service.getEvents())).resolves.toEqual([paidEvent]);
    expect(mock.getEvents).not.toHaveBeenCalled();
  });

  it('retains the explicit mock query mode for local preview', async () => {
    window.history.replaceState({}, '', '/?mock=1');
    await expect(firstValueFrom(service.getEvents())).resolves.toEqual([sampleEvent]);
    expect(mock.getEvents).toHaveBeenCalledTimes(1);
  });
});
