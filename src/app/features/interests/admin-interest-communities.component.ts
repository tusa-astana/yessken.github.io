import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { InterestCommunityReview } from './interest.model';
import { InterestsApiService } from './interests-api.service';

@Component({
  selector: 'app-admin-interest-communities',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="moderation-page">
      <header>
        <p class="eyebrow">TUSA · МОДЕРАЦИЯ</p>
        <h1>Предложенные сообщества</h1>
        <p>Публичные ссылки видны в интерес-группах только после проверки. Проверяй ссылку, название и соответствие выбранным интересам.</p>
      </header>
      <div class="toolbar"><strong>{{ communities()?.length ?? '—' }} на проверке</strong><button type="button" (click)="refresh()" [disabled]="loading()">Обновить</button></div>
      @if (loading() && communities() === null) {
        <p class="state">Загружаем очередь…</p>
      } @else if (communities() === null) {
        <div class="state error" role="alert"><strong>Нет доступа или API недоступен</strong><span>Очередь доступна только администраторам TUSA в Telegram.</span><button type="button" (click)="refresh()">Повторить</button></div>
      } @else if (!communities()?.length) {
        <div class="state"><strong>Новых предложений нет</strong></div>
      } @else {
        <section class="community-list" aria-live="polite">
          @for (community of communities(); track community.id) {
            <article class="community-card">
              <div class="topline"><span>{{ community.platform === 'reddit' ? 'Reddit' : 'Telegram' }}</span><time>{{ community.createdAt | date:'d MMM y, HH:mm' }}</time></div>
              <h2>{{ community.title }}</h2>
              @if (community.description) { <p>{{ community.description }}</p> }
              <p class="interests"><strong>Интересы:</strong> {{ community.interests.join(' · ') }}</p>
              <a [href]="community.url" target="_blank" rel="noopener noreferrer">Проверить ссылку ↗</a>
              <div class="actions">
                <button class="approve" type="button" [disabled]="busyId() !== null" (click)="review(community, 'approve')">{{ busyId() === community.id ? 'Сохраняем…' : 'Одобрить и опубликовать' }}</button>
                <button class="reject" type="button" [disabled]="busyId() !== null" (click)="review(community, 'reject')">Отклонить</button>
              </div>
            </article>
          }
        </section>
      }
      @if (error()) { <p class="error-text" role="alert">{{ error() }}</p> }
      @if (announcement()) { <p class="success-text" role="status">{{ announcement() }}</p> }
      <a class="back-link" routerLink="/admin/interest-reports">← К жалобам в интерес-группах</a>
    </main>
  `,
  styles: [`
    .moderation-page { max-width: 900px; margin: 0 auto; padding: 1.5rem 1rem 6rem; color: var(--tg-text); }
    header { padding-bottom: 1rem; border-bottom: 1px solid var(--tg-line); }
    .eyebrow { color: var(--tg-muted); font-size: .64rem; font-weight: 850; letter-spacing: .15em; }
    h1 { margin: .4rem 0; font: 500 clamp(1.8rem, 6vw, 3rem) Georgia,serif; }
    header > p:last-child, .community-card > p { color: var(--tg-muted); font-size: .75rem; line-height: 1.5; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; margin: .9rem 0; color: var(--tg-muted); font-size: .75rem; }
    button { min-height: 40px; padding: .55rem .7rem; border: 1px solid var(--tg-line); border-radius: 6px; background: transparent; color: var(--tg-text); font: inherit; font-size: .68rem; cursor: pointer; }
    button:disabled { opacity: .5; cursor: wait; }
    .state { display: grid; justify-items: center; gap: .5rem; padding: 2rem 1rem; border: 1px solid var(--tg-line); border-radius: 9px; color: var(--tg-muted); text-align: center; }
    .state strong { color: var(--tg-text); }
    .state.error, .error-text { color: #c76c60; }
    .community-list { display: grid; gap: .7rem; }
    .community-card { padding: .95rem; border: 1px solid var(--tg-line); border-radius: 9px; background: var(--tg-surface); }
    .topline { display: flex; justify-content: space-between; gap: .5rem; color: var(--tg-muted); font-size: .62rem; }
    h2 { margin: .55rem 0 .35rem; font: 500 1.2rem Georgia,serif; }
    .community-card > p { margin: .35rem 0; }
    .interests strong { color: var(--tg-text); }
    .community-card > a, .back-link { color: var(--tg-button); font-size: .72rem; }
    .actions { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .8rem; }
    .approve { border-color: #354b38; background: #354b38; color: #fff; font-weight: 750; }
    .reject { color: #c76c60; }
    .error-text, .success-text { font-size: .72rem; }
    .success-text { color: var(--tg-button); }
    .back-link { display: inline-block; margin-top: 1rem; text-decoration: none; }
  `],
})
export class AdminInterestCommunitiesComponent implements OnInit {
  private readonly api = inject(InterestsApiService);
  readonly communities = signal<InterestCommunityReview[] | null>(null);
  readonly loading = signal(false);
  readonly busyId = signal<string | null>(null);
  readonly error = signal('');
  readonly announcement = signal('');

  ngOnInit(): void {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.communities.set(await this.api.loadPendingCommunities());
    this.loading.set(false);
  }

  async review(community: InterestCommunityReview, action: 'approve' | 'reject'): Promise<void> {
    this.busyId.set(community.id);
    this.error.set('');
    const saved = await this.api.reviewCommunity(community.id, action);
    this.busyId.set(null);
    if (!saved) {
      this.error.set('Не получилось сохранить решение. Обнови очередь и попробуй ещё раз.');
      return;
    }
    this.communities.update((items) => items?.filter((item) => item.id !== community.id) ?? null);
    this.announcement.set(action === 'approve' ? `«${community.title}» опубликовано.` : `«${community.title}» отклонено.`);
  }
}