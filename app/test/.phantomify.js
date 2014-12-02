(function () {
    var call = Function.prototype.call;
    var prototypeOfArray = Array.prototype;
    var prototypeOfObject = Object.prototype;
    var slice = prototypeOfArray.slice;

    if (!Function.prototype.bind) {
      Function.prototype.bind = function bind(that) { // .length is 1
          // 1. Let Target be the this value.
          var target = this;
          // 2. If IsCallable(Target) is false, throw a TypeError exception.
          if (typeof target != "function") {
              throw new TypeError("Function.prototype.bind called on incompatible " + target);
          }
          // 3. Let A be a new (possibly empty) internal list of all of the
          // argument values provided after thisArg (arg1, arg2 etc), in order.
          // XXX slicedArgs will stand in for "A" if used
          var args = slice.call(arguments, 1); // for normal call
          // 4. Let F be a new native ECMAScript object.
          // 11. Set the [[Prototype]] internal property of F to the standard
          // built-in Function prototype object as specified in 15.3.3.1.
          // 12. Set the [[Call]] internal property of F as described in
          // 15.3.4.5.1.
          // 13. Set the [[Construct]] internal property of F as described in
          // 15.3.4.5.2.
          // 14. Set the [[HasInstance]] internal property of F as described in
          // 15.3.4.5.3.
          var bound = function () {

              if (this instanceof bound) {
                  // 15.3.4.5.2 [[Construct]]
                  // When the [[Construct]] internal method of a function object,
                  // F that was created using the bind function is called with a
                  // list of arguments ExtraArgs, the following steps are taken:
                  // 1. Let target be the value of F's [[TargetFunction]]
                  // internal property.
                  // 2. If target has no [[Construct]] internal method, a
                  // TypeError exception is thrown.
                  // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                  // property.
                  // 4. Let args be a new list containing the same values as the
                  // list boundArgs in the same order followed by the same
                  // values as the list ExtraArgs in the same order.
                  // 5. Return the result of calling the [[Construct]] internal
                  // method of target providing args as the arguments.

                  var result = target.apply(
                      this,
                      args.concat(slice.call(arguments))
                  );
                  if (Object(result) === result) {
                      return result;
                  }
                  return this;

              } else {
                  // 15.3.4.5.1 [[Call]]
                  // When the [[Call]] internal method of a function object, F,
                  // which was created using the bind function is called with a
                  // this value and a list of arguments ExtraArgs, the following
                  // steps are taken:
                  // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                  // property.
                  // 2. Let boundThis be the value of F's [[BoundThis]] internal
                  // property.
                  // 3. Let target be the value of F's [[TargetFunction]] internal
                  // property.
                  // 4. Let args be a new list containing the same values as the
                  // list boundArgs in the same order followed by the same
                  // values as the list ExtraArgs in the same order.
                  // 5. Return the result of calling the [[Call]] internal method
                  // of target providing boundThis as the this value and
                  // providing args as the arguments.

                  // equiv: target.call(this, ...boundArgs, ...args)
                  return target.apply(
                      that,
                      args.concat(slice.call(arguments))
                  );

              }

          };
          if(target.prototype) {
              bound.prototype = Object.create(target.prototype);
          }
          // XXX bound.length is never writable, so don't even try
          //
          // 15. If the [[Class]] internal property of Target is "Function", then
          // a. Let L be the length property of Target minus the length of A.
          // b. Set the length own property of F to either 0 or L, whichever is
          // larger.
          // 16. Else set the length own property of F to 0.
          // 17. Set the attributes of the length own property of F to the values
          // specified in 15.3.5.1.

          // TODO
          // 18. Set the [[Extensible]] internal property of F to true.

          // TODO
          // 19. Let thrower be the [[ThrowTypeError]] function Object (13.2.3).
          // 20. Call the [[DefineOwnProperty]] internal method of F with
          // arguments "caller", PropertyDescriptor {[[Get]]: thrower, [[Set]]:
          // thrower, [[Enumerable]]: false, [[Configurable]]: false}, and
          // false.
          // 21. Call the [[DefineOwnProperty]] internal method of F with
          // arguments "arguments", PropertyDescriptor {[[Get]]: thrower,
          // [[Set]]: thrower, [[Enumerable]]: false, [[Configurable]]: false},
          // and false.

          // TODO
          // NOTE Function objects created using Function.prototype.bind do not
          // have a prototype property or the [[Code]], [[FormalParameters]], and
          // [[Scope]] internal properties.
          // XXX can't delete prototype in pure-js.

          // 22. Return F.
          return bound;
      };
    }
  })();

var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",Function(['require','module','exports','__dirname','__filename','process','global'],"function filter (xs, fn) {\n    var res = [];\n    for (var i = 0; i < xs.length; i++) {\n        if (fn(xs[i], i, xs)) res.push(xs[i]);\n    }\n    return res;\n}\n\n// resolves . and .. elements in a path array with directory names there\n// must be no slashes, empty elements, or device names (c:\\) in the array\n// (so also no leading and trailing slashes - it does not distinguish\n// relative and absolute paths)\nfunction normalizeArray(parts, allowAboveRoot) {\n  // if the path tries to go above the root, `up` ends up > 0\n  var up = 0;\n  for (var i = parts.length; i >= 0; i--) {\n    var last = parts[i];\n    if (last == '.') {\n      parts.splice(i, 1);\n    } else if (last === '..') {\n      parts.splice(i, 1);\n      up++;\n    } else if (up) {\n      parts.splice(i, 1);\n      up--;\n    }\n  }\n\n  // if the path is allowed to go above the root, restore leading ..s\n  if (allowAboveRoot) {\n    for (; up--; up) {\n      parts.unshift('..');\n    }\n  }\n\n  return parts;\n}\n\n// Regex to split a filename into [*, dir, basename, ext]\n// posix version\nvar splitPathRe = /^(.+\\/(?!$)|\\/)?((?:.+?)?(\\.[^.]*)?)$/;\n\n// path.resolve([from ...], to)\n// posix version\nexports.resolve = function() {\nvar resolvedPath = '',\n    resolvedAbsolute = false;\n\nfor (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {\n  var path = (i >= 0)\n      ? arguments[i]\n      : process.cwd();\n\n  // Skip empty and invalid entries\n  if (typeof path !== 'string' || !path) {\n    continue;\n  }\n\n  resolvedPath = path + '/' + resolvedPath;\n  resolvedAbsolute = path.charAt(0) === '/';\n}\n\n// At this point the path should be resolved to a full absolute path, but\n// handle relative paths to be safe (might happen when process.cwd() fails)\n\n// Normalize the path\nresolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {\n    return !!p;\n  }), !resolvedAbsolute).join('/');\n\n  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';\n};\n\n// path.normalize(path)\n// posix version\nexports.normalize = function(path) {\nvar isAbsolute = path.charAt(0) === '/',\n    trailingSlash = path.slice(-1) === '/';\n\n// Normalize the path\npath = normalizeArray(filter(path.split('/'), function(p) {\n    return !!p;\n  }), !isAbsolute).join('/');\n\n  if (!path && !isAbsolute) {\n    path = '.';\n  }\n  if (path && trailingSlash) {\n    path += '/';\n  }\n  \n  return (isAbsolute ? '/' : '') + path;\n};\n\n\n// posix version\nexports.join = function() {\n  var paths = Array.prototype.slice.call(arguments, 0);\n  return exports.normalize(filter(paths, function(p, index) {\n    return p && typeof p === 'string';\n  }).join('/'));\n};\n\n\nexports.dirname = function(path) {\n  var dir = splitPathRe.exec(path)[1] || '';\n  var isWindows = false;\n  if (!dir) {\n    // No dirname\n    return '.';\n  } else if (dir.length === 1 ||\n      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {\n    // It is just a slash or a drive letter with a slash\n    return dir;\n  } else {\n    // It is a full dirname, strip trailing slash\n    return dir.substring(0, dir.length - 1);\n  }\n};\n\n\nexports.basename = function(path, ext) {\n  var f = splitPathRe.exec(path)[2] || '';\n  // TODO: make this comparison case-insensitive on windows?\n  if (ext && f.substr(-1 * ext.length) === ext) {\n    f = f.substr(0, f.length - ext.length);\n  }\n  return f;\n};\n\n\nexports.extname = function(path) {\n  return splitPathRe.exec(path)[3] || '';\n};\n\nexports.relative = function(from, to) {\n  from = exports.resolve(from).substr(1);\n  to = exports.resolve(to).substr(1);\n\n  function trim(arr) {\n    var start = 0;\n    for (; start < arr.length; start++) {\n      if (arr[start] !== '') break;\n    }\n\n    var end = arr.length - 1;\n    for (; end >= 0; end--) {\n      if (arr[end] !== '') break;\n    }\n\n    if (start > end) return [];\n    return arr.slice(start, end - start + 1);\n  }\n\n  var fromParts = trim(from.split('/'));\n  var toParts = trim(to.split('/'));\n\n  var length = Math.min(fromParts.length, toParts.length);\n  var samePartsLength = length;\n  for (var i = 0; i < length; i++) {\n    if (fromParts[i] !== toParts[i]) {\n      samePartsLength = i;\n      break;\n    }\n  }\n\n  var outputParts = [];\n  for (var i = samePartsLength; i < fromParts.length; i++) {\n    outputParts.push('..');\n  }\n\n  outputParts = outputParts.concat(toParts.slice(samePartsLength));\n\n  return outputParts.join('/');\n};\n\n//@ sourceURL=path"
));

