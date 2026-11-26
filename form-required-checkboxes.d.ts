export type FormRequiredCheckboxesRuleMessages = Partial<
	Record<'exact' | 'max' | 'range', string>
>;

export interface FormRequiredCheckboxesMessages {
	'notice-message'?: string | FormRequiredCheckboxesRuleMessages;
	'error-message'?: string | FormRequiredCheckboxesRuleMessages;
}

export interface FormRequiredCheckboxesTranslation {
	exact?: string;
	max?: string;
	range?: string;
	error_exact?: string;
	error_range?: string;
}

export interface FormRequiredCheckboxesChangeDetail {
	readonly checkedCount: number;
	readonly minimum: number;
	readonly maximum: number;
	readonly valid: boolean;
	readonly source: 'change' | 'reset' | 'refresh';
}

export type FormRequiredCheckboxesChangeEvent =
	CustomEvent<FormRequiredCheckboxesChangeDetail>;

export interface FormRequiredCheckboxesEventMap extends HTMLElementEventMap {
	'form-required-checkboxes:change': FormRequiredCheckboxesChangeEvent;
}

export class FormRequiredCheckboxesElement extends HTMLElement {
	/** @deprecated Prefer authored instance/shared messages to language catalogs. */
	static customTranslations: Record<
		string,
		FormRequiredCheckboxesTranslation
	>;
	/** @deprecated Prefer authored instance/shared messages to language catalogs. */
	static registerTranslations(
		translations: Record<string, FormRequiredCheckboxesTranslation>,
	): void;
	get noticeMessage(): string | null;
	set noticeMessage(value: string | null | undefined);
	get errorMessage(): string | null;
	set errorMessage(value: string | null | undefined);
	/** @deprecated Will be removed in a future major release. Use noticeMessage or shared JSON messages. */
	get notice(): string | null;
	/** @deprecated Will be removed in a future major release. Use noticeMessage or shared JSON messages. */
	set notice(value: string | null | undefined);
	/** @deprecated Will be removed in a future major release. Use errorMessage or shared JSON messages. */
	get error(): string | null;
	/** @deprecated Will be removed in a future major release. Use errorMessage or shared JSON messages. */
	set error(value: string | null | undefined);
	get required(): string | null;
	set required(value: string | null | undefined);
	lang: string;
	readonly enhanced: boolean;
	readonly checkedCount: number;
	/** Count validity only; null before enhancement and after disconnection. */
	readonly valid: boolean | null;
	refresh(): boolean;
	addEventListener<K extends keyof FormRequiredCheckboxesEventMap>(
		type: K,
		listener: (
			this: FormRequiredCheckboxesElement,
			event: FormRequiredCheckboxesEventMap[K],
		) => unknown,
		options?: boolean | AddEventListenerOptions,
	): void;
	addEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject | null,
		options?: boolean | AddEventListenerOptions,
	): void;
	removeEventListener<K extends keyof FormRequiredCheckboxesEventMap>(
		type: K,
		listener: (
			this: FormRequiredCheckboxesElement,
			event: FormRequiredCheckboxesEventMap[K],
		) => unknown,
		options?: boolean | EventListenerOptions,
	): void;
	removeEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject | null,
		options?: boolean | EventListenerOptions,
	): void;
}

declare global {
	interface HTMLElementTagNameMap {
		'form-required-checkboxes': FormRequiredCheckboxesElement;
	}
}
