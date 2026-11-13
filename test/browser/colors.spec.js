import { readFile } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';

const read = (path) =>
	readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

// Firefox/WebKit reserve port 4190 (Sieve). Relay a test-only origin through
// Playwright's HTTP client to the exclusive fixture, without another server.
async function routeFixture(context) {
	await context.route('http://checkboxes.test/**', async (route) => {
		const url = new URL(route.request().url());
		const response = await route.fetch({
			url: `http://127.0.0.1:4190${url.pathname}${url.search}`,
		});
		await route.fulfill({ response });
	});
}

const test = base.extend({
	context: async ({ context }, use) => {
		await routeFixture(context);
		await use(context);
	},
});

async function demo(page, name = 'index.html') {
	await page.route('https://esm.sh/**', async (route) =>
		route.fulfill({
			contentType: 'text/javascript',
			body: (await read('form-required-checkboxes.js')).replace(
				"'./translations.js'",
				"'http://checkboxes.test/translations.js'",
			),
		}),
	);
	await page.route('https://unpkg.com/**', async (route) =>
		route.fulfill({
			contentType: 'text/javascript',
			body: (await read('define.js')).replace(
				"'./form-required-checkboxes.js'",
				"'http://checkboxes.test/form-required-checkboxes.js'",
			),
		}),
	);
	await page.goto(`/demo/${name}`);
	await expect(
		page.locator('form-required-checkboxes small').first(),
	).toBeVisible();
}

async function measurements(locator) {
	return locator.evaluate((element) => {
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = 1;
		const context = canvas.getContext('2d', { willReadFrequently: true });
		const pixel = () => [...context.getImageData(0, 0, 1, 1).data];
		const paint = (color) => {
			context.fillStyle = color;
			context.fillRect(0, 0, 1, 1);
			return pixel();
		};
		const ancestors = [];
		for (let node = element; node; node = node.parentElement)
			ancestors.unshift(node);
		for (const node of ancestors) {
			const style = getComputedStyle(node);
			if (style.opacity !== '1')
				throw new Error('Unexpected group opacity');
			paint(style.backgroundColor);
			if (style.backgroundImage !== 'none') {
				const match = style.backgroundImage.match(
					/^linear-gradient\((.+), \1\)$/,
				);
				if (!match)
					throw new Error(
						`Unsupported background ${style.backgroundImage}`,
					);
				paint(match[1]);
			}
		}
		const background = pixel();
		if (background[3] !== 255)
			throw new Error('Expected an opaque surface');
		const foreground = paint(getComputedStyle(element).color);
		const luminance = (rgb) =>
			rgb.slice(0, 3).reduce((sum, channel, index) => {
				const value = channel / 255;
				return (
					sum +
					(value <= 0.04045
						? value / 12.92
						: ((value + 0.055) / 1.055) ** 2.4) *
						[0.2126, 0.7152, 0.0722][index]
				);
			}, 0);
		const ratio = (a, b) => {
			const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
			return (values[0] + 0.05) / (values[1] + 0.05);
		};
		const style = getComputedStyle(element);
		paint(`rgb(${background.slice(0, 3).join(',')})`);
		const border = paint(style.borderTopColor);
		const paintsBorder =
			parseFloat(style.borderTopWidth) > 0 &&
			!['none', 'hidden'].includes(style.borderTopStyle);
		return {
			text: ratio(background, foreground),
			boundary: paintsBorder ? ratio(background, border) : 1,
		};
	});
}

async function textContrast(locator) {
	return (await measurements(locator)).text;
}

test('translucent text and borders each composite once over their surface', async ({
	page,
}) => {
	await page.setContent(
		'<div style="background:white;color:rgb(0 0 0 / 50%);border:1px solid rgb(0 0 0 / 50%)">Calibration</div>',
	);
	const result = await measurements(page.locator('div'));
	expect(result.text).toBeGreaterThan(3.9);
	expect(result.text).toBeLessThan(4.1);
	expect(result.boundary).toBeCloseTo(result.text, 4);
});

