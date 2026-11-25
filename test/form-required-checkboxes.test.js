import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FormRequiredCheckboxesElement } from '../form-required-checkboxes.js';

describe('FormRequiredCheckboxesElement', () => {
	let container;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
	});

	describe('authored messages, state, and lifecycle', () => {
		let container;
		let translations;

		beforeEach(() => {
			translations = FormRequiredCheckboxesElement.customTranslations;
			FormRequiredCheckboxesElement.customTranslations = {};
			container = document.createElement('div');
			document.body.append(container);
		});

		afterEach(() => {
			container.remove();
			FormRequiredCheckboxesElement.customTranslations = translations;
			vi.restoreAllMocks();
		});

		async function group(attributes = 'required="1-2"') {
			container.innerHTML += `<form>
				<form-required-checkboxes ${attributes}>
					<fieldset aria-labelledby="authored-name">
						<legend id="authored-name">Choose skills</legend>
						<label><input type="checkbox" name="skills[]" value="js" checked>JavaScript</label>
						<label><input type="checkbox" name="skills[]" value="css">CSS</label>
						<label><input type="checkbox" name="skills[]" value="html">HTML</label>
					</fieldset>
				</form-required-checkboxes>
			</form>`;
			await new Promise((resolve) => setTimeout(resolve, 20));
			return container.querySelector('form-required-checkboxes');
		}

		it('merges shared templates per rule and gives instance messages precedence', async () => {
			container.innerHTML = `<script type="application/json" data-form-required-checkboxes-config>
				{"notice-message":{"range":"De {min} à {max}, choisissez."},"error-message":"Entre {min} et {max}, s’il vous plaît."}
			</script>`;
			const element = await group();
			const notice = element.querySelector('small');
			expect(notice.textContent).toBe('De 1 à 2, choisissez.');
			const checkbox = element.querySelector('input');
			checkbox.focus();
			element.noticeMessage = 'Maximum {max}; minimum {min}.';
			expect(element.getAttribute('notice-message')).toBe(
				'Maximum {max}; minimum {min}.',
			);
			expect(element.querySelector('small')).toBe(notice);
			expect(notice.textContent).toBe('Maximum 2; minimum 1.');
			expect(document.activeElement).toBe(checkbox);
			expect(checkbox.checked).toBe(true);
			element.noticeMessage = null;
			expect(notice.textContent).toBe('De 1 à 2, choisissez.');
			element.required = '0';
			expect(notice.textContent).toBe('Choose 0 from the list');
		});

		it('keeps bundled languages and partially registered translations working', async () => {
			FormRequiredCheckboxesElement.registerTranslations({
				fr: { exact: 'Exactement {n} choix.' },
			});
			const element = await group('required="1" lang="fr"');
			expect(element.querySelector('small').textContent).toBe(
				'Exactement 1 choix.',
			);
			element.required = '1-2';
			expect(element.querySelector('small').textContent).toBe(
				'Choisissez entre 1 et 2 de la liste',
			);
			expect(element.lang).toBe('fr');
			element.removeAttribute('lang');
			expect(element.lang).toBe('');
		});

		it('exposes current state and deduplicated frozen change outcomes without checkbox values', async () => {
			const element = await group();
			expect(element.enhanced).toBe(true);
			expect(element.checkedCount).toBe(1);
			expect(element.valid).toBe(true);
			const outcomes = [];
			element.addEventListener(
				'form-required-checkboxes:change',
				(event) => outcomes.push(event),
			);
			const checkbox = element.querySelector('input');
			checkbox.checked = false;
			checkbox.dispatchEvent(new Event('change', { bubbles: true }));
			checkbox.dispatchEvent(new Event('change', { bubbles: true }));
			expect(outcomes).toHaveLength(1);
			expect(outcomes[0].bubbles).toBe(true);
			expect(outcomes[0].composed).toBe(true);
			expect(outcomes[0].cancelable).toBe(false);
			expect(outcomes[0].detail).toEqual({
				checkedCount: 0,
				minimum: 1,
				maximum: 2,
				valid: false,
				source: 'change',
			});
			expect(Object.isFrozen(outcomes[0].detail)).toBe(true);
			element.required = '0-2';
			expect(element.valid).toBe(true);
			expect(outcomes).toHaveLength(1);
			checkbox.checked = true;
			expect(element.refresh()).toBe(true);
			expect(outcomes.at(-1).detail.source).toBe('refresh');
		});

		it('logs invalid configuration and retains the last valid enhancement', async () => {
			const element = await group();
			const notice = element.querySelector('small');
			const previous = notice.textContent;
			const error = vi
				.spyOn(console, 'error')
				.mockImplementation(() => {});
			element.noticeMessage = '<img src=x>{unknown}';
			expect(error).toHaveBeenCalled();
			expect(notice.textContent).toBe(previous);
			element.noticeMessage = 'Literal <img src=x>; choose {min}–{max}.';
			expect(notice.querySelector('img')).toBeNull();
			expect(notice.textContent).toContain('<img src=x>');
			element.required = '3-1';
			expect(element.refresh()).toBe(false);
			expect(element.enhanced).toBe(true);
			expect(element.valid).toBe(true);
		});

		it('restores authored associations and avoids duplicated notices on reconnect', async () => {
			const element = await group();
			const fieldset = element.querySelector('fieldset');
			const input = element.querySelector('input');
			element.remove();
			expect(fieldset.getAttribute('aria-labelledby')).toBe(
				'authored-name',
			);
			expect(element.querySelector('small')).toBeNull();
			expect(element.enhanced).toBe(false);
			expect(element.refresh()).toBe(false);
			container.querySelector('form').append(element);
			await new Promise((resolve) => setTimeout(resolve, 20));
			expect(element.querySelectorAll('small')).toHaveLength(1);
			expect(element.querySelector('input')).toBe(input);
			expect(input.checked).toBe(true);
		});

		it('does not initialize after removal before the scheduled frame', async () => {
			const element = document.createElement('form-required-checkboxes');
			element.required = '1';
			element.innerHTML = '<input type="checkbox" name="choice">';
			container.append(element);
			element.remove();
			await new Promise((resolve) => setTimeout(resolve, 20));
			expect(element.querySelector('small')).toBeNull();
			expect(element.enhanced).toBe(false);
		});

		it('shares defaults without coupling instance overrides or generated IDs', async () => {
			container.innerHTML = `<script type="application/json" data-form-required-checkboxes-config>
				{"notice-message":"Choose {min} through {max}."}
			</script>`;
			const first = await group();
			const second = document.createElement('form-required-checkboxes');
			second.required = '0-2';
			second.noticeMessage = 'At most {max}.';
			second.innerHTML =
				'<fieldset><legend>Other skills</legend><input type="checkbox" name="skills[]" value="one"></fieldset>';
			container.append(second);
			expect(second.refresh()).toBe(true);
			expect(first.querySelector('small').textContent).toBe(
				'Choose 1 through 2.',
			);
			expect(second.querySelector('small').textContent).toBe(
				'At most 2.',
			);
			expect(first.querySelector('small').id).not.toBe(
				second.querySelector('small').id,
			);
			container.querySelector('script').textContent =
				'{"notice-message":"Limits: {min}–{max}."}';
			expect(first.refresh()).toBe(true);
			expect(first.querySelector('small').textContent).toBe(
				'Limits: 1–2.',
			);
			expect(second.refresh()).toBe(true);
			expect(second.querySelector('small').textContent).toBe(
				'At most 2.',
			);
		});

		it('retains the last good shared messages after invalid JSON and supports recovery', async () => {
			container.innerHTML =
				'<script type="application/json" data-form-required-checkboxes-config>{"notice-message":"Choose {min}–{max}."}</script>';
			const element = await group();
			const notice = element.querySelector('small');
			const script = container.querySelector('script');
			const error = vi
				.spyOn(console, 'error')
				.mockImplementation(() => {});
			for (const text of [
				'{',
				'{"unexpected":"No"}',
				'{"notice-message":{"other":"No"}}',
				'{"notice-message":""}',
			]) {
				script.textContent = text;
				expect(element.refresh()).toBe(false);
				expect(notice.textContent).toBe('Choose 1–2.');
			}
			expect(error).toHaveBeenCalledTimes(4);
			script.textContent = '{"notice-message":"From {min} to {max}."}';
			expect(element.refresh()).toBe(true);
			expect(notice.textContent).toBe('From 1 to 2.');
		});

		it('replays pre-definition properties without shadowing accessors', async () => {
			const element = document.createElement('late-checkbox-messages');
			element.required = '1';
			element.noticeMessage = 'Select {n}.';
			element.innerHTML =
				'<fieldset><legend>Skills</legend><input type="checkbox" name="late"></fieldset>';
			container.append(element);
			customElements.define(
				'late-checkbox-messages',
				class extends FormRequiredCheckboxesElement {},
			);
			await new Promise((resolve) => setTimeout(resolve, 20));
			expect(Object.hasOwn(element, 'noticeMessage')).toBe(false);
			expect(element.querySelector('small').textContent).toBe(
				'Select 1.',
			);
			element.noticeMessage = 'One: {n}.';
			expect(element.querySelector('small').textContent).toBe('One: 1.');
		});

		it('does not let an unowned group block unrelated form submissions', async () => {
			const element = document.createElement('form-required-checkboxes');
			element.required = '2';
			element.innerHTML =
				'<input type="checkbox" name="unowned"><input type="checkbox" name="unowned">';
			container.append(element);
			await new Promise((resolve) => setTimeout(resolve, 20));
			const form = document.createElement('form');
			container.append(form);
			const submit = new Event('submit', {
				bubbles: true,
				cancelable: true,
			});
			form.dispatchEvent(submit);
			expect(submit.defaultPrevented).toBe(false);
		});
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
