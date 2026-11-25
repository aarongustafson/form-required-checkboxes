import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { it, expect } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(resolve(root, path), 'utf8');

it('trims block-edge margins inside demo sections', async () => {
	expect(await read('demo/demo-shell.css')).toMatch(
		/\.demo-section(?:,\s*\.api-reference)?\s*\{[^}]*\bmargin-trim:\s*block;/,
	);
});

it('keeps behavior-only runtime free of palette/focus overrides', async () => {
	const source = await read('form-required-checkboxes.js');
	expect(source).not.toMatch(
		/createElement\(['"]style|attachShadow|\.style\.|forced-color-adjust|innerHTML/,
	);
});

it('all import pages retain authored status, fallback instructions, code/live pairs and credits', async () => {
	for (const name of ['index', 'esm', 'unpkg']) {
		const html = await read(`demo/${name}.html`);
		for (const marker of [
			'class="code-demo-pair"',
			'class="demo"',
			'role="status"',
			'Selection-count',
			'validate selections on the server',
			'<footer>',
			'./demo.js',
		]) {
			expect(html.replace(/\s+/g, ' '), `${name}: ${marker}`).toContain(
				marker,
			);
		}
		expect(html).not.toContain('alert(');
	}
});

it('preserves the published file list, declarations and registration exports', async () => {
	const pkg = JSON.parse(await read('package.json'));
	for (const file of [
		'form-required-checkboxes.js',
		'form-required-checkboxes.d.ts',
		'index.js',
		'define.js',
		'define.d.ts',
		'translations.js',
		'custom-elements.json',
	]) {
		expect(pkg.files).toContain(file);
		await expect(read(file)).resolves.toBeTruthy();
	}
	expect(pkg.exports['.'].types).toBe('./form-required-checkboxes.d.ts');
	expect(pkg.exports['./define.js'].import).toBe('./define.js');
	expect(pkg.exports['./define.js'].types).toBe('./define.d.ts');
	const manifest = JSON.parse(await read('custom-elements.json'));
	const declaration = manifest.modules
		.find((module) => module.path === 'form-required-checkboxes.js')
		.declarations.find(
			(entry) => entry.name === 'FormRequiredCheckboxesElement',
		);
	expect(
		declaration.attributes.map((attribute) => attribute.name).sort(),
	).toEqual([
		'error',
		'error-message',
		'lang',
		'notice',
		'notice-message',
		'required',
	]);
});

it('gives each authored example its own unique fragment destination', async () => {
	for (const name of ['index', 'esm', 'unpkg']) {
		const template = document.createElement('template');
		template.innerHTML = await read(`demo/${name}.html`);
		const ids = [...template.content.querySelectorAll('[id]')].map(
			(element) => element.id,
		);
		expect(new Set(ids).size, name).toBe(ids.length);
		for (const pair of template.content.querySelectorAll(
			'.code-demo-pair',
		)) {
			const example = pair.closest('.demo-section');
			expect(example?.id, `${name}: individual example`).toBeTruthy();
			expect(example.querySelector('h2, h3'), name).not.toBeNull();
		}
	}
});

it('keeps every code/live pair in a permanent linear tabs host with authored controls', async () => {
	for (const name of ['index', 'esm', 'unpkg']) {
		const template = document.createElement('template');
		template.innerHTML = await read(`demo/${name}.html`);
		expect(
			template.content.querySelector('header #demo-tabs-controls button'),
			name,
		).not.toBeNull();
		expect(
			template.content.querySelector('header #demo-tabs-status'),
			name,
		).not.toBeNull();
		for (const pair of template.content.querySelectorAll(
			'.code-demo-pair',
		)) {
			expect(
				pair.parentElement.querySelector(':scope > h2, :scope > h3'),
				`${name}: example heading for the shared loader`,
			).not.toBeNull();
			const host = pair.querySelector(
				':scope > tabbed-interface[data-demo-tabs]',
			);
			expect(host, `${name}: permanent host`).not.toBeNull();
			expect(host.getAttribute('presentation')).toBe('linear');
			expect(
				[...host.children].map(
					(child) =>
						child.getAttribute('data-demo-tab') || child.className,
				),
			).toEqual(['code', 'code-panel', 'live', 'demo']);
			for (const heading of host.querySelectorAll('[data-demo-tab]')) {
				expect(heading.hidden).toBe(true);
			}
		}
	}
});

it('keeps snippets focused while leaving complete live checkbox groups', async () => {
	for (const name of ['index', 'esm', 'unpkg']) {
		const template = document.createElement('template');
		template.innerHTML = await read(`demo/${name}.html`);
		for (const code of template.content.querySelectorAll('pre code')) {
			const snippet = document.createElement('template');
			snippet.innerHTML = code.textContent;
			expect(snippet.content.querySelector('.form-result')).toBeNull();
			expect(snippet.content.querySelector('form[id]')).toBeNull();
			const language = code.closest('pre').getAttribute('lang');
			if (language) {
				expect(snippet.content.querySelector('[lang]')).toBeNull();
				expect(snippet.content.querySelector('form')).toBeNull();
				expect(code.closest('pre').getAttribute('data-language')).toBe(
					'html',
				);
				expect(
					code
						.closest('.code-demo-pair')
						.querySelector('.demo')
						.getAttribute('lang'),
				).toBe(language);
			}
			for (const group of snippet.content.querySelectorAll(
				'form-required-checkboxes',
			)) {
				expect(
					group.querySelectorAll('input[type="checkbox"]').length,
				).toBeLessThanOrEqual(2);
				expect(group.querySelector('legend')).not.toBeNull();
			}
		}
	}
});