require.define("__browserify_process",Function(['require','module','exports','__dirname','__filename','process','global'],"var process = module.exports = {};\n\nprocess.nextTick = (function () {\n    var canSetImmediate = typeof window !== 'undefined'\n        && window.setImmediate;\n    var canPost = typeof window !== 'undefined'\n        && window.postMessage && window.addEventListener\n    ;\n\n    if (canSetImmediate) {\n        return function (f) { return window.setImmediate(f) };\n    }\n\n    if (canPost) {\n        var queue = [];\n        window.addEventListener('message', function (ev) {\n            if (ev.source === window && ev.data === 'browserify-tick') {\n                ev.stopPropagation();\n                if (queue.length > 0) {\n                    var fn = queue.shift();\n                    fn();\n                }\n            }\n        }, true);\n\n        return function nextTick(fn) {\n            queue.push(fn);\n            window.postMessage('browserify-tick', '*');\n        };\n    }\n\n    return function nextTick(fn) {\n        setTimeout(fn, 0);\n    };\n})();\n\nprocess.title = 'browser';\nprocess.browser = true;\nprocess.env = {};\nprocess.argv = [];\n\nprocess.binding = function (name) {\n    if (name === 'evals') return (require)('vm')\n    else throw new Error('No such module. (Possibly not yet loaded)')\n};\n\n(function () {\n    var cwd = '/';\n    var path;\n    process.cwd = function () { return cwd };\n    process.chdir = function (dir) {\n        if (!path) path = require('path');\n        cwd = path.resolve(dir, cwd);\n    };\n})();\n\n//@ sourceURL=__browserify_process"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"index.js\"}\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/package.json"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var defined = require('defined');\nvar createDefaultStream = require('./lib/default_stream');\nvar Test = require('./lib/test');\nvar createResult = require('./lib/results');\nvar through = require('through');\n\nvar canEmitExit = typeof process !== 'undefined' && process\n    && typeof process.on === 'function' && process.browser !== true\n;\nvar canExit = typeof process !== 'undefined' && process\n    && typeof process.exit === 'function'\n;\n\nvar nextTick = typeof setImmediate !== 'undefined'\n    ? setImmediate\n    : process.nextTick\n;\n\nexports = module.exports = (function () {\n    var harness;\n    var lazyLoad = function () {\n        return getHarness().apply(this, arguments);\n    };\n    \n    lazyLoad.only = function () {\n        return getHarness().only.apply(this, arguments);\n    };\n    \n    lazyLoad.createStream = function (opts) {\n        if (!opts) opts = {};\n        if (!harness) {\n            var output = through();\n            getHarness({ stream: output, objectMode: opts.objectMode });\n            return output;\n        }\n        return harness.createStream(opts);\n    };\n    \n    return lazyLoad\n    \n    function getHarness (opts) {\n        if (!opts) opts = {};\n        opts.autoclose = !canEmitExit;\n        if (!harness) harness = createExitHarness(opts);\n        return harness;\n    }\n})();\n\nfunction createExitHarness (conf) {\n    if (!conf) conf = {};\n    var harness = createHarness({\n        autoclose: defined(conf.autoclose, false)\n    });\n    \n    var stream = harness.createStream({ objectMode: conf.objectMode });\n    var es = stream.pipe(conf.stream || createDefaultStream());\n    if (canEmitExit) {\n        es.on('error', function (err) { harness._exitCode = 1 });\n    }\n    \n    var ended = false;\n    stream.on('end', function () { ended = true });\n    \n    if (conf.exit === false) return harness;\n    if (!canEmitExit || !canExit) return harness;\n    \n    var _error;\n\n    process.on('uncaughtException', function (err) {\n        if (err && err.code === 'EPIPE' && err.errno === 'EPIPE'\n        && err.syscall === 'write') return;\n        \n        _error = err\n        \n        throw err\n    })\n\n    process.on('exit', function (code) {\n        if (_error) {\n            return\n        }\n\n        if (!ended) {\n            var only = harness._results._only;\n            for (var i = 0; i < harness._tests.length; i++) {\n                var t = harness._tests[i];\n                if (only && t.name !== only) continue;\n                t._exit();\n            }\n        }\n        harness.close();\n        process.exit(code || harness._exitCode);\n    });\n    \n    return harness;\n}\n\nexports.createHarness = createHarness;\nexports.Test = Test;\nexports.test = exports; // tap compat\nexports.test.skip = Test.skip;\n\nvar exitInterval;\n\nfunction createHarness (conf_) {\n    if (!conf_) conf_ = {};\n    var results = createResult();\n    if (conf_.autoclose !== false) {\n        results.once('done', function () { results.close() });\n    }\n    \n    var test = function (name, conf, cb) {\n        var t = new Test(name, conf, cb);\n        test._tests.push(t);\n        \n        (function inspectCode (st) {\n            st.on('test', function sub (st_) {\n                inspectCode(st_);\n            });\n            st.on('result', function (r) {\n                if (!r.ok) test._exitCode = 1\n            });\n        })(t);\n        \n        results.push(t);\n        return t;\n    };\n    test._results = results;\n    \n    test._tests = [];\n    \n    test.createStream = function (opts) {\n        return results.createStream(opts);\n    };\n    \n    var only = false;\n    test.only = function (name) {\n        if (only) throw new Error('there can only be one only test');\n        results.only(name);\n        only = true;\n        return test.apply(null, arguments);\n    };\n    test._exitCode = 0;\n    \n    test.close = function () { results.close() };\n    \n    return test;\n}\n\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/index.js"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/defined/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"index.js\"}\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/defined/package.json"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/defined/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = function () {\n    for (var i = 0; i < arguments.length; i++) {\n        if (arguments[i] !== undefined) return arguments[i];\n    }\n};\n\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/defined/index.js"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/lib/default_stream.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var through = require('through');\nvar fs = require('fs');\n\nmodule.exports = function () {\n    var line = '';\n    var stream = through(write, flush);\n    return stream;\n    \n    function write (buf) {\n        for (var i = 0; i < buf.length; i++) {\n            var c = typeof buf === 'string'\n                ? buf.charAt(i)\n                : String.fromCharCode(buf[i])\n            ;\n            if (c === '\\n') flush();\n            else line += c;\n        }\n    }\n    \n    function flush () {\n        if (fs.writeSync && /^win/.test(process.platform)) {\n            try { fs.writeSync(1, line + '\\n'); }\n            catch (e) { stream.emit('error', e) }\n        }\n        else {\n            try { console.log(line) }\n            catch (e) { stream.emit('error', e) }\n        }\n        line = '';\n    }\n};\n\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/lib/default_stream.js"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/through/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"index.js\"}\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/through/package.json"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/through/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var Stream = require('stream')\n\n// through\n//\n// a stream that does nothing but re-emit the input.\n// useful for aggregating a series of changing but not ending streams into one stream)\n\nexports = module.exports = through\nthrough.through = through\n\n//create a readable writable stream.\n\nfunction through (write, end, opts) {\n  write = write || function (data) { this.queue(data) }\n  end = end || function () { this.queue(null) }\n\n  var ended = false, destroyed = false, buffer = [], _ended = false\n  var stream = new Stream()\n  stream.readable = stream.writable = true\n  stream.paused = false\n\n//  stream.autoPause   = !(opts && opts.autoPause   === false)\n  stream.autoDestroy = !(opts && opts.autoDestroy === false)\n\n  stream.write = function (data) {\n    write.call(this, data)\n    return !stream.paused\n  }\n\n  function drain() {\n    while(buffer.length && !stream.paused) {\n      var data = buffer.shift()\n      if(null === data)\n        return stream.emit('end')\n      else\n        stream.emit('data', data)\n    }\n  }\n\n  stream.queue = stream.push = function (data) {\n//    console.error(ended)\n    if(_ended) return stream\n    if(data == null) _ended = true\n    buffer.push(data)\n    drain()\n    return stream\n  }\n\n  //this will be registered as the first 'end' listener\n  //must call destroy next tick, to make sure we're after any\n  //stream piped from here.\n  //this is only a problem if end is not emitted synchronously.\n  //a nicer way to do this is to make sure this is the last listener for 'end'\n\n  stream.on('end', function () {\n    stream.readable = false\n    if(!stream.writable && stream.autoDestroy)\n      process.nextTick(function () {\n        stream.destroy()\n      })\n  })\n\n  function _end () {\n    stream.writable = false\n    end.call(stream)\n    if(!stream.readable && stream.autoDestroy)\n      stream.destroy()\n  }\n\n  stream.end = function (data) {\n    if(ended) return\n    ended = true\n    if(arguments.length) stream.write(data)\n    _end() // will emit or queue\n    return stream\n  }\n\n  stream.destroy = function () {\n    if(destroyed) return\n    destroyed = true\n    ended = true\n    buffer.length = 0\n    stream.writable = stream.readable = false\n    stream.emit('close')\n    return stream\n  }\n\n  stream.pause = function () {\n    if(stream.paused) return\n    stream.paused = true\n    return stream\n  }\n\n  stream.resume = function () {\n    if(stream.paused) {\n      stream.paused = false\n      stream.emit('resume')\n    }\n    drain()\n    //may have become paused again,\n    //as drain emits 'data'.\n    if(!stream.paused)\n      stream.emit('drain')\n    return stream\n  }\n  return stream\n}\n\n\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/through/index.js"
));

