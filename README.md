# Required Checkboxes Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/form-required-checkboxes.svg)](https://www.npmjs.com/package/@aarongustafson/form-required-checkboxes)
[![CI status](https://img.shields.io/github/actions/workflow/status/aarongustafson/form-required-checkboxes/ci.yml?branch=main&label=CI)](https://github.com/aarongustafson/form-required-checkboxes/actions/workflows/ci.yml)
[![Minified + gzipped size](https://img.shields.io/bundlejs/size/@aarongustafson/form-required-checkboxes?format=minzip&label=min%2Bgzip)](https://bundlejs.com/?q=@aarongustafson/form-required-checkboxes)
[![License](https://img.shields.io/npm/l/@aarongustafson/form-required-checkboxes)](https://github.com/aarongustafson/form-required-checkboxes/blob/main/LICENSE)
[![Type definitions](https://img.shields.io/npm/types/@aarongustafson/form-required-checkboxes)](https://github.com/aarongustafson/form-required-checkboxes/blob/main/form-required-checkboxes.d.ts)

`<form-required-checkboxes>` adds exact-count, range, and optional-maximum
validation to a group of native checkboxes. Use a `fieldset` with a `legend`,
labeled checkboxes that share a `name`, and a `required` count or range.
The checkboxes work without JavaScript, but group-count validation needs the
component. Messages can be authored per group or shared across a page. Always
validate selections on the server too.

## Demos

- [Exact count, selection limits, and custom messages](https://aarongustafson.github.io/form-required-checkboxes/demo/) ([Source](./demo/index.html))
- [Spanish](https://aarongustafson.github.io/form-required-checkboxes/demo/#spanish-messages) and [French](https://aarongustafson.github.io/form-required-checkboxes/demo/#french-messages) examples
- [Unpkg.com demo](https://aarongustafson.github.io/form-required-checkboxes/demo/unpkg.html) ([Source](./demo/unpkg.html))
- [ESM.sh demo](https://aarongustafson.github.io/form-required-checkboxes/demo/esm.html) ([Source](./demo/esm.html))

## Installation and usage

```bash
npm install @aarongustafson/form-required-checkboxes
```

Import the guarded definition helper to register `form-required-checkboxes`
when `customElements` is available:

```javascript
import '@aarongustafson/form-required-checkboxes/define.js';
```

Wrap the checkbox group, not the whole form. This example requires exactly
two skills. Keep the limit in the legend so people can follow it before
the component loads.

```html
<form>
	<form-required-checkboxes required="2">
		<fieldset>
			<legend>Choose your top 2 skills</legend>
			<label>
				<input type="checkbox" name="skills[]" value="js" />
				JavaScript
			</label>
			<label>
				<input type="checkbox" name="skills[]" value="py" />
				Python
			</label>
			<label>
				<input type="checkbox" name="skills[]" value="rust" />
				Rust
			</label>
		</fieldset>
	</form-required-checkboxes>
	<button type="submit">Submit</button>
	<button type="reset">Reset</button>
</form>
```

For a direct browser import, use a module script:

```html
<script
	src="./node_modules/@aarongustafson/form-required-checkboxes/define.js"
	type="module"
></script>
```

Or use the [unpkg demo](./demo/unpkg.html) import:

```html
<script
	src="https://unpkg.com/@aarongustafson/form-required-checkboxes@latest/define.js"
	type="module"
></script>
```

### Manual registration

The package’s main export and `form-required-checkboxes.js` export the class
without registering it. Define it once with the default name or your own name:

```javascript
import { FormRequiredCheckboxesElement } from '@aarongustafson/form-required-checkboxes';

customElements.define(
	'form-required-checkboxes',
	FormRequiredCheckboxesElement,
);
```

Importing `define.js` registers the default name automatically. It also exports
`defineFormRequiredCheckboxes()`, which you can call again safely. The package
includes [TypeScript declarations](./form-required-checkboxes.d.ts).

## Behavior and validation

Native HTML `required` makes an individual checkbox required; it can’t enforce
an exact count or range across a group. Don’t put it on every checkbox unless
each one must be checked.

When the component connects, it reads its configuration and collects its
checkboxes. It adds a `small` notice after the legend and includes both the
legend and notice in the fieldset’s accessible name through `aria-labelledby`.
Generated notice and legend IDs are unique. Existing authored naming references
are preserved.

The component counts selections on `submit` and `formdata`. If the count is
outside the limits, it prevents the event’s default action and sets a custom
validity error on the first checkbox. For native submission, the browser can
show that error and focus the checkbox. Other invalid fields can prevent
submission before the group’s handler runs; the component doesn’t promise a
validation order for an entire form.

Changing any checkbox clears the group’s custom validity. A successful native
reset also clears errors owned by this component after the browser restores
checkbox values. Canceling reset preserves selections and errors. Reset does
not move focus or announce a separate message.

### Author responsibilities and lifecycle

- Supply at least one named checkbox, a `fieldset`, a `legend`, labels, and a
  nonnegative safe-integer count or ascending range. Missing or malformed
  configuration is logged. Initial failure leaves native controls usable;
  failed updates retain the last valid enhancement. Correct it and call
  `refresh()` to recover from initial failure.
- Keep each group’s checkboxes under the component, with the same `name` and
  native form owner. Native `form` attributes are respected.
- Attributes and matching properties update an enhanced instance immediately,
  preserving checkbox nodes, selections, focus, and its existing notice.
  Call `refresh()` after changing checkbox structure, inherited language,
  shared JSON, or registered translations; these aren’t globally observed.
- If your script resets the form or changes selections while the checkboxes
  or a containing fieldset are disabled, call the component’s `refresh()` after
  re-enabling them and before checking validity or submitting.
- Keep useful selection instructions visible without JavaScript. Native
  checkbox behavior remains available if registration fails; count validation
  does not.
- Validate submitted values on the server. Client-side validation isn’t a
  security boundary, and preventing `formdata` doesn’t cancel construction of
  a `FormData` object.

Disconnecting cancels queued initialization and reset work, removes listeners
and generated notices/IDs, restores authored naming references when still
component-owned, and clears component-owned validity when its message is
readable. For disabled checkboxes, cleanup waits until they’re re-enabled and
the component is refreshed or reconnected. It preserves native
controls and checked values. Reconnecting enhances the existing controls once,
without duplicating notices or listeners.

## Attributes and properties

String properties reflect their authored attributes, not resolved messages.
Unset configuration strings return `null`; `lang` returns the native-compatible
empty string when absent. Nullish assignments remove configuration attributes.
Properties assigned before definition are replayed through their setters.

| Attribute/property                 | Values and behavior                                                                                                              | Default                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `required`                         | A count such as `"3"` means exactly 3; `"2-4"` means 2 through 4; `"0-3"` allows 0 through 3. This is a string, not a Boolean.   | Required; no default                                       |
| `notice-message` / `noticeMessage` | Complete notice template using `{n}`, `{min}`, and `{max}`. Updates in place.                                                    | [Message precedence](#author-complete-phrases)             |
| `error-message` / `errorMessage`   | Complete native validation-error template using the same tokens. Updates an existing component-owned error without moving focus. | [Message precedence](#author-complete-phrases)             |
| `notice`                           | **Deprecated.** Literal notice override; use `notice-message` / `noticeMessage` or shared JSON messages instead.                 | Generated from the limits and language                     |
| `error`                            | **Deprecated.** Literal validation-error override; use `error-message` / `errorMessage` or shared JSON messages instead.         | Generated from the limits and language                     |
| `lang`                             | Language code such as `"en"`, `"es"`, or `"fr"`.                                                                                 | Nearest ancestor language, document language, then English |

Empty legacy `notice` and `error` attributes use fallback messages. New
`*-message` templates must be nonempty and contain only supported tokens.
Invalid updates log an error and retain the working configuration.

## State and refresh

| Member               | Contract                                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enhanced`           | Read-only Boolean; false before setup and after disconnection.                                                                                                                         |
| `checkedCount`       | Read-only current checked count among managed checkboxes, including disabled ones; zero when not enhanced.                                                                             |
| `valid`              | Read-only count-constraint validity, or `null` when not enhanced. This does not replace native field/form validity.                                                                    |
| `refresh(): boolean` | Reread controls, language, and messages in place. True on success; false when disconnected or invalid. Errors are logged, and a working enhancement is retained after invalid updates. |

Use the native controls for values and form submission. Programmatic
`.checked` assignments are visible to state getters immediately, but don’t
manufacture events. Call `refresh()` to synchronize dependent configuration
and explicitly notify integrations of a changed outcome.

## Change event

`form-required-checkboxes:change` bubbles, crosses shadow boundaries, and isn’t
cancelable. It fires after a changed outcome from a checkbox `change`,
successful reset, or explicit `refresh()`, not initial setup, setters, canceled
resets, or equivalent outcomes.

Its frozen `detail` contains `checkedCount`, `minimum`, `maximum`, `valid`,
and `source` (`"change"`, `"reset"`, or `"refresh"`). It exposes no selected
values. It describes the count rule, not whole-form validity or completion of
assistive-technology announcements.

```javascript
const group = document.querySelector('form-required-checkboxes');
group.addEventListener('form-required-checkboxes:change', ({ detail }) => {
	console.log(detail.checkedCount, detail.valid, detail.source);
});
```

## Localization

### Author complete phrases

Use `notice-message` and `error-message` for one group:

```html
<form-required-checkboxes
	required="2-4"
	notice-message="De {min} à {max}, choisissez vos compétences."
	error-message="Choisissez entre {min} et {max} compétences."
>
	<!-- Authored, labeled native checkboxes -->
</form-required-checkboxes>
```

Tokens are replaced once as literal text, never HTML. `{min}` and `{max}` are
the bounds; `{n}` is the maximum, including for an exact count. Numbers use
the nearest authored language, including across shadow hosts. An explicit empty
`lang` stops inheritance and uses English. Malformed formatting locales are
logged and use English number formatting.

The `notice` and `error` attributes and properties are **deprecated and will be
removed in a future major release**. They remain supported as literal overrides
in this release and don’t interpolate tokens. Move per-group strings to
`notice-message` / `noticeMessage` and `error-message` / `errorMessage`, or use
[shared JSON messages](#share-messages-across-groups) for page-wide defaults.
Remove the legacy overrides when migrating to shared messages: they take
precedence over page defaults.

For each message, precedence is:

1. New instance `*-message` template.
2. Nonempty legacy instance override.
3. Shared page message for that rule.
4. Registered language key.
5. Built-in language key, then English.

### Share messages across groups

Use one inline JSON script per document. A message can be a string for every
rule or a partial object with `exact`, `max`, and `range` templates:

```html
<script type="application/json" data-form-required-checkboxes-config>
	{
		"notice-message": {
			"exact": "Choose {n} skills.",
			"range": "Choose between {min} and {max} skills."
		},
		"error-message": "Please choose {min} through {max} skills."
	}
</script>
```

Resolve missing rules independently through the fallback chain. The script
is language-neutral authored text, not an automatic translation catalog.
Translate it alongside the page; instance overrides can localize particular
groups. Duplicate/external scripts, unknown keys/rules/tokens, empty strings,
and invalid JSON are reported without replacing a working configuration.
Edits apply on `refresh()` or the next successful configuration update. No
global mutation observer or named scopes are added.

### Deprecated built-in translations

**Built-in language catalogs and `registerTranslations()` are deprecated, not
removed in this release.** Existing localized pages continue to work without
runtime deprecation warnings. New integrations should author instance/shared
messages so the application owns its wording and translations. Catalog removal
is reserved for a future major release.

Existing built-in languages remain `en`, `zh`, `hi`, `es`, `fr`, `ar`, `bn`,
`pt`, `ru`, `ja`, `de`, `pa`, `jv`, `ko`, `vi`, and `it`. Regional codes fall
back through parent languages to English, merging each message key. The
[translation source](./translations.js) is still shipped.

`FormRequiredCheckboxesElement.registerTranslations()` now validates and merges
partial language sets per key instead of erasing unrelated templates. Invalid
registration throws without replacing prior sets. Refresh connected instances
after registration.

| Key           | Used for                        | Placeholders     |
| ------------- | ------------------------------- | ---------------- |
| `exact`       | Exact-count notice              | `{n}`            |
| `max`         | Optional-maximum notice         | `{n}` (maximum)  |
| `range`       | Range notice                    | `{min}`, `{max}` |
| `error_exact` | Exact-count error               | `{n}`            |
| `error_range` | Range or optional-maximum error | `{min}`, `{max}` |

```javascript
import { FormRequiredCheckboxesElement } from '@aarongustafson/form-required-checkboxes';

FormRequiredCheckboxesElement.registerTranslations({
	en: { exact: 'Pick exactly {n} skills' },
});

document.querySelector('form-required-checkboxes')?.refresh();
```

## Styling and accessibility

The component adds no stylesheet, shadow root, CSS custom properties, or parts.
Style the native fieldset, legend, labels, and checkboxes in your application.
You can target the generated notice with `form-required-checkboxes small`.
Keep its text readable on its background and preserve native keyboard focus.

Selection limits and errors need text, not just color. The component uses the
browser’s validation UI rather than adding a persistent inline error. If your
application needs visible errors that remain alongside the group, provide
that presentation and its programmatic association. The demos show a persistent
status after valid submission without sending data.

## Browser support and testing limits

The component requires Custom Elements v1 and JavaScript modules. Local browser
tests cover bundled Chromium, Firefox, and WebKit: keyboard use, native
validation, localized notices, narrow-screen reflow, and module-failure and
no-JavaScript fallbacks. Automated checks don’t establish assistive-technology
support or accessibility conformance.

Native validation-tooltip contrast, actual Windows Contrast themes, Firefox
forced-color preferences, shipping mobile browsers, and assistive technology
remain manual checks. Ubuntu WebKit’s known dark `ButtonText`/`ButtonFace`
contrast limitation is an isolated expected failure, not a passing result.

## Development

```bash
# Lint JavaScript, declarations, HTML, CSS, Markdown, JSON, and workflows
npm run lint

# Run unit tests once (npm test starts watch mode)
npm run test:run
npm run test:coverage
npm run test:types

# Install browser engines once, then run the browser tests
npx playwright install chromium firefox webkit
npm run test:browser

# Format files
npm run format

# Local no-cache demo preview
PORT=3013 node scripts/serve.js
```

## License

[MIT](./LICENSE)