test('required feedback remains readable on its Canvas surface', async ({
	page,
}) => {
	await demo(page);
	// This recorded dark palette exposes GrayText used for required instructions.
	await page.addStyleTag({
		content: 'body, .demo { background: #202020; color: #ffffff; }',
	});
	expect(
		await textContrast(page.locator('#form1 small')),
	).toBeGreaterThanOrEqual(4.5);
});

test('valid submission shows authored, persistent feedback without losing choices', async ({
	page,
}) => {
	await demo(page);
	for (const checkbox of (await page.locator('#form1 input').all()).slice(
		0,
		3,
	)) {
		await checkbox.check();
	}
	await page.locator('#form1 button[type=submit]').click();
	await expect(page.locator('#form1 .form-result')).toBeVisible();
	await expect(page.locator('#form1 input:checked')).toHaveCount(3);
	await page.locator('#form1 button[type=reset]').click();
	await expect(page.locator('#form1 .form-result')).toBeHidden();
	await expect(page.locator('#form1 input:checked')).toHaveCount(0);
});

// The study's 62 observations reduce to 19 palettes; substitution does not
// reproduce OS painting, native checkbox marks, or validation tooltips.
const tokens = [
	'Canvas',
	'CanvasText',
	'ButtonFace',
	'ButtonText',
	'Field',
	'FieldText',
];
const palettes = [
	['#ffffff', '#000000', '#efefef', '#000000', '#ffffff', '#000000'],
	['#121212', '#ffffff', '#6b6b6b', '#ffffff', '#3b3b3b', '#ffffff'],
	['#ffffff', '#000000', '#e9e9ed', '#000000', '#ffffff', '#000000'],
	['#1c1b22', '#fbfbfe', '#2b2a33', '#fbfbfe', '#2b2a33', '#fbfbfe'],
	['#ffffff', '#000000', '#c0c0c0', '#000000d8', '#ffffff', '#000000d8'],
	['#1e1e1e', '#ffffff', '#ffffff3f', '#ffffffd8', '#ffffff3f', '#ffffffd8'],
	['#ffffff', '#000000', '#f0f0f0', '#000000', '#ffffff', '#000000'],
	['#202020', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#3d3d3d'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffee32'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#b6f6f0'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#202020'],
	['#ffffff', '#000000', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#000000', '#ffffff', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#ffffff', '#000000', '#ffffff', '#000000d8', '#ffffff', '#000000d8'],
	['#282828', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#202020', '#ffffff', '#00000000', '#ffffff', '#00000000', '#ffffff'],
];

function substitute(css, palette) {
	const colors = Object.fromEntries(
		tokens.map((token, index) => [token.toLowerCase(), palette[index]]),
	);
	return css.replace(
		/\b(CanvasText|Canvas|ButtonFace|ButtonText|FieldText|Field)\b/gi,
		(token) => colors[token.toLowerCase()],
	);
}

test('palette replacement calibrates case-insensitive CSSOM token spelling', async ({
	page,
}) => {
	const palette = [
		'#010203',
		'#112233',
		'#445566',
		'#778899',
		'#aabbcc',
		'#ddeeff',
	];
	const css =
		'.probe { background: cAnVaS; color: canvastext; border-color: BUTTONFACE; outline-color: buttontext; text-decoration-color: field; column-rule-color: FieldText; }';
	await page.setContent(
		`<style>${css}</style><div class="probe">Palette</div>`,
	);
	const normalized = await page
		.locator('style')
		.evaluate((style) => style.sheet.cssRules[0].cssText);
	for (const source of [css, normalized.toLowerCase()]) {
		await page.locator('style').evaluate(
			(style, css) => {
				style.textContent = css;
			},
			substitute(source, palette),
		);
		expect(
			await page.locator('.probe').evaluate((element) => {
				const style = getComputedStyle(element);
				return [
					'backgroundColor',
					'color',
					'borderTopColor',
					'outlineColor',
					'textDecorationColor',
					'columnRuleColor',
				].map((property) => style[property]);
			}),
		).toEqual([
			'rgb(1, 2, 3)',
			'rgb(17, 34, 51)',
			'rgb(68, 85, 102)',
			'rgb(119, 136, 153)',
			'rgb(170, 187, 204)',
			'rgb(221, 238, 255)',
		]);
	}
});

for (const name of ['index.html', 'esm.html', 'unpkg.html']) {
	test(`${name}: all 19 study palettes retain reading, feedback, and control contrast`, async ({
		page,
	}) => {
		test.setTimeout(120000);
		await demo(page, name);
		const css = await read('demo/styles.css');
		const style = await page.addStyleTag({ content: css });
		const form = page.locator('form').first();
		const buttons = form.locator('button');
		for (const checkbox of (
			await form.locator('input[type=checkbox]').all()
		).slice(0, name === 'index.html' ? 3 : 2))
			await checkbox.check();
		await form.locator('button[type=submit]').click();
		await expect(form.locator('.form-result')).toBeVisible();
		for (const palette of palettes) {
			await page.mouse.move(0, 0);
			await style.evaluate(
				(style, css) => {
					style.textContent = css;
				},
				substitute(css, palette),
			);
			for (const selector of [
				'body',
				'.demo-section',
				'.demo-section > p',
				'.demo-section > p code',
				'pre',
				'pre code',
				'.demo',
				'form-required-checkboxes small',
				'.form-result',
				'footer',
				'.api-reference',
				'.api-reference code',
			]) {
				for (const element of await page.locator(selector).all()) {
					if (await element.isVisible())
						expect(
							await textContrast(element),
							`${name}: ${palette[0]} ${selector}`,
						).toBeGreaterThanOrEqual(4.5);
				}
			}
			for (const button of await buttons.all()) {
				for (const hover of [false, true]) {
					if (hover) await button.hover();
					const result = await measurements(button);
					expect(
						result.text,
						`${palette[0]} ${await button.textContent()} hover=${hover}`,
					).toBeGreaterThanOrEqual(4.5);
					expect(result.boundary).toBeGreaterThanOrEqual(3);
				}
			}
			if (name === 'index.html') {
				const result = await measurements(
					page.locator('input[type=email]'),
				);
				expect(result.text).toBeGreaterThanOrEqual(4.5);
				expect(result.boundary).toBeGreaterThanOrEqual(3);
			}
		}
	});

	for (const colorScheme of ['light', 'dark']) {
		test(`${name}: ${colorScheme} native reading pairs`, async ({
			page,
		}) => {
			await page.emulateMedia({ colorScheme });
			await demo(page, name);
			for (const selector of [
				'body',
				'.demo',
				'pre',
				'form-required-checkboxes small',
				'.note',
				'footer',
				'.api-reference',
				'.api-reference a',
				'header a',
			]) {
				for (const element of await page.locator(selector).all())
					expect(
						await textContrast(element),
						selector,
					).toBeGreaterThanOrEqual(4.5);
			}
			const link = page.locator('header a');
			await link.dispatchEvent('mousedown');
			expect(await textContrast(link)).toBeGreaterThanOrEqual(4.5);
		});
		test(`${name}: ${colorScheme} native ButtonText/ButtonFace pairs`, async ({
			page,
			browserName,
		}) => {
			test.fail(
				process.platform === 'linux' &&
					browserName === 'webkit' &&
					colorScheme === 'dark',
				'Known bundled Ubuntu WebKit native dark ButtonText/ButtonFace contrast limitation (1.82:1); not an AA pass.',
			);
			await page.emulateMedia({ colorScheme });
			await demo(page, name);
			for (const selector of [
				'.demo-section',
				'.demo-section > p',
				'button',
				'header code',
				'.api-reference code',
			]) {
				for (const element of await page.locator(selector).all())
					expect(
						await textContrast(element),
						selector,
					).toBeGreaterThanOrEqual(4.5);
			}
		});
	}

	test(`${name}: keyboard focus, native validation, recovery, and reset`, async ({
		page,
		browserName,
	}) => {
		await demo(page, name);
		const form = page.locator('form').first();
		const boxes = form.locator('input[type=checkbox]');
		const first = boxes.first();
		await first.focus();
		await page.keyboard.press('Space');
		await expect(first).toBeChecked();
		await page.keyboard.press(
			browserName === 'webkit' && process.platform === 'darwin'
				? 'Alt+Tab'
				: 'Tab',
		);
		await expect(boxes.nth(1)).toBeFocused();
		await expect(boxes.nth(1)).toHaveCSS('outline-style', 'auto');
		await form.locator('button[type=submit]').click();
		await expect(first).toBeFocused();
		expect(
			await first.evaluate((input) => input.validity.customError),
		).toBe(true);
		expect(
			await first.evaluate((input) => input.validationMessage),
		).not.toBe('');
		await expect(form.locator('.form-result')).toBeHidden();
		// Dismiss native validation UI before recovering with the keyboard.
		await page.keyboard.press('Escape');
		for (const box of (await boxes.all()).slice(
			1,
			name === 'index.html' ? 3 : 2,
		)) {
			await box.focus();
			await page.keyboard.press('Space');
			await expect(box).toBeChecked();
		}
		expect(await first.evaluate((input) => input.validity.valid)).toBe(
			true,
		);
		await form.locator('button[type=submit]').click();
		await expect(form.locator('.form-result')).toBeVisible();
		await expect(form.locator('input:checked')).toHaveCount(
			name === 'index.html' ? 3 : 2,
		);
		await form.locator('button[type=reset]').click();
		await expect(form.locator('input:checked')).toHaveCount(0);
		await expect(form.locator('.form-result')).toBeHidden();
	});

	test(`${name}: code-left/live-right stacks without page overflow at 320px and enlarged text`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1200, height: 900 });
		await demo(page, name);
		for (const pair of await page.locator('.code-demo-pair').all()) {
			const code = await pair.locator('pre').boundingBox();
			const live = await pair.locator('.demo').boundingBox();
			expect(code.x).toBeLessThan(live.x);
			expect(Math.abs(code.y - live.y)).toBeLessThan(2);
		}
		await page.setViewportSize({ width: 320, height: 700 });
		await page.addStyleTag({ content: 'html { font-size: 200%; }' });
		for (const pair of await page.locator('.code-demo-pair').all()) {
			const code = await pair.locator('pre').boundingBox();
			const live = await pair.locator('.demo').boundingBox();
			expect(code.y + code.height).toBeLessThanOrEqual(live.y);
		}
		expect(
			await page.evaluate(() => document.documentElement.scrollWidth),
		).toBeLessThanOrEqual(320);
		await expect(page.locator('button[type=submit]').first()).toBeVisible();
	});

	for (const failure of ['no JavaScript', 'module failure']) {
		test(`${name}: ${failure} retains authored group instructions and native controls`, async ({
			browser,
		}) => {
			const context = await browser.newContext({
				javaScriptEnabled: failure !== 'no JavaScript',
			});
			await routeFixture(context);
			const page = await context.newPage();
			if (failure === 'module failure') {
				await page.route('**/*.js*', (route) =>
					route.request().url().endsWith('/demo/demo.js')
						? route.continue()
						: route.abort(),
				);
			}
			await page.goto(`http://checkboxes.test/demo/${name}`);
			await expect(
				page.locator('form-required-checkboxes small'),
			).toHaveCount(0);
			await expect(page.locator('.note')).toContainText(
				'Selection-count',
			);
			for (const legend of await page.locator('legend').all())
				expect(await legend.textContent()).toMatch(/[234]/);
			await page.locator('input[type=checkbox]').first().check();
			await expect(
				page.locator('input[type=checkbox]').first(),
			).toBeChecked();
			await page.locator('button[type=reset]').first().click();
			await expect(
				page.locator('input[type=checkbox]').first(),
			).not.toBeChecked();
			if (failure === 'module failure') {
				await page.locator('button[type=submit]').first().click();
				await expect(page.locator('.form-result').first()).toBeHidden();
			}
			await context.close();
		});
	}
}

