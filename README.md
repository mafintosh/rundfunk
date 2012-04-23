# Rundfunk

Rundfunk is zero-conf distributed pubsub build using [polo](https://github.com/mafintosh/polo) and http
It's available through npm:

	npm install rundfunk

# Usage

``` js
var rundfunk = require('rundfunk');
var funk = rundfunk();

funk.subscribe('hello', function(message) {
	console.log(message);
});

// wait a bit and then publish something

setTimeout(function() {
	funk.publish('hello', {hello:'world'});	
}, 100);
```

That's it! Try running the above example in a couple of processes and you should see that it's freakin' distributed!

# License

MIT