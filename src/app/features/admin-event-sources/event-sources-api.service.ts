import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, retry, throwError, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TelegramService } from '../../core/services/telegram.service';

export interface EventSourceCandidate {
  id: string;
  sourceId: string;
  sourceName: string;
  externalId: string;
  sourceUrl: string;
  title: string;
  summary: string;
  hobbyId: string;
  eventDate: string | null;
  publishedAtUtc: string | null;
  importedAtUtc: string;
  status: 'pending' | 'converted' | 'ignored';
  eventId: string | null;
}

export interface ConvertEventSourceCandidateRequest {
  title: string;
  date: string;
  time: string;
  place: string;
  category: string;
  hobbyId: string;
  description: string;
  sourcePermissionConfirmed: boolean;
}

export interface ConvertEventSourceBatchItemRequest {
  candidateId: string;
  title: string;
  date: string;
  time: string;
  place: string;
  category: string;
  description: string;
}

export interface ConvertEventSourceBatchRequest {
  sourcePermissionConfirmed: boolean;
  items: ConvertEventSourceBatchItemRequest[];
}

export interface ConvertedEventSourceBatchItem {
  candidateId: string;
  eventId: string;
  status: 'pending';
}

@Injectable({ providedIn: 'root' })
export class EventSourcesApiService {
  private readonly http = inject(HttpClient);
  private readonly telegram = inject(TelegramService);
  private readonly base = environment.apiUrl?.replace(/\/$/, '') ?? '';

  async loadPending(): Promise<EventSourceCandidate[] | null> {
    try {
      return await firstValueFrom(this.http.get<EventSourceCandidate[]>(`${this.base}/api/admin/event-sources/pending`, { headers: this.headers() }).pipe(
        retry({ count: 5, delay: (error, retryCount) => this.retryWhileServiceWakes(error, retryCount) }),
      ));
    } catch {
      return null;
    }
  }

  async dismiss(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post<void>(`${this.base}/api/admin/event-sources/${encodeURIComponent(id)}/dismiss`, {}, { headers: this.headers() }));
      return true;
    } catch {
      return false;
    }
  }

  async convert(id: string, request: ConvertEventSourceCandidateRequest): Promise<string | null> {
    try {
      const response = await firstValueFrom(this.http.post<{ id: string }>(
        `${this.base}/api/admin/event-sources/${encodeURIComponent(id)}/convert`, request, { headers: this.headers() },
      ));
      return response.id;
    } catch {
      return null;
    }
  }

  async convertBatch(request: ConvertEventSourceBatchRequest): Promise<ConvertedEventSourceBatchItem[] | null> {
    if (!request.items.length) return null;
    try {
      return await firstValueFrom(this.http.post<ConvertedEventSourceBatchItem[]>(
        `${this.base}/api/admin/event-sources/convert-batch`, request, { headers: this.headers() },
      ));
    } catch {
      return null;
    }
  }

  private headers(): HttpHeaders {
    const initData = this.telegram.initData;
    return initData ? new HttpHeaders({ 'X-Telegram-Init-Data': initData }) : new HttpHeaders();
  }

  private retryWhileServiceWakes(error: unknown, retryCount: number) {
    if (!(error instanceof HttpErrorResponse) || ![0, 502, 503, 504].includes(error.status)) {
      return throwError(() => error);
    }
    return timer(Math.min(retryCount * 2_000, 10_000));
  }
}
