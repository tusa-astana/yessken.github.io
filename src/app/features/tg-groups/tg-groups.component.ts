import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TelegramService } from '../../core/services/telegram.service';
import type { TelegramGroupItem } from '../../core/types/event.model';

const CURATED_GROUPS: TelegramGroupItem[] = [
  {
    id: 'rollmove-astana',
    title: 'Кинь-Двинь | Клуб настольных игр (Астана)',
    description: 'Клуб настольных игр в Астане.',
    inviteLink: 'https://t.me/RollMove',
  },
];

@Component({
  selector: 'app-tg-groups',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tg-groups">
      <h1>Сообщества</h1>
      <p class="subtitle">Городские сообщества и каналы, где появляются новые события. Это независимые сообщества — правила и условия уточняйте у их администраторов.</p>
      @if (groups().length === 0) {
        <p class="empty">Сообщества скоро появятся. Следите за обновлениями TUSA.</p>
      } @else {
        <ul class="list">
          @for (g of groups(); track g.id) {
            <li class="card">
              <div class="info">
                <span class="title">{{ g.title }}</span>
                @if (g.description) { <span class="description">{{ g.description }}</span> }
                @if (g.memberCount !== undefined && g.memberCount > 0) { <span class="count">{{ g.memberCount }} участников</span> }
              </div>
              @if (g.inviteLink) {
                <a [href]="g.inviteLink" target="_blank" rel="noopener" class="join" (click)="openLink($event, g.inviteLink)">
                  Открыть Telegram
                </a>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [
    `
      .tg-groups { padding: 1rem; padding-bottom: 80px; }
      h1 { margin: 0 0 0.25rem; font-size: 1.5rem; }
      .subtitle { margin: 0 0 1rem; font-size: 0.9rem; opacity: 0.85; }
      .empty { padding: 1rem 0; opacity: 0.9; }
      .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
      .card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem;
        background: var(--tg-surface, #ffffff);
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
      .info { display: flex; flex-direction: column; gap: 0.25rem; }
      .title { font-weight: 600; color: var(--tg-text, #e4e4e7); }
      .description { font-size: 0.85rem; line-height: 1.4; opacity: 0.85; }
      .count { font-size: 0.85rem; opacity: 0.8; }
      .join {
        flex-shrink: 0;
        padding: 0.5rem 1rem;
        background: var(--tg-button, #426c47);
        color: var(--tg-button-text, #0a0a0c);
        border-radius: 8px;
        text-decoration: none;
        font-size: 0.9rem;
        box-shadow: var(--tg-glow);
      }
    `,
  ],
})
export class TgGroupsComponent {
  readonly groups = signal<TelegramGroupItem[]>(CURATED_GROUPS);

  constructor(private telegram: TelegramService) {}

  openLink(event: Event, url: string): void {
    const wa = typeof window !== 'undefined' ? (window as unknown as { Telegram?: { WebApp?: { openLink?: (u: string) => void } } }).Telegram?.WebApp : undefined;
    if (wa?.openLink) {
      event.preventDefault();
      wa.openLink(url);
    }
  }
}
