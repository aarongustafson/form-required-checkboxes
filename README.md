# Required Checkboxes Web Component

Currently, we can only make checkboxes required or not, individually. In some cases you need to be able to set a specific number of checkboxes that need to be checked. The `form-required-checkboxes` web component enables that.

## API

<ul>
  <li><code>required</code> - Represents the range of required values.
  <ul>
    <li>Single number (e.g., 3) requires exactly that number of choices.</li>
    <li>Range (e.g., 3-5) requires a minimum of the first number and a max of the second number be chosen.</li>
    <li>Max (e.g., 0-3) requires a minimum of zero and a max of the second number to be chosen.</li>
    </ul>
  </li>
  <li><code>notice</code> (optional) - The description that explains details of the required value in plan language. If you don’t supply one, the component will create one for you. This description will be added as a `small` element within the component (as a sibling to the fieldset)</li>
  <li><code>error</code> (optional) - The validation error you’d like to show when the validation criteria is not met.</li>
</ul>

## Markup Assumptions

This web component assumes you will be marking up your checkbox group in a `fieldset` with a `legend` and that all of the checkboxes share a `name` (e.g., "foo[]").

## Demo

[Live Demo](https://aarongustafson.github.io/form-required-checkboxes/demo.html) ([Source](./demo.html))
