import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { TelegramService } from '../../core/services/telegram.service';
import { I18nService } from '../../core/services/i18n.service';
import type { EventItem, EventPromotionOffer } from '../../core/types/event.model';
import QRCode from 'qrcode';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (event(); as ev) {
      <div class="event-detail">
        <header class="event-hero">
          <img [src]="ev.imageUrl" [alt]="''" class="cover" fetchpriority="high" />
          <div class="hero-content">
            <div class="heading-row">
              <span class="category">{{ ev.category }}</span>
              @if (ev.featured) { <span class="featured-badge">ПРОМО</span> }
            </div>
            <h1>{{ ev.title }}</h1>
            <p class="hero-meta"><span>{{ formatEventDate(ev.date) }}</span><span>{{ ev.time }}</span></p>
          </div>
          @if (isIllustrativeImage(ev.imageUrl)) { <span class="image-note">{{ i18n.t('events.illustrative') }}</span> }
        </header>
        <div class="body">
          @if (ev.isDemo) { <p class="demo-notice" role="note">{{ i18n.t('events.details.demoNotice') }}</p> }
          <section class="details-card" aria-label="Сведения о событии">
            <div class="detail-line"><span class="detail-icon" aria-hidden="true">⌖</span><div><small>{{ i18n.t('events.details.place') }}</small><strong>{{ ev.place }}</strong>@if (ev.address) { <span>{{ ev.address }}</span> }</div></div>
            <div class="detail-line"><span class="detail-icon" aria-hidden="true">₸</span><div><small>{{ i18n.t('events.details.price') }}</small><strong>{{ priceLabel(ev) }}</strong><span>{{ i18n.t('events.details.organizerInfo') }}</span></div></div>
          </section>
          @if (ev.ticketUrl) {
            <a class="external-ticket-link" [href]="ev.ticketUrl" target="_blank" rel="noopener noreferrer" (click)="trackTicketSellerClick(ev)">Билеты у {{ ev.ticketSellerName || 'внешнего дистрибьютора' }} ↗</a>
          }
          <p class="description">{{ ev.description }}</p>
          <p class="ticket-policy" role="note">{{ i18n.t('events.details.rsvpPolicy') }}</p>
          <div class="going-row">
            @if (ev.goingCount !== undefined && ev.goingCount > 0) {
              <span class="going-count">{{ ev.goingCount }} RSVP</span>
            }
            <button
              type="button"
              class="btn-going"
              [class.active]="ev.userGoing"
              (click)="toggleGoing(ev)"
              [disabled]="goingLoading() || ev.isDemo || !telegram.isInTelegram">
              {{ goingLoading() ? i18n.t('events.details.rsvpSaving') : (ev.userGoing ? i18n.t('events.details.rsvpSaved') : i18n.t('events.details.rsvp')) }}
            </button>
            @if (!telegram.isInTelegram && !ev.isDemo) { <a class="telegram-hint" href="https://t.me/tusa_astana_bot">{{ i18n.t('events.details.telegramPrompt') }}</a> }
            @if (goingError()) { <p class="going-error" role="alert">{{ i18n.t('events.details.rsvpError') }}</p> }
          </div>
          <button type="button" class="btn-share" (click)="share(ev)">{{ shareLabel() || i18n.t('events.details.share') }}</button>
          @if (promotionOffer()?.eligible || promotionOffer()?.status) {
            <section class="promotion-card" aria-labelledby="promotion-title">
              <h2 id="promotion-title">Продвинуть событие</h2>
              <p>Помеченное промо-размещение до даты события · {{ promotionOffer()?.stars }} ⭐. Билеты продаёт {{ ev.ticketSellerName || 'указанный внешний дистрибьютор' }}.</p>
              @if (promotionOffer()?.status === 'paid') {
                <p class="promotion-message" role="status">Промо оплачено и активно до {{ promotionOffer()?.expiresAt | date:'d MMM y' }}. ID кампании: {{ promotionOffer()?.campaignId }}.</p>
              } @else if (promotionOffer()?.status === 'pending') {
                <p class="promotion-message" role="status">Счёт Stars уже создавался. ID кампании: {{ promotionOffer()?.campaignId }}. Если окно было закрыто, можно открыть оплату повторно.</p>
              } @else if (promotionOffer()?.status === 'refunded' || promotionOffer()?.status === 'refund_requested') {
                <p class="promotion-message" role="status">По этой кампании оформлен возврат или запрос на возврат.</p>
              }
              @if (promotionOffer()?.available && promotionOffer()?.status !== 'paid' && promotionOffer()?.status !== 'refunded' && promotionOffer()?.status !== 'refund_requested') {
                <label><input type="checkbox" [checked]="promotionTermsAccepted()" (change)="promotionTermsAccepted.set($any($event.target).checked)" /> Я принимаю <a routerLink="/terms">условия цифрового продвижения</a>.</label>
                <button type="button" class="promotion-button" [disabled]="promotionLoading() || !promotionTermsAccepted()" (click)="startPromotion(ev)">{{ promotionLoading() ? 'Создаём счёт…' : (promotionOffer()?.status === 'pending' ? 'Открыть оплату' : 'Оплатить ' + promotionOffer()?.stars + ' ⭐') }}</button>
              } @else if (promotionOffer()?.eligible) {
                <p class="promotion-message" role="status">Покупка пока не включена. Оплата не списывается.</p>
              }
              @if (promotionMessage()) { <p class="promotion-message" role="status">{{ promotionMessage() }}</p> }
              @if (promotionError()) { <p class="promotion-error" role="alert">{{ promotionError() }}</p> }
            </section>
          }
          <button type="button" class="btn-tools" (click)="toolsVisible.update((visible) => !visible)">{{ i18n.t('events.details.shareMaterials') }}</button>
          @if (toolsVisible()) {
            <div class="share-tools">
              @if (qrCode()) {
                <img class="event-qr" [src]="qrCode()" [alt]="'QR-код события ' + ev.title" />
                <a class="download-qr" [href]="qrCode()" [download]="'tusa-' + ev.id + '-qr.png'">Скачать QR-код</a>
              }
              <textarea readonly [value]="shareText(ev)"></textarea>
              <button type="button" class="copy-text" (click)="copyShareText(ev)">{{ copyLabel() || i18n.t('events.details.copy') }}</button>
            </div>
          }
        </div>
      </div>
    } @else {
      <p>{{ i18n.t('events.details.notFound') }}</p>
    }
  `,
  styles: [
    `
      .event-detail { max-width: 1040px; margin: 0 auto; padding: 0 1rem 5.5rem; }
      .event-hero { position: relative; display: flex; align-items: end; min-height: 260px; margin: .35rem -1rem 0; overflow: hidden; border-radius: 0 0 20px 20px; background: #24352b; }
      .cover { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .event-hero::after { position: absolute; inset: 0; content: ''; background: linear-gradient(180deg, rgba(10,18,13,.05) 15%, rgba(10,18,13,.78) 100%); }
      .hero-content { position: relative; z-index: 1; width: 100%; padding: 1.25rem; color: #fff; }
      .heading-row { display: flex; align-items: center; gap: .5rem; }
      .category, .featured-badge { display: inline-flex; align-items: center; min-height: 1.55rem; padding: 0 .58rem; border: 1px solid rgba(255,255,255,.55); border-radius: 999px; background: rgba(15,24,18,.48); color: #fff; font-size: .66rem; font-weight: 700; backdrop-filter: blur(8px); }
      h1 { max-width: 740px; margin: .6rem 0 .55rem; font-size: clamp(1.8rem, 6vw, 3.25rem); line-height: 1.04; font-weight: 780; letter-spacing: -.05em; }
      .hero-meta { display: flex; flex-wrap: wrap; gap: .45rem .8rem; margin: 0; color: rgba(255,255,255,.83); font-size: .82rem; }
      .image-note { position: absolute; z-index: 2; top: .7rem; right: .7rem; padding: .3rem .55rem; border-radius: 999px; background: rgba(15,24,18,.65); color: #fff; font-size: .62rem; backdrop-filter: blur(8px); }
      .body { max-width: 760px; margin: 0 auto; padding: 1rem 0; }
      .details-card { display: grid; gap: .25rem; margin: 1rem 0; padding: .35rem .9rem; border: 1px solid var(--tg-line); border-radius: 14px; background: var(--tg-surface); }
      .detail-line { display: flex; align-items: flex-start; gap: .75rem; padding: .7rem 0; }
      .detail-line + .detail-line { border-top: 1px solid var(--tg-line); }
      .detail-icon { display: grid; flex: 0 0 auto; width: 2rem; height: 2rem; place-items: center; border-radius: 10px; background: color-mix(in srgb, var(--tg-button) 9%, transparent); color: var(--tg-button); }
      .detail-line div { display: grid; gap: .16rem; }
      .detail-line small { color: var(--tg-muted); font-size: .65rem; }
      .detail-line strong { font-size: .83rem; font-weight: 700; }
      .detail-line span:not(.detail-icon) { color: var(--tg-muted); font-size: .7rem; }
      .description { margin: 1.2rem 0; color: var(--tg-text); font-size: .92rem; line-height: 1.65; white-space: pre-line; }
      .demo-notice { margin: .75rem 0; padding: .7rem .8rem; border-left: 2px solid #a87a28; background: rgba(242,190,104,.12); color: #624814; font-size: .78rem; line-height: 1.45; }
      :host-context(.dark-theme) .demo-notice { border-left-color: #f2be68; color: #f2d29b; }
      .going-row { display: flex; align-items: center; gap: .75rem; margin: 1rem 0; flex-wrap: wrap; }
      .going-count { color: var(--tg-muted); font-size: .8rem; }
      .telegram-hint { flex-basis: 100%; color: var(--tg-button, #426c47); font-size: .78rem; }
      .going-error { flex-basis: 100%; margin: 0; color: #f27b68; font-size: .78rem; }
      .btn-going {
        min-height: 2.8rem;
        padding: 0 1.1rem;
        border-radius: 999px;
        border: 1px solid var(--tg-button, #426c47);
        background: var(--tg-button, #426c47);
        color: var(--tg-button-text, #ffffff);
        font-size: .84rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: var(--tg-glow);
      }
      .btn-going.active {
        background: color-mix(in srgb, var(--tg-button) 12%, var(--tg-surface));
        color: var(--tg-button);
        box-shadow: none;
      }
      .btn-going:disabled { opacity: 0.6; cursor: not-allowed; }
      .ticket-policy { margin: 1rem 0; padding: .8rem .9rem; border: 1px solid var(--tg-line); border-radius: 10px; color: var(--tg-muted); background: var(--tg-surface); font-size: .76rem; line-height: 1.5; }
      .external-ticket-link { display: inline-flex; min-height: 42px; align-items: center; margin: .25rem 0; color: var(--tg-button); font-size: .8rem; font-weight: 750; }
      .promotion-card { display: grid; gap: .55rem; margin: 1rem 0; padding: .9rem; border: 1px solid var(--tg-line); border-radius: 10px; background: var(--tg-surface); }
      .promotion-card h2, .promotion-card p { margin: 0; }
      .promotion-card h2 { font-size: 1rem; }
      .promotion-card p, .promotion-card label { color: var(--tg-muted); font-size: .76rem; line-height: 1.5; }
      .promotion-card label { display: flex; align-items: flex-start; gap: .45rem; }
      .promotion-card input { margin-top: .15rem; }
      .promotion-card a { color: var(--tg-button); }
      .promotion-button { width: fit-content; min-height: 44px; padding: .6rem .8rem; border: 0; border-radius: 7px; background: var(--tg-button); color: var(--tg-button-text, #fff); font: inherit; font-weight: 750; }
      .promotion-button:disabled { opacity: .55; }
      .promotion-message { color: var(--tg-button) !important; }
      .promotion-error { color: #b3483d !important; }
      .btn-share { display: inline-flex; align-items: center; min-height: 2.65rem; margin: .3rem .4rem .3rem 0; padding: 0 .9rem; border: 1px solid var(--tg-line); border-radius: 999px; background: var(--tg-surface); color: var(--tg-text); cursor: pointer; font-size: .78rem; font-weight: 650; }
      .btn-tools, .copy-text { display: inline-flex; align-items: center; min-height: 2.65rem; margin: .3rem 0; padding: 0 .9rem; border: 1px solid var(--tg-line); border-radius: 999px; background: var(--tg-surface); color: var(--tg-text); cursor: pointer; font-size: .78rem; }
      .share-tools { padding: .9rem; margin: .6rem 0 1rem; background: var(--tg-surface); border: 1px solid var(--tg-line); border-radius: 12px; }
      .event-qr { display: block; width: 150px; height: 150px; margin: 0 auto .75rem; background: white; }
      .download-qr { display: block; width: fit-content; margin: 0 auto .75rem; color: var(--tg-button, #aabd7e); font-size: .85rem; }
      .share-tools textarea { width: 100%; min-height: 84px; box-sizing: border-box; resize: vertical; padding: .6rem; border: 1px solid var(--tg-line); border-radius: 6px; background: var(--tg-surface, #ffffff); color: var(--tg-text, #26372b); font: inherit; }
      @media (min-width: 760px) { .event-detail { padding: 0 2rem 3rem; } .event-hero { min-height: 380px; margin: .6rem 0 0; border-radius: 20px; } .hero-content { padding: 2rem; } }
    `,
  ],
})
export class EventDetailComponent implements OnInit {
  protected readonly i18n = inject(I18nService);
  event = signal<EventItem | null>(null);
  promotionOffer = signal<EventPromotionOffer | null>(null);
  promotionTermsAccepted = signal(false);
  promotionLoading = signal(false);
  promotionMessage = signal('');
  promotionError = signal('');
  goingLoading = signal(false);
  goingError = signal(false);
  shareLabel = signal('');
  copyLabel = signal('');
  toolsVisible = signal(false);
  qrCode = signal('');

  constructor(
    private route: ActivatedRoute,
    private data: DataService,
    private analytics: AnalyticsService,
    protected telegram: TelegramService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.analytics.track('event_open', id);
      this.data.getEventById(id).subscribe((ev) => {
        this.event.set(ev ?? null);
        if (ev) this.generateQr(ev);
        if (ev && this.telegram.isInTelegram) {
          this.data.getEventPromotionOffer(id).subscribe((offer) => this.promotionOffer.set(offer));
        }
      });
      this.data.getEventGoing(id).subscribe((going) => {
        if (going) this.event.update((current) => current ? { ...current, ...going } : current);
      });
    }
  }

  formatEventDate(date: string): string {
    const locale = this.i18n.locale() === 'kz' ? 'kk-KZ' : this.i18n.locale() === 'en' ? 'en-US' : 'ru-RU';
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' })
      .format(new Date(`${date}T12:00:00`));
  }

  priceLabel(ev: EventItem): string {
    if (ev.price && ev.price > 0) return `${this.i18n.t('events.price.fromOrganizer')}: ${ev.price} ₸`;
    if (ev.price === 0) return this.i18n.t('events.price.freeByOrganizer');
    return this.i18n.t('events.price.contactOrganizer');
  }

  isIllustrativeImage(imageUrl: string): boolean { return imageUrl.includes('images.unsplash.com'); }

  toggleGoing(ev: EventItem): void {
    if (this.goingLoading() || ev.isDemo || !this.telegram.isInTelegram) return;
    this.goingLoading.set(true);
    this.goingError.set(false);
    this.data.setGoing(ev.id).subscribe((res) => {
      this.goingLoading.set(false);
      if (res) {
        this.event.update((e) => (e ? { ...e, goingCount: res.goingCount, userGoing: res.userGoing } : e));
      } else this.goingError.set(true);
    });
  }

  trackTicketSellerClick(ev: EventItem): void {
    this.analytics.track('ticket_seller_click', ev.id);
  }

  startPromotion(ev: EventItem): void {
    if (this.promotionLoading() || !this.promotionTermsAccepted() || !this.promotionOffer()?.available) return;
    this.promotionLoading.set(true);
    this.promotionError.set('');
    this.data.createEventPromotionInvoice(ev.id, '2026-11-09').subscribe((invoice) => {
      this.promotionLoading.set(false);
      if (!invoice) {
        this.promotionError.set('Не удалось создать счёт. Оплата не списана; попробуйте позже.');
        return;
      }
      this.promotionMessage.set(`Счёт создан. ID кампании: ${invoice.campaignId}. Сохраните ID для обращения в /paysupport.`);
      if (!this.telegram.openInvoice(invoice.invoiceUrl, (status) => {
        if (status === 'paid') {
          this.promotionMessage.set('Telegram подтвердил платёж. Обновляем статус промо…');
          this.data.getEventPromotionOffer(ev.id).subscribe((offer) => this.promotionOffer.set(offer));
        }
        else if (status === 'cancelled') {
          this.data.cancelEventPromotionInvoice(ev.id).subscribe((cancelled) => {
            if (cancelled) {
              this.promotionMessage.set('Оплата отменена; списания нет. Можно открыть счёт повторно.');
              this.data.getEventPromotionOffer(ev.id).subscribe((offer) => this.promotionOffer.set(offer));
            }
          });
        }
        else if (status === 'failed') this.promotionError.set('Telegram не завершил оплату. Повторите попытку.');
      })) this.promotionError.set('Откройте событие внутри Telegram, чтобы оплатить Stars.');
    });
  }

  async share(ev: EventItem): Promise<void> {
    const url = this.telegram.miniAppLink(`event_${ev.id}`);
    const text = `${ev.title} — ${ev.date} в ${ev.place}. Подробнее в TUSA.`;
    this.analytics.track('event_share', ev.id, `tusa-event-${ev.id}`);
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: ev.title, text, url });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${url}`);
        this.shareLabel.set(this.i18n.t('events.details.shareCopied'));
        setTimeout(() => this.shareLabel.set(''), 2200);
      }
    } catch {
      this.shareLabel.set(this.i18n.t('events.details.shareFailed'));
      setTimeout(() => this.shareLabel.set(''), 2200);
    }
  }

  shareText(ev: EventItem): string {
    const url = this.telegram.miniAppLink(`event_${ev.id}`);
    return `${ev.title}\n${ev.date} · ${ev.time} · ${ev.place}\nПодробнее в TUSA: ${url}`;
  }

  async copyShareText(ev: EventItem): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    await navigator.clipboard.writeText(this.shareText(ev));
    this.copyLabel.set(this.i18n.t('events.details.copied'));
    setTimeout(() => this.copyLabel.set(''), 2200);
  }

  private async generateQr(ev: EventItem): Promise<void> {
    const url = this.telegram.miniAppLink(`event_${ev.id}`);
    this.qrCode.set(await QRCode.toDataURL(url, { width: 220, margin: 1, errorCorrectionLevel: 'M' }));
  }
}
