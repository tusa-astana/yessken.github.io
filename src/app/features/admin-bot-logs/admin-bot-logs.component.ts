import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventsApiService } from '../../core/services/events-api.service';
import type { BotMessageLogRow } from '../../core/types/event.model';

@Component({
  selector: 'app-admin-bot-logs',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="logs-page">
      <header class="heading">
        <span class="eyebrow">TUSA / ADMIN</span>
        <h1>Сообщения боту</h1>
        <p>Входящие сообщения пользователей. Доступ только у администратора бота.</p>
      </header>

      <section class="panel" aria-live="polite">
        <div class="toolbar">
          <span>{{ logs()?.length ?? 0 }} сообщений загружено</span>
          <button type="button" (click)="refresh()" [disabled]="loading()">Обновить</button>
        </div>

        @if (loading() && logs() === null) {
          <p class="state">Загружаем журнал…</p>
        } @else if (logs() === null) {
          <div class="state error">
            <strong>{{ failed() ? 'Не удалось загрузить журнал' : 'Нет доступа' }}</strong>
            <span>{{ failed() ? 'Проверьте соединение и попробуйте снова.' : 'Откройте приложение из Telegram под аккаунтом администратора.' }}</span>
            <button type="button" (click)="refresh()">Повторить</button>
          </div>
        } @else if (!logs()?.length) {
          <p class="state">Входящих сообщений пока нет.</p>
        } @else {
          <div class="table-wrap">
            <table>
              <caption class="visually-hidden">Журнал входящих сообщений Telegram-боту</caption>
              <thead><tr><th scope="col">Дата</th><th scope="col">Отправитель</th><th scope="col">Тип</th><th scope="col">Сообщение</th></tr></thead>
              <tbody>
                @for (row of logs(); track row.id) {
                  <tr>
                    <td data-label="Дата">{{ row.receivedAt | date:'d MMM y, HH:mm:ss' }}</td>
                    <td data-label="Отправитель"><strong>{{ row.senderName || 'Пользователь' }}</strong><small>{{ row.username ? '@' + row.username + ' · ' : '' }}ID {{ row.telegramUserId }}</small></td>
                    <td data-label="Тип">{{ typeLabel(row.messageType) }}</td>
                    <td data-label="Сообщение" class="content">{{ row.content || 'Медиа / вложение без подписи' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (hasMore()) {
            <button class="load-more" type="button" (click)="loadMore()" [disabled]="loading()">{{ loading() ? 'Загружаем…' : 'Загрузить ещё' }}</button>
          }
        }
      </section>
    </main>
  `,
  styles: [`
    .logs-page { max-width: 1180px; margin: 0 auto; padding: 2rem 1.25rem 6rem; }
    .heading { padding: 1rem 0 1.5rem; border-bottom: 1px solid var(--tg-line); }
    .eyebrow { color: var(--tg-button, #aabd7e); font-size: .68rem; font-weight: 800; letter-spacing: .16em; }
    h1 { margin: .6rem 0 .4rem; font-size: clamp(2rem, 7vw, 4rem); font-weight: 500; }
    .heading p, .state { color: var(--tg-muted); font-size: .88rem; line-height: 1.5; }
    .panel { margin-top: 1rem; padding: 1rem; background: var(--tg-surface, #ffffff); border: 1px solid var(--tg-line); border-radius: 6px; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: .75rem; margin-bottom: .8rem; color: var(--tg-muted); font-size: .8rem; }
    button { min-height: 44px; padding: .55rem .8rem; border: 1px solid var(--tg-line); border-radius: 6px; background: transparent; color: var(--tg-text, #26372b); cursor: pointer; }
    button:disabled { opacity: .55; cursor: wait; }
    .state { display: grid; gap: .5rem; padding: 1.2rem .3rem; }
    .state strong { color: var(--tg-text, #26372b); }
    .error { color: #74500f; }
    :host-context(.dark-theme) .error { color: #f2be68; }
    .error button { width: fit-content; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: .82rem; }
    th { color: var(--tg-muted); font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
    th, td { padding: .8rem .65rem; border-bottom: 1px solid var(--tg-line); vertical-align: top; }
    td small { display: block; margin-top: .25rem; color: var(--tg-muted); font-size: .72rem; }
    .content { min-width: 240px; white-space: pre-wrap; overflow-wrap: anywhere; }
    .load-more { display: block; margin: 1rem auto 0; }
    .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
    @media (max-width: 700px) {
      .logs-page { padding: 1rem .75rem 6rem; }
      .panel { padding: .75rem; }
      table, tbody, tr, td { display: block; width: 100%; box-sizing: border-box; }
      thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
      tr { display: grid; gap: .35rem; padding: .75rem 0; border-bottom: 1px solid var(--tg-line); }
      td { display: grid; grid-template-columns: 6.2rem minmax(0, 1fr); gap: .55rem; padding: .2rem .1rem; border: 0; }
      td::before { content: attr(data-label); color: var(--tg-muted); font-size: .7rem; }
      .content { min-width: 0; }
    }
  `],
})
export class AdminBotLogsComponent implements OnInit {
  private readonly pageSize = 100;
  readonly logs = signal<BotMessageLogRow[] | null>(null);
  readonly loading = signal(false);
  readonly failed = signal(false);
  readonly hasMore = signal(false);

  constructor(private readonly api: EventsApiService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api.getAdminBotMessages(0, this.pageSize).subscribe((rows) => {
      this.logs.set(rows);
      this.hasMore.set(rows !== null && rows.length === this.pageSize);
      this.failed.set(rows === null);
      this.loading.set(false);
    });
  }

  loadMore(): void {
    const current = this.logs();
    if (!current || this.loading()) return;
    this.loading.set(true);
    this.api.getAdminBotMessages(current.length, this.pageSize).subscribe((rows) => {
      if (rows === null) {
        this.failed.set(true);
      } else {
        this.logs.update((existing) => [...(existing ?? []), ...rows]);
        this.hasMore.set(rows.length === this.pageSize);
      }
      this.loading.set(false);
    });
  }

  typeLabel(type: string): string {
    const labels: Record<string, string> = {
      text: 'Текст', photo: 'Фото', video: 'Видео', animation: 'Анимация', document: 'Файл',
      audio: 'Аудио', voice: 'Голосовое', video_note: 'Видеосообщение', sticker: 'Стикер',
      contact: 'Контакт', location: 'Геопозиция', venue: 'Место', poll: 'Опрос',
      successful_payment: 'Оплата', media: 'Медиа',
    };
    return labels[type] ?? type;
  }
}
