# Rundfunk

Rundfunk is zero-conf distributed event emitter build using [polo](https://github.com/mafintosh/polo)
It's available through npm:

	npm install rundfunk

# Usage

``` js
var rundfunk = require('rundfunk');
var radio = rundfunk();

radio.on('hello', function(message) {
	console.log(message);
});

radio.emit('hello', {hello:'world'});	
```

That's it! Try running the above example in a couple of processes and you should see that it's freakin' distributed!

# License

MIT