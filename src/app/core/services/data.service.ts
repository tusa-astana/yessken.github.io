import { Injectable } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { MockDataService } from './mock-data.service';
import { EventsApiService } from './events-api.service';
import type { AdminEventReport, AdminSalesSummary, EventItem, EventPromotionInvoice, EventPromotionOffer, OrganizerEngagementRow, OrganizerOrderRow, OrganizerSubscriptionOffer, OrganizerSubscriptionStatus, Ticket, TelegramGroupItem } from '../types/event.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DataService {
  private get useApi(): boolean {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mock') === '1' && params.get('api') !== '1') return false;
      if (params.get('api') === '1') return true;
    }
    return !!environment.apiUrl?.trim() || !environment.production;
  }

  constructor(
    private mock: MockDataService,
    private api: EventsApiService
  ) {}

  get eventsError() { return this.api.eventsError; }
  get eventSubmissionRateLimited() { return this.api.eventSubmissionRateLimited; }

  getEvents(category?: string): Observable<EventItem[]> {
    if (this.useApi) return this.api.getEvents(category).pipe(switchMap((list) => {
      if (environment.production) return of(list);
      const today = new Date().toISOString().slice(0, 10);
      if (this.api.eventsError() || !list.some((event) => event.date >= today)) {
        const samples = this.mock.getEvents().filter((event) => event.date >= today);
        return of(category ? samples.filter((event) => event.category === category) : samples);
      }
      return of(list);
    }));
    return of(this.mock.getEvents()).pipe(
      switchMap((list) => (category ? of(list.filter((e) => e.category === category)) : of(list)))
    );
  }

  getEventById(id: string): Observable<EventItem | null> {
    if (this.useApi) return this.api.getEventById(id).pipe(switchMap((event) =>
      of(event ?? (environment.production ? null : this.mock.getEventById(id) ?? null))));
    return of(this.mock.getEventById(id) ?? null);
  }

  getEventGoing(id: string): Observable<{ goingCount: number; userGoing: boolean } | null> {
    if (this.useApi) return this.api.getEventGoing(id);
    const event = this.mock.getEventById(id);
    return of(event ? { goingCount: event.goingCount ?? 0, userGoing: event.userGoing ?? false } : null);
  }

  getTickets(): Observable<Ticket[]> {
    if (this.useApi) return this.api.getTickets().pipe(switchMap((tickets) => of(this.api.ticketsError() ? this.mock.getTickets() : tickets)));
    return of(this.mock.getTickets());
  }

  getOrganizerOrders(): Observable<OrganizerOrderRow[]> {
    if (this.useApi) return this.api.getOrganizerOrders();
    return of([]);
  }

  getOrganizerEngagement(): Observable<OrganizerEngagementRow[] | null> {
    if (this.useApi) return this.api.getOrganizerEngagement();
    return of([]);
  }

  getAdminOrderReport(): Observable<AdminEventReport[]> {
    if (this.useApi) return this.api.getAdminOrderReport();
    return of([]);
  }

  getOrganizerSubscription(): Observable<OrganizerSubscriptionStatus | null> {
    if (this.useApi) return this.api.getOrganizerSubscription();
    return of(null);
  }

  getOrganizerSubscriptionOffer(): Observable<OrganizerSubscriptionOffer | null> {
    if (this.useApi) return this.api.getOrganizerSubscriptionOffer();
    return of({ available: false, stars: 0, durationDays: 30, features: [] });
  }

  getEventPromotionOffer(eventId: string): Observable<EventPromotionOffer | null> {
    return this.useApi ? this.api.getEventPromotionOffer(eventId) : of(null);
  }

  createEventPromotionInvoice(eventId: string, termsVersion: string): Observable<EventPromotionInvoice | null> {
    return this.useApi ? this.api.createEventPromotionInvoice(eventId, termsVersion) : of(null);
  }

  cancelEventPromotionInvoice(eventId: string): Observable<boolean> {
    return this.useApi ? this.api.cancelEventPromotionInvoice(eventId) : of(false);
  }

  getAdminSalesSummary(): Observable<AdminSalesSummary | null> {
    if (this.useApi) return this.api.getAdminSalesSummary();
    return of(null);
  }

  createEvent(event: Omit<EventItem, 'id'>): Observable<EventItem | null> {
    if (this.useApi) return this.api.createEvent(event);
    return of(this.mock.addEvent(event));
  }

  getTelegramGroups(): Observable<TelegramGroupItem[]> {
    if (this.useApi) return this.api.getTelegramGroups();
    return of([]);
  }

  setGoing(eventId: string): Observable<{ goingCount: number; userGoing: boolean } | null> {
    if (this.useApi) return this.api.setGoing(eventId);
    return of(this.mock.setGoing(eventId));
  }
}
