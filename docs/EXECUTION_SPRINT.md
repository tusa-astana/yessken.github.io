# Founder sprint: prove people-first local discovery

## Mission

Turn TUSA into the fastest trusted way to find a real plan and people to join in Astana. Event attendance and RSVP remain free; Organizer Pro is a later, separate business hypothesis—not the visitor product's North Star.

The next milestone is not “complete app” or ticket revenue. It is a small, repeatable people-first loop:
- one person finds a real, current plan on the map;
- they RSVP or share that exact place/date with a friend;
- a second person opens the shared deep link and joins;
- people return for another plan within seven days.

## North Star and guardrails

**North Star:** weekly venue/date plans with at least two RSVP marks. This measures coordination intent, not verified attendance, ticket sales, or unique people; repeat marks and anonymous RSVPs remain valid.

Leading indicators: member-plan `community_gathering_share` / `community_gathering_open` / `community_gathering_rsvp`, venue-plan `meetup_share_intent` / `meetup_invite_open`, second RSVP on a plan, and seven-day return. Gathering share/open analytics store no Telegram user ID; RSVP rows are created server-side with the first attendance insert and also store no Telegram ID. Creating a gathering automatically adds the host's first RSVP, which is included in this metric. Opens may repeat; RSVP counts are new join actions (a person who leaves and rejoins may count again), not unique reach, delivery, or verified attendance. Venue-plan legacy funnel metrics may retain a validated Telegram ID when initData is present. Report the two plan types separately.

Guardrails: no ticket checkout, no age inference, no scraping Instagram, no exposing Telegram identity without explicit opt-in, and no fabricated event or availability claims. Age ranges/interests are not in the meetup data model; keep them out until a consent and safety design is agreed.

## Work streams

### 1. Supply and community stream

Goal: recruit a few reliable seed hosts/communities so visitors have real plans to join.

Activities:
- start with one compact Astana area/time window and one repeatable activity vertical;
- ask community admins/hosts to nominate 2–3 public plans and share the exact TUSA deep link;
- confirm date, public venue, meeting description, and permission before highlighting a host or venue;
- use venue Instagram only as an outbound link; request approval before embedding or reusing its media;
- personally invite a small first cohort and observe whether a second person joins each plan.

Output:
- a small set of current, host-backed plans with an explicit next plan time;
- evidence that at least one plan gets a second RSVP and a repeat plan is created.

### 2. Product stream

Goal: make discovery-to-invite-to-RSVP fast on a phone, including inside Telegram.

Implemented: Together opens with upcoming member-created interest-group meetups when they exist, followed by map/list venue discovery and anonymous-by-default venue/date RSVP. Interest groups, venue Instagram outbound links, shareable deep links, and the host campaign-link builder support the pilot. User-created plans are clearly distinguished from TUSA venue/date intentions; offline ticket sales are not part of the current product model.

Current limitations (do not describe these as complete):
1. The API is deployed at `https://backend-l0ux.onrender.com` with PostgreSQL, but the current free Render services are a pilot setup: the web service can sleep after inactivity and the free database expires after 30 days. Always-on production reliability, backups, and a tested restore are not yet established.
2. The current map is a curated venue catalog with date-based RSVP, not a full hosted-activity inventory. Real hosts and repeatable plans are needed to validate discovery, RSVP, and social usefulness.
3. Organizer Pro needs a verified digital benefit bundle, approved Stars price, current terms, support and refund runbook, and a complete Telegram Stars test cycle. This is a future monetization gate, not a blocker for the free visitor meetup pilot.

Output:
- a recipient can open a shared place/date link, see the plan, and RSVP in one clear step;
- a host can repeat a plan and see RSVP counts without exposing anonymous users;
- analytics distinguish impressions/opens, outbound clicks, RSVP, and actual attendance (attendance remains unverified unless separately recorded).

### 3. Measurement stream

Goal: prove the people loop before optimizing revenue.

Track:
- member-created gathering `community_gathering_share` / `community_gathering_open` / server-recorded new `community_gathering_rsvp`, venue-plan `meetup_share_intent` / `meetup_invite_open`, map/list views, and RSVP actions (not ticket reservations)
- weekly plans reaching at least two RSVP marks; seven-day return visits
- outbound clicks from the curated Telegram community directory (clicks are not group joins)
- Organizer Pro offer views and Stars invoice starts only if/when that future hypothesis is re-opened

The admin pilot dashboard reports curated venue/date plans in the current Astana day plus the next six days that have at least two current attendance rows. It is an upcoming seven-day snapshot, not historical weekly retention; it returns aggregate counts only, and RSVP remains intent rather than attendance.

Output:
- a simple weekly activation, plan-density, repeat-use, host-supply and referral report

## Weekly plan

### Gate 1: get real supply
- choose one audience wedge and neighborhood/time window;
- recruit seed hosts/community admins and get permission for each featured plan;
- share specific map deep links and manually observe the first two-person RSVP loop.

