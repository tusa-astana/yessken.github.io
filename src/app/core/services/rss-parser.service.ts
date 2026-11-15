import { Injectable } from '@angular/core';
import type { RssSourceConfig } from '../config/rss-sources.config';

export interface ParsedFeedItem {
  title: string;
  description: string;
  sourceUrl: string;
  date: string | null;
  time: string | null;
  place: string | null;
  address: string | null;
  price: number | null;
  imageUrl: string | null;
  category: string;
  hobbyId: string;
  organizerName: string;
}

@Injectable({ providedIn: 'root' })
export class RssParserService {
  private readonly proxyBase = '/api/import/proxy';

  /** Строит URL для прокси-запроса к внешнему источнику. */
  getProxyUrl(sourceUrl: string): string {
    // Если URL уже абсолютный (внешний) — оборачиваем в прокси
    try {
      new URL(sourceUrl);
      return `${this.proxyBase}?url=${encodeURIComponent(sourceUrl)}`;
    } catch {
      // Относительный URL — делаем запрос к текущему API
      return sourceUrl;
    }
  }

  parseRss(xmlText: string, source: RssSourceConfig): ParsedFeedItem[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.warn(`[RssParser] invalid XML for ${source.id}:`, parserError.textContent);
      return [];
    }

    const items = doc.querySelectorAll('item');
    const events: ParsedFeedItem[] = [];

    items.forEach((item) => {
      const title = this.getText(item, 'title')?.trim();
      const description = this.getText(item, 'description')?.trim();
      const link = this.getText(item, 'link')?.trim() || source.url;
      const pubDate = this.getText(item, 'pubDate')?.trim();

      if (!title) return;

      const parsedDate = pubDate ? this.normalizeDate(pubDate) : null;
      if (parsedDate && this.isTooOld(parsedDate, source.maxAgeDays)) return;

      // Extract time and place from description
      const extracted = this.extractTimeAndPlace(description ?? '');

      events.push({
        title,
        description: description ? description.slice(0, 800) : '',
        sourceUrl: link,
        date: parsedDate,
        time: extracted.time ?? null,
        place: (extracted.place ?? source.place) ?? null,
        address: (extracted.address ?? source.address) ?? null,
        price: source.price,
        imageUrl: null,
        category: source.category,
        hobbyId: source.hobbyId,
        organizerName: source.organizerName,
      });
    });

