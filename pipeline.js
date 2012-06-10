var request = require('request');
var noop    = function() {};

var queue = {};
var pipeline = function(url, data, callback) {
	var queued = queue[url];

	if (queued) {
		(queued.data = queued.data || []).push(data);
		(queued.fn = queued.fn || []).push(callback);
		return;
	}
	queued = queue[url] = {};
	request.post(url, {json:data, pool:{maxSockets:1}}, function(err, res, body) {
		err = err || !res.headers['x-pipeline'] && new Error('pipeline is not supported');
		delete queue[url];
		(callback || noop)(err, body, res);
		if (!queued.data) return;
		pipeline(url, queued.data, function(err, body, res) {
			queued.fn.forEach(function(callback, i) {
				(callback || noop)(err, body && body[i], res);
			});
		});
	}).start();
};

pipeline.fn = function(fn) {
	this.setHeader('X-Pipeline', 'true');
	this.json(Array.isArray(this.request.json) ? this.request.json.map(fn) : fn(this.request.json));
};

module.exports = pipeline;