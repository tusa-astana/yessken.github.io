import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import type { OrganizerEngagementRow } from '../../core/types/event.model';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="insights">
      <header class="heading"><span class="eyebrow">ИНСТРУМЕНТЫ ОРГАНИЗАТОРА</span><h1>Интерес к событиям</h1><p>Открытия страницы, отправки ссылки и RSVP по вашим опубликованным событиям.</p></header>
      <p class="policy" role="note">Метрики показывают действия в TUSA, а не число уникальных людей или продажи билетов. TUSA не продаёт офлайн-вход.</p>
      @if (loading()) { <p class="state" role="status">Загружаем статистику…</p> }
      @else if (rows() === null) { <section class="empty"><strong>Не удалось загрузить аналитику</strong><p>Откройте TUSA из Telegram и проверьте соединение.</p></section> }
      @else if (rows()?.length) {
        <section class="event-list" aria-label="Активность событий">
          @for (event of rows(); track event.eventId) {
            <article class="event-card">
              <div class="event-heading"><div><h2>{{ event.eventTitle }}</h2><p>{{ event.eventDate }}</p></div><a [routerLink]="['/events', event.eventId]">Открыть событие <span aria-hidden="true">↗</span></a></div>
              <div class="metrics">
                <div><strong>{{ event.views | number }}</strong><span>Открытия</span></div>
                <div><strong>{{ event.shares | number }}</strong><span>Поделились</span></div>
                <div><strong>{{ event.rsvps | number }}</strong><span>RSVP</span></div>
              </div>
            </article>
          }
        </section>
      } @else {
        <section class="empty"><strong>Опубликованных событий пока нет</strong><p>После модерации здесь появятся открытия страницы, отправки ссылки и бесплатный RSVP.</p><a routerLink="/create-event">Разместить событие <span aria-hidden="true">→</span></a></section>
      }
    </div>
  `,
  styles: [`
    .insights { max-width: 1000px; margin: 0 auto; padding: 2rem 1.25rem 6rem; }
    .heading { padding: 1rem 0 2rem; border-bottom: 1px solid var(--tg-line); }
    .eyebrow { color: var(--tg-button); font-size: .65rem; font-weight: 800; letter-spacing: .16em; }
    h1 { margin: .6rem 0 .4rem; font-size: clamp(2.4rem, 7vw, 5rem); font-weight: 500; }
    .heading p, .empty p { max-width: 42rem; color: var(--tg-muted); font-size: .9rem; line-height: 1.55; }
    .policy { margin: 1rem 0; padding: .8rem 1rem; border: 1px solid var(--tg-line); border-radius: 8px; color: var(--tg-muted); font-size: .78rem; line-height: 1.5; }
    .state, .empty { margin-top: 1rem; padding: 1.1rem; border: 1px solid var(--tg-line); border-radius: 8px; background: var(--tg-surface); }
    .empty strong { font-size: 1rem; }
    .empty a, .event-heading a { color: var(--tg-button); font-size: .82rem; text-decoration: none; }
    .event-list { display: grid; gap: .75rem; margin-top: 1rem; }
    .event-card { padding: 1rem; border: 1px solid var(--tg-line); border-radius: 8px; background: var(--tg-surface); }
    .event-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
    .event-heading h2 { margin: 0; font-size: 1rem; font-weight: 600; }
    .event-heading p { margin: .25rem 0 0; color: var(--tg-muted); font-size: .75rem; }
    .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: .5rem; margin-top: 1rem; }
    .metrics div { display: grid; gap: .2rem; padding: .7rem; border-radius: 6px; background: color-mix(in srgb, var(--tg-button) 7%, transparent); }
    .metrics strong { color: var(--tg-button); font-size: 1.25rem; }
    .metrics span { color: var(--tg-muted); font-size: .7rem; }
    @media (max-width: 540px) { .event-heading { flex-direction: column; } .metrics { gap: .35rem; } .metrics div { padding: .55rem; } .metrics strong { font-size: 1.05rem; } }
  `],
})
export class OrdersComponent implements OnInit {
  rows = signal<OrganizerEngagementRow[] | null>(null);
  loading = signal(true);

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.data.getOrganizerEngagement().subscribe((rows) => { this.rows.set(rows); this.loading.set(false); });
  }
}
