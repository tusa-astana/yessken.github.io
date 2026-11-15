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
  {
    id: 'rollmove-tg',
    name: 'Клуб настольных игр RollMove (Telegram)',
    url: 'https://t.me/RollMove',
    type: 'rss',
    category: 'развлечения',
    hobbyId: 'board-games',
    place: 'г. Астана',
    price: null,
    organizerName: 'RollMove Astana',
    maxAgeDays: 14,
    enabled: false,
  },
  {
    id: 'astana-marathon',
    name: 'Астана Маратон (бег)',
    url: 'https://almaty-marathon.kz/en/events/city__run_2026/',
    type: 'rss',
    category: 'соревнование',
    hobbyId: 'running',
    place: 'Астана Square',
    price: null,
    organizerName: 'Астана Маратон',
    maxAgeDays: 60,
    enabled: false,
  },
  {
    id: 'astana-music-fest',
    name: 'Astana Music Fest (примерный RSS)',
    url: 'https://example.com/astana-music/feed',
    type: 'rss',
    category: 'концерт',
    hobbyId: 'live-music',
    place: 'Центр искусств',
    price: null,
    organizerName: 'Astana Music Org',
    maxAgeDays: 30,
    enabled: false,
  },
  {
    id: 'qazaq-barinjary',
    name: 'Қазақ барінжары (Классические концерты)',
    url: 'https://example.kz/classical-concerts/rss',
    type: 'rss',
    category: 'концерт',
    hobbyId: 'classical',
    place: 'Центр имени Мухтара Аубакирова',
    price: null,
    organizerName: 'Национальная филармония Астаны',
    maxAgeDays: 60,
    enabled: false,
  },
  {
    id: 'astana-art',
    name: 'Астана Арт-пространства (выставки)',
    url: 'https://example.kz/astana-art/feed',
    type: 'rss',
    category: 'выставка',
    hobbyId: 'art',
    place: 'Арт-пространства Астаны',
    price: null,
    organizerName: 'Арт-а residencia Астана',
    maxAgeDays: 45,
    enabled: false,
  },
];

/** Источники, которые сейчас включены в автоматический импорт. */
export const ENABLED_RSS_SOURCES = RSS_SOURCES.filter((s) => s.enabled);