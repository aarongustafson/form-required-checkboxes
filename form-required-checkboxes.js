import defaultTranslations from './translations.js';

const sharedConfigurations = new WeakMap();
const messageNames = ['notice-message', 'error-message'];
const rules = ['exact', 'max', 'range'];
const translationKeys = ['exact', 'max', 'range', 'error_exact', 'error_range'];
let descriptionSequence = 0;

function validateTemplate(value) {
	if (typeof value !== 'string' || !value.trim()) {
		throw new TypeError('Checkbox messages must be nonempty strings.');
	}
	if (/[{}]/.test(value.replace(/\{(?:n|min|max)\}/g, ''))) {
		throw new TypeError(
			'Checkbox messages support only {n}, {min}, and {max}.',
		);
	}
}

function sharedMessages(document) {
	const scripts = document.querySelectorAll(
		'[data-form-required-checkboxes-config]',
	);
	if (scripts.length > 1)
		throw new TypeError(
			'Use only one checkbox configuration script per document.',
		);
	if (!scripts.length) return {};
	const script = scripts[0];
	if (
		script.localName !== 'script' ||
		script.type.trim().toLowerCase() !== 'application/json' ||
		script.hasAttribute('src') ||
		script.getAttribute('data-form-required-checkboxes-config') !== ''
	) {
		throw new TypeError(
			'Use an inline application/json script with an empty data-form-required-checkboxes-config attribute.',
		);
	}
	const text = script.textContent;
	const cached = sharedConfigurations.get(script);
	if (cached?.text === text) return cached.messages;
	const messages = JSON.parse(text);
	if (!messages || typeof messages !== 'object' || Array.isArray(messages)) {
		throw new TypeError('Checkbox configuration must be an object.');
	}
	for (const [name, value] of Object.entries(messages)) {
		if (!messageNames.includes(name))
			throw new TypeError(`Unknown checkbox message: ${name}.`);
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			for (const [rule, template] of Object.entries(value)) {
				if (!rules.includes(rule))
					throw new TypeError(`Unknown checkbox rule: ${rule}.`);
				validateTemplate(template);
			}
		} else validateTemplate(value);
	}
	sharedConfigurations.set(script, { text, messages });
	return messages;
}

function bounds(required) {
	if (!required?.trim()) {
		throw new Error(
			'You must specify a `required` number of checkbox choices in a `form-required-checkboxes` element',
		);
	}
	if (!/^\d+(?:-\d+)?$/.test(required.trim()))
		throw new TypeError(
			'Required must be a nonnegative integer or ascending integer range.',
		);
	const [min, max = min] = required.trim().split('-');
	if (
		![min, max].every((value) => Number.isSafeInteger(Number(value))) ||
		Number(min) > Number(max)
	) {
		throw new RangeError(
			'Required bounds must be safe, nonnegative integers in ascending order.',
		);
	}
	return { min: String(Number(min)), max: String(Number(max)) };
}

function inheritedLanguage(element) {
	for (
		let node = element;
		node;
		node = node.parentElement || node.getRootNode().host
	) {
		if (node.hasAttribute('lang')) return node.getAttribute('lang') || 'en';
	}
	return 'en';
}

/**
 * Native checkbox count validation with authored message templates.
 * @element form-required-checkboxes
 * @fires form-required-checkboxes:change - A changed count-constraint outcome.
 */
export class FormRequiredCheckboxesElement extends HTMLElement {
	#boundHandleValidation = null;
	#boundResetValidity = null;
	#frame = null;
	#listeners = null;
	#enhanced = false;
	#lastState = null;
	#generation = 0;
	#resetTimers = new Set();
	#association = null;
	#generatedLegend = null;
	#errorInput = null;
	#ownedError = null;

	/** @deprecated Prefer authored instance/shared messages to language catalogs. */
	static customTranslations = {};

	static get observedAttributes() {
		return ['notice', 'error', 'required', 'lang', ...messageNames];
	}

	/** @deprecated Prefer authored instance/shared messages to language catalogs. */
	static registerTranslations(translations) {
		if (
			!translations ||
			typeof translations !== 'object' ||
			Array.isArray(translations)
		)
			throw new TypeError(
				'Translations must be a language-keyed object.',
			);
		const next = { ...this.customTranslations };
		for (const [language, messages] of Object.entries(translations)) {
			const locale = Intl.getCanonicalLocales(language)[0].toLowerCase();
			if (
				!messages ||
				typeof messages !== 'object' ||
				Array.isArray(messages)
			)
				throw new TypeError(
					'Each translation must be a message object.',
				);
			for (const [key, template] of Object.entries(messages)) {
				if (!translationKeys.includes(key))
					throw new TypeError(
						`Unknown checkbox translation: ${key}.`,
					);
				validateTemplate(template);
			}
			next[locale] = { ...next[locale], ...messages };
		}
		this.customTranslations = next;
	}

	get noticeMessage() {
		return this.getAttribute('notice-message');
	}
	set noticeMessage(value) {
		if (value == null) this.removeAttribute('notice-message');
		else this.setAttribute('notice-message', value);
	}

	get errorMessage() {
		return this.getAttribute('error-message');
	}
	set errorMessage(value) {
		if (value == null) this.removeAttribute('error-message');
		else this.setAttribute('error-message', value);
	}

	get enhanced() {
		return this.#enhanced;
	}

	get checkedCount() {
		return this.#enhanced
			? [...this.__$checkboxes].filter((input) => input.checked).length
			: 0;
	}

	get valid() {
		return this.#enhanced
			? this.checkedCount >= Number(this.__min) &&
					this.checkedCount <= Number(this.__max)
			: null;
	}

	/** @deprecated Will be removed in a future major release. Use noticeMessage or shared JSON messages. */
	get notice() {
		return this.getAttribute('notice');
	}
	/** @deprecated Will be removed in a future major release. Use noticeMessage or shared JSON messages. */
	set notice(val) {
		if (val === null || val === undefined) {
			this.removeAttribute('notice');
		} else {
			this.setAttribute('notice', val);
		}
	}

	/** @deprecated Will be removed in a future major release. Use errorMessage or shared JSON messages. */
	get error() {
		return this.getAttribute('error');
	}
	/** @deprecated Will be removed in a future major release. Use errorMessage or shared JSON messages. */
	set error(val) {
		if (val === null || val === undefined) {
			this.removeAttribute('error');
		} else {
			this.setAttribute('error', val);
		}
	}

	get required() {
		return this.getAttribute('required');
	}
	set required(val) {
		if (val === null || val === undefined) {
			this.removeAttribute('required');
		} else {
			this.setAttribute('required', val);
		}
	}

	get lang() {
		return this.getAttribute('lang') ?? '';
	}
	set lang(val) {
		if (val === null || val === undefined) {
			this.removeAttribute('lang');
		} else {
			this.setAttribute('lang', val);
		}
	}

	_upgradeProperty(prop) {
		if (Object.prototype.hasOwnProperty.call(this, prop)) {
			const value = this[prop];
			delete this[prop];
			this[prop] = value;
		}
	}

