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
- **Infrastructure:** stable HTTPS API, backups, monitoring, and tested restore before live subscriptions.

Until these gates pass, keep `Payments:OrganizerProEnabled=false` and `Payments:TelegramSubscriptionStars=0`. Both are required for checkout. Offline-ticket checkout is removed/hard-disabled in the backend; do not configure a physical provider token or add an alternate path to sell offline admission.
