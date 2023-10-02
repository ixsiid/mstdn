export default (event, auth, args) => ({
	GET: [],
	POST: undefined,
	DELETE: undefined
})[event.httpMethod];
