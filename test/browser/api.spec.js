import { test, expect } from '@playwright/test';
import { serveDemo } from './demo-fixture.js';

const groupMarkup = `<form>
	<form-required-checkboxes required="1-2">
		<fieldset><legend>Skills</legend>
			<label><input type="checkbox" name="skills[]" value="js" checked>JavaScript</label>
			<label><input type="checkbox" name="skills[]" value="css">CSS</label>
		</fieldset>
	</form-required-checkboxes>
	<button type="submit">Submit</button><button type="reset">Reset</button>
</form>`;

async function open(page) {
	await serveDemo(page);
	await page.route('http://code-demo.test/api.html', (route) =>
		route.fulfill({
			contentType: 'text/html',
			body: `<!doctype html><html lang="en"><title>Checkbox API</title><body>${groupMarkup}<script type="module" src="/define.js"></script></body></html>`,
		}),
	);
	await page.goto('http://code-demo.test/api.html');
	await expect(page.locator('form-required-checkboxes small')).toBeVisible();
}

test('native keyboard validation recovers after reset while canceled resets preserve errors', async ({
	page,
}) => {
	await open(page);
	const element = page.locator('form-required-checkboxes');
	const checkbox = page.getByRole('checkbox', { name: 'JavaScript' });
	await checkbox.focus();
	await page.keyboard.press('Space');
	await page.getByRole('button', { name: 'Submit' }).click();
	await expect(checkbox).toBeFocused();
	await expect(checkbox).toHaveJSProperty(
		'validationMessage',
		'You must choose between 1 and 2 options',
	);
	await page.locator('form').evaluate((form) => {
		form.addEventListener('reset', (event) => event.preventDefault(), {
			once: true,
		});
	});
	await page.getByRole('button', { name: 'Reset' }).click();
	await expect(checkbox).not.toBeChecked();
	await expect(checkbox).toHaveJSProperty(
		'validationMessage',
		'You must choose between 1 and 2 options',
	);
	await page.getByRole('button', { name: 'Reset' }).click();
	await expect(checkbox).toBeChecked();
	await expect(checkbox).toHaveJSProperty('validationMessage', '');
	await expect(element).toHaveJSProperty('checkedCount', 1);
	await expect(element).toHaveJSProperty('valid', true);
});

test('language and non-composed reset work inside a shadow root', async ({
	page,
}) => {
	await open(page);
	await page.evaluate((markup) => {
		document.querySelector('form').remove();
		const host = document.createElement('div');
		host.lang = 'fr';
		document.body.append(host);
		host.attachShadow({ mode: 'open' }).innerHTML = markup;
	}, groupMarkup);
	const element = page.locator('form-required-checkboxes');
	await expect(element).toHaveJSProperty('enhanced', true);
	await expect(element.locator('small')).toHaveText(
		'Choisissez entre 1 et 2 de la liste',
	);
	const checkbox = page.getByRole('checkbox', { name: 'JavaScript' });
	await page.evaluate(() => {
		document.addEventListener(
			'form-required-checkboxes:change',
			(event) => {
				window.checkboxOutcome = event.detail;
			},
		);
	});
	await checkbox.uncheck();
	expect(await page.evaluate(() => window.checkboxOutcome)).toEqual({
		checkedCount: 0,
		minimum: 1,
		maximum: 2,
		valid: false,
		source: 'change',
	});
	await page.getByRole('button', { name: 'Submit' }).click();
	await expect(checkbox).toHaveJSProperty(
		'validationMessage',
		'Vous devez choisir entre 1 et 2 options',
	);
	await page.getByRole('button', { name: 'Reset' }).click();
	await expect(checkbox).toBeChecked();
	await expect(checkbox).toHaveJSProperty('validationMessage', '');
});

test('a later canceled reset does not cancel earlier successful cleanup or steal focus', async ({
	page,
}) => {
	await open(page);
	const checkbox = page.getByRole('checkbox', { name: 'JavaScript' });
	await checkbox.uncheck();
	await page.getByRole('button', { name: 'Submit' }).click();
	await page.locator('form').evaluate((form) => {
		form.reset();
		form.addEventListener('reset', (event) => event.preventDefault(), {
			once: true,
		});
		form.reset();
	});
	await expect(checkbox).toBeChecked();
	await expect(checkbox).toHaveJSProperty('validationMessage', '');
	await expect(checkbox).toBeFocused();
});

test('external native form ownership survives refresh and reset', async ({
	page,
}) => {
	await open(page);
	await page.locator('form').evaluate((form) => {
		form.id = 'external-owner';
		const group = form.querySelector('form-required-checkboxes');
		for (const checkbox of group.querySelectorAll('input'))
			checkbox.setAttribute('form', form.id);
		form.after(group);
		group.refresh();
	});
	const checkbox = page.getByRole('checkbox', { name: 'JavaScript' });
	await checkbox.uncheck();
	await page.getByRole('button', { name: 'Submit' }).click();
	await expect(checkbox).toHaveJSProperty(
		'validationMessage',
		'You must choose between 1 and 2 options',
	);
	await page.getByRole('button', { name: 'Reset' }).click();
	await expect(checkbox).toBeChecked();
	await expect(checkbox).toHaveJSProperty('validationMessage', '');
});
