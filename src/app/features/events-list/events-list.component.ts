import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { I18nService } from '../../core/services/i18n.service';
import type { EventItem } from '../../core/types/event.model';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="events-list">
      <header class="hero">
        <div class="hero-copy">
          <p class="date-line">{{ i18n.brandCity() }} <span aria-hidden="true">·</span> {{ todayLabel() }}</p>
          <h1>{{ historyView() ? i18n.t('events.archive') : i18n.t('events.heading') }}</h1>
          <p class="hero-subtitle">{{ i18n.t('events.subtitle') }}</p>
          <div class="hero-actions">
            <a routerLink="/create-event" class="organizer-link" queryParamsHandling="preserve">{{ i18n.t('events.organizer') }} <span aria-hidden="true">→</span></a>
            <a routerLink="/meetups" class="together-link" queryParamsHandling="preserve">{{ i18n.t('nav.meetups') }} <span aria-hidden="true">↗</span></a>
            <a routerLink="/interests" [queryParams]="{ group: 'board-games' }" queryParamsHandling="merge" class="hobbies-link">{{ i18n.t('events.hobbies') }} <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <aside class="hero-note">
          <span class="note-icon" aria-hidden="true">✳</span>
          <p><strong>Бесплатный RSVP</strong><br />Билет и условия входа уточняйте у организатора.</p>
        </aside>
      </header>
      <section class="discovery" aria-labelledby="discovery-title">
        <div class="discovery-heading">
          <div><p class="section-kicker">{{ i18n.brandCity().toUpperCase() }}</p><h2 id="discovery-title">{{ historyView() ? i18n.t('events.archive') : i18n.t('events.allTitle') }}</h2></div>
          @if (!loading()) { <span class="result-count">{{ filteredEvents().length }} событий</span> }
        </div>
        <div class="event-view-switch" role="group" aria-label="Раздел афиши">
          <button type="button" [attr.aria-pressed]="!historyView()" (click)="showUpcoming()">{{ i18n.t('events.upcoming') }}</button>
          <button type="button" [attr.aria-pressed]="historyView()" (click)="showHistory()">{{ i18n.t('events.archive') }}</button>
        </div>
        <div class="filters" aria-label="Фильтры событий">
        <label class="search-label">
          <span class="visually-hidden">Поиск событий</span>
          <input type="search" [placeholder]="i18n.t('events.searchPlaceholder')" [value]="searchQuery" (input)="onSearchInput($any($event.target).value)" />
        </label>
        <select aria-label="Категория события" (change)="onCategoryChange($any($event.target).value)">
          <option value="">{{ i18n.t('events.filters.all') }}</option>
          <option value="концерт">Концерт</option>
          <option value="вечеринка">Вечеринка</option>
          <option value="развлечения">Развлечения</option>
        </select>
        @if (!historyView()) { <select aria-label="Дата проведения" (change)="dateFilter = $any($event.target).value">
          <option value="">Любая дата</option>
          <option value="today">Сегодня</option>
          <option value="weekend">Эти выходные</option>
        </select> }
        <select aria-label="Цена, указанная организатором" (change)="priceFilter = $any($event.target).value">
          <option value="">Любая цена</option>
          <option value="free">{{ i18n.t('events.filters.free') }}</option>
          <option value="under5000">{{ i18n.t('events.filters.under5000') }}</option>
        </select>
        </div>
      </section>
      @if (loading()) { <p class="state" role="status">{{ i18n.t('events.loading') }}</p> }
      @else if (!filteredEvents().length) {
        <div class="state"><strong>{{ data.eventsError() ? 'Не удалось загрузить события' : (historyView() ? i18n.t('events.archiveEmpty') : i18n.t('events.empty')) }}</strong><span>{{ data.eventsError() ? 'Проверьте соединение с сервером.' : (historyView() ? '' : 'Попробуйте изменить фильтры.') }}</span><button type="button" (click)="reload()">{{ data.eventsError() ? i18n.t('events.retry') : i18n.t('events.reset') }}</button></div>
      } @else {
      <div class="cards">
        @for (event of filteredEvents(); track event.id; let first = $first) {
          <a [routerLink]="['/events', event.id]" class="card" queryParamsHandling="preserve">
            <div class="card-media">
              @if (event.imageUrl && !failedImageIds().has(event.id)) {
                <img [src]="event.imageUrl" [alt]="event.title" [loading]="first ? 'eager' : 'lazy'" [attr.fetchpriority]="first ? 'high' : 'auto'" (error)="markImageFailed(event.id)" />
              } @else {
                <div class="image-fallback" aria-hidden="true"><span>TUSA · АСТАНА</span><strong>{{ event.category || 'Событие' }}</strong></div>
              }
              <div class="card-badges">
                <span class="category">{{ event.category }}</span>
                @if (event.isDemo) { <span class="demo-badge">{{ i18n.t('events.demo') }}</span> }
                @if (isIllustrativeImage(event.imageUrl)) { <span class="illustration-badge">{{ i18n.t('events.illustrative') }}</span> }
              </div>
                @if (event.featured) { <span class="featured-badge">РЕКЛАМА</span> }
            </div>
            <div class="card-body">
              <h3>{{ event.title }}</h3>
              <p class="meta"><span>{{ formatDate(event.date) }}</span><span aria-hidden="true">·</span><span>{{ event.time }}</span></p>
              <p class="place">{{ event.place }}</p>
              <div class="card-footer"><span class="price">{{ priceLabel(event) }}</span><span class="card-arrow" aria-hidden="true">↗</span></div>
            </div>
          </a>
        }
      </div>
      }
    </div>
  `,
  styles: [
    `
      .events-list { max-width: 1240px; margin: 0 auto; padding: 1rem 1rem 6rem; }
      .hero { display: grid; gap: 1.2rem; padding: 1.2rem 0 1.5rem; }
      .date-line, .section-kicker { margin: 0 0 .65rem; color: var(--tg-button); font-size: .68rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
      h1 { max-width: 720px; margin: 0; font-size: clamp(2.1rem, 8vw, 3.8rem); line-height: 1.03; font-weight: 760; letter-spacing: -.055em; }
      .hero-subtitle { max-width: 38rem; margin: .75rem 0 0; color: var(--tg-muted); font-size: .94rem; line-height: 1.55; }
      .hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; margin-top: 1rem; }
      .organizer-link, .together-link, .hobbies-link { display: inline-flex; align-items: center; gap: .4rem; min-height: 2.75rem; padding: 0 .8rem; border: 1px solid var(--tg-line); border-radius: 999px; color: var(--tg-text); font-size: .74rem; font-weight: 700; text-decoration: none; }
      .organizer-link { border-color: transparent; padding-inline: .2rem; color: var(--tg-button); }
      .together-link { color: var(--tg-button); background: var(--tg-surface); }
      .hobbies-link { color: var(--tg-button); background: color-mix(in srgb, var(--tg-button) 7%, var(--tg-surface)); }
      .together-link:hover, .hobbies-link:hover { border-color: var(--tg-button); }
      .hero-note { display: flex; align-items: flex-start; gap: .7rem; max-width: 26rem; padding: .8rem .9rem; border: 1px solid var(--tg-line); border-radius: 12px; background: var(--tg-surface); }
      .note-icon { display: grid; flex: 0 0 auto; width: 1.55rem; height: 1.55rem; place-items: center; border-radius: 50%; background: color-mix(in srgb, var(--tg-button) 10%, transparent); color: var(--tg-button); }
      .hero-note p { margin: 0; color: var(--tg-muted); font-size: .74rem; line-height: 1.45; }
      .hero-note strong { color: var(--tg-text); }
      .discovery { margin: .5rem 0 1rem; }
      .discovery-heading { display: flex; justify-content: space-between; align-items: end; gap: 1rem; margin-bottom: .75rem; }
      .section-kicker { margin-bottom: .25rem; font-size: .6rem; }
      .discovery-heading h2 { margin: 0; font-size: 1.3rem; letter-spacing: -.03em; }
      .event-view-switch { display: flex; flex-wrap: wrap; gap: .45rem; margin: 0 0 .75rem; }
      .event-view-switch button { min-height: 2.5rem; padding: 0 .8rem; border: 1px solid var(--tg-line); border-radius: 999px; background: var(--tg-surface); color: var(--tg-muted); font: inherit; font-size: .74rem; font-weight: 700; }
      .event-view-switch button[aria-pressed="true"] { border-color: var(--tg-button); background: color-mix(in srgb, var(--tg-button) 10%, var(--tg-surface)); color: var(--tg-button); }
      .result-count { padding: .3rem .6rem; border: 1px solid var(--tg-line); border-radius: 999px; color: var(--tg-muted); font-size: .68rem; white-space: nowrap; }
      .filters { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; margin-bottom: 1rem; }
      .search-label { grid-column: 1 / -1; }
      .search-label input { box-sizing: border-box; width: 100%; min-height: 2.75rem; padding: 0 .95rem; border-radius: 12px; background: var(--tg-surface); color: var(--tg-text); border: 1px solid var(--tg-line); }
      .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
      .filters select { min-width: 0; min-height: 2.75rem; padding: 0 .7rem; border-radius: 10px; background: var(--tg-surface); color: var(--tg-text); border: 1px solid var(--tg-line); font-size: .76rem; }
      .filters select:last-child { grid-column: 1 / -1; }
      .state { display: flex; flex-direction: column; gap: .45rem; padding: 1rem; margin: 0 0 1rem; background: var(--tg-surface); border: 1px solid var(--tg-line); border-radius: 12px; }
      .state span { color: var(--tg-muted); font-size: .85rem; }
      .state button { width: fit-content; padding: .5rem .7rem; border: 1px solid var(--tg-line); border-radius: 8px; background: transparent; color: var(--tg-text); }
      .cards { display: grid; grid-template-columns: 1fr; gap: .8rem; }
      .card { display: block; overflow: hidden; border: 1px solid var(--tg-line); border-radius: 16px; background: var(--tg-surface); color: var(--tg-text); text-decoration: none; box-shadow: 0 2px 8px rgba(20,35,25,.035); transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
      .card-media { position: relative; aspect-ratio: 1.72; overflow: hidden; background: color-mix(in srgb, var(--tg-button) 10%, var(--tg-surface)); }
      .card img { display: block; width: 100%; height: 100%; object-fit: cover; filter: saturate(.9); transition: transform .3s ease; }
      .image-fallback { display: grid; width: 100%; height: 100%; align-content: end; gap: .35rem; box-sizing: border-box; padding: 1rem; background: radial-gradient(ellipse at 82% 18%, color-mix(in srgb, var(--tg-button) 33%, transparent), transparent 42%), linear-gradient(140deg, #1a2831, #243e43 55%, #17232d); color: #f4f4ed; }
      .image-fallback span { color: #d3ded7; font-size: .58rem; font-weight: 800; letter-spacing: .16em; }
      .image-fallback strong { max-width: 90%; font-size: clamp(1.15rem, 3vw, 2rem); line-height: 1.1; text-transform: uppercase; }
      .card-badges { position: absolute; inset: .65rem .65rem auto; display: flex; flex-wrap: wrap; align-items: center; gap: .35rem; }
      .category, .demo-badge, .illustration-badge, .featured-badge { display: inline-flex; align-items: center; min-height: 1.45rem; padding: 0 .5rem; border: 1px solid rgba(255,255,255,.55); border-radius: 999px; background: rgba(20,31,24,.75); color: #fff; font-size: .61rem; font-weight: 750; backdrop-filter: blur(8px); }
      .featured-badge { position: absolute; right: .65rem; bottom: .65rem; border-color: transparent; background: var(--tg-button); color: var(--tg-button-text); }
      .card-body { padding: .9rem .95rem .95rem; }
      .card h3 { margin: 0; font-size: 1.08rem; line-height: 1.25; font-weight: 720; letter-spacing: -.025em; }
      .meta { display: flex; gap: .4rem; margin: .5rem 0 .15rem; color: var(--tg-muted); font-size: .75rem; }
      .place { overflow: hidden; margin: 0; color: var(--tg-muted); font-size: .75rem; text-overflow: ellipsis; white-space: nowrap; }
      .card-footer { display: flex; justify-content: space-between; align-items: center; gap: .5rem; margin-top: .75rem; padding-top: .65rem; border-top: 1px solid var(--tg-line); }
      .price { margin: 0; color: var(--tg-muted); font-size: .68rem; line-height: 1.35; }
      .card-arrow { display: grid; flex: 0 0 auto; width: 1.8rem; height: 1.8rem; place-items: center; border-radius: 50%; background: color-mix(in srgb, var(--tg-button) 9%, transparent); color: var(--tg-button); }
      @media (min-width: 700px) {
        .events-list { padding: 2rem clamp(1.5rem, 4vw, 3rem) 4rem; }
        .hero { grid-template-columns: minmax(0, 1fr) minmax(15rem, 22rem); align-items: end; gap: 2rem; padding: 1.5rem 0 1.7rem; }
        .hero-note { justify-self: end; margin-bottom: .2rem; }
        .hero-subtitle { font-size: 1rem; }
        .filters { grid-template-columns: minmax(0, 1fr) repeat(3, minmax(0, auto)); }
        .search-label { grid-column: 1 / -1; }
        .filters select:last-child { grid-column: auto; }
        .cards { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
        .card:hover { transform: translateY(-3px); border-color: color-mix(in srgb, var(--tg-button) 40%, var(--tg-line)); box-shadow: 0 12px 30px rgba(20,35,25,.09); }
        .card:hover img { transform: scale(1.035); }
      }
    `,
  ],
})
export class EventsListComponent implements OnInit, OnDestroy {
  searchQuery = '';
  category = '';
  dateFilter = '';
  priceFilter = '';
  loading = signal(true);
  events = signal<EventItem[]>([]);
  failedImageIds = signal<ReadonlySet<string>>(new Set());
  historyView = signal(false);

  protected readonly i18n = inject(I18nService);
  private searchAnalyticsTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(protected data: DataService, protected analytics: AnalyticsService) {}

  ngOnInit(): void {
    this.analytics.track('catalog_view');
    this.loadEvents(false);
  }

  showUpcoming(): void { this.setHistoryView(false); }

  showHistory(): void { this.setHistoryView(true); }

  private setHistoryView(isHistory: boolean): void {
    if (this.historyView() === isHistory) return;
    this.historyView.set(isHistory);
    this.searchQuery = '';
    this.category = '';
    this.dateFilter = '';
    this.priceFilter = '';
    this.loadEvents(isHistory);
  }

  private loadEvents(isHistory: boolean): void {
    this.loading.set(true);
    const request = isHistory ? this.data.getPastEvents() : this.data.getEvents();
    request.subscribe((list) => { this.events.set(list); this.loading.set(false); });
  }

  onSearchInput(value: string): void {
    this.searchQuery = value;
    if (this.searchAnalyticsTimer) clearTimeout(this.searchAnalyticsTimer);
    this.searchAnalyticsTimer = setTimeout(() => {
      const terms = [...new Set(value.toLocaleLowerCase('ru').match(/\p{L}{3,24}/gu) ?? [])].slice(0, 5);
      for (const term of terms) this.analytics.track('search_term', undefined, term);
    }, 700);
  }

  onCategoryChange(value: string): void {
    this.category = value;
    if (value) this.analytics.track('category_filter', undefined, value);
  }

  markImageFailed(eventId: string): void {
    this.failedImageIds.update((ids) => new Set(ids).add(eventId));
  }

  ngOnDestroy(): void {
    if (this.searchAnalyticsTimer) clearTimeout(this.searchAnalyticsTimer);
  }

  filteredEvents = () => {
    const today = new Date();
    const query = this.searchQuery.trim().toLocaleLowerCase('ru');
    const day = today.getDay();
    const weekendStart = new Date(today);
    weekendStart.setDate(today.getDate() + (day === 0 ? 0 : 6 - day));
    const weekendEnd = new Date(weekendStart);
    weekendEnd.setDate(weekendStart.getDate() + 1);
    return [...this.events()]
      .filter((event) => !query || [event.title, event.place, event.address, event.description, event.category]
        .some((value) => value?.toLocaleLowerCase('ru').includes(query)))
      .filter((event) => !this.category || event.category === this.category)
      .filter((event) => !this.dateFilter || this.matchesDateFilter(event.date, today, weekendStart, weekendEnd))
      .filter((event) => !this.priceFilter || (this.priceFilter === 'free' ? event.price === 0 || event.price === null : (event.price ?? 0) <= 5000))
      .sort((a, b) => this.searchRelevance(b, query) - this.searchRelevance(a, query)
        || Number(b.featured) - Number(a.featured)
        || (this.historyView() ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
  };

  resetFilters(): void { this.searchQuery = ''; this.category = ''; this.dateFilter = ''; this.priceFilter = ''; }

  reload(): void {
    if (this.data.eventsError()) this.loadEvents(this.historyView());
    else this.resetFilters();
  }

  private matchesDateFilter(date: string, today: Date, weekendStart: Date, weekendEnd: Date): boolean {
    const value = new Date(`${date}T12:00:00`);
    if (this.dateFilter === 'today') return value.toDateString() === today.toDateString();
    return value >= weekendStart && value <= weekendEnd;
  }

  private searchRelevance(event: EventItem, query: string): number {
    if (!query) return 0;
    const title = event.title.toLocaleLowerCase('ru');
    if (title === query) return 5;
    if (title.startsWith(query)) return 4;
    if (title.includes(query)) return 3;
    if (event.category.toLocaleLowerCase('ru').includes(query)) return 2;
    if ([event.place, event.address].some((value) => value.toLocaleLowerCase('ru').includes(query))) return 1;
    return 0;
  }

  formatDate(date: string): string {
    const locale = this.i18n.locale() === 'kz' ? 'kk-KZ' : this.i18n.locale() === 'en' ? 'en-US' : 'ru-RU';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`));
  }

  priceLabel(event: EventItem): string {
    if (event.price && event.price > 0) return `${this.i18n.t('events.price.fromOrganizer')}: ${event.price} ₸`;
    if (event.price === 0) return this.i18n.t('events.price.freeByOrganizer');
    return this.i18n.t('events.price.contactOrganizer');
  }

  isIllustrativeImage(imageUrl: string): boolean { return imageUrl.includes('images.unsplash.com'); }

  todayLabel(): string {
    const locale = this.i18n.locale() === 'kz' ? 'kk-KZ' : this.i18n.locale() === 'en' ? 'en-US' : 'ru-RU';
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  }
}
