// Type definitions for form-required-checkboxes web component
// Project: form-required-checkboxes
// Definitions by: Aaron Gustafson

export class FormRequiredCheckboxesElement extends HTMLElement {
	/**
	 * The notice message for the group.
	 */
	notice: string | null;
	/**
	 * The error message for the group.
	 */
	error: string | null;
	/**
	 * The required number or range of checkboxes.
	 */
	required: string | null;
	/**
	 * The language code for translations.
	 */
	lang: string;
}

declare global {
	interface HTMLElementTagNameMap {
		'form-required-checkboxes': FormRequiredCheckboxesElement;
	}
}
