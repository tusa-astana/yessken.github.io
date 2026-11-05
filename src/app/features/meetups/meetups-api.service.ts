import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TelegramService } from '../../core/services/telegram.service';
import type { MeetupCatalogResponse, MeetupPlan, MeetupSelection } from './meetup.model';

@Injectable({ providedIn: 'root' })
export class MeetupsApiService {
  private readonly http = inject(HttpClient);
  private readonly telegram = inject(TelegramService);
  private readonly base = environment.apiUrl?.replace(/\/$/, '') ?? '';

  readonly plans = signal<MeetupPlan[]>([]);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal(false);
  readonly sourceUpdatedAt = signal<string | null>(null);

  async load(date: string): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      const params = new HttpParams().set('date', date);
      const response = await firstValueFrom(this.http.get<MeetupCatalogResponse>(`${this.base}/api/meetups`, {
        params,
        headers: this.headers(),
      }));
      this.plans.set(response.venues ?? []);
      this.sourceUpdatedAt.set(response.sourceUpdatedAtUtc ?? null);
    } catch {
      this.plans.set([]);
      this.error.set(true);
    } finally {
      this.loading.set(false);
      this.loaded.set(true);
    }
  }

  async saveSelection(venueId: string, selection: MeetupSelection): Promise<boolean> {
    if (!this.telegram.initData) return false;
    try {
      await firstValueFrom(this.http.put<void>(`${this.base}/api/meetups/${encodeURIComponent(venueId)}/attendance`, {
        date: selection.date,
        arrivalTime: selection.time,
        isAnonymous: selection.anonymous,
        openToMeet: selection.openToMeet,
      }, { headers: this.headers() }));
      await this.load(selection.date);
      return !this.error();
    } catch {
      return false;
    }
  }

  async removeSelection(venueId: string, date: string): Promise<boolean> {
    if (!this.telegram.initData) return false;
    try {
      const params = new HttpParams().set('date', date);
      await firstValueFrom(this.http.delete<void>(`${this.base}/api/meetups/${encodeURIComponent(venueId)}/attendance`, {
        params,
        headers: this.headers(),
      }));
      await this.load(date);
      return !this.error();
    } catch {
      return false;
    }
  }

  private headers(): HttpHeaders {
    const initData = this.telegram.initData;
    const baseHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });
    return initData ? baseHeaders.set('X-Telegram-Init-Data', initData) : baseHeaders;
  }
}
