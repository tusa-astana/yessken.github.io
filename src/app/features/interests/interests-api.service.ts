import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TelegramService } from '../../core/services/telegram.service';
import type { InterestGathering, InterestGatheringPreview, InterestGroup, InterestMember, InterestReport, InterestReportReason } from './interest.model';

@Injectable({ providedIn: 'root' })
export class InterestsApiService {
  private readonly http = inject(HttpClient);
  private readonly telegram = inject(TelegramService);
  private readonly base = environment.apiUrl?.replace(/\/$/, '') ?? '';

  async load(): Promise<InterestGroup[]> {
    try {
      return await firstValueFrom(this.http.get<InterestGroup[]>(`${this.base}/api/interests`, { headers: this.headers() }));
    } catch {
      return [];
    }
  }

  async loadUpcomingGatherings(): Promise<InterestGatheringPreview[] | null> {
    try {
      return await firstValueFrom(this.http.get<InterestGatheringPreview[]>(`${this.base}/api/interests/gatherings/upcoming`));
    } catch {
      return null;
    }
  }

  async join(interestId: string, isAnonymous: boolean, openToMeet: boolean): Promise<boolean> {
    if (!this.telegram.initData) return false;
    try {
      await firstValueFrom(this.http.put<void>(`${this.base}/api/interests/${encodeURIComponent(interestId)}/membership`, {
        isAnonymous,
        openToMeet,
      }, { headers: this.headers() }));
      return true;
    } catch {
      return false;
    }
  }

  async leave(interestId: string): Promise<boolean> {
    if (!this.telegram.initData) return false;
    try {
      await firstValueFrom(this.http.delete<void>(`${this.base}/api/interests/${encodeURIComponent(interestId)}/membership`, { headers: this.headers() }));
      return true;
    } catch {
      return false;
    }
  }

  async members(interestId: string): Promise<InterestMember[] | null> {
    if (!this.telegram.initData) return null;
    try {
      return await firstValueFrom(this.http.get<InterestMember[]>(`${this.base}/api/interests/${encodeURIComponent(interestId)}/members`, { headers: this.headers() }));
    } catch {
      return null;
    }
  }

  async report(interestId: string, targetTelegramUserId: number, reason: InterestReportReason, details: string): Promise<boolean> {
    if (!this.telegram.initData) return false;
    try {
      await firstValueFrom(this.http.post<void>(`${this.base}/api/interests/${encodeURIComponent(interestId)}/reports`, {
        targetTelegramUserId,
        reason,
        details,
      }, { headers: this.headers() }));
      return true;
    } catch {
      return false;
    }
  }

  async createGathering(interestId: string, request: Pick<InterestGathering, 'title' | 'date' | 'time' | 'place' | 'details'>): Promise<boolean> {
    if (!this.telegram.initData) return false;
    try {
      await firstValueFrom(this.http.post<void>(`${this.base}/api/interests/${encodeURIComponent(interestId)}/gatherings`, request, { headers: this.headers() }));
      return true;
    } catch {
      return false;
    }
  }

  async joinGathering(interestId: string, gatheringId: string): Promise<boolean> {
    if (!this.telegram.initData) return false;
    try {
      await firstValueFrom(this.http.put<void>(`${this.base}/api/interests/${encodeURIComponent(interestId)}/gatherings/${encodeURIComponent(gatheringId)}/attendance`, {}, { headers: this.headers() }));
      return true;
    } catch {
      return false;
    }
  }

  async leaveGathering(interestId: string, gatheringId: string): Promise<boolean> {
    if (!this.telegram.initData) return false;
    try {
      await firstValueFrom(this.http.delete<void>(`${this.base}/api/interests/${encodeURIComponent(interestId)}/gatherings/${encodeURIComponent(gatheringId)}/attendance`, { headers: this.headers() }));
      return true;
    } catch {
      return false;
    }
  }

  async cancelGathering(interestId: string, gatheringId: string): Promise<boolean> {
    if (!this.telegram.initData) return false;
    try {
      await firstValueFrom(this.http.delete<void>(`${this.base}/api/interests/${encodeURIComponent(interestId)}/gatherings/${encodeURIComponent(gatheringId)}`, { headers: this.headers() }));
      return true;
    } catch {
      return false;
    }
  }

  async loadReports(): Promise<InterestReport[] | null> {
    try {
      return await firstValueFrom(this.http.get<InterestReport[]>(`${this.base}/api/admin/interest-reports`, { headers: this.headers() }));
    } catch {
      return null;
    }
  }

  async reviewReport(reportId: string, action: 'dismiss' | 'suspend'): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post<void>(`${this.base}/api/admin/interest-reports/${encodeURIComponent(reportId)}/review`, { action }, { headers: this.headers() }));
      return true;
    } catch {
      return false;
    }
  }

  private headers(): HttpHeaders {
    const initData = this.telegram.initData;
    return initData ? new HttpHeaders({ 'X-Telegram-Init-Data': initData }) : new HttpHeaders();
  }
}
