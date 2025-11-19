import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FormRequiredCheckboxesElement } from '../form-required-checkboxes.js';

describe('FormRequiredCheckboxesElement', () => {
	let container;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
	});

	afterEach(() => {
		container.remove();
	});

	it('should be defined as a custom element', () => {
		expect(customElements.get('form-required-checkboxes')).toBe(
			FormRequiredCheckboxesElement,
		);
	});

	it('should create an instance', () => {
		const element = document.createElement('form-required-checkboxes');
		expect(element).toBeInstanceOf(FormRequiredCheckboxesElement);
	});

	it('should throw error when required attribute is missing', () => {
		const element = document.createElement('form-required-checkboxes');

		// Should throw error when required attribute is missing or empty
		expect(() => element.__getMinMax()).toThrow(
			'You must specify a `required` number of checkbox choices',
		);
	});

	it('should parse single number requirement', () => {
		const element = document.createElement('form-required-checkboxes');
		element.setAttribute('required', '2');

		element.__getMinMax();

		expect(element.__min).toBe('2');
		expect(element.__max).toBe('2');
	});

	it('should parse range requirement', () => {
		const element = document.createElement('form-required-checkboxes');
		element.setAttribute('required', '1-3');

		element.__getMinMax();

		expect(element.__min).toBe('1');
		expect(element.__max).toBe('3');
	});

	it('should handle zero minimum in range', () => {
		const element = document.createElement('form-required-checkboxes');
		element.setAttribute('required', '0-5');

		element.__getMinMax();

		expect(element.__min).toBe('0');
		expect(element.__max).toBe('5');
	});
});
