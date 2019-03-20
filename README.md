# Electrify Meteor Client

[![npm](https://img.shields.io/npm/v/meteor-electrify-client.svg?logo=npm)](https://www.npmjs.com/package/meteor-electrify-client)
[![dependencies](https://img.shields.io/david/Mairu/meteor-electrify-client.svg)](https://david-dm.org/Mairu/meteor-electrify-client)

This is the client for communication with the Electron part of an electrified Meteor app,
that was created using the meteor-electrify package.

## Integrating the client

At a startup script (for client and/or server) in your meteor application run the following code.

```javascript
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { ElectrifyClient } from 'meteor-electrify-client';

export const Electrify = new ElectrifyClient(Meteor, Random);

// now you can use the Electrify api methods
```

The ElectrifyClient constructor can consume an optional options object as 3rd argument with:
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

Copyright (c) 2017-2019 Sebastian Große
Electrify originally created by Copyright (c) 2015 Anderson Arboleya