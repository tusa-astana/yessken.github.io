import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RssParserService } from './rss-parser.service';
import { DataService } from './data.service';
import { ENABLED_RSS_SOURCES, RssSourceConfig } from '../config/rss-sources.config';
import type { ParsedFeedItem } from './rss-parser.service';

const IMPORT_INTERVAL_MS = 10 * 60 * 1000; // каждые 10 минут

/** Результат импорта одного источника. */
export interface ImportResult {
  sourceId: string;
  sourceName: string;
  fetched: number;
  imported: number;
  skipped: number;
  error?: string;
}

/**
 * Фоновый планировщик импорта событий из RSS / JSON источников.
 *
 * Работает сам по себе: после инициализации периодически опрашивает все
 * включённые источники, парсит новые публикации и создаёт из них события
 * в каталоге через DataService (статус pending, требует модерации).
 *
 * Чтобы избежать дублей, события с одинаковым sourceUrl не импортируются повторно.
 * После успешного импорта отправляется анонс в Telegram (как при ручном создании).
 */
@Injectable({ providedIn: 'root' })
export class ImportSchedulerService {
  private running = false;
  private timerId: any = null;
  private importedSourceUrls = new Set<string>();

  readonly lastResults = signal<ImportResult[]>([]);
  readonly lastRunAt = signal<string | null>(null);
  readonly isImporting = signal(false);

  constructor(
    private parser: RssParserService,
    private data: DataService,
  ) {}

  /** Запуск автоматического импорта (однократный при первом вызове). */
  start(): void {
    if (this.running) return;
    this.running = true;

    // Первый запуск сразу
    this.runOnce().then(() => {
      // Последующие запуски по расписанию
      this.timerId = setInterval(() => {
        void this.runOnce();
      }, IMPORT_INTERVAL_MS);
    });
  }

  /** Остановка планировщика. */
  stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.running = false;
  }

  /** Ручной запуск импорта всех источников прямо сейчас. */
  async runNow(): Promise<ImportResult[]> {
    return this.runOnce();
  }

  /** Получить результаты последнего запуска импорта. */
  getLastResults(): ImportResult[] {
    return this.lastResults();
  }

  private async runOnce(): Promise<ImportResult[]> {
    this.isImporting.set(true);
    const results: ImportResult[] = [];

    try {
      for (const source of ENABLED_RSS_SOURCES) {
        let fetched = 0;
        let imported = 0;
        let skipped = 0;
        let error: string | undefined;

        try {
          const items = await this.parser.fetchSource(source);
          fetched = items.length;

          for (const item of items) {
            if (!item.sourceUrl || this.importedSourceUrls.has(item.sourceUrl)) {
              skipped++;
              continue;
            }

            const created = await this.createImportedEvent(item, source);
            if (created) {
              this.importedSourceUrls.add(item.sourceUrl);
              imported++;
            } else {
              skipped++;
            }
          }
        } catch (err) {
          error = (err as Error)?.message ?? String(err);
        }

        results.push({
          sourceId: source.id,
          sourceName: source.name,
          fetched,
          imported,
          skipped,
          error,
        });
      }
    } finally {
      this.lastResults.set(results);
      this.lastRunAt.set(new Date().toISOString());
      this.isImporting.set(false);
    }

    console.log('[ImportScheduler] import cycle complete', results);
    return results;
  }

  private async createImportedEvent(item: ParsedFeedItem, source: RssSourceConfig): Promise<boolean> {
    if (!item.date || item.date < this.todayISO()) return false;

    try {
      const created = await firstValueFrom(this.data.createEvent({
        title: item.title,
        description: item.description || `Событие из источника «${source.name}».`,
        date: item.date,
        time: item.time ?? '10:00',
        place: item.place ?? source.place ?? 'г. Астана',
        address: item.address ?? source.address ?? '',
        lat: source.lat ?? 51.1605,
        lng: source.lng ?? 71.4704,
        category: item.category || source.category,
        price: item.price ?? source.price ?? 0,
        imageUrl: item.imageUrl ?? '',
        isPublicEvent: true,
        telegramSourceUrl: item.sourceUrl,
        ticketUrl: '',
        ticketSellerName: '',
        organizerName: item.organizerName || source.organizerName,
        organizerEmail: '',
        organizerPhone: '',
      }));

      if (!created) return false;

      // Анонсируем событие в Telegram, как при ручном создании через create-event
      await firstValueFrom(this.data.sendEventAnnouncement({
        id: created.id,
        title: created.title,
        description: created.description ?? '',
        date: created.date,
        time: created.time,
        place: created.place,
        address: created.address,
        lat: created.lat,
        lng: created.lng,
        category: created.category,
        price: created.price,
        imageUrl: created.imageUrl ?? '',
        isPublicEvent: created.isPublicEvent,
        telegramSourceUrl: created.telegramSourceUrl,
        ticketUrl: created.ticketUrl,
        ticketSellerName: created.ticketSellerName,
        organizerName: created.organizerName,
        organizerEmail: created.organizerEmail,
        organizerPhone: created.organizerPhone,
        link: `t.me/tusa_astana?event=${encodeURIComponent(created.id)}`,
      }));

      return true;
    } catch {
      return false;
    }
  }

  private todayISO(): string {
    return new Date().toISOString().slice(0, 10);
  }
}