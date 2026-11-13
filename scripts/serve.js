import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const types = new Map([
	['.css', 'text/css'],
	['.html', 'text/html'],
	['.js', 'text/javascript'],
	['.json', 'application/json'],
]);
const port = Number(process.env.PORT || 4190);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
	throw new Error('PORT must be an integer between 1 and 65535.');
}

createServer(async (request, response) => {
	response.setHeader('cache-control', 'no-store');
	response.setHeader('x-content-type-options', 'nosniff');
	if (!['GET', 'HEAD'].includes(request.method)) {
		response.writeHead(405, { allow: 'GET, HEAD' }).end();
		return;
	}
	try {
		const pathname = decodeURIComponent(
			new URL(request.url, 'http://localhost').pathname,
		);
		const path = pathname === '/' ? '/demo/index.html' : pathname;
		if (
			path
				.split('/')
				.some(
					(part) => part.startsWith('.') || part === 'node_modules',
				) ||
			!types.has(extname(path))
		) {
			response.writeHead(403).end();
			return;
		}
		const file = await realpath(resolve(root, `.${path}`));
		if (!file.startsWith(`${root}${sep}`)) {
			response.writeHead(403).end();
			return;
		}
		if (!(await stat(file)).isFile()) {
			response.writeHead(404).end();
			return;
		}
		response.writeHead(200, { 'content-type': types.get(extname(file)) });
		if (request.method === 'HEAD') response.end();
		else
			createReadStream(file)
				.on('error', () => response.destroy())
				.pipe(response);
	} catch (error) {
		response.writeHead(error instanceof URIError ? 400 : 404).end();
	}
}).listen(port, '127.0.0.1', () => {
	console.log(`No-cache preview: http://127.0.0.1:${port}/demo/`);
});
