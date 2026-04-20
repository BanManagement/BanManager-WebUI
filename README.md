<p align="center">
  <a href="https://banmanagement.com">
    <img src="https://banmanagement.com/images/banmanager-icon.png" height="128">
    <h1 align="center">BanManager WebUI</h1>
  </a>
</p>

<h3 align="center">
	Modern web client designed for self-hosting
</h3>

<p align="center">
	<strong>
		<a href="https://banmanagement.com">Website</a>
		|
		<a href="https://banmanagement.com/docs/webui/install">Docs</a>
		|
		<a href="https://demo.banmanagement.com">Demo</a>
	</strong>
</p>
<p align="center">
  <a aria-label="Tests status" href="https://github.com/BanManagement/BanManager-WebUI/actions/workflows/build.yaml">
    <img alt="" src="https://img.shields.io/github/actions/workflow/status/BanManagement/BanManager-WebUI/build.yaml?label=Tests&style=for-the-badge&labelColor=000000">
  </a>
  <a aria-label="License" href="https://github.com/BanManagement/BanManager-WebUI/blob/master/LICENSE">
    <img alt="" src="https://img.shields.io/github/license/BanManagement/BanManager-WebUI?labelColor=000&style=for-the-badge">
  </a>
  <a aria-label="Join the community on Discord" href="https://discord.gg/59bsgZB">
    <img alt="" src="https://img.shields.io/discord/664808009393766401?label=Support&style=for-the-badge&labelColor=000000&color=7289da">
  </a>
</p>

<p align="center">
  <a aria-label="Demo" href="https://demo.banmanagement.com">
	  <img src="https://github.com/BanManagement/BanManager-WebUI/blob/assets/welcome.png?raw=true" width="550">
  </a>
</p>

## Overview

- **Always connected.** Manage punishments from anywhere with seamless logins
- **Cross platform.** It doesn't matter what OS you use, it just works wherever Node.js runs
- **Responsive interface.** Manage your community from any device at any time

