# TusaMap

Карта событий Астаны — Telegram Mini App для поиска мероприятий, сообществ по интересам и встреч в городе. Бот: [@tusa_astana_bot](https://t.me/tusa_astana_bot).

TUSA помогает жителям Астаны находить, куда пойти, а организаторам — публиковать и продвигать события без продажи офлайн-билетов через приложение. Каталог, RSVP и интерес-группы бесплатны; платная часть (когда будет включена) — только цифровые сервисы внутри Telegram (Stars), например Organizer Pro.

**Токен бота** хранится только на бэкенде (переменные окружения), в репозитории его нет.

## Product and monetization policy

TUSA is an Astana event-discovery and organizer-tools Mini App. Event discovery and RSVP are free. TUSA does **not** sell admission to offline events or collect entry fees. Its only planned paid offer is the digital Organizer Pro service, billed inside Telegram in Stars; the price is currently `0`, so checkout remains off until the digital benefits, terms, support, and refund flow are verified.

Telegram requires Stars for digital goods and services inside bots and Mini Apps. Stars must not be used to charge for admission to in-person events. See the [monetization plan](docs/MONETIZATION_PLAN.md) and [execution sprint](docs/EXECUTION_SPRINT.md) for the current direction. Older ticket-commission and KZT-provider proposals are superseded.

## GitHub Pages

Сайт публикуется на **https://tusa-astana.github.io/yessken.github.io/** через GitHub Actions при пуше в `main`. В репозитории должны быть в корне: `package.json`, `angular.json`, `src/`, `.github/workflows/deploy-pages.yml`. В настройках репозитории: **Settings → Pages → Source**: GitHub Actions.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Use this project as a Telegram Mini App starter

This repository is currently the TUSA application, not a generic app generator. Developers can fork/clone it as a starter, replace TUSA branding and event-specific logic, and configure their own Telegram bot and API.

### 1. Create and configure your bot

1. Create a bot with [@BotFather](https://t.me/BotFather) and keep its bot token private.
2. Host the Angular app on an HTTPS origin.
3. Set the bot's Web App domain/menu URL to that HTTPS origin in BotFather. The backend calls `setChatMenuButton` on startup when `Telegram:WebAppUrl` is configured.
4. Set an HTTPS webhook URL that reaches the API and create a separate webhook secret. Do not reuse the bot token as the webhook secret.

### 2. Configure API secrets

In the backend project folder, configure the bot token, public Mini App URL, webhook URL, webhook secret, and numeric admin Telegram ID with .NET User Secrets for local Development. For deployment, use the hosting provider's secret/environment-variable store. Environment variable names use double underscores, for example `Telegram__BotToken`, `Telegram__WebAppUrl`, `Telegram__WebhookUrl`, `Telegram__WebhookSecret`, and `Telegram__AdminUserIds__0`.

Never put bot tokens or webhook secrets in Angular source, `environment*.ts`, committed `appsettings*.json`, screenshots, or public chat. The current Stars-only policy has no external payment-provider token. Rotate a credential immediately if it was exposed.

### 3. Point the frontend to your API

- Local development: set `apiUrl` in [src/environments/environment.ts](src/environments/environment.ts) to the local API origin.
- Production: set `apiUrl` in [src/environments/environment.prod.ts](src/environments/environment.prod.ts) to the stable HTTPS API origin, then build and deploy the frontend.
- For Telegram testing, the frontend and webhook must use the current public HTTPS tunnel/domain. Cloudflare Quick Tunnels generate temporary hostnames; use a named tunnel or stable hosting outside short tests.

### 4. Telegram authentication model

The Mini App sends the raw `Telegram.WebApp.initData` string in the `X-Telegram-Init-Data` HTTP header. The API validates Telegram's HMAC signature and `auth_date` using the bot token, then derives the user ID from the verified payload.

Do not authorize a request using `initDataUnsafe`, a client-supplied Telegram ID, username, or role: these do not prove identity. Keep authorization decisions on the API. Admin endpoints require valid `initData` and a user ID listed in `Telegram:AdminUserIds`.

Organizer submissions stay unpublished until an administrator reviews them in `/admin/event-review`. When the bot token and admin allowlist are configured, new submissions also trigger a Telegram notification. The browser-accessible demo submission endpoint is still anonymous and only has a basic request-rate cap; add captcha/anti-spam controls or restrict it before inviting unrestricted public submissions.

### Starter-specific pieces to replace

- `Tusa2026EventSeeder` and TUSA-specific event IDs, prices, and copy;
- TUSA event UI and brand assets;
- organizer/admin policies and the digital Organizer Pro subscription.

Use Telegram Stars only for digital services delivered inside TUSA. Never charge Stars for offline event admission, and do not add a third-party checkout/provider for tickets under the current product policy. Do not enable Organizer Pro checkout until its digital benefits, price, terms consent, successful payment, `/paysupport`, and Stars refund flow are verified.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Support & Sponsorship

TUSA — открытый продукт для афиши и сообществ Астаны. Если проект полезен, поддержите его через кнопку **Sponsor** на странице репозитория.

Средства пойдут на:
- хостинг API и GitHub Pages;
- модерацию и развитие каталога событий и интерес-групп;
- поддержку Telegram-бота и инфраструктуру безопасности.

Спонсорство не даёт платного доступа к офлайн-мероприятиям и не заменяет Organizer Pro.
