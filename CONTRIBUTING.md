# Contributing

We are more than happy to accept external contributions to the project in the form of feedback, bug reports and even better - pull requests :)

## Issue submission

In order for us to help you please check that you've completed the following steps:

* Made sure you're bug isn't already fixed in the master branch.
* Used the search feature to ensure that the bug hasn't been reported before
* Included as much information about the bug as possible, including any output you've received, what Server OS, PHP version you're on, etc.
* Make sure you only submit one problem per issue

[Submit your issue](https://github.com/BanManagement/BanManager-WebUI/issues/new)

## Pull Request Guidelines

* Please check to make sure that there aren't existing pull requests attempting to address the issue mentioned.
* Non-trivial changes should be discussed in an issue first
* Develop in a topic branch, not master (e.g. `feature/new-view`)
* Write a convincing description of your PR and why we should land it
* If you write JavaScript, make sure you follow https://standardjs.com/

## Localisation

The UI uses [`next-intl`](https://next-intl.dev/) for client-side translations. Translation catalogues live in [`messages/`](messages/) and the locale registry / negotiation logic lives in [`server/data/locales.js`](server/data/locales.js) (re-exported by [`utils/locale.js`](utils/locale.js) for client code).

### Authoring rules

* Always introduce new user-facing text via `useTranslations(...)` (or `t.rich(...)` when the message contains markup or interpolated React elements). Never hard-code English strings in components.
* Group keys by feature area: `common.*`, `nav.*`, `forms.*`, `pages.<page>.*`, `errors.*`, `widgets.*`, `notifications.*`, `components.*`.
* Use ICU MessageFormat for plurals/interpolation: `"Removed {count, plural, one {# item} other {# items}}"`.
* Keep `messages/en.json` as the canonical source of truth. Every other locale must mirror its key structure exactly.

### Adding a string

1. Add the key + English copy to `messages/en.json`.
2. Add a translation under the same key in every other locale file (`messages/de.json`, etc.). If a translation is unavailable at submission time, copy the English value as a placeholder so the key still resolves.
3. Reference the key from a component:
   ```js
   import { useTranslations } from 'next-intl'

   const t = useTranslations('pages.login')
   return <h1>{t('title')}</h1>
   ```

### Adding a new locale

1. Add the locale code to `SUPPORTED_LOCALES` in `server/data/locales.js`.
2. Extend `LOCALE_CONFIG` in `utils/locale.js` with `label` (native name shown in the switcher), `htmlLang`, `openGraphLocale`, `dateFormat`, and `dateFnsLocale` (must match a [`date-fns` locale module](https://date-fns.org/v4.1.0/docs/I18n)).
3. Add the locale entry to `dateFnsLocaleLoaders` in `utils/format-distance.js` so dynamic imports work.
4. Create `messages/<locale>.json` with a 1:1 copy of `messages/en.json`, then translate.
5. Run `npm run build` and `npm run test` to verify the locale loads and tests pass.

The `LanguageSwitcher` component automatically picks up new locales from `SUPPORTED_LOCALES` and renders them using the `label` from `LOCALE_CONFIG`.

### Server-side error messages

Errors thrown from GraphQL resolvers, GraphQL directives, REST routes, and webhook handlers are translated client-side via stable error codes — **not** by translating the server's English text.

* Always pass an error code as the second argument to `ExposedError`:
  ```js
  throw new ExposedError('Server not found', 'SERVER_NOT_FOUND')
  ```
* For dynamic content (e.g. plurals, names), pass a `meta` object as the third argument:
  ```js
  throw new ExposedError('This password isn\'t safe…', 'PASSWORD_COMPROMISED', { count: 5 })
  ```
* In Koa REST routes, call `ctx.throw(status, message, { code: 'STABLE_CODE', meta: {...} })` so the JSON body exposes `code` and `meta`. The `code` and `meta` properties are surfaced by the error middleware in [`server/app.js`](server/app.js).
* Add a corresponding key to `messages/<locale>.json` under `errors.<CODE>` for every supported locale. Use ICU placeholders matching the `meta` keys.
* The client UI (`components/ErrorMessages.js`/`utils/locale.js#translateGraphqlError` for GraphQL, `utils/locale.js#translateRestError` for REST) looks up the code and falls back to the server's message if no translation exists.
* `BAD_USER_INPUT` errors (raised by `graphql-constraint-directive`) are intentionally **not** assigned an `appCode`, so the constraint message is shown verbatim. See the out-of-scope list below.

> **Compatibility note**: `ExposedError` now defaults `code` to `'UNKNOWN'` (and `extensions.appCode` to `'UNKNOWN'`) when no second argument is supplied. Previously this field was `undefined`. Any downstream consumer that checks `if (!err.code)` should be updated to check for the literal string `'UNKNOWN'` instead. New call-sites must always pass an explicit, stable code.

### Out-of-scope (explicitly NOT translated)

The following surfaces are intentionally left in English to keep the scope manageable:

* The setup/installer SPA under `server/setup/static/` (run-once flow).
* CLI command output (`cli/commands/**`, `cli/utils/**`).
* `graphql-constraint-directive` validation messages.
* User-generated content (player names, ban reasons, appeal/report comments, custom roles, server names, document content).
* Server logs and Pino output (`logger.*` calls).

If you want to localise any of these, please open an issue first to discuss scope.

### Manual verification

Before submitting a PR that touches localisation:

1. Toggle the language switcher in the top-right and confirm the page re-renders in the chosen language.
2. Reload the page and confirm the choice persisted via the `bm_locale` cookie.
3. If you're logged in, confirm `setLocale` ran and the preference survives a logout/login cycle.
4. Check that `<html lang="…">` updates to match (DevTools → Elements panel).
5. Trigger a known server error (e.g. submit invalid login) and verify the message renders in the active locale.
