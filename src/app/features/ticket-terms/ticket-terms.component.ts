import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ticket-terms',
  imports: [RouterLink],
  template: `
    <main class="terms">
      <span class="eyebrow">TUSA · УСЛОВИЯ</span>
      <h1>Условия событий и билетов</h1>
      <nav class="legal-links" aria-label="Документы и тарифы">
        <a href="/tariffs.html">Тарифы в тенге</a>
        <a href="/offer.html">Договор-оферта</a>
        <a href="/privacy.html">Политика конфиденциальности</a>
      </nav>
      <section aria-labelledby="sales-status">
        <h2 id="sales-status">Билеты и RSVP</h2>
        <p>TUSA не продаёт билеты на офлайн-события и не принимает оплату за вход. Билет и условия допуска предоставляет организатор. Отметка RSVP/интереса в TUSA не является билетом или бронированием.</p>
      </section>
      <section aria-labelledby="delivery">
        <h2 id="delivery">Доступ на событие</h2>
        <p>TUSA не продаёт билеты на офлайн-события и не принимает оплату за вход. Стоимость и порядок доступа уточняйте у организатора. Отметка интереса в приложении не является бронированием или билетом.</p>
      </section>
      <section aria-labelledby="promotion">
        <h2 id="promotion">Цифровое продвижение события</h2>
        <p>Если функция включена, владелец одобренного события может заказать одно помеченное промо-размещение внутри каталога TUSA до даты события за указанную перед оплатой сумму в Telegram Stars. Счёт создаётся только после отдельного согласия с условиями. Промо не гарантирует охват, RSVP или продажи. Билет продаёт названный внешний дистрибьютор, он же отвечает за оплату билета, доступ и возвраты. При отклонении или невозможности показать оплаченное промо обращайтесь через <strong>/paysupport</strong>; возврат подтверждается Telegram.</p>
      </section>
      <section aria-labelledby="refunds">
        <h2 id="refunds">Оплата и поддержка</h2>
        <p>Цифровые услуги в Mini App оплачиваются только Telegram Stars после подтверждения условий. По вопросам Stars-оплаты или возврата напишите боту <a href="https://t.me/tusa_astana_bot?start=paysupport">@tusa_astana_bot</a> команду <strong>/paysupport</strong>. Запрос на возврат сам по себе не означает, что возврат уже выполнен; результат подтверждается Telegram.</p>
      </section>
      <p class="version">Версия условий: 5 ноября 2026 года.</p>
      <a class="back" routerLink="/events">Вернуться к событиям</a>
    </main>
  `,
  styles: [`
    .terms { max-width: 760px; margin: 0 auto; padding: 2rem 1.25rem 6rem; color: var(--tg-text, #26372b); }
    .eyebrow { color: var(--tg-button, #aabd7e); font-size: .7rem; font-weight: 800; letter-spacing: .16em; }
    h1 { margin: .7rem 0 2rem; font-size: clamp(2rem, 8vw, 3rem); font-weight: 500; }
    section { padding: 1rem 0; border-top: 1px solid var(--tg-line); }
    h2 { font-size: 1.1rem; font-weight: 600; }
    p { line-height: 1.65; opacity: .82; }
    a { color: var(--tg-button, #aabd7e); }
    .version { margin-top: 2rem; font-size: .8rem; opacity: .6; }
    .back { display: inline-block; margin-top: .75rem; }
    .legal-links { display: flex; flex-wrap: wrap; gap: .55rem 1rem; margin: 0 0 1rem; font-size: .8rem; }
  `],
})
export class TicketTermsComponent {}