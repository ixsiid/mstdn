/**
 * @param {IntegrationEvent} event
 * @returns {PathInfo}
 */
export default event => {
	const [method, __key] = event.routeKey.split(' ');
	const key = __key.split('/').filter(x => x);
	const path = event.rawPath.split('/').filter(x => x);
	// ステージ名を除去
	path.shift();

	const p = [];
	const k = [];
	
	for(let i = 0; i<path.length; i++) {
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

	return {
		method: method.toLowerCase(),
		path: '/' + p.join('/'),
		keys: k
	};
};
