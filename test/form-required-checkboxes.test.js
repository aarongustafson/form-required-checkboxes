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

	describe('No form element', () => {
		it('should attach event listeners to document.body when not in a form', async () => {
			container.innerHTML = `
				<form-required-checkboxes required="2">
					<fieldset>
						<legend>Select options</legend>
						<label><input type="checkbox" name="test[]" value="1"> Option 1</label>
						<label><input type="checkbox" name="test[]" value="2"> Option 2</label>
						<label><input type="checkbox" name="test[]" value="3"> Option 3</label>
					</fieldset>
				</form-required-checkboxes>
			`;

			await new Promise((resolve) => setTimeout(resolve, 10));

			const element = container.querySelector('form-required-checkboxes');
			expect(element.__$form).toBeNull();
			expect(element.__$target).toBe(document.body);
		});

		it('should validate and prevent submission when not in a form', async () => {
			container.innerHTML = `
				<form-required-checkboxes required="2">
					<fieldset>
						<legend>Select options</legend>
						<label><input type="checkbox" name="test[]" value="1"> Option 1</label>
						<label><input type="checkbox" name="test[]" value="2"> Option 2</label>
						<label><input type="checkbox" name="test[]" value="3"> Option 3</label>
					</fieldset>
				</form-required-checkboxes>
			`;

			await new Promise((resolve) => setTimeout(resolve, 10));

			const element = container.querySelector('form-required-checkboxes');
			const checkboxes = container.querySelectorAll(
				'input[type="checkbox"]',
			);

			// Create and dispatch submit event on document.body
			const submitEvent = new Event('submit', {
				bubbles: true,
				cancelable: true,
			});
			let prevented = false;
			submitEvent.preventDefault = () => {
				prevented = true;
			};

			document.body.dispatchEvent(submitEvent);

			expect(prevented).toBe(true);
			expect(checkboxes[0].validationMessage).toBeTruthy();
		});

		it('should reset validity when checkboxes change and not in a form', async () => {
			container.innerHTML = `
				<form-required-checkboxes required="2">
					<fieldset>
						<legend>Select options</legend>
						<label><input type="checkbox" name="test[]" value="1"> Option 1</label>
						<label><input type="checkbox" name="test[]" value="2"> Option 2</label>
						<label><input type="checkbox" name="test[]" value="3"> Option 3</label>
					</fieldset>
				</form-required-checkboxes>
			`;

			await new Promise((resolve) => setTimeout(resolve, 10));

			const element = container.querySelector('form-required-checkboxes');
			const checkboxes = container.querySelectorAll(
				'input[type="checkbox"]',
			);

			// Set invalid state
			checkboxes[0].setCustomValidity('Error');
			expect(checkboxes[0].validationMessage).toBeTruthy();

			// Trigger change event
			checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

			expect(checkboxes[0].validationMessage).toBe('');
		});

		it('should always show field error when not in a form', async () => {
			container.innerHTML = `
				<form-required-checkboxes required="2">
					<fieldset>
						<legend>Select options</legend>
						<label><input type="checkbox" name="test[]" value="1"> Option 1</label>
					</fieldset>
				</form-required-checkboxes>
			`;

			await new Promise((resolve) => setTimeout(resolve, 10));

			const element = container.querySelector('form-required-checkboxes');
			const checkbox = container.querySelector('input[type="checkbox"]');

			expect(element.__shouldShowFieldError(checkbox)).toBe(true);
		});
	});

	describe('Property reflection and lifecycle', () => {
		it('should reflect properties to attributes and vice versa', () => {
			const element = document.createElement('form-required-checkboxes');
			element.notice = 'Test Notice';
			element.error = 'Test Error';
			element.required = '2';
			element.lang = 'fr';
			expect(element.getAttribute('notice')).toBe('Test Notice');
			expect(element.getAttribute('error')).toBe('Test Error');
			expect(element.getAttribute('required')).toBe('2');
			expect(element.getAttribute('lang')).toBe('fr');

			element.setAttribute('notice', 'Attr Notice');
			element.setAttribute('error', 'Attr Error');
			element.setAttribute('required', '3');
			element.setAttribute('lang', 'es');
			expect(element.notice).toBe('Attr Notice');
			expect(element.error).toBe('Attr Error');
			expect(element.required).toBe('3');
			expect(element.lang).toBe('es');
		});

		it('should upgrade properties set before definition', () => {
			// Simulate property set before definition
			const element = document.createElement('form-required-checkboxes');
			element.notice = 'Predefined';
			element.error = 'Predefined';
			element.required = '5';
			element.lang = 'de';
			// Call _upgradeProperty for each
			element._upgradeProperty('notice');
			element._upgradeProperty('error');
			element._upgradeProperty('required');
			element._upgradeProperty('lang');
			expect(element.notice).toBe('Predefined');
			expect(element.error).toBe('Predefined');
			expect(element.required).toBe('5');
			expect(element.lang).toBe('de');
		});
	});

	describe('Event listener cleanup and reconnect', () => {
		it('should clean up event listeners on disconnect', async () => {
			container.innerHTML = `
				<form-required-checkboxes required="2">
					<fieldset>
						<legend>Select options</legend>
						<label><input type="checkbox" name="test[]" value="1"> Option 1</label>
						<label><input type="checkbox" name="test[]" value="2"> Option 2</label>
					</fieldset>
				</form-required-checkboxes>
			`;
			await new Promise((resolve) => setTimeout(resolve, 20));
			const element = container.querySelector('form-required-checkboxes');
			const target = element.__$target;
			const checkboxes = element.__$checkboxes;
			// Remove from DOM
			element.remove();
			// Try to fire events (should not throw)
			expect(() => {
				target.dispatchEvent(new Event('formdata'));
				target.dispatchEvent(new Event('submit'));
				checkboxes.forEach((input) => {
					input.dispatchEvent(new Event('change'));
				});
			}).not.toThrow();
		});

		it('should not duplicate event listeners on reconnect', async () => {
			container.innerHTML = `
				<form-required-checkboxes required="2">
					<fieldset>
						<legend>Select options</legend>
						<label><input type="checkbox" name="test[]" value="1"> Option 1</label>
						<label><input type="checkbox" name="test[]" value="2"> Option 2</label>
					</fieldset>
				</form-required-checkboxes>
			`;
			await new Promise((resolve) => setTimeout(resolve, 20));
			const element = container.querySelector('form-required-checkboxes');
			const target = element.__$target;
			const checkboxes = element.__$checkboxes;
			// Remove and re-add
			element.remove();
			container.appendChild(element);
			await new Promise((resolve) => setTimeout(resolve, 20));
			// Should still not throw or duplicate
			expect(() => {
				target.dispatchEvent(new Event('formdata'));
				target.dispatchEvent(new Event('submit'));
				checkboxes.forEach((input) => {
					input.dispatchEvent(new Event('change'));
				});
			}).not.toThrow();
		});
	});
});