require.define("stream",Function(['require','module','exports','__dirname','__filename','process','global'],"var events = require('events');\nvar util = require('util');\n\nfunction Stream() {\n  events.EventEmitter.call(this);\n}\nutil.inherits(Stream, events.EventEmitter);\nmodule.exports = Stream;\n// Backwards-compat with node 0.4.x\nStream.Stream = Stream;\n\nStream.prototype.pipe = function(dest, options) {\n  var source = this;\n\n  function ondata(chunk) {\n    if (dest.writable) {\n      if (false === dest.write(chunk) && source.pause) {\n        source.pause();\n      }\n    }\n  }\n\n  source.on('data', ondata);\n\n  function ondrain() {\n    if (source.readable && source.resume) {\n      source.resume();\n    }\n  }\n\n  dest.on('drain', ondrain);\n\n  // If the 'end' option is not supplied, dest.end() will be called when\n  // source gets the 'end' or 'close' events.  Only dest.end() once, and\n  // only when all sources have ended.\n  if (!dest._isStdio && (!options || options.end !== false)) {\n    dest._pipeCount = dest._pipeCount || 0;\n    dest._pipeCount++;\n\n    source.on('end', onend);\n    source.on('close', onclose);\n  }\n\n  var didOnEnd = false;\n  function onend() {\n    if (didOnEnd) return;\n    didOnEnd = true;\n\n    dest._pipeCount--;\n\n    // remove the listeners\n    cleanup();\n\n    if (dest._pipeCount > 0) {\n      // waiting for other incoming streams to end.\n      return;\n    }\n\n    dest.end();\n  }\n\n\n  function onclose() {\n    if (didOnEnd) return;\n    didOnEnd = true;\n\n    dest._pipeCount--;\n\n    // remove the listeners\n    cleanup();\n\n    if (dest._pipeCount > 0) {\n      // waiting for other incoming streams to end.\n      return;\n    }\n\n    dest.destroy();\n  }\n\n  // don't leave dangling pipes when there are errors.\n  function onerror(er) {\n    cleanup();\n    if (this.listeners('error').length === 0) {\n      throw er; // Unhandled stream error in pipe.\n    }\n  }\n\n  source.on('error', onerror);\n  dest.on('error', onerror);\n\n  // remove all the event listeners that were added.\n  function cleanup() {\n    source.removeListener('data', ondata);\n    dest.removeListener('drain', ondrain);\n\n    source.removeListener('end', onend);\n    source.removeListener('close', onclose);\n\n    source.removeListener('error', onerror);\n    dest.removeListener('error', onerror);\n\n    source.removeListener('end', cleanup);\n    source.removeListener('close', cleanup);\n\n    dest.removeListener('end', cleanup);\n    dest.removeListener('close', cleanup);\n  }\n\n  source.on('end', cleanup);\n  source.on('close', cleanup);\n\n  dest.on('end', cleanup);\n  dest.on('close', cleanup);\n\n  dest.emit('pipe', source);\n\n  // Allow for unix-like usage: A.pipe(B).pipe(C)\n  return dest;\n};\n\n//@ sourceURL=stream"
));

require.define("events",Function(['require','module','exports','__dirname','__filename','process','global'],"if (!process.EventEmitter) process.EventEmitter = function () {};\n\nvar EventEmitter = exports.EventEmitter = process.EventEmitter;\nvar isArray = typeof Array.isArray === 'function'\n    ? Array.isArray\n    : function (xs) {\n        return Object.prototype.toString.call(xs) === '[object Array]'\n    }\n;\nfunction indexOf (xs, x) {\n    if (xs.indexOf) return xs.indexOf(x);\n    for (var i = 0; i < xs.length; i++) {\n        if (x === xs[i]) return i;\n    }\n    return -1;\n}\n\n// By default EventEmitters will print a warning if more than\n// 10 listeners are added to it. This is a useful default which\n// helps finding memory leaks.\n//\n// Obviously not all Emitters should be limited to 10. This function allows\n// that to be increased. Set to zero for unlimited.\nvar defaultMaxListeners = 10;\nEventEmitter.prototype.setMaxListeners = function(n) {\n  if (!this._events) this._events = {};\n  this._events.maxListeners = n;\n};\n\n\nEventEmitter.prototype.emit = function(type) {\n  // If there is no 'error' event listener then throw.\n  if (type === 'error') {\n    if (!this._events || !this._events.error ||\n        (isArray(this._events.error) && !this._events.error.length))\n    {\n      if (arguments[1] instanceof Error) {\n        throw arguments[1]; // Unhandled 'error' event\n      } else {\n        throw new Error(\"Uncaught, unspecified 'error' event.\");\n      }\n      return false;\n    }\n  }\n\n  if (!this._events) return false;\n  var handler = this._events[type];\n  if (!handler) return false;\n\n  if (typeof handler == 'function') {\n    switch (arguments.length) {\n      // fast cases\n      case 1:\n        handler.call(this);\n        break;\n      case 2:\n        handler.call(this, arguments[1]);\n        break;\n      case 3:\n        handler.call(this, arguments[1], arguments[2]);\n        break;\n      // slower\n      default:\n        var args = Array.prototype.slice.call(arguments, 1);\n        handler.apply(this, args);\n    }\n    return true;\n\n  } else if (isArray(handler)) {\n    var args = Array.prototype.slice.call(arguments, 1);\n\n    var listeners = handler.slice();\n    for (var i = 0, l = listeners.length; i < l; i++) {\n      listeners[i].apply(this, args);\n    }\n    return true;\n\n  } else {\n    return false;\n  }\n};\n\n// EventEmitter is defined in src/node_events.cc\n// EventEmitter.prototype.emit() is also defined there.\nEventEmitter.prototype.addListener = function(type, listener) {\n  if ('function' !== typeof listener) {\n    throw new Error('addListener only takes instances of Function');\n  }\n\n  if (!this._events) this._events = {};\n\n  // To avoid recursion in the case that type == \"newListeners\"! Before\n  // adding it to the listeners, first emit \"newListeners\".\n  this.emit('newListener', type, listener);\n\n  if (!this._events[type]) {\n    // Optimize the case of one listener. Don't need the extra array object.\n    this._events[type] = listener;\n  } else if (isArray(this._events[type])) {\n\n    // Check for listener leak\n    if (!this._events[type].warned) {\n      var m;\n      if (this._events.maxListeners !== undefined) {\n        m = this._events.maxListeners;\n      } else {\n        m = defaultMaxListeners;\n      }\n\n      if (m && m > 0 && this._events[type].length > m) {\n        this._events[type].warned = true;\n        console.error('(node) warning: possible EventEmitter memory ' +\n                      'leak detected. %d listeners added. ' +\n                      'Use emitter.setMaxListeners() to increase limit.',\n                      this._events[type].length);\n        console.trace();\n      }\n    }\n\n    // If we've already got an array, just append.\n    this._events[type].push(listener);\n  } else {\n    // Adding the second element, need to change to array.\n    this._events[type] = [this._events[type], listener];\n  }\n\n  return this;\n};\n\nEventEmitter.prototype.on = EventEmitter.prototype.addListener;\n\nEventEmitter.prototype.once = function(type, listener) {\n  var self = this;\n  self.on(type, function g() {\n    self.removeListener(type, g);\n    listener.apply(this, arguments);\n  });\n\n  return this;\n};\n\nEventEmitter.prototype.removeListener = function(type, listener) {\n  if ('function' !== typeof listener) {\n    throw new Error('removeListener only takes instances of Function');\n  }\n\n  // does not use listeners(), so no side effect of creating _events[type]\n  if (!this._events || !this._events[type]) return this;\n\n  var list = this._events[type];\n\n  if (isArray(list)) {\n    var i = indexOf(list, listener);\n    if (i < 0) return this;\n    list.splice(i, 1);\n    if (list.length == 0)\n      delete this._events[type];\n  } else if (this._events[type] === listener) {\n    delete this._events[type];\n  }\n\n  return this;\n};\n\nEventEmitter.prototype.removeAllListeners = function(type) {\n  // does not use listeners(), so no side effect of creating _events[type]\n  if (type && this._events && this._events[type]) this._events[type] = null;\n  return this;\n};\n\nEventEmitter.prototype.listeners = function(type) {\n  if (!this._events) this._events = {};\n  if (!this._events[type]) this._events[type] = [];\n  if (!isArray(this._events[type])) {\n    this._events[type] = [this._events[type]];\n  }\n  return this._events[type];\n};\n\n//@ sourceURL=events"
));

