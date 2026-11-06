import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { I18nService } from './core/services/i18n.service';
import type { TranslationKey } from './core/services/i18n.service';
import { ThemeService } from './core/services/theme.service';
import { TelegramService } from './core/services/telegram.service';

interface Breadcrumb {
  key: TranslationKey;
  url?: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly telegram = inject(TelegramService);
  protected readonly i18n = inject(I18nService);
  protected readonly theme = inject(ThemeService);
  protected readonly breadcrumbs = signal<Breadcrumb[]>([]);
  protected readonly activeTab = signal<'events' | 'calendar' | 'meetups' | 'profile' | null>('meetups');
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly routeHistory: string[] = [];
  private handlingTelegramBack = false;

  ngOnInit(): void {
    this.telegram.init();
    this.telegram.onBackButtonClick(() => this.navigateBackInApp());

    const initialUrl = this.pathOnly(this.router.url);
    this.routeHistory.push(initialUrl);
    this.updateNavigationChrome(initialUrl);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        const currentUrl = this.pathOnly(event.urlAfterRedirects);
        if (this.handlingTelegramBack) {
          if (this.routeHistory.length > 1) this.routeHistory.pop();
          this.handlingTelegramBack = false;
        } else if (this.routeHistory.at(-1) !== currentUrl) {
          const existingIndex = this.routeHistory.lastIndexOf(currentUrl);
          if (existingIndex >= 0) this.routeHistory.splice(existingIndex + 1);
          else this.routeHistory.push(currentUrl);
          if (this.routeHistory.length > 30) this.routeHistory.shift();
        }
        this.updateNavigationChrome(currentUrl);
      });

    const startRoute = routeFromStartParam(this.telegram.startParam);
    if (startRoute && this.pathOnly(this.router.url) !== startRoute) {
      void this.router.navigateByUrl(startRoute, { replaceUrl: true });
    }
  }

  private navigateBackInApp(): void {
    if (this.handlingTelegramBack) return;
    const currentUrl = this.pathOnly(this.router.url);
    const targetUrl = this.routeHistory.length > 1
      ? this.routeHistory[this.routeHistory.length - 2]
      : this.parentRoute(currentUrl);
    if (!targetUrl || targetUrl === currentUrl) return;

    if (this.routeHistory.length === 1) this.routeHistory.unshift(targetUrl);
    this.handlingTelegramBack = true;
    void this.router.navigateByUrl(targetUrl).then((navigated) => {
      if (!navigated && this.handlingTelegramBack) {
        this.handlingTelegramBack = false;
        if (this.routeHistory.length === 2 && this.routeHistory[0] === targetUrl) this.routeHistory.shift();
      }
    });
  }

  private updateNavigationChrome(url: string): void {
    this.breadcrumbs.set(this.createBreadcrumbs(url));
    const section = url.split('/').filter(Boolean)[0] ?? 'meetups';
    const activeTab = section === 'calendar' ? 'calendar'
      : section === 'meetups' || section === 'interests' || section === 'tg-groups' ? 'meetups'
      : ['profile', 'my-tickets', 'organizer', 'create-event', 'admin'].includes(section) ? 'profile'
      : section === 'terms' ? null
      : 'events';
    this.activeTab.set(activeTab);
    const isPrimaryRoute = url === '/' || (['events', 'calendar', 'meetups', 'profile'].includes(section) && url.split('/').filter(Boolean).length === 1);
    this.telegram.setBackButtonVisible(!isPrimaryRoute);
  }

  private createBreadcrumbs(url: string): Breadcrumb[] {
    const segments = url.split('/').filter(Boolean);
    if (segments.length === 1 && ['events', 'meetups', 'calendar', 'profile'].includes(segments[0])) return [];
    if (segments[0] === 'admin' && segments[1] === 'event-review')
      return [{ key: 'breadcrumb.orders', url: '/admin' }, { key: 'breadcrumb.review' }];
    if (segments[0] === 'admin' && segments[1] === 'bot-messages')
      return [{ key: 'breadcrumb.orders', url: '/admin' }, { key: 'breadcrumb.botMessages' }];
    if (segments[0] === 'admin' && segments[1] === 'analytics')
      return [{ key: 'breadcrumb.profile', url: '/profile' }, { key: 'breadcrumb.analytics' }];
    if (segments[0] === 'events' && segments.length >= 2) {
      const trail: Breadcrumb[] = [{ key: 'breadcrumb.events', url: '/events' }];
      if (segments.length === 2) trail.push({ key: 'breadcrumb.event' });
      else if (segments[2] === 'buy') {
        trail.push({ key: 'breadcrumb.event', url: `/events/${segments[1]}` });
        trail.push({ key: 'breadcrumb.ticket' });
      }
      return trail;
    }

    const labels: Record<string, TranslationKey> = {
      events: 'breadcrumb.events',
      meetups: 'breadcrumb.meetups',
      calendar: 'breadcrumb.calendar',
      'city-map': 'breadcrumb.map',
      'my-tickets': 'breadcrumb.tickets',
      orders: 'breadcrumb.orders',
      admin: 'breadcrumb.orders',
      'tg-groups': 'breadcrumb.groups',
      'create-event': 'breadcrumb.createEvent',
      profile: 'breadcrumb.profile',
      terms: 'breadcrumb.terms',
    };
    const currentLabel = labels[segments[0]];
    return currentLabel ? [{ key: 'breadcrumb.home', url: '/' }, { key: currentLabel }] : [];
  }

  private parentRoute(url: string): string | null {
    const segments = url.split('/').filter(Boolean);
    if (segments[0] === 'calendar' || segments[0] === 'city-map') return '/events';
    if (segments[0] === 'events' && segments.length >= 3 && segments[2] === 'buy') return `/events/${segments[1]}`;
    if (segments[0] === 'events' && segments.length >= 2) return '/events';
    if (segments.length > 0 && url !== '/' && url !== '/meetups') return '/events';
    return null;
  }

  private pathOnly(url: string): string {
    const path = url.split(/[?#]/, 1)[0];
    return path || '/';
  }
}

export function routeFromStartParam(startParam: string): string | null {
  if (startParam === 'meetups') return '/meetups';
  if (startParam === 'interests') return '/interests';
  if (startParam.startsWith('interest_')) {
    const interestId = startParam.slice('interest_'.length);
    return /^[a-z\d-]{1,60}$/i.test(interestId) ? `/interests?group=${encodeURIComponent(interestId)}` : null;
  }
  if (startParam.startsWith('meetup_')) {
    const match = /^meetup_([a-z\d-]{1,60})_(\d{8})(?:_c_([a-z\d-]{1,24}))?$/i.exec(startParam);
    if (!match) return null;
    const [, venueId, date, campaign] = match;
    if (campaign && !['host-a', 'host-b', 'host-c'].includes(campaign.toLowerCase())) return null;
    const isoDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
    const parsedDate = new Date(`${isoDate}T00:00:00.000Z`);
    if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== isoDate) return null;
    const campaignParam = campaign ? `&campaign=${encodeURIComponent(campaign.toLowerCase())}` : '';
    return `/meetups?venue=${encodeURIComponent(venueId)}&date=${isoDate}${campaignParam}`;
  }
  if (!startParam.startsWith('event_')) return null;
  const eventId = startParam.slice('event_'.length);
  return /^[a-z\d_-]{1,100}$/i.test(eventId) ? `/events/${encodeURIComponent(eventId)}` : null;
}
