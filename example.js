var rundfunk = require('rundfunk');
var radio = rundfunk();

radio.on('hello', function(from, world) {
	console.log(from, 'says hello', world);
});
radio.emit('hello', ''+process.pid, 'world');