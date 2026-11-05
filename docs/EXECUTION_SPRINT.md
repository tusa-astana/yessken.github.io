# Founder sprint: first paid Organizer Pro subscription in Telegram Stars

## Mission

Turn TUSA into a useful Astana event-discovery and organizer-tools Mini App, then validate one compliant digital revenue stream inside Telegram.

The next milestone is not “complete app.” The next milestone is:
- 5 organizers onboarded
- 20 real events live
- 1 organizer paying for a verified digital Pro service in Stars
- 1 repeat organizer
- first Stars revenue generated

## Success metric

We only continue if the product proves one simple truth:

“Organizers pay for digital tools delivered inside TUSA.”

## Work streams

### 1. Sales stream

Goal: secure the first 3–5 organizer pilots.

Activities:
- identify 20 organizers and promoters
- reach out manually
- offer a free, moderated launch listing
- collect event assets and audience links
- publish the first real events
- measure conversion and attendance interest

Output:
- 3 pilot organizers confirmed
- at least 5 events launched

### 2. Product stream

Goal: make the app ready to validate organizer value and the digital Stars service.

Implemented: event discovery/search, event details, organizer submissions, admin moderation queue and alerts, RSVP, a Stars subscription invoice path for Organizer Pro, and basic conversion analytics. Offline ticket sales are not part of the current product model.

Release blockers (do not describe these as complete):
1. The API is deployed at `https://backend-l0ux.onrender.com` with PostgreSQL, but the current free Render services are a pilot setup: the web service can sleep after inactivity and the free database expires after 30 days. Always-on production reliability, backups, and a tested restore are not yet established.
2. Organizer Pro needs a verified digital benefit bundle, approved Stars price, current terms, support and refund runbook, and a complete Telegram Stars test cycle.
3. Real organizers and live events are needed to validate discovery, RSVP, and willingness to pay for Pro.

Output:
- real organizer submissions are reviewed and published;
- a test organizer can buy Organizer Pro with Stars, receive the digital service, and request support/refund;
- the organizer sees only accurate, implemented Pro benefits and event analytics.

### 3. Measurement stream

Goal: prove conversion.

Track:
- event views and detail page visits
- shares and RSVPs (not ticket reservations)
- Organizer Pro offer views and Stars invoice starts
- successful Stars payments, activations, refunds, and renewals
- organizer repeat behavior and paid conversion

Output:
- a simple weekly revenue and conversion report

## Weekly plan

### Gate 1: get real supply
- choose a stable backend host;
- contact organizers and confirm one pilot event with permission to list it;
- submit, review, and publish it through the new moderation flow.

### Gate 2: prove Stars subscription safely
- finish the digital Organizer Pro bundle and approve the Stars price;
- test successful and cancelled invoice flows, duplicate updates, consent, activation, `/paysupport`, and Stars refunds in Telegram's test environment;
- keep the Stars price at `0` until the test cycle and support process pass;
- never use Stars or a third-party checkout to sell admission to offline events.

### Gate 3: prove demand
- invite the organizer's audience to the listing;
- track listing views, shares, RSVP, Pro offer views, Stars conversions, refunds, and support requests;
- review actual organizer feedback and Stars proceeds before expanding the digital offer.

## Founder rules

- no broad UI polish before organizer value is demonstrated
- no paid visitor subscription
- no offline ticket sales in TUSA
- no extra paid digital features without a real organizer use case
- no claiming success without conversion data

## Minimum evidence required before expansion

We continue scaling the paid product only if we have:
- real organizer demand
- verified use of the digital Pro benefits
- measurable Stars conversion and support/refund performance
- repeat organizer willingness to pay

## Immediate next actions

1. Keep the Render free deployment for testing; before relying on it for real users, choose an always-on API plan, durable database plan, backups, and a tested restore process.
2. Contact the first 10 organizers and secure one real pilot event with permission to publish.
3. Run the event through submission, moderation, publication, sharing, and free RSVP; do not sell admission in TUSA.
4. Define the actual Organizer Pro digital benefits and Stars price.
5. Enable Organizer Pro only after the Telegram Stars test, terms consent, duplicate-update handling, `/paysupport`, and refund procedure pass.
6. Measure event engagement and Stars conversion; report Stars received and payout value separately.

This sprint is designed to produce the first real business signal: an organizer paying Stars for a digital service inside TUSA.
