'use strict';

Workamajig.DEFAULT_HOST = 'api.workamajig.com';
Workamajig.DEFAULT_PORT = '443';
Workamajig.DEFAULT_BASE_PATH = '/v1/';
Workamajig.DEFAULT_API_VERSION = null;

// var WORKAMAJIG_ACCESS_TOKEN = process.env.WORKAMAJIG_ACCESS_TOKEN;
// var WORKAMAJIG_USER_TOKEN   = process.env.WORKAMAJIG_USER_TOKEN;
//
// var WORKAMAJIG_API_BASE_URL = process.env.WORKAMAJIG_API_BASE_URL;
// var WORKAMAJIG_API_VERSION  = process.env.WORKAMAJIG_API_VERSION;

// Use node's default timeout:
Workamajig.DEFAULT_TIMEOUT = require('http').createServer().timeout;

Workamajig.PACKAGE_VERSION = require('../package.json').version;

Workamajig.USER_AGENT = {
  bindings_version: Workamajig.PACKAGE_VERSION,
  lang: 'node',
  lang_version: process.version,
  platform: process.platform,
  publisher: 'workamajig',
  uname: null,
};

Workamajig.USER_AGENT_SERIALIZED = null;

var exec = require('child_process').exec;

var resources = {
  Activities: require('./resources/Activities'),
  Contacts: require('./resources/Contacts'),
  Opportunities: require('./resources/Opportunities'),
  Projects: require('./resources/Projects'),
  Timesheets: require('./resources/Timesheets'),
  Todos: require('./resources/Todos'),
  Zapier: require('./resources/Zapier'),
};

Workamajig.WorkamajigResource = require('./WorkamajigResource');
Workamajig.resources = resources;

function Workamajig(key, version) {
  if (!(this instanceof Workamajig)) {
    return new Workamajig(key, version);
  }

  this._api = {
    auth: null,
    host: Workamajig.DEFAULT_HOST,
    port: Workamajig.DEFAULT_PORT,
    basePath: Workamajig.DEFAULT_BASE_PATH,
    version: Workamajig.DEFAULT_API_VERSION,
    timeout: Workamajig.DEFAULT_TIMEOUT,
    agent: null,
    dev: false,
  };

  this._prepResources();
  this.setApiKey(key);
  this.setApiVersion(version);
}

Workamajig.prototype = {

  setHost: function(host, port, protocol) {
    this._setApiField('host', host);
    if (port) {
      this.setPort(port);
    }
    if (protocol) {
      this.setProtocol(protocol);
    }
  },

  setProtocol: function(protocol) {
    this._setApiField('protocol', protocol.toLowerCase());
  },

  setPort: function(port) {
    this._setApiField('port', port);
  },

  setApiVersion: function(version) {
    if (version) {
      this._setApiField('version', version);
    }
  },

  setApiKey: function(key) {
    if (key) {
      this._setApiField(
        'auth',
        'Basic ' + new Buffer(key + ':').toString('base64')
      );
    }
  },

  setTimeout: function(timeout) {
    this._setApiField(
      'timeout',
      timeout == null ? Workamajig.DEFAULT_TIMEOUT : timeout
    );
  },

  setHttpAgent: function(agent) {
    this._setApiField('agent', agent);
  },

  _setApiField: function(key, value) {
    this._api[key] = value;
  },

  getApiField: function(key) {
    return this._api[key];
  },

  getConstant: function(c) {
    return Workamajig[c];
  },

  // Gets a JSON version of a User-Agent and uses a cached version for a slight
  // speed advantage.
  getClientUserAgent: function(cb) {
    if (Workamajig.USER_AGENT_SERIALIZED) {
      return cb(Workamajig.USER_AGENT_SERIALIZED);
    }
    this.getClientUserAgentSeeded(Workamajig.USER_AGENT, function(cua) {
      Workamajig.USER_AGENT_SERIALIZED = cua;
      cb(Workamajig.USER_AGENT_SERIALIZED);
    })
  },

  // Gets a JSON version of a User-Agent by encoding a seeded object and
  // fetching a uname from the system.
  getClientUserAgentSeeded: function(seed, cb) {
    exec('uname -a', function(err, uname) {
      var userAgent = {};
      for (var field in seed) {
        userAgent[field] = encodeURIComponent(seed[field]);
      }

      // URI-encode in case there are unusual characters in the system's uname.
      userAgent.uname = encodeURIComponent(uname) || 'UNKNOWN';

      cb(JSON.stringify(userAgent));
    });
  },

  _prepResources: function() {
    for (var name in resources) {
      this[
        name[0].toLowerCase() + name.substring(1)
      ] = new resources[name](this);
    }
  },

};

module.exports = Workamajig;
// expose constructor as a named property to enable mocking with Sinon.JS
module.exports.Workamajig = Workamajig;