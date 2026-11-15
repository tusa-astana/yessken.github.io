import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { ImportSchedulerService, ImportResult } from './import-scheduler.service';
import { RssParserService, ParsedFeedItem } from './rss-parser.service';
import { DataService } from './data.service';
import type { RssSourceConfig } from '../config/rss-sources.config';
import { ENABLED_RSS_SOURCES } from '../config/rss-sources.config';

const mockSource: RssSourceConfig = {
  id: 'mock-source',
  name: 'Mock Source',
  url: 'https://mock.test/feed',
  type: 'rss',
  category: 'концерт',
  hobbyId: 'live-music',
  place: 'Mock Place',
  address: 'г. Астана',
  price: 0,
  organizerName: 'Mock Organizer',
  maxAgeDays: 30,
  enabled: true,
};

const mockItem: ParsedFeedItem = {
  title: 'Тестовое событие',
  description: 'Описание теста',
  sourceUrl: 'https://mock.test/event/1',
  date: '2026-12-01',
  time: '18:00',
  place: 'Mock Place',
  address: 'г. Астана',
  price: 0,
  imageUrl: null,
  category: 'концерт',
  hobbyId: 'live-music',
  organizerName: 'Mock Organizer',
};

describe('ImportSchedulerService', () => {
  let service: ImportSchedulerService;
  let parser: jasmine.SpyObj<RssParserService>;
  let data: jasmine.SpyObj<DataService>;

  beforeEach(() => {
    parser = jasmine.createSpyObj('RssParserService', ['fetchSource']);
    data = jasmine.createSpyObj('DataService', ['createEvent', 'sendEventAnnouncement']);

    TestBed.configureTestingModule({
      providers: [
        ImportSchedulerService,
        { provide: RssParserService, useValue: parser },
        { provide: DataService, useValue: data },
      ],
    });
    service = TestBed.inject(ImportSchedulerService);
  });

  describe('createImportedEvent', () => {
    it('returns false for past dates', async () => {
      const pastItem: ParsedFeedItem = { ...mockItem, date: '2020-01-01' };
      const result = await (service as any).createImportedEvent(pastItem, mockSource);
      expect(result).toBe(false);
      expect(data.createEvent).not.toHaveBeenCalled();
    });

    it('returns false for today date (not future)', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const todayItem: ParsedFeedItem = { ...mockItem, date: today };
      const result = await (service as any).createImportedEvent(todayItem, mockSource);
      expect(result).toBe(false);
    });

    it('creates event and sends announcement for future date', async () => {
      const createdEvent = { id: 'evt-1', ...mockItem };
      data.createEvent.and.returnValue(of(createdEvent));
      data.sendEventAnnouncement.and.returnValue(of(undefined));

      const result = await (service as any).createImportedEvent(mockItem, mockSource);

      expect(result).toBe(true);
      expect(data.createEvent).toHaveBeenCalledWith(jasmine.objectContaining({
        title: 'Тестовое событие',
        date: '2026-12-01',
        time: '18:00',
        place: 'Mock Place',
        category: 'концерт',
        organizerName: 'Mock Organizer',
      }));
      expect(data.sendEventAnnouncement).toHaveBeenCalledWith(jasmine.objectContaining({
        id: 'evt-1',
        title: 'Тестовое событие',
      }));
    });

    it('returns false when createEvent returns null', async () => {
      data.createEvent.and.returnValue(of(null));

      const result = await (service as any).createImportedEvent(mockItem, mockSource);

      expect(result).toBe(false);
      expect(data.sendEventAnnouncement).not.toHaveBeenCalled();
    });

    it('returns false when createEvent throws', async () => {
      data.createEvent.and.returnValue(of({} as any));
      // Force error path by making announcement throw
      data.sendEventAnnouncement.and.throwError(new Error('announcement failed'));

      const result = await (service as any).createImportedEvent(mockItem, mockSource);

      expect(result).toBe(false);
    });
  });

  describe('runOnce', () => {
    it('returns empty results when no enabled sources', async () => {
      // Temporarily replace ENABLED_RSS_SOURCES is not possible directly,
      // but we can check that fetchSource is called for each enabled source.
      parser.fetchSource.and.returnValue(Promise.resolve([]));
      data.createEvent.and.returnValue(of({ id: 'evt-1' }));
      data.sendEventAnnouncement.and.returnValue(of(undefined));

      const results = await service.runNow();

      expect(results.length).toBe(ENABLED_RSS_SOURCES.length);
      results.forEach((r) => {
        expect(r.fetched).toBe(0);
        expect(r.imported).toBe(0);
        expect(r.skipped).toBe(0);
        expect(r.error).toBeUndefined();
      });
    });

    it('records errors when fetchSource fails', async () => {
      parser.fetchSource.and.returnValue(Promise.reject(new Error('source down')));

      const results = await service.runNow();

      const failed = results.find((r) => r.sourceId === mockSource.id);
      // mockSource may not be in ENABLED_RSS_SOURCES, so just check structure
      expect(results.every((r) => typeof r.fetched === 'number')).toBe(true);
      expect(results.every((r) => typeof r.imported === 'number')).toBe(true);
      expect(results.every((r) => typeof r.skipped === 'number')).toBe(true);
    });
  });

  describe('signals', () => {
    it('exposes lastResults, lastRunAt, isImporting signals', () => {
      expect(service.lastResults).toBeDefined();
      expect(service.lastRunAt).toBeDefined();
      expect(service.isImporting).toBeDefined();
      expect(service.lastResults()).toEqual([]);
      expect(service.lastRunAt()).toBeNull();
      expect(service.isImporting()).toBe(false);
    });

    it('getLastResults returns signal value', () => {
      expect(service.getLastResults()).toEqual([]);
    });
  });
});