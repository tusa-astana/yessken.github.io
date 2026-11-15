export interface RssSourceConfig {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'json';
  category: string;
  hobbyId: string;
  place?: string;
  address?: string;
  lat?: number;
  lng?: number;
  enabled: boolean;
  /** Price hint when source doesn't provide it (0 = free) */
  price: number | null;
  /** Organizer name used when source doesn't provide it */
  organizerName: string;
  /** Max age of items to import (days). Older items are skipped. */
  maxAgeDays: number;
}

/**
 * Публичные RSS / JSON источники событий Астаны для фонового импорта.
 * Каждый источник проверяется вручную перед добавлением в.enabled = true.
 * Источники с type 'json' ожидают массив объектов с полями title, description, date, time, place, address, imageUrl.
 */
export const RSS_SOURCES: RssSourceConfig[] = [
  {
    id: 'kazequestrian-rss',
    name: 'Федерация конного спорта Казахстана (RSS)',
    url: 'https://kazequestrian.kz/en/feed',
    type: 'rss',
    category: 'соревнование',
    hobbyId: 'equestrian',
    place: 'Конноспортивный комплекс',
    address: 'г. Астана',
    price: null,
    organizerName: 'Федерация конного спорта Казахстана',
    maxAgeDays: 30,
    enabled: true,
  },
  {
    id: 'astana-vm-rss',
    name: 'Astana Venue Management (RSS)',
    url: 'https://a-vm.kz/events/feed/',
    type: 'rss',
    category: 'концерт',
    hobbyId: 'live-music',
    place: 'Астана-Веню-Менеджмент',
    address: 'г. Астана',
    price: null,
    organizerName: 'Astana Venue Management',
    maxAgeDays: 30,
    enabled: true,
  },
  {
    id: 'astana-opera-json',
    name: 'Астана Опера (JSON API)',
    url: 'https://astanaopera.kz/api/posters?page=1&lang=ru&limit=12',
    type: 'json',
    category: 'театр',
    hobbyId: 'opera-ballet',
    place: 'Театр оперы и балета им. Абая',
    address: 'г. Астана',
    price: null,
    organizerName: 'Государственный академический театр оперы и балета им. Абая',
    maxAgeDays: 60,
    enabled: true,
  },
  {
    id: 'astana-opera-json-page2',
    name: 'Астана Опера (JSON API, стр. 2)',
    url: 'https://astanaopera.kz/api/posters?page=2&lang=ru&limit=12',
    type: 'json',
    category: 'театр',
    hobbyId: 'opera-ballet',
    place: 'Театр оперы и балета им. Абая',
    address: 'г. Астана',
    price: null,
    organizerName: 'Государственный академический театр оперы и балета им. Абая',
    maxAgeDays: 60,
    enabled: true,
  },
];

/** Источники, которые сейчас включены в автоматический импорт. */
export const ENABLED_RSS_SOURCES = RSS_SOURCES.filter((s) => s.enabled);