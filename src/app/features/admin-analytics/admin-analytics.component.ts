import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventsApiService } from '../../core/services/events-api.service';
import type { FunnelSummaryRow } from '../../core/types/event.model';

@Component({
  selector: 'app-admin-analytics',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="analytics-page">
      <header class="heading">
        <span class="eyebrow">TUSA / ADMIN</span>
        <h1>Аналитика пилота</h1>
        <p>Считаем действия в приложении. Повторные открытия возможны; переход в Telegram не означает вступление, RSVP или продажу.</p>
      </header>

      <section class="panel" aria-live="polite">
        <div class="toolbar">
          <span>Сводные события воронки</span>
          <button type="button" (click)="refresh()" [disabled]="loading()">Обновить</button>
        </div>
        @if (loading() && summary() === null) {
          <p class="state" role="status">Загружаем сводку…</p>
        } @else if (summary() === null) {
          <div class="state error" role="alert">
            <strong>Не удалось загрузить аналитику</strong>
            <span>Нужен доступ администратора TUSA из Telegram и соединение с API.</span>
            <button type="button" (click)="refresh()">Повторить</button>
          </div>
        } @else {
          <div class="metric-grid">
            @for (metric of metrics; track metric.name) {
              <article class="metric-card">
                <span>{{ metric.label }}</span>
                <strong>{{ count(metric.name) }}</strong>
                <small>{{ metric.note }}</small>
              </article>
            }
          </div>
          <p class="caveat">«Переходы в сообщества» — нажатия на внешние Telegram-ссылки, не число вступивших участников. RSVP — отметка интереса, не билет.</p>
        }
      </section>
      <a class="back-link" routerLink="/profile">← В профиль</a>
    </main>
  `,
  styles: [`
    .analytics-page { max-width: 980px; margin: 0 auto; padding: 2rem 1.25rem 6rem; }
    .heading { padding: 1rem 0 1.5rem; border-bottom: 1px solid var(--tg-line); }
    .eyebrow { color: var(--tg-button, #aabd7e); font-size: .68rem; font-weight: 800; letter-spacing: .16em; }
    h1 { margin: .6rem 0 .4rem; font-size: clamp(2rem, 7vw, 4rem); font-weight: 500; }
    .heading p, .state, .caveat { color: var(--tg-muted); font-size: .85rem; line-height: 1.55; }
    .panel { margin-top: 1rem; padding: 1rem; background: var(--tg-surface, #fff); border: 1px solid var(--tg-line); border-radius: 8px; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: .75rem; margin-bottom: .8rem; color: var(--tg-muted); font-size: .8rem; }
    button { min-height: 44px; padding: .55rem .8rem; border: 1px solid var(--tg-line); border-radius: 6px; background: transparent; color: var(--tg-text); cursor: pointer; }
    button:disabled { opacity: .55; cursor: wait; }
    .state { display: grid; justify-items: center; gap: .6rem; padding: 1.5rem .5rem; text-align: center; }
    .state strong { color: var(--tg-text); }
    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: .65rem; }
    .metric-card { display: grid; gap: .3rem; min-height: 7rem; padding: .85rem; border: 1px solid var(--tg-line); border-radius: 7px; }
    .metric-card span { color: var(--tg-muted); font-size: .74rem; }
    .metric-card strong { color: var(--tg-button); font-size: 1.8rem; font-variant-numeric: tabular-nums; }
    .metric-card small { color: var(--tg-muted); font-size: .68rem; line-height: 1.4; }
    .caveat { margin: .85rem 0 0; font-size: .72rem; }
    .back-link { display: inline-block; margin-top: 1rem; color: var(--tg-button); font-size: .82rem; text-decoration: none; }
    @media (max-width: 600px) { .analytics-page { padding: 1rem .75rem 6rem; } .panel { padding: .75rem; } }
  `],
})
export class AdminAnalyticsComponent {
  readonly summary = signal<FunnelSummaryRow[] | null>(null);
  readonly loading = signal(false);
  readonly metrics = [
    { name: 'catalog_view', label: 'Открытия афиши', note: 'Повторные открытия включены' },
    { name: 'event_open', label: 'Открытия событий', note: 'Карточки событий' },
    { name: 'event_share', label: 'Отправки ссылок', note: 'Попытки поделиться событием' },
    { name: 'community_open', label: 'Переходы в сообщества', note: 'Нажатия на внешние ссылки' },
  ] as const;

  constructor(private readonly api: EventsApiService) {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.api.getAdminFunnelSummary().subscribe((rows) => {
      this.summary.set(rows);
      this.loading.set(false);
    });
  }

  count(name: string): number {
    return this.summary()?.find((row) => row.name === name)?.count ?? 0;
  }
}