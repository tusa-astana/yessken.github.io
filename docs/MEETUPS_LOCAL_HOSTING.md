# Host TUSA meetups from your own PC

Meetup attendance needs a shared API. For a free pilot, the existing ASP.NET API runs on your PC, stores attendance in a separate local SQLite database, and serves the Angular app through one HTTPS tunnel. **The PC must stay awake, online, and running both launcher terminals**; if it sleeps or shuts down, the public link stops working.

## Venue and promotion data

- The API currently serves a small Astana venue catalog with outward links to venue cards. Bourbon Street Bar is first and marked “Выбор TUSA”. The `Featured`, `PromotionLabel`, and `FeaturedUntilUtc` fields apply to any venue, so other listings can be featured/expired later.
- Venue cards intentionally have no photo block or social-media embeds. Bourbon is marked “Выбор TUSA”; no venue image is shown until an authorized venue-focused asset is supplied.
- `ImageUrl` remains available for a future venue photo, but only add a photo supplied by the venue or explicitly licensed for reuse. Publicly visible does not automatically mean reusable. 2GIS's license restricts extracting and reusing its business-directory data/photos; use its profile links, or obtain permission/an API agreement before reproducing its data or photos.
- Curated `GalleryUrl` and `PreviewPostUrl` values are outbound links to venue Instagram profiles/posts; TUSA does not log in to Instagram, scrape content, or import follower/profile data. The map can show those links where the venue catalog supplies them.
- Meetup attendance currently stores venue, date, approximate arrival time, anonymity, and the separate opt-in “open to meet” flag. It does **not** collect attendee age ranges or bind attendee interests to a map meetup. Do not infer or display age/interests until a separate opt-in data design, privacy copy, and age-safety policy are approved; current “18+” UI copy is not age verification.
- `/interests` contains curated, chat-free interest groups and member-proposed public meetups with date, time, place, and RSVP. Membership and privacy choices are stored by the API; profiles are hidden by default. Behavior reports go to the admin review queue at `/admin/interest-reports`, where a moderator may dismiss a report or suspend an account from interest groups. Health or addiction status is not collected or used for eligibility.
- Opening hours and availability can change; confirm directly with the venue.
- Telegram names/photos are shown only for non-anonymous attendance. The `@username` contact link is revealed only when the attendee opts into “Открыт(а) к знакомствам”. Anonymous attendance hides profile fields. Meetups are 18+; use public places.

## Run locally

1. Install .NET 10 SDK and Node.js/npm.
2. In PowerShell, run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-meetups-local.ps1`. It builds Angular and starts the combined app/API at `http://localhost:5001/`.
3. Open `http://localhost:5001/meetups`. In a normal browser, the real venue list is read-only; signing up requires a Telegram Mini App session.
4. If this API project doesn't already have the bot token in .NET User Secrets, run the command below in `c:\projects\backend\TusaMap.Api` and enter the token locally. Never send or commit it:

   `dotnet user-secrets set "Telegram:BotToken" "YOUR_BOT_TOKEN"`

By default the local launcher disables Telegram menu/webhook reconfiguration but leaves Telegram signature validation enabled. Use `-ConfigureTelegram` only after supplying the current public URL.

## Let Telegram users reach the app

A localhost address is private. With the local app running, open a **second** PowerShell terminal and run:

`powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-meetups-tunnel.ps1`

The Cloudflare Quick Tunnel prints a temporary `https://…trycloudflare.com` address. The front end and `/api` use the same origin. To configure Telegram with the current address, stop the first local-app process while leaving the tunnel terminal open, then restart the app with `-WebAppUrl 'https://…trycloudflare.com' -ConfigureTelegram`. This updates the bot's Mini App menu and webhook through the Telegram Bot API. Then share the bot's Mini App link with the Telegram group so Telegram supplies the signed identity data.

Quick Tunnel URLs change after the tunnel restarts, so update BotFather then. Keep both terminals open. The tunnel has no uptime guarantee; this is a free pilot, not production hosting. No BotFather setting is changed automatically.

## If the computer shuts down

The bot remains registered with Telegram, but a webhook/API and Quick Tunnel running on this PC stop. Telegram cannot deliver `/start` or other updates to the local webhook until the API and a public HTTPS tunnel are running again. Do not rely on the temporary URL from an earlier session.

To reconnect, start the local app without Telegram reconfiguration, start the tunnel and copy its current URL, then restart the app with that URL and `-ConfigureTelegram` so the webhook and Mini App menu are updated. The API's bot token, webhook secret, and admin allowlist must already be configured locally with .NET User Secrets or environment variables; never place them in this repository. For reliable uptime, host the API and webhook on an always-on HTTPS service and use a stable domain instead of a Quick Tunnel.
