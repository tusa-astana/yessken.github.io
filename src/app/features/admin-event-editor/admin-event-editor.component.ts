import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EventsApiService } from '../../core/services/events-api.service';
import { compressEventImage } from '../../core/utils/event-image.util';
import type { AdminEditableEvent } from '../../core/types/event.model';

@Component({
  selector: 'app-admin-event-editor',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="editor-page">
      <header>
        <p class="eyebrow">TUSA · ADMIN</p>
        <h1>Редактирование событий</h1>
        <p>Можно исправить карточку и загрузить разрешённую обложку. Загруженное изображение оптимизируется и хранится вместе с событием, чтобы карточка не зависела от внешней ссылки.</p>
        <nav aria-label="Инструменты модерации">
          <a routerLink="/admin/event-review">Очередь заявок</a>
          <a routerLink="/admin/event-sources">Источники событий</a>
        </nav>
      </header>

      <div class="toolbar">
        <strong>{{ events()?.length ?? '—' }} событий</strong>
        <button type="button" (click)="refresh()" [disabled]="loading()">Обновить</button>
      </div>

      @if (loading() && events() === null) {
        <p class="state" role="status">Загружаем события…</p>
      } @else if (events() === null) {
        <div class="state error" role="alert">
          <strong>Не удалось загрузить список</strong>
          <span>Управление доступно только администратору в Telegram. Проверь доступ к API и попробуй снова.</span>
          <button type="button" (click)="refresh()">Повторить</button>
        </div>
      } @else if (!events()?.length) {
        <p class="state">Пока нет событий для редактирования.</p>
      } @else {
        <section class="event-list" aria-label="События">
          @for (event of events(); track event.id) {
            <article class="event-card">
              <div class="event-summary">
                <div>
                  <span class="status" [class.pending]="event.status === 'pending'">{{ event.status === 'pending' ? 'На модерации' : 'Опубликовано' }}</span>
                  <h2>{{ event.title }}</h2>
                  <p>{{ formatDate(event.date) }} · {{ event.place }}</p>
                  <small>{{ event.imageUrl ? 'Обложка добавлена' : 'Без обложки' }}</small>
                </div>
                @if (selectedId() !== event.id) {
                  <button type="button" (click)="edit(event)">Редактировать</button>
                }
              </div>

              @if (selectedId() === event.id) {
                <form [formGroup]="form" (ngSubmit)="save(event)" class="edit-form">
                  <label>Название<input formControlName="title" maxlength="120" /></label>
                  <div class="two-columns">
                    <label>Дата<input type="date" formControlName="date" /></label>
                    <label>Время<input type="time" formControlName="time" /></label>
                  </div>
                  <label>Место<input formControlName="place" maxlength="160" /></label>
                  <label>Категория<input formControlName="category" maxlength="80" /></label>
                  <label>Описание<textarea formControlName="description" rows="4" maxlength="3000"></textarea></label>
                  <label>Прямая ссылка на изображение (необязательно)
                    <input type="text" inputmode="url" [value]="isUploadedImage(form.controls.imageUrl.value) ? '' : form.controls.imageUrl.value" placeholder="https://…/poster.jpg" (input)="onImageUrlInput($event)" />
                  </label>
                  <label>Или загрузить файл обложки
                    <input type="file" accept="image/png,image/jpeg,image/webp" [disabled]="imageUploading() || savingId() !== null" (change)="selectImageFile($event)" />
                  </label>
                  <p class="help">Загруженное разрешённое изображение сжимается в WebP и сохраняется в TUSA. Для внешней ссылки нужен прямой HTTPS URL файла, а не страница афиши; сайт может запрещать hotlink. Очисти URL и оставь поле пустым, чтобы убрать обложку.</p>
                  @if (imageUploading()) { <p class="help" role="status">Сжимаем обложку…</p> }
                  @if (imageError()) { <p class="preview-error" role="alert">{{ imageError() }}</p> }
                  @if (form.controls.imageUrl.value && form.controls.imageUrl.value !== originalImageUrl()) {
                    <label class="image-permission"><input type="checkbox" [checked]="imagePermissionConfirmed()" (change)="imagePermissionConfirmed.set($any($event.target).checked)" /> Подтверждаю, что TUSA может размещать это изображение.</label>
                  }
                  @if (previewUrl() && !previewError()) {
                    <figure class="preview">
                      <img [src]="previewUrl()" [alt]="'Предпросмотр обложки события ' + form.controls.title.value" (error)="previewError.set(true)" />
                      <figcaption>Предпросмотр</figcaption>
                    </figure>
                  } @else if (previewUrl() && previewError()) {
                    <p class="preview-error" role="status">Не удалось загрузить изображение по этой ссылке. Проверь URL и доступность файла.</p>
                  }
                  <div class="form-actions">
                    <button class="primary" type="submit" [disabled]="form.invalid || savingId() !== null">{{ savingId() === event.id ? 'Сохраняем…' : 'Сохранить изменения' }}</button>
                    <button type="button" (click)="cancel()" [disabled]="savingId() !== null">Отмена</button>
                  </div>
                </form>
              }
            </article>
          }
        </section>
      }
      @if (error()) { <p class="message error" role="alert">{{ error() }}</p> }
      @if (announcement()) { <p class="message success" role="status">{{ announcement() }}</p> }
      <a class="back-link" routerLink="/profile">← В профиль</a>
    </main>
  `,
  styles: [`
    .editor-page { max-width: 900px; margin: 0 auto; padding: 1.5rem 1rem 6rem; color: var(--tg-text); }
    header { padding-bottom: 1rem; border-bottom: 1px solid var(--tg-line); }
    .eyebrow { color: var(--tg-muted); font-size: .65rem; font-weight: 850; letter-spacing: .15em; }
    h1 { margin: .4rem 0; font: 500 clamp(1.8rem, 6vw, 3rem) Georgia,serif; }
    header > p:not(.eyebrow) { max-width: 48rem; color: var(--tg-muted); font-size: .78rem; line-height: 1.55; }
    nav { display: flex; flex-wrap: wrap; gap: .75rem; }
    nav a, .back-link { color: var(--tg-button); font-size: .76rem; text-decoration: none; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; margin: .9rem 0; color: var(--tg-muted); font-size: .75rem; }
    button { min-height: 42px; padding: .55rem .75rem; border: 1px solid var(--tg-line); border-radius: 7px; background: transparent; color: var(--tg-text); font: inherit; font-size: .72rem; font-weight: 700; cursor: pointer; }
    button:disabled { opacity: .5; cursor: wait; }
    .event-list { display: grid; gap: .7rem; }
    .event-card { padding: .9rem; border: 1px solid var(--tg-line); border-radius: 10px; background: var(--tg-surface); }
    .event-summary { display: flex; justify-content: space-between; align-items: center; gap: .75rem; }
    .event-summary h2 { margin: .35rem 0 .2rem; font-size: 1rem; }
    .event-summary p, .event-summary small { margin: .2rem 0; color: var(--tg-muted); font-size: .72rem; }
    .status { display: inline-block; padding: .2rem .45rem; border-radius: 999px; background: color-mix(in srgb, var(--tg-button) 12%, transparent); color: var(--tg-button); font-size: .62rem; font-weight: 800; }
    .status.pending { background: rgba(168,122,40,.13); color: #74500f; }
    .edit-form { display: grid; gap: .6rem; margin-top: .8rem; padding-top: .8rem; border-top: 1px solid var(--tg-line); }
    .edit-form label { display: grid; gap: .25rem; color: var(--tg-muted); font-size: .68rem; font-weight: 700; }
    .edit-form input, .edit-form textarea { box-sizing: border-box; width: 100%; min-height: 42px; padding: .55rem .6rem; border: 1px solid var(--tg-line); border-radius: 6px; background: var(--tg-bg); color: var(--tg-text); font: inherit; font-weight: 400; }
    .edit-form textarea { resize: vertical; }
    .two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: .55rem; }
    .help { margin: 0; color: var(--tg-muted); font-size: .68rem; line-height: 1.5; }
    .image-permission { display: flex !important; align-items: flex-start; gap: .5rem !important; color: var(--tg-text) !important; font-weight: 600 !important; line-height: 1.45; }
    .image-permission input { width: 1rem; min-height: 1rem; flex: 0 0 auto; margin: .15rem 0 0; }
    .preview { margin: 0; }
    .preview img { display: block; width: min(100%, 28rem); max-height: 18rem; object-fit: cover; border-radius: 8px; background: var(--tg-bg); }
    .preview figcaption { margin-top: .25rem; color: var(--tg-muted); font-size: .65rem; }
    .preview-error, .message.error { color: #b94d42; font-size: .75rem; }
    .form-actions { display: flex; flex-wrap: wrap; gap: .45rem; }
    .primary { border-color: var(--tg-button); background: var(--tg-button); color: var(--tg-button-text); }
    .state { display: grid; justify-items: center; gap: .45rem; padding: 2rem 1rem; border: 1px solid var(--tg-line); border-radius: 9px; color: var(--tg-muted); text-align: center; }
    .state strong { color: var(--tg-text); }
    .state.error { color: #b94d42; }
    .message.success { color: var(--tg-button); font-size: .75rem; }
    .back-link { display: inline-block; margin-top: 1rem; }
    @media (max-width: 540px) { .two-columns { grid-template-columns: 1fr; } .event-summary { align-items: flex-start; flex-direction: column; } .event-summary > button { width: 100%; } .form-actions > button { flex: 1; } }
  `],
})
export class AdminEventEditorComponent implements OnInit {
  private readonly api = inject(EventsApiService);
  private readonly fb = inject(FormBuilder);
  readonly events = signal<AdminEditableEvent[] | null>(null);
  readonly selectedId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly savingId = signal<string | null>(null);
  readonly error = signal('');
  readonly announcement = signal('');
  readonly previewUrl = signal('');
  readonly previewError = signal(false);
  readonly imageUploading = signal(false);
  readonly imageError = signal('');
  readonly originalImageUrl = signal('');
  readonly imagePermissionConfirmed = signal(false);
  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    description: ['', Validators.maxLength(3000)],
    date: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]],
    time: [''],
    place: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    category: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    imageUrl: [''],
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getAdminEvents().subscribe((items) => {
      this.events.set(items);
      this.loading.set(false);
    });
  }

  edit(event: AdminEditableEvent): void {
    this.selectedId.set(event.id);
    this.error.set('');
    this.announcement.set('');
    this.previewError.set(false);
    this.previewUrl.set(event.imageUrl);
    this.originalImageUrl.set(event.imageUrl);
    this.imagePermissionConfirmed.set(false);
    this.imageError.set('');
    this.form.reset({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      place: event.place,
      category: event.category,
      imageUrl: event.imageUrl,
    });
  }

  onImageUrlInput(event: Event): void {
    const imageUrl = (event.target as HTMLInputElement).value.trim();
    this.form.controls.imageUrl.setValue(imageUrl);
    this.previewUrl.set(imageUrl);
    this.previewError.set(false);
    this.imageError.set('');
    this.imagePermissionConfirmed.set(false);
  }

  isUploadedImage(imageUrl: string): boolean {
    return imageUrl.startsWith('data:image/webp;base64,');
  }

  async selectImageFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.imageUploading.set(true);
    this.imageError.set('');
    try {
      const imageUrl = await compressEventImage(file);
      this.form.controls.imageUrl.setValue(imageUrl);
      this.previewUrl.set(imageUrl);
      this.previewError.set(false);
      this.imagePermissionConfirmed.set(false);
    } catch (error) {
      this.imageError.set(error instanceof Error ? error.message : 'Не удалось подготовить обложку.');
    } finally {
      this.imageUploading.set(false);
    }
  }

  save(event: AdminEditableEvent): void {
    if (this.form.invalid || this.savingId() || this.imageUploading()) return;
    const imageChanged = this.form.controls.imageUrl.value !== this.originalImageUrl();
    if (imageChanged && this.form.controls.imageUrl.value && !this.imagePermissionConfirmed()) {
      this.imageError.set('Подтверди право размещать выбранное изображение.');
      return;
    }
    this.savingId.set(event.id);
    this.error.set('');
    this.announcement.set('');
    this.api.updateAdminEvent(event.id, {
      ...this.form.getRawValue(),
      imagePermissionConfirmed: this.imagePermissionConfirmed(),
    }).subscribe((updated) => {
      this.savingId.set(null);
      if (!updated) {
        this.error.set('Не удалось сохранить событие. Проверь ссылку на изображение или попробуй загрузить файл заново.');
        return;
      }
      this.events.update((items) => items?.map((item) => item.id === updated.id ? updated : item) ?? null);
      this.selectedId.set(null);
      this.previewUrl.set('');
      this.originalImageUrl.set(updated.imageUrl);
      this.imagePermissionConfirmed.set(false);
      this.announcement.set(`Изменения события «${updated.title}» сохранены.`);
    });
  }

  cancel(): void {
    this.selectedId.set(null);
    this.previewUrl.set('');
    this.previewError.set(false);
    this.error.set('');
  }

  formatDate(value: string): string {
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }
}
