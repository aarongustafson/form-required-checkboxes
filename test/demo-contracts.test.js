import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { it, expect } from 'vitest';
import {
	parseCode,
	codeTextHashes,
	componentSnippets,
} from './helpers/demo-code.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(resolve(root, path), 'utf8');

// Preserve displayed code and whitespace, except the release-managed ESM pin.
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
	esm: ['0f060c40832933c5d2197193dba7f8b7e330777d217d2973672bfbcf2b28d505'],
	unpkg: ['5dde933b989758c99a5efdc25cb96be63cb7ccbd09a44ea41066348e65db1b92'],
};

it.each(Object.keys(displayedCodeHashes))(
	'%s: preserves displayed code text except release-managed versions',
	async (name) => {
		expect(codeTextHashes(await read(`demo/${name}.html`))).toEqual(
			displayedCodeHashes[name],
		);
	},
);

it('keeps unrelated version text, URL parts, code, and whitespace significant', () => {
	const source =
		'<pre><code>https://esm.sh/@aarongustafson/form-required-checkboxes@1.2.3/form-required-checkboxes.js?target=es2022\nOther version 1.2.3\nconst count = 3;</code></pre>';
	for (const changed of [
		source.replace('Other version 1.2.3', 'Other version 9.8.7'),
		source.replace('https://esm.sh/', 'https://unpkg.com/'),
		source.replace('@aarongustafson/', '@another-author/'),
		source.replace('/form-required-checkboxes.js?', '/index.js?'),
		source.replace('target=es2022', 'target=es2023'),
		source.replace('count = 3', 'count = 4'),
		source.replace('\nOther', '\n Other'),
	]) {
		expect(codeTextHashes(changed)).not.toEqual(codeTextHashes(source));
	}
	const unpkg = source.replace('https://esm.sh/', 'https://unpkg.com/');
	expect(codeTextHashes(unpkg.replace('@1.2.3/', '@9.8.7/'))).not.toEqual(
		codeTextHashes(unpkg),
	);
});

it.each(Object.keys(displayedCodeHashes))(
	'%s: marks only component tags and import/registration snippets without nesting',
	async (name) => {
		const document = parseCode(await read(`demo/${name}.html`));
		for (const code of document.querySelectorAll('pre code')) {
			const text = code.textContent;
			const snippets = componentSnippets(text);
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
