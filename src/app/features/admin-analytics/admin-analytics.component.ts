import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { EventsApiService } from '../../core/services/events-api.service';
import { I18nService } from '../../core/services/i18n.service';
import { TelegramService } from '../../core/services/telegram.service';
import type { AnalyticsInsightsSummary, DailyFunnelSummary, FunnelSummaryRow, MeetupCampaignSummaryRow, MeetupDensitySummary, MeetupVenueOption } from '../../core/types/event.model';

@Component({
  selector: 'app-admin-analytics',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="analytics-page">
      <header class="heading">
        <span class="eyebrow">TUSA / ADMIN</span>
        <h1>{{ i18n.t('analytics.heading') }}</h1>
        <p>{{ i18n.t('analytics.description') }}</p>
      </header>
      <nav class="analytics-tabs" [attr.aria-label]="i18n.t('analytics.tabsLabel')">
        <a routerLink="/admin/analytics" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">{{ i18n.t('analytics.statsTab') }}</a>
        <a routerLink="/admin/analytics/board" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">{{ i18n.t('analytics.boardTab') }}</a>
      </nav>

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
            <a class="telegram-access" [href]="adminTelegramLink" target="_blank" rel="noopener noreferrer">
              {{ i18n.t('analytics.openInTelegram') }}
            </a>
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
          <section class="density" aria-labelledby="insights-heading" aria-live="polite">
            <div class="insights-toolbar">
              <h2 id="insights-heading">{{ i18n.t('analytics.insightsHeading') }}</h2>
              <label>{{ i18n.t('analytics.period') }}
                <select [attr.aria-label]="i18n.t('analytics.period')" [value]="insightsDays()" (change)="setInsightsDays($event)">
                  <option value="7">{{ i18n.t('analytics.days7') }}</option>
                  <option value="30">{{ i18n.t('analytics.days30') }}</option>
                  <option value="90">{{ i18n.t('analytics.days90') }}</option>
                </select>
              </label>
            </div>
            @if (insightsLoading() && insights() === null) {
              <p class="state" role="status">{{ i18n.t('analytics.dailyLoading') }}</p>
            } @else if (insights() === null) {
              <p class="state error" role="alert">{{ i18n.t('analytics.dailyUnavailable') }}</p>
            } @else {
              <p class="density-window">{{ insights()!.fromDate }} — {{ insights()!.throughDate }} · {{ i18n.t('analytics.timezoneAstana') }}</p>
              <div class="trend-grid">
                @for (metric of insightMetrics; track metric.name) {
                  <article class="trend-card">
                    <h3>{{ i18n.t(metric.labelKey) }}</h3>
                    <strong>{{ insightsTotal(metric.name) }}</strong>
                    <svg viewBox="0 0 100 36" role="img" [attr.aria-label]="i18n.t(metric.labelKey) + ' · ' + insightsTotal(metric.name)">
                      <polyline [attr.points]="trendPoints(metric.name)" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </article>
                }
              </div>
              <div class="insight-tables">
                <section aria-labelledby="search-terms-heading">
                  <h3 id="search-terms-heading">{{ i18n.t('analytics.topSearchTerms') }}</h3>
                  @if (!insights()!.topSearchTerms.length) { <p class="state">{{ i18n.t('analytics.noSearchTerms') }}</p> }
                  @else { <ul>@for (term of insights()!.topSearchTerms; track term.name) { <li><span>{{ term.name }}</span><b>{{ term.count }}</b></li> }</ul> }
                </section>
                <section aria-labelledby="popular-categories-heading">
                  <h3 id="popular-categories-heading">{{ i18n.t('analytics.popularCategories') }}</h3>
                  @if (!insights()!.popularCategories.length) { <p class="state">{{ i18n.t('analytics.noCategories') }}</p> }
                  @else { <ul>@for (category of insights()!.popularCategories; track category.name) { <li><span>{{ category.name }}</span><b>{{ category.count }}</b></li> }</ul> }
                </section>
              </div>
              <section class="promotion-funnel" aria-labelledby="promotion-funnel-heading">
                <h3 id="promotion-funnel-heading">{{ i18n.t('analytics.promotionFunnel') }}</h3>
                <ul>
                  <li><span>{{ i18n.t('analytics.offerViews') }}</span><b>{{ insights()!.promotionFunnel.offerViews }}</b></li>
                  <li><span>{{ i18n.t('analytics.invoiceStarts') }}</span><b>{{ insights()!.promotionFunnel.invoiceStarts }}</b></li>
                  <li><span>{{ i18n.t('analytics.preCheckout') }}</span><b>{{ insights()!.promotionFunnel.preCheckout }}</b></li>
                  <li><span>{{ i18n.t('analytics.cancelled') }}</span><b>{{ insights()!.promotionFunnel.cancelledOrClosed }}</b></li>
                  <li><span>{{ i18n.t('analytics.ticketSellerClicks') }}</span><b>{{ insights()!.promotionFunnel.ticketSellerClicks }}</b></li>
                  <li><span>{{ i18n.t('analytics.paid') }}</span><b>{{ insights()!.promotionFunnel.paid }}</b></li>
                  <li><span>{{ i18n.t('analytics.refunded') }}</span><b>{{ insights()!.promotionFunnel.refunded }}</b></li>
                </ul>
              </section>
              <p class="caveat">{{ i18n.t('analytics.insightsCaveat') }}</p>
            }
          </section>
          <section class="density" aria-labelledby="daily-heading" aria-live="polite">
            <h2 id="daily-heading">{{ i18n.t('analytics.dailyHeading') }}</h2>
            @if (dailyLoading() && dailySummary() === null) {
              <p class="state" role="status">{{ i18n.t('analytics.dailyLoading') }}</p>
            } @else if (dailySummary() === null) {
              <p class="state error" role="alert">{{ i18n.t('analytics.dailyUnavailable') }}</p>
            } @else {
              <p class="density-window">{{ i18n.t('analytics.dailyDescription') }} {{ dailySummary()!.fromDate }} — {{ dailySummary()!.throughDate }}</p>
              <div class="metric-grid">
                @for (date of dailyDates(); track date) {
                  <article class="metric-card">
                    <span><time [attr.datetime]="date">{{ formatTrendDate(date) }}</time></span>
                    <div>
                      @for (metric of trendMetrics; track metric.name) {
                        <small>{{ i18n.t(metric.labelKey) }}: <b>{{ dailyCount(date, metric.name) }}</b></small>
                      }
                    </div>
                  </article>
                }
              </div>
              <p class="caveat">{{ i18n.t('analytics.dailyNote') }}</p>
            }
          </section>
          <section class="density" aria-labelledby="density-heading" aria-live="polite">
            <h2 id="density-heading">{{ i18n.t('analytics.densityHeading') }}</h2>
            @if (densityLoading() && density() === null) {
              <p class="state" role="status">{{ i18n.t('analytics.densityLoading') }}</p>
            } @else if (density() === null) {
              <p class="state error" role="alert">{{ i18n.t('analytics.densityUnavailable') }}</p>
            } @else {
              <p class="density-window">{{ i18n.t('analytics.densityDescription') }} {{ density()!.fromDate }} — {{ density()!.throughDate }}</p>
              @if (density()!.plans.length === 0) {
                <p class="state">{{ i18n.t('analytics.noDensePlans') }}</p>
              } @else {
                <ul class="density-list">
                  @for (plan of density()!.plans; track plan.venueId + plan.date) {
                    <li><strong>{{ plan.venue }}</strong><time [attr.datetime]="plan.date">{{ plan.date }}</time><b>{{ plan.rsvpCount }} {{ i18n.t('analytics.densityCount') }}</b></li>
                  }
                </ul>
              }
              <p class="caveat">{{ i18n.t('analytics.densityNote') }}</p>
            }
          </section>
          @if (campaigns() !== null) {
            <section class="campaigns" aria-labelledby="campaign-heading">
              <h2 id="campaign-heading">{{ i18n.t('analytics.campaigns') }}</h2>
              <section class="campaign-builder" aria-labelledby="campaign-builder-heading">
                <h3 id="campaign-builder-heading">{{ i18n.t('analytics.linkBuilder') }}</h3>
                @if (venueOptionsLoading()) {
                  <p class="state" role="status">{{ i18n.t('analytics.venuesLoading') }}</p>
                } @else if (venueOptions().length === 0) {
                  <p class="state" role="alert">{{ i18n.t('analytics.venuesUnavailable') }}</p>
                } @else {
                  <div class="campaign-form">
                    <label for="campaign-venue">{{ i18n.t('analytics.venueLabel') }}</label>
                    <select id="campaign-venue" [value]="campaignVenueId()" (change)="setCampaignVenue($event)">
                      @for (venue of venueOptions(); track venue.id) {
                        <option [value]="venue.id">{{ venue.name }}</option>
                      }
                    </select>

                    <label for="campaign-date">{{ i18n.t('analytics.dateLabel') }}</label>
                    <input id="campaign-date" type="date" [min]="campaignToday" [max]="campaignDateMax" [value]="campaignDate()" (change)="setCampaignDate($event)">

                    <label for="campaign-alias">{{ i18n.t('analytics.channelLabel') }}</label>
                    <select id="campaign-alias" [value]="campaignAlias()" (change)="setCampaignAlias($event)">
                      @for (alias of campaignAliases; track alias) {
                        <option [value]="alias">{{ alias }}</option>
                      }
                    </select>
                  </div>
                  @if (campaignLink(); as link) {
                    <a class="generated-link" [href]="link" target="_blank" rel="noopener noreferrer">{{ i18n.t('analytics.openGeneratedLink') }}</a>
                    <button type="button" class="copy-link" (click)="copyCampaignLink()">{{ i18n.t('analytics.copyLink') }}</button>
                  }
                  <p class="copy-feedback" aria-live="polite">{{ linkFeedback() ? i18n.t(linkFeedback()!) : '' }}</p>
                }
                <p class="caveat">{{ i18n.t('analytics.linkBuilderNote') }}</p>
              </section>
              @if (campaigns()!.length === 0) {
                <p class="state">{{ i18n.t('analytics.noCampaigns') }}</p>
              } @else {
                <ul>
                  @for (campaign of campaigns(); track $index) {
                    <li>
                      <strong>{{ campaign.campaign }}</strong>
                      <span>{{ campaign.venueId }}</span>
                      <span>{{ i18n.t(campaign.name === 'meetup_share_intent' ? 'analytics.meetupShares' : 'analytics.meetupInviteOpens') }}</span>
                      <b>{{ campaign.count }}</b>
                    </li>
                  }
                </ul>
              }
              <p class="caveat">{{ i18n.t('analytics.campaignsNote') }}</p>
            </section>
          }
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
    .analytics-tabs { display: flex; gap: .45rem; margin: 1rem 0; border-bottom: 1px solid var(--tg-line); }
    .analytics-tabs a { min-height: 44px; padding: .65rem .85rem; border-bottom: 2px solid transparent; color: var(--tg-muted); font-size: .82rem; text-decoration: none; }
    .analytics-tabs a.active { border-color: var(--tg-button); color: var(--tg-button); font-weight: 700; }
    .panel { margin-top: 1rem; padding: 1rem; background: var(--tg-surface, #fff); border: 1px solid var(--tg-line); border-radius: 8px; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: .75rem; margin-bottom: .8rem; color: var(--tg-muted); font-size: .8rem; }
    button { min-height: 44px; padding: .55rem .8rem; border: 1px solid var(--tg-line); border-radius: 6px; background: transparent; color: var(--tg-text); cursor: pointer; }
    button:disabled { opacity: .55; cursor: wait; }
    .state { display: grid; justify-items: center; gap: .6rem; padding: 1.5rem .5rem; text-align: center; }
    .state strong { color: var(--tg-text); }
    .telegram-access { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; padding: .55rem .8rem; border-radius: 6px; background: var(--tg-button); color: var(--tg-button-text, #fff); font-size: .82rem; font-weight: 700; text-decoration: none; }
    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: .65rem; }
    .metric-card { display: grid; gap: .3rem; min-height: 7rem; padding: .85rem; border: 1px solid var(--tg-line); border-radius: 7px; }
    .metric-card span { color: var(--tg-muted); font-size: .74rem; }
    .metric-card strong { color: var(--tg-button); font-size: 1.8rem; font-variant-numeric: tabular-nums; }
    .metric-card small { color: var(--tg-muted); font-size: .68rem; line-height: 1.4; }
    .density { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--tg-line); }
    .density h2 { margin: 0 0 .4rem; font-size: 1rem; }
    .insights-toolbar { display: flex; align-items: center; justify-content: space-between; gap: .75rem; flex-wrap: wrap; }
    .insights-toolbar label { display: flex; align-items: center; gap: .45rem; color: var(--tg-muted); font-size: .73rem; }
    .insights-toolbar select { min-height: 40px; padding: .35rem .55rem; border: 1px solid var(--tg-line); border-radius: 6px; background: var(--tg-surface); color: var(--tg-text); font: inherit; }
    .trend-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: .6rem; margin-top: .75rem; }
    .trend-card { min-width: 0; padding: .7rem; border: 1px solid var(--tg-line); border-radius: 7px; }
    .trend-card h3 { margin: 0 0 .3rem; color: var(--tg-muted); font-size: .72rem; font-weight: 600; }
    .trend-card strong { color: var(--tg-button); font-size: 1.25rem; font-variant-numeric: tabular-nums; }
    .trend-card svg { display: block; width: 100%; height: 2.8rem; margin-top: .4rem; color: var(--tg-button); overflow: visible; }
    .insight-tables { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: .75rem; margin-top: 1rem; }
    .insight-tables h3, .promotion-funnel h3 { margin: 0 0 .45rem; font-size: .85rem; }
    .insight-tables ul, .promotion-funnel ul { display: grid; gap: .35rem; margin: 0; padding: 0; list-style: none; }
    .insight-tables li, .promotion-funnel li { display: flex; justify-content: space-between; gap: .6rem; padding: .45rem .55rem; border: 1px solid var(--tg-line); border-radius: 5px; font-size: .74rem; }
    .insight-tables li span, .promotion-funnel li span { color: var(--tg-muted); }
    .insight-tables li b, .promotion-funnel li b { color: var(--tg-button); font-variant-numeric: tabular-nums; }
    .promotion-funnel { margin-top: 1rem; }
    .density-window { color: var(--tg-muted); font-size: .75rem; }
    .density-list { display: grid; gap: .5rem; margin: .75rem 0 0; padding: 0; list-style: none; }
    .density-list li { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: .75rem; padding: .7rem; border: 1px solid var(--tg-line); border-radius: 6px; font-size: .8rem; }
    .density-list time { color: var(--tg-muted); }
    .density-list b { color: var(--tg-button); font-variant-numeric: tabular-nums; }
    .campaigns { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--tg-line); }
    .campaigns h2 { margin: 0 0 .75rem; font-size: 1rem; }
    .campaign-builder { margin: .75rem 0 1rem; padding: .8rem; border: 1px solid var(--tg-line); border-radius: 7px; }
    .campaign-builder h3 { margin: 0 0 .7rem; font-size: .9rem; }
    .campaign-form { display: grid; grid-template-columns: minmax(8rem, .45fr) minmax(12rem, 1fr); align-items: center; gap: .55rem .8rem; }
    .campaign-form label { color: var(--tg-muted); font-size: .78rem; }
    .campaign-form select, .campaign-form input { width: 100%; min-height: 44px; padding: .5rem .65rem; border: 1px solid var(--tg-line); border-radius: 6px; background: var(--tg-surface, #fff); color: var(--tg-text); font: inherit; }
    .generated-link { display: inline-block; margin: .75rem .75rem 0 0; color: var(--tg-button); font-size: .82rem; }
    .copy-link { margin-top: .75rem; }
    .copy-feedback { min-height: 1.2em; margin: .35rem 0 0; color: var(--tg-muted); font-size: .75rem; }
    .campaigns ul { display: grid; gap: .5rem; margin: 0; padding: 0; list-style: none; }
    .campaigns li { display: grid; grid-template-columns: minmax(5rem, .7fr) minmax(8rem, 1fr) minmax(8rem, 1fr) auto; align-items: center; gap: .6rem; padding: .65rem; border: 1px solid var(--tg-line); border-radius: 6px; font-size: .78rem; }
    .campaigns li span { color: var(--tg-muted); }
    .campaigns li b { color: var(--tg-button); font-size: 1.1rem; }
    .caveat { margin: .85rem 0 0; font-size: .72rem; }
    .back-link { display: inline-block; margin-top: 1rem; color: var(--tg-button); font-size: .82rem; text-decoration: none; }
    @media (max-width: 600px) { .analytics-page { padding: 1rem .75rem 6rem; } .panel { padding: .75rem; } .campaign-form { grid-template-columns: 1fr; gap: .3rem; } .campaign-form label:not(:first-child) { margin-top: .4rem; } }
    @media (max-width: 560px) { .campaigns li { grid-template-columns: 1fr auto; } .campaigns li span { grid-column: 1; } .campaigns li b { grid-column: 2; grid-row: 1 / span 3; } }
    @media (max-width: 560px) { .density-list li { grid-template-columns: 1fr auto; } .density-list time { grid-column: 1; } .density-list b { grid-column: 2; grid-row: 1 / span 2; } }
  `],
})
export class AdminAnalyticsComponent {
  protected readonly i18n = inject(I18nService);
  private readonly telegram = inject(TelegramService);
  readonly adminTelegramLink = this.telegram.miniAppLink('admin_analytics');
  readonly summary = signal<FunnelSummaryRow[] | null>(null);
  readonly dailySummary = signal<DailyFunnelSummary | null>(null);
  readonly dailyLoading = signal(false);
  readonly insights = signal<AnalyticsInsightsSummary | null>(null);
  readonly insightsLoading = signal(false);
  readonly insightsDays = signal<7 | 30 | 90>(7);
  readonly campaigns = signal<MeetupCampaignSummaryRow[] | null>(null);
  readonly density = signal<MeetupDensitySummary | null>(null);
  readonly densityLoading = signal(false);
  readonly loading = signal(false);
  readonly venueOptions = signal<MeetupVenueOption[]>([]);
  readonly venueOptionsLoading = signal(true);
  readonly campaignVenueId = signal('');
  readonly campaignDate = signal(new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10));
  readonly campaignAlias = signal<'host-a' | 'host-b' | 'host-c'>('host-a');
  readonly linkFeedback = signal<'analytics.linkCopied' | 'analytics.linkCopyFailed' | null>(null);
  readonly campaignAliases = ['host-a', 'host-b', 'host-c'] as const;
  readonly campaignToday = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  readonly campaignDateMax = this.addDays(this.campaignToday, 60);
  readonly campaignLink = computed(() => {
    const venueId = this.campaignVenueId();
    const date = this.campaignDate();
    if (!this.venueOptions().some((venue) => venue.id === venueId) || !this.isValidCampaignDate(date)) return null;
    return this.telegram.miniAppLink(`meetup_${venueId}_${date.replaceAll('-', '')}_c_${this.campaignAlias()}`);
  });
  readonly metrics = [
    { name: 'catalog_view', labelKey: 'analytics.catalogViews', noteKey: 'analytics.repeatedViewsNote' },
    { name: 'event_open', labelKey: 'analytics.eventOpens', noteKey: 'analytics.eventOpensNote' },
    { name: 'event_share', labelKey: 'analytics.shares', noteKey: 'analytics.sharesNote' },
    { name: 'community_open', labelKey: 'analytics.communityClicks', noteKey: 'analytics.communityClicksNote' },
    { name: 'meetup_share_intent', labelKey: 'analytics.meetupShares', noteKey: 'analytics.meetupSharesNote' },
    { name: 'meetup_invite_open', labelKey: 'analytics.meetupInviteOpens', noteKey: 'analytics.meetupInviteOpensNote' },
    { name: 'community_gathering_share', labelKey: 'analytics.gatheringShares', noteKey: 'analytics.gatheringSharesNote' },
    { name: 'community_gathering_open', labelKey: 'analytics.gatheringOpens', noteKey: 'analytics.gatheringOpensNote' },
    { name: 'community_gathering_rsvp', labelKey: 'analytics.gatheringRsvps', noteKey: 'analytics.gatheringRsvpsNote' },
  ] as const;
  readonly trendMetrics = [
    { name: 'catalog_view', labelKey: 'analytics.catalogViews' },
    { name: 'event_open', labelKey: 'analytics.eventOpens' },
    { name: 'meetup_invite_open', labelKey: 'analytics.meetupInviteOpens' },
    { name: 'community_gathering_rsvp', labelKey: 'analytics.gatheringRsvps' },
  ] as const;
  readonly insightMetrics = [
    { name: 'catalog_view', labelKey: 'analytics.catalogViews' },
    { name: 'event_open', labelKey: 'analytics.eventOpens' },
    { name: 'ticket_seller_click', labelKey: 'analytics.ticketSellerClicks' },
    { name: 'promotion_invoice_cancelled', labelKey: 'analytics.cancelled' },
  ] as const;
  readonly insightDates = computed(() => {
    const data = this.insights();
    if (!data) return [];
    const result: string[] = [];
    const current = new Date(`${data.fromDate}T00:00:00Z`);
    const end = new Date(`${data.throughDate}T00:00:00Z`);
    while (current <= end) {
      result.push(current.toISOString().slice(0, 10));
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return result;
  });
  readonly dailyDates = computed(() => {
    const summary = this.dailySummary();
    if (!summary) return [];
    const dates: string[] = [];
    const date = new Date(`${summary.fromDate}T00:00:00Z`);
    const end = new Date(`${summary.throughDate}T00:00:00Z`);
    while (date <= end) {
      dates.push(date.toISOString().slice(0, 10));
      date.setUTCDate(date.getUTCDate() + 1);
    }
    return dates;
  });

  constructor(private readonly api: EventsApiService) {
    this.refresh();
    this.api.getMeetupVenueOptions().subscribe((venues) => {
      this.venueOptions.set(venues ?? []);
      this.campaignVenueId.set(venues?.[0]?.id ?? '');
      this.venueOptionsLoading.set(false);
    });
  }

  refresh(): void {
    this.loading.set(true);
    this.api.getAdminFunnelSummary().subscribe((rows) => {
      this.summary.set(rows);
      this.loading.set(false);
    });
    this.dailyLoading.set(true);
    this.api.getAdminDailyFunnelSummary().subscribe((result) => {
      this.dailySummary.set(result);
      this.dailyLoading.set(false);
    });
    this.refreshInsights();
    this.densityLoading.set(true);
    this.api.getAdminMeetupDensitySummary().subscribe((result) => {
      this.density.set(result);
      this.densityLoading.set(false);
    });
    this.api.getAdminMeetupCampaignSummary().subscribe((rows) => this.campaigns.set(rows));
  }

  count(name: string): number {
    return this.summary()?.find((row) => row.name === name)?.count ?? 0;
  }

  dailyCount(date: string, name: string): number {
    return this.dailySummary()?.rows.find((row) => row.date === date && row.name === name)?.count ?? 0;
  }

  setInsightsDays(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (value === 7 || value === 30 || value === 90) {
      this.insightsDays.set(value);
      this.refreshInsights();
    }
  }

  refreshInsights(): void {
    this.insightsLoading.set(true);
    this.insights.set(null);
    this.api.getAdminAnalyticsInsights(this.insightsDays()).subscribe((result) => {
      this.insights.set(result);
      this.insightsLoading.set(false);
    });
  }

  insightsCount(date: string, name: string): number {
    return this.insights()?.daily.find((row) => row.date === date && row.name === name)?.count ?? 0;
  }

  insightsTotal(name: string): number {
    return this.insightDates().reduce((total, date) => total + this.insightsCount(date, name), 0);
  }

  trendPoints(name: string): string {
    const values = this.insightDates().map((date) => this.insightsCount(date, name));
    if (values.length < 2) return '50,34 100,34';
    const max = Math.max(...values, 1);
    return values.map((value, index) => {
      const x = index * 100 / (values.length - 1);
      const y = 33 - value / max * 29;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  formatTrendDate(date: string): string {
    const locale = this.i18n.locale() === 'kz' ? 'kk-KZ' : this.i18n.locale() === 'en' ? 'en-US' : 'ru-RU';
    return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' })
      .format(new Date(`${date}T12:00:00+05:00`));
  }

  setCampaignVenue(event: Event): void {
    this.campaignVenueId.set((event.target as HTMLSelectElement).value);
    this.linkFeedback.set(null);
  }

  setCampaignDate(event: Event): void {
    this.campaignDate.set((event.target as HTMLInputElement).value);
    this.linkFeedback.set(null);
  }

  setCampaignAlias(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (this.campaignAliases.includes(value as typeof this.campaignAliases[number])) {
      this.campaignAlias.set(value as typeof this.campaignAliases[number]);
      this.linkFeedback.set(null);
    }
  }

  async copyCampaignLink(): Promise<void> {
    const link = this.campaignLink();
    if (!link || typeof navigator === 'undefined' || !navigator.clipboard) {
      this.linkFeedback.set('analytics.linkCopyFailed');
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      this.linkFeedback.set('analytics.linkCopied');
    } catch {
      this.linkFeedback.set('analytics.linkCopyFailed');
    }
  }

  private isValidCampaignDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
    return value >= this.campaignToday && value <= this.campaignDateMax;
  }

  private addDays(value: string, days: number): string {
    const date = new Date(`${value}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }
}