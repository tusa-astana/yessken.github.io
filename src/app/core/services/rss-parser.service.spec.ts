import { RssParserService } from './rss-parser.service';
import type { RssSourceConfig } from '../config/rss-sources.config';

const source: RssSourceConfig = {
  id: 'test-source',
  name: 'Test',
  url: 'https://example.test/feed',
  type: 'rss',
  category: 'концерт',
  hobbyId: 'live-music',
  place: 'Тестовая площадка',
  address: 'г. Астана',
  price: 0,
  organizerName: 'Тест Организатор',
  maxAgeDays: 30,
  enabled: true,
};

describe('RssParserService', () => {
  let parser: RssParserService;

  beforeEach(() => {
    parser = new RssParserService();
  });

  describe('parseRss', () => {
    it('parses valid RSS XML into feed items', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Концерт в Астане</title>
            <description>Живая музыка и танцы.</description>
            <link>https://example.test/event/1</link>
            <pubDate>Mon, 06 Nov 2026 09:00:10 GMT</pubDate>
          </item>
          <item>
            <title>Выставка картин</title>
            <description>Современное искусство.</description>
            <link>https://example.test/event/2</link>
            <pubDate>2026-11-10T12:00:00Z</pubDate>
          </item>
        </channel>
      </rss>`;

      const items = parser.parseRss(xml, source);
      expect(items).toHaveLength(2);
      expect(items[0].title).toBe('Концерт в Астане');
      expect(items[0].description).toBe('Живая музыка и танцы.');
      expect(items[0].sourceUrl).toBe('https://example.test/event/1');
      expect(items[0].date).toBe('2026-11-06');
      expect(items[0].category).toBe('концерт');
      expect(items[0].hobbyId).toBe('live-music');
      expect(items[0].organizerName).toBe('Тест Организатор');
      expect(items[0].place).toBe('Тестовая площадка');
      expect(items[1].title).toBe('Выставка картин');
      expect(items[1].date).toBe('2026-11-10');
    });

    it('returns empty array for invalid XML', () => {
      const xml = '<rss><unclosed>';
      const items = parser.parseRss(xml, source);
      expect(items).toEqual([]);
    });

    it('skips items older than maxAgeDays', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40);
      const oldDateStr = oldDate.toISOString();

      const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Старый концерт</title>
            <description></description>
            <link>https://example.test/old</link>
            <pubDate>${oldDateStr}</pubDate>
          </item>
          <item>
            <title>Будущий концерт</title>
            <description></description>
            <link>https://example.test/future</link>
            <pubDate>2026-12-01T00:00:00Z</pubDate>
          </item>
        </channel>
      </rss>`;

      const items = parser.parseRss(xml, source);
      expect(items).toHaveLength(1);
      expect(items[0].title).toBe('Будущий концерт');
    });

    it('uses source.url as fallback when link is missing', () => {
      const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Без ссылки</title>
            <description></description>
            <pubDate>2026-11-06T00:00:00Z</pubDate>
          </item>
        </channel>
      </rss>`;

      const items = parser.parseRss(xml, source);
      expect(items[0].sourceUrl).toBe('https://example.test/feed');
    });
  });

  describe('parseJson', () => {
    it('parses JSON array of events', () => {
      const json = JSON.stringify([
        {
          title: 'Опера Навоой',
          description: 'Лирическая опера.',
          event_date: '2026-11-15',
          time: '18:00',
          place: 'Театр оперы',
          address: 'площадь Абая',
          price: 5000,
          image_url: 'https://example.test/poster.jpg',
          category: 'театр',
          hobby_id: 'opera-ballet',
          organizer_name: 'Астана Опера',
          source_url: 'https://example.test/opera/1',
        },
      ]);

      const items = parser.parseJson(json, source);
      expect(items).toHaveLength(1);
      expect(items[0].title).toBe('Опера Навоой');
      expect(items[0].date).toBe('2026-11-15');
      expect(items[0].time).toBe('18:00');
      expect(items[0].place).toBe('Театр оперы');
      expect(items[0].price).toBe(5000);
      expect(items[0].imageUrl).toBe('https://example.test/poster.jpg');
    });

    it('parses JSON with data wrapper', () => {
      const json = JSON.stringify({
        data: [{ title: 'Обёрнутое событие', date: '2026-11-20' }],
      });

      const items = parser.parseJson(json, source);
      expect(items).toHaveLength(1);
      expect(items[0].title).toBe('Обёрнутое событие');
    });

    it('returns empty array for invalid JSON', () => {
      const items = parser.parseJson('{invalid json', source);
      expect(items).toEqual([]);
    });

    it('skips items without title', () => {
      const json = JSON.stringify([
        { description: 'Без названия', date: '2026-11-20' },
        { title: 'С названием', date: '2026-11-21' },
      ]);

      const items = parser.parseJson(json, source);
      expect(items).toHaveLength(1);
      expect(items[0].title).toBe('С названием');
    });
  });

  describe('normalizeDate', () => {
    it('parses ISO date', () => {
      expect(parser['normalizeDate']('2026-11-15T18:00:00Z')).toBe('2026-11-15');
      expect(parser['normalizeDate']('2026-11-15')).toBe('2026-11-15');
    });

    it('parses RFC 2822 date', () => {
      expect(parser['normalizeDate']('Mon, 06 Nov 2026 09:00:10 GMT')).toBe('2026-11-06');
    });

    it('returns null for unparseable date', () => {
      expect(parser['normalizeDate']('not-a-date')).toBeNull();
      expect(parser['normalizeDate']('')).toBeNull();
    });
  });

  describe('isTooOld', () => {
    it('returns false for recent dates', () => {
      const today = new Date().toISOString().slice(0, 10);
      expect(parser['isTooOld'](today, 30)).toBe(false);
    });

    it('returns true for dates older than maxAgeDays', () => {
      const d = new Date();
      d.setDate(d.getDate() - 40);
      expect(parser['isTooOld'](d.toISOString().slice(0, 10), 30)).toBe(true);
    });
  });
});