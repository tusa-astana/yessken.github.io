import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventsApiService } from '../../core/services/events-api.service';
import { I18nService } from '../../core/services/i18n.service';
import { TelegramService } from '../../core/services/telegram.service';
import type { FunnelSummaryRow, MeetupCampaignSummaryRow, MeetupVenueOption } from '../../core/types/event.model';

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
  `],
})
export class AdminAnalyticsComponent {
  protected readonly i18n = inject(I18nService);
  private readonly telegram = inject(TelegramService);
  readonly summary = signal<FunnelSummaryRow[] | null>(null);
  readonly campaigns = signal<MeetupCampaignSummaryRow[] | null>(null);
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
    this.api.getAdminMeetupCampaignSummary().subscribe((rows) => this.campaigns.set(rows));
  }

  count(name: string): number {
    return this.summary()?.find((row) => row.name === name)?.count ?? 0;
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