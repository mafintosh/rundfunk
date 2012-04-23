var rundfunk = require('./index');
var funk = rundfunk();

funk.subscribe('meh', function(doc) {
	console.log(doc);
});

setTimeout(function() {
	funk.broadcast('meh', {hello:'world', time:Date.now()});
}, 100);