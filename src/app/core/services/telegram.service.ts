import { Injectable } from '@angular/core';

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: { user?: TelegramUser; start_param?: string };
  themeParams: Record<string, string>;
  colorScheme: 'light' | 'dark';
  expand: () => void;
  ready: () => void;
  openInvoice?: (url: string, callback: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void) => void;
  openTelegramLink?: (url: string) => void;
  MainButton: TelegramMainButton;
  BackButton: { show: () => void; hide: () => void; onClick: (cb: () => void) => void };
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramMainButton {
  show: () => void;
  hide: () => void;
  setText: (text: string) => void;
  onClick: (cb: () => void) => void;
}

@Injectable({ providedIn: 'root' })
export class TelegramService {
  private readonly botUsername = 'tusa_astana_bot';

  /** Включить для теста в браузере: открой ?mock=1 */
  get forceApp(): boolean {
    return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mock') === '1';
  }

  private get webApp(): TelegramWebApp | undefined {
    return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
  }

  get isInTelegram(): boolean {
    const wa = this.webApp;
    return !!(wa && wa.initData);
  }

  get initData(): string {
    return this.webApp?.initData ?? '';
  }

  get startParam(): string {
    const appParam = this.webApp?.initDataUnsafe?.start_param;
    if (appParam) return appParam;
    return typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('tgWebAppStartParam') ?? ''
      : '';
  }

  miniAppLink(startParam: string): string {
    return `https://t.me/${this.botUsername}?startapp=${encodeURIComponent(startParam)}`;
  }

  get user(): TelegramUser | null {
    return this.webApp?.initDataUnsafe?.user ?? null;
  }

  init(): void {
    const wa = this.webApp;
    if (wa) {
      wa.ready();
      wa.expand();
      this.applyTheme();
    }
  }

  private applyTheme(): void {
    const wa = this.webApp;
    if (!wa?.themeParams) return;
    const doc = document.documentElement;
    const params = wa.themeParams;
    const bg = params['bg_color'];
    const text = params['text_color'];
    const btn = params['button_color'];
    const btnText = params['button_text_color'];
    if (bg) doc.style.setProperty('--tg-bg', bg);
    if (text) doc.style.setProperty('--tg-text', text);
    if (btn) doc.style.setProperty('--tg-button', btn);
    if (btnText) doc.style.setProperty('--tg-button-text', btnText);
  }

  getMainButton(): TelegramMainButton | null {
    return this.webApp?.MainButton ?? null;
  }

  getBackButton(): { show: () => void; hide: () => void; onClick: (cb: () => void) => void } | null {
    return this.webApp?.BackButton ?? null;
  }

  onBackButtonClick(callback: () => void): void {
    this.webApp?.BackButton?.onClick(callback);
  }

  setBackButtonVisible(visible: boolean): void {
    const backButton = this.webApp?.BackButton;
    if (!backButton) return;
    if (visible) backButton.show();
    else backButton.hide();
  }

  openInvoice(url: string, callback: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void): boolean {
    const openInvoice = this.webApp?.openInvoice;
    if (!openInvoice) return false;
    openInvoice(url, callback);
    return true;
  }

  openTelegramLink(url: string): boolean {
    const openLink = this.webApp?.openTelegramLink;
    if (!openLink) return false;
    openLink(url);
    return true;
  }
}
