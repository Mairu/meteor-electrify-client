/* global Meteor */
/* global _ */
const simpleRandom = require('simple-random');

let SockJS;
const callbacks = {};
const startupCallbacks = {
  server: [],
  client: [],
};

if (Meteor.isServer) {
  SockJS = require('sockjs-client');

  Meteor.methods({
    'electrify.get.socket.port'() {
      return process.env.SOCKET_PORT || null;
    },
  });
} else {
  SockJS = require('sockjs-client/dist/sockjs.js');
}

let settings;

const defaultOptions = {
  connectionWarning: true,
};

class ElectrifyClient {
  constructor(options) {
    settings = _.extend({}, defaultOptions, options);
    this.where = Meteor.isServer ? 'server' : 'client';
    this.connected = false;

    const log = (...args) => {
      console.log(`electrify:meteor:index@${this.where}:`, args.join(' '));
    };

    const fireReadyCallbacks = () => {
      startupCallbacks[this.where].forEach(ready => {
        ready();
      });
      startupCallbacks[this.where] = [];
    };

    const connect = (port) => {
      if (!port) {
        if (settings.connectionWarning) {
          log([
            'cannot initialize connection. Did you `npm install -g electrify`?',
            'install it and try running your meteor app with `electrify` npm command',
          ].join('\n'));
        }
        return;
      }

      this.socket = new SockJS(`http://127.0.0.1:${port}/electrify`);

      this.socket.onopen = () => {
        log('connection is open');
        fireReadyCallbacks();
        this.connected = true;
      };

      this.socket.onmessage = e => {
        const packet = JSON.parse(e.data);
        const done = callbacks[packet.handshake];

        if (done) {
          callbacks[packet.handshake] = null;
          delete callbacks[packet.handshake];
          done.apply(null, [].concat(packet.error, packet.args));
        } else {
          done.apply(null, [
            `No callback defined for handshake \`${packet.handshake}\``,
          ]);
        }
      };

      this.socket.onclose = () => {
        log('closing socket connection');
      };
    };

    if (Meteor.isServer) {
      connect(process.env.SOCKET_PORT);
    } else if (Meteor.isClient) {
      Meteor.call('electrify.get.socket.port', [], (error, port) => {
        connect(port);
      });
    }
  }

  startup(ready) {
    if (this.connected) {
      if (!this.socket) {
        console.warn('Socket connection already closed');
        return;
      }
      ready();
    } else {
      startupCallbacks[this.where].push(ready);
    }
  }

  call(method, args, done) {
    if (!(done instanceof Function)) {
      throw new Error('Third argument to `Electrify.call()` must be a function');
    }

    if (!this.socket) {
      const msg = 'Cannot call methods, socket connection not initialized';
      console.warn(msg);
      setTimeout(() => {
        done(new Error(msg));
      }, 1);
      return;
    }

    const packet = {
      // TODO: Use 'meteor/random' if possible in the future
      handshake: simpleRandom({ length: 24 }),
      method,
      args,
    };

    callbacks[packet.handshake] = done;
    this.socket.send(JSON.stringify(packet));
  }
}

export { ElectrifyClient };
