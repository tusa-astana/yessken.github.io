import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EventsApiService } from '../../core/services/events-api.service';
import { I18nService } from '../../core/services/i18n.service';
import { TelegramService } from '../../core/services/telegram.service';

interface WorkBoardTable {
  title: string;
  headers: string[];
  rows: string[][];
}

@Component({
  selector: 'app-admin-work-board',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="board-page">
      <header class="heading">
        <span class="eyebrow">TUSA / ADMIN</span>
        <h1>{{ i18n.t('analytics.boardHeading') }}</h1>
        <p>{{ i18n.t('analytics.boardDescription') }}</p>
      </header>
      <nav class="tabs" [attr.aria-label]="i18n.t('analytics.tabsLabel')">
        <a routerLink="/admin/analytics" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">{{ i18n.t('analytics.statsTab') }}</a>
        <a routerLink="/admin/analytics/board" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">{{ i18n.t('analytics.boardTab') }}</a>
      </nav>
      @if (loading()) {
        <p class="state" role="status">{{ i18n.t('analytics.boardLoading') }}</p>
      } @else if (accessDenied()) {
        <section class="state error" role="alert">
          <strong>{{ i18n.t('analytics.adminRequired') }}</strong>
          <a class="telegram-access" [href]="adminTelegramLink" target="_blank" rel="noopener noreferrer">{{ i18n.t('analytics.openInTelegram') }}</a>
        </section>
      } @else if (loadError()) {
        <p class="state error" role="alert">{{ i18n.t('analytics.boardUnavailable') }}</p>
      } @else if (!sections().length) {
        <p class="state">{{ i18n.t('analytics.boardEmpty') }}</p>
      } @else {
        @for (section of sections(); track section.title) {
          <section class="board-section" [attr.aria-label]="section.title">
            <h2>{{ section.title }}</h2>
            <div class="table-scroll" role="region" tabindex="0" [attr.aria-label]="section.title">
              <table>
                <thead><tr>@for (header of section.headers; track $index) { <th scope="col">{{ header }}</th> }</tr></thead>
                <tbody>
                  @for (row of section.rows; track $index) {
                    <tr>@for (cell of row; track $index) { <td>{{ cell }}</td> }</tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }
        <p class="source-note">{{ i18n.t('analytics.boardSource') }}</p>
      }
      <a class="back-link" routerLink="/profile">{{ i18n.t('analytics.backToProfile') }}</a>
    </main>
  `,
  styles: [`
    .board-page { max-width: 1100px; margin: 0 auto; padding: 2rem 1.25rem 6rem; color: var(--tg-text); }
    .heading { padding: 1rem 0 1.25rem; border-bottom: 1px solid var(--tg-line); }
    .eyebrow { color: var(--tg-button, #aabd7e); font-size: .68rem; font-weight: 800; letter-spacing: .16em; }
    h1 { margin: .6rem 0 .4rem; font-size: clamp(2rem, 7vw, 3.5rem); font-weight: 500; }
    .heading p, .state, .source-note { color: var(--tg-muted); font-size: .85rem; line-height: 1.55; }
    .tabs { display: flex; gap: .45rem; margin: 1rem 0; border-bottom: 1px solid var(--tg-line); }
    .tabs a { min-height: 44px; padding: .65rem .85rem; border-bottom: 2px solid transparent; color: var(--tg-muted); font-size: .82rem; text-decoration: none; }
    .tabs a.active { border-color: var(--tg-button); color: var(--tg-button); font-weight: 700; }
    .board-section { margin: 1rem 0; padding: 1rem; border: 1px solid var(--tg-line); border-radius: 9px; background: var(--tg-surface, #fff); }
    .board-section h2 { margin: 0 0 .8rem; font-size: 1rem; }
    .table-scroll { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: .76rem; line-height: 1.45; }
    th, td { min-width: 8rem; padding: .6rem; border: 1px solid var(--tg-line); text-align: left; vertical-align: top; }
    th { background: color-mix(in srgb, var(--tg-button) 8%, var(--tg-surface, white)); font-weight: 700; }
    td { color: var(--tg-muted); }
    td:first-child { color: var(--tg-text); font-weight: 650; }
    .state { display: grid; justify-items: center; gap: .7rem; padding: 2rem 1rem; text-align: center; }
    .error { color: #a43d34; }
    .telegram-access { display: inline-flex; min-height: 44px; align-items: center; padding: .6rem .8rem; border-radius: 6px; background: var(--tg-button); color: var(--tg-button-text, #fff); font-weight: 700; text-decoration: none; }
    .source-note { font-size: .72rem; }
    .back-link { display: inline-block; margin-top: 1rem; color: var(--tg-button); font-size: .82rem; text-decoration: none; }
    @media (max-width: 600px) { .board-page { padding: 1rem .75rem 6rem; } .board-section { padding: .7rem; } table { min-width: 760px; } }
  `],
})
export class AdminWorkBoardComponent implements OnInit {
  protected readonly i18n = inject(I18nService);
  readonly adminTelegramLink = inject(TelegramService).miniAppLink('admin_analytics');
  private readonly api = inject(EventsApiService);
  readonly sections = signal<WorkBoardTable[]>([]);
  readonly loading = signal(true);
  readonly accessDenied = signal(false);
  readonly loadError = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const summary = await firstValueFrom(this.api.getAdminFunnelSummary());
      if (summary === null) {
        this.accessDenied.set(true);
        return;
      }
      const markdown = await firstValueFrom(this.api.getAdminWorkBoard());
      if (markdown === null) {
        this.loadError.set(true);
        return;
      }
      this.sections.set(parseWorkBoard(markdown));
    } catch {
      this.loadError.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}

function parseWorkBoard(markdown: string): WorkBoardTable[] {
  const sections: WorkBoardTable[] = [];
  let title = '';
  let headers: string[] | null = null;
  let rows: string[][] = [];

  const flush = (): void => {
    if (title && headers && rows.length) sections.push({ title, headers, rows });
    headers = null;
    rows = [];
  };

  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      flush();
      title = heading[1].trim();
      continue;
    }
    if (!line.trimStart().startsWith('|')) {
      if (line.trim()) flush();
      continue;
    }
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => formatMarkdownCell(cell.trim()));
    if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) continue;
    if (headers === null) headers = cells;
    else rows.push(cells);
  }
  flush();
  return sections;
}

function formatMarkdownCell(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1');
}