require.define("util",Function(['require','module','exports','__dirname','__filename','process','global'],"var events = require('events');\n\nexports.isArray = isArray;\nexports.isDate = function(obj){return Object.prototype.toString.call(obj) === '[object Date]'};\nexports.isRegExp = function(obj){return Object.prototype.toString.call(obj) === '[object RegExp]'};\n\n\nexports.print = function () {};\nexports.puts = function () {};\nexports.debug = function() {};\n\nexports.inspect = function(obj, showHidden, depth, colors) {\n  var seen = [];\n\n  var stylize = function(str, styleType) {\n    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics\n    var styles =\n        { 'bold' : [1, 22],\n          'italic' : [3, 23],\n          'underline' : [4, 24],\n          'inverse' : [7, 27],\n          'white' : [37, 39],\n          'grey' : [90, 39],\n          'black' : [30, 39],\n          'blue' : [34, 39],\n          'cyan' : [36, 39],\n          'green' : [32, 39],\n          'magenta' : [35, 39],\n          'red' : [31, 39],\n          'yellow' : [33, 39] };\n\n    var style =\n        { 'special': 'cyan',\n          'number': 'blue',\n          'boolean': 'yellow',\n          'undefined': 'grey',\n          'null': 'bold',\n          'string': 'green',\n          'date': 'magenta',\n          // \"name\": intentionally not styling\n          'regexp': 'red' }[styleType];\n\n    if (style) {\n      return '\\033[' + styles[style][0] + 'm' + str +\n             '\\033[' + styles[style][1] + 'm';\n    } else {\n      return str;\n    }\n  };\n  if (! colors) {\n    stylize = function(str, styleType) { return str; };\n  }\n\n  function format(value, recurseTimes) {\n    // Provide a hook for user-specified inspect functions.\n    // Check that value is an object with an inspect function on it\n    if (value && typeof value.inspect === 'function' &&\n        // Filter out the util module, it's inspect function is special\n        value !== exports &&\n        // Also filter out any prototype objects using the circular check.\n        !(value.constructor && value.constructor.prototype === value)) {\n      return value.inspect(recurseTimes);\n    }\n\n    // Primitive types cannot have properties\n    switch (typeof value) {\n      case 'undefined':\n        return stylize('undefined', 'undefined');\n\n      case 'string':\n        var simple = '\\'' + JSON.stringify(value).replace(/^\"|\"$/g, '')\n                                                 .replace(/'/g, \"\\\\'\")\n                                                 .replace(/\\\\\"/g, '\"') + '\\'';\n        return stylize(simple, 'string');\n\n      case 'number':\n        return stylize('' + value, 'number');\n\n      case 'boolean':\n        return stylize('' + value, 'boolean');\n    }\n    // For some reason typeof null is \"object\", so special case here.\n    if (value === null) {\n      return stylize('null', 'null');\n    }\n\n    // Look up the keys of the object.\n    var visible_keys = Object_keys(value);\n    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;\n\n    // Functions without properties can be shortcutted.\n    if (typeof value === 'function' && keys.length === 0) {\n      if (isRegExp(value)) {\n        return stylize('' + value, 'regexp');\n      } else {\n        var name = value.name ? ': ' + value.name : '';\n        return stylize('[Function' + name + ']', 'special');\n      }\n    }\n\n    // Dates without properties can be shortcutted\n    if (isDate(value) && keys.length === 0) {\n      return stylize(value.toUTCString(), 'date');\n    }\n\n    var base, type, braces;\n    // Determine the object type\n    if (isArray(value)) {\n      type = 'Array';\n      braces = ['[', ']'];\n    } else {\n      type = 'Object';\n      braces = ['{', '}'];\n    }\n\n    // Make functions say that they are functions\n    if (typeof value === 'function') {\n      var n = value.name ? ': ' + value.name : '';\n      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';\n    } else {\n      base = '';\n    }\n\n    // Make dates with properties first say the date\n    if (isDate(value)) {\n      base = ' ' + value.toUTCString();\n    }\n\n    if (keys.length === 0) {\n      return braces[0] + base + braces[1];\n    }\n\n    if (recurseTimes < 0) {\n      if (isRegExp(value)) {\n        return stylize('' + value, 'regexp');\n      } else {\n        return stylize('[Object]', 'special');\n      }\n    }\n\n    seen.push(value);\n\n    var output = keys.map(function(key) {\n      var name, str;\n      if (value.__lookupGetter__) {\n        if (value.__lookupGetter__(key)) {\n          if (value.__lookupSetter__(key)) {\n            str = stylize('[Getter/Setter]', 'special');\n          } else {\n            str = stylize('[Getter]', 'special');\n          }\n        } else {\n          if (value.__lookupSetter__(key)) {\n            str = stylize('[Setter]', 'special');\n          }\n        }\n      }\n      if (visible_keys.indexOf(key) < 0) {\n        name = '[' + key + ']';\n      }\n      if (!str) {\n        if (seen.indexOf(value[key]) < 0) {\n          if (recurseTimes === null) {\n            str = format(value[key]);\n          } else {\n            str = format(value[key], recurseTimes - 1);\n          }\n          if (str.indexOf('\\n') > -1) {\n            if (isArray(value)) {\n              str = str.split('\\n').map(function(line) {\n                return '  ' + line;\n              }).join('\\n').substr(2);\n            } else {\n              str = '\\n' + str.split('\\n').map(function(line) {\n                return '   ' + line;\n              }).join('\\n');\n            }\n          }\n        } else {\n          str = stylize('[Circular]', 'special');\n        }\n      }\n      if (typeof name === 'undefined') {\n        if (type === 'Array' && key.match(/^\\d+$/)) {\n          return str;\n        }\n        name = JSON.stringify('' + key);\n        if (name.match(/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)) {\n          name = name.substr(1, name.length - 2);\n          name = stylize(name, 'name');\n        } else {\n          name = name.replace(/'/g, \"\\\\'\")\n                     .replace(/\\\\\"/g, '\"')\n                     .replace(/(^\"|\"$)/g, \"'\");\n          name = stylize(name, 'string');\n        }\n      }\n\n      return name + ': ' + str;\n    });\n\n    seen.pop();\n\n    var numLinesEst = 0;\n    var length = output.reduce(function(prev, cur) {\n      numLinesEst++;\n      if (cur.indexOf('\\n') >= 0) numLinesEst++;\n      return prev + cur.length + 1;\n    }, 0);\n\n    if (length > 50) {\n      output = braces[0] +\n               (base === '' ? '' : base + '\\n ') +\n               ' ' +\n               output.join(',\\n  ') +\n               ' ' +\n               braces[1];\n\n    } else {\n      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];\n    }\n\n    return output;\n  }\n  return format(obj, (typeof depth === 'undefined' ? 2 : depth));\n};\n\n\nfunction isArray(ar) {\n  return ar instanceof Array ||\n         Array.isArray(ar) ||\n         (ar && ar !== Object.prototype && isArray(ar.__proto__));\n}\n\n\nfunction isRegExp(re) {\n  return re instanceof RegExp ||\n    (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');\n}\n\n\nfunction isDate(d) {\n  if (d instanceof Date) return true;\n  if (typeof d !== 'object') return false;\n  var properties = Date.prototype && Object_getOwnPropertyNames(Date.prototype);\n  var proto = d.__proto__ && Object_getOwnPropertyNames(d.__proto__);\n  return JSON.stringify(proto) === JSON.stringify(properties);\n}\n\nfunction pad(n) {\n  return n < 10 ? '0' + n.toString(10) : n.toString(10);\n}\n\nvar months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',\n              'Oct', 'Nov', 'Dec'];\n\n// 26 Feb 16:19:34\nfunction timestamp() {\n  var d = new Date();\n  var time = [pad(d.getHours()),\n              pad(d.getMinutes()),\n              pad(d.getSeconds())].join(':');\n  return [d.getDate(), months[d.getMonth()], time].join(' ');\n}\n\nexports.log = function (msg) {};\n\nexports.pump = null;\n\nvar Object_keys = Object.keys || function (obj) {\n    var res = [];\n    for (var key in obj) res.push(key);\n    return res;\n};\n\nvar Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {\n    var res = [];\n    for (var key in obj) {\n        if (Object.hasOwnProperty.call(obj, key)) res.push(key);\n    }\n    return res;\n};\n\nvar Object_create = Object.create || function (prototype, properties) {\n    // from es5-shim\n    var object;\n    if (prototype === null) {\n        object = { '__proto__' : null };\n    }\n    else {\n        if (typeof prototype !== 'object') {\n            throw new TypeError(\n                'typeof prototype[' + (typeof prototype) + '] != \\'object\\''\n            );\n        }\n        var Type = function () {};\n        Type.prototype = prototype;\n        object = new Type();\n        object.__proto__ = prototype;\n    }\n    if (typeof properties !== 'undefined' && Object.defineProperties) {\n        Object.defineProperties(object, properties);\n    }\n    return object;\n};\n\nexports.inherits = function(ctor, superCtor) {\n  ctor.super_ = superCtor;\n  ctor.prototype = Object_create(superCtor.prototype, {\n    constructor: {\n      value: ctor,\n      enumerable: false,\n      writable: true,\n      configurable: true\n    }\n  });\n};\n\nvar formatRegExp = /%[sdj%]/g;\nexports.format = function(f) {\n  if (typeof f !== 'string') {\n    var objects = [];\n    for (var i = 0; i < arguments.length; i++) {\n      objects.push(exports.inspect(arguments[i]));\n    }\n    return objects.join(' ');\n  }\n\n  var i = 1;\n  var args = arguments;\n  var len = args.length;\n  var str = String(f).replace(formatRegExp, function(x) {\n    if (x === '%%') return '%';\n    if (i >= len) return x;\n    switch (x) {\n      case '%s': return String(args[i++]);\n      case '%d': return Number(args[i++]);\n      case '%j': return JSON.stringify(args[i++]);\n      default:\n        return x;\n    }\n  });\n  for(var x = args[i]; i < len; x = args[++i]){\n    if (x === null || typeof x !== 'object') {\n      str += ' ' + x;\n    } else {\n      str += ' ' + exports.inspect(x);\n    }\n  }\n  return str;\n};\n\n//@ sourceURL=util"
));

