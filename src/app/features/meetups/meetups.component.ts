import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MeetupsApiService } from './meetups-api.service';
import type { MeetupAttendee, MeetupDay, MeetupPlan, MeetupSelection, VenueType } from './meetup.model';
import { TelegramService } from '../../core/services/telegram.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { InterestsApiService } from '../interests/interests-api.service';
import type { InterestGatheringPreview } from '../interests/interest.model';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-meetups',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './meetups.component.html',
  host: { '(document:keydown.escape)': 'closeDialogs()' },
})
export class MeetupsComponent implements OnInit, OnDestroy {
  readonly api = inject(MeetupsApiService);
  protected readonly telegram = inject(TelegramService);
  protected readonly i18n = inject(I18nService);
  private readonly analytics = inject(AnalyticsService);
  private readonly interestsApi = inject(InterestsApiService);
  private readonly route = inject(ActivatedRoute);
  private mapElement?: ElementRef<HTMLDivElement>;
  private map: import('leaflet').Map | null = null;
  private markers: import('leaflet').LayerGroup | null = null;
  private leaflet: typeof import('leaflet') | null = null;
  private mapResizeObserver: ResizeObserver | null = null;
  private viewportResizeListener: (() => void) | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  @ViewChild('mapCanvas')
  private set mapCanvas(element: ElementRef<HTMLDivElement> | undefined) {
    this.mapElement = element;
  }

