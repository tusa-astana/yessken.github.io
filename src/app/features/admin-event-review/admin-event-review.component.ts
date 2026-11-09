import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventsApiService } from '../../core/services/events-api.service';
import type { EventItem } from '../../core/types/event.model';

@Component({
  selector: 'app-admin-event-review',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="review-page">
      <header class="heading">
        <span class="eyebrow">TUSA / ADMIN</span>
        <h1>Заявки на публикацию</h1>
        <p>Проверь событие и контакты организатора. В каталоге оно появится только после одобрения.</p>
      </header>

      <section class="queue" aria-live="polite">
        <div class="toolbar">
          <strong>{{ requests()?.length ?? '—' }} в очереди</strong>
          <button type="button" (click)="refresh()" [disabled]="loading()">Обновить</button>
        </div>

        @if (loading() && requests() === null) {
          <p class="state">Загружаем очередь…</p>
        } @else if (requests() === null) {
          <div class="state error" role="alert">
            <strong>Не удалось открыть очередь</strong>
            <span>Нужен доступ администратора. Открой приложение из Telegram под аккаунтом из списка Telegram:AdminUserIds и проверь соединение с API.</span>
            <button type="button" (click)="refresh()">Повторить</button>
          </div>
        } @else if (!requests()?.length) {
          <div class="empty-state"><span class="check" aria-hidden="true">✓</span><h2>Очередь чиста</h2><p>Новые заявки появятся здесь. При настроенном боте администраторы также получат сообщение в Telegram.</p></div>
        } @else {
          <div class="cards">
            @for (event of requests(); track event.id) {
              <article class="request-card">
                <div class="event-topline"><span class="category">{{ event.category || 'Событие' }}</span><span class="pending">На модерации</span></div>
                <h2>{{ event.title }}</h2>
                <p class="event-meta">{{ formatEventDate(event.date) }}<span aria-hidden="true"> · </span>{{ event.time || 'время уточняется' }}<span aria-hidden="true"> · </span>{{ event.place }}</p>
                <p class="event-meta"><strong>{{ event.isPublicEvent ? 'Публичное событие' : 'Публичность не подтверждена' }}</strong>@if (event.telegramSourceUrl) { <span> · Источник: <a [href]="event.telegramSourceUrl" target="_blank" rel="noopener noreferrer">проверить пост Telegram ↗</a></span> }</p>
                @if (event.address) { <p class="address">{{ event.address }}</p> }
                @if (event.ticketUrl) { <p>Дистрибьютор: {{ event.ticketSellerName }} · <a [href]="event.ticketUrl" target="_blank" rel="noopener noreferrer">Проверить ссылку ↗</a></p> }
                @if (event.description) { <p class="description">{{ event.description }}</p> }
                <div class="price">{{ event.price === null || event.price === 0 ? 'Бесплатно' : (event.price | number) + ' ₸' }}</div>

                <section class="contact" aria-label="Контакты организатора">
                  <h3>Организатор</h3>
                  <p>{{ event.organizerName || 'Имя не указано' }}</p>
                  <div class="contact-links">
                    @if (event.organizerEmail) { <a [href]="'mailto:' + event.organizerEmail">{{ event.organizerEmail }}</a> }
                    @if (event.organizerPhone) { <a [href]="'tel:' + event.organizerPhone">{{ event.organizerPhone }}</a> }
                    @if (event.organizerTelegramId) { <span>Telegram ID: {{ event.organizerTelegramId }}</span> }
                  </div>
                </section>

                <footer class="card-footer">
                  <small>Заявка {{ event.id }}@if (event.createdAt) { · {{ event.createdAt | date:'d MMM y, HH:mm' }} }</small>
                  <div class="actions">
                    <button class="approve" type="button" (click)="review(event, 'approve')" [disabled]="loadingId() !== null">{{ loadingId() === event.id ? 'Сохраняем…' : 'Одобрить и опубликовать' }}</button>
                    @if (rejectingId() === event.id) {
                      <div class="reject-confirm" role="group" [attr.aria-label]="'Подтвердить отклонение заявки ' + event.title">
                        <span>Отклонить заявку?</span>
                        <button class="reject" type="button" (click)="review(event, 'reject')" [disabled]="loadingId() !== null">Да, отклонить</button>
                        <button class="cancel" type="button" (click)="rejectingId.set(null)" [disabled]="loadingId() !== null">Отмена</button>
                      </div>
                    } @else {
                      <button class="reject" type="button" (click)="rejectingId.set(event.id)" [disabled]="loadingId() !== null">Отклонить</button>
                    }
                  </div>
                </footer>
              </article>
            }
          </div>
        }
        @if (actionError()) { <p class="action-error" role="alert">{{ actionError() }}</p> }
        @if (announcement()) { <p class="announcement" role="status">{{ announcement() }}</p> }
      </section>
      <a class="back-link" routerLink="/admin/interest-reports">Жалобы в интерес-группах →</a>
      <a class="back-link" routerLink="/profile">← В профиль</a>
    </main>
  `,
  styles: [`
    .review-page { max-width: 980px; margin: 0 auto; padding: 2rem 1.25rem 6rem; }
    .heading { padding: 1rem 0 1.5rem; border-bottom: 1px solid var(--tg-line); }
    .eyebrow { color: var(--tg-button, #aabd7e); font-size: .68rem; font-weight: 800; letter-spacing: .16em; }
    h1 { margin: .6rem 0 .4rem; font-size: clamp(2rem, 7vw, 4rem); font-weight: 500; }
    .heading p, .state, .empty-state p { color: var(--tg-muted); font-size: .88rem; line-height: 1.55; }
    .queue { margin-top: 1rem; }
    .toolbar { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin-bottom: .8rem; color: var(--tg-muted); font-size: .8rem; }
    button { min-height: 44px; padding: .62rem .85rem; border: 1px solid var(--tg-line); border-radius: 5px; background: transparent; color: var(--tg-text, #26372b); font: inherit; cursor: pointer; }
    button:disabled { opacity: .55; cursor: wait; }
    .state, .empty-state { padding: 2rem 1rem; text-align: center; background: var(--tg-surface, #ffffff); border: 1px solid var(--tg-line); border-radius: 6px; }
    .state { display: grid; justify-items: center; gap: .7rem; }
    .state strong { color: var(--tg-text, #26372b); }
    .state.error { color: #74500f; }
    .state span { max-width: 34rem; }
    .empty-state h2 { margin: .7rem 0 .2rem; font-size: 1.35rem; font-weight: 500; }
    .empty-state p { max-width: 34rem; margin: .35rem auto 0; }
    .check { display: inline-grid; width: 2.4rem; height: 2.4rem; place-items: center; border: 1px solid var(--tg-button, #426c47); border-radius: 50%; color: var(--tg-button, #426c47); }
    .cards { display: grid; gap: .9rem; }
    .request-card { padding: 1.1rem; background: var(--tg-surface, #ffffff); border: 1px solid var(--tg-line); border-radius: 6px; }
    .event-topline { display: flex; justify-content: space-between; gap: .75rem; }
    .category, .pending { font-size: .68rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    .category { color: var(--tg-muted); }
    .pending { padding: .25rem .45rem; border-radius: 999px; background: rgba(168,122,40,.12); color: #74500f; }
    .request-card h2 { margin: .55rem 0 .3rem; font-size: 1.4rem; font-weight: 500; }
    .event-meta, .address { margin: .25rem 0; color: var(--tg-muted); font-size: .84rem; line-height: 1.45; }
    .description { margin: .8rem 0; color: var(--tg-text); font-size: .88rem; line-height: 1.6; white-space: pre-wrap; }
    .price { margin-top: .75rem; color: var(--tg-button, #426c47); font-weight: 800; }
    .contact { margin-top: 1rem; padding: .8rem; border-left: 2px solid rgba(66,108,71,.45); background: rgba(66,108,71,.05); }
    .contact h3 { margin: 0 0 .35rem; font-size: .75rem; color: var(--tg-muted); text-transform: uppercase; letter-spacing: .08em; }
    .contact p { margin: 0; font-size: .88rem; }
    .contact-links { display: flex; flex-wrap: wrap; gap: .4rem 1rem; margin-top: .35rem; font-size: .78rem; }
    .contact-links a, .back-link { color: var(--tg-button, #426c47); }
    .contact-links span { color: var(--tg-muted); }
    .card-footer { display: flex; justify-content: space-between; align-items: flex-end; gap: .8rem; margin-top: 1rem; padding-top: .75rem; border-top: 1px solid var(--tg-line); }
    .card-footer > small { color: var(--tg-muted); font-size: .68rem; overflow-wrap: anywhere; }
    .actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .45rem; }
    .approve { border-color: var(--tg-button, #426c47); background: var(--tg-button, #426c47); color: var(--tg-button-text, #ffffff); font-weight: 800; }
    .reject { border-color: rgba(154,55,46,.35); color: #9a372e; }
    .reject-confirm { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: .4rem; color: #74500f; font-size: .75rem; }
    .cancel { border-color: var(--tg-line); color: var(--tg-muted); }
    .action-error { color: #9a372e; }
    .announcement { color: var(--tg-button, #426c47); }
    .back-link { display: inline-block; margin-top: 1rem; font-size: .82rem; text-decoration: none; }
    :host-context(.dark-theme) .state.error, :host-context(.dark-theme) .pending, :host-context(.dark-theme) .reject-confirm { color: #f2be68; }
    :host-context(.dark-theme) .pending { background: rgba(242,190,104,.14); }
    :host-context(.dark-theme) .reject { border-color: rgba(242,123,104,.55); color: #f2a08f; }
    :host-context(.dark-theme) .action-error { color: #f27b68; }
    @media (max-width: 620px) {
      .review-page { padding: 1rem .75rem 6rem; }
      .card-footer { align-items: stretch; flex-direction: column; }
      .actions { justify-content: stretch; }
      .actions > button { flex: 1; min-height: 44px; }
      .reject-confirm { justify-content: flex-start; }
      .reject-confirm button { min-height: 44px; }
      .approve { min-height: 44px; }
    }
  `],
})
export class AdminEventReviewComponent implements OnInit {
  readonly requests = signal<EventItem[] | null>(null);
  readonly loading = signal(false);
  readonly loadingId = signal<string | null>(null);
  readonly rejectingId = signal<string | null>(null);
  readonly actionError = signal('');
  readonly announcement = signal('');

  constructor(private readonly api: EventsApiService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.actionError.set('');
    this.api.getPendingEvents().subscribe((items) => {
      this.requests.set(items);
      this.loading.set(false);
    });
  }

  review(event: EventItem, decision: 'approve' | 'reject'): void {
    if (this.loadingId()) return;
    this.loadingId.set(event.id);
    this.actionError.set('');
    this.announcement.set('');
    this.api.reviewPendingEvent(event.id, decision).subscribe((result) => {
      this.loadingId.set(null);
      if (!result) {
        this.actionError.set('Не удалось сохранить решение. Обнови очередь и проверь, не обработал ли заявку другой администратор.');
        this.rejectingId.set(null);
        return;
      }
      this.requests.update((items) => (items ?? []).filter((item) => item.id !== event.id));
      this.rejectingId.set(null);
      this.announcement.set(decision === 'approve' ? `«${event.title}» опубликовано в каталоге.` : `Заявка «${event.title}» отклонена.`);
    });
  }

  formatEventDate(value: string): string {
    if (!value) return 'Дата уточняется';
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }
}