To learn more about configuration, usage and features of BanManager, take a look at [the website](https://banmanagement.com/) or view [the demo](https://demo.banmanagement.com).

## Features

- Appeal punishments
- Ban, unban, mute, and warn players
- Review and manage reports on the go
- Custom roles and flexible permissions
- A single interface for multiple Minecraft servers

## Installation (Production)

Pick the path that matches your environment. Each one ends with a working WebUI you can sign in to.

For more depth (BanManager plugin install, advanced topics), see the **[full installation guide](https://banmanagement.com/docs/webui/install)**.

### Requirements

- MySQL v5+ or MariaDB v10+ (shared with the BanManager plugin)
- A Minecraft server with [BanManager](https://github.com/BanManagement/BanManager) & [BanManager-WebEnhancer](https://ci.frostcast.net/job/BanManager-WebEnhancer/) configured to [use MySQL or MariaDB](https://banmanagement.com/docs/banmanager/install#setup-shared-database-optional)
- For non-Docker installs: [Node.js](https://nodejs.org/) LTS (v22 or v24)

### Path A — Docker Compose (recommended)

Includes the WebUI and a MySQL database in one command. Already have MySQL? Use [`docker-compose.prod-no-db.yml`](docker-compose.prod-no-db.yml) instead.

```bash
curl -O https://raw.githubusercontent.com/BanManagement/BanManager-WebUI/master/docker-compose.prod.yml

cat > .env <<'EOF'
MYSQL_ROOT_PASSWORD=$(openssl rand -hex 24)
MYSQL_PASSWORD=$(openssl rand -hex 24)
EOF

docker compose -f docker-compose.prod.yml up -d
```

The Compose file refuses to start without `MYSQL_ROOT_PASSWORD` and `MYSQL_PASSWORD` set — generate long random values (the snippet above does this for you) and keep them in a `.env` file alongside the compose file. The container generates encryption/session/VAPID keys, runs migrations, and persists state to a `webui_config` volume on first boot. Open `http://your-host:3000/setup` to finish setup in your browser, or attach a shell and run `docker compose exec webui npx bmwebui setup` for the CLI wizard.

To check things look right at any time:

```bash
docker compose exec webui npx bmwebui doctor
```

### Path B — Web installer (any host)

Useful if you want a one-shot install with no terminal interaction after the server is up.

```bash
git clone https://github.com/BanManagement/BanManager-WebUI.git
cd BanManager-WebUI
npm ci --omit=dev
npm run build
node server.js   # starts in setup mode if no .env exists yet
```

Then visit `http://your-host:3000/setup` and follow the wizard. The web installer writes a `.env` file, runs migrations, and creates the first admin account. After it finishes, restart the server (`Ctrl+C`, `node server.js`).

> **⚠ Security model.** The setup endpoint is open by default — whoever loads `/setup` first becomes the admin (same model as WordPress/Ghost). If your install host is reachable from the internet, set `SETUP_TOKEN=$(openssl rand -hex 24)` before starting and share that token only with the person doing the install. The setup screen will require it as the first step. Once an admin user exists the setup routes return 404.
>
> **Behind a reverse proxy?** Set `TRUST_PROXY=true` so the WebUI uses `X-Forwarded-For` / `X-Forwarded-Proto` to detect the real client IP and HTTPS status. Without it, every request looks like it came from `127.0.0.1` and the "you're on a secure local connection" banner can be misleading.

### Path C — CLI wizard (terminal-only)

Best when you have shell access and want everything done before the server starts.

```bash
git clone https://github.com/BanManagement/BanManager-WebUI.git
cd BanManager-WebUI
npm ci --omit=dev
npm run setup       # interactive wizard, writes .env
npm run build
npm start
```

The wizard auto-detects database settings and the console UUID from your BanManager `plugins/BanManager` folder when it can.

### Verify and run as a service

After any path:

- `npx bmwebui doctor` — runs preflight checks (env, DB, migrations, admin user, plugin tables) and tells you exactly what's wrong if anything is.
- `npx bmwebui setup systemd` — registers the WebUI as a `systemd` service.
- `npx bmwebui setup nginx` / `setup caddy` / `setup apache` — drops in a reverse-proxy template for your web server of choice (existing nginx setups are unchanged).

Need to add another account later?

```bash
npx bmwebui account create
```

---

## Development

Want to contribute or run a local development environment? This section is for you.

### Prerequisites

- [Node.js](https://nodejs.org/) LTS (v22 or v24)
- [Docker](https://www.docker.com/) (for local MySQL database)

### Quick Start

```bash
# Clone the repository
git clone git@github.com:BanManagement/BanManager-WebUI.git
cd BanManager-WebUI

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start MySQL and seed the database (first time setup)
npm run dev:setup

# Start the development server
npm run dev
```

The application will be available at http://localhost:3000

### Test Accounts

After seeding, the following accounts are available:

| Role  | Email                   | Password |
| ----- | ----------------------- | -------- |
| Guest | guest@banmanagement.com | testing  |
| User  | user@banmanagement.com  | testing  |
| Admin | admin@banmanagement.com | testing  |

### Available Scripts

| Script               | Description                                       |
| -------------------- | ------------------------------------------------- |
| `npm run dev:setup`  | Start MySQL container and seed the database       |
| `npm run dev`        | Start development server with hot reloading       |
| `npm run db:start`   | Start the MySQL Docker container                  |
| `npm run db:stop`    | Stop the MySQL Docker container                   |
| `npm run seed`       | Run migrations and seed data (fails if DB exists) |
| `npm run seed:reset` | Drop existing database and re-seed                |
| `npm run build`      | Build for production                              |
| `npm run test`       | Run linting and tests                             |
| `npm run lint`       | Run linting only                                  |
| `npm run cypress`    | Open Cypress for E2E tests                        |

### Environment Configuration

Copy `.env.example` to `.env` and adjust as needed. Key variables:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database connection
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` - Admin account credentials (also used by Cypress)
- `ENCRYPTION_KEY`, `SESSION_KEY` - Security keys (leave blank and `npm run dev:setup` will generate + persist them, or set your own)

### Resetting the Database

To reset the database with fresh seed data:

```bash
npm run seed:reset
```

### Running Tests

```bash
# Run all tests
npm run test

# Run Cypress E2E tests
npm run cypress
```

## Localisation

The UI is localised with [`next-intl`](https://next-intl.dev/). Currently shipping languages: **English (`en`)** and **German (`de`)**.

For details on adding a new language, translating new strings, or wiring up server-side error codes, see [`CONTRIBUTING.md`](CONTRIBUTING.md#localisation).

Locale resolution order (highest priority first):

1. Authenticated user's stored preference (`bm_web_users.locale`)
2. `bm_locale` cookie (set by the in-app language switcher)
3. `Accept-Language` HTTP header
4. Fallback to `en`

## Contributing

If you'd like to contribute, please fork the repository and use a feature branch. Pull requests are warmly welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines on translations, error codes, and other development conventions.

## Help / Bug / Feature Request

If you have found a bug please [open an issue](https://github.com/BanManagement/BanManager-WebUI/issues/new) with as much detail as possible, including relevant logs and screenshots where applicable

Have an idea for a new feature? Feel free to [open an issue](https://github.com/BanManagement/BanManager-WebUI/issues/new) or [join us on Discord](https://discord.gg/59bsgZB) to chat

## License

Free to use under the [MIT](LICENSE)

## Screenshots

Click to view

### Home

[![Home](https://github.com/BanManagement/BanManager-WebUI/blob/assets/welcome.png?raw=true)](welcome.png)

### Player

[![Player](https://github.com/BanManagement/BanManager-WebUI/blob/assets/player.png?raw=true)](player.png)

### Dashboard

[![Dashboard](https://github.com/BanManagement/BanManager-WebUI/blob/assets/dashboard.png?raw=true)](dashboard.png)

### Appeal

[![Appeal](https://github.com/BanManagement/BanManager-WebUI/blob/assets/appeal.png?raw=true)](appeal.png)

### Report

[![Report](https://github.com/BanManagement/BanManager-WebUI/blob/assets/report.png?raw=true)](report.png)
