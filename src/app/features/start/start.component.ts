import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { I18nService } from '../../core/services/i18n.service';
import type { EventItem } from '../../core/types/event.model';

interface CalendarDay {
  iso: string;
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  hasEvents: boolean;
  eventCount: number;
}

const kazakhMonths = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];
const kazakhWeekdays = ['жексенбі', 'дүйсенбі', 'сейсенбі', 'сәрсенбі', 'бейсенбі', 'жұма', 'сенбі'];
const kazakhWeekdayShort = ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жс'];

@Component({
  selector: 'app-start',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="visitor-home">
      <header class="page-heading">
        <div>
          <h1>{{ i18n.t('calendar.title') }}</h1>
          <p>{{ i18n.t('calendar.subtitle') }}</p>
        </div>
        <a routerLink="/create-event" class="organizer-link" queryParamsHandling="preserve">
          <span aria-hidden="true">＋</span>{{ i18n.t('calendar.organizer') }} <span class="organizer-arrow" aria-hidden="true">↗</span>
        </a>
      </header>

      @if (events().some((event) => event.isDemo)) {
        <aside class="demo-banner" role="status">{{ i18n.t('calendar.demoNotice') }}</aside>
      }

      <section class="calendar-panel" aria-label="Event calendar">
        <div class="calendar-toolbar">
          <div class="month-controls">
            <button type="button" class="icon-button" (click)="moveMonth(-1)" [attr.aria-label]="previousMonthLabel()">‹</button>
            <h2>{{ monthLabel() }}</h2>
            <button type="button" class="icon-button" (click)="moveMonth(1)" [attr.aria-label]="nextMonthLabel()">›</button>
          </div>
          <div class="calendar-actions">
            <button type="button" class="today-button" (click)="goToToday()">{{ i18n.t('calendar.today') }}</button>
            <div class="view-toggle" role="group" aria-label="Calendar view">
              <button type="button" [class.active]="viewMode() === 'month'" [attr.aria-pressed]="viewMode() === 'month'" (click)="viewMode.set('month')">{{ i18n.t('calendar.month') }}</button>
              <button type="button" [class.active]="viewMode() === 'week'" [attr.aria-pressed]="viewMode() === 'week'" (click)="viewMode.set('week')">{{ i18n.t('calendar.week') }}</button>
            </div>
          </div>
        </div>

        <div class="weekday-row" aria-hidden="true">
          @for (weekday of weekdayLabels(); track $index) { <span>{{ weekday }}</span> }
        </div>
        <div class="calendar-grid" [class.week-view]="viewMode() === 'week'">
          @for (day of calendarDays(); track day.iso) {
            <button type="button" class="day-cell"
              [class.outside-month]="!day.inCurrentMonth"
              [class.selected]="selectedDate() === day.iso"
              [class.is-today]="day.isToday"
              [attr.aria-pressed]="selectedDate() === day.iso"
              [attr.aria-label]="dayLabel(day.iso, day.eventCount)"
              (click)="selectDate(day.iso)">
              <span class="day-number">{{ day.day }}</span>
              @if (day.hasEvents) { <span class="event-dots" [attr.aria-label]="day.eventCount">@for (dot of dots(day.eventCount); track dot) { <i></i> }</span> }
            </button>
          }
        </div>
        <div class="calendar-legend"><span class="legend-dot"></span>{{ i18n.t('calendar.allEvents') }} <span class="legend-count">{{ events().length }}</span></div>
      </section>

      <section class="selected-events" aria-live="polite">
        <div class="events-heading">
          <div><span class="eyebrow">{{ selectedWeekday() }}</span><h2>{{ selectedDateLabel() }}</h2></div>
          <a routerLink="/events" class="all-events-link">{{ i18n.t('calendar.allEvents') }} <span aria-hidden="true">→</span></a>
        </div>
        @if (selectedEvents().length) {
          <div class="event-list">
            @for (event of selectedEvents(); track event.id) {
              <a class="event-row" [routerLink]="['/events', event.id]" queryParamsHandling="preserve">
                <span class="event-time">{{ event.time || '—' }}</span>
                <span class="event-marker" aria-hidden="true"></span>
                <span class="event-copy"><strong>{{ event.title }}</strong><small>{{ event.place }} · {{ event.category }} @if (event.isDemo) { · {{ i18n.t('events.demo') }} }</small></span>
                <span class="event-price">{{ priceLabel(event) }}</span>
                <span class="event-arrow" aria-hidden="true">↗</span>
              </a>
            }
          </div>
        } @else {
          <div class="empty-day"><span class="empty-icon" aria-hidden="true">✳</span><p>{{ i18n.t('calendar.noEvents') }}</p><a routerLink="/events">{{ i18n.t('calendar.allEvents') }} →</a></div>
        }
      </section>

      <footer class="page-footer">
        <a routerLink="/terms">{{ i18n.t('calendar.terms') }}</a>
        <span>·</span>
        <a routerLink="/create-event">{{ i18n.t('calendar.organizer') }}</a>
      </footer>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    .visitor-home { max-width: 1080px; margin: 0 auto; padding: 2rem 1.1rem 5.6rem; box-sizing: border-box; }
    .page-heading { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; margin-bottom: 1.35rem; }
    .eyebrow { color: var(--tg-button); font-size: .64rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
    h1 { margin: .45rem 0 .25rem; font-size: clamp(2.1rem, 7vw, 3.3rem); line-height: 1; font-weight: 500; }
    .page-heading p { margin: 0; color: var(--tg-muted); font-size: .9rem; line-height: 1.45; }
    .demo-banner { margin: -.55rem 0 1rem; padding: .65rem .8rem; border: 1px solid rgba(189,155,89,.3); border-radius: 8px; background: rgba(189,155,89,.09); color: #6c5731; font-size: .75rem; line-height: 1.4; }
    :host-context(.dark-theme) .demo-banner { color: #f2d29b; }
    .organizer-link { display: inline-flex; align-items: center; gap: .45rem; flex: 0 0 auto; padding: .52rem .72rem; border: 1px solid var(--tg-line); border-radius: 999px; color: var(--tg-muted); font-size: .72rem; font-weight: 650; text-decoration: none; transition: border-color .15s ease, color .15s ease, background .15s ease; }
    .organizer-link > span:first-child { color: var(--tg-button); font-size: 1rem; }
    .organizer-link:hover { border-color: var(--tg-button); color: var(--tg-text); background: rgba(66,108,71,.06); }
    .organizer-arrow { color: var(--tg-button); }
    .calendar-panel { padding: 1.05rem; background: var(--tg-surface); border: 1px solid var(--tg-line); border-radius: 12px; box-shadow: 0 14px 36px rgba(0,0,0,.12); }
    .calendar-toolbar, .month-controls, .calendar-actions, .view-toggle { display: flex; align-items: center; }
    .calendar-toolbar { justify-content: space-between; gap: .75rem; margin-bottom: 1rem; }
    .month-controls { gap: .75rem; }
    .month-controls h2 { min-width: 140px; margin: 0; text-align: center; font-size: 1.1rem; font-family: 'Trebuchet MS', 'Segoe UI', sans-serif; font-weight: 700; }
    .icon-button { display: grid; width: 2rem; height: 2rem; place-items: center; border: 1px solid var(--tg-line); border-radius: 50%; background: transparent; color: var(--tg-text); font: inherit; font-size: 1.45rem; line-height: 1; cursor: pointer; }
    .icon-button:hover, .today-button:hover { border-color: var(--tg-button); }
    .calendar-actions { gap: .55rem; }
    .today-button, .view-toggle button { min-height: 2rem; padding: .4rem .65rem; border: 1px solid var(--tg-line); background: transparent; color: var(--tg-text); font: inherit; font-size: .7rem; cursor: pointer; }
    .today-button { border-radius: 999px; }
    .view-toggle { padding: .15rem; gap: .1rem; border: 1px solid var(--tg-line); border-radius: 999px; }
    .view-toggle button { border: 0; border-radius: 999px; color: var(--tg-muted); }
    .view-toggle button.active { background: rgba(66,108,71,.12); color: var(--tg-button); }
    .weekday-row, .calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0,1fr)); }
    .weekday-row { margin-bottom: .25rem; }
    .weekday-row span { padding: .45rem 0; color: var(--tg-muted); font-size: .65rem; font-weight: 700; text-align: center; text-transform: uppercase; }
    .calendar-grid { gap: .25rem; }
    .day-cell { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: .22rem; min-width: 0; min-height: 3.3rem; padding: .45rem .1rem .3rem; border: 1px solid transparent; border-radius: 8px; background: transparent; color: var(--tg-text); font: inherit; cursor: pointer; }
    .day-cell:hover { background: rgba(66,108,71,.07); }
    .day-cell.outside-month { color: var(--tg-muted); opacity: .43; }
    .day-cell.selected { border-color: rgba(66,108,71,.42); background: rgba(66,108,71,.1); }
    .day-cell.is-today .day-number { display: grid; min-width: 1.55rem; height: 1.55rem; place-items: center; border-radius: 50%; background: var(--tg-button); color: var(--tg-button-text); }
    .day-number { min-height: 1.55rem; display: grid; place-items: center; font-size: .8rem; font-weight: 650; }
    .event-dots { display: flex; gap: 3px; height: 5px; }
    .event-dots i { width: 4px; height: 4px; border-radius: 50%; background: var(--tg-button); }
    .calendar-legend { display: flex; align-items: center; gap: .45rem; margin-top: .7rem; color: var(--tg-muted); font-size: .68rem; }
    .legend-dot, .event-marker { width: .42rem; height: .42rem; flex: 0 0 auto; border-radius: 50%; background: var(--tg-button); }
    .legend-count { color: var(--tg-text); font-weight: 700; }
    .selected-events { margin-top: 1.45rem; }
    .events-heading { display: flex; align-items: end; justify-content: space-between; gap: .7rem; margin-bottom: .6rem; }
    .events-heading h2 { margin: .22rem 0 0; font-size: 1.35rem; font-weight: 500; }
    .all-events-link { color: var(--tg-button); font-size: .75rem; font-weight: 700; text-decoration: none; white-space: nowrap; }
    .event-list { display: grid; gap: .5rem; }
    .event-row { display: grid; grid-template-columns: 3.3rem .5rem minmax(0,1fr) auto 1rem; align-items: center; gap: .65rem; min-height: 4.3rem; padding: .65rem .75rem; border: 1px solid var(--tg-line); border-radius: 9px; background: var(--tg-surface); color: var(--tg-text); text-decoration: none; transition: border-color .15s ease, transform .15s ease; }
    .event-row:hover { border-color: rgba(66,108,71,.42); transform: translateY(-1px); }
    .event-time { color: var(--tg-button); font-size: .78rem; font-weight: 750; font-variant-numeric: tabular-nums; }
    .event-copy { min-width: 0; }
    .event-copy strong, .event-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .event-copy strong { font-size: .84rem; }
    .event-copy small { margin-top: .22rem; color: var(--tg-muted); font-size: .68rem; }
    .event-price { color: var(--tg-muted); font-size: .7rem; white-space: nowrap; }
    .event-arrow { color: var(--tg-muted); }
    .empty-day { display: flex; align-items: center; gap: .7rem; padding: .9rem; border: 1px dashed var(--tg-line); border-radius: 9px; color: var(--tg-muted); }
    .empty-icon { color: var(--tg-button); font-size: 1.1rem; }
    .empty-day p { flex: 1; margin: 0; font-size: .78rem; }
    .empty-day a { color: var(--tg-button); font-size: .72rem; white-space: nowrap; }
    .page-footer { display: flex; justify-content: center; gap: .65rem; margin-top: 1.4rem; color: var(--tg-muted); font-size: .68rem; }
    .page-footer a { color: var(--tg-muted); text-decoration: underline; text-underline-offset: 3px; }
    .page-footer a:hover { color: var(--tg-button); }
    @media (min-width: 700px) { .visitor-home { padding: 2.25rem clamp(1.6rem, 4vw, 3.5rem) 3rem; } .calendar-panel { padding: 1.35rem 1.55rem 1rem; } .day-cell { min-height: 4.3rem; padding-top: .65rem; } .calendar-grid { gap: .35rem; } .event-row { min-height: 4.7rem; padding: .75rem 1rem; } }
    @media (max-width: 500px) { .visitor-home { padding-top: 1rem; } .page-heading { align-items: flex-start; } .page-heading p { max-width: 19rem; font-size: .78rem; } .organizer-link { margin-top: .15rem; padding: .48rem .55rem; font-size: 0; } .organizer-link > span:first-child { font-size: 1.05rem; } .organizer-link .organizer-arrow { font-size: .78rem; } .calendar-panel { padding: .75rem .55rem .7rem; border-radius: 10px; } .calendar-toolbar { display: grid; grid-template-columns: minmax(0, 1fr); justify-items: center; gap: .45rem; } .month-controls { justify-content: center; gap: .35rem; } .month-controls h2 { min-width: 116px; font-size: .92rem; } .calendar-actions { justify-content: center; gap: .3rem; } .today-button, .view-toggle button { padding: .35rem .48rem; font-size: .64rem; } .weekday-row span { font-size: .58rem; } .calendar-grid { gap: .08rem; } .day-cell { min-height: 2.8rem; padding: .3rem 0 .2rem; border-radius: 6px; } .day-number { font-size: .72rem; } .event-row { grid-template-columns: 2.6rem .4rem minmax(0,1fr) auto; gap: .45rem; padding: .6rem .5rem; } .event-arrow { display: none; } .event-copy strong { font-size: .75rem; } .event-copy small { font-size: .61rem; } .event-price { font-size: .63rem; } .empty-day { flex-wrap: wrap; } .empty-day p { flex-basis: calc(100% - 2rem); } }
  `],
})
export class StartComponent {
  private readonly data = inject(DataService);
  protected readonly i18n = inject(I18nService);
  readonly events = signal<EventItem[]>([]);
  readonly viewMode = signal<'month' | 'week'>('month');
  readonly selectedDate = signal(this.toIso(new Date()));
  readonly displayMonth = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  readonly selectedEvents = computed(() => this.events().filter((event) => event.date === this.selectedDate()).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')));
  readonly monthLabel = computed(() => {
    const month = this.displayMonth();
    return this.i18n.locale() === 'kz' ? `${kazakhMonths[month.getMonth()]} ${month.getFullYear()}` : new Intl.DateTimeFormat(this.localeTag(), { month: 'long', year: 'numeric' }).format(month);
  });
  readonly weekdayLabels = computed(() => {
    if (this.i18n.locale() === 'kz') return kazakhWeekdayShort;
    const monday = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(this.localeTag(), { weekday: 'short' }).format(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index)));
  });
  readonly calendarDays = computed<CalendarDay[]>(() => {
    const month = this.displayMonth();
    let first: Date;
    let total: number;
    if (this.viewMode() === 'week') {
      const selected = new Date(`${this.selectedDate()}T12:00:00`);
      const mondayOffset = (selected.getDay() + 6) % 7;
      first = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() - mondayOffset);
      total = 7;
    } else {
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const mondayOffset = (monthStart.getDay() + 6) % 7;
      first = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset);
      total = 42;
    }
    const today = this.toIso(new Date());
    const eventsByDate = new Map<string, number>();
    for (const event of this.events()) eventsByDate.set(event.date, (eventsByDate.get(event.date) ?? 0) + 1);
    return Array.from({ length: total }, (_, index) => {
      const date = new Date(first.getFullYear(), first.getMonth(), first.getDate() + index);
      const iso = this.toIso(date);
      const eventCount = eventsByDate.get(iso) ?? 0;
      return { iso, day: date.getDate(), inCurrentMonth: date.getMonth() === month.getMonth(), isToday: iso === today, hasEvents: eventCount > 0, eventCount };
    });
  });

  constructor() {
    this.data.getEvents().subscribe((events) => {
      this.events.set(events);
      const today = this.toIso(new Date());
      const nextEvent = [...events].filter((event) => event.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
      if (nextEvent && !events.some((event) => event.date === today)) {
        this.selectedDate.set(nextEvent.date);
        const date = new Date(`${nextEvent.date}T12:00:00`);
        this.displayMonth.set(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    });
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
    const selected = new Date(`${date}T12:00:00`);
    this.displayMonth.set(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }

  moveMonth(offset: number): void {
    const current = this.displayMonth();
    const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
    this.displayMonth.set(next);
    this.selectedDate.set(this.toIso(new Date(next.getFullYear(), next.getMonth(), 1)));
  }

  goToToday(): void {
    const today = new Date();
    this.displayMonth.set(new Date(today.getFullYear(), today.getMonth(), 1));
    this.selectedDate.set(this.toIso(today));
  }

  dayLabel(iso: string, count: number): string {
    const date = new Date(`${iso}T12:00:00`);
    const dateLabel = this.i18n.locale() === 'kz'
      ? `${kazakhWeekdays[date.getDay()]}, ${date.getDate()} ${kazakhMonths[date.getMonth()]}`
      : new Intl.DateTimeFormat(this.localeTag(), { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
    return count ? `${dateLabel}, ${count}` : dateLabel;
  }

  selectedDateLabel(): string {
    const date = new Date(`${this.selectedDate()}T12:00:00`);
    return this.i18n.locale() === 'kz' ? `${date.getDate()} ${kazakhMonths[date.getMonth()]} ${date.getFullYear()}` : new Intl.DateTimeFormat(this.localeTag(), { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }
  selectedWeekday(): string {
    const date = new Date(`${this.selectedDate()}T12:00:00`);
    return this.i18n.locale() === 'kz' ? kazakhWeekdays[date.getDay()] : new Intl.DateTimeFormat(this.localeTag(), { weekday: 'long' }).format(date);
  }
  previousMonthLabel(): string { return this.i18n.locale() === 'en' ? 'Previous month' : this.i18n.locale() === 'kz' ? 'Алдыңғы ай' : 'Предыдущий месяц'; }
  nextMonthLabel(): string { return this.i18n.locale() === 'en' ? 'Next month' : this.i18n.locale() === 'kz' ? 'Келесі ай' : 'Следующий месяц'; }
  dots(count: number): number[] { return Array.from({ length: Math.min(count, 3) }, (_, index) => index); }
  priceLabel(event: EventItem): string { return event.price ? `${event.price.toLocaleString(this.localeTag())} ₸` : this.i18n.locale() === 'en' ? 'Free' : this.i18n.locale() === 'kz' ? 'Тегін' : 'Бесплатно'; }

  private localeTag(): string { return this.i18n.locale() === 'en' ? 'en-US' : 'ru-RU'; }
  private toIso(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
}
