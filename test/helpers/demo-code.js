import { createHash } from 'node:crypto';

export const parseCode = (html) =>
	new DOMParser().parseFromString(
		(html.match(/<pre\b[^>]*>[\s\S]*?<\/pre>/g) || []).join(''),
		'text/html',
	);

export const codeTextHashes = (html) =>
	[...parseCode(html).querySelectorAll('pre code')].map((code) =>
		createHash('sha256')
			.update(
				code.textContent.replace(
					/(https:\/\/esm\.sh\/@aarongustafson\/form-required-checkboxes@)\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?(?=\/form-required-checkboxes\.js\b)/g,
					'$1<release-version>',
				),
			)
			.digest('hex'),
	);

export const componentSnippets = (text) =>
	[
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
