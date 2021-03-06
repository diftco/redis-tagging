// Generated by CoffeeScript 1.9.3

/*
Redis Tagging

The MIT License (MIT)

Copyright © 2013 Patrick Liess, http://www.tcs.de

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function() {
  var RedisInst, RedisTagging, _isArray, _isNaN, _isNumber, _isString, _template,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  RedisInst = require("redis");

  _template = require("lodash/template");

  _isNaN = require("lodash/isNaN");

  _isArray = require("lodash/isArray");

  _isNumber = require("lodash/isNumber");

  _isString = require("lodash/isString");

  RedisTagging = (function() {
    function RedisTagging(o) {
      var host, options, port, ref, ref1;
      if (o == null) {
        o = {};
      }
      this._initErrors = bind(this._initErrors, this);
      this._handleError = bind(this._handleError, this);
      this._deleteID = bind(this._deleteID, this);
      this.removebucket = bind(this.removebucket, this);
      this.buckets = bind(this.buckets, this);
      this.toptags = bind(this.toptags, this);
      this.tags = bind(this.tags, this);
      this.allids = bind(this.allids, this);
      this.remove = bind(this.remove, this);
      this.set = bind(this.set, this);
      this.get = bind(this.get, this);
      this.redisns = (o.nsprefix || "rt") + ":";
      port = o.port || 6379;
      host = o.host || "127.0.0.1";
      options = o.options || {};
      if (((ref = o.client) != null ? (ref1 = ref.constructor) != null ? ref1.name : void 0 : void 0) === "RedisClient") {
        this.redis = o.client;
      } else {
        this.redis = RedisInst.createClient(port, host, options);
      }
      this._initErrors();
    }

    RedisTagging.prototype.get = function(options, cb) {
      var ns;
      if (this._validate(options, ["bucket", "id"], cb) === false) {
        return;
      }
      ns = this.redisns + options.bucket;
      this.redis.smembers(ns + ":ID:" + options.id, (function(_this) {
        return function(err, resp) {
          var tag, tags;
          if (err) {
            _this._handleError(cb, err);
            return;
          }
          tags = (function() {
            var j, len, results;
            results = [];
            for (j = 0, len = resp.length; j < len; j++) {
              tag = resp[j];
              results.push(tag);
            }
            return results;
          })();
          cb(null, tags);
        };
      })(this));
    };

    RedisTagging.prototype.set = function(options, cb) {
      var id_index, ns;
      if (this._validate(options, ["bucket", "id", "score", "tags"], cb) === false) {
        return;
      }
      ns = this.redisns + options.bucket;
      id_index = ns + ':ID:' + options.id;
      this._deleteID(ns, options.id, (function(_this) {
        return function(mc) {
          var j, len, ref, tag;
          ref = options.tags;
          for (j = 0, len = ref.length; j < len; j++) {
            tag = ref[j];
            mc.push(['zincrby', ns + ':TAGCOUNT', 1, tag]);
            mc.push(['sadd', id_index, tag]);
            mc.push(['zadd', ns + ':TAGS:' + tag, options.score, options.id]);
          }
          if (options.tags.length) {
            mc.push(['sadd', ns + ':IDS', options.id]);
          }
          if (mc.length === 0) {
            cb(null, true);
            return;
          }
          _this.redis.multi(mc).exec(function(err, resp) {
            if (err) {
              _this._handleError(cb, err);
              return;
            }
            cb(null, true);
          });
        };
      })(this));
    };

    RedisTagging.prototype.remove = function(options, cb) {
      options.tags = [];
      this.set(options, cb);
    };

    RedisTagging.prototype.allids = function(options, cb) {
      var ns;
      if (this._validate(options, ["bucket"], cb) === false) {
        return;
      }
      ns = this.redisns + options.bucket;
      this.redis.smembers(ns + ":IDS", (function(_this) {
        return function(err, resp) {
          if (err) {
            _this._handleError(cb, err);
            return;
          }
          cb(null, resp);
        };
      })(this));
    };

    RedisTagging.prototype.tags = function(options, cb) {
      var _keys, lastelement, mc, ns, prefix, resultkey, rndkey, tag, tagsresult;
      if (this._validate(options, ["bucket", "tags", "offset", "limit", "withscores", "type", "order"], cb) === false) {
        return;
      }
      ns = this.redisns + options.bucket;
      prefix = ns + ':TAGS:';
      lastelement = options.offset + options.limit - 1;
      mc = [];
      if (options.tags.length === 0) {
        cb(null, {
          total_items: 0,
          items: [],
          limit: options.limit,
          offset: options.offset
        });
        return;
      }
      if (options.tags.length > 1) {
        rndkey = ns + (new Date().getTime()) + '_' + Math.floor(Math.random() * 9999999999);
        _keys = (function() {
          var j, len, ref, results;
          ref = options.tags;
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            tag = ref[j];
            results.push(prefix + tag);
          }
          return results;
        })();
        mc.push(['z' + options.type + 'store', rndkey, _keys.length].concat(_keys).concat(['AGGREGATE', 'MIN']));
        if (options.limit > 0) {
          resultkey = rndkey;
        }
      } else if (options.tags.length === 1) {
        mc.push(['zcard', prefix + options.tags[0]]);
        if (options.limit > 0) {
          resultkey = prefix + options.tags[0];
        }
      }
      if (options.limit > 0) {
        tagsresult = ['z' + options.order + 'range', resultkey, options.offset, lastelement];
        if (options.withscores) {
          tagsresult = tagsresult.concat(['WITHSCORES']);
        }
        mc.push(tagsresult);
      }
      if (options.tags.length > 1) {
        mc.push(['del', rndkey]);
      }
      this.redis.multi(mc).exec((function(_this) {
        return function(err, resp) {
          var e, i, rows;
          if (err) {
            _this._handleError(cb, err);
            return;
          }
          if (options.limit === 0) {
            rows = [];
          } else {
            rows = resp[1];
          }
          if (rows.length && options.withscores) {
            rows = (function() {
              var j, len, results;
              results = [];
              for (i = j = 0, len = rows.length; j < len; i = j += 2) {
                e = rows[i];
                results.push({
                  id: e,
                  score: rows[i + 1]
                });
              }
              return results;
            })();
          }
          cb(null, {
            total_items: resp[0],
            items: rows,
            limit: options.limit,
            offset: options.offset
          });
        };
      })(this));
    };

    RedisTagging.prototype.toptags = function(options, cb) {
      var mc, ns, rediskey;
      if (this._validate(options, ["bucket", "amount"], cb) === false) {
        return;
      }
      ns = this.redisns + options.bucket;
      options.amount = options.amount - 1;
      rediskey = ns + ':TAGCOUNT';
      mc = [["zcard", rediskey], ["zrevrange", rediskey, 0, options.amount, "WITHSCORES"]];
      this.redis.multi(mc).exec((function(_this) {
        return function(err, resp) {
          var e, i, rows;
          if (err) {
            _this._handleError(cb, err);
            return;
          }
          rows = (function() {
            var j, len, ref, results;
            ref = resp[1];
            results = [];
            for (i = j = 0, len = ref.length; j < len; i = j += 2) {
              e = ref[i];
              results.push({
                tag: e,
                count: Number(resp[1][i + 1])
              });
            }
            return results;
          })();
          cb(null, {
            total_items: resp[0],
            items: rows
          });
        };
      })(this));
    };

    RedisTagging.prototype.buckets = function(cb) {
      this.redis.keys(this.redisns + "*" + ":TAGCOUNT", (function(_this) {
        return function(err, resp) {
          var e, o;
          if (err) {
            _this._handleError(cb, err);
            return;
          }
          o = (function() {
            var j, len, results;
            results = [];
            for (j = 0, len = resp.length; j < len; j++) {
              e = resp[j];
              results.push(e.substr(this.redisns.length, e.length - this.redisns.length - ":TAGCOUNT".length));
            }
            return results;
          }).call(_this);
          cb(null, o);
        };
      })(this));
    };

    RedisTagging.prototype.removebucket = function(options, cb) {
      var mc, ns;
      if (this._validate(options, ["bucket"], cb) === false) {
        return;
      }
      ns = this.redisns + options.bucket;
      mc = [["smembers", ns + ":IDS"], ["zrange", ns + ":TAGCOUNT", 0, -1]];
      this.redis.multi(mc).exec((function(_this) {
        return function(err, resp) {
          var e, j, k, len, len1, ref, ref1, rkeys;
          if (err) {
            _this._handleError(cb, err);
            return;
          }
          rkeys = [ns + ":IDS", ns + ":TAGCOUNT"];
          ref = resp[0];
          for (j = 0, len = ref.length; j < len; j++) {
            e = ref[j];
            rkeys.push(ns + ":ID:" + e);
          }
          ref1 = resp[1];
          for (k = 0, len1 = ref1.length; k < len1; k++) {
            e = ref1[k];
            rkeys.push(ns + ":TAGS:" + e);
          }
          _this.redis.del(rkeys, function(err, resp) {
            cb(null, true);
          });
        };
      })(this));
    };

    RedisTagging.prototype._deleteID = function(ns, id, cb) {
      var id_index, mc;
      mc = [];
      id_index = ns + ':ID:' + id;
      this.redis.smembers(id_index, (function(_this) {
        return function(err, resp) {
          var j, len, tag;
          if (resp.length) {
            for (j = 0, len = resp.length; j < len; j++) {
              tag = resp[j];
              mc.push(['zincrby', ns + ':TAGCOUNT', -1, tag]);
              mc.push(['zrem', ns + ':TAGS:' + tag, id]);
            }
            mc.push(['del', id_index]);
            mc.push(['srem', ns + ':IDS', id]);
            mc.push(['zremrangebyscore', ns + ':TAGCOUNT', 0, 0]);
          }
          cb(mc);
        };
      })(this));
    };

    RedisTagging.prototype._handleError = function(cb, err, data) {
      var _err, ref;
      if (data == null) {
        data = {};
      }
      if (_isString(err)) {
        _err = new Error();
        _err.name = err;
        _err.message = ((ref = this._ERRORS) != null ? typeof ref[err] === "function" ? ref[err](data) : void 0 : void 0) || "unkown";
      } else {
        _err = err;
      }
      cb(_err);
    };

    RedisTagging.prototype._initErrors = function() {
      var key, msg, ref;
      this._ERRORS = {};
      ref = this.ERRORS;
      for (key in ref) {
        msg = ref[key];
        this._ERRORS[key] = _template(msg);
      }
    };

    RedisTagging.prototype._VALID = {
      bucket: /^([a-zA-Z0-9_-]){1,80}$/
    };

    RedisTagging.prototype._validate = function(o, items, cb) {
      var item, j, len;
      for (j = 0, len = items.length; j < len; j++) {
        item = items[j];
        switch (item) {
          case "bucket":
          case "id":
          case "tags":
            if (!o[item]) {
              this._handleError(cb, "missingParameter", {
                item: item
              });
              return false;
            }
            break;
          case "score":
            o[item] = parseInt(o[item] || 0, 10);
            break;
          case "limit":
            if (!_isNumber(o[item]) || _isNaN(o[item])) {
              o[item] = 100;
            }
            o[item] = Math.abs(parseInt(o[item], 10));
            break;
          case "offset":
          case "withscores":
          case "amount":
            o[item] = Math.abs(parseInt(o[item] || 0, 10));
            break;
          case "order":
            o[item] = o[item] === "asc" ? "" : "rev";
            break;
          case "type":
            if (o[item] && o[item].toLowerCase() === "union") {
              o[item] = "union";
            } else {
              o[item] = "inter";
            }
        }
        switch (item) {
          case "bucket":
            o[item] = o[item].toString();
            if (!this._VALID[item].test(o[item])) {
              this._handleError(cb, "invalidFormat", {
                item: item
              });
              return false;
            }
            break;
          case "id":
            o[item] = o[item].toString();
            if (!o[item].length) {
              this._handleError(cb, "missingParameter", {
                item: item
              });
              return false;
            }
            break;
          case "score":
          case "limit":
          case "offset":
          case "withscores":
          case "amount":
            if (_isNaN(o[item])) {
              this._handleError(cb, "invalidFormat", {
                item: item
              });
              return false;
            }
            break;
          case "tags":
            if (!_isArray(o[item])) {
              this._handleError(cb, "invalidFormat", {
                item: item
              });
              return false;
            }
        }
      }
      return o;
    };

    RedisTagging.prototype.ERRORS = {
      "missingParameter": "No <%= item %> supplied",
      "invalidFormat": "Invalid <%= item %> format"
    };

    return RedisTagging;

  })();

  module.exports = RedisTagging;

}).call(this);
