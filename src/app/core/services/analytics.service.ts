import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TelegramService } from './telegram.service';
import { environment } from '../../../environments/environment';

export type FunnelEvent =
  | 'catalog_view'
  | 'event_open'
  | 'event_share'
  | 'community_open'
  | 'meetup_share_intent'
  | 'meetup_invite_open'
  | 'community_gathering_share'
  | 'community_gathering_open'
  | 'community_gathering_rsvp'
  | 'search_term'
  | 'category_filter'
  | 'promotion_invoice_cancelled'
  | 'ticket_seller_click';

interface StoredFunnelEvent {
  name: FunnelEvent;
  eventId?: string;
  ref?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly storageKey = 'tusa-funnel-events';

  constructor(private http: HttpClient, private telegram: TelegramService) {}

  track(name: FunnelEvent, eventId?: string, ref?: string, delivery: 'request' | 'beacon' = 'request'): void {
    if (typeof window === 'undefined') return;
    if (name === 'community_gathering_rsvp') return;
    const privacyMinimized = name === 'search_term' || name === 'category_filter' || name === 'promotion_invoice_cancelled' || name === 'ticket_seller_click';
    const events = privacyMinimized ? [] : this.read();
    const currentRef = ref ?? (!privacyMinimized ? new URLSearchParams(window.location.search).get('ref') ?? undefined : undefined);
    if (!privacyMinimized) {
      events.push({ name, eventId, ref: currentRef, createdAt: new Date().toISOString() });
      window.localStorage.setItem(this.storageKey, JSON.stringify(events.slice(-500)));
    }

    const apiBase = environment.apiUrl?.replace(/\/$/, '');
    const sameOriginApiEnabled = !environment.production || new URLSearchParams(window.location.search).get('api') === '1';
    const endpoint = apiBase ? `${apiBase}/api/analytics` : sameOriginApiEnabled ? '/api/analytics' : null;
    if (!endpoint) return;

    if (delivery === 'beacon' && name === 'community_open' && currentRef && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const beaconEndpoint = endpoint.replace('/api/analytics', '/api/analytics/beacon');
      if (navigator.sendBeacon(beaconEndpoint, new URLSearchParams({ ref: currentRef }))) return;
    }

    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (this.telegram.initData) headers = headers.set('X-Telegram-Init-Data', this.telegram.initData);
    this.http.post<void>(endpoint, { name, eventId, ref: currentRef }, { headers }).subscribe({ error: () => undefined });
  }

  getSummary(): Record<FunnelEvent, number> {
    const summary = {
      catalog_view: 0,
      event_open: 0,
      event_share: 0,
      community_open: 0,
      meetup_share_intent: 0,
      meetup_invite_open: 0,
      community_gathering_share: 0,
      community_gathering_open: 0,
      community_gathering_rsvp: 0,
      search_term: 0,
      category_filter: 0,
      promotion_invoice_cancelled: 0,
      ticket_seller_click: 0,
    } satisfies Record<FunnelEvent, number>;
    for (const event of this.read()) summary[event.name] += 1;
    return summary;
  }

  private read(): StoredFunnelEvent[] {
    if (typeof window === 'undefined') return [];
    try {
      const parsed = JSON.parse(window.localStorage.getItem(this.storageKey) ?? '[]') as StoredFunnelEvent[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
