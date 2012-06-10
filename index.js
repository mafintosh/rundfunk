var root     = require('root');
var polo     = require('polo');
var pipeline = require('./pipeline');

module.exports = function() {
	var emitter = new process.EventEmitter();

	var app = root();
	var repo = polo();
	var listening = {};
	var emitting = {};
	var readys = [];
	var me;

	var ready = function(fn) {
		if (!readys) return fn();
		readys.push(fn);
	};
	var remove = function(arr, item) {
		item = arr.indexOf(item);
		if (item === -1) return;
		arr.splice(item, 1);
	};
	var all = function() {
		return repo.all('rundfunk').filter(function(service) {
			return service !== me;
		}).map(function(service) {
			return 'http://'+service.address;
		});
	};

	emitter.on('newListener', function(name) {
		ready(function() {
			listening[name] = {event:name,listener:'http://'+me.address};
			all().forEach(function(host) {
				pipeline(host+'/listen', listening[name]);
			});
		});
	});
	emitter.emit = function(name) {
		var data = Array.prototype.slice.call(arguments, 1);

		ready(function() {
			emitting[name] = emitting[name] || all();
			emitting[name].forEach(function(host) {
				pipeline(host+'/emit', {event:name,data:data}, function(err, body) {
					if (err || body) return;
					remove(emitting[name], host);
				});
			});
		});
		return process.EventEmitter.prototype.emit.apply(emitter, arguments);
	};

	app.use(root.json);
	app.fn('response.pipeline', pipeline.fn);

	app.post('/listen', function(req, res) {
		res.pipeline(function(body) {
			var evt = body.event;
			var listener = body.listener;

			if (!emitting[evt]) return false;
			if (emitting[evt].indexOf(listener) > -1) return true;

			emitting[evt].push(listener);
			return true;
		});
	});
	app.post('/emit', function(req, res) {
		res.pipeline(function(body) {
			var params = [body.event];
			var data = 'data' in body ? body.data : [];

			Array.prototype.push.apply(params, Array.isArray(data) ? data : [data]);
			return process.EventEmitter.prototype.emit.apply(emitter, params);
		});
	});
	app.listen(function(port) {
		me = repo.put('rundfunk', port);
		setTimeout(function() { // lets give the instances a little time to find eachother
			readys.forEach(function(fn) {
				fn();
			});
			readys = null;
		}, 200);
	});

	repo.on('rundfunk/up', function(service) {
		ready(function() {
			var data = Object.keys(listening).map(function(evt) {
				return listening[evt];
			});

			pipeline('http://'+service.address+'/listen', data);
		});
	});
	repo.on('rundfunk/down', function(service) {
		Object.keys(emitting).forEach(function(evt) {
			remove(emitting[evt], 'http://'+service.address);
		});
	});

	return emitter;
};