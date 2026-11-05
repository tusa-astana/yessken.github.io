import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of, timeout } from 'rxjs';
import { TelegramService } from './telegram.service';
import type { AdminEventReport, AdminSalesSummary, BotMessageLogRow, EventItem, OrganizerEngagementRow, OrganizerOrderRow, OrganizerSubscriptionOffer, OrganizerSubscriptionStatus, Ticket, TelegramGroupItem } from '../types/event.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EventsApiService {
  private readonly base = environment.apiUrl?.replace(/\/$/, '') ?? '';
  readonly eventsError = signal(false);
  readonly ticketsError = signal(false);
  readonly eventSubmissionRateLimited = signal(false);

  constructor(
    private http: HttpClient,
    private telegram: TelegramService
  ) {}

  private get apiDisabled(): boolean {
    if (this.base || !environment.production) return false;
    return typeof window === 'undefined' || new URLSearchParams(window.location.search).get('api') !== '1';
  }

  private headers(): HttpHeaders {
    const h = new HttpHeaders({ 'Content-Type': 'application/json' });
    const initData = this.telegram.initData;
    if (initData) return h.set('X-Telegram-Init-Data', initData);
    return h;
  }

  getEvents(category?: string): Observable<EventItem[]> {
    if (this.apiDisabled) return of([]);
    this.eventsError.set(false);
    const params = category ? { category } : {};
    return this.http.get<EventItem[]>(`${this.base}/api/events`, { params: params as any, headers: this.headers() }).pipe(
      timeout({ first: 5000 }),
      catchError(() => { this.eventsError.set(true); return of([]); })
    );
  }

  getPendingEvents(): Observable<EventItem[] | null> {
    if (this.apiDisabled) return of(null);
    return this.http.get<EventItem[]>(`${this.base}/api/events/pending`, { headers: this.headers() })
      .pipe(catchError(() => of(null)));
  }

  reviewPendingEvent(id: string, decision: 'approve' | 'reject'): Observable<EventItem | null> {
    if (this.apiDisabled) return of(null);
    return this.http.post<EventItem>(`${this.base}/api/events/${encodeURIComponent(id)}/${decision}`, {}, { headers: this.headers() })
      .pipe(catchError(() => of(null)));
  }

  getEventById(id: string): Observable<EventItem | null> {
    if (this.apiDisabled) return of(null);
    return this.http.get<EventItem>(`${this.base}/api/events/${id}`, { headers: this.headers() }).pipe(
      timeout({ first: 5000 }),
      catchError(() => of(null))
    );
  }

  getEventGoing(id: string): Observable<{ goingCount: number; userGoing: boolean } | null> {
    if (this.apiDisabled) return of(null);
    return this.http.get<{ goingCount: number; userGoing: boolean }>(`${this.base}/api/events/${encodeURIComponent(id)}/going`, { headers: this.headers() })
      .pipe(catchError(() => of(null)));
  }

  getTickets(): Observable<Ticket[]> {
    if (this.apiDisabled) return of([]);
    this.ticketsError.set(false);
    return this.http.get<Ticket[]>(`${this.base}/api/tickets/me`, { headers: this.headers() }).pipe(
      timeout({ first: 5000 }),
      catchError(() => {
        this.ticketsError.set(true);
        return of([]);
      })
    );
  }

  getOrganizerOrders(): Observable<OrganizerOrderRow[]> {
    if (this.apiDisabled) return of([]);
    return this.http.get<OrganizerOrderRow[]>(`${this.base}/api/tickets/organizer`, { headers: this.headers() }).pipe(catchError(() => of([])));
  }

  getOrganizerEngagement(): Observable<OrganizerEngagementRow[] | null> {
    if (this.apiDisabled) return of(null);
    return this.http.get<OrganizerEngagementRow[]>(`${this.base}/api/organizer/engagement`, { headers: this.headers() })
      .pipe(catchError(() => of(null)));
  }

  getAdminOrderReport(): Observable<AdminEventReport[]> {
    if (this.apiDisabled) return of([]);
    return this.http.get<AdminEventReport[]>(`${this.base}/api/admin/tickets/by-event`, { headers: this.headers() }).pipe(catchError(() => of([])));
  }

  getAdminSalesSummary(): Observable<AdminSalesSummary | null> {
    if (this.apiDisabled) return of(null);
    return this.http.get<AdminSalesSummary>(`${this.base}/api/admin/sales-summary`, { headers: this.headers() }).pipe(catchError(() => of(null)));
  }

  getAdminBotMessages(skip = 0, take = 100): Observable<BotMessageLogRow[] | null> {
    if (this.apiDisabled) return of(null);
    return this.http.get<BotMessageLogRow[]>(`${this.base}/api/admin/bot-messages`, {
      params: { skip, take },
      headers: this.headers(),
    }).pipe(catchError(() => of(null)));
  }

  getOrganizerSubscription(): Observable<OrganizerSubscriptionStatus | null> {
    if (this.apiDisabled) return of(null);
    return this.http.get<OrganizerSubscriptionStatus>(`${this.base}/api/organizer/subscription`, { headers: this.headers() }).pipe(catchError(() => of(null)));
  }

  getOrganizerSubscriptionOffer(): Observable<OrganizerSubscriptionOffer | null> {
    if (this.apiDisabled) return of(null);
    return this.http.get<OrganizerSubscriptionOffer>(`${this.base}/api/organizer/subscription/offer`).pipe(catchError(() => of(null)));
  }

  createEvent(event: Omit<EventItem, 'id'>): Observable<EventItem | null> {
    if (this.apiDisabled) return of(null);
    this.eventSubmissionRateLimited.set(false);
    const body = {
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      place: event.place,
      address: event.address,
      lat: event.lat,
      lng: event.lng,
      category: event.category,
      price: event.price,
      imageUrl: event.imageUrl,
      organizerName: event.organizerName,
      organizerEmail: event.organizerEmail,
      organizerPhone: event.organizerPhone,
    };
    const endpoint = this.telegram.initData ? '/api/events' : '/api/events/public';
    return this.http.post<EventItem>(`${this.base}${endpoint}`, body, { headers: this.headers() }).pipe(
      catchError((error: HttpErrorResponse) => {
        this.eventSubmissionRateLimited.set(error.status === 429);
        return of(null);
      })
    );
  }

  getTelegramGroups(): Observable<TelegramGroupItem[]> {
    if (this.apiDisabled) return of([]);
    return this.http
      .get<TelegramGroupItem[]>(`${this.base}/api/telegram-groups`, { headers: this.headers() })
      .pipe(catchError(() => of([])));
  }

  /** Переключить «Я пойду» для сходки. Возвращает актуальные goingCount и userGoing. */
  setGoing(eventId: string): Observable<{ goingCount: number; userGoing: boolean } | null> {
    if (this.apiDisabled) return of(null);
    return this.http
      .post<{ goingCount: number; userGoing: boolean }>(`${this.base}/api/events/${eventId}/going`, {}, { headers: this.headers() })
      .pipe(catchError(() => of(null)));
  }
}
