import '../define.js';

const group = document.querySelector('#state-group');
const output = document.querySelector('#group-state');

function showState() {
	const validity = group.valid
		? output.dataset.validMessage
		: output.dataset.invalidMessage;
	output.textContent = output.dataset.message
		.replace('{count}', String(group.checkedCount))
		.replace('{validity}', validity);
	output.hidden = false;
}

group.addEventListener('form-required-checkboxes:change', showState);
if (group.refresh()) showState();

document.querySelector('[data-allow-three]').addEventListener('click', () => {
	group.required = '1-3';
	showState();
});
