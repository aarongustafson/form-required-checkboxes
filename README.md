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
component. Always validate selections on the server too.

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
Use distinct group names on a page: the component derives notice and, when
needed, legend IDs from the first checkbox’s name.

The component counts selections on `submit` and `formdata`. If the count is
outside the limits, it prevents the event’s default action and sets a custom
validity error on the first checkbox. For native submission, the browser can
show that error and focus the checkbox. Other invalid fields can prevent
submission before the group’s handler runs; the component doesn’t promise a
validation order for an entire form.

Changing any checkbox clears the group’s custom validity. Native reset restores
checkbox values, but **does not clear an existing custom error**. After an
invalid attempt, change a checkbox before resubmitting, or have your application
explicitly clear validity with the native `setCustomValidity('')` API.

### Author responsibilities and lifecycle

- Supply at least one checkbox, a `fieldset`, a `legend`, labels, and a valid
  count or ascending range. A missing `required` value throws during setup;
  malformed limits aren’t validated as a separate configuration error.
- Keep each group’s checkboxes under the component and give them the same
  `name`. Keep the group inside its form for submission validation.
- Configure attributes, properties, and translations before connection.
  Reflected property changes update attributes, but the component doesn’t
  observe later changes or refresh its collected checkbox list.
- Keep useful selection instructions visible without JavaScript. Native
  checkbox behavior remains available if registration fails; count validation
  does not.
- Validate submitted values on the server. Client-side validation isn’t a
  security boundary, and preventing `formdata` doesn’t cancel construction of
  a `FormData` object.

Disconnecting removes the component’s form and checkbox event listeners.
It doesn’t remove its generated notice, restore `aria-labelledby`, or clear
custom validity. Initialization uses a queued animation frame that isn’t
canceled on disconnect; reconnecting can add another notice. Don’t rely on
disconnect/reconnect as a configuration refresh or cleanup mechanism.

## Attributes and properties

These properties reflect to attributes. Unset `required`, `notice`, and `error`
properties return `null`; the component’s `lang` getter also returns `null`
when the attribute is absent. Setting any of them to `null` or `undefined`
removes its attribute. Properties assigned before definition are reapplied
when the element connects.

| Attribute/property | Values and behavior                                                                                                            | Default                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `required`         | A count such as `"3"` means exactly 3; `"2-4"` means 2 through 4; `"0-3"` allows 0 through 3. This is a string, not a Boolean. | Required; no default                                       |
| `notice`           | Plain text explaining the selection limits. The component inserts it in a `small` element after the legend.                    | Generated from the limits and language                     |
| `error`            | Plain text for the first checkbox’s native validation message when the count is invalid.                                       | Generated from the limits and language                     |
| `lang`             | Language code such as `"en"`, `"es"`, or `"fr"`.                                                                               | Nearest ancestor language, document language, then English |

Empty `notice` and `error` attributes also use generated messages.

## Static methods and events

`FormRequiredCheckboxesElement.registerTranslations(translations)` registers
message sets by language code or replaces existing sets. Call it before
connecting instances that should use those messages.

The component dispatches no custom events and exposes no instance validation
command. Use native form and checkbox APIs; the component listens for
`submit`, `formdata`, and checkbox `change` events.

## Localization

Use `notice` and `error` to match an application’s vocabulary for one group,
or register a shared message set. Explicit, nonempty instance messages take
precedence over generated translations. See the
[custom-message demo](./demo/index.html#custom-messages).

Language selection uses the element’s `lang`, then its nearest ancestor’s
`lang`, then the document’s language, then `en`. Regional codes such as `es-MX`
use the base language (`es`); an unknown language falls back to English.

Built-in languages are `en`, `zh`, `hi`, `es`, `fr`, `ar`, `bn`, `pt`, `ru`,
`ja`, `de`, `pa`, `jv`, `ko`, `vi`, and `it`. The
[translation source](./translations.js) contains their messages.

### Register a complete message set

Registration replaces a language’s object rather than merging its individual
keys. Supply all five keys, even when you only want to change one message.
Later registration of the same language replaces the earlier set. Missing
templates can cause setup to fail.

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
	en: {
		exact: 'Pick exactly {n} skills',
		max: 'Pick up to {n} skills',
		range: 'Pick between {min} and {max} skills',
		error_exact: 'Please pick exactly {n} skills',
		error_range: 'Please pick between {min} and {max} skills',
	},
});

customElements.define(
	'form-required-checkboxes',
	FormRequiredCheckboxesElement,
);
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