### Gate 2: prove repeat social usefulness
- run a second plan with the same host/community;
- ask both host and participants what blocked discovery, coordination, or return;
- improve only the largest observed friction; don't add speculative age, profiles, or recommendations.

### Gate 3: keep any future Stars offer compliant
- finish the digital Organizer Pro bundle and approve the Stars price;
- test successful and cancelled invoice flows, duplicate updates, consent, activation, `/paysupport`, and Stars refunds in Telegram's test environment;
- keep the Stars price at `0` until the test cycle and support process pass;
- never use Stars or a third-party checkout to sell admission to offline events.

### Gate 4: prove organizer value later
- after the visitor loop repeats, test with organizers whether digital tools solve a real recurring problem;
- keep Organizer Pro disabled at 0 Stars until benefits, terms, support and refunds are verified.

## Founder rules

- don't optimize monetization before people can reliably find and join plans
- no paid visitor subscription
- no offline ticket sales in TUSA
- no extra paid digital features without a real organizer use case
- no claiming success without conversion data

## Minimum evidence required before expansion

We prioritize growth only if real people repeatedly create and join plans. Any future paid product additionally requires real organizer demand, delivered digital benefits, Stars lifecycle tests, support/refund performance, and repeat willingness to pay.

## Immediate next actions

1. Keep Render free deployment for a limited pilot; its sleep/30-day database expiry means it is not dependable infrastructure for a scaled social graph.
2. Recruit a few seed hosts in one small audience wedge; confirm each public meetup plan and the host's permission.
3. Share plan-specific deep links; measure first-plan RSVP, second RSVP, and next-week return.
4. Review support, privacy and safety feedback before widening geography or collecting any new profile attributes.
5. Revisit Organizer Pro only after repeated visitor use and a validated organizer problem; keep it disabled until the Stars release gates pass.

## Future discovery roadmap (not part of the current sprint)

Do not begin worldwide city coverage, artist profiles, tour pages, or personalized recommendations until the current Astana pilot produces enough usable evidence. Use the sequence: **instrument → observe → state a falsifiable hypothesis → validate manually or with a small prototype → decide → then build the smallest feature**.

### Research and measurement prerequisites

- **Implemented for the current event catalog:** date-range analysis (7/30/90 days), daily trend charts, category ranking by event opens, letters-only search-word aggregates shown only at 3+ occurrences, and ticket-distributor click counts. These are aggregate actions, not unique reach, completed contact, or ticket sales.
- **Implemented, operations-dependent, opt-in:** a daily Telegram admin report at 20:00 Astana, deduplicated by report date in the database, with a dashboard deep link. Delivery requires explicit `Analytics:DailyReportEnabled=true`, `Telegram:BotToken`, and `Telegram:AdminUserIds`; notifications default to disabled and the dashboard works without them. The current free host may sleep, so it cannot guarantee timely delivery until moved to always-on hosting.
- Before adding explicit contact requests, collect only after clear consent and disclose who receives a message; keep visitor identity hidden by default. Search terms are stored as individual letter-only words without Telegram ID, and low-frequency terms are suppressed in admin views.
- Use these data with interviews to test separately: (1) city selector demand, (2) city-specific artist tour schedules, (3) artist profile usefulness, (4) recommendation usefulness, and (5) organizer/artist contact intent. Don't infer a product decision from raw click totals alone.

### Future delivery phases, gated by evidence

1. **Multi-city foundation:** event records include country/city, local time zone, coordinates, language, and an accountable source/moderator. Pilot one additional city only after a local supply owner and enough verified events exist; global availability is not a launch claim.
2. **Artist profile MVP:** manually curated artist identity, verified official links, permitted bio/image, genres and data provenance; avoid automatic merging of same-name artists and unlicensed scraping.
3. **Tour pages:** group confirmed event stops for the same artist/tour by city and local date; each stop links to its organizer and named official ticket seller. Track announced/postponed/cancelled/past states and last verification date. External seller owns ticket stock, payment, refunds and admission.
4. **Recommendations:** start with transparent city/date/genre rules and a clear “why recommended” explanation. Personalized suggestions require opt-in and a way to edit/disable interests; sponsored placements stay visibly labeled and separate from organic ranking.
5. **Contact demand:** count an explicit “request contact”/“contact organizer” action as intent only. If contact details are shared, ask explicit consent, disclose recipient and purpose, and never expose attendee identity by default. Report aggregate demand separately from completed contact and sales.

Each phase needs a written hypothesis, small test, owner/source of truth, privacy/content-rights review, success and stop thresholds, and a decision record before engineering begins. If the test fails, revise or drop the hypothesis rather than expanding the data model speculatively.

This sprint is designed to produce the first real product signal: people find and share a specific local plan, another person joins, and the behavior repeats. Stars revenue remains a separate future business signal.
