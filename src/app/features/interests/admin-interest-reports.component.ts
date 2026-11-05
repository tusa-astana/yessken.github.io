import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { InterestReport } from './interest.model';
import { InterestsApiService } from './interests-api.service';

@Component({
  selector: 'app-admin-interest-reports',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="moderation-page">
      <header>
        <p class="eyebrow">TUSA · МОДЕРАЦИЯ</p>
        <h1>Жалобы в интерес-группах</h1>
        <p>Проверяй сообщения о конкретных нарушениях. Ограничение аккаунта применяется вручную модератором.</p>
      </header>
      <div class="toolbar"><strong>{{ reports()?.length ?? '—' }} в очереди</strong><button type="button" (click)="refresh()" [disabled]="loading()">Обновить</button></div>
      @if (loading() && reports() === null) {
        <p class="state">Загружаем очередь…</p>
      } @else if (reports() === null) {
        <div class="state error" role="alert"><strong>Нет доступа или API недоступен</strong><span>Очередь доступна только администраторам TUSA в Telegram.</span><button type="button" (click)="refresh()">Повторить</button></div>
      } @else if (!reports()?.length) {
        <div class="state"><strong>Новых жалоб нет</strong><span>Очередь чиста.</span></div>
      } @else {
        <section class="report-list" aria-live="polite">
          @for (report of reports(); track report.id) {
            <article class="report-card">
              <div class="topline"><span>{{ report.interestName }}</span><time>{{ report.createdAt | date:'d MMM y, HH:mm' }}</time></div>
              <h2>{{ reasonLabel(report.reason) }}</h2>
              <p class="people">На участника: <strong>{{ report.targetName }}</strong> · Telegram ID {{ report.targetTelegramUserId }}</p>
              <p class="people">Отправитель: {{ report.reporterName }} · Telegram ID {{ report.reporterTelegramUserId }}</p>
              @if (report.details) { <blockquote>{{ report.details }}</blockquote> }
              @if (report.targetSuspended) { <p class="suspended">Аккаунт уже ограничен.</p> }
              <div class="actions">
                <button class="dismiss" type="button" [disabled]="busyId() !== null" (click)="review(report, 'dismiss')">Отклонить жалобу</button>
                @if (confirmingId() === report.id) {
                  <div class="confirm" role="group" aria-label="Подтверждение ограничения аккаунта">
                    <span>Исключить из интерес-групп?</span>
                    <button class="suspend" type="button" [disabled]="busyId() !== null" (click)="review(report, 'suspend')">Подтвердить</button>
                    <button type="button" [disabled]="busyId() !== null" (click)="confirmingId.set(null)">Отмена</button>
                  </div>
                } @else {
                  <button class="suspend" type="button" [disabled]="busyId() !== null || report.targetSuspended" (click)="confirmingId.set(report.id)">Ограничить аккаунт</button>
                }
              </div>
            </article>
          }
        </section>
      }
      @if (error()) { <p class="error-text" role="alert">{{ error() }}</p> }
      @if (announcement()) { <p class="success-text" role="status">{{ announcement() }}</p> }
      <a class="back-link" routerLink="/admin/event-review">← К модерации событий</a>
    </div>
  `,
  styles: [`
    .moderation-page { max-width: 900px; margin: 0 auto; padding: 1.5rem 1rem 6rem; color: var(--tg-text); }
    header { padding-bottom: 1rem; border-bottom: 1px solid var(--tg-line); }
    .eyebrow { color: var(--tg-muted); font-size: .64rem; font-weight: 850; letter-spacing: .15em; }
    h1 { margin: .4rem 0; font: 500 clamp(1.8rem, 6vw, 3rem) Georgia,serif; }
    header > p:last-child { color: var(--tg-muted); font-size: .78rem; line-height: 1.5; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; margin: .9rem 0; color: var(--tg-muted); font-size: .75rem; }
    button { padding: .55rem .7rem; border: 1px solid var(--tg-line); border-radius: 6px; background: transparent; color: var(--tg-text); font: inherit; font-size: .68rem; cursor: pointer; }
    button:disabled { opacity: .5; cursor: wait; }
    .state { display: grid; justify-items: center; gap: .5rem; padding: 2rem 1rem; border: 1px solid var(--tg-line); border-radius: 9px; color: var(--tg-muted); text-align: center; }
    .state strong { color: var(--tg-text); }
    .state.error { color: #d88778; }
    .report-list { display: grid; gap: .7rem; }
    .report-card { padding: .95rem; border: 1px solid var(--tg-line); border-radius: 9px; background: var(--tg-surface); }
    .topline { display: flex; justify-content: space-between; gap: .5rem; color: var(--tg-muted); font-size: .62rem; }
    h2 { margin: .55rem 0 .35rem; font: 500 1.2rem Georgia,serif; }
    .people { margin: .25rem 0; color: var(--tg-muted); font-size: .67rem; }
    .people strong { color: var(--tg-text); }
    blockquote { margin: .65rem 0; padding: .6rem .75rem; border-left: 2px solid var(--tg-button); background: rgba(127,127,127,.06); font-size: .72rem; white-space: pre-wrap; }
    .actions, .confirm { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; margin-top: .8rem; }
    .dismiss { color: var(--tg-muted); }
    .suspend { border-color: rgba(193,103,87,.5); color: #c76c60; font-weight: 750; }
    .confirm { margin-top: 0; color: #c76c60; font-size: .67rem; }
    .suspended, .success-text { color: var(--tg-button); font-size: .72rem; }
    .error-text { color: #c76c60; font-size: .72rem; }
    .back-link { display: inline-block; margin-top: 1rem; color: var(--tg-button); font-size: .72rem; text-decoration: none; }
  `],
})
export class AdminInterestReportsComponent implements OnInit {
  private readonly api = inject(InterestsApiService);
  readonly reports = signal<InterestReport[] | null>(null);
  readonly loading = signal(false);
  readonly busyId = signal<string | null>(null);
  readonly confirmingId = signal<string | null>(null);
  readonly error = signal('');
  readonly announcement = signal('');

  ngOnInit(): void {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    const reports = await this.api.loadReports();
    this.reports.set(reports);
    this.loading.set(false);
  }

  async review(report: InterestReport, action: 'dismiss' | 'suspend'): Promise<void> {
    this.busyId.set(report.id);
    this.error.set('');
    const saved = await this.api.reviewReport(report.id, action);
    this.busyId.set(null);
    this.confirmingId.set(null);
    if (!saved) {
      this.error.set('Не получилось сохранить решение. Обнови очередь и попробуй ещё раз.');
      return;
    }
    this.reports.update((current) => current?.filter((item) => item.id !== report.id) ?? null);
    this.announcement.set(action === 'suspend'
      ? `Аккаунт ${report.targetName} ограничен и удалён из интерес-групп.`
      : 'Жалоба закрыта без ограничения аккаунта.');
  }

  reasonLabel(reason: string): string {
    return ({
      spam: 'Спам',
      harassment: 'Оскорбления или преследование',
      impersonation: 'Выдаёт себя за другого',
      unsafe: 'Небезопасное поведение',
      other: 'Другое нарушение правил',
    } as Record<string, string>)[reason] ?? 'Жалоба';
  }
}