	connectedCallback() {
		for (const property of [
			'notice',
			'error',
			'required',
			'lang',
			'noticeMessage',
			'errorMessage',
		])
			this._upgradeProperty(property);
		this.#frame = requestAnimationFrame(() => {
			this.#frame = null;
			if (this.isConnected) this.__refresh(false);
		});
	}

	disconnectedCallback() {
		if (this.#frame !== null) cancelAnimationFrame(this.#frame);
		this.#frame = null;
		this.#listeners?.abort();
		this.#generation++;
		for (const timer of this.#resetTimers) clearTimeout(timer);
		this.#resetTimers.clear();
		this.__clearOwnedError();
		this.__restoreAssociation();
		this.__$description?.remove();
		this.__$description = null;
		this.#enhanced = false;
		this.#lastState = null;
	}

	attributeChangedCallback(name, previous, value) {
		if (previous !== value && this.#enhanced) this.__refresh(false);
	}

	refresh() {
		return this.__refresh(true);
	}

	__refresh(notify) {
		if (!this.isConnected) return false;
		if (this.#frame !== null) cancelAnimationFrame(this.#frame);
		this.#frame = null;
		try {
			const { min, max } = bounds(this.required);
			const checkboxes = this.querySelectorAll('input[type="checkbox"]');
			if (
				!checkboxes.length ||
				!checkboxes[0].name ||
				[...checkboxes].some(
					(input) =>
						input.name !== checkboxes[0].name ||
						input.form !== checkboxes[0].form,
				)
			) {
				throw new TypeError(
					'Use at least one named checkbox, sharing a name and form owner.',
				);
			}
			const language = inheritedLanguage(this);
			const translations = this.__getTranslations(language);
			const shared = sharedMessages(this.ownerDocument);
			const rule =
				min === max ? 'exact' : Number(min) === 0 ? 'max' : 'range';
			let formatter;
			try {
				formatter = new Intl.NumberFormat(language);
			} catch (error) {
				if (!(error instanceof RangeError)) throw error;
				console.error(
					'Invalid checkbox formatting language; using English:',
					error,
				);
				formatter = new Intl.NumberFormat('en');
			}
			const values = {
				n: formatter.format(Number(max)),
				min: formatter.format(Number(min)),
				max: formatter.format(Number(max)),
			};
			const resolveMessage = (name, legacy, fallback) => {
				const authored = this.getAttribute(name);
				const value = shared[name];
				const template =
					authored ??
					(typeof value === 'object' ? value[rule] : value) ??
					fallback;
				if (authored === null && legacy) return legacy;
				validateTemplate(template);
				return FormRequiredCheckboxesElement.__interpolate(
					template,
					values,
				);
			};
			const notice = resolveMessage(
				'notice-message',
				this.notice,
				translations[rule],
			);
			const error = resolveMessage(
				'error-message',
				this.error,
				translations[rule === 'exact' ? 'error_exact' : 'error_range'],
			);
			const hadError =
				this.#errorInput?.validationMessage === this.#ownedError &&
				this.#ownedError !== null;
			const fieldset = this.querySelector('fieldset');
			if (
				this.#association &&
				this.#association.target !== (fieldset || this)
			)
				this.__restoreAssociation();
			this.__clearOwnedError();
			this.__$checkboxes = checkboxes;
			this.__field_name = checkboxes[0].name;
			this.__$fieldset = fieldset;
			this.__$legend = this.querySelector('legend');
			this.__lang = language;
			this.__min = min;
			this.__max = max;
			this.__notice = notice;
			this.__error = error;
			this.#generation++;
			this.__addDescription();
			this.__setupAccessibleName();
			this.__setupValidation();
			this.#enhanced = true;
			if (hadError && !this.valid) this.__setError();
			if (notify) this.__notify('refresh');
			else this.#lastState = this.__state();
			return true;
		} catch (error) {
			console.error('form-required-checkboxes could not refresh:', error);
			return false;
		}
	}

	__getTranslations(language = this.__lang) {
		const translations = {
			...defaultTranslations.en,
			...this.constructor.customTranslations.en,
		};
		const parts = (language || 'en').toLowerCase().split('-');
		for (let length = 1; length <= parts.length; length++) {
			const locale = parts.slice(0, length).join('-');
			Object.assign(
				translations,
				defaultTranslations[locale],
				this.constructor.customTranslations[locale],
			);
		}
		return translations;
	}

	static __interpolate(template, values) {
		return template.replace(/\{(\w+)\}/g, (match, key) =>
			Object.hasOwn(values, key) ? String(values[key]) : match,
		);
	}

	__getMinMax() {
		const { min, max } = bounds(this.required);
		this.__min = min;
		this.__max = max;
	}

	__addDescription() {
		if (!this.__$description) {
			this.__$description = this.ownerDocument.createElement('small');
			do {
				this.__$description.id = `form-required-checkboxes-description-${++descriptionSequence}`;
			} while (this.getRootNode().getElementById(this.__$description.id));
		}
		if (this.__$description.textContent !== this.__notice)
			this.__$description.textContent = this.__notice;
		if (this.__$legend) {
			if (this.__$legend.nextSibling !== this.__$description) {
				this.__$legend.after(this.__$description);
			}
		} else {
			if (
				(this.__$fieldset ? this.__$fieldset : this).lastChild !==
				this.__$description
			) {
				(this.__$fieldset ? this.__$fieldset : this).appendChild(
					this.__$description,
				);
			}
		}
	}

	__setupAccessibleName() {
		if (this.__$legend && !this.__$legend.id) {
			let id;
			do {
				id = `form-required-checkboxes-legend-${++descriptionSequence}`;
			} while (this.getRootNode().getElementById(id));
			this.__$legend.id = id;
			this.#generatedLegend = { element: this.__$legend, id };
		}
		const target = this.__$fieldset ? this.__$fieldset : this;
		const current = target.getAttribute('aria-labelledby');
		if (!this.#association || current !== this.#association.written)
			this.#association = { target, before: current };
		const labelValue = [
			...new Set(
				[
					...(this.#association.before?.split(/\s+/) || []),
					this.__$legend?.id,
					this.__$description.id,
				].filter(Boolean),
			),
		].join(' ');
		if (target.getAttribute('aria-labelledby') !== labelValue) {
			target.setAttribute('aria-labelledby', labelValue);
		}
		this.#association.written = labelValue;
	}

	__restoreAssociation() {
		if (this.#association) {
			const { target, before, written } = this.#association;
			if (target.getAttribute('aria-labelledby') === written) {
				if (before === null) target.removeAttribute('aria-labelledby');
				else target.setAttribute('aria-labelledby', before);
			}
			this.#association = null;
		}
		if (this.#generatedLegend) {
			const { element, id } = this.#generatedLegend;
			if (element.id === id) element.removeAttribute('id');
			this.#generatedLegend = null;
		}
	}

	__setupValidation() {
		this.#listeners?.abort();
		this.#listeners = new AbortController();
		const { signal } = this.#listeners;
		this.__$form = this.__$checkboxes[0].form;
		this.__$target = this.__$form || this.ownerDocument.body;

		// Bind handlers once
		if (!this.#boundHandleValidation) {
			this.#boundHandleValidation = this.__handleValidation.bind(this);
		}
		if (!this.#boundResetValidity) {
			this.#boundResetValidity = this.__resetValidity.bind(this);
		}

		this.__$target.addEventListener(
			'formdata',
			this.#boundHandleValidation,
			{ signal },
		);
		this.__$target.addEventListener('submit', this.#boundHandleValidation, {
			signal,
		});
		this.__$checkboxes.forEach((input) => {
			input.addEventListener('change', this.#boundResetValidity, {
				signal,
			});
		});
		this.getRootNode().addEventListener(
			'reset',
			(event) => {
				if (!this.__$form || event.target !== this.__$form) return;
				const generation = this.#generation;
				const timer = setTimeout(() => {
					this.#resetTimers.delete(timer);
					if (
						event.defaultPrevented ||
						generation !== this.#generation ||
						!this.#enhanced
					)
						return;
					this.__clearOwnedError();
					this.__notify('reset');
				}, 0);
				this.#resetTimers.add(timer);
			},
			{ capture: true, signal },
		);
	}

	__handleValidation(e) {
		if (e.target !== this.__$target) return;
		const total_checked = [...this.__$checkboxes].filter(
			(input) => input.checked,
		).length;
		if (total_checked < this.__min || total_checked > this.__max) {
			this.#generation++;
			e.preventDefault();
			this.__setError();
			if (this.__shouldShowFieldError(this.__$checkboxes[0])) {
				this.__$checkboxes[0].reportValidity();
			}
		}
	}

	__shouldShowFieldError(input) {
		// If no form exists, always show the error
		if (!this.__$form) {
			return true;
		}

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
		this.#generation++;
		if (this.__$checkboxes) {
			this.__$checkboxes.forEach((input) => input.setCustomValidity(''));
		}
		this.#errorInput = null;
		this.#ownedError = null;
		this.__notify('change');
	}

	__setError() {
		this.#errorInput = this.__$checkboxes[0];
		this.#ownedError = this.__error;
		this.#errorInput.setCustomValidity(this.#ownedError);
	}

	__clearOwnedError() {
		// Barred controls hide their message; defer ownership checks until refresh.
		if (
			this.#errorInput &&
			!this.#errorInput.willValidate &&
			this.#errorInput.validity.customError
		)
			return;
		if (
			this.#ownedError !== null &&
			this.#errorInput?.validationMessage === this.#ownedError
		)
			this.#errorInput.setCustomValidity('');
		this.#errorInput = null;
		this.#ownedError = null;
	}

	__state() {
		return {
			checkedCount: this.checkedCount,
			minimum: Number(this.__min),
			maximum: Number(this.__max),
			valid: this.valid,
		};
	}

	__notify(source) {
		const state = this.__state();
		const previous = this.#lastState;
		this.#lastState = state;
		if (
			previous &&
			Object.keys(state).some((key) => previous[key] !== state[key])
		) {
			this.dispatchEvent(
				new CustomEvent('form-required-checkboxes:change', {
					bubbles: true,
					composed: true,
					detail: Object.freeze({ ...state, source }),
				}),
			);
		}
	}
}
