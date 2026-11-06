import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventsApiService } from '../../core/services/events-api.service';
import { I18nService } from '../../core/services/i18n.service';
import type { FunnelSummaryRow } from '../../core/types/event.model';

@Component({
  selector: 'app-admin-analytics',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="analytics-page">
      <header class="heading">
        <span class="eyebrow">TUSA / ADMIN</span>
        <h1>{{ i18n.t('analytics.heading') }}</h1>
        <p>{{ i18n.t('analytics.description') }}</p>
      </header>

      <section class="panel" aria-live="polite">
        <div class="toolbar">
          <span>{{ i18n.t('analytics.summary') }}</span>
          <button type="button" (click)="refresh()" [disabled]="loading()">{{ i18n.t('analytics.refresh') }}</button>
        </div>
        @if (loading() && summary() === null) {
          <p class="state" role="status">{{ i18n.t('analytics.loading') }}</p>
        } @else if (summary() === null) {
          <div class="state error" role="alert">
            <strong>{{ i18n.t('analytics.loadError') }}</strong>
            <span>{{ i18n.t('analytics.adminRequired') }}</span>
            <button type="button" (click)="refresh()">{{ i18n.t('analytics.retry') }}</button>
          </div>
        } @else {
          <div class="metric-grid">
            @for (metric of metrics; track metric.name) {
              <article class="metric-card">
                <span>{{ i18n.t(metric.labelKey) }}</span>
                <strong>{{ count(metric.name) }}</strong>
                <small>{{ i18n.t(metric.noteKey) }}</small>
              </article>
            }
          </div>
          <p class="caveat">{{ i18n.t('analytics.caveat') }}</p>
        }
      </section>
      <a class="back-link" routerLink="/profile">{{ i18n.t('analytics.backToProfile') }}</a>
    </main>
  `,
  styles: [`
    .analytics-page { max-width: 980px; margin: 0 auto; padding: 2rem 1.25rem 6rem; }
    .heading { padding: 1rem 0 1.5rem; border-bottom: 1px solid var(--tg-line); }
    .eyebrow { color: var(--tg-button, #aabd7e); font-size: .68rem; font-weight: 800; letter-spacing: .16em; }
    h1 { margin: .6rem 0 .4rem; font-size: clamp(2rem, 7vw, 4rem); font-weight: 500; }
    .heading p, .state, .caveat { color: var(--tg-muted); font-size: .85rem; line-height: 1.55; }
    .panel { margin-top: 1rem; padding: 1rem; background: var(--tg-surface, #fff); border: 1px solid var(--tg-line); border-radius: 8px; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: .75rem; margin-bottom: .8rem; color: var(--tg-muted); font-size: .8rem; }
    button { min-height: 44px; padding: .55rem .8rem; border: 1px solid var(--tg-line); border-radius: 6px; background: transparent; color: var(--tg-text); cursor: pointer; }
    button:disabled { opacity: .55; cursor: wait; }
    .state { display: grid; justify-items: center; gap: .6rem; padding: 1.5rem .5rem; text-align: center; }
    .state strong { color: var(--tg-text); }
    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: .65rem; }
    .metric-card { display: grid; gap: .3rem; min-height: 7rem; padding: .85rem; border: 1px solid var(--tg-line); border-radius: 7px; }
    .metric-card span { color: var(--tg-muted); font-size: .74rem; }
    .metric-card strong { color: var(--tg-button); font-size: 1.8rem; font-variant-numeric: tabular-nums; }
    .metric-card small { color: var(--tg-muted); font-size: .68rem; line-height: 1.4; }
    .caveat { margin: .85rem 0 0; font-size: .72rem; }
    .back-link { display: inline-block; margin-top: 1rem; color: var(--tg-button); font-size: .82rem; text-decoration: none; }
    @media (max-width: 600px) { .analytics-page { padding: 1rem .75rem 6rem; } .panel { padding: .75rem; } }
  `],
})
export class AdminAnalyticsComponent {
  protected readonly i18n = inject(I18nService);
  readonly summary = signal<FunnelSummaryRow[] | null>(null);
  readonly loading = signal(false);
  readonly metrics = [
    { name: 'catalog_view', labelKey: 'analytics.catalogViews', noteKey: 'analytics.repeatedViewsNote' },
    { name: 'event_open', labelKey: 'analytics.eventOpens', noteKey: 'analytics.eventOpensNote' },
    { name: 'event_share', labelKey: 'analytics.shares', noteKey: 'analytics.sharesNote' },
    { name: 'community_open', labelKey: 'analytics.communityClicks', noteKey: 'analytics.communityClicksNote' },
    { name: 'meetup_share_intent', labelKey: 'analytics.meetupShares', noteKey: 'analytics.meetupSharesNote' },
    { name: 'meetup_invite_open', labelKey: 'analytics.meetupInviteOpens', noteKey: 'analytics.meetupInviteOpensNote' },
  ] as const;

  constructor(private readonly api: EventsApiService) {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.api.getAdminFunnelSummary().subscribe((rows) => {
      this.summary.set(rows);
      this.loading.set(false);
    });
  }

  count(name: string): number {
    return this.summary()?.find((row) => row.name === name)?.count ?? 0;
  }
}