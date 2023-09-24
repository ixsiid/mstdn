/**
 * 
 * @param {object} body 
 * @param {string} content_type
 * @param {boolean} isBase64Encoded 
 * @returns {object}
 */
const parse_body = (body, content_type, isBase64Encoded) => {
	const buffer = isBase64Encoded ? Buffer.from(body, 'base64') : undefined;
	const type = content_type.split(';')[0].replace(/\/(.*?)\+/, '/');
	console.debug(`type: ${type} [${buffer?.length}]`);
	switch (type) {
		case 'application/json':
			const json = JSON.parse(buffer?.toString() ?? body);
			console.debug(JSON.stringify(json, null, 2));
			return json;
		case 'application/x-www-form-urlencoded':
			const form = Object.fromEntries(
				(buffer?.toString() ?? body)
					.split('&')
					.map(x => x.split('=').map(x => decodeURIComponent(x)))
			);
			console.debug(JSON.stringify(form));
			return form;
		case 'multipart/form-data':
			const boundary = Buffer.from('\r\n--' + content_type.split('boundary=').pop());
			const buffer_parts = [];
			let i = boundary.length;
			while (true) {
				const sep = buffer.indexOf(boundary, i);
				if (sep < 0) break;
				buffer_parts.push(buffer.subarray(i, sep - i));
				i += sep + boundary.length + 2; // boudary後続の\r\n
			}

			const parts = buffer_parts.map(b => {
				const s = b.indexOf(Buffer.from('\r\n\r\n'));
				const header = Object.fromEntries(
					b.subarray(0, s)
						.toString()
						.split('\r\n')
						.map(x => x.split(': '))
				);

				const body = b.subarray(s + 4);

				return {
					header,
					body,
				};
			});
			console.debug(`${parts.map(x => `${JSON.stringify(x.header)};\nbody length: ${x.body.length}`)}`);
			return parts;
		default:
			const text = buffer?.toString() ?? body;
			console.debug(text.substring(0, 32));
			return text;
	}
};

/**
 * @param {object} event
 * @param {string} event.routeKey
 * @param {string} event.rawPath
 * @param {object} event.headers
 * @param {object} event.body
 * @param {boolean} event.isBase64Encoded
 * @returns {{method: "get"|"post"|"put"|"head"|"delete"|"patch"|"option", path: string, keys: Array<string>, body: object}}
 */
export const parse = event => {
	const [method, __key] = event.routeKey.split(' ');
	const key = __key.split('/').filter(x => x);
	const path = event.rawPath.split('/').filter(x => x);
	// ステージ名を除去
	path.shift();

	const p = [];
	const k = [];

	for (let i = 0; i < path.length; i++) {
		if (path[i] === key[i]) {
			p.push(path[i]);
			continue;
		}
		// プラス付きパラメーターの場合、後続をすべてキーにする
		if (key[i].match(/^\{[a-zA-Z\-_0-9]+\+\}$/)) {
			k.push(...path.slice(i));
			break;
		}
		// プラスが付かないパラメーターの場合、単一のキーとする
		if (key[i].match(/^\{[a-zA-Z\-_0-9]+\}$/)) {
			k.push(path[i]);
			continue;
		}
		throw `Unknown key: ${key[i]}, ${path[i]}`;
	}

	const body = (['post', 'put'].includes(method) && event.body) ?
		parse_body(event.body, event.headers['content-type'], event.isBase64Encoded) :
		undefined;

	return {
		method: method.toLowerCase(),
		path: '/' + p.join('/'),
		keys: k,
		body,
	};
};

export default {
	parse,
};