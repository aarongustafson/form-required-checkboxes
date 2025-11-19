import { beforeAll } from 'vitest';
import { FormRequiredCheckboxesElement } from '../form-required-checkboxes.js';

// Define the custom element before tests run
beforeAll(() => {
	if (!customElements.get('form-required-checkboxes')) {
		customElements.define(
			'form-required-checkboxes',
			FormRequiredCheckboxesElement,
		);
	}

	// Make the class available globally for testing
	globalThis.FormRequiredCheckboxesElement = FormRequiredCheckboxesElement;
});