    return events;
  }

  /** Parse free-form description to extract time (HH:MM) and place/venue. */
  private extractTimeAndPlace(text: string): { time?: string; place?: string; address?: string } {
    const result = { time: null, place: null, address: null };
    if (!text) return result;

    const lower = text.toLowerCase();

    // --- Time extraction ---
    const timeMatch = text.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);
    if (timeMatch) {
      const hh = parseInt(timeMatch[1], 10);
      const mm = timeMatch[2];
      // Heuristic: the match should not be immediately preceded by 4 digits (year)
      const ctxStart = text.lastIndexOf(timeMatch[0], timeMatch.index - 1);
      const before = text.slice(ctxStart, timeMatch.index).trim();
      if (!/^\d{4}$/.test(before)) {
        result.time = `${timeMatch[1]}:${mm}`;
      }
    }

    // --- Place/Venue extraction ---
    const placePatterns = [
      /место[:—-]\s*([^\r\n.!?]{2,120})/i,
      /площадка[:—-]\s*([^\r\n.!?]{2,120})/i,
      /venue[:—-]\s*([^\r\n.!?]{2,120})/i,
      /location[:—-]\s*([^\r\n.!?]{2,120})/i,
      /в [:—-]\s*([^\r\n.!?]{2,120})(?:\.|,|\n|$)/i,
    ];
    for (const pat of placePatterns) {
      const m = text.match(pat);
      if (m && m[1].trim()) {
        result.place = m[1].trim();
        if (/^[А-Я][а-яё]+\s*$/.test(m[1].trim()) || /^[A-Z][a-z]+\s*$/.test(m[1].trim())) {
          result.address = m[1].trim();
        }
        break;
      }
    }

    // If no explicit place found, try to infer from common venue phrases
    if (!result.place) {
      const venueMatch = text.match(/в\s+([А-Яа-яё]+\s+[^\r\n.!?]{3,60})(?:\.|,|\n|$)/i);
      if (venueMatch) {
        result.place = venueMatch[1].trim();
      }
    }

    // Address inference
    if (result.place && !result.address) {
      result.address = result.place;
    }

    return result;
  }
    let data: unknown;
    try {
      data = JSON.parse(jsonText);
    } catch {
      console.warn(`[RssParser] invalid JSON for ${source.id}`);
      return [];
    }

    const items = Array.isArray(data) ? data : (data as any)?.data ?? (data as any)?.items ?? [];
    if (!Array.isArray(items)) return [];

    const events: ParsedFeedItem[] = [];
    items.forEach((raw: any) => {
      const title = raw?.title || raw?.name || raw?.event_name;
      if (!title) return;

      const rawDate = raw?.date || raw?.event_date || raw?.date_start || raw?.start_date;
      const parsedDate = rawDate ? this.normalizeDate(rawDate) : null;
      if (parsedDate && this.isTooOld(parsedDate, source.maxAgeDays)) return;

      const rawTime = raw?.time || raw?.event_time || raw?.time_start;
      const place = (raw?.place || raw?.venue) ?? source.place ?? null;
      const address = (raw?.address || source.address) ?? null;

      events.push({
        title: String(title).trim(),
        description: String(raw?.description || raw?.desc || raw?.summary || '').slice(0, 800),
        sourceUrl: raw?.source_url || raw?.link || raw?.url || source.url,
        date: parsedDate,
        time: rawTime ? String(rawTime).slice(0, 5) : null,
        place,
        address,
        price: raw?.price ?? source.price ?? null,
        imageUrl: raw?.image_url || raw?.image || raw?.poster || null,
        category: raw?.category || source.category,
        hobbyId: raw?.hobby_id || source.hobbyId,
        organizerName: raw?.organizer || raw?.organizer_name || source.organizerName,
      });
    });

    return events;
  }

  async fetchSource(source: RssSourceConfig): Promise<ParsedFeedItem[]> {
    if (!source.enabled) return [];

    const targetUrl = this.proxyUrl(source.url);

    try {
      const response = await fetch(targetUrl, { method: 'GET', mode: 'cors' });
      if (!response.ok) {
        console.warn(`[RssParser] ${source.id}: HTTP ${response.status}`);
        return [];
      }

      const contentType = response.headers.get('content-type') ?? '';
      const text = await response.text();

      if (contentType.includes('application/json') || contentType.includes('text/json')) {
        return this.parseJson(text, source);
      }
      return this.parseRss(text, source);
    } catch (error) {
      console.warn(`[RssParser] ${source.id} fetch failed:`, (error as Error)?.message ?? error);
      return [];
    }
  }

  async fetchAllSources(sources: readonly RssSourceConfig[]): Promise<ParsedFeedItem[]> {
    const all: ParsedFeedItem[] = [];
    for (const source of sources) {
      const items = await this.fetchSource(source);
      all.push(...items);
    }
    return all;
  }

  private proxyUrl(url: string): string {
    try {
      new URL(url);
      return `${this.proxyBase}?url=${encodeURIComponent(url)}`;
    } catch {
      return url;
    }
  }

  private getText(element: Element, tag: string): string | null {
    const node = element.querySelector(tag);
    return node ? node.textContent ?? null : null;
  }

  private normalizeDate(value: string): string | null {
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const d = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00`);
      if (!isNaN(d.getTime())) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }

    return null;
  }

  private isTooOld(dateStr: string, maxAgeDays: number): boolean {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > maxAgeDays;
  }
}