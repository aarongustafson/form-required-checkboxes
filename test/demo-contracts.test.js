import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { it, expect } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(resolve(root, path), 'utf8');
const parseCode = (html) =>
	new DOMParser().parseFromString(
		(html.match(/<pre\b[^>]*>[\s\S]*?<\/pre>/g) || []).join(''),
		'text/html',
	);

// Capture the original displayed code, including its whitespace, before marking it.
const displayedCodeHashes = {
	index: [
		'8d2de977d65c54a14096f70b37a766dc33af42b7409a472b69372e2f9336c44b',
		'394bb2563f26d8bde9eece742c32db41e923b1de969428056ea4fa9cd179fd25',
		'fcd27ec17013f847392832980fbef433eb81c51a61549bfcc31dbd840b3e96ec',
		'8b76cc99efb52c666f22242f404b6ccdd3c0ef3bf1cad060b9f2921c32c435da',
		'482fc037792fae46fa71823a6e459c247a8899ce11fc78e1871ef85c6d3ae865',
		'408bd15077ef906588b45e91e6e974f449f224ea70aef3739ade6dcbb501a7bc',
		'21833bd70d249c6bfbdaab63f914d87bacf7c6bb6ab685971d6bf6b9647772fe',
	],
	esm: ['a044f25146c3c84a5f978f1ef03c15fa4c25eff38bf6387196265e91ac4d553f'],
	unpkg: ['5dde933b989758c99a5efdc25cb96be63cb7ccbd09a44ea41066348e65db1b92'],
};

it.each(Object.keys(displayedCodeHashes))(
	'%s: preserves exact displayed code text',
	async (name) => {
		const document = parseCode(await read(`demo/${name}.html`));
		expect(
			[...document.querySelectorAll('pre code')].map((code) =>
				createHash('sha256').update(code.textContent).digest('hex'),
			),
		).toEqual(displayedCodeHashes[name]);
	},
);

it.each(Object.keys(displayedCodeHashes))(
	'%s: marks only component tags and import/registration snippets without nesting',
	async (name) => {
		const document = parseCode(await read(`demo/${name}.html`));
		for (const code of document.querySelectorAll('pre code')) {
			const text = code.textContent;
			const snippets = [
				...text.matchAll(/<\/?form-required-checkboxes\b[^>]*>/g),
				...text.matchAll(
					/^import \{ (?:FormRequiredCheckboxesElement|defineFormRequiredCheckboxes) \} from\n[^\n]+;/gm,
				),
				...text.matchAll(
					/^if \(!customElements\.get\('form-required-checkboxes'\)\) \{[\s\S]*?^\}/gm,
				),
				...text.matchAll(/^defineFormRequiredCheckboxes\(\);/gm),
			]
				.sort((a, b) => a.index - b.index)
				.map((match) => match[0]);
			expect(snippets.length).toBeGreaterThanOrEqual(2);
			expect(
				[...code.querySelectorAll('mark')].map(
					(mark) => mark.textContent,
				),
			).toEqual(snippets);
			expect(code.querySelector('mark mark')).toBeNull();
		}
	},
);

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