test('localized/custom notices, native earlier-field priority, and unchanged option values', async ({
	page,
}) => {
	await demo(page);
	await expect(page.locator('#form4 small')).toHaveText(
		'Pick exactly 3 colors you like',
	);
	await expect(page.locator('#form5 small')).toContainText('Elija');
	await expect(page.locator('#form6 small')).toContainText('Choisissez');
	expect(
		await page
			.locator('#form4 input')
			.evaluateAll((inputs) => inputs.map((input) => input.value)),
	).toEqual(['red', 'blue', 'green', 'yellow', 'purple']);
	await page.locator('#form4 button[type=submit]').click();
	expect(
		await page
			.locator('#form4 input')
			.first()
			.evaluate((input) => input.validationMessage),
	).toBe('You must select exactly 3 colors');
	await page.locator('#form7 button[type=submit]').click();
	await expect(page.locator('input[type=email]')).toBeFocused();
	await page.locator('input[type=email]').fill('reader@example.com');
	await page.locator('#form7 button[type=submit]').click();
	await expect(
		page.locator('#form7 input[type=checkbox]').first(),
	).toBeFocused();
	expect(
		await page.locator('#form7 fieldset').getAttribute('aria-labelledby'),
	).toContain('prefs-description');
	await expect(page.locator('#form1 fieldset')).toHaveAccessibleName(
		'Choose your top 3 skills Choose 3 from the list',
	);
	const tree = await page.locator('#form1 fieldset').ariaSnapshot();
	expect(tree).toContain(
		'group "Choose your top 3 skills Choose 3 from the list"',
	);
	for (const label of ['JavaScript', 'Python', 'Java', 'Go', 'Rust']) {
		expect(tree).toContain(`checkbox "${label}"`);
	}
});