require.define("fs",Function(['require','module','exports','__dirname','__filename','process','global'],"// nothing to see here... no file methods for the browser\n\n//@ sourceURL=fs"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/lib/test.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var Stream = require('stream');\nvar deepEqual = require('deep-equal');\nvar defined = require('defined');\nvar path = require('path');\nvar inherits = require('inherits');\nvar EventEmitter = require('events').EventEmitter;\n\nmodule.exports = Test;\n\nvar nextTick = typeof setImmediate !== 'undefined'\n    ? setImmediate\n    : process.nextTick\n;\n\ninherits(Test, EventEmitter);\n\nvar getTestArgs = function (name_, opts_, cb_) {\n    var name = '(anonymous)';\n    var opts = {};\n    var cb;\n    \n    for (var i = 0; i < arguments.length; i++) {\n        var arg = arguments[i];\n        var t = typeof arg;\n        if (t === 'string') {\n            name = arg;\n        }\n        else if (t === 'object') {\n            opts = arg || opts;\n        }\n        else if (t === 'function') {\n            cb = arg;\n        }\n    }\n    return { name: name, opts: opts, cb: cb };\n};\n\nfunction Test (name_, opts_, cb_) {\n    if (! (this instanceof Test)) {\n        return new Test(name_, opts_, cb_);\n    }\n\n    var args = getTestArgs(name_, opts_, cb_);\n\n    this.readable = true;\n    this.name = args.name || '(anonymous)';\n    this.assertCount = 0;\n    this.pendingCount = 0;\n    this._skip = args.opts.skip || false;\n    this._plan = undefined;\n    this._cb = args.cb;\n    this._progeny = [];\n    this._ok = true;\n\n    for (var prop in this) {\n        this[prop] = (function bind(self, val) {\n            if (typeof val === 'function') {\n                return function bound() {\n                    return val.apply(self, arguments);\n                };\n            }\n            else return val;\n        })(this, this[prop]);\n    }\n}\n\nTest.prototype.run = function () {\n    if (!this._cb || this._skip) {\n        return this._end();\n    }\n    this.emit('prerun');\n    this._cb(this);\n    this.emit('run');\n};\n\nTest.prototype.test = function (name, opts, cb) {\n    var self = this;\n    var t = new Test(name, opts, cb);\n    this._progeny.push(t);\n    this.pendingCount++;\n    this.emit('test', t);\n    t.on('prerun', function () {\n        self.assertCount++;\n    })\n    \n    if (!self._pendingAsserts()) {\n        nextTick(function () {\n            self._end();\n        });\n    }\n    \n    nextTick(function() {\n        if (!self._plan && self.pendingCount == self._progeny.length) {\n            self._end();\n        }\n    });\n};\n\nTest.prototype.comment = function (msg) {\n    this.emit('result', msg.trim().replace(/^#\\s*/, ''));\n};\n\nTest.prototype.plan = function (n) {\n    this._plan = n;\n    this.emit('plan', n);\n};\n\nTest.prototype.end = function (err) { \n    var self = this;\n    if (arguments.length >= 1) {\n        this.ifError(err);\n    }\n    \n    if (this.calledEnd) {\n        this.fail('.end() called twice');\n    }\n    this.calledEnd = true;\n    this._end();\n};\n\nTest.prototype._end = function (err) {\n    var self = this;\n    if (this._progeny.length) {\n        var t = this._progeny.shift();\n        t.on('end', function () { self._end() });\n        t.run();\n        return;\n    }\n    \n    if (!this.ended) this.emit('end');\n    var pendingAsserts = this._pendingAsserts();\n    if (!this._planError && this._plan !== undefined && pendingAsserts) {\n        this._planError = true;\n        this.fail('plan != count', {\n            expected : this._plan,\n            actual : this.assertCount\n        });\n    }\n    this.ended = true;\n};\n\nTest.prototype._exit = function () {\n    if (this._plan !== undefined &&\n        !this._planError && this.assertCount !== this._plan) {\n        this._planError = true;\n        this.fail('plan != count', {\n            expected : this._plan,\n            actual : this.assertCount,\n            exiting : true\n        });\n    }\n    else if (!this.ended) {\n        this.fail('test exited without ending', {\n            exiting: true\n        });\n    }\n};\n\nTest.prototype._pendingAsserts = function () {\n    if (this._plan === undefined) {\n        return 1;\n    }\n    else {\n        return this._plan - (this._progeny.length + this.assertCount);\n    }\n};\n\nTest.prototype._assert = function assert (ok, opts) {\n    var self = this;\n    var extra = opts.extra || {};\n    \n    var res = {\n        id : self.assertCount ++,\n        ok : Boolean(ok),\n        skip : defined(extra.skip, opts.skip),\n        name : defined(extra.message, opts.message, '(unnamed assert)'),\n        operator : defined(extra.operator, opts.operator)\n    };\n    if (has(opts, 'actual') || has(extra, 'actual')) {\n        res.actual = defined(extra.actual, opts.actual);\n    }\n    if (has(opts, 'expected') || has(extra, 'expected')) {\n        res.expected = defined(extra.expected, opts.expected);\n    }\n    this._ok = Boolean(this._ok && ok);\n    \n    if (!ok) {\n        res.error = defined(extra.error, opts.error, new Error(res.name));\n    }\n    \n    var e = new Error('exception');\n    var err = (e.stack || '').split('\\n');\n    var dir = path.dirname(__dirname) + '/';\n    \n    for (var i = 0; i < err.length; i++) {\n        var m = /^\\s*\\bat\\s+(.+)/.exec(err[i]);\n        if (!m) continue;\n        \n        var s = m[1].split(/\\s+/);\n        var filem = /(\\/[^:\\s]+:(\\d+)(?::(\\d+))?)/.exec(s[1]);\n        if (!filem) {\n            filem = /(\\/[^:\\s]+:(\\d+)(?::(\\d+))?)/.exec(s[3]);\n            \n            if (!filem) continue;\n        }\n        \n        if (filem[1].slice(0, dir.length) === dir) continue;\n        \n        res.functionName = s[0];\n        res.file = filem[1];\n        res.line = Number(filem[2]);\n        if (filem[3]) res.column = filem[3];\n        \n        res.at = m[1];\n        break;\n    }\n    \n    self.emit('result', res);\n    \n    var pendingAsserts = self._pendingAsserts();\n    if (!pendingAsserts) {\n        if (extra.exiting) {\n            self._end();\n        } else {\n            nextTick(function () {\n                self._end();\n            });\n        }\n    }\n    \n    if (!self._planError && pendingAsserts < 0) {\n        self._planError = true;\n        self.fail('plan != count', {\n            expected : self._plan,\n            actual : self._plan - pendingAsserts\n        });\n    }\n};\n\nTest.prototype.fail = function (msg, extra) {\n    this._assert(false, {\n        message : msg,\n        operator : 'fail',\n        extra : extra\n    });\n};\n\nTest.prototype.pass = function (msg, extra) {\n    this._assert(true, {\n        message : msg,\n        operator : 'pass',\n        extra : extra\n    });\n};\n\nTest.prototype.skip = function (msg, extra) {\n    this._assert(true, {\n        message : msg,\n        operator : 'skip',\n        skip : true,\n        extra : extra\n    });\n};\n\nTest.prototype.ok\n= Test.prototype['true']\n= Test.prototype.assert\n= function (value, msg, extra) {\n    this._assert(value, {\n        message : msg,\n        operator : 'ok',\n        expected : true,\n        actual : value,\n        extra : extra\n    });\n};\n\nTest.prototype.notOk\n= Test.prototype['false']\n= Test.prototype.notok\n= function (value, msg, extra) {\n    this._assert(!value, {\n        message : msg,\n        operator : 'notOk',\n        expected : false,\n        actual : value,\n        extra : extra\n    });\n};\n\nTest.prototype.error\n= Test.prototype.ifError\n= Test.prototype.ifErr\n= Test.prototype.iferror\n= function (err, msg, extra) {\n    this._assert(!err, {\n        message : defined(msg, String(err)),\n        operator : 'error',\n        actual : err,\n        extra : extra\n    });\n};\n\nTest.prototype.equal\n= Test.prototype.equals\n= Test.prototype.isEqual\n= Test.prototype.is\n= Test.prototype.strictEqual\n= Test.prototype.strictEquals\n= function (a, b, msg, extra) {\n    this._assert(a === b, {\n        message : defined(msg, 'should be equal'),\n        operator : 'equal',\n        actual : a,\n        expected : b,\n        extra : extra\n    });\n};\n\nTest.prototype.notEqual\n= Test.prototype.notEquals\n= Test.prototype.notStrictEqual\n= Test.prototype.notStrictEquals\n= Test.prototype.isNotEqual\n= Test.prototype.isNot\n= Test.prototype.not\n= Test.prototype.doesNotEqual\n= Test.prototype.isInequal\n= function (a, b, msg, extra) {\n    this._assert(a !== b, {\n        message : defined(msg, 'should not be equal'),\n        operator : 'notEqual',\n        actual : a,\n        notExpected : b,\n        extra : extra\n    });\n};\n\nTest.prototype.deepEqual\n= Test.prototype.deepEquals\n= Test.prototype.isEquivalent\n= Test.prototype.same\n= function (a, b, msg, extra) {\n    this._assert(deepEqual(a, b, { strict: true }), {\n        message : defined(msg, 'should be equivalent'),\n        operator : 'deepEqual',\n        actual : a,\n        expected : b,\n        extra : extra\n    });\n};\n\nTest.prototype.deepLooseEqual\n= Test.prototype.looseEqual\n= Test.prototype.looseEquals\n= function (a, b, msg, extra) {\n    this._assert(deepEqual(a, b), {\n        message : defined(msg, 'should be equivalent'),\n        operator : 'deepLooseEqual',\n        actual : a,\n        expected : b,\n        extra : extra\n    });\n};\n\nTest.prototype.notDeepEqual\n= Test.prototype.notEquivalent\n= Test.prototype.notDeeply\n= Test.prototype.notSame\n= Test.prototype.isNotDeepEqual\n= Test.prototype.isNotDeeply\n= Test.prototype.isNotEquivalent\n= Test.prototype.isInequivalent\n= function (a, b, msg, extra) {\n    this._assert(!deepEqual(a, b, { strict: true }), {\n        message : defined(msg, 'should not be equivalent'),\n        operator : 'notDeepEqual',\n        actual : a,\n        notExpected : b,\n        extra : extra\n    });\n};\n\nTest.prototype.notDeepLooseEqual\n= Test.prototype.notLooseEqual\n= Test.prototype.notLooseEquals\n= function (a, b, msg, extra) {\n    this._assert(!deepEqual(a, b), {\n        message : defined(msg, 'should be equivalent'),\n        operator : 'notDeepLooseEqual',\n        actual : a,\n        expected : b,\n        extra : extra\n    });\n};\n\nTest.prototype['throws'] = function (fn, expected, msg, extra) {\n    if (typeof expected === 'string') {\n        msg = expected;\n        expected = undefined;\n    }\n    var caught = undefined;\n    try {\n        fn();\n    }\n    catch (err) {\n        caught = { error : err };\n        var message = err.message;\n        delete err.message;\n        err.message = message;\n    }\n\n    var passed = caught;\n\n    if (expected instanceof RegExp) {\n        passed = expected.test(caught && caught.error);\n        expected = String(expected);\n    }\n\n    this._assert(passed, {\n        message : defined(msg, 'should throw'),\n        operator : 'throws',\n        actual : caught && caught.error,\n        expected : expected,\n        error: !passed && caught && caught.error,\n        extra : extra\n    });\n};\n\nTest.prototype.doesNotThrow = function (fn, expected, msg, extra) {\n    if (typeof expected === 'string') {\n        msg = expected;\n        expected = undefined;\n    }\n    var caught = undefined;\n    try {\n        fn();\n    }\n    catch (err) {\n        caught = { error : err };\n    }\n    this._assert(!caught, {\n        message : defined(msg, 'should not throw'),\n        operator : 'throws',\n        actual : caught && caught.error,\n        expected : expected,\n        error : caught && caught.error,\n        extra : extra\n    });\n};\n\nfunction has (obj, prop) {\n    return Object.prototype.hasOwnProperty.call(obj, prop);\n}\n\nTest.skip = function (name_, _opts, _cb) {\n    var args = getTestArgs.apply(null, arguments);\n    args.opts.skip = true;\n    return Test(args.name, args.opts, args.cb);\n};\n\n// vim: set softtabstop=4 shiftwidth=4:\n\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/lib/test.js"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/deep-equal/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"index.js\"}\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/deep-equal/package.json"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/deep-equal/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var pSlice = Array.prototype.slice;\nvar objectKeys = require('./lib/keys.js');\nvar isArguments = require('./lib/is_arguments.js');\n\nvar deepEqual = module.exports = function (actual, expected, opts) {\n  if (!opts) opts = {};\n  // 7.1. All identical values are equivalent, as determined by ===.\n  if (actual === expected) {\n    return true;\n\n  } else if (actual instanceof Date && expected instanceof Date) {\n    return actual.getTime() === expected.getTime();\n\n  // 7.3. Other pairs that do not both pass typeof value == 'object',\n  // equivalence is determined by ==.\n  } else if (typeof actual != 'object' && typeof expected != 'object') {\n    return opts.strict ? actual === expected : actual == expected;\n\n  // 7.4. For all other Object pairs, including Array objects, equivalence is\n  // determined by having the same number of owned properties (as verified\n  // with Object.prototype.hasOwnProperty.call), the same set of keys\n  // (although not necessarily the same order), equivalent values for every\n  // corresponding key, and an identical 'prototype' property. Note: this\n  // accounts for both named and indexed properties on Arrays.\n  } else {\n    return objEquiv(actual, expected, opts);\n  }\n}\n\nfunction isUndefinedOrNull(value) {\n  return value === null || value === undefined;\n}\n\nfunction isBuffer (x) {\n  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;\n  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {\n    return false;\n  }\n  if (x.length > 0 && typeof x[0] !== 'number') return false;\n  return true;\n}\n\nfunction objEquiv(a, b, opts) {\n  var i, key;\n  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))\n    return false;\n  // an identical 'prototype' property.\n  if (a.prototype !== b.prototype) return false;\n  //~~~I've managed to break Object.keys through screwy arguments passing.\n  //   Converting to array solves the problem.\n  if (isArguments(a)) {\n    if (!isArguments(b)) {\n      return false;\n    }\n    a = pSlice.call(a);\n    b = pSlice.call(b);\n    return deepEqual(a, b, opts);\n  }\n  if (isBuffer(a)) {\n    if (!isBuffer(b)) {\n      return false;\n    }\n    if (a.length !== b.length) return false;\n    for (i = 0; i < a.length; i++) {\n      if (a[i] !== b[i]) return false;\n    }\n    return true;\n  }\n  try {\n    var ka = objectKeys(a),\n        kb = objectKeys(b);\n  } catch (e) {//happens when one is a string literal and the other isn't\n    return false;\n  }\n  // having the same number of owned properties (keys incorporates\n  // hasOwnProperty)\n  if (ka.length != kb.length)\n    return false;\n  //the same set of keys (although not necessarily the same order),\n  ka.sort();\n  kb.sort();\n  //~~~cheap key test\n  for (i = ka.length - 1; i >= 0; i--) {\n    if (ka[i] != kb[i])\n      return false;\n  }\n  //equivalent values for every corresponding key, and\n  //~~~possibly expensive deep test\n  for (i = ka.length - 1; i >= 0; i--) {\n    key = ka[i];\n    if (!deepEqual(a[key], b[key], opts)) return false;\n  }\n  return true;\n}\n\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/deep-equal/index.js"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/deep-equal/lib/keys.js",Function(['require','module','exports','__dirname','__filename','process','global'],"exports = module.exports = typeof Object.keys === 'function'\n  ? Object.keys : shim;\n\nexports.shim = shim;\nfunction shim (obj) {\n  var keys = [];\n  for (var key in obj) keys.push(key);\n  return keys;\n}\n\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/deep-equal/lib/keys.js"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/deep-equal/lib/is_arguments.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var supportsArgumentsClass = (function(){\n  return Object.prototype.toString.call(arguments)\n})() == '[object Arguments]';\n\nexports = module.exports = supportsArgumentsClass ? supported : unsupported;\n\nexports.supported = supported;\nfunction supported(object) {\n  return Object.prototype.toString.call(object) == '[object Arguments]';\n};\n\nexports.unsupported = unsupported;\nfunction unsupported(object){\n  return object &&\n    typeof object == 'object' &&\n    typeof object.length == 'number' &&\n    Object.prototype.hasOwnProperty.call(object, 'callee') &&\n    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||\n    false;\n};\n\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/deep-equal/lib/is_arguments.js"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/inherits/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"./inherits.js\"}\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/inherits/package.json"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/inherits/inherits.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = require('util').inherits\n\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/inherits/inherits.js"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/lib/results.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var EventEmitter = require('events').EventEmitter;\nvar inherits = require('inherits');\nvar through = require('through');\nvar resumer = require('resumer');\nvar inspect = require('object-inspect');\nvar nextTick = typeof setImmediate !== 'undefined'\n    ? setImmediate\n    : process.nextTick\n;\n\nmodule.exports = Results;\ninherits(Results, EventEmitter);\n\nfunction Results () {\n    if (!(this instanceof Results)) return new Results;\n    this.count = 0;\n    this.fail = 0;\n    this.pass = 0;\n    this._stream = through();\n    this.tests = [];\n}\n\nResults.prototype.createStream = function (opts) {\n    if (!opts) opts = {};\n    var self = this;\n    var output, testId = 0;\n    if (opts.objectMode) {\n        output = through();\n        self.on('_push', function ontest (t, extra) {\n            if (!extra) extra = {};\n            var id = testId++;\n            t.once('prerun', function () {\n                var row = {\n                    type: 'test',\n                    name: t.name,\n                    id: id\n                };\n                if (has(extra, 'parent')) {\n                    row.parent = extra.parent;\n                }\n                output.queue(row);\n            });\n            t.on('test', function (st) {\n                ontest(st, { parent: id });\n            });\n            t.on('result', function (res) {\n                res.test = id;\n                res.type = 'assert';\n                output.queue(res);\n            });\n            t.on('end', function () {\n                output.queue({ type: 'end', test: id });\n            });\n        });\n        self.on('done', function () { output.queue(null) });\n    }\n    else {\n        output = resumer();\n        output.queue('TAP version 13\\n');\n        self._stream.pipe(output);\n    }\n    \n    nextTick(function next() {\n        var t;\n        while (t = getNextTest(self)) {\n            t.run();\n            if (!t.ended) return t.once('end', function(){ nextTick(next); });\n        }\n        self.emit('done');\n    });\n    \n    return output;\n};\n\nResults.prototype.push = function (t) {\n    var self = this;\n    self.tests.push(t);\n    self._watch(t);\n    self.emit('_push', t);\n};\n\nResults.prototype.only = function (name) {\n    if (this._only) {\n        self.count ++;\n        self.fail ++;\n        write('not ok ' + self.count + ' already called .only()\\n');\n    }\n    this._only = name;\n};\n\nResults.prototype._watch = function (t) {\n    var self = this;\n    var write = function (s) { self._stream.queue(s) };\n    t.once('prerun', function () {\n        write('# ' + t.name + '\\n');\n    });\n    \n    t.on('result', function (res) {\n        if (typeof res === 'string') {\n            write('# ' + res + '\\n');\n            return;\n        }\n        write(encodeResult(res, self.count + 1));\n        self.count ++;\n\n        if (res.ok) self.pass ++\n        else self.fail ++\n    });\n    \n    t.on('test', function (st) { self._watch(st) });\n};\n\nResults.prototype.close = function () {\n    var self = this;\n    if (self.closed) self._stream.emit('error', new Error('ALREADY CLOSED'));\n    self.closed = true;\n    var write = function (s) { self._stream.queue(s) };\n    \n    write('\\n1..' + self.count + '\\n');\n    write('# tests ' + self.count + '\\n');\n    write('# pass  ' + self.pass + '\\n');\n    if (self.fail) write('# fail  ' + self.fail + '\\n')\n    else write('\\n# ok\\n')\n\n    self._stream.queue(null);\n};\n\nfunction encodeResult (res, count) {\n    var output = '';\n    output += (res.ok ? 'ok ' : 'not ok ') + count;\n    output += res.name ? ' ' + res.name.toString().replace(/\\s+/g, ' ') : '';\n    \n    if (res.skip) output += ' # SKIP';\n    else if (res.todo) output += ' # TODO';\n    \n    output += '\\n';\n    if (res.ok) return output;\n    \n    var outer = '  ';\n    var inner = outer + '  ';\n    output += outer + '---\\n';\n    output += inner + 'operator: ' + res.operator + '\\n';\n    \n    if (has(res, 'expected') || has(res, 'actual')) {\n        var ex = inspect(res.expected);\n        var ac = inspect(res.actual);\n        \n        if (Math.max(ex.length, ac.length) > 65) {\n            output += inner + 'expected:\\n' + inner + '  ' + ex + '\\n';\n            output += inner + 'actual:\\n' + inner + '  ' + ac + '\\n';\n        }\n        else {\n            output += inner + 'expected: ' + ex + '\\n';\n            output += inner + 'actual:   ' + ac + '\\n';\n        }\n    }\n    if (res.at) {\n        output += inner + 'at: ' + res.at + '\\n';\n    }\n    if (res.operator === 'error' && res.actual && res.actual.stack) {\n        var lines = String(res.actual.stack).split('\\n');\n        output += inner + 'stack:\\n';\n        output += inner + '  ' + lines[0] + '\\n';\n        for (var i = 1; i < lines.length; i++) {\n            output += inner + lines[i] + '\\n';\n        }\n    }\n    \n    output += outer + '...\\n';\n    return output;\n}\n\nfunction getNextTest (results) {\n    if (!results._only) {\n        return results.tests.shift();\n    }\n    \n    do {\n        var t = results.tests.shift();\n        if (!t) continue;\n        if (results._only === t.name) {\n            return t;\n        }\n    } while (results.tests.length !== 0)\n}\n\nfunction has (obj, prop) {\n    return Object.prototype.hasOwnProperty.call(obj, prop);\n}\n\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/lib/results.js"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/resumer/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"index.js\"}\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/resumer/package.json"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/resumer/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var through = require('through');\nvar nextTick = typeof setImmediate !== 'undefined'\n    ? setImmediate\n    : process.nextTick\n;\n\nmodule.exports = function (write, end) {\n    var tr = through(write, end);\n    tr.pause();\n    var resume = tr.resume;\n    var pause = tr.pause;\n    var paused = false;\n    \n    tr.pause = function () {\n        paused = true;\n        return pause.apply(this, arguments);\n    };\n    \n    tr.resume = function () {\n        paused = false;\n        return resume.apply(this, arguments);\n    };\n    \n    nextTick(function () {\n        if (!paused) tr.resume();\n    });\n    \n    return tr;\n};\n\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/resumer/index.js"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/object-inspect/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"index.js\"}\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/object-inspect/package.json"
));

require.define("/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/object-inspect/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = function inspect_ (obj, opts, depth, seen) {\n    if (!opts) opts = {};\n    \n    var maxDepth = opts.depth === undefined ? 5 : opts.depth;\n    if (depth === undefined) depth = 0;\n    if (depth > maxDepth && maxDepth > 0) return '...';\n    \n    if (seen === undefined) seen = [];\n    else if (indexOf(seen, obj) >= 0) {\n        return '[Circular]';\n    }\n    \n    function inspect (value, from) {\n        if (from) {\n            seen = seen.slice();\n            seen.push(from);\n        }\n        return inspect_(value, opts, depth + 1, seen);\n    }\n    \n    if (typeof obj === 'string') {\n        return inspectString(obj);\n    }\n    else if (typeof obj === 'function') {\n        var name = nameOf(obj);\n        return '[Function' + (name ? ': ' + name : '') + ']';\n    }\n    else if (obj === null) {\n        return 'null';\n    }\n    else if (isElement(obj)) {\n        var s = '<' + String(obj.nodeName).toLowerCase();\n        var attrs = obj.attributes || [];\n        for (var i = 0; i < attrs.length; i++) {\n            s += ' ' + attrs[i].name + '=\"' + quote(attrs[i].value) + '\"';\n        }\n        s += '>';\n        if (obj.childNodes && obj.childNodes.length) s += '...';\n        s += '</' + String(obj.tagName).toLowerCase() + '>';\n        return s;\n    }\n    else if (isArray(obj)) {\n        if (obj.length === 0) return '[]';\n        var xs = Array(obj.length);\n        for (var i = 0; i < obj.length; i++) {\n            xs[i] = has(obj, i) ? inspect(obj[i], obj) : '';\n        }\n        return '[ ' + xs.join(', ') + ' ]';\n    }\n    else if (typeof obj === 'object' && typeof obj.inspect === 'function') {\n        return obj.inspect();\n    }\n    else if (typeof obj === 'object' && !isDate(obj) && !isRegExp(obj)) {\n        var xs = [], keys = [];\n        for (var key in obj) {\n            if (has(obj, key)) keys.push(key);\n        }\n        keys.sort();\n        for (var i = 0; i < keys.length; i++) {\n            var key = keys[i];\n            if (/[^\\w$]/.test(key)) {\n                xs.push(inspect(key) + ': ' + inspect(obj[key], obj));\n            }\n            else xs.push(key + ': ' + inspect(obj[key], obj));\n        }\n        if (xs.length === 0) return '{}';\n        return '{ ' + xs.join(', ') + ' }';\n    }\n    else return String(obj);\n};\n\nfunction quote (s) {\n    return String(s).replace(/\"/g, '&quot;');\n}\n\nfunction isArray (obj) {\n    return {}.toString.call(obj) === '[object Array]';\n}\n\nfunction isDate (obj) {\n    return {}.toString.call(obj) === '[object Date]';\n}\n\nfunction isRegExp (obj) {\n    return {}.toString.call(obj) === '[object RegExp]';\n}\n\nfunction has (obj, key) {\n    if (!{}.hasOwnProperty) return key in obj;\n    return {}.hasOwnProperty.call(obj, key);\n}\n\nfunction nameOf (f) {\n    if (f.name) return f.name;\n    var m = f.toString().match(/^function\\s*([\\w$]+)/);\n    if (m) return m[1];\n}\n\nfunction indexOf (xs, x) {\n    if (xs.indexOf) return xs.indexOf(x);\n    for (var i = 0, l = xs.length; i < l; i++) {\n        if (xs[i] === x) return i;\n    }\n    return -1;\n}\n\nfunction isElement (x) {\n    if (!x || typeof x !== 'object') return false;\n    if (typeof HTMLElement !== 'undefined') {\n        return x instanceof HTMLElement;\n    }\n    else return typeof x.nodeName === 'string'\n        && typeof x.getAttribute === 'function'\n    ;\n}\n\nfunction inspectString (str) {\n    var s = str.replace(/(['\\\\])/g, '\\\\$1').replace(/[\\x00-\\x1f]/g, lowbyte);\n    return \"'\" + s + \"'\";\n    \n    function lowbyte (c) {\n        var n = c.charCodeAt(0);\n        var x = { 8: 'b', 9: 't', 10: 'n', 12: 'f', 13: 'r' }[n];\n        if (x) return '\\\\' + x;\n        return '\\\\x' + (n < 0x10 ? '0' : '') + n.toString(16);\n    }\n}\n\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/node_modules/tape/node_modules/object-inspect/index.js"
));

require.define("/usr/local/lib/node_modules/phantomify/process.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/*jshint browser:true */\n\n\"use strict\";\n\nprocess.exit = function(code) {\n  // Communicate exit code via location hash.\n  if (code === void(0) || code === 0) window.location.hash = \"0\"\n  else window.location.hash = code\n  // close a window.\n  window.close()\n}\n\n//@ sourceURL=/usr/local/lib/node_modules/phantomify/process.js"
));
require("/usr/local/lib/node_modules/phantomify/process.js");

require.define("/Users/karissa/dev/dat/dat-registry/app/test/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var tape = require('tape')\n\ntape('simple test', function (t) {\n  t.equal(true, true)\n  t.end()\n})\n\n//@ sourceURL=/Users/karissa/dev/dat/dat-registry/app/test/index.js"
));
require("/Users/karissa/dev/dat/dat-registry/app/test/index.js");
var process = require("__browserify_process");
