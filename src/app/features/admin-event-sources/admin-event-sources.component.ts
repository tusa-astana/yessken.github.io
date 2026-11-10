import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { exhaustMap, filter, from, interval } from 'rxjs';
import { EventSourceCandidate, EventSourcesApiService } from './event-sources-api.service';

@Component({
  selector: 'app-admin-event-sources',
  imports: [CommonModule, DatePipe, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="source-review">
      <header>
        <p class="eyebrow">TUSA · ИМПОРТ ИЗ ИСТОЧНИКОВ</p>
        <h1>Найденные публикации</h1>
        <p>RSS приносит сюда только кандидатов. Проверь первоисточник и будущую дату; после заполнения карточка попадёт в обычную очередь модерации, а не опубликуется автоматически.</p>
        <a routerLink="/admin/event-review">Обычная очередь публикаций →</a>
      </header>

      <div class="toolbar"><strong>{{ candidates()?.length ?? '—' }} на проверке</strong><span class="auto-refresh">Автообновление раз в минуту</span><button type="button" (click)="refresh()" [disabled]="loading()">Обновить</button></div>
      @if (loading() && candidates() === null) {
        <p class="state" role="status">Загружаем публикации…</p>
      } @else if (candidates() === null) {
        <div class="state error" role="alert"><strong>Не удалось загрузить список</strong><span>Доступен только администратору TUSA из Telegram.</span><button type="button" (click)="refresh()">Повторить</button></div>
      } @else if (!candidates()?.length) {
        <div class="state"><strong>Новых публикаций нет</strong><span>Фоновая синхронизация проверяет включённые публичные RSS-источники.</span></div>
      } @else {
        <section class="candidate-list" aria-label="Импортированные публикации">
          @for (candidate of candidates(); track candidate.id) {
            <article class="candidate">
              <div class="source-line"><span>{{ candidate.sourceName }} · {{ candidate.hobbyId }}</span>@if (candidate.eventDate) { <time>Дата события: {{ candidate.eventDate | date:'d MMM y':'UTC' }}</time> }@else if (candidate.publishedAtUtc) { <time>Публикация: {{ candidate.publishedAtUtc | date:'d MMM y, HH:mm' }}</time> }</div>
              <h2>{{ candidate.title }}</h2>
              @if (candidate.summary) { <p class="summary">{{ candidate.summary }}</p> }
              <a class="source-link" [href]="candidate.sourceUrl" target="_blank" rel="noopener noreferrer">Проверить оригинальную публикацию ↗</a>

              @if (candidate.status === 'converted') {
                <p class="moderation-status">Карточка создана и ожидает обычной модерации.</p>
                <a routerLink="/admin/event-review" class="review-link">Перейти к очереди заявок →</a>
              } @else if (selectedId() === candidate.id) {
                <form [formGroup]="form" (ngSubmit)="convert(candidate)" class="convert-form">
                  <p class="form-note">Проверь источник, дату и место. RSS-текст — только подсказка; описание напиши своими словами. Кандидат не подтверждён и не публикуется автоматически.</p>
                  <label class="permission-check"><input type="checkbox" formControlName="sourcePermissionConfirmed" /> Я проверил(а) источник и подтвердил(а), что можно разместить краткую карточку со ссылкой на него.</label>
                  <label>Название события<input formControlName="title" maxlength="120" /></label>
                  <div class="date-time">
                    <label>Дата в Астане<input type="date" [min]="minDate" formControlName="date" /></label>
                    <label>Время<input type="time" formControlName="time" /></label>
                  </div>
                  <label>Место проведения<input formControlName="place" maxlength="160" /></label>
                  <div class="date-time">
                    <label>Категория события<input formControlName="category" maxlength="80" /></label>
                    <label>Хобби ID<input formControlName="hobbyId" maxlength="60" readonly /></label>
                  </div>
                  <label>Краткое описание<textarea formControlName="description" rows="4" maxlength="3000"></textarea></label>
                  <div class="form-actions">
                    <button class="primary" type="submit" [disabled]="form.invalid || busyId() !== null">{{ busyId() === candidate.id ? 'Создаём заявку…' : 'Создать черновик на модерацию' }}</button>
                    <button type="button" (click)="selectedId.set(null)" [disabled]="busyId() !== null">Отмена</button>
                  </div>
                </form>
              } @else {
                <div class="actions">
                  <button class="primary" type="button" (click)="select(candidate)">Проверить и оформить</button>
                  <button class="dismiss" type="button" (click)="dismiss(candidate)" [disabled]="busyId() !== null">Не событие · скрыть</button>
                </div>
              }
            </article>
          }
        </section>
      }
      @if (error()) { <p class="message error" role="alert">{{ error() }}</p> }
      @if (announcement()) { <p class="message" role="status">{{ announcement() }}</p> }
    </main>
  `,
  styles: [`
    .source-review { max-width: 900px; margin: 0 auto; padding: 1.5rem 1rem 6rem; color: var(--tg-text); }
    header { padding-bottom: 1rem; border-bottom: 1px solid var(--tg-line); }
    .eyebrow { color: var(--tg-muted); font-size: .64rem; font-weight: 850; letter-spacing: .15em; }
    h1 { margin: .4rem 0; font: 500 clamp(1.8rem, 6vw, 3rem) Georgia,serif; }
    header > p:not(.eyebrow) { max-width: 44rem; color: var(--tg-muted); font-size: .78rem; line-height: 1.55; }
    header > a, .source-link { color: var(--tg-button); font-size: .75rem; text-decoration: none; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; margin: .9rem 0; color: var(--tg-muted); font-size: .75rem; }
    .auto-refresh { margin-left: auto; font-size: .68rem; }
    button { min-height: 40px; padding: .55rem .75rem; border: 1px solid var(--tg-line); border-radius: 7px; background: transparent; color: var(--tg-text); font: inherit; font-size: .7rem; font-weight: 700; cursor: pointer; }
    button:disabled { opacity: .5; cursor: wait; }
    .candidate-list { display: grid; gap: .75rem; }
    .candidate { padding: 1rem; border: 1px solid var(--tg-line); border-radius: 10px; background: var(--tg-surface); }
    .source-line { display: flex; justify-content: space-between; flex-wrap: wrap; gap: .4rem; color: var(--tg-muted); font-size: .65rem; }
    .candidate h2 { margin: .55rem 0 .35rem; font-size: 1.05rem; }
    .summary, .form-note { color: var(--tg-muted); font-size: .74rem; line-height: 1.5; }
    .actions, .form-actions { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .5rem; }
    .primary { border-color: var(--tg-button); background: var(--tg-button); color: var(--tg-button-text); }
    .dismiss { color: var(--tg-muted); }
    .convert-form { display: grid; gap: .55rem; margin-top: .6rem; padding-top: .7rem; border-top: 1px solid var(--tg-line); }
    .convert-form label { display: grid; gap: .25rem; color: var(--tg-muted); font-size: .66rem; font-weight: 700; }
    .convert-form input, .convert-form textarea { width: 100%; box-sizing: border-box; padding: .55rem .6rem; border: 1px solid var(--tg-line); border-radius: 6px; background: var(--tg-bg); color: var(--tg-text); font: inherit; font-weight: 400; }
    .convert-form textarea { resize: vertical; }
    .date-time { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
    .permission-check { display: flex !important; align-items: flex-start; gap: .5rem !important; font-weight: 500 !important; line-height: 1.4; }
    .permission-check input { width: 1rem; min-height: 1rem; flex: 0 0 auto; margin: .15rem 0 0; }
    .state { display: grid; justify-items: center; gap: .45rem; padding: 2rem 1rem; border: 1px solid var(--tg-line); border-radius: 9px; color: var(--tg-muted); text-align: center; }
    .state strong { color: var(--tg-text); }
    .state.error, .message.error { color: #b94d42; }
    .message { color: var(--tg-button); font-size: .75rem; }
    @media (max-width: 540px) { .date-time { grid-template-columns: 1fr; } .form-actions > button { flex: 1; } }
  `],
})
export class AdminEventSourcesComponent implements OnInit {
  private readonly api = inject(EventSourcesApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly candidates = signal<EventSourceCandidate[] | null>(null);
  readonly loading = signal(false);
  readonly selectedId = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly error = signal('');
  readonly announcement = signal('');
  readonly minDate = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    date: ['', Validators.required],
    time: [''],
    place: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    category: ['событие', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    hobbyId: ['', [Validators.required, Validators.maxLength(60)]],
    description: ['', Validators.maxLength(3000)],
    sourcePermissionConfirmed: [false, Validators.requiredTrue],
  });

  ngOnInit(): void {
    void this.refresh();
    interval(60_000).pipe(
      filter(() => typeof document === 'undefined' || document.visibilityState === 'visible'),
      exhaustMap(() => from(this.api.loadPending())),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((items) => {
      if (items !== null) this.candidates.set(items);
    });
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.candidates.set(await this.api.loadPending());
    this.loading.set(false);
  }

  select(candidate: EventSourceCandidate): void {
    this.selectedId.set(candidate.id);
    this.form.reset({
      title: candidate.title,
      date: candidate.eventDate ?? '',
      time: '',
      place: '',
      category: 'соревнование',
      hobbyId: candidate.hobbyId,
      description: '',
      sourcePermissionConfirmed: false,
    });
  }

  async convert(candidate: EventSourceCandidate): Promise<void> {
    if (this.form.invalid || this.busyId()) return;
    this.busyId.set(candidate.id);
    this.error.set('');
    this.announcement.set('');
    const eventId = await this.api.convert(candidate.id, this.form.getRawValue());
    this.busyId.set(null);
    if (!eventId) {
      this.error.set('Не удалось создать заявку. Проверь дату и место; проверь, не обработал ли кандидат другой администратор.');
      return;
    }
    this.candidates.update((items) => items?.map((item) => item.id === candidate.id
      ? { ...item, status: 'converted', eventId }
      : item) ?? null);
    this.selectedId.set(null);
    this.announcement.set('Создана заявка на обычную модерацию. Событие ещё не опубликовано.');
  }

  async dismiss(candidate: EventSourceCandidate): Promise<void> {
    if (this.busyId()) return;
    this.busyId.set(candidate.id);
    this.error.set('');
    const saved = await this.api.dismiss(candidate.id);
    this.busyId.set(null);
    if (!saved) {
      this.error.set('Не удалось скрыть публикацию. Обнови список и попробуй ещё раз.');
      return;
    }
    this.candidates.update((items) => items?.filter((item) => item.id !== candidate.id) ?? null);
  }
}