  readonly dayFilter = signal<MeetupDay>('today');
  readonly sharedDate = signal<string | null>(null);
  readonly sharedVenueId = signal<string | null>(null);
  readonly sharedCampaign = signal<string | null>(null);
  readonly venueFilter = signal<VenueType | 'all'>('all');
  readonly searchQuery = signal('');
  readonly view = signal<'list' | 'map'>('list');
  readonly joiningPlan = signal<MeetupPlan | null>(null);
  readonly selectedAttendee = signal<MeetupAttendee | null>(null);
  readonly participantsPlan = signal<MeetupPlan | null>(null);
  readonly mapSelectedPlan = signal<MeetupPlan | null>(null);
  readonly mapClusterPlans = signal<MeetupPlan[]>([]);
  readonly mapTilesUnavailable = signal(false);
  readonly draftTime = signal('20:30');
  readonly draftAnonymous = signal(true);
  readonly draftOpenToMeet = signal(false);
  readonly saving = signal(false);
  readonly actionError = signal('');
  readonly savedMessage = signal('');
  readonly upcomingGatherings = signal<InterestGatheringPreview[]>([]);
  readonly upcomingGatheringsLoading = signal(true);
  readonly upcomingGatheringsError = signal(false);
  readonly visiblePlans = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase('ru');
    return this.api.plans().filter((plan) =>
      (this.venueFilter() === 'all' || plan.type === this.venueFilter()) &&
      (!query || `${plan.venue} ${plan.address}`.toLocaleLowerCase('ru').includes(query)),
    );
  });

  ngOnInit(): void {
    void this.loadUpcomingGatherings();
    const query = this.route.snapshot.queryParamMap;
    const requestedDate = query.get('date');
    const requestedVenue = query.get('venue');
    const requestedCampaign = query.get('campaign');
    if (requestedDate && this.isShareableDate(requestedDate)) this.sharedDate.set(requestedDate);
    if (requestedVenue && /^[a-z\d-]{1,60}$/i.test(requestedVenue)) this.sharedVenueId.set(requestedVenue);
    if (requestedCampaign && ['host-a', 'host-b', 'host-c'].includes(requestedCampaign.toLowerCase())) {
      this.sharedCampaign.set(requestedCampaign.toLowerCase());
    }
    void this.api.load(this.selectedDate()).then(() => {
      const sharedVenue = this.sharedVenueId();
      if (!sharedVenue) return;
      const plan = this.api.plans().find((item) => item.id === sharedVenue);
      if (!plan) return;
      this.analytics.track('meetup_invite_open', undefined, this.meetupAnalyticsRef(plan.id));
      this.mapSelectedPlan.set(plan);
      void this.setView('map');
    });
    this.refreshTimer = setInterval(() => {
      if (!this.api.loading()) void this.api.load(this.selectedDate());
    }, 30_000);
  }

  private async loadUpcomingGatherings(): Promise<void> {
    const gatherings = await this.interestsApi.loadUpcomingGatherings();
    this.upcomingGatherings.set(gatherings ?? []);
    this.upcomingGatheringsError.set(gatherings === null);
    this.upcomingGatheringsLoading.set(false);
  }

  async shareGathering(gathering: InterestGatheringPreview): Promise<void> {
    const url = this.telegram.miniAppLink(`interest_${gathering.interestId}`);
    const title = gathering.title;
    const text = `${gathering.title} · ${this.formatDate(gathering.date)} в ${gathering.time}, ${gathering.place}. План по интересу «${gathering.interestName}».`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // A dismissed share sheet falls back to Telegram's share dialog.
      }
    }
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    if (!this.telegram.openTelegramLink(shareUrl)) window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }

  selectedDate(): string {
    if (this.sharedDate()) return this.sharedDate()!;
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (this.dayFilter() === 'tomorrow') date.setDate(date.getDate() + 1);
    if (this.dayFilter() === 'weekend') {
      const daysUntilSaturday = (6 - date.getDay() + 7) % 7 || 7;
      date.setDate(date.getDate() + daysUntilSaturday);
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  async chooseDay(day: MeetupDay): Promise<void> {
    this.dayFilter.set(day);
    this.sharedDate.set(null);
    this.sharedVenueId.set(null);
    this.sharedCampaign.set(null);
    this.mapSelectedPlan.set(null);
    await this.api.load(this.selectedDate());
    this.renderMapPins();
  }

  async setView(view: 'list' | 'map'): Promise<void> {
    this.view.set(view);
    if (view !== 'map') return;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    if (!this.map) await this.initializeMap();
    else this.map.invalidateSize({ pan: false });
    requestAnimationFrame(() => this.map?.invalidateSize({ pan: false }));
    this.renderMapPins();
  }

  private async initializeMap(): Promise<void> {
    const mapElement = this.mapElement?.nativeElement;
    if (!mapElement) return;
    try {
      const module = await import('leaflet');
      const L = module.default;
      this.leaflet = L;
      const bounds = mapElement.getBoundingClientRect();
      if (bounds.width < 1 || bounds.height < 1) {
        mapElement.style.height = 'min(65dvh, 620px)';
        mapElement.style.minHeight = '340px';
      }
      this.map = L.map(mapElement, { zoomControl: false, scrollWheelZoom: false })
        .setView([51.1284, 71.4308], 12);
      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.map);
      tiles.on('tileerror', () => this.mapTilesUnavailable.set(true));
      tiles.on('tileload', () => this.mapTilesUnavailable.set(false));
      L.control.zoom({ position: 'bottomright' }).addTo(this.map);
      this.markers = L.layerGroup().addTo(this.map);
      this.map.on('zoomend', () => this.renderMapPins(false));
      this.viewportResizeListener = () => requestAnimationFrame(() => this.map?.invalidateSize({ pan: false }));
      if (typeof ResizeObserver !== 'undefined') {
        this.mapResizeObserver = new ResizeObserver(this.viewportResizeListener);
        this.mapResizeObserver.observe(mapElement);
      }
      window.visualViewport?.addEventListener('resize', this.viewportResizeListener);
      window.addEventListener('resize', this.viewportResizeListener);
      this.map.whenReady(() => requestAnimationFrame(() => this.map?.invalidateSize({ pan: false })));
    } catch (error) {
      console.error('Meetup map failed to load', error);
    }
  }

  renderMapPins(fitBounds = true): void {
    if (!this.map || !this.markers || !this.leaflet) return;
    this.markers.clearLayers();
    if (fitBounds) this.mapClusterPlans.set([]);
    const L = this.leaflet;
    const plans = this.visiblePlans().filter((plan): plan is MeetupPlan & { lat: number; lng: number } =>
      Number.isFinite(plan.lat) && Number.isFinite(plan.lng),
    );
    const zoom = this.map.getZoom();
    const groups: { plans: (MeetupPlan & { lat: number; lng: number })[]; point: import('leaflet').Point }[] = [];
    for (const plan of plans) {
      const point = this.map.project([plan.lat, plan.lng], zoom);
      const nearby = groups.find((group) => group.point.distanceTo(point) < 54);
      if (nearby) nearby.plans.push(plan);
      else groups.push({ plans: [plan], point });
    }

    for (const group of groups) {
      const groupedPlans = group.plans;
      const lat = groupedPlans.reduce((total, plan) => total + plan.lat, 0) / groupedPlans.length;
      const lng = groupedPlans.reduce((total, plan) => total + plan.lng, 0) / groupedPlans.length;
      const going = groupedPlans.reduce((total, plan) => total + plan.goingCount, 0);
      const openToMeet = groupedPlans.reduce((total, plan) => total + plan.openToMeetCount, 0);
      const isCluster = groupedPlans.length > 1;
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: `meetup-map-marker${groupedPlans.some((plan) => plan.featured) ? ' featured' : ''}${isCluster ? ' cluster' : ''}`,
          html: isCluster
            ? `<span>${groupedPlans.length}<small>мест · ${going} идут</small></span>`
            : `<span>${going}<small>✳ ${openToMeet}</small></span>`,
          iconSize: isCluster ? [82, 48] : [64, 46],
          iconAnchor: isCluster ? [41, 24] : [32, 23],
        }),
      });
      marker.on('click', () => {
        if (isCluster) {
          this.mapSelectedPlan.set(null);
          this.mapClusterPlans.set(groupedPlans);
        } else {
          this.mapClusterPlans.set([]);
          this.mapSelectedPlan.set(groupedPlans[0]);
        }
      });
      marker.addTo(this.markers!);
    }
    if (fitBounds && plans.length > 1) {
      this.map.fitBounds(L.latLngBounds(plans.map((plan) => [plan.lat, plan.lng])), { padding: [40, 40], maxZoom: 14 });
    } else if (fitBounds && plans[0]) {
      this.map.setView([plans[0].lat, plans[0].lng], 15);
    }
  }

  attendeesFor(plan: MeetupPlan): MeetupAttendee[] {
    return plan.attendees;
  }

  isJoined(plan: MeetupPlan): boolean {
    return plan.userGoing;
  }

  myTime(plan: MeetupPlan): string {
    return this.mySelection(plan)?.time ?? '';
  }

  private mySelection(plan: MeetupPlan): MeetupAttendee | undefined {
    return plan.attendees.find((attendee) => attendee.isYou);
  }

  openJoin(plan: MeetupPlan): void {
    const selection = this.mySelection(plan);
    this.draftTime.set(selection?.time || '20:30');
    this.draftAnonymous.set(selection?.anonymous ?? true);
    this.draftOpenToMeet.set(selection?.openToMeet ?? false);
    this.actionError.set('');
    this.joiningPlan.set(plan);
  }

  async quickJoin(plan: MeetupPlan): Promise<void> {
    this.actionError.set('');
    await this.submitSelection(plan, {
      date: this.selectedDate(),
      time: '20:30',
      anonymous: true,
      openToMeet: false,
    });
  }

  async saveJoin(): Promise<void> {
    const plan = this.joiningPlan();
    if (!plan) return;
    await this.submitSelection(plan, {
      date: this.selectedDate(),
      time: this.draftTime() || '20:30',
      anonymous: this.draftAnonymous(),
      openToMeet: this.draftOpenToMeet(),
    });
  }

  private async submitSelection(plan: MeetupPlan, selection: MeetupSelection): Promise<void> {
    if (!this.telegram.isInTelegram) {
      this.actionError.set('Чтобы отметиться, открой TUSA внутри Telegram — так мы безопасно проверим аккаунт.');
      return;
    }
    this.saving.set(true);
    this.actionError.set('');
    const saved = await this.api.saveSelection(plan.id, selection);
    this.saving.set(false);
    if (!saved) {
      this.actionError.set('Не получилось сохранить отметку. Проверь интернет и доступность API.');
      return;
    }
    this.joiningPlan.set(null);
    if (this.mapSelectedPlan()?.id === plan.id) {
      const refreshedPlan = this.api.plans().find((item) => item.id === plan.id);
      if (refreshedPlan) this.mapSelectedPlan.set(refreshedPlan);
    }
    this.savedMessage.set('Отметка сохранена и видна другим участникам.');
    this.renderMapPins();
  }

  async leave(plan: MeetupPlan): Promise<void> {
    if (!this.telegram.isInTelegram) {
      this.actionError.set('Открой TUSA в Telegram, чтобы убрать отметку.');
      return;
    }
    this.saving.set(true);
    const removed = await this.api.removeSelection(plan.id, this.selectedDate());
    this.saving.set(false);
    this.actionError.set(removed ? '' : 'Не получилось отменить отметку. Попробуй ещё раз.');
    this.renderMapPins();
  }

  openAttendee(attendee: MeetupAttendee): void {
    if (!attendee.anonymous) this.selectedAttendee.set(attendee);
  }

  openParticipants(plan: MeetupPlan): void {
    this.participantsPlan.set(plan);
  }

  closeDialogs(): void {
    this.joiningPlan.set(null);
    this.selectedAttendee.set(null);
    this.participantsPlan.set(null);
    this.mapClusterPlans.set([]);
    this.actionError.set('');
  }

  dayLabel(day: MeetupDay): string {
    if (day === 'today') return 'Сегодня';
    if (day === 'tomorrow') return 'Завтра';
    return 'Выходные';
  }

  typeLabel(type: VenueType): string {
    if (type === 'club') return 'Клуб';
    if (type === 'lounge') return 'Лаунж';
    return 'Бар / паб';
  }

  openMeetCount(plan: MeetupPlan): number {
    return plan.openToMeetCount;
  }

  instagramUrl(value: string | null | undefined): string | null {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' &&
        (url.hostname === 'instagram.com' || url.hostname.endsWith('.instagram.com'))
        ? url.href
        : null;
    } catch {
      return null;
    }
  }

  attendeeCountLabel(count: number): string {
    const lastTwo = count % 100;
    const last = count % 10;
    if (last === 1 && lastTwo !== 11) return 'участник';
    if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'участника';
    return 'участников';
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00`));
  }

  async share(plan?: MeetupPlan): Promise<void> {
    const date = plan?.date ?? this.selectedDate();
    const campaign = this.sharedCampaign();
    if (plan) this.analytics.track('meetup_share_intent', undefined, this.meetupAnalyticsRef(plan.id));
    const startParam = plan && /^[a-z\d-]{1,60}$/i.test(plan.id)
      ? `meetup_${plan.id}_${date.replaceAll('-', '')}${campaign ? `_c_${campaign}` : ''}`
      : 'meetups';
    const url = this.telegram.miniAppLink(startParam);
    const text = plan
      ? `Я собираюсь в ${plan.venue} ${this.formatDate(date)} около 20:30. Кто со мной? Открой место в TUSA.`
      : 'Кто со мной сегодня? Выбирай место и присоединяйся.';
    if (navigator.share) {
      try {
        await navigator.share({ title: plan ? `План в ${plan.venue}` : 'TUSA · Сходки', text, url });
        return;
      } catch {
        // A dismissed share sheet is not an error; offer the Telegram share fallback.
      }
    }
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    if (!this.telegram.openTelegramLink(shareUrl)) window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }

  private meetupAnalyticsRef(venueId: string): string {
    const campaign = this.sharedCampaign();
    return campaign ? `${venueId}|c:${campaign}` : venueId;
  }

  private isShareableDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const target = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(target.getTime()) || target.toISOString().slice(0, 10) !== value) return false;
    const todayAstana = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const today = new Date(`${todayAstana}T00:00:00.000Z`);
    const daysAhead = (target.getTime() - today.getTime()) / 86_400_000;
    return daysAhead >= 0 && daysAhead <= 60;
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = null;
    this.mapResizeObserver?.disconnect();
    this.mapResizeObserver = null;
    if (this.viewportResizeListener) {
      window.visualViewport?.removeEventListener('resize', this.viewportResizeListener);
      window.removeEventListener('resize', this.viewportResizeListener);
    }
    this.viewportResizeListener = null;
    this.map?.remove();
    this.map = null;
  }
}
