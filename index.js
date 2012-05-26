var polo = require('polo');
var root = require('root');
var request = require('request');
var common = require('common');
var noop = function() {};

var create = function() {
	var that = {};
	var app = root();
	var repo = polo();
	var onready = common.future();
	var subscriptions = {};
	var own = {};

	app.use(root.json);
	app.fn('response.ack', function() {
		this.json({ack:true});
	});
	app.post('/subscribe', function(req, res) {
		req.json.events.forEach(function(event) {
			(subscriptions[event] = subscriptions[event] || {})[req.json.address] = 1;
		});
		res.ack();
	});
	app.post('/publish', function(req, res) {
		(own[req.json.event] || []).forEach(function(fn) {
			fn(req.json.data);
		});
		res.ack();
	});

	that.subscribe = function(name, fn) {
		(own[name] = own[name] || []).push(fn);

		onready.get(function(me) {
			repo.all('event-pipe').forEach(function(service) {
				request.post({
					url: 'http://'+service.address+'/subscribe',
					json: {events: [name], address: me}
				}, noop);
			});
		});
	};
	that.broadcast = function(name, obj) {
		onready.get(function() {
			Object.keys(subscriptions[name] || {}).forEach(function(address) {
				request.post({
					url: 'http://'+address+'/publish',
					json: {event: name, data: obj}
				}, noop);
			});
		});
	};

	repo.on('event-pipe/up', function(service) {
		onready.get(function(me) {
			request.post({
				url: 'http://'+service.address+'/subscribe',
				json: {events: Object.keys(own), address: me}
			}, noop);
		});
	});
	repo.on('event-pipe/down', function(service) {
		Object.keys(subscriptions).forEach(function(event) {
			delete subscriptions[event][server.address];

			if (!Object.keys(subscriptions[event]).length) delete subscriptions[event];
		});
	});

	var env = process.env;

	process.env = {};
	app.listen(function(port) {
		onready.put(repo.put('event-pipe', port).address);
	});
	process.env = env;

	return that;
};

module.exports = create;