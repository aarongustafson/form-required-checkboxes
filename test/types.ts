import {
	FormRequiredCheckboxesElement,
	type FormRequiredCheckboxesMessages,
	type FormRequiredCheckboxesChangeEvent,
} from '@aarongustafson/form-required-checkboxes';
import { defineFormRequiredCheckboxes } from '@aarongustafson/form-required-checkboxes/define.js';

const group = document.createElement('form-required-checkboxes');
const configuration: FormRequiredCheckboxesMessages = {
	'notice-message': { exact: 'Choose {n}', range: '{min} through {max}' },
	'error-message': 'Please choose {min} through {max}.',
};
group.noticeMessage = 'Choose {min} through {max}.';
group.errorMessage = undefined;
group.required = '1-2';
const valid: boolean | null = group.valid;
const count: number = group.checkedCount;
const enhanced: boolean = group.enhanced;
const refreshed: boolean = group.refresh();
const registered: boolean = defineFormRequiredCheckboxes();
const listener = function (
	this: FormRequiredCheckboxesElement,
	event: FormRequiredCheckboxesChangeEvent,
) {
	const selected: number = event.detail.checkedCount;
	console.log(this.valid, selected);
	// @ts-expect-error Event payloads are read-only snapshots.
	event.detail.checkedCount = 10;
};
group.addEventListener('form-required-checkboxes:change', listener);
group.removeEventListener('form-required-checkboxes:change', listener);
group.addEventListener('click', (event) => {
	const click: MouseEvent = event;
	console.log(click.clientX);
});
group.addEventListener('application:event', { handleEvent: console.log });
// @ts-expect-error Derived state has no setter.
group.checkedCount = 3;
// @ts-expect-error Count validity has no setter.
group.valid = true;
console.log(configuration, valid, count, enhanced, refreshed, registered);
