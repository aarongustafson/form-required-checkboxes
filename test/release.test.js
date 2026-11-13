import { execFileSync } from 'node:child_process';
import {
	copyFileSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { it, expect } from 'vitest';

it('retains publishing automation and updates displayed and executed ESM pins', () => {
	const root = join(dirname(fileURLToPath(import.meta.url)), '..');
	const fixture = join(root, `.release-test-fixture-${process.pid}`);
	mkdirSync(fixture);
	try {
		mkdirSync(join(fixture, 'scripts'));
		mkdirSync(join(fixture, 'demo'));
		const pkg = JSON.parse(
			readFileSync(join(root, 'package.json'), 'utf8'),
		);
		expect(pkg.scripts.version).toBe(
			'node scripts/update-demo-versions.js && git add demo/esm.html',
		);
		expect(pkg.scripts.postversion).toBe('git push --follow-tags');
		pkg.version = '9.8.7';
		writeFileSync(join(fixture, 'package.json'), JSON.stringify(pkg));
		for (const path of ['scripts/update-demo-versions.js', 'demo/esm.html'])
			copyFileSync(join(root, path), join(fixture, path));
		execFileSync(process.execPath, ['scripts/update-demo-versions.js'], {
			cwd: fixture,
		});
		expect(
			readFileSync(join(fixture, 'demo/esm.html'), 'utf8').match(
				/form-required-checkboxes@9\.8\.7\//g,
			),
		).toHaveLength(2);
	} finally {
		rmSync(fixture, { recursive: true, force: true });
	}
});
