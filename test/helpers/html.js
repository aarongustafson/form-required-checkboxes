export { parseFragment } from 'parse5';

export function* elements(node) {
	if (node.tagName) yield node;
	for (const child of node.childNodes || []) yield* elements(child);
	if (node.content) yield* elements(node.content);
}

export function attribute(element, name) {
	return element.attrs.find((entry) => entry.name === name)?.value ?? null;
}
