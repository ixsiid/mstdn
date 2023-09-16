export default (event, args) => ({
	GET: [],
	POST: undefined,
	DELETE: undefined
})[event.httpMethod];
