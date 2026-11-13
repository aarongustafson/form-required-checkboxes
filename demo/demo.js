// This demo-only handler also works if a component module fails to load.
document.addEventListener('submit', (event) => {
	const form = event.target;
	const result = form.querySelector('.form-result');
	if (event.defaultPrevented || !result) return;
	event.preventDefault();
	if (
		!form.checkValidity() ||
		[...form.querySelectorAll('form-required-checkboxes')].some(
			(group) => !group.matches(':defined'),
		)
	) {
		return;
	}
	result.hidden = false;
});

for (const type of ['reset', 'input']) {
	document.addEventListener(type, (event) => {
		const form = event.target.closest('form');
		const result = form?.querySelector('.form-result');
		if (result) result.hidden = true;
	});
}
