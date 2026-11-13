import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { it, expect } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(resolve(root, path), 'utf8');

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
		'translations.js',
		'custom-elements.json',
	]) {
		expect(pkg.files).toContain(file);
		await expect(read(file)).resolves.toBeTruthy();
	}
	expect(pkg.exports['.'].types).toBe('./form-required-checkboxes.d.ts');
	expect(pkg.exports['./define.js'].import).toBe('./define.js');
	const manifest = JSON.parse(await read('custom-elements.json'));
	const declaration = manifest.modules
		.find((module) => module.path === 'form-required-checkboxes.js')
		.declarations.find(
			(entry) => entry.name === 'FormRequiredCheckboxesElement',
		);
	expect(
		declaration.attributes.map((attribute) => attribute.name).sort(),
	).toEqual(['error', 'lang', 'notice', 'required']);
});
