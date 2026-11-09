import { Component, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { TelegramService } from '../../core/services/telegram.service';
import { I18nService } from '../../core/services/i18n.service';

declare const L: typeof import('leaflet');

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="map-container">
      <div #mapRef class="map"></div>
      <div class="map-header">
        <div>
          <span class="map-kicker">ASTANA / LIVE</span>
          <h1>События<br /><em>рядом.</em></h1>
          @if (demoData()) { <span class="map-demo-flag">{{ i18n.t('map.demoNotice') }}</span> }
        </div>
        <a routerLink="/events" class="list-button" queryParamsHandling="preserve" aria-label="Открыть список событий">Список</a>
      </div>
      <div class="map-sheet">
        <div>
          <span class="sheet-kicker">ГОРОД ДВИГАЕТСЯ</span>
          <strong>Найди свою точку на карте</strong>
          <div class="legend" aria-label="Легенда категорий">
            <span><i class="legend-dot concert"></i>Концерты</span>
            <span><i class="legend-dot party"></i>Вечеринки</span>
            <span><i class="legend-dot fun"></i>Развлечения</span>
          </div>
        </div>
        <a routerLink="/events" class="sheet-link" queryParamsHandling="preserve">Все события <span aria-hidden="true">→</span></a>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; min-height: 0; }
      .map-container { position: relative; width: 100%; height: calc(100dvh - 64px - 42px - 5.4rem - env(safe-area-inset-bottom)); min-height: 420px; overflow: hidden; }
      .map { width: 100%; height: 100%; min-height: 0; display: block; background: var(--tg-surface, #252529); -webkit-tap-highlight-color: transparent; }
      .map-header {
        position: absolute;
        top: 1rem;
        left: 1rem;
        right: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 1100;
        padding: .8rem .9rem;
        border: 1px solid rgba(242,240,232,.14);
        border-radius: 5px;
        background: linear-gradient(90deg, rgba(18,19,19,.92), rgba(18,19,19,.68), rgba(18,19,19,.2));
        box-shadow: 0 10px 28px rgba(0,0,0,.2);
        backdrop-filter: blur(8px);
      }
      @media (max-width: 420px) {
        .map-header { left: .75rem; right: .75rem; }
        .map-sheet { left: .75rem; right: .75rem; bottom: .75rem; }
        .map-sheet strong { font-size: .95rem; }
      }
      @media (min-width: 760px) {
        .map-container { height: calc(100dvh - 72px - 42px - 2rem); min-height: 400px; }
      }
      .map-kicker, .sheet-kicker { display: block; color: #c5d8b1; font-size: .62rem; font-weight: 800; letter-spacing: .18em; }
      .map-demo-flag { display: inline-block; margin-top: .55rem; padding: .25rem .45rem; border: 1px solid rgba(229,198,133,.35); border-radius: 999px; background: rgba(189,155,89,.16); color: #f0d7a3; font-size: .62rem; font-weight: 700; }
      h1 { margin: .35rem 0 0; color: #fffdf5; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(2rem, 8vw, 3.5rem); font-weight: 500; line-height: .9; text-shadow: 0 2px 4px rgba(0,0,0,.7); }
      h1 em { color: #c5d8b1; font-weight: 400; }
      .list-button {
        padding: 0.65rem .9rem;
        background: var(--tg-button, #00FF41);
        color: var(--tg-button-text, #0a0a0c);
        border-radius: 999px;
        text-decoration: none;
        font-size: .78rem;
        font-weight: 800;
        box-shadow: var(--tg-glow, 0 0 12px #00FF41);
      }
      .map-sheet { position: absolute; left: 1rem; right: 1rem; bottom: 1rem; z-index: 1000; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .9rem 1rem; color: #f0f1e9; background: rgba(32, 37, 31, .9); border: 1px solid rgba(240,241,233,.14); border-radius: 5px; box-shadow: 0 12px 30px rgba(0,0,0,.28); backdrop-filter: blur(16px); }
      .map-sheet strong { display: block; margin-top: .35rem; font-family: Georgia, 'Times New Roman', serif; font-size: 1.05rem; font-weight: 500; }
      .legend { display: flex; flex-wrap: wrap; gap: .45rem .7rem; margin-top: .65rem; color: rgba(242,240,232,.7); font-size: .66rem; }
      .legend span { display: inline-flex; align-items: center; gap: .28rem; }
      .legend-dot { width: .45rem; height: .45rem; display: inline-block; border-radius: 50%; background: #829d68; }
      .legend-dot.party { background: #a78b70; }
      .legend-dot.fun { background: #c0a66d; }
      .sheet-link { flex: 0 0 auto; color: #c5d8b1; font-size: .78rem; font-weight: 700; text-decoration: none; }
      .sheet-link span { margin-left: .25rem; font-size: 1.1rem; }
    `,
  ],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  protected readonly i18n = inject(I18nService);
  readonly demoData = signal(false);
  @ViewChild('mapRef') mapRef!: ElementRef<HTMLDivElement>;
  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private resizeObserver: ResizeObserver | null = null;
  private boundInvalidate: (() => void) | null = null;

  constructor(
    private data: DataService,
    private telegram: TelegramService
  ) {}

  ngAfterViewInit(): void {
    const delay = this.telegram.isInTelegram ? 450 : 150;
    setTimeout(() => void this.initMap(), delay);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (typeof window !== 'undefined' && this.boundInvalidate) {
      window.visualViewport?.removeEventListener('resize', this.boundInvalidate);
      window.removeEventListener('resize', this.boundInvalidate);
    }
    this.boundInvalidate = null;
    this.markers.forEach((m) => m.remove());
    this.map?.remove();
    this.map = null;
  }

  private getViewportHeight(): number {
    if (typeof window === 'undefined') return 400;
    const vv = (window as unknown as { visualViewport?: { height: number } }).visualViewport;
    return vv?.height ?? window.innerHeight;
  }

  private async initMap(): Promise<void> {
    const mapEl = this.mapRef?.nativeElement;
    if (!mapEl) return;
    const container = mapEl.parentElement;
    if (!container) return;

    const waitForSize = (): Promise<void> => {
      return new Promise((resolve) => {
        const check = (attempt = 0): void => {
          const w = container.offsetWidth || window.innerWidth;
          const h = container.offsetHeight || this.getViewportHeight() - 80;
          if ((w > 0 && h > 0) || attempt > 25) {
            resolve();
            return;
          }
          setTimeout(() => check(attempt + 1), 100);
        };
        check();
      });
    };

    try {
      await waitForSize();
      const Llib: typeof L = await import('leaflet').then((m: { default?: typeof L }) => m.default ?? (m as typeof L));
      this.buildMap(Llib, mapEl, []);
      this.data.getEvents().subscribe((events) => {
        this.demoData.set(events.some((event) => event.isDemo));
        this.addMarkers(Llib, events);
      });
    } catch (err) {
      console.error('Map init error', err);
    }
  }

  private addMarkers(
    L: typeof import('leaflet'),
    events: { id: string; title: string; place: string; category?: string; lat: number; lng: number }[]
  ): void {
    if (!this.map) return;
    this.markers.forEach((m) => m.remove());
    this.markers = [];
    events.forEach((ev) => {
      const featured = (ev as { featured?: boolean }).featured;
      const categoryClass = ev.category === 'вечеринка' ? ' party' : ev.category === 'развлечения' ? ' fun' : '';
      const markerIcon = L.divIcon({
        className: 'tusa-marker' + categoryClass + (featured ? ' featured' : ''),
        html: '<span></span>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });
      const popup = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = ev.title;
      popup.append(title, document.createElement('br'));
      if (featured) popup.append('Реклама', document.createElement('br'));
      popup.append(document.createTextNode(ev.place), document.createElement('br'));
      const link = document.createElement('a');
      link.href = `/events/${encodeURIComponent(ev.id)}${typeof window !== 'undefined' ? window.location.search : ''}`;
      link.textContent = 'Подробнее';
      popup.append(link);
      const marker = L.marker([ev.lat, ev.lng], { icon: markerIcon }).addTo(this.map!).bindPopup(popup);
      this.markers.push(marker);
    });
  }

  private buildMap(
    L: typeof import('leaflet'),
    mapEl: HTMLDivElement,
    events: { id: string; title: string; place: string; category?: string; lat: number; lng: number }[]
  ): void {
    const astana = { lat: 51.1694, lng: 71.4494 };
    const container = mapEl.parentElement;
    this.map = L.map(mapEl, {
      fadeAnimation: false,
      zoomAnimation: false,
      markerZoomAnimation: false,
    }).setView([astana.lat, astana.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors',
      detectRetina: true,
    }).addTo(this.map);

    this.boundInvalidate = (): void => {
      this.map?.invalidateSize();
    };
    this.map.whenReady(this.boundInvalidate);
    this.map.invalidateSize({ pan: false });
    setTimeout(this.boundInvalidate, 300);
    setTimeout(this.boundInvalidate, 800);

    if (container && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.boundInvalidate);
      this.resizeObserver.observe(container);
    }
    if (typeof window !== 'undefined' && this.boundInvalidate) {
      window.visualViewport?.addEventListener('resize', this.boundInvalidate);
      window.addEventListener('resize', this.boundInvalidate);
    }

    this.addMarkers(L, events);
  }
}
