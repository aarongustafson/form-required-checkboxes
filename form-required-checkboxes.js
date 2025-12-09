import defaultTranslations from './translations.js';

export class FormRequiredCheckboxesElement extends HTMLElement {
	// Static property for custom translations
	static customTranslations = {};

	// Static method to register custom translations
	static registerTranslations(translations) {
		this.customTranslations = {
			...this.customTranslations,
			...translations,
		};
	}
	connectedCallback() {
		setTimeout(() => {
			this.__element_name = this.nodeName.toLowerCase();
			this.__$checkboxes = this.querySelectorAll("[type='checkbox']");
			this.__field_name = this.__$checkboxes[0].name;
			this.__notice = this.getAttribute('notice');
			this.__error = this.getAttribute('error');
			this.__$fieldset = this.querySelector('fieldset');
			this.__$legend = this.querySelector('legend');
			this.__lang =
				this.getAttribute('lang') ||
				this.closest('[lang]')?.getAttribute('lang') ||
				document.documentElement.lang ||
				'en';
			this.__getMinMax();
			this.__addDescription();
			this.__setupAccessibleName();
			this.__setupValidation();
		});
	}

	__getTranslations() {
		// Merge default and custom translations, with custom taking precedence
		const allTranslations = {
			...defaultTranslations,
			...FormRequiredCheckboxesElement.customTranslations,
		};

		// Get translations for current language, fallback to English
		const langCode = this.__lang.split('-')[0]; // e.g., 'en-US' -> 'en'
		return allTranslations[langCode] || allTranslations.en;
	}

	static __interpolate(template, values) {
		return template.replace(
			/\{(\w+)\}/g,
			(match, key) => values[key] || match,
		);
	}

	__getMinMax() {
		const required = this.getAttribute('required');
		if (!required) {
			throw new Error(
				'You must specify a `required` number of checkbox choices in a `form-required-checkboxes` element',
			);
		}
		if (required.indexOf('-') > 0) {
			[this.__min, this.__max] = required.split('-');
		} else {
			this.__min = required;
			this.__max = required;
		}
	}

	__addDescription() {
		this.__$description = document.createElement('small');
		this.__$description.id = `${this.__field_name.replace('[]', '')}-description`;

		if (!this.__notice) {
			const t = this.__getTranslations();

			if (this.__min == this.__max) {
				this.__notice = FormRequiredCheckboxesElement.__interpolate(
					t.exact,
					{ n: this.__min },
				);
			} else if (this.__min == 0) {
				this.__notice = FormRequiredCheckboxesElement.__interpolate(
					t.max,
					{ n: this.__max },
				);
			} else {
				this.__notice = FormRequiredCheckboxesElement.__interpolate(
					t.range,
					{
						min: this.__min,
						max: this.__max,
					},
				);
			}
		}

		if (!this.__error) {
			const t = this.__getTranslations();

			if (this.__min == this.__max) {
				this.__error = FormRequiredCheckboxesElement.__interpolate(
					t.error_exact,
					{ n: this.__min },
				);
			} else {
				this.__error = FormRequiredCheckboxesElement.__interpolate(
					t.error_range,
					{
						min: this.__min,
						max: this.__max,
					},
				);
			}
		}

		this.__$description.innerText = this.__notice;

		// Insert after legend if it exists, otherwise append to fieldset/element
		if (this.__$legend) {
			this.__$legend.after(this.__$description);
		} else {
			(this.__$fieldset ? this.__$fieldset : this).appendChild(
				this.__$description,
			);
		}
	}

	__setupAccessibleName() {
		if (this.__$legend && !this.__$legend.id) {
			this.__$legend.id = `${this.__field_name.replace('[]', '')}-legend`;
		}
		(this.__$fieldset ? this.__$fieldset : this).setAttribute(
			'aria-labelledby',
			`${this.__$legend ? this.__$legend.id : ''} ${this.__$description.id}`,
		);
	}

	__setupValidation() {
		this.__$form = this.closest('form');
		this.__$form.addEventListener(
			'formdata',
			this.__handleValidation.bind(this),
		);
		this.__$form.addEventListener(
			'submit',
			this.__handleValidation.bind(this),
		);
		[...this.__$checkboxes].map((input) =>
			input.addEventListener('change', this.__resetValidity.bind(this)),
		);
	}

	__handleValidation(e) {
		const total_checked = [...this.__$checkboxes].filter(
			(input) => input.checked,
		).length;
		if (total_checked < this.__min || total_checked > this.__max) {
			e.preventDefault();
			this.__$checkboxes[0].setCustomValidity(
				this.__error ? this.__error : this.__notice,
			);
			if (this.__shouldShowFieldError(this.__$checkboxes[0])) {
				this.__$checkboxes[0].reportValidity();
			}
		}
	}

	__shouldShowFieldError(input) {
		const $all_fields = [...this.__$form.elements].filter((element) =>
			element.matches(
				'input:not([type=submit],[type=reset]),textarea,select',
			),
		);
		let i = 0;
		const length = $all_fields.length;
		while (i < length) {
			// this field should throw the error
			if ($all_fields[i].name == input.name) {
				return true;
			}
			// another field should throw the error
			if (!$all_fields[i].validity.valid) {
				return false;
			}
			i++;
		}
		return true;
	}

	__resetValidity() {
		[
			...this.__$form.querySelectorAll(
				`${this.__element_name} [type=checkbox]`,
			),
		].map((input) => input.setCustomValidity(''));
	}
}
