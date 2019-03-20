let initialized = false;
let versions;
const clientApiVersion = '1.0';
const callbacks = {};
let startupCallbacks = [];

const initOnServer = (Meteor, callback) => {
  versions = {
    electrify: process.env.ELECTRIFY_VERSION,
    electrifyApi: process.env.ELECTRIFY_API_VERSION,
    electron: process.env.ELECTRON_VERSION,
    chrome: process.env.CHROME_VERSION,
  };

  Meteor.methods({
    'electrify.get.initOptions': () => ({
      port: process.env.SOCKET_PORT || null,
      versions,
    }),
  });

  const SockJS = require('sockjs-client');
  callback(SockJS);
};

const initOnClient = (callback) => {
  const SockJS = require('sockjs-client/dist/sockjs.js');
  callback(SockJS);
};

let settings;

const defaultOptions = {
  connectionWarning: true,
};

class ElectrifyClient {
  constructor(Meteor, handshakeIdGenerator, options) {
    if (initialized) {
      throw new Error('ElectrifyClient can only be instantiated once!');
    }
    initialized = true;

    if (typeof Meteor !== 'object' || typeof Meteor.isServer !== 'boolean') {
      throw new Error('First argument of ElectrifyClient must be the Meteor object');
    }
    if (typeof handshakeIdGenerator === 'function') {
      this.handshakeIdGenerator = handshakeIdGenerator;
    } else if (typeof handshakeIdGenerator === 'object' && typeof handshakeIdGenerator.id === 'function') {
      this.handshakeIdGenerator = () => handshakeIdGenerator.id();
    } else {
      throw new Error('Second argument of ElectrifyClient must be the Meteor Random object or function that generates a random string');
    }
    if (options !== undefined && typeof options !== 'object') {
      throw new Error('Third argument of ElectrifyClient if provided must be an object with options');
    }

    settings = { ...defaultOptions, ...options };
    this.connected = false;

    const log = (...args) => {
      console.log(`electrify:meteor:index@${this.where}:`, args.join(' '));
    };

    const fireReadyCallbacks = () => {
      startupCallbacks.forEach((ready) => {
        ready();
      });
      startupCallbacks = [];
    };

    const connect = (SockJS, port) => {
      if (!port) {
        if (settings.connectionWarning) {
          log([
            'cannot initialize connection. Did you `npm install -g meteor-electrify`?',
            'install it and try running your meteor app with `electrify` npm command',
          ].join('\n'));
        }
        return;
      }
      if (this.versions.electrifyApi !== clientApiVersion) {
        log(`Electrify API Version is not compatible with this client. 
Electrify API Version: ${this.versions.electrifyApi}
Client API Version: ${clientApiVersion}`);
        return;
      }

      this.socket = new SockJS(`http://127.0.0.1:${port}/electrify`);

      this.socket.onopen = () => {
        log('connection is open');
        fireReadyCallbacks();
        this.connected = true;
      };

      this.socket.onmessage = (e) => {
        const packet = JSON.parse(e.data);
        const done = callbacks[packet.handshake];

        if (done) {
          callbacks[packet.handshake] = null;
          delete callbacks[packet.handshake];
          done(packet.error, packet.args);
        } else {
          done(`No callback defined for handshake \`${packet.handshake}\``);
        }
      };

      this.socket.onclose = () => {
        log('closing socket connection');
      };
    };

    if (Meteor.isServer) {
      initOnServer(Meteor, (SockJS) => {
        this.versions = versions;
        connect(SockJS, process.env.SOCKET_PORT);
      });
    } else if (Meteor.isClient) {
      initOnClient((SockJS) => {
        Meteor.call('electrify.get.initOptions', [], (error, initOptions) => {
          this.versions = initOptions.versions;
          connect(SockJS, initOptions.port);
        });
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
      startupCallbacks.push(ready);
    }
  }

  call(method, args, done) {
    if (typeof done !== 'function') {
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
      handshake: this.handshakeIdGenerator(),
      method,
      args,
    };

    callbacks[packet.handshake] = done;
    this.socket.send(JSON.stringify(packet));
  }
}

export { ElectrifyClient };
