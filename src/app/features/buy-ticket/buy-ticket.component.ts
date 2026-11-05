import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { I18nService } from '../../core/services/i18n.service';
import type { EventItem } from '../../core/types/event.model';

@Component({
  selector: 'app-buy-ticket',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (event(); as ev) {
      <main class="purchase-page">
        <header class="page-heading">
          <span class="eyebrow">TUSA · RSVP</span>
          <h1>{{ i18n.t('checkout.unavailable') }}</h1>
          <p>Покупка офлайн-входа через TUSA недоступна. Свяжитесь с организатором, чтобы уточнить условия.</p>
        </header>
        <section class="event-card" aria-label="Выбранное событие">
          <span class="event-label">Выбранное событие</span>
          <h2>{{ ev.title }}</h2>
          <p class="event-meta">{{ ev.date }} · {{ ev.time }} · {{ ev.place }}</p>
          <a [routerLink]="['/events', ev.id]" class="event-link">{{ i18n.t('tickets.open') }} <span aria-hidden="true">→</span></a>
        </section>
        <aside class="notice" role="note">
          <span class="notice-mark" aria-hidden="true">i</span>
          <div>
            <strong>RSVP — не билет и не бронь.</strong>
            <p>{{ i18n.t('checkout.hint') }}</p>
            <a class="support-link" href="https://t.me/tusa_astana_bot?start=paysupport">{{ i18n.t('checkout.support') }} <span aria-hidden="true">↗</span></a>
          </div>
        </aside>
        <a routerLink="/events" class="back-link">← К афише</a>
      </main>
    } @else {
      <p class="not-found">{{ i18n.t('events.details.notFound') }}</p>
    }
  `,
  styles: [
    `
      :host { display: block; }
      .purchase-page { max-width: 720px; margin: 0 auto; padding: 1rem 1rem 6rem; color: var(--tg-text); }
      .page-heading { padding: .55rem 0 1.1rem; border-bottom: 1px solid var(--tg-line); }
      .eyebrow, .event-label { color: var(--tg-button); font-size: .62rem; font-weight: 800; letter-spacing: .14em; }
      h1 { margin: .45rem 0 .45rem; font-size: clamp(1.9rem, 7vw, 3rem); font-weight: 600; line-height: 1.08; letter-spacing: -.04em; }
      .page-heading > p { max-width: 36rem; margin: 0; color: var(--tg-muted); font-size: .84rem; line-height: 1.55; }
      .event-card { margin: 1rem 0; padding: 1rem; border: 1px solid var(--tg-line); border-radius: 12px; background: var(--tg-surface); box-shadow: 0 8px 24px rgba(25,40,30,.06); }
      .event-label { letter-spacing: .09em; }
      .event-card h2 { margin: .45rem 0 .25rem; font-size: 1.15rem; line-height: 1.3; overflow-wrap: anywhere; }
      .event-meta { margin: 0; color: var(--tg-muted); font-size: .76rem; line-height: 1.5; }
      .event-link, .support-link { display: inline-flex; min-height: 42px; align-items: center; gap: .4rem; margin-top: .75rem; padding: .55rem .7rem; border: 1px solid var(--tg-line); border-radius: 8px; color: var(--tg-button); font-size: .74rem; font-weight: 750; text-decoration: none; }
      .event-link:hover, .support-link:hover { border-color: var(--tg-button); }
      .notice { display: grid; grid-template-columns: 2rem minmax(0, 1fr); align-items: start; gap: .7rem; margin: 1rem 0; padding: .9rem; border: 1px solid rgba(168,122,40,.25); border-radius: 10px; background: rgba(242,190,104,.09); line-height: 1.5; }
      .notice-mark { display: grid; width: 1.7rem; height: 1.7rem; place-items: center; border-radius: 50%; background: rgba(168,122,40,.14); color: #624814; font-size: .8rem; font-weight: 800; }
      .notice > div > strong { color: var(--tg-text); font-size: .78rem; }
      .notice p { margin: .3rem 0 0; color: var(--tg-muted); font-size: .76rem; }
      :host-context(.dark-theme) .notice { border-color: rgba(242,190,104,.2); }
      :host-context(.dark-theme) .notice-mark { color: #f2d29b; }
      .support-link { margin-top: .45rem; }
      .back-link { display: inline-flex; min-height: 42px; align-items: center; color: var(--tg-button); font-size: .78rem; font-weight: 750; text-decoration: none; }
      .not-found { max-width: 720px; margin: 0 auto; padding: 2rem 1rem; color: var(--tg-muted); }
      @media (min-width: 760px) { .purchase-page { padding: 2rem 1.5rem 4rem; } .event-card { padding: 1.2rem; } }
    `,
  ],
})
export class BuyTicketComponent implements OnInit {
  event = signal<EventItem | null>(null);
  protected readonly i18n = inject(I18nService);

  constructor(
    private route: ActivatedRoute,
    private data: DataService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.data.getEventById(id).subscribe((ev) => {
        this.event.set(ev ?? null);
      });
    }
  }
}
