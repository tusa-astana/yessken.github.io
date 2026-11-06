import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TelegramService } from '../../core/services/telegram.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import type { InterestGathering, InterestGroup, InterestMember, InterestReportReason } from './interest.model';
import { InterestsApiService } from './interests-api.service';

@Component({
  selector: 'app-interests',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="interests-page">
      <header class="hero">
        <p class="eyebrow">TUSA · СООБЩЕСТВА</p>
        <h1>Тусы по интересам</h1>
        <p>Находи людей с общими увлечениями и собирайся вместе в реальных местах. Здесь нет чатов — только интересы и планы на встречи.</p>
        <a routerLink="/meetups">← К местам и встречам</a>
      </header>

      <section class="safety-note" aria-label="Безопасность и приватность">
        <span aria-hidden="true">⌑</span>
        <p><strong>Безопасность важнее совпадений.</strong> Присоединиться можно только из Telegram. Профиль скрыт по умолчанию; участников видят только люди из той же группы. Жалобы рассматривает модератор. Мы реагируем на поведение, а не на личные или медицинские обстоятельства.</p>
      </section>

      <section class="privacy-settings" aria-label="Настройки видимости в группах">
        <label><input type="checkbox" [checked]="showProfile()" (change)="showProfile.set($any($event.target).checked)" /> Показывать моё имя участникам групп</label>
        <label><input type="checkbox" [checked]="openToMeet()" (change)="openToMeet.set($any($event.target).checked)" [disabled]="!showProfile()" /> Открыт(а) к знакомствам</label>
        <span>Настройки применяются к новым вступлениям.</span>
      </section>

      @if (!telegram.isInTelegram) {
        <p class="telegram-hint" role="status">Открой TUSA в Telegram, чтобы вступать в группы и видеть их участников.</p>
      }
      @if (loading()) {
        <p class="state" role="status">Загружаем интерес-группы…</p>
      } @else if (loadError()) {
        <div class="state error" role="alert"><strong>Не удалось загрузить сообщества</strong><button type="button" (click)="refresh()">Повторить</button></div>
      } @else {
        <section class="group-grid" aria-label="Группы по интересам">
          @for (group of groups(); track group.id) {
            <article class="interest-card" [class.joined]="group.isMember" [class.highlighted]="highlightedInterestId() === group.id" [id]="'interest-' + group.id">
              <div class="group-icon" aria-hidden="true">{{ group.emoji }}</div>
              <div class="group-copy">
                <div class="group-title-row"><h2>{{ group.name }}</h2><span class="member-count">{{ group.memberCount }} участников</span></div>
                <p>{{ group.description }}</p>
              </div>
              <div class="group-actions">
                @if (group.isMember) {
                  <button class="primary-action" type="button" [disabled]="busyId() !== null" (click)="leave(group)">{{ busyId() === group.id ? 'Сохраняем…' : 'Ты в группе · выйти' }}</button>
                  <button class="secondary-action" type="button" [disabled]="membersLoading()" (click)="toggleMembers(group)">{{ membersGroupId() === group.id ? 'Скрыть участников' : 'Участники' }}</button>
                } @else {
                  <button class="primary-action" type="button" [disabled]="!telegram.isInTelegram || busyId() !== null" (click)="join(group)">{{ busyId() === group.id ? 'Добавляем…' : 'Присоединиться' }}</button>
                }
                <button class="secondary-action invite-action" type="button" (click)="shareGroup(group)">Пригласить</button>
              </div>
              @if (group.gatherings.length) {
                <div class="gathering-list">
                  <div class="gathering-list-heading"><strong>Ближайшие встречи</strong><span>{{ group.gatherings.length }}</span></div>
                  @for (gathering of group.gatherings; track gathering.id) {
                    <article class="gathering-card" [class.highlighted-gathering]="highlightedGatheringId() === gathering.id" [id]="'gathering-' + gathering.id">
                      <div class="gathering-copy">
                        <strong>{{ gathering.title }}</strong>
                        <span>{{ gatheringDate(gathering.date) }} · {{ gathering.time }}</span>
                        <span>{{ gathering.place }}</span>
                        @if (gathering.details) { <small>{{ gathering.details }}</small> }
                        <small class="gathering-count">{{ gathering.goingCount }} идут · встреча в общественном месте</small>
                      </div>
                      <div class="gathering-actions">
                        @if (gathering.isHost) {
                          <button class="report-button" type="button" [disabled]="busyId() !== null" (click)="cancelGathering(group, gathering)">Отменить</button>
                        } @else if (gathering.userGoing) {
                          <button class="secondary-action" type="button" [disabled]="busyId() !== null" (click)="leaveGathering(group, gathering)">Не иду</button>
                        } @else {
                          <button class="primary-action" type="button" [disabled]="!telegram.isInTelegram || !group.isMember || busyId() !== null" (click)="joinGathering(group, gathering)">{{ group.isMember ? 'Я иду' : 'Вступи в группу' }}</button>
                        }
                      </div>
                    </article>
                  }
                </div>
              }
              @if (group.isMember) {
                <div class="gathering-create">
                  @if (createGroupId() === group.id) {
                    <form class="gathering-form" (submit)="$event.preventDefault(); submitGathering(group)">
                      <div class="form-heading"><strong>Предложить встречу</strong><button type="button" aria-label="Закрыть форму" (click)="createGroupId.set(null)">×</button></div>
                      <label>Название встречи<input required minlength="4" maxlength="90" [value]="draftTitle()" (input)="draftTitle.set($any($event.target).value)" placeholder="Например, партия в настолки" /></label>
                      <div class="date-time-fields">
                        <label>Дата<input required type="date" [min]="todayInputDate()" [value]="draftDate()" (input)="draftDate.set($any($event.target).value)" /></label>
                        <label>Время<input required type="time" [value]="draftTime()" (input)="draftTime.set($any($event.target).value)" /></label>
                      </div>
                      <label>Общественное место в Астане<input required minlength="3" maxlength="140" [value]="draftPlace()" (input)="draftPlace.set($any($event.target).value)" placeholder="Кафе, парк, заведение…" /></label>
                      <label>Детали <span>Необязательно, до 500 символов</span><textarea maxlength="500" rows="3" [value]="draftDetails()" (input)="draftDetails.set($any($event.target).value)" placeholder="Что планируете делать?"></textarea></label>
                      <p class="public-place-note">Не указывай домашний адрес или личные контакты. Встречайтесь в общественном месте.</p>
                      <button class="primary-action" type="submit" [disabled]="busyId() !== null">{{ busyId() === group.id ? 'Создаём…' : 'Опубликовать встречу' }}</button>
                    </form>
                  } @else {
                    <button class="create-gathering-button" type="button" [disabled]="!telegram.isInTelegram" (click)="startGathering(group)">＋ Предложить встречу по интересу</button>
                  }
                </div>
              }
              @if (membersGroupId() === group.id) {
                <div class="member-list">
                  @if (membersLoading()) { <p>Загружаем участников…</p> }
                  @else if (!members().length) { <p>Пока ты здесь один(одна). Поделись группой с друзьями.</p> }
                  @else {
                    @for (member of members(); track member.telegramUserId ?? $index) {
                      <div class="member-row">
                        @if (member.photoUrl) { <img class="member-avatar" [src]="member.photoUrl" alt="" referrerpolicy="no-referrer" /> }
                        @else { <span class="member-avatar initials" aria-hidden="true">{{ member.anonymous ? '•' : member.name.slice(0, 1).toLocaleUpperCase('ru') }}</span> }
                        <span class="member-name">{{ member.isYou ? 'Ты' : member.name }}@if (member.openToMeet) { <small> · открыт(а) к знакомствам</small> }</span>
                        @if (!member.isYou && member.telegramUserId !== null) {
                          <button class="report-button" type="button" (click)="startReport(group, member)">Пожаловаться</button>
                        }
                      </div>
                    }
                  }
                </div>
              }
            </article>
          }
        </section>
      }

      @if (announcement()) { <p class="announcement" role="status">{{ announcement() }}</p> }
      @if (actionError()) { <p class="action-error" role="alert">{{ actionError() }}</p> }
    </div>

    @if (reportTarget(); as target) {
      <div class="dialog-backdrop" role="presentation" (click)="cancelReport()">
        <section class="report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title" (click)="$event.stopPropagation()">
          <button class="dialog-close" type="button" aria-label="Закрыть" (click)="cancelReport()">×</button>
          <p class="eyebrow">БЕЗОПАСНОСТЬ TUSA</p>
          <h2 id="report-title">Жалоба на участника</h2>
          <p class="report-copy">Пожалуйста, сообщай о конкретном поведении. Жалобу увидит только команда модерации.</p>
          <label class="field-label">Причина
            <select [value]="reportReason()" (change)="reportReason.set($any($event.target).value)">
              <option value="spam">Спам</option><option value="harassment">Оскорбления или преследование</option>
              <option value="impersonation">Выдаёт себя за другого</option><option value="unsafe">Угрожающее или небезопасное поведение</option><option value="other">Другое нарушение правил</option>
            </select>
          </label>
          <label class="field-label">Что произошло? <span>Необязательно, до 500 символов</span>
            <textarea maxlength="500" rows="4" [value]="reportDetails()" (input)="reportDetails.set($any($event.target).value)"></textarea>
          </label>
          @if (reportError()) { <p class="action-error" role="alert">{{ reportError() }}</p> }
          <button class="primary-action submit-report" type="button" [disabled]="reporting()" (click)="submitReport()">{{ reporting() ? 'Отправляем…' : 'Отправить модератору' }}</button>
        </section>
      </div>
    }
  `,
  styles: [`
    .interests-page { max-width: 1000px; margin: 0 auto; padding: 1.25rem clamp(1rem, 3vw, 2rem) 6rem; color: var(--tg-text); }
    .hero { padding: clamp(1.3rem, 4vw, 2.4rem); border: 1px solid var(--tg-line); border-radius: 16px; background: radial-gradient(circle at 90% 15%, rgba(196,169,102,.14), transparent 30%), linear-gradient(125deg, rgba(66,108,71,.12), var(--tg-surface)); }
    .eyebrow { margin: 0 0 .45rem; color: var(--tg-muted); font-size: .64rem; font-weight: 850; letter-spacing: .15em; }
    .hero h1 { margin: 0; font: 500 clamp(2rem, 6vw, 3.2rem)/1 Georgia,serif; letter-spacing: -.04em; }
    .hero > p:not(.eyebrow) { max-width: 600px; margin: .8rem 0 1rem; color: var(--tg-muted); font-size: .86rem; line-height: 1.55; }
    .hero a { color: var(--tg-button); font-size: .75rem; font-weight: 750; text-decoration: none; }
    .hero a:hover { text-decoration: underline; }
    .safety-note { display: flex; gap: .7rem; margin: .9rem 0; padding: .8rem .95rem; border: 1px solid rgba(182,151,87,.24); border-radius: 9px; background: rgba(223,204,154,.08); color: var(--tg-muted); }
    .safety-note > span { flex: 0 0 auto; color: var(--tg-button); }
    .safety-note p { margin: 0; font-size: .7rem; line-height: 1.5; }
    .safety-note strong { color: var(--tg-text); }
    .privacy-settings { display: grid; gap: .55rem; margin: 1rem 0; padding: .8rem .9rem; border: 1px solid var(--tg-line); border-radius: 9px; background: var(--tg-surface); }
    .privacy-settings label { display: flex; align-items: center; gap: .55rem; color: var(--tg-text); font-size: .73rem; }
    .privacy-settings input { width: 16px; height: 16px; accent-color: var(--tg-button); }
    .privacy-settings > span { color: var(--tg-muted); font-size: .62rem; }
    .telegram-hint { padding: .7rem .8rem; border-radius: 8px; background: rgba(66,108,71,.1); color: var(--tg-muted); font-size: .72rem; }
    .group-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: .75rem; }
    .interest-card { display: grid; grid-template-columns: 2.7rem minmax(0,1fr); align-content: start; gap: .65rem; padding: 1rem; border: 1px solid var(--tg-line); border-radius: 11px; background: var(--tg-surface); box-shadow: 0 5px 18px rgba(0,0,0,.06); }
    .interest-card.joined { border-color: rgba(116,145,78,.58); }
    .interest-card.highlighted { border-color: var(--tg-button); box-shadow: 0 0 0 2px rgba(116,145,78,.2), 0 8px 25px rgba(0,0,0,.1); }
    .group-icon { display: grid; width: 2.6rem; height: 2.6rem; place-items: center; border-radius: 9px; background: rgba(66,108,71,.1); color: var(--tg-button); font-size: 1.2rem; }
    .group-copy { min-width: 0; }
    .group-title-row { display: flex; justify-content: space-between; align-items: baseline; gap: .4rem; }
    .group-title-row h2 { margin: .05rem 0; color: var(--tg-text); font: 500 1.16rem Georgia,serif; }
    .member-count { flex: 0 0 auto; color: var(--tg-muted); font-size: .59rem; }
    .group-copy p { margin: .35rem 0 0; color: var(--tg-muted); font-size: .68rem; line-height: 1.45; }
    .group-actions { display: flex; grid-column: 1 / -1; flex-wrap: wrap; gap: .45rem; }
    .gathering-list, .gathering-create { display: grid; grid-column: 1 / -1; gap: .5rem; padding-top: .65rem; border-top: 1px solid var(--tg-line); }
    .gathering-list-heading { display: flex; align-items: center; gap: .4rem; color: var(--tg-muted); font-size: .65rem; }
    .gathering-list-heading span { display: grid; min-width: 1.2rem; height: 1.2rem; place-items: center; border-radius: 999px; background: rgba(66,108,71,.1); color: var(--tg-button); font-size: .56rem; }
    .gathering-card { display: flex; justify-content: space-between; align-items: center; gap: .6rem; padding: .65rem; border: 1px solid var(--tg-line); border-radius: 8px; background: rgba(127,127,127,.045); }
    .gathering-card.highlighted-gathering { border-color: var(--tg-button); box-shadow: 0 0 0 2px color-mix(in srgb, var(--tg-button) 20%, transparent); }
    .gathering-copy { display: grid; min-width: 0; gap: .18rem; }
    .gathering-copy > strong { color: var(--tg-text); font-size: .72rem; }
    .gathering-copy > span, .gathering-copy > small { color: var(--tg-muted); font-size: .62rem; line-height: 1.4; }
    .gathering-copy .gathering-count { color: var(--tg-button); font-weight: 700; }
    .gathering-actions { display: flex; flex: 0 0 auto; }
    .create-gathering-button { justify-self: start; padding: .45rem .1rem; border: 0; background: transparent; color: var(--tg-button); font: inherit; font-size: .66rem; font-weight: 800; cursor: pointer; }
    .create-gathering-button:disabled { opacity: .5; cursor: not-allowed; }
    .gathering-form { display: grid; gap: .55rem; padding: .75rem; border: 1px solid var(--tg-line); border-radius: 8px; background: rgba(127,127,127,.04); }
    .form-heading { display: flex; align-items: center; justify-content: space-between; color: var(--tg-text); font-size: .76rem; }
    .form-heading button { width: 28px; height: 28px; border: 1px solid var(--tg-line); border-radius: 50%; background: transparent; color: var(--tg-text); font-size: 1rem; cursor: pointer; }
    .gathering-form label { display: grid; gap: .25rem; color: var(--tg-muted); font-size: .62rem; font-weight: 750; }
    .gathering-form label span { font-weight: 400; }
    .gathering-form input, .gathering-form textarea { width: 100%; box-sizing: border-box; padding: .55rem .6rem; border: 1px solid var(--tg-line); border-radius: 6px; background: var(--tg-bg); color: var(--tg-text); font: inherit; font-size: .68rem; }
    .gathering-form textarea { resize: vertical; }
    .date-time-fields { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
    .public-place-note { margin: 0; color: var(--tg-muted); font-size: .6rem; line-height: 1.4; }
    .primary-action, .secondary-action, .report-button { min-height: 38px; padding: .55rem .7rem; border: 1px solid var(--tg-line); border-radius: 7px; background: transparent; color: var(--tg-text); font: inherit; font-size: .67rem; font-weight: 750; cursor: pointer; }
    .primary-action { flex: 1; border-color: #354b38; background: #354b38; color: #fff; }
    .primary-action:hover { background: #263b2b; }
    .secondary-action { color: var(--tg-button); }
    button:disabled { opacity: .5; cursor: not-allowed; }
    .member-list { display: grid; grid-column: 1 / -1; gap: .35rem; padding-top: .6rem; border-top: 1px solid var(--tg-line); }
    .member-list > p { margin: .25rem 0; color: var(--tg-muted); font-size: .68rem; }
    .member-row { display: flex; min-width: 0; align-items: center; gap: .5rem; padding: .4rem; border-radius: 7px; background: rgba(127,127,127,.06); }
    .member-avatar { width: 30px; height: 30px; flex: 0 0 auto; border-radius: 50%; object-fit: cover; }
    .initials { display: grid; place-items: center; background: #d7dad4; color: #344137; font-size: .68rem; font-weight: 800; }
    .member-name { flex: 1; min-width: 0; overflow: hidden; color: var(--tg-text); font-size: .68rem; text-overflow: ellipsis; white-space: nowrap; }
    .member-name small { color: var(--tg-muted); font-size: .6rem; }
    .report-button { min-height: 30px; padding: .35rem .45rem; color: #b77569; font-size: .59rem; }
    .state { padding: 2rem; color: var(--tg-muted); text-align: center; }
    .state.error { display: grid; justify-items: center; gap: .7rem; color: #d88778; }
    .state button { padding: .55rem .8rem; border: 1px solid var(--tg-line); border-radius: 7px; background: transparent; color: var(--tg-text); }
    .announcement { color: var(--tg-button); font-size: .75rem; }
    .action-error { color: #c76c60; font-size: .72rem; }
    .dialog-backdrop { position: fixed; z-index: 1000; inset: 0; display: grid; place-items: center; padding: 1rem; background: rgba(13,17,14,.62); backdrop-filter: blur(5px); }
    .report-dialog { position: relative; width: min(100%, 430px); max-height: 90vh; overflow: auto; padding: 1.35rem; border: 1px solid var(--tg-line); border-radius: 14px; background: var(--tg-bg); color: var(--tg-text); box-shadow: 0 24px 70px rgba(0,0,0,.3); }
    .report-dialog h2 { margin: 0; font: 500 1.65rem Georgia,serif; }
    .report-copy { color: var(--tg-muted); font-size: .72rem; line-height: 1.5; }
    .field-label { display: grid; gap: .35rem; margin: .8rem 0; font-size: .69rem; font-weight: 750; }
    .field-label span { color: var(--tg-muted); font-size: .61rem; font-weight: 400; }
    .field-label select, .field-label textarea { width: 100%; box-sizing: border-box; padding: .65rem; border: 1px solid var(--tg-line); border-radius: 7px; background: var(--tg-surface); color: var(--tg-text); font: inherit; font-size: .72rem; }
    .field-label textarea { resize: vertical; }
    .submit-report { width: 100%; margin-top: .6rem; }
    .dialog-close { position: absolute; top: .7rem; right: .7rem; width: 32px; height: 32px; border: 1px solid var(--tg-line); border-radius: 50%; background: transparent; color: var(--tg-text); font-size: 1.2rem; cursor: pointer; }
    .shell.dark-theme .primary-action { border-color: #d7f36b; background: #d7f36b; color: #171a12; }
    .shell.dark-theme .primary-action:hover { background: #c6e35b; }
    @media (max-width: 650px) { .group-grid { grid-template-columns: 1fr; } .interests-page { padding: .8rem .8rem 5.2rem; } .interest-card { padding: .85rem; } }
  `],
})
export class InterestsComponent implements OnInit {
  protected readonly telegram = inject(TelegramService);
  private readonly analytics = inject(AnalyticsService);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(InterestsApiService);
  readonly groups = signal<InterestGroup[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly busyId = signal<string | null>(null);
  readonly membersGroupId = signal<string | null>(null);
  readonly members = signal<InterestMember[]>([]);
  readonly membersLoading = signal(false);
  readonly showProfile = signal(false);
  readonly openToMeet = signal(false);
  readonly reportTarget = signal<{ group: InterestGroup; member: InterestMember } | null>(null);
  readonly reportReason = signal<InterestReportReason>('spam');
  readonly reportDetails = signal('');
  readonly reporting = signal(false);
  readonly reportError = signal('');
  readonly announcement = signal('');
  readonly actionError = signal('');
  readonly highlightedInterestId = signal<string | null>(null);
  readonly highlightedGatheringId = signal<string | null>(null);
  private trackedGatheringInviteId: string | null = null;
  readonly createGroupId = signal<string | null>(null);
  readonly draftTitle = signal('');
  readonly draftDate = signal(this.defaultGatheringDate());
  readonly draftTime = signal('18:30');
  readonly draftPlace = signal('');
  readonly draftDetails = signal('');

  ngOnInit(): void {
    const gatheringQuery = this.route.snapshot.queryParamMap.get('gathering');
    if (gatheringQuery && /^[a-f\d]{32}$/i.test(gatheringQuery)) {
      this.highlightedGatheringId.set(gatheringQuery);
    }
    if (typeof window !== 'undefined') {
      const startParam = this.telegram.startParam;
      if (startParam.startsWith('gathering_')) {
        const gatheringId = startParam.slice('gathering_'.length);
        if (/^[a-f\d]{32}$/i.test(gatheringId)) this.highlightedGatheringId.set(gatheringId);
      } else if (startParam.startsWith('interest_')) {
        this.highlightedInterestId.set(startParam.slice('interest_'.length));
      } else {
        this.highlightedInterestId.set(new URLSearchParams(window.location.search).get('group'));
      }
    }
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(false);
    const groups = await this.api.load();
    this.groups.set(groups);
    this.loadError.set(groups.length === 0);
    this.loading.set(false);
    const targetGathering = this.highlightedGatheringId();
    if (targetGathering) {
      const containingGroup = groups.find((group) => group.gatherings.some((item) => item.id === targetGathering));
      if (containingGroup) {
        this.highlightedInterestId.set(containingGroup.id);
        if (this.trackedGatheringInviteId !== targetGathering) {
          this.analytics.track('community_gathering_open', undefined, `gathering:${targetGathering}`);
          this.trackedGatheringInviteId = targetGathering;
        }
        if (typeof window !== 'undefined') {
          window.requestAnimationFrame(() => {
            document.getElementById(`gathering-${targetGathering}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
          });
        }
      }
    }
  }

  async join(group: InterestGroup): Promise<void> {
    if (!this.telegram.isInTelegram) return;
    this.busyId.set(group.id);
    this.actionError.set('');
    const saved = await this.api.join(group.id, !this.showProfile(), this.openToMeet());
    this.busyId.set(null);
    if (!saved) {
      this.actionError.set('Не получилось вступить. Возможно, достигнут лимит в пять групп.');
      return;
    }
    this.announcement.set(`Ты присоединился(лась) к группе «${group.name}».`);
    await this.refresh();
  }

  async leave(group: InterestGroup): Promise<void> {
    this.busyId.set(group.id);
    this.actionError.set('');
    const saved = await this.api.leave(group.id);
    this.busyId.set(null);
    if (!saved) {
      this.actionError.set('Не получилось выйти из группы. Попробуй ещё раз.');
      return;
    }
    this.membersGroupId.set(null);
    this.announcement.set(`Ты вышел(вышла) из группы «${group.name}».`);
    await this.refresh();
  }

  async toggleMembers(group: InterestGroup): Promise<void> {
    if (this.membersGroupId() === group.id) {
      this.membersGroupId.set(null);
      this.members.set([]);
      return;
    }
    this.membersGroupId.set(group.id);
    this.membersLoading.set(true);
    const members = await this.api.members(group.id);
    this.membersLoading.set(false);
    if (members === null) {
      this.membersGroupId.set(null);
      this.actionError.set('Не удалось загрузить участников. Проверь, что ты состоишь в группе.');
      return;
    }
    this.members.set(members);
  }

  startReport(group: InterestGroup, member: InterestMember): void {
    if (member.telegramUserId === null) return;
    this.reportTarget.set({ group, member });
    this.reportReason.set('spam');
    this.reportDetails.set('');
    this.reportError.set('');
  }

  cancelReport(): void {
    if (this.reporting()) return;
    this.reportTarget.set(null);
    this.reportError.set('');
  }

  async submitReport(): Promise<void> {
    const target = this.reportTarget();
    if (!target?.member.telegramUserId) return;
    this.reporting.set(true);
    this.reportError.set('');
    const sent = await this.api.report(target.group.id, target.member.telegramUserId, this.reportReason(), this.reportDetails());
    this.reporting.set(false);
    if (!sent) {
      this.reportError.set('Не удалось отправить жалобу. Возможно, она уже передана модератору.');
      return;
    }
    this.reportTarget.set(null);
    this.announcement.set('Жалоба передана модератору. Спасибо, что помогаешь поддерживать безопасное сообщество.');
  }

  startGathering(group: InterestGroup): void {
    this.createGroupId.set(group.id);
    this.draftTitle.set('');
    this.draftDate.set(this.defaultGatheringDate());
    this.draftTime.set('18:30');
    this.draftPlace.set('');
    this.draftDetails.set('');
    this.actionError.set('');
  }

  async submitGathering(group: InterestGroup): Promise<void> {
    if (!this.telegram.isInTelegram) return;
    this.busyId.set(group.id);
    this.actionError.set('');
    const saved = await this.api.createGathering(group.id, {
      title: this.draftTitle(),
      date: this.draftDate(),
      time: this.draftTime(),
      place: this.draftPlace(),
      details: this.draftDetails(),
    });
    this.busyId.set(null);
    if (!saved) {
      this.actionError.set('Не получилось опубликовать встречу. Проверь дату, место и подключение к API.');
      return;
    }
    this.createGroupId.set(null);
    this.announcement.set('Встреча опубликована для участников группы.');
    await this.refresh();
  }

  async shareGroup(group: InterestGroup): Promise<void> {
    const url = this.telegram.miniAppLink(`interest_${group.id}`);
    const text = `Собираемся по интересу «${group.name}» в TUSA. Присоединяйся!`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `TUSA · ${group.name}`, text, url });
        return;
      } catch {
        // If the share sheet was dismissed or failed, use Telegram's share URL.
      }
    }
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    if (!this.telegram.openTelegramLink(shareUrl) && typeof window !== 'undefined') {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  }

  async joinGathering(group: InterestGroup, gathering: InterestGathering): Promise<void> {
    this.busyId.set(gathering.id);
    this.actionError.set('');
    const saved = await this.api.joinGathering(group.id, gathering.id);
    this.busyId.set(null);
    if (!saved) {
      this.actionError.set('Не получилось записаться на встречу. Возможно, она уже прошла или отменена.');
      return;
    }
    this.announcement.set(`Ты записался(лась) на «${gathering.title}».`);
    await this.refresh();
  }

  async leaveGathering(group: InterestGroup, gathering: InterestGathering): Promise<void> {
    this.busyId.set(gathering.id);
    this.actionError.set('');
    const saved = await this.api.leaveGathering(group.id, gathering.id);
    this.busyId.set(null);
    if (!saved) {
      this.actionError.set('Не получилось отменить запись. Попробуй ещё раз.');
      return;
    }
    await this.refresh();
  }

  async cancelGathering(group: InterestGroup, gathering: InterestGathering): Promise<void> {
    if (typeof window !== 'undefined' && !window.confirm(`Отменить встречу «${gathering.title}»?`)) return;
    this.busyId.set(gathering.id);
    const saved = await this.api.cancelGathering(group.id, gathering.id);
    this.busyId.set(null);
    if (!saved) {
      this.actionError.set('Не получилось отменить встречу. Попробуй ещё раз.');
      return;
    }
    this.announcement.set('Встреча отменена.');
    await this.refresh();
  }

  gatheringDate(value: string): string {
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
  }

  todayInputDate(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Almaty', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  }

  private defaultGatheringDate(): string {
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Almaty', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  }
}
