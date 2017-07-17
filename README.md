# Electrify Meteor Client

This is the client for communication with an the Electron part of an electrified app.

## Integrating the client

At a startup script (for client and/or server) in your meteor application run the following code.

```javascript
import { ElectrifyClient } from 'meteor-electrify-client';

export const Electrify = new ElectrifyClient();

// now you can use the Electrify api methods
```

The ElectrifyClient constructor can consume an optional options object with:
 * **connectionWarning (boolean)**
   
   Show a warning if the meteor application is run without electrify/Electron.
   Defaults to true.

## Using the client

Then, in your Meteor code (client and server), you can call this method like:

````javascript
import { Electrify } from './file/where/electrify/is/exported.js';

// Electrify.call(method_name, args, done_callback);
Electrify.call('hello.world', ['anderson', 'arboleya'], function(err, msg) {
  console.log(msg); // Hello anderson arboleya!
});
````

> **IMPORTANT**
> 
> You can only call methods after the connection is made between Meteor and
> Electron, to make sure it's ready you can wrap your code in a startup block:
> 
> ````javascript
> Electrify.startup(function(){
>   Electrify.call(...);
> });
> ````

If you want to run your Meteor application electrified and as server version,
you can check if it is running inside electron.

```javascript
if (Electrify.connected) {
  Electrify.call(...);
}
```

## License

The MIT License (MIT)

Copyright (c) 2017 Sebastian Große
Electrify originally created by Copyright (c) 2015 Anderson Arboleya