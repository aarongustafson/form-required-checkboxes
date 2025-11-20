# Required Checkboxes Web Component

Currently, we can only make checkboxes required or not, individually. In some cases you need to be able to set a specific number of checkboxes that need to be checked. The `form-required-checkboxes` web component enables that.

## Installation

```bash
npm install @aarongustafson/form-required-checkboxes
```

## Usage

### Option 1: Auto-define the custom element (easiest)

Import the package to automatically define the `<form-required-checkboxes>` custom element:

```javascript
import '@aarongustafson/form-required-checkboxes';
```

Or use the define-only script in HTML:

```html
<script src="./node_modules/@aarongustafson/form-required-checkboxes/define.js" type="module"></script>
```

### Option 2: Import the class and define manually

Import the class and define the custom element with your preferred tag name:

```javascript
import { FormRequiredCheckboxesElement } from '@aarongustafson/form-required-checkboxes/form-required-checkboxes.js';

// Define with default name
customElements.define('form-required-checkboxes', FormRequiredCheckboxesElement);

// Or define with a custom name
customElements.define('my-checkbox-group', FormRequiredCheckboxesElement);
```

### Option 3: Import everything (class + auto-define)

Get both the class export and automatic element definition:

```javascript
import { FormRequiredCheckboxesElement } from '@aarongustafson/form-required-checkboxes';
// The custom element is now defined AND you have access to the class
```

### CDN Usage

You can also use the component directly from a CDN:

```html
<script src="https://unpkg.com/@aarongustafson/form-required-checkboxes/define.js" type="module"></script>
```

## API

<ul>
  <li><code>required</code> - Represents the range of required values.
  <ul>
    <li>Single number (e.g., 3) requires exactly that number of choices.</li>
    <li>Range (e.g., 3-5) requires a minimum of the first number and a max of the second number be chosen.</li>
    <li>Max (e.g., 0-3) requires a minimum of zero and a max of the second number to be chosen.</li>
    </ul>
  </li>
  <li><code>notice</code> (optional) - The description that explains details of the required value in plain language. If you don't supply one, the component will create one for you. This description will be added as a <code>small</code> element within the component (as a sibling to the fieldset)</li>
  <li><code>error</code> (optional) - The validation error you'd like to show when the validation criteria is not met.</li>
</ul>

## Markup Assumptions

This web component assumes you will be marking up your checkbox group in a `fieldset` with a `legend` and that all of the checkboxes share a `name` (e.g., "foo[]").

## Examples

### Basic Usage - Exact Number Required

```html
<form>
  <form-required-checkboxes required="3">
    <fieldset>
      <legend>Choose your top 3 preferences</legend>
      <label><input type="checkbox" name="preferences[]" value="1"> Option 1</label>
      <label><input type="checkbox" name="preferences[]" value="2"> Option 2</label>
      <label><input type="checkbox" name="preferences[]" value="3"> Option 3</label>
      <label><input type="checkbox" name="preferences[]" value="4"> Option 4</label>
      <label><input type="checkbox" name="preferences[]" value="5"> Option 5</label>
    </fieldset>
  </form-required-checkboxes>
  
  <button type="submit">Submit</button>
</form>
```

### Range of Required Checkboxes

```html
<form-required-checkboxes required="2-4">
  <fieldset>
    <legend>Choose 2-4 items</legend>
    <label><input type="checkbox" name="items[]" value="a"> Item A</label>
    <label><input type="checkbox" name="items[]" value="b"> Item B</label>
    <label><input type="checkbox" name="items[]" value="c"> Item C</label>
    <label><input type="checkbox" name="items[]" value="d"> Item D</label>
    <label><input type="checkbox" name="items[]" value="e"> Item E</label>
  </fieldset>
</form-required-checkboxes>
```

### Optional Maximum (0-N)

```html
<form-required-checkboxes required="0-3">
  <fieldset>
    <legend>Choose up to 3 options (optional)</legend>
    <label><input type="checkbox" name="options[]" value="x"> Option X</label>
    <label><input type="checkbox" name="options[]" value="y"> Option Y</label>
    <label><input type="checkbox" name="options[]" value="z"> Option Z</label>
  </fieldset>
</form-required-checkboxes>
```

### Custom Notice and Error Messages

```html
<form-required-checkboxes 
  required="3" 
  notice="You must select exactly 3 skills" 
  error="Please select exactly 3 skills to continue">
  <fieldset>
    <legend>Select your top 3 skills</legend>
    <label><input type="checkbox" name="skills[]" value="js"> JavaScript</label>
    <label><input type="checkbox" name="skills[]" value="py"> Python</label>
    <label><input type="checkbox" name="skills[]" value="java"> Java</label>
    <label><input type="checkbox" name="skills[]" value="go"> Go</label>
    <label><input type="checkbox" name="skills[]" value="rust"> Rust</label>
  </fieldset>
</form-required-checkboxes>
```

## Demo

[Live Demo](https://aarongustafson.github.io/form-required-checkboxes/demo.html) ([Source](./demo.html))

## Browser Support

This web component works in all modern browsers that support:
- Custom Elements v1
- ES Modules (for module usage)

For older browsers, you may need polyfills for Custom Elements.

## Development

### Testing

```bash
# Run tests
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```
