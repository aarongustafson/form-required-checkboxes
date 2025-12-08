import { FormRequiredCheckboxesElement } from './form-required-checkboxes.js';

export function defineFormRequiredCheckboxes(
	tagName = 'form-required-checkboxes',
) {
	const hasWindow = typeof window !== 'undefined';
	const registry = hasWindow ? window.customElements : undefined;

	if (!registry || typeof registry.define !== 'function') {
		return false;
	}

	if (!registry.get(tagName)) {
		registry.define(tagName, FormRequiredCheckboxesElement);
	}

	return true;
}

defineFormRequiredCheckboxes();
