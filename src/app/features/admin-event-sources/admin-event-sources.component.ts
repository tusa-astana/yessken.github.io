import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { exhaustMap, filter, from, interval } from 'rxjs';
import { compressEventImage } from '../../core/utils/event-image.util';
import { ConvertEventSourceBatchItemRequest, EventSourceCandidate, EventSourcesApiService } from './event-sources-api.service';

interface BatchDraftRow extends ConvertEventSourceBatchItemRequest {
  id: string;
  sourceName: string;
  sourceUrl: string;
  hobbyId: string;
  eventTime: string;
  eventPlace: string;
  suggestedCategory: string;
  sourceSummary: string;
  included: boolean;
  imagePermissionConfirmed: boolean;
  descriptionPermissionConfirmed: boolean;
}

type BatchDraftField = 'title' | 'date' | 'time' | 'place' | 'category' | 'description';

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

      <div class="toolbar">
        <strong>{{ candidates()?.length ?? '—' }} на проверке</strong>
        @if (pendingCount() > 0) { <button class="primary" type="button" (click)="startBatch()" [disabled]="batchSaving()">Оформить списком · {{ pendingCount() }}</button> }
        <span class="auto-refresh">Автообновление раз в минуту</span>
        <button type="button" (click)="refresh()" [disabled]="loading() || batchSaving()">Обновить</button>
      </div>
      @if (loading() && candidates() === null) {
        <p class="state" role="status">Загружаем публикации…</p>
      } @else if (candidates() === null) {
        <div class="state error" role="alert"><strong>Не удалось загрузить список</strong><span>Доступен только администратору TUSA из Telegram.</span><button type="button" (click)="refresh()">Повторить</button></div>
      } @else if (!candidates()?.length) {
        <div class="state"><strong>Новых публикаций нет</strong><span>Фоновая синхронизация проверяет включённые публичные RSS-источники.</span></div>
      } @else {
        @if (batchMode()) {
          <form class="batch-form" (submit)="onBatchSubmit($event)">
            <header class="batch-heading">
              <div><h2>Пакетное оформление</h2><p>Проверь каждую строку. Будут созданы только черновики для обычной модерации — публикации не появятся автоматически.</p></div>
              <span>{{ selectedBatchCount() }} из {{ batchRows().length }} выбрано</span>
            </header>
            <label class="permission-check batch-permission">
              <input type="checkbox" [checked]="batchPermissionConfirmed()" (change)="setBatchPermissionConfirmed($event)" />
              Я проверил(а) первоисточник, будущую дату и место, а также право разместить краткую карточку со ссылкой для каждой выбранной публикации.
            </label>
            @for (row of batchRows(); track row.id) {
              <fieldset class="batch-row">
                <legend>
                  <input type="checkbox" [checked]="row.included" [attr.aria-label]="'Включить ' + row.title" (change)="toggleBatchRow(row.id, $event)" />
                  {{ row.sourceName }} · {{ row.hobbyId }}
                </legend>
                <a class="source-link" [href]="row.sourceUrl" target="_blank" rel="noopener noreferrer">Проверить оригинальную публикацию ↗</a>
                @if (row.eventTime || row.eventPlace || row.suggestedCategory) {
                  <p class="parser-hints">Подсказки парсера: {{ row.eventTime || 'время не найдено' }} · {{ row.eventPlace || 'место не найдено' }} · {{ row.suggestedCategory || 'категория не определена' }}</p>
                }
                @if (row.included) {
                  <label>Название<input [value]="row.title" maxlength="120" (input)="updateBatchField(row.id, 'title', $event)" /></label>
                  <div class="date-time">
                    <label>Дата в Астане<input type="date" [min]="minDate" [value]="row.date" (input)="updateBatchField(row.id, 'date', $event)" /></label>
                    <label>Время<input type="time" [value]="row.time" (input)="updateBatchField(row.id, 'time', $event)" /></label>
                  </div>
                  <label>Место проведения<input [value]="row.place" maxlength="160" (input)="updateBatchField(row.id, 'place', $event)" /></label>
                  <label>Категория события<input [value]="row.category" maxlength="80" (input)="updateBatchField(row.id, 'category', $event)" /></label>
                  <label>Описание (подсказка RSS отредактируй перед публикацией)<textarea [value]="row.description" rows="3" maxlength="3000" (input)="updateBatchField(row.id, 'description', $event)"></textarea></label>
                  @if (row.description.trim()) { <label class="image-permission"><input type="checkbox" [checked]="row.descriptionPermissionConfirmed" (change)="setBatchDescriptionPermission(row.id, $event)" /> Подтверждаю право использовать этот текст описания.</label> }
                  <label>Обложка (необязательно)
                    <input type="file" accept="image/png,image/jpeg,image/webp" [disabled]="imageUploadingIds().has(row.id) || batchSaving()" (change)="selectBatchImage(row.id, $event)" />
                    <small class="image-help">Загрузи разрешённое изображение. Оно сожмётся и сохранится в TUSA, не зависит от внешнего сайта.</small>
                  </label>
                  @if (imageUploadingIds().has(row.id)) { <p class="image-help" role="status">Сжимаем обложку…</p> }
                  @if (row.imageUrl) {
                    <label class="image-permission"><input type="checkbox" [checked]="row.imagePermissionConfirmed" (change)="setBatchImagePermission(row.id, $event)" /> Подтверждаю право TUSA разместить эту обложку.</label>
                    <img class="batch-image-preview" [src]="row.imageUrl" [alt]="'Предпросмотр обложки ' + row.title" />
                  }
                }
              </fieldset>
            }
            @if (batchError()) { <p class="form-error" role="alert">{{ batchError() }}</p> }
            <div class="form-actions">
              <button class="primary" type="submit" [disabled]="batchSaving() || imageUploadingIds().size > 0 || selectedBatchCount() === 0">{{ batchSaving() ? 'Отправляем пакет…' : 'Создать черновики · ' + selectedBatchCount() }}</button>
              <button type="button" (click)="cancelBatch()" [disabled]="batchSaving()">Отмена</button>
            </div>
          </form>
        } @else {
        <section class="candidate-list" aria-label="Импортированные публикации">
          @for (candidate of candidates(); track candidate.id) {
            <article class="candidate">
              <div class="source-line"><span>{{ candidate.sourceName }} · {{ candidate.hobbyId }}</span>@if (candidate.eventDate) { <time>Дата события: {{ candidate.eventDate | date:'d MMM y':'UTC' }}</time> }@else if (candidate.publishedAtUtc) { <time>Публикация: {{ candidate.publishedAtUtc | date:'d MMM y, HH:mm' }}</time> }</div>
              @if (candidate.eventTime || candidate.eventPlace || candidate.suggestedCategory) { <p class="parser-hints">Подсказки парсера: {{ candidate.eventTime || 'время не найдено' }} · {{ candidate.eventPlace || 'место не найдено' }} · {{ candidate.suggestedCategory || 'категория не определена' }}</p> }
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
                  <label>Описание (подсказка RSS — проверь и отредактируй)<textarea formControlName="description" rows="4" maxlength="3000" (input)="resetSingleDescriptionPermission()"></textarea></label>
                  @if (form.controls.description.value.trim()) { <label class="image-permission"><input type="checkbox" formControlName="descriptionPermissionConfirmed" /> Подтверждаю право использовать этот текст описания.</label> }
                  <label>Обложка события (необязательно)
                    <input type="file" accept="image/png,image/jpeg,image/webp" [disabled]="singleImageUploading() || busyId() !== null" (change)="selectSingleImage($event)" />
                    <small class="image-help">Используй изображение, которое разрешено размещать. Оно сожмётся и сохранится в событии.</small>
                  </label>
                  @if (singleImageUploading()) { <p class="image-help" role="status">Сжимаем обложку…</p> }
                  @if (form.controls.imageUrl.value) {
                    <label class="image-permission"><input type="checkbox" formControlName="imagePermissionConfirmed" /> Подтверждаю право TUSA разместить эту обложку.</label>
                    <img class="batch-image-preview" [src]="form.controls.imageUrl.value" [alt]="'Предпросмотр обложки ' + form.controls.title.value" />
                  }
                  <p class="required-note">Для черновика нужны название, будущая дата, место, категория и подтверждение разрешения на краткую карточку.</p>
                  @if (formError()) { <p class="form-error" role="alert">{{ formError() }}</p> }
                  <div class="form-actions">
                    <button class="primary" type="submit" [disabled]="busyId() !== null">{{ busyId() === candidate.id ? 'Создаём заявку…' : 'Создать черновик на модерацию' }}</button>
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
    .required-note { margin: 0; color: var(--tg-muted); font-size: .68rem; line-height: 1.45; }
    .parser-hints { margin: .35rem 0; color: var(--tg-muted); font-size: .69rem; line-height: 1.45; }
    .form-error { margin: 0; color: #b94d42; font-size: .72rem; line-height: 1.45; }
    .batch-form { display: grid; gap: .7rem; margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--tg-button); border-radius: 10px; background: var(--tg-surface); }
    .batch-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: .75rem; }
    .batch-heading h2 { margin: 0 0 .25rem; font-size: 1rem; }
    .batch-heading p, .batch-heading > span { margin: 0; color: var(--tg-muted); font-size: .7rem; line-height: 1.45; }
    .batch-row { display: grid; gap: .55rem; min-width: 0; margin: 0; padding: .8rem; border: 1px solid var(--tg-line); border-radius: 8px; }
    .batch-row legend { padding: 0 .25rem; color: var(--tg-text); font-size: .7rem; font-weight: 800; }
    .batch-row legend input { width: 1rem; min-height: 1rem; vertical-align: middle; }
    .batch-row > label { display: grid; gap: .25rem; color: var(--tg-muted); font-size: .66rem; font-weight: 700; }
    .batch-row input:not([type="checkbox"]), .batch-row textarea { width: 100%; box-sizing: border-box; padding: .55rem .6rem; border: 1px solid var(--tg-line); border-radius: 6px; background: var(--tg-bg); color: var(--tg-text); font: inherit; font-weight: 400; }
    .batch-row textarea { resize: vertical; }
    .batch-image-preview { display: block; width: min(100%, 22rem); max-height: 15rem; object-fit: cover; border-radius: 7px; background: var(--tg-bg); }
    .image-help { margin: 0; color: var(--tg-muted); font-size: .66rem; line-height: 1.45; }
    .image-permission { display: flex !important; align-items: flex-start; gap: .5rem !important; color: var(--tg-text) !important; font-size: .68rem !important; font-weight: 600 !important; line-height: 1.45; }
    .image-permission input { width: 1rem; min-height: 1rem; flex: 0 0 auto; margin: .15rem 0 0; }
    .batch-row .source-link { justify-self: start; }
    .batch-permission { display: flex !important; align-items: flex-start; gap: .5rem !important; color: var(--tg-text) !important; font-size: .72rem !important; font-weight: 600 !important; line-height: 1.45; }
    .batch-permission input { width: 1rem; min-height: 1rem; flex: 0 0 auto; margin: .15rem 0 0; }
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
    @media (max-width: 540px) { .date-time { grid-template-columns: 1fr; } .form-actions > button { flex: 1; } .batch-heading { flex-direction: column; } }
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
  readonly formError = signal('');
  readonly announcement = signal('');
  readonly batchMode = signal(false);
  readonly batchRows = signal<BatchDraftRow[]>([]);
  readonly batchPermissionConfirmed = signal(false);
  readonly batchSaving = signal(false);
  readonly batchError = signal('');
  readonly imageUploadingIds = signal<ReadonlySet<string>>(new Set());
  readonly singleImageUploading = signal(false);
  readonly pendingCount = computed(() => this.candidates()?.filter((candidate) => candidate.status === 'pending').length ?? 0);
  readonly selectedBatchCount = computed(() => this.batchRows().filter((row) => row.included).length);
  readonly minDate = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    date: ['', Validators.required],
    time: [''],
    place: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    category: ['событие', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    hobbyId: ['', [Validators.required, Validators.maxLength(60)]],
    description: ['', Validators.maxLength(3000)],
    descriptionPermissionConfirmed: [false],
    imageUrl: [''],
    imagePermissionConfirmed: [false],
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
    this.formError.set('');
    this.form.reset({
      title: candidate.title,
      date: candidate.eventDate ?? '',
      time: candidate.eventTime ?? '',
      place: candidate.eventPlace ?? '',
      category: candidate.suggestedCategory || this.defaultBatchCategory(candidate.hobbyId),
      hobbyId: candidate.hobbyId,
      description: candidate.summary,
      descriptionPermissionConfirmed: false,
      imageUrl: '',
      imagePermissionConfirmed: false,
      sourcePermissionConfirmed: false,
    });
  }

  async selectSingleImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.singleImageUploading.set(true);
    this.formError.set('');
    try {
      this.form.patchValue({ imageUrl: await compressEventImage(file) });
      this.form.controls.imagePermissionConfirmed.setValue(false);
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : 'Не удалось подготовить обложку.');
    } finally {
      this.singleImageUploading.set(false);
    }
  }

  startBatch(): void {
    const pending = this.candidates()?.filter((candidate) => candidate.status === 'pending') ?? [];
    if (!pending.length || this.batchSaving()) return;
    this.selectedId.set(null);
    this.batchRows.set(pending.map((candidate) => ({
      id: candidate.id,
      sourceName: candidate.sourceName,
      sourceUrl: candidate.sourceUrl,
      hobbyId: candidate.hobbyId,
      eventTime: candidate.eventTime ?? '',
      eventPlace: candidate.eventPlace ?? '',
      suggestedCategory: candidate.suggestedCategory ?? '',
      sourceSummary: candidate.summary,
      included: true,
      candidateId: candidate.id,
      title: candidate.title,
      date: candidate.eventDate ?? '',
      time: candidate.eventTime ?? '',
      place: candidate.eventPlace ?? '',
      category: candidate.suggestedCategory || this.defaultBatchCategory(candidate.hobbyId),
      description: candidate.summary,
      imageUrl: '',
      imagePermissionConfirmed: false,
      descriptionPermissionConfirmed: false,
    })));
    this.batchPermissionConfirmed.set(false);
    this.batchError.set('');
    this.announcement.set('');
    this.batchMode.set(true);
  }

  cancelBatch(): void {
    if (this.batchSaving()) return;
    this.batchMode.set(false);
    this.batchRows.set([]);
    this.batchError.set('');
  }

  toggleBatchRow(id: string, event: Event): void {
    const included = (event.target as HTMLInputElement).checked;
    this.batchRows.update((rows) => rows.map((row) => row.id === id ? { ...row, included } : row));
    this.batchError.set('');
  }

  updateBatchField(id: string, field: BatchDraftField, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.batchRows.update((rows) => rows.map((row) => row.id === id
      ? { ...row, [field]: value, ...(field === 'description' ? { descriptionPermissionConfirmed: false } : {}) }
      : row));
    this.batchError.set('');
  }

  setBatchDescriptionPermission(id: string, event: Event): void {
    const confirmed = (event.target as HTMLInputElement).checked;
    this.batchRows.update((rows) => rows.map((row) => row.id === id ? { ...row, descriptionPermissionConfirmed: confirmed } : row));
    this.batchError.set('');
  }

  resetSingleDescriptionPermission(): void {
    this.form.controls.descriptionPermissionConfirmed.setValue(false);
    this.formError.set('');
  }

  setBatchPermissionConfirmed(event: Event): void {
    this.batchPermissionConfirmed.set((event.target as HTMLInputElement).checked);
    this.batchError.set('');
  }

  async selectBatchImage(id: string, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.imageUploadingIds.update((ids) => new Set(ids).add(id));
    this.batchError.set('');
    try {
      const imageUrl = await compressEventImage(file);
      this.batchRows.update((rows) => rows.map((row) => row.id === id ? { ...row, imageUrl, imagePermissionConfirmed: false } : row));
    } catch (error) {
      this.batchError.set(error instanceof Error ? error.message : 'Не удалось подготовить обложку.');
    } finally {
      this.imageUploadingIds.update((ids) => {
        const next = new Set(ids);
        next.delete(id);
        return next;
      });
    }
  }

  setBatchImagePermission(id: string, event: Event): void {
    const confirmed = (event.target as HTMLInputElement).checked;
    this.batchRows.update((rows) => rows.map((row) => row.id === id ? { ...row, imagePermissionConfirmed: confirmed } : row));
    this.batchError.set('');
  }

  onBatchSubmit(event: Event): void {
    event.preventDefault();
    void this.convertBatch();
  }

  async convertBatch(): Promise<void> {
    if (this.batchSaving() || this.imageUploadingIds().size > 0) return;
    const selected = this.batchRows().filter((row) => row.included);
    if (!selected.length) {
      this.batchError.set('Выбери хотя бы одну публикацию.');
      return;
    }
    if (!this.batchPermissionConfirmed()) {
      this.batchError.set('Подтверди проверку источника, даты/места и право на размещение для каждой выбранной строки.');
      return;
    }
    const missingImagePermission = selected.some((row) => !!row.imageUrl && !row.imagePermissionConfirmed);
    if (missingImagePermission) {
      this.batchError.set('Подтверди право размещения обложки у каждой выбранной строки, где загружено изображение.');
      return;
    }
    if (selected.some((row) => !!row.description.trim() && !row.descriptionPermissionConfirmed)) {
      this.batchError.set('Подтверди право использовать текст описания у каждой выбранной строки или перепиши/очисти подсказку.');
      return;
    }
    const invalid = selected.some((row) => row.title.trim().length < 3 || row.title.trim().length > 120 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || row.date < this.minDate ||
      (row.time.trim() !== '' && !/^\d{2}:\d{2}$/.test(row.time)) ||
      row.place.trim().length < 2 || row.place.trim().length > 160 ||
      row.category.trim().length < 2 || row.category.trim().length > 80 ||
      row.description.trim().length > 3000);
    if (invalid) {
      this.batchError.set('Проверь название, будущую дату, место и категорию в каждой выбранной строке.');
      return;
    }

    this.batchSaving.set(true);
    this.batchError.set('');
    const created = await this.api.convertBatch({
      sourcePermissionConfirmed: true,
      items: selected.map(({ candidateId, title, date, time, place, category, description, imageUrl, imagePermissionConfirmed, descriptionPermissionConfirmed }) => ({
        candidateId, title: title.trim(), date, time: time.trim(), place: place.trim(), category: category.trim(), description: description.trim(), imageUrl, imagePermissionConfirmed, descriptionPermissionConfirmed,
      })),
    });
    this.batchSaving.set(false);
    if (!created) {
      this.batchError.set('Пакет не сохранён. Обнови список: возможно, публикации уже обработал другой администратор.');
      return;
    }

    const eventByCandidate = new Map(created.map((item) => [item.candidateId, item.eventId]));
    this.candidates.update((items) => items?.map((candidate) => eventByCandidate.has(candidate.id)
      ? { ...candidate, status: 'converted', eventId: eventByCandidate.get(candidate.id) ?? null }
      : candidate) ?? null);
    this.batchMode.set(false);
    this.batchRows.set([]);
    this.announcement.set(`Создано черновиков: ${created.length}. Они ожидают обычной модерации и не опубликованы.`);
  }

  private defaultBatchCategory(hobbyId: string): string {
    switch (hobbyId) {
      case 'equestrian': return 'соревнование';
      case 'live-music': return 'концерт';
      case 'performing-arts': return 'спектакль';
      case 'football': return 'матч';
      default: return 'событие';
    }
  }

  async convert(candidate: EventSourceCandidate): Promise<void> {
    if (this.busyId() || this.singleImageUploading()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const missing = [
        ['title', 'название'],
        ['date', 'будущую дату'],
        ['place', 'место проведения'],
        ['category', 'категорию'],
        ['hobbyId', 'хобби'],
        ['sourcePermissionConfirmed', 'подтверждение разрешения'],
      ] as const;
      const incomplete = missing
        .filter(([name]) => this.form.controls[name].invalid)
        .map(([, label]) => label);
      this.formError.set(`Заполни или подтверди: ${incomplete.join(', ')}.`);
      return;
    }
    if (this.form.controls.imageUrl.value && !this.form.controls.imagePermissionConfirmed.value) {
      this.formError.set('Подтверди право размещать выбранную обложку.');
      return;
    }
    if (this.form.controls.description.value.trim() && !this.form.controls.descriptionPermissionConfirmed.value) {
      this.formError.set('Подтверди право использовать текст описания или перепиши/очисти подсказку источника.');
      return;
    }
    this.formError.set('');
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
