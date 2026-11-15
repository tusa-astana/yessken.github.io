import { Injectable } from '@angular/core';
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
 */
@Injectable({ providedIn: 'root' })
export class ImportSchedulerService {
  private running = false;
  private timerId: any = null;
  private importedSourceUrls = new Set<string>();

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

  private async runOnce(): Promise<ImportResult[]> {
    const results: ImportResult[] = [];

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

      return !!created;
    } catch {
      return false;
    }
  }

  private todayISO(): string {
    return new Date().toISOString().slice(0, 10);
  }
}