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

	it('should use default English translations', () => {
		const element = document.createElement('form-required-checkboxes');
		element.setAttribute('required', '2');
		element.__lang = 'en';
		element.__min = '2';
		element.__max = '2';

		const translations = element.__getTranslations();

		expect(translations.exact).toBe('Choose {n} from the list');
		expect(translations.error_exact).toBe(
			'You must choose exactly {n} options',
		);
	});

	it('should use Spanish translations when lang is es', () => {
		const element = document.createElement('form-required-checkboxes');
		element.setAttribute('required', '3');
		element.__lang = 'es';
		element.__min = '3';
		element.__max = '3';

		const translations = element.__getTranslations();

		expect(translations.exact).toBe('Elija {n} de la lista');
		expect(translations.error_exact).toBe(
			'Debe elegir exactamente {n} opciones',
		);
	});

	it('should interpolate values in translation strings', () => {
		const result = FormRequiredCheckboxesElement.__interpolate(
			'Choose {n} from the list',
			{ n: 3 },
		);
		expect(result).toBe('Choose 3 from the list');

		const rangeResult = FormRequiredCheckboxesElement.__interpolate(
			'Choose between {min} and {max}',
			{ min: 2, max: 5 },
		);
		expect(rangeResult).toBe('Choose between 2 and 5');
	});

	it('should allow custom translations to be registered', () => {
		FormRequiredCheckboxesElement.registerTranslations({
			pt: {
				exact: 'Escolha {n} da lista',
				error_exact: 'Você deve escolher exatamente {n} opções',
			},
		});

		const element = document.createElement('form-required-checkboxes');
		element.setAttribute('required', '2');
		element.__lang = 'pt';
		element.__min = '2';
		element.__max = '2';

		const translations = element.__getTranslations();

		expect(translations.exact).toBe('Escolha {n} da lista');
		expect(translations.error_exact).toBe(
			'Você deve escolher exatamente {n} opções',
		);
	});
});
