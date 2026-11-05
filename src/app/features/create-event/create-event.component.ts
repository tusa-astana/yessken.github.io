import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/services/data.service';

function contactMethodValidator(control: AbstractControl): ValidationErrors | null {
  const email = String(control.get('organizerEmail')?.value ?? '').trim();
  const phone = String(control.get('organizerPhone')?.value ?? '').trim();
  return email || phone ? null : { contactMethodRequired: true };
}

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="create-event">
      <header class="form-hero">
        <span class="eyebrow">ДЛЯ ОРГАНИЗАТОРОВ</span>
        <h1>Пусть о вашем событии<br /><em>узнают.</em></h1>
        <p class="intro">Разместите ближайшее событие в каталоге Астаны. Мы проверим заявку, подготовим страницу и отправим вам ссылку для публикации.</p>
        <div class="quick-start" aria-label="Быстрый шаблон события">
          <span>Быстрый старт</span>
          <button type="button" (click)="applyTemplate('concert')">Концерт</button>
          <button type="button" (click)="applyTemplate('party')">Вечеринка</button>
          <button type="button" (click)="applyTemplate('comedy')">Стендап</button>
        </div>
        <div class="offer">
          <span class="offer-mark">01</span>
          <div><strong>Первое размещение бесплатно</strong><small>Без подписки и обязательств. Свяжемся после проверки заявки.</small></div>
        </div>
      </header>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <section class="form-section">
          <div class="section-heading"><span>01</span><div><h2>О событии</h2><p>Расскажите, что произойдет и почему стоит прийти.</p></div></div>
          <div class="field-grid">
            <label class="wide">Название события <b>*</b><input formControlName="title" type="text" placeholder="Например, Jazz под звёздами" [attr.aria-invalid]="fieldErrorVisible('title')" [attr.aria-describedby]="fieldErrorVisible('title') ? 'title-error' : null" />
              @if (fieldErrorVisible('title')) { <small id="title-error" class="field-error" role="alert">Укажите название события.</small> }
            </label>
            <label class="wide">Описание <textarea formControlName="description" rows="4" placeholder="Коротко: программа, атмосфера, для кого событие"></textarea></label>
            <label>Дата <b>*</b><input formControlName="date" type="date" [attr.aria-invalid]="fieldErrorVisible('date')" [attr.aria-describedby]="fieldErrorVisible('date') ? 'date-error' : null" />
              @if (fieldErrorVisible('date')) { <small id="date-error" class="field-error" role="alert">Выберите дату события.</small> }
            </label>
            <label>Время <input formControlName="time" type="time" /></label>
            <label>Категория <select formControlName="category"><option value="концерт">Концерт</option><option value="вечеринка">Вечеринка</option><option value="развлечения">Развлечения</option></select></label>
            <label>Цена от организатора, ₸<input formControlName="price" type="number" min="0" placeholder="0 — бесплатно по данным организатора" /><small class="field-hint">TUSA не продаёт билеты и не принимает оплату за вход. Уточните у организатора, где получить билет.</small></label>
          </div>
        </section>
        <section class="form-section">
          <div class="section-heading"><span>02</span><div><h2>Место и обложка</h2><p>Помогите гостям быстро понять, куда ехать.</p></div></div>
          <div class="field-grid">
            <label>Площадка <b>*</b><input formControlName="place" type="text" placeholder="Название клуба или площадки" [attr.aria-invalid]="fieldErrorVisible('place')" [attr.aria-describedby]="fieldErrorVisible('place') ? 'place-error' : null" />
              @if (fieldErrorVisible('place')) { <small id="place-error" class="field-error" role="alert">Укажите площадку или место проведения.</small> }
            </label>
            <label class="address-field">Адрес
              <input formControlName="address" type="text" autocomplete="street-address" (input)="searchAddress()" placeholder="Начните вводить адрес в Астане" />
              @if (addressLoading()) { <small class="field-hint">Ищем адрес…</small> }
              @if (addressSuggestions().length) { <div class="suggestions">@for (suggestion of addressSuggestions(); track suggestion.display_name) { <button type="button" (click)="selectAddress(suggestion)">{{ suggestion.display_name }}</button> }</div> }
            </label>
            <label class="wide">Афиша или фото события <span class="optional">загрузите официальное изображение — мы покажем его без случайной замены</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" (change)="selectImage($event)" />
              <small class="field-hint">Без загрузки подставим стабильное тематическое фото по категории и отметим его как иллюстрацию.</small>
              @if (imagePreview()) { <img class="image-preview" [src]="imagePreview()" alt="Предпросмотр обложки" /> }
              @if (imageError()) { <small class="field-error">{{ imageError() }}</small> }
            </label>
          </div>
        </section>
        <section class="form-section">
          <div class="section-heading"><span>03</span><div><h2>Как с вами связаться</h2><p>Нужны только рабочие контакты для уточнения деталей.</p></div></div>
          <div class="field-grid">
            <label>Имя или команда <input formControlName="organizerName" type="text" placeholder="Как к вам обращаться" /></label>
            <label>Email <input formControlName="organizerEmail" type="email" autocomplete="email" placeholder="name@example.com" [attr.aria-invalid]="fieldErrorVisible('organizerEmail')" [attr.aria-describedby]="fieldErrorVisible('organizerEmail') ? 'email-error' : null" />
              @if (fieldErrorVisible('organizerEmail')) { <small id="email-error" class="field-error" role="alert">Проверьте адрес email или укажите телефон.</small> }
            </label>
            <label>Телефон <input formControlName="organizerPhone" type="tel" placeholder="+7 700 000 00 00" /></label>
          </div>
          @if (contactErrorVisible()) { <p class="field-error" role="alert">Укажите email или телефон — без этого мы не сможем ответить по заявке.</p> }
        </section>
        <div class="submit-panel">
          <button type="submit" [disabled]="submitting()">{{ submitting() ? 'Отправляем заявку…' : 'Отправить заявку' }} <span aria-hidden="true">→</span></button>
          <small>Нажимая кнопку, вы отправляете заявку на модерацию TUSA.</small>
        </div>
      </form>
      @if (success()) {
        <section class="success" role="status" aria-labelledby="submission-success-title">
          <span class="success-mark" aria-hidden="true">✓</span>
          <div><h2 id="submission-success-title">Заявка принята</h2><p>Событие пока не опубликовано. Администратор проверит информацию и свяжется с вами по указанным контактам.</p><small>Номер заявки: {{ submittedEventId() }}</small></div>
          <a routerLink="/events">Вернуться к афише</a>
        </section>
      }
      @if (submitError()) { <p class="field-error submit-error" role="alert">{{ data.eventSubmissionRateLimited() ? 'Слишком много заявок с этого соединения. Подождите 10 минут и попробуйте ещё раз.' : 'Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.' }}</p> }
    </div>
  `,
  styles: [
    `
      .create-event { max-width: 900px; padding: 2rem 1.25rem 6rem; margin: 0 auto; }
      .form-hero { padding: 1rem 0 2rem; }
      .eyebrow { color: var(--tg-button, #426c47); font-size: .65rem; font-weight: 800; letter-spacing: .17em; }
      h1 { margin: .8rem 0 1rem; font-size: clamp(2.5rem, 9vw, 5rem); line-height: .92; font-weight: 500; }
      h1 em { color: var(--tg-button, #426c47); font-weight: 400; }
      .intro { max-width: 620px; margin: 0 0 1.2rem; opacity: .68; line-height: 1.55; font-size: .95rem; }
      .quick-start { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; margin-bottom: 1.25rem; color: var(--tg-muted); font-size: .7rem; }
      .quick-start button { margin: 0; padding: .45rem .65rem; background: transparent; color: var(--tg-text); border: 1px solid var(--tg-line); box-shadow: none; border-radius: 999px; font-size: .72rem; font-weight: 600; }
      .quick-start button:hover { border-color: var(--tg-button); color: var(--tg-button); }
      .offer { display: flex; align-items: center; gap: .85rem; max-width: 540px; padding: .9rem 1rem; border: 1px solid rgba(66,108,71,.22); background: rgba(66,108,71,.06); border-radius: 8px; line-height: 1.35; }
      .offer-mark, .section-heading > span { color: var(--tg-button, #426c47); font-size: .68rem; font-weight: 800; letter-spacing: .1em; }
      .offer strong, .offer small { display: block; }
      .offer strong { font-size: .85rem; }
      .offer small { margin-top: .18rem; color: var(--tg-muted); font-size: .75rem; }
      form { display: grid; gap: 1rem; }
      .form-section { padding: 1.35rem 0; border-top: 1px solid var(--tg-line); }
      .section-heading { display: grid; grid-template-columns: 2rem 1fr; gap: .7rem; margin-bottom: 1.15rem; }
      .section-heading h2 { margin: 0; font-size: 1.3rem; font-weight: 500; }
      .section-heading p { margin: .3rem 0 0; color: var(--tg-muted); font-size: .78rem; line-height: 1.4; }
      .field-grid { display: grid; gap: .85rem; }
      label { display: flex; flex-direction: column; gap: .35rem; color: var(--tg-text, #26372b); font-size: .78rem; font-weight: 700; }
      label b { color: var(--tg-button, #426c47); font-weight: 700; }
      .optional { color: var(--tg-muted); font-size: .68rem; font-weight: 400; }
      input, textarea, select { width: 100%; box-sizing: border-box; padding: .78rem .8rem; color: var(--tg-text, #26372b); background: var(--tg-surface, #ffffff); border: 1px solid var(--tg-line); border-radius: 6px; font: inherit; font-weight: 400; outline: none; }
      textarea { resize: vertical; min-height: 100px; }
      input::placeholder, textarea::placeholder { color: var(--tg-muted, #667368); }
      input:focus, textarea:focus, select:focus { border-color: var(--tg-button, #426c47); box-shadow: 0 0 0 3px rgba(66,108,71,.12); }
      .address-field { position: relative; }
      .suggestions { position: absolute; left: 0; right: 0; top: 100%; z-index: 10; background: var(--tg-surface, #ffffff); border: 1px solid var(--tg-line); border-radius: 6px; overflow: hidden; }
      .suggestions button { width: 100%; margin: 0; padding: .65rem; text-align: left; background: transparent; color: var(--tg-text, #26372b); box-shadow: none; border: 0; border-radius: 0; font-size: .8rem; }
      .suggestions button:hover { background: rgba(66,108,71,.08); }
      .image-preview { display: block; width: 100%; max-height: 220px; object-fit: cover; margin-top: .5rem; border-radius: 3px; }
      .field-hint { opacity: .65; font-size: .78rem; }
      .field-error { color: #9a372e; font-size: .78rem; line-height: 1.4; }
      input[aria-invalid="true"], textarea[aria-invalid="true"], select[aria-invalid="true"] { border-color: #b3483d; }
      input[aria-invalid="true"]:focus, textarea[aria-invalid="true"]:focus, select[aria-invalid="true"]:focus { box-shadow: 0 0 0 3px rgba(154,55,46,.14); }
      :host-context(.dark-theme) .field-error { color: #ff9a8f; }
      :host-context(.dark-theme) input[aria-invalid="true"], :host-context(.dark-theme) textarea[aria-invalid="true"], :host-context(.dark-theme) select[aria-invalid="true"] { border-color: #ff9a8f; }
      fieldset { border: 1px solid var(--tg-line); border-radius: 6px; padding: 1rem; }
      legend { padding: 0 .35rem; font-size: .85rem; }
      button {
        padding: 0.85rem 1rem;
        background: var(--tg-button, #426c47);
        color: var(--tg-button-text, #ffffff);
        box-shadow: var(--tg-glow);
        border: none;
        border-radius: 3px;
        font-size: .9rem;
        font-weight: 800;
        cursor: pointer;
      }
      button:disabled { opacity: 0.6; cursor: not-allowed; }
      .submit-panel { display: grid; gap: .8rem; margin-top: .5rem; padding: 1.15rem; background: var(--tg-surface, #ffffff); border: 1px solid var(--tg-line); border-radius: 8px; }
      .submit-panel button { justify-self: start; min-width: 220px; }
      .submit-panel button span { margin-left: .4rem; font-size: 1.1rem; }
      .submit-panel small { color: var(--tg-muted); font-size: .68rem; }
      .success { display: grid; grid-template-columns: auto 1fr; align-items: start; gap: .75rem; margin-top: 1rem; padding: 1rem; border: 1px solid rgba(66,108,71,.25); background: rgba(66,108,71,.06); color: var(--tg-text, #26372b); }
      .success-mark { display: grid; width: 1.7rem; height: 1.7rem; place-items: center; border-radius: 50%; background: var(--tg-button, #426c47); color: var(--tg-button-text, #ffffff); font-weight: 900; }
      .success h2 { margin: 0; color: var(--tg-button, #426c47); font-size: 1rem; }
      .success p { margin: .35rem 0; color: var(--tg-text, #26372b); font-size: .82rem; line-height: 1.5; }
      .success small { color: var(--tg-muted); font-size: .7rem; }
      .success a { grid-column: 2; width: fit-content; color: var(--tg-button, #426c47); font-size: .78rem; }
      .submit-error { margin-top: 1rem; }
      @media (max-width: 699px) {
        .create-event { padding: .8rem .95rem 6rem; }
        .form-hero { padding: .25rem 0 1rem; }
        h1 { margin: .55rem 0 .7rem; font-size: clamp(2rem, 8.5vw, 2.8rem); line-height: .96; }
        .intro { margin-bottom: .8rem; font-size: .86rem; }
        .quick-start { gap: .35rem; margin-bottom: .8rem; }
        .quick-start button { min-height: 40px; padding: .45rem .65rem; }
        .offer { gap: .65rem; padding: .75rem .8rem; }
        .offer small { font-size: .72rem; }
        form { gap: .45rem; }
        .form-section { padding: 1rem 0; }
        .section-heading { margin-bottom: .8rem; }
        .field-grid { gap: .7rem; }
        input, textarea, select { min-height: 44px; }
        textarea { min-height: 100px; }
        .submit-panel button { width: 100%; min-height: 48px; }
      }
      @media (min-width: 700px) {
        .create-event { padding: 4.5rem clamp(2rem, 5vw, 5rem); }
        .form-hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, .55fr); column-gap: 4rem; align-items: end; padding-bottom: 3.5rem; }
        .eyebrow, h1, .intro, .quick-start { grid-column: 1; }
        .offer { grid-column: 2; grid-row: 2 / span 3; align-self: center; }
        .field-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .field-grid .wide { grid-column: 1 / -1; }
        .submit-panel { grid-template-columns: 1fr auto; align-items: center; }
        .submit-panel small { grid-column: 1 / -1; }
      }
    `,
  ],
})
export class CreateEventComponent {
  form: FormGroup;
  success = signal(false);
  submittedEventId = signal('');
  submitting = signal(false);
  submitError = signal(false);
  submitAttempted = signal(false);
  addressSuggestions = signal<Array<{ display_name: string; lat: string; lon: string }>>([]);
  imagePreview = signal('');
  addressLoading = signal(false);
  imageError = signal('');

  constructor(
    private fb: FormBuilder,
    protected data: DataService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      date: ['', Validators.required],
      time: ['20:00'],
      place: ['', Validators.required],
      address: [''],
      lat: [51.1694],
      lng: [71.4494],
      category: ['концерт'],
      price: [0],
      imageUrl: [''],
      organizerName: [this.savedContact('organizerName')],
      organizerEmail: [this.savedContact('organizerEmail'), Validators.email],
      organizerPhone: [this.savedContact('organizerPhone')],
    }, { validators: [contactMethodValidator] });
  }

  contactErrorVisible(): boolean {
    return this.form.hasError('contactMethodRequired') && (
      this.submitAttempted() || !!this.form.get('organizerEmail')?.touched || !!this.form.get('organizerPhone')?.touched
    );
  }

  fieldErrorVisible(field: 'title' | 'date' | 'place' | 'organizerEmail'): boolean {
    const control = this.form.get(field);
    if (!control || !(this.submitAttempted() || control.touched)) return false;
    if (field === 'organizerEmail') return control.hasError('email') && !!control.value;
    return control.hasError('required');
  }

  applyTemplate(template: 'concert' | 'party' | 'comedy'): void {
    const values = {
      concert: { category: 'концерт', time: '20:00', price: 3500, title: 'Живой концерт в Астане' },
      party: { category: 'вечеринка', time: '22:00', price: 5000, title: 'Вечеринка в Астане' },
      comedy: { category: 'развлечения', time: '19:00', price: 2500, title: 'Stand-up вечер' },
    }[template];
    this.form.patchValue({ ...values, imageUrl: this.defaultCover(values.category) });
  }

  async searchAddress(): Promise<void> {
    const query = String(this.form.get('address')?.value ?? '').trim();
    if (query.length < 3) { this.addressSuggestions.set([]); return; }
    this.addressLoading.set(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=kz&city=Astana&q=${encodeURIComponent(query)}`);
      if (response.ok) this.addressSuggestions.set(await response.json());
    } catch { this.addressSuggestions.set([]); }
    finally { this.addressLoading.set(false); }
  }

  selectAddress(suggestion: { display_name: string; lat: string; lon: string }): void {
    this.form.patchValue({ address: suggestion.display_name, lat: Number(suggestion.lat), lng: Number(suggestion.lon) });
    this.addressSuggestions.set([]);
  }

  async selectImage(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.imageError.set('');
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) { this.imageError.set('Исходный файл должен быть меньше 12 МБ.'); return; }
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / bitmap.width, 1000 / bitmap.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const compressed = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image compression failed')), 'image/webp', 0.82));
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Image could not be read'));
        reader.readAsDataURL(compressed);
      });
      this.imagePreview.set(dataUrl);
      this.form.patchValue({ imageUrl: dataUrl });
    } catch {
      this.imageError.set('Не удалось обработать изображение. Попробуйте JPG, PNG или WebP.');
    }
  }

  onSubmit(): void {
    this.submitAttempted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.submitError.set(false);
    this.success.set(false);
    const v = this.form.value;
    this.saveContact(v);
    this.data.createEvent({
      title: v.title,
      description: v.description,
      date: v.date,
      time: v.time,
      place: v.place,
      address: v.address,
      lat: Number(v.lat),
      lng: Number(v.lng),
      category: v.category,
      price: v.price ? Number(v.price) : null,
      imageUrl: v.imageUrl || this.defaultCover(v.category),
      organizerName: v.organizerName,
      organizerEmail: v.organizerEmail,
      organizerPhone: v.organizerPhone,
    }).subscribe((created) => {
      this.submitting.set(false);
      if (!created) { this.submitError.set(true); return; }
      this.success.set(true);
      this.submittedEventId.set(created.id);
    });
  }

  private savedContact(key: 'organizerName' | 'organizerEmail' | 'organizerPhone'): string {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem(`tusa-${key}`) ?? '';
  }

  private defaultCover(category: string): string {
    const covers: Record<string, string> = {
      концерт: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=85',
      вечеринка: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=85',
      развлечения: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=85',
    };
    return covers[category] ?? covers['концерт'];
  }

  private saveContact(value: { organizerName?: string; organizerEmail?: string; organizerPhone?: string }): void {
    if (typeof localStorage === 'undefined') return;
    for (const key of ['organizerName', 'organizerEmail', 'organizerPhone'] as const) {
      if (value[key]) localStorage.setItem(`tusa-${key}`, value[key]);
    }
  }
}