test('forced-color emulation retains native focus and non-color feedback', async ({
	page,
	browserName,
}) => {
	test.skip(
		browserName !== 'chromium',
		'Only Chromium supports forced-color emulation here; actual OS palettes remain unverified.',
	);
	await page.emulateMedia({ forcedColors: 'active' });
	await demo(page);
	for (const checkbox of (await page.locator('#form1 input').all()).slice(
		0,
		3,
	))
		await checkbox.check();
	await page.locator('#form1 button[type=submit]').click();
	await expect(page.locator('#form1 .form-result')).toBeVisible();
	await page.locator('#form1 input').first().focus();
	await page.keyboard.press('Tab');
	await expect(page.locator('#form1 input').nth(1)).toHaveCSS(
		'outline-style',
		'auto',
	);
	for (const selector of [
		'.note',
		'.api-reference',
		'form-required-checkboxes small',
		'.form-result',
		'button',
		'footer',
	]) {
		const element = page.locator(selector).first();
		expect(await textContrast(element), selector).toBeGreaterThanOrEqual(
			4.5,
		);
		await expect(element).toHaveCSS('forced-color-adjust', 'auto');
	}
});

test('increased contrast retains full-strength supporting text and button hover pair', async ({
	page,
}) => {
	await page.emulateMedia({ contrast: 'more' });
	await demo(page);
	const footer = page.locator('footer');
	expect(
		await footer.evaluate((element) => getComputedStyle(element).color),
	).toBe(
		await page
			.locator('body')
			.evaluate((element) => getComputedStyle(element).color),
	);
	const button = page.locator('button').first();
	const resting = await button.evaluate(
		(element) => getComputedStyle(element).backgroundImage,
	);
	await button.hover();
	await expect(button).toHaveCSS('background-image', resting);
	await expect(button).toHaveCSS('text-decoration-line', 'underline');
});

test('class-only exports and demo fixture server preserve their boundaries', async ({
	page,
	request,
}) => {
	await page.goto('/demo/index.html');
	expect(
		(await request.get('http://127.0.0.1:4190/.git/config')).status(),
	).toBe(403);
	expect(
		(
			await request.get(
				'http://127.0.0.1:4190/node_modules/vitest/package.json',
			)
		).status(),
	).toBe(403);
	const response = await request.get('http://127.0.0.1:4190/demo/index.html');
	expect(response.headers()['cache-control']).toBe('no-store');
	await page.evaluate(async (path) => {
		const module = await import(path);
		window.classOnlyExport = typeof module.FormRequiredCheckboxesElement;
	}, '/index.js');
	expect(await page.evaluate(() => window.classOnlyExport)).toBe('function');
});
