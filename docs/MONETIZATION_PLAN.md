# TUSA monetization plan: Telegram Stars only

## Product boundary

TUSA is an in-Telegram event discovery and organizer-tools app for Astana. Event browsing, listings, sharing, and RSVP are free. **TUSA does not sell or take payment for admission to in-person events, and does not issue offline admission tickets.** Organizers remain responsible for event access and any ticket sales outside TUSA; TUSA does not embed or route to an external checkout under this product policy.

Telegram requires all digital goods and services sold inside bots and Mini Apps to be paid exclusively in Telegram Stars (`XTR`). Stars are **not** a compliant substitute for payment for attendance at an offline event. See Telegram's [Stars payment rules](https://core.telegram.org/bots/payments-stars) and [physical-goods/services payment rules](https://core.telegram.org/bots/payments).

## Business model

### Free visitor experience
- Discover real, organizer-authorized events.
- View event details and share them inside Telegram.
- RSVP / express interest. This is not a ticket, reservation, or guarantee of admission.
- No in-app ticket checkout, KZT collection, card provider, commission, or paid visitor subscription.

### Free organizer validation tools
- Submit events for moderation and share approved event pages.
- Review aggregate event opens, shares, and RSVP for owned events.
- Treat opens as interactions (repeat opens can count); do not present them as unique reach, ticket sales, or revenue.
- These basic pilot metrics are not a paid Pro entitlement and do not imply that Organizer Pro is available.

### Digital organizer service
- **Organizer Pro** is the only planned paid offer: a 30-day digital service delivered inside TUSA/Telegram and invoiced in Stars.
- The backend already has a Stars subscription path, explicit terms consent, `/paysupport`, charge-id tracking, and a refund operation.
- Price remains `0` and checkout stays disabled until the Pro benefits are actually available, a price is approved, and terms/support/refund behavior is tested. Do not describe the subscription as active before those gates pass.
- Future in-app digital promotion may be considered only after confirming it qualifies as a digital service and is implemented entirely in Stars. It is not part of the current revenue forecast.

### Paid event promotion (requested model; not active)

- Proposed one-time price: **500 Stars (`XTR`) per event promotion**, at the user's direction. This is a Stars amount, not a guaranteed USD 20–50 equivalent; Telegram purchase cost varies by platform and region.
- The promotion would run until the event date. The organizer submits an event and an official external ticket/distributor URL; TUSA does not sell admission, handle ticket inventory, or promise ticket sales. The external seller remains clearly identified and responsible for ticket purchase, payment, refunds, and entry.
- Event submission and publication remain subject to organizer authorization and moderation. Payment must not auto-publish a pending, misleading, or unauthorized listing. The paid benefit is a clearly marked, time-limited sponsored placement after approval; ordinary organic relevance remains free and is not secretly altered.
- Explain TUSA before offering the purchase; visitors continue to the free app without payment. Only organizers who choose the promotion see an explicit price/terms confirmation and a Telegram Stars invoice. No card details, external checkout, or automatic charges.
- **Implementation status:** a per-event Stars campaign flow has been added behind `Payments:EventPromotionEnabled=false`, with 500 XTR as the configured proposal. It remains unavailable until an operator deliberately enables the feature after reviewing the live offer, terms, support/refund behavior, and test payment cycle. External-ticket links must be verified by moderation; TUSA remains discovery/promotion only, not the ticket seller.

### Requested pricing experiment (proposal only; not live)

The following is a product hypothesis, not an approved price or an enabled offer:

- Keep event discovery, basic listings, sharing, RSVP, and baseline organizer metrics free.
- Keep organic search relevance and date ordering available to everyone. Consider Pro for tools that save organizers time: campaign-link attribution, richer event reports, and a clearly labeled sponsored placement. Do not sell an undisclosed organic ranking advantage; sponsored results must be labeled, query-relevant, and measured separately.
- Test a 49-day free access period only after the Pro benefits exist. Do not collect a card to start it. Give advance notice before expiry and require the organizer to explicitly choose and pay for a plan; no surprise charge or assumed card-on-file renewal.
- The current backend invoices one 30-day period. A monthly offer can be considered as a 30-day Stars purchase. An annual offer would need its own tested entitlement, price, terms, and refund handling; do not describe it as an automatically renewing annual subscription before Telegram support and the implementation are verified.
- Inside the Telegram bot/Mini App, digital Pro and promotion must use Telegram Stars (`XTR`). Do not add Visa, MIR, Stripe, or another external card checkout for these in-Telegram digital services, and do not store card details. The user obtains Stars through Telegram-supported purchase methods.
- These options do not change the release gate: keep checkout disabled and the price at `0` until the organizer benefit, offer terms, trial expiry, purchase/renewal behavior, `/paysupport`, refunds, idempotency, and test-environment cycle are verified.

## First-money validation

The first signal is whether real organizers value the digital toolkit enough to pay for it—not ticket GMV.

1. Onboard 5 pilot organizers with free event listings and permission to publish.
2. Publish 20 verified, real events and measure views, shares, and RSVP.
3. Implement and verify the Organizer Pro digital benefit bundle.
4. Test Stars purchase, duplicate updates, failed/cancelled payment, service activation, `/paysupport`, and Stars refund in Telegram's test environment.
5. Set a Stars price only after the bundle and support obligations are clear; then measure paid organizer conversion and renewal.

Do not count event page views, RSVPs, outbound traffic, or organizer-reported ticket sales as TUSA revenue. Report revenue in Stars and the actual Telegram payout/reward value separately; do not convert it to KZT using an assumed exchange rate.

## Release gates

- **Supply:** organizer permission, moderation, accurate event details, and an owner for each event.
- **Digital service:** specific Pro features exist and can be delivered for the paid 30-day period.
- **Stars:** invoice uses `currency: XTR`; validate payload, payer, amount, and `successful_payment` server-side; process duplicate updates idempotently.
- **Trust:** terms consent before invoice, clear `/paysupport`, tested refund flow, and user-facing status.
- **Infrastructure:** an HTTPS API is deployed on Render, but the current free web service can sleep and the free PostgreSQL database expires after 30 days. Before live subscriptions or relying on RSVP data, use always-on compute, durable storage, backups, monitoring, and a tested restore.

Until these gates pass, keep `Payments:OrganizerProEnabled=false` and `Payments:TelegramSubscriptionStars=0`. Both are required for checkout. Offline-ticket checkout is removed/hard-disabled in the backend; do not configure a physical provider token or add an alternate path to sell offline admission.
