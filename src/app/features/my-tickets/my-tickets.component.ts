import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { I18nService } from '../../core/services/i18n.service';
import type { Ticket } from '../../core/types/event.model';
import QRCode from 'qrcode';

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="my-tickets">
      <header class="archive-heading">
        <span class="eyebrow">TUSA · АРХИВ</span>
        <h1>{{ i18n.t('tickets.heading') }}</h1>
      </header>
      <p class="legacy-notice" role="note">{{ i18n.t('tickets.legacyNotice') }}</p>
      @if (tickets().length) {
        <div class="ticket-list">
          @for (t of tickets(); track t.id) {
            <article class="ticket">
              <h3>{{ t.eventTitle }}</h3>
              <p class="meta">{{ t.eventDate }} · {{ t.eventPlace }}</p>
              @if (t.isDemo) { <p class="demo-ticket" role="note">{{ i18n.t('tickets.demoNotice') }}</p> }
              @if (!t.isDemo && qrCodes()[t.id]) { <img class="ticket-qr" [src]="qrCodes()[t.id]" alt="QR-код билета" /> }
              @if (!t.isDemo && t.qrCode) { <p class="qr">{{ i18n.t('tickets.entryCode') }} {{ t.qrCode }}</p> }
              <footer class="ticket-footer">
                <span class="status" [class]="statusClass(t.paymentStatus)">{{ statusLabel(t.paymentStatus) }}</span>
                <a [routerLink]="['/events', t.eventId]" queryParamsHandling="preserve">{{ i18n.t('tickets.open') }} <span aria-hidden="true">→</span></a>
              </footer>
            </article>
          }
        </div>
      } @else {
        <section class="empty-state">
          <strong>{{ i18n.t('tickets.empty') }}</strong>
          <a routerLink="/events" queryParamsHandling="preserve">{{ i18n.t('tickets.catalog') }} <span aria-hidden="true">→</span></a>
        </section>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .my-tickets { max-width: 1080px; margin: 0 auto; padding: 1.2rem 1rem 6rem; color: var(--tg-text); }
      .archive-heading { padding: .3rem 0 1rem; }
      .eyebrow { color: var(--tg-button); font-size: .62rem; font-weight: 800; letter-spacing: .15em; }
      h1 { margin: .4rem 0 0; font-size: clamp(2rem, 7vw, 3.2rem); font-weight: 550; letter-spacing: -.04em; }
      .legacy-notice { margin: 0 0 1rem; padding: .8rem .9rem; border: 1px solid rgba(168,122,40,.25); border-radius: 10px; background: rgba(242,190,104,.09); color: #624814; font-size: .78rem; line-height: 1.5; }
      :host-context(.dark-theme) .legacy-notice { color: #f2d29b; }
      .ticket-list { display: grid; grid-template-columns: minmax(0, 1fr); gap: .75rem; }
      .ticket {
        min-width: 0;
        padding: 1rem;
        background: var(--tg-surface, #ffffff);
        border: 1px solid var(--tg-line);
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(25,40,30,.07);
      }
      .ticket h3 { margin: 0; font-size: 1.05rem; font-weight: 700; line-height: 1.3; overflow-wrap: anywhere; }
      .meta { margin: .35rem 0 0; color: var(--tg-muted); font-size: .75rem; line-height: 1.45; }
      .demo-ticket { margin: .7rem 0; padding: .6rem .7rem; border: 1px solid rgba(168,122,40,.24); border-radius: 8px; background: rgba(242,190,104,.1); color: #624814; font-size: .72rem; line-height: 1.45; }
      :host-context(.dark-theme) .demo-ticket { color: #f2d29b; }
      .ticket-footer { display: flex; align-items: center; justify-content: space-between; gap: .65rem; margin-top: .6rem; padding-top: .65rem; border-top: 1px solid var(--tg-line); }
      .status { display: inline-flex; align-items: center; min-height: 1.7rem; padding: .25rem .55rem; border-radius: 999px; font-size: .67rem; font-weight: 750; }
      .status-paid { background: rgba(40,93,66,.1); color: #285d42; }
      .status-pending, .status-checkout { background: rgba(168,122,40,.12); color: #74500f; }
      .status-failed, .status-refunded, .status-expired, .status-refund_requested { background: rgba(176,63,53,.1); color: #9a372e; }
      :host-context(.dark-theme) .status-paid { background: rgba(184,223,155,.12); color: #b8df9b; }
      :host-context(.dark-theme) .status-pending, :host-context(.dark-theme) .status-checkout { background: rgba(242,190,104,.14); color: #f2be68; }
      :host-context(.dark-theme) .status-failed, :host-context(.dark-theme) .status-refunded, :host-context(.dark-theme) .status-expired, :host-context(.dark-theme) .status-refund_requested { background: rgba(242,123,104,.14); color: #f27b68; }
      .ticket-qr { display: block; width: min(220px, 70vw); aspect-ratio: 1; margin: .75rem auto; background: #fff; padding: .5rem; border-radius: 8px; }
      .qr { margin: .5rem 0; color: var(--tg-muted); font-family: ui-monospace, monospace; font-size: .75rem; overflow-wrap: anywhere; }
      .ticket-footer a, .empty-state a { display: inline-flex; min-height: 42px; align-items: center; gap: .35rem; padding: .55rem .7rem; border: 1px solid var(--tg-line); border-radius: 8px; color: var(--tg-button); font-size: .75rem; font-weight: 750; text-decoration: none; }
      .ticket-footer a:hover, .empty-state a:hover { border-color: var(--tg-button); background: color-mix(in srgb, var(--tg-button) 6%, transparent); }
      .empty-state { display: grid; justify-items: start; gap: .8rem; padding: 1.1rem; border: 1px dashed var(--tg-line); border-radius: 12px; background: var(--tg-surface); }
      .empty-state strong { color: var(--tg-text); font-size: .9rem; line-height: 1.5; }
      @media (min-width: 720px) { .my-tickets { padding: 2rem clamp(1.5rem, 4vw, 3rem) 4rem; } .ticket-list { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; } }
    `,
  ],
})
export class MyTicketsComponent implements OnInit {
  tickets = signal<Ticket[]>([]);
  qrCodes = signal<Record<string, string>>({});
  protected readonly i18n = inject(I18nService);

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.data.getTickets().subscribe(async (list) => {
      this.tickets.set(list);
      const entries = await Promise.all(list.filter((ticket) => ticket.qrCode).map(async (ticket) => [ticket.id, await QRCode.toDataURL(ticket.qrCode!, { width: 240, margin: 1 })] as const));
      this.qrCodes.set(Object.fromEntries(entries));
    });
  }

  statusLabel(status?: Ticket['paymentStatus']): string {
    return ({
      paid: this.i18n.t('tickets.status.paid'),
      pending: this.i18n.t('tickets.status.pending'),
      checkout: this.i18n.t('tickets.status.checkout'),
      failed: this.i18n.t('tickets.status.failed'),
      refunded: this.i18n.t('tickets.status.refunded'),
      refund_requested: this.i18n.t('tickets.status.refundRequested'),
      expired: this.i18n.t('tickets.status.expired'),
    } as Record<string, string>)[status ?? 'pending'] ?? this.i18n.t('tickets.status.unknown');
  }

  statusClass(status?: Ticket['paymentStatus']): string { return `status-${status ?? 'pending'}`; }
}
