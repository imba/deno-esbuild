/// <reference types="./wasm.d.ts" />
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// lib/deno/wasm.ts
var wasm_exports = {};
__export(wasm_exports, {
  analyzeMetafile: () => analyzeMetafile,
  analyzeMetafileSync: () => analyzeMetafileSync,
  build: () => build,
  buildSync: () => buildSync,
  formatMessages: () => formatMessages,
  formatMessagesSync: () => formatMessagesSync,
  initialize: () => initialize,
  serve: () => serve,
  stop: () => stop,
  transform: () => transform,
  transformSync: () => transformSync,
  version: () => version
});

// lib/shared/stdio_protocol.ts
function encodePacket(packet) {
  let visit = (value) => {
    if (value === null) {
      bb.write8(0);
    } else if (typeof value === "boolean") {
      bb.write8(1);
      bb.write8(+value);
    } else if (typeof value === "number") {
      bb.write8(2);
      bb.write32(value | 0);
    } else if (typeof value === "string") {
      bb.write8(3);
      bb.write(encodeUTF8(value));
    } else if (value instanceof Uint8Array) {
      bb.write8(4);
      bb.write(value);
    } else if (value instanceof Array) {
      bb.write8(5);
      bb.write32(value.length);
      for (let item of value) {
        visit(item);
      }
    } else {
      let keys = Object.keys(value);
      bb.write8(6);
      bb.write32(keys.length);
      for (let key of keys) {
        bb.write(encodeUTF8(key));
        visit(value[key]);
      }
    }
  };
  let bb = new ByteBuffer();
  bb.write32(0);
  bb.write32(packet.id << 1 | +!packet.isRequest);
  visit(packet.value);
  writeUInt32LE(bb.buf, bb.len - 4, 0);
  return bb.buf.subarray(0, bb.len);
}
function decodePacket(bytes) {
  let visit = () => {
    switch (bb.read8()) {
      case 0:
        return null;
      case 1:
        return !!bb.read8();
      case 2:
        return bb.read32();
      case 3:
        return decodeUTF8(bb.read());
      case 4:
        return bb.read();
      case 5: {
        let count = bb.read32();
        let value2 = [];
        for (let i = 0; i < count; i++) {
          value2.push(visit());
        }
        return value2;
      }
      case 6: {
        let count = bb.read32();
        let value2 = {};
        for (let i = 0; i < count; i++) {
          value2[decodeUTF8(bb.read())] = visit();
        }
        return value2;
      }
      default:
        throw new Error("Invalid packet");
    }
  };
  let bb = new ByteBuffer(bytes);
  let id = bb.read32();
  let isRequest = (id & 1) === 0;
  id >>>= 1;
  let value = visit();
  if (bb.ptr !== bytes.length) {
    throw new Error("Invalid packet");
  }
  return { id, isRequest, value };
}
var ByteBuffer = class {
  constructor(buf = new Uint8Array(1024)) {
    this.buf = buf;
  }
  len = 0;
  ptr = 0;
  _write(delta) {
    if (this.len + delta > this.buf.length) {
      let clone = new Uint8Array((this.len + delta) * 2);
      clone.set(this.buf);
      this.buf = clone;
    }
    this.len += delta;
    return this.len - delta;
  }
  write8(value) {
    let offset = this._write(1);
    this.buf[offset] = value;
  }
  write32(value) {
    let offset = this._write(4);
    writeUInt32LE(this.buf, value, offset);
  }
  write(bytes) {
    let offset = this._write(4 + bytes.length);
    writeUInt32LE(this.buf, bytes.length, offset);
    this.buf.set(bytes, offset + 4);
  }
  _read(delta) {
    if (this.ptr + delta > this.buf.length) {
      throw new Error("Invalid packet");
    }
    this.ptr += delta;
    return this.ptr - delta;
  }
  read8() {
    return this.buf[this._read(1)];
  }
  read32() {
    return readUInt32LE(this.buf, this._read(4));
  }
  read() {
    let length = this.read32();
    let bytes = new Uint8Array(length);
    let ptr = this._read(bytes.length);
    bytes.set(this.buf.subarray(ptr, ptr + length));
    return bytes;
  }
};
var encodeUTF8;
var decodeUTF8;
if (typeof TextEncoder !== "undefined" && typeof TextDecoder !== "undefined") {
  let encoder = new TextEncoder();
  let decoder = new TextDecoder();
  encodeUTF8 = (text) => encoder.encode(text);
  decodeUTF8 = (bytes) => decoder.decode(bytes);
} else if (typeof Buffer !== "undefined") {
  encodeUTF8 = (text) => {
    let buffer = Buffer.from(text);
    if (!(buffer instanceof Uint8Array)) {
      buffer = new Uint8Array(buffer);
    }
    return buffer;
  };
  decodeUTF8 = (bytes) => {
    let { buffer, byteOffset, byteLength } = bytes;
    return Buffer.from(buffer, byteOffset, byteLength).toString();
  };
} else {
  throw new Error("No UTF-8 codec found");
}
function readUInt32LE(buffer, offset) {
  return buffer[offset++] | buffer[offset++] << 8 | buffer[offset++] << 16 | buffer[offset++] << 24;
}
function writeUInt32LE(buffer, value, offset) {
  buffer[offset++] = value;
  buffer[offset++] = value >> 8;
  buffer[offset++] = value >> 16;
  buffer[offset++] = value >> 24;
}

// lib/shared/common.ts
function validateTarget(target) {
  target += "";
  if (target.indexOf(",") >= 0)
    throw new Error(`Invalid target: ${target}`);
  return target;
}
var canBeAnything = () => null;
var mustBeBoolean = (value) => typeof value === "boolean" ? null : "a boolean";
var mustBeBooleanOrObject = (value) => typeof value === "boolean" || typeof value === "object" && !Array.isArray(value) ? null : "a boolean or an object";
var mustBeString = (value) => typeof value === "string" ? null : "a string";
var mustBeRegExp = (value) => value instanceof RegExp ? null : "a RegExp object";
var mustBeInteger = (value) => typeof value === "number" && value === (value | 0) ? null : "an integer";
var mustBeFunction = (value) => typeof value === "function" ? null : "a function";
var mustBeArray = (value) => Array.isArray(value) ? null : "an array";
var mustBeObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value) ? null : "an object";
var mustBeWebAssemblyModule = (value) => value instanceof WebAssembly.Module ? null : "a WebAssembly.Module";
var mustBeArrayOrRecord = (value) => typeof value === "object" && value !== null ? null : "an array or an object";
var mustBeObjectOrNull = (value) => typeof value === "object" && !Array.isArray(value) ? null : "an object or null";
var mustBeStringOrBoolean = (value) => typeof value === "string" || typeof value === "boolean" ? null : "a string or a boolean";
var mustBeStringOrObject = (value) => typeof value === "string" || typeof value === "object" && value !== null && !Array.isArray(value) ? null : "a string or an object";
var mustBeStringOrArray = (value) => typeof value === "string" || Array.isArray(value) ? null : "a string or an array";
var mustBeStringOrUint8Array = (value) => typeof value === "string" || value instanceof Uint8Array ? null : "a string or a Uint8Array";
function getFlag(object, keys, key, mustBeFn) {
  let value = object[key];
  keys[key + ""] = true;
  if (value === void 0)
    return void 0;
  let mustBe = mustBeFn(value);
  if (mustBe !== null)
    throw new Error(`"${key}" must be ${mustBe}`);
  return value;
}
function checkForInvalidFlags(object, keys, where) {
  for (let key in object) {
    if (!(key in keys)) {
      throw new Error(`Invalid option ${where}: "${key}"`);
    }
  }
}
function validateInitializeOptions(options) {
  let keys = /* @__PURE__ */ Object.create(null);
  let wasmURL = getFlag(options, keys, "wasmURL", mustBeString);
  let wasmModule = getFlag(options, keys, "wasmModule", mustBeWebAssemblyModule);
  let worker = getFlag(options, keys, "worker", mustBeBoolean);
  checkForInvalidFlags(options, keys, "in initialize() call");
  return {
    wasmURL,
    wasmModule,
    worker
  };
}
function validateMangleCache(mangleCache) {
  let validated;
  if (mangleCache !== void 0) {
    validated = /* @__PURE__ */ Object.create(null);
    for (let key of Object.keys(mangleCache)) {
      let value = mangleCache[key];
      if (typeof value === "string" || value === false) {
        validated[key] = value;
      } else {
        throw new Error(`Expected ${JSON.stringify(key)} in mangle cache to map to either a string or false`);
      }
    }
  }
  return validated;
}
function pushLogFlags(flags, options, keys, isTTY, logLevelDefault) {
  let color = getFlag(options, keys, "color", mustBeBoolean);
  let logLevel = getFlag(options, keys, "logLevel", mustBeString);
  let logLimit = getFlag(options, keys, "logLimit", mustBeInteger);
  if (color !== void 0)
    flags.push(`--color=${color}`);
  else if (isTTY)
    flags.push(`--color=true`);
  flags.push(`--log-level=${logLevel || logLevelDefault}`);
  flags.push(`--log-limit=${logLimit || 0}`);
}
function pushCommonFlags(flags, options, keys) {
  let legalComments = getFlag(options, keys, "legalComments", mustBeString);
  let sourceRoot = getFlag(options, keys, "sourceRoot", mustBeString);
  let sourcesContent = getFlag(options, keys, "sourcesContent", mustBeBoolean);
  let target = getFlag(options, keys, "target", mustBeStringOrArray);
  let format = getFlag(options, keys, "format", mustBeString);
  let globalName = getFlag(options, keys, "globalName", mustBeString);
  let mangleProps = getFlag(options, keys, "mangleProps", mustBeRegExp);
  let reserveProps = getFlag(options, keys, "reserveProps", mustBeRegExp);
  let mangleQuoted = getFlag(options, keys, "mangleQuoted", mustBeBoolean);
  let minify = getFlag(options, keys, "minify", mustBeBoolean);
  let minifySyntax = getFlag(options, keys, "minifySyntax", mustBeBoolean);
  let minifyWhitespace = getFlag(options, keys, "minifyWhitespace", mustBeBoolean);
  let minifyIdentifiers = getFlag(options, keys, "minifyIdentifiers", mustBeBoolean);
  let drop = getFlag(options, keys, "drop", mustBeArray);
  let charset = getFlag(options, keys, "charset", mustBeString);
  let treeShaking = getFlag(options, keys, "treeShaking", mustBeBoolean);
  let ignoreAnnotations = getFlag(options, keys, "ignoreAnnotations", mustBeBoolean);
  let jsx = getFlag(options, keys, "jsx", mustBeString);
  let jsxFactory = getFlag(options, keys, "jsxFactory", mustBeString);
  let jsxFragment = getFlag(options, keys, "jsxFragment", mustBeString);
  let define = getFlag(options, keys, "define", mustBeObject);
  let logOverride = getFlag(options, keys, "logOverride", mustBeObject);
  let supported = getFlag(options, keys, "supported", mustBeObject);
  let pure = getFlag(options, keys, "pure", mustBeArray);
  let keepNames = getFlag(options, keys, "keepNames", mustBeBoolean);
  if (legalComments)
    flags.push(`--legal-comments=${legalComments}`);
  if (sourceRoot !== void 0)
    flags.push(`--source-root=${sourceRoot}`);
  if (sourcesContent !== void 0)
    flags.push(`--sources-content=${sourcesContent}`);
  if (target) {
    if (Array.isArray(target))
      flags.push(`--target=${Array.from(target).map(validateTarget).join(",")}`);
    else
      flags.push(`--target=${validateTarget(target)}`);
  }
  if (format)
    flags.push(`--format=${format}`);
  if (globalName)
    flags.push(`--global-name=${globalName}`);
  if (minify)
    flags.push("--minify");
  if (minifySyntax)
    flags.push("--minify-syntax");
  if (minifyWhitespace)
    flags.push("--minify-whitespace");
  if (minifyIdentifiers)
    flags.push("--minify-identifiers");
  if (charset)
    flags.push(`--charset=${charset}`);
  if (treeShaking !== void 0)
    flags.push(`--tree-shaking=${treeShaking}`);
  if (ignoreAnnotations)
    flags.push(`--ignore-annotations`);
  if (drop)
    for (let what of drop)
      flags.push(`--drop:${what}`);
  if (mangleProps)
    flags.push(`--mangle-props=${mangleProps.source}`);
  if (reserveProps)
    flags.push(`--reserve-props=${reserveProps.source}`);
  if (mangleQuoted !== void 0)
    flags.push(`--mangle-quoted=${mangleQuoted}`);
  if (jsx)
    flags.push(`--jsx=${jsx}`);
  if (jsxFactory)
    flags.push(`--jsx-factory=${jsxFactory}`);
  if (jsxFragment)
    flags.push(`--jsx-fragment=${jsxFragment}`);
  if (define) {
    for (let key in define) {
      if (key.indexOf("=") >= 0)
        throw new Error(`Invalid define: ${key}`);
      flags.push(`--define:${key}=${define[key]}`);
    }
  }
  if (logOverride) {
    for (let key in logOverride) {
      if (key.indexOf("=") >= 0)
        throw new Error(`Invalid log override: ${key}`);
      flags.push(`--log-override:${key}=${logOverride[key]}`);
    }
  }
  if (supported) {
    for (let key in supported) {
      if (key.indexOf("=") >= 0)
        throw new Error(`Invalid supported: ${key}`);
      flags.push(`--supported:${key}=${supported[key]}`);
    }
  }
  if (pure)
    for (let fn of pure)
      flags.push(`--pure:${fn}`);
  if (keepNames)
    flags.push(`--keep-names`);
}
function flagsForBuildOptions(callName, options, isTTY, logLevelDefault, writeDefault) {
  let flags = [];
  let entries = [];
  let keys = /* @__PURE__ */ Object.create(null);
  let stdinContents = null;
  let stdinResolveDir = null;
  let watchMode = null;
  pushLogFlags(flags, options, keys, isTTY, logLevelDefault);
  pushCommonFlags(flags, options, keys);
  let sourcemap = getFlag(options, keys, "sourcemap", mustBeStringOrBoolean);
  let bundle = getFlag(options, keys, "bundle", mustBeBoolean);
  let watch = getFlag(options, keys, "watch", mustBeBooleanOrObject);
  let splitting = getFlag(options, keys, "splitting", mustBeBoolean);
  let preserveSymlinks = getFlag(options, keys, "preserveSymlinks", mustBeBoolean);
  let metafile = getFlag(options, keys, "metafile", mustBeBoolean);
  let outfile = getFlag(options, keys, "outfile", mustBeString);
  let outdir = getFlag(options, keys, "outdir", mustBeString);
  let outbase = getFlag(options, keys, "outbase", mustBeString);
  let platform = getFlag(options, keys, "platform", mustBeString);
  let tsconfig = getFlag(options, keys, "tsconfig", mustBeString);
  let resolveExtensions = getFlag(options, keys, "resolveExtensions", mustBeArray);
  let nodePathsInput = getFlag(options, keys, "nodePaths", mustBeArray);
  let mainFields = getFlag(options, keys, "mainFields", mustBeArray);
  let conditions = getFlag(options, keys, "conditions", mustBeArray);
  let external = getFlag(options, keys, "external", mustBeArray);
  let loader = getFlag(options, keys, "loader", mustBeObject);
  let outExtension = getFlag(options, keys, "outExtension", mustBeObject);
  let publicPath = getFlag(options, keys, "publicPath", mustBeString);
  let entryNames = getFlag(options, keys, "entryNames", mustBeString);
  let chunkNames = getFlag(options, keys, "chunkNames", mustBeString);
  let assetNames = getFlag(options, keys, "assetNames", mustBeString);
  let inject = getFlag(options, keys, "inject", mustBeArray);
  let banner = getFlag(options, keys, "banner", mustBeObject);
  let footer = getFlag(options, keys, "footer", mustBeObject);
  let entryPoints = getFlag(options, keys, "entryPoints", mustBeArrayOrRecord);
  let absWorkingDir = getFlag(options, keys, "absWorkingDir", mustBeString);
  let stdin = getFlag(options, keys, "stdin", mustBeObject);
  let write = getFlag(options, keys, "write", mustBeBoolean) ?? writeDefault;
  let allowOverwrite = getFlag(options, keys, "allowOverwrite", mustBeBoolean);
  let incremental = getFlag(options, keys, "incremental", mustBeBoolean) === true;
  let mangleCache = getFlag(options, keys, "mangleCache", mustBeObject);
  keys.plugins = true;
  checkForInvalidFlags(options, keys, `in ${callName}() call`);
  if (sourcemap)
    flags.push(`--sourcemap${sourcemap === true ? "" : `=${sourcemap}`}`);
  if (bundle)
    flags.push("--bundle");
  if (allowOverwrite)
    flags.push("--allow-overwrite");
  if (watch) {
    flags.push("--watch");
    if (typeof watch === "boolean") {
      watchMode = {};
    } else {
      let watchKeys = /* @__PURE__ */ Object.create(null);
      let onRebuild = getFlag(watch, watchKeys, "onRebuild", mustBeFunction);
      checkForInvalidFlags(watch, watchKeys, `on "watch" in ${callName}() call`);
      watchMode = { onRebuild };
    }
  }
  if (splitting)
    flags.push("--splitting");
  if (preserveSymlinks)
    flags.push("--preserve-symlinks");
  if (metafile)
    flags.push(`--metafile`);
  if (outfile)
    flags.push(`--outfile=${outfile}`);
  if (outdir)
    flags.push(`--outdir=${outdir}`);
  if (outbase)
    flags.push(`--outbase=${outbase}`);
  if (platform)
    flags.push(`--platform=${platform}`);
  if (tsconfig)
    flags.push(`--tsconfig=${tsconfig}`);
  if (resolveExtensions) {
    let values = [];
    for (let value of resolveExtensions) {
      value += "";
      if (value.indexOf(",") >= 0)
        throw new Error(`Invalid resolve extension: ${value}`);
      values.push(value);
    }
    flags.push(`--resolve-extensions=${values.join(",")}`);
  }
  if (publicPath)
    flags.push(`--public-path=${publicPath}`);
  if (entryNames)
    flags.push(`--entry-names=${entryNames}`);
  if (chunkNames)
    flags.push(`--chunk-names=${chunkNames}`);
  if (assetNames)
    flags.push(`--asset-names=${assetNames}`);
  if (mainFields) {
    let values = [];
    for (let value of mainFields) {
      value += "";
      if (value.indexOf(",") >= 0)
        throw new Error(`Invalid main field: ${value}`);
      values.push(value);
    }
    flags.push(`--main-fields=${values.join(",")}`);
  }
  if (conditions) {
    let values = [];
    for (let value of conditions) {
      value += "";
      if (value.indexOf(",") >= 0)
        throw new Error(`Invalid condition: ${value}`);
      values.push(value);
    }
    flags.push(`--conditions=${values.join(",")}`);
  }
  if (external)
    for (let name of external)
      flags.push(`--external:${name}`);
  if (banner) {
    for (let type in banner) {
      if (type.indexOf("=") >= 0)
        throw new Error(`Invalid banner file type: ${type}`);
      flags.push(`--banner:${type}=${banner[type]}`);
    }
  }
  if (footer) {
    for (let type in footer) {
      if (type.indexOf("=") >= 0)
        throw new Error(`Invalid footer file type: ${type}`);
      flags.push(`--footer:${type}=${footer[type]}`);
    }
  }
  if (inject)
    for (let path of inject)
      flags.push(`--inject:${path}`);
  if (loader) {
    for (let ext in loader) {
      if (ext.indexOf("=") >= 0)
        throw new Error(`Invalid loader extension: ${ext}`);
      flags.push(`--loader:${ext}=${loader[ext]}`);
    }
  }
  if (outExtension) {
    for (let ext in outExtension) {
      if (ext.indexOf("=") >= 0)
        throw new Error(`Invalid out extension: ${ext}`);
      flags.push(`--out-extension:${ext}=${outExtension[ext]}`);
    }
  }
  if (entryPoints) {
    if (Array.isArray(entryPoints)) {
      for (let entryPoint of entryPoints) {
        entries.push(["", entryPoint + ""]);
      }
    } else {
      for (let [key, value] of Object.entries(entryPoints)) {
        entries.push([key + "", value + ""]);
      }
    }
  }
  if (stdin) {
    let stdinKeys = /* @__PURE__ */ Object.create(null);
    let contents = getFlag(stdin, stdinKeys, "contents", mustBeString);
    let resolveDir = getFlag(stdin, stdinKeys, "resolveDir", mustBeString);
    let sourcefile = getFlag(stdin, stdinKeys, "sourcefile", mustBeString);
    let loader2 = getFlag(stdin, stdinKeys, "loader", mustBeString);
    checkForInvalidFlags(stdin, stdinKeys, 'in "stdin" object');
    if (sourcefile)
      flags.push(`--sourcefile=${sourcefile}`);
    if (loader2)
      flags.push(`--loader=${loader2}`);
    if (resolveDir)
      stdinResolveDir = resolveDir + "";
    stdinContents = contents ? contents + "" : "";
  }
  let nodePaths = [];
  if (nodePathsInput) {
    for (let value of nodePathsInput) {
      value += "";
      nodePaths.push(value);
    }
  }
  return {
    entries,
    flags,
    write,
    stdinContents,
    stdinResolveDir,
    absWorkingDir,
    incremental,
    nodePaths,
    watch: watchMode,
    mangleCache: validateMangleCache(mangleCache)
  };
}
function flagsForTransformOptions(callName, options, isTTY, logLevelDefault) {
  let flags = [];
  let keys = /* @__PURE__ */ Object.create(null);
  pushLogFlags(flags, options, keys, isTTY, logLevelDefault);
  pushCommonFlags(flags, options, keys);
  let sourcemap = getFlag(options, keys, "sourcemap", mustBeStringOrBoolean);
  let tsconfigRaw = getFlag(options, keys, "tsconfigRaw", mustBeStringOrObject);
  let sourcefile = getFlag(options, keys, "sourcefile", mustBeString);
  let loader = getFlag(options, keys, "loader", mustBeString);
  let banner = getFlag(options, keys, "banner", mustBeString);
  let footer = getFlag(options, keys, "footer", mustBeString);
  let mangleCache = getFlag(options, keys, "mangleCache", mustBeObject);
  checkForInvalidFlags(options, keys, `in ${callName}() call`);
  if (sourcemap)
    flags.push(`--sourcemap=${sourcemap === true ? "external" : sourcemap}`);
  if (tsconfigRaw)
    flags.push(`--tsconfig-raw=${typeof tsconfigRaw === "string" ? tsconfigRaw : JSON.stringify(tsconfigRaw)}`);
  if (sourcefile)
    flags.push(`--sourcefile=${sourcefile}`);
  if (loader)
    flags.push(`--loader=${loader}`);
  if (banner)
    flags.push(`--banner=${banner}`);
  if (footer)
    flags.push(`--footer=${footer}`);
  return {
    flags,
    mangleCache: validateMangleCache(mangleCache)
  };
}
function createChannel(streamIn) {
  let responseCallbacks = /* @__PURE__ */ new Map();
  let pluginCallbacks = /* @__PURE__ */ new Map();
  let watchCallbacks = /* @__PURE__ */ new Map();
  let serveCallbacks = /* @__PURE__ */ new Map();
  let closeData = null;
  let nextRequestID = 0;
  let nextBuildKey = 0;
  let stdout = new Uint8Array(16 * 1024);
  let stdoutUsed = 0;
  let readFromStdout = (chunk) => {
    let limit = stdoutUsed + chunk.length;
    if (limit > stdout.length) {
      let swap = new Uint8Array(limit * 2);
      swap.set(stdout);
      stdout = swap;
    }
    stdout.set(chunk, stdoutUsed);
    stdoutUsed += chunk.length;
    let offset = 0;
    while (offset + 4 <= stdoutUsed) {
      let length = readUInt32LE(stdout, offset);
      if (offset + 4 + length > stdoutUsed) {
        break;
      }
      offset += 4;
      handleIncomingPacket(stdout.subarray(offset, offset + length));
      offset += length;
    }
    if (offset > 0) {
      stdout.copyWithin(0, offset, stdoutUsed);
      stdoutUsed -= offset;
    }
  };
  let afterClose = (error) => {
    closeData = { reason: error ? ": " + (error.message || error) : "" };
    const text = "The service was stopped" + closeData.reason;
    for (let callback of responseCallbacks.values()) {
      callback(text, null);
    }
    responseCallbacks.clear();
    for (let callbacks of serveCallbacks.values()) {
      callbacks.onWait(text);
    }
    serveCallbacks.clear();
    for (let callback of watchCallbacks.values()) {
      try {
        callback(new Error(text), null);
      } catch (e) {
        console.error(e);
      }
    }
    watchCallbacks.clear();
  };
  let sendRequest = (refs, value, callback) => {
    if (closeData)
      return callback("The service is no longer running" + closeData.reason, null);
    let id = nextRequestID++;
    responseCallbacks.set(id, (error, response) => {
      try {
        callback(error, response);
      } finally {
        if (refs)
          refs.unref();
      }
    });
    if (refs)
      refs.ref();
    streamIn.writeToStdin(encodePacket({ id, isRequest: true, value }));
  };
  let sendResponse = (id, value) => {
    if (closeData)
      throw new Error("The service is no longer running" + closeData.reason);
    streamIn.writeToStdin(encodePacket({ id, isRequest: false, value }));
  };
  let handleRequest = async (id, request) => {
    try {
      switch (request.command) {
        case "ping": {
          sendResponse(id, {});
          break;
        }
        case "on-start": {
          let callback = pluginCallbacks.get(request.key);
          if (!callback)
            sendResponse(id, {});
          else
            sendResponse(id, await callback(request));
          break;
        }
        case "on-resolve": {
          let callback = pluginCallbacks.get(request.key);
          if (!callback)
            sendResponse(id, {});
          else
            sendResponse(id, await callback(request));
          break;
        }
        case "on-load": {
          let callback = pluginCallbacks.get(request.key);
          if (!callback)
            sendResponse(id, {});
          else
            sendResponse(id, await callback(request));
          break;
        }
        case "serve-request": {
          let callbacks = serveCallbacks.get(request.key);
          if (callbacks && callbacks.onRequest)
            callbacks.onRequest(request.args);
          sendResponse(id, {});
          break;
        }
        case "serve-wait": {
          let callbacks = serveCallbacks.get(request.key);
          if (callbacks)
            callbacks.onWait(request.error);
          sendResponse(id, {});
          break;
        }
        case "watch-rebuild": {
          let callback = watchCallbacks.get(request.key);
          try {
            if (callback)
              callback(null, request.args);
          } catch (err) {
            console.error(err);
          }
          sendResponse(id, {});
          break;
        }
        default:
          throw new Error(`Invalid command: ` + request.command);
      }
    } catch (e) {
      sendResponse(id, { errors: [extractErrorMessageV8(e, streamIn, null, void 0, "")] });
    }
  };
  let isFirstPacket = true;
  let handleIncomingPacket = (bytes) => {
    if (isFirstPacket) {
      isFirstPacket = false;
      let binaryVersion = String.fromCharCode(...bytes);
      if (binaryVersion !== "0.14.48") {
        throw new Error(`Cannot start service: Host version "${"0.14.48"}" does not match binary version ${JSON.stringify(binaryVersion)}`);
      }
      return;
    }
    let packet = decodePacket(bytes);
    if (packet.isRequest) {
      handleRequest(packet.id, packet.value);
    } else {
      let callback = responseCallbacks.get(packet.id);
      responseCallbacks.delete(packet.id);
      if (packet.value.error)
        callback(packet.value.error, {});
      else
        callback(null, packet.value);
    }
  };
  let handlePlugins = async (initialOptions, plugins, buildKey, stash, refs) => {
    let onStartCallbacks = [];
    let onEndCallbacks = [];
    let onResolveCallbacks = {};
    let onLoadCallbacks = {};
    let nextCallbackID = 0;
    let i = 0;
    let requestPlugins = [];
    let isSetupDone = false;
    plugins = [...plugins];
    for (let item of plugins) {
      let keys = {};
      if (typeof item !== "object")
        throw new Error(`Plugin at index ${i} must be an object`);
      const name = getFlag(item, keys, "name", mustBeString);
      if (typeof name !== "string" || name === "")
        throw new Error(`Plugin at index ${i} is missing a name`);
      try {
        let setup = getFlag(item, keys, "setup", mustBeFunction);
        if (typeof setup !== "function")
          throw new Error(`Plugin is missing a setup function`);
        checkForInvalidFlags(item, keys, `on plugin ${JSON.stringify(name)}`);
        let plugin = {
          name,
          onResolve: [],
          onLoad: []
        };
        i++;
        let resolve = (path, options = {}) => {
          if (!isSetupDone)
            throw new Error('Cannot call "resolve" before plugin setup has completed');
          if (typeof path !== "string")
            throw new Error(`The path to resolve must be a string`);
          let keys2 = /* @__PURE__ */ Object.create(null);
          let pluginName = getFlag(options, keys2, "pluginName", mustBeString);
          let importer = getFlag(options, keys2, "importer", mustBeString);
          let namespace = getFlag(options, keys2, "namespace", mustBeString);
          let resolveDir = getFlag(options, keys2, "resolveDir", mustBeString);
          let kind = getFlag(options, keys2, "kind", mustBeString);
          let pluginData = getFlag(options, keys2, "pluginData", canBeAnything);
          checkForInvalidFlags(options, keys2, "in resolve() call");
          return new Promise((resolve2, reject) => {
            const request = {
              command: "resolve",
              path,
              key: buildKey,
              pluginName: name
            };
            if (pluginName != null)
              request.pluginName = pluginName;
            if (importer != null)
              request.importer = importer;
            if (namespace != null)
              request.namespace = namespace;
            if (resolveDir != null)
              request.resolveDir = resolveDir;
            if (kind != null)
              request.kind = kind;
            if (pluginData != null)
              request.pluginData = stash.store(pluginData);
            sendRequest(refs, request, (error, response) => {
              if (error !== null)
                reject(new Error(error));
              else
                resolve2({
                  errors: replaceDetailsInMessages(response.errors, stash),
                  warnings: replaceDetailsInMessages(response.warnings, stash),
                  path: response.path,
                  external: response.external,
                  sideEffects: response.sideEffects,
                  namespace: response.namespace,
                  suffix: response.suffix,
                  pluginData: stash.load(response.pluginData)
                });
            });
          });
        };
        let promise = setup({
          initialOptions,
          resolve,
          onStart(callback2) {
            let registeredText = `This error came from the "onStart" callback registered here:`;
            let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onStart");
            onStartCallbacks.push({ name, callback: callback2, note: registeredNote });
          },
          onEnd(callback2) {
            let registeredText = `This error came from the "onEnd" callback registered here:`;
            let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onEnd");
            onEndCallbacks.push({ name, callback: callback2, note: registeredNote });
          },
          onResolve(options, callback2) {
            let registeredText = `This error came from the "onResolve" callback registered here:`;
            let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onResolve");
            let keys2 = {};
            let filter = getFlag(options, keys2, "filter", mustBeRegExp);
            let namespace = getFlag(options, keys2, "namespace", mustBeString);
            checkForInvalidFlags(options, keys2, `in onResolve() call for plugin ${JSON.stringify(name)}`);
            if (filter == null)
              throw new Error(`onResolve() call is missing a filter`);
            let id = nextCallbackID++;
            onResolveCallbacks[id] = { name, callback: callback2, note: registeredNote };
            plugin.onResolve.push({ id, filter: filter.source, namespace: namespace || "" });
          },
          onLoad(options, callback2) {
            let registeredText = `This error came from the "onLoad" callback registered here:`;
            let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onLoad");
            let keys2 = {};
            let filter = getFlag(options, keys2, "filter", mustBeRegExp);
            let namespace = getFlag(options, keys2, "namespace", mustBeString);
            checkForInvalidFlags(options, keys2, `in onLoad() call for plugin ${JSON.stringify(name)}`);
            if (filter == null)
              throw new Error(`onLoad() call is missing a filter`);
            let id = nextCallbackID++;
            onLoadCallbacks[id] = { name, callback: callback2, note: registeredNote };
            plugin.onLoad.push({ id, filter: filter.source, namespace: namespace || "" });
          },
          esbuild: streamIn.esbuild
        });
        if (promise)
          await promise;
        requestPlugins.push(plugin);
      } catch (e) {
        return { ok: false, error: e, pluginName: name };
      }
    }
    const callback = async (request) => {
      switch (request.command) {
        case "on-start": {
          let response = { errors: [], warnings: [] };
          await Promise.all(onStartCallbacks.map(async ({ name, callback: callback2, note }) => {
            try {
              let result = await callback2();
              if (result != null) {
                if (typeof result !== "object")
                  throw new Error(`Expected onStart() callback in plugin ${JSON.stringify(name)} to return an object`);
                let keys = {};
                let errors = getFlag(result, keys, "errors", mustBeArray);
                let warnings = getFlag(result, keys, "warnings", mustBeArray);
                checkForInvalidFlags(result, keys, `from onStart() callback in plugin ${JSON.stringify(name)}`);
                if (errors != null)
                  response.errors.push(...sanitizeMessages(errors, "errors", stash, name));
                if (warnings != null)
                  response.warnings.push(...sanitizeMessages(warnings, "warnings", stash, name));
              }
            } catch (e) {
              response.errors.push(extractErrorMessageV8(e, streamIn, stash, note && note(), name));
            }
          }));
          return response;
        }
        case "on-resolve": {
          let response = {}, name = "", callback2, note;
          for (let id of request.ids) {
            try {
              ({ name, callback: callback2, note } = onResolveCallbacks[id]);
              let result = await callback2({
                path: request.path,
                importer: request.importer,
                namespace: request.namespace,
                resolveDir: request.resolveDir,
                kind: request.kind,
                pluginData: stash.load(request.pluginData)
              });
              if (result != null) {
                if (typeof result !== "object")
                  throw new Error(`Expected onResolve() callback in plugin ${JSON.stringify(name)} to return an object`);
                let keys = {};
                let pluginName = getFlag(result, keys, "pluginName", mustBeString);
                let path = getFlag(result, keys, "path", mustBeString);
                let namespace = getFlag(result, keys, "namespace", mustBeString);
                let suffix = getFlag(result, keys, "suffix", mustBeString);
                let external = getFlag(result, keys, "external", mustBeBoolean);
                let sideEffects = getFlag(result, keys, "sideEffects", mustBeBoolean);
                let pluginData = getFlag(result, keys, "pluginData", canBeAnything);
                let errors = getFlag(result, keys, "errors", mustBeArray);
                let warnings = getFlag(result, keys, "warnings", mustBeArray);
                let watchFiles = getFlag(result, keys, "watchFiles", mustBeArray);
                let watchDirs = getFlag(result, keys, "watchDirs", mustBeArray);
                checkForInvalidFlags(result, keys, `from onResolve() callback in plugin ${JSON.stringify(name)}`);
                response.id = id;
                if (pluginName != null)
                  response.pluginName = pluginName;
                if (path != null)
                  response.path = path;
                if (namespace != null)
                  response.namespace = namespace;
                if (suffix != null)
                  response.suffix = suffix;
                if (external != null)
                  response.external = external;
                if (sideEffects != null)
                  response.sideEffects = sideEffects;
                if (pluginData != null)
                  response.pluginData = stash.store(pluginData);
                if (errors != null)
                  response.errors = sanitizeMessages(errors, "errors", stash, name);
                if (warnings != null)
                  response.warnings = sanitizeMessages(warnings, "warnings", stash, name);
                if (watchFiles != null)
                  response.watchFiles = sanitizeStringArray(watchFiles, "watchFiles");
                if (watchDirs != null)
                  response.watchDirs = sanitizeStringArray(watchDirs, "watchDirs");
                break;
              }
            } catch (e) {
              return { id, errors: [extractErrorMessageV8(e, streamIn, stash, note && note(), name)] };
            }
          }
          return response;
        }
        case "on-load": {
          let response = {}, name = "", callback2, note;
          for (let id of request.ids) {
            try {
              ({ name, callback: callback2, note } = onLoadCallbacks[id]);
              let result = await callback2({
                path: request.path,
                namespace: request.namespace,
                suffix: request.suffix,
                pluginData: stash.load(request.pluginData)
              });
              if (result != null) {
                if (typeof result !== "object")
                  throw new Error(`Expected onLoad() callback in plugin ${JSON.stringify(name)} to return an object`);
                let keys = {};
                let pluginName = getFlag(result, keys, "pluginName", mustBeString);
                let contents = getFlag(result, keys, "contents", mustBeStringOrUint8Array);
                let resolveDir = getFlag(result, keys, "resolveDir", mustBeString);
                let pluginData = getFlag(result, keys, "pluginData", canBeAnything);
                let loader = getFlag(result, keys, "loader", mustBeString);
                let errors = getFlag(result, keys, "errors", mustBeArray);
                let warnings = getFlag(result, keys, "warnings", mustBeArray);
                let watchFiles = getFlag(result, keys, "watchFiles", mustBeArray);
                let watchDirs = getFlag(result, keys, "watchDirs", mustBeArray);
                checkForInvalidFlags(result, keys, `from onLoad() callback in plugin ${JSON.stringify(name)}`);
                response.id = id;
                if (pluginName != null)
                  response.pluginName = pluginName;
                if (contents instanceof Uint8Array)
                  response.contents = contents;
                else if (contents != null)
                  response.contents = encodeUTF8(contents);
                if (resolveDir != null)
                  response.resolveDir = resolveDir;
                if (pluginData != null)
                  response.pluginData = stash.store(pluginData);
                if (loader != null)
                  response.loader = loader;
                if (errors != null)
                  response.errors = sanitizeMessages(errors, "errors", stash, name);
                if (warnings != null)
                  response.warnings = sanitizeMessages(warnings, "warnings", stash, name);
                if (watchFiles != null)
                  response.watchFiles = sanitizeStringArray(watchFiles, "watchFiles");
                if (watchDirs != null)
                  response.watchDirs = sanitizeStringArray(watchDirs, "watchDirs");
                break;
              }
            } catch (e) {
              return { id, errors: [extractErrorMessageV8(e, streamIn, stash, note && note(), name)] };
            }
          }
          return response;
        }
        default:
          throw new Error(`Invalid command: ` + request.command);
      }
    };
    let runOnEndCallbacks = (result, logPluginError, done) => done();
    if (onEndCallbacks.length > 0) {
      runOnEndCallbacks = (result, logPluginError, done) => {
        (async () => {
          for (const { name, callback: callback2, note } of onEndCallbacks) {
            try {
              await callback2(result);
            } catch (e) {
              result.errors.push(await new Promise((resolve) => logPluginError(e, name, note && note(), resolve)));
            }
          }
        })().then(done);
      };
    }
    isSetupDone = true;
    let refCount = 0;
    return {
      ok: true,
      requestPlugins,
      runOnEndCallbacks,
      pluginRefs: {
        ref() {
          if (++refCount === 1)
            pluginCallbacks.set(buildKey, callback);
        },
        unref() {
          if (--refCount === 0)
            pluginCallbacks.delete(buildKey);
        }
      }
    };
  };
  let buildServeData = (refs, options, request, key) => {
    let keys = {};
    let port = getFlag(options, keys, "port", mustBeInteger);
    let host = getFlag(options, keys, "host", mustBeString);
    let servedir = getFlag(options, keys, "servedir", mustBeString);
    let onRequest = getFlag(options, keys, "onRequest", mustBeFunction);
    let onWait;
    let wait = new Promise((resolve, reject) => {
      onWait = (error) => {
        serveCallbacks.delete(key);
        if (error !== null)
          reject(new Error(error));
        else
          resolve();
      };
    });
    request.serve = {};
    checkForInvalidFlags(options, keys, `in serve() call`);
    if (port !== void 0)
      request.serve.port = port;
    if (host !== void 0)
      request.serve.host = host;
    if (servedir !== void 0)
      request.serve.servedir = servedir;
    serveCallbacks.set(key, {
      onRequest,
      onWait
    });
    return {
      wait,
      stop() {
        sendRequest(refs, { command: "serve-stop", key }, () => {
        });
      }
    };
  };
  const buildLogLevelDefault = "warning";
  const transformLogLevelDefault = "silent";
  let buildOrServe = (args) => {
    let key = nextBuildKey++;
    const details = createObjectStash();
    let plugins;
    let { refs, options, isTTY, callback } = args;
    if (typeof options === "object") {
      let value = options.plugins;
      if (value !== void 0) {
        if (!Array.isArray(value))
          throw new Error(`"plugins" must be an array`);
        plugins = value;
      }
    }
    let logPluginError = (e, pluginName, note, done) => {
      let flags = [];
      try {
        pushLogFlags(flags, options, {}, isTTY, buildLogLevelDefault);
      } catch {
      }
      const message = extractErrorMessageV8(e, streamIn, details, note, pluginName);
      sendRequest(refs, { command: "error", flags, error: message }, () => {
        message.detail = details.load(message.detail);
        done(message);
      });
    };
    let handleError = (e, pluginName) => {
      logPluginError(e, pluginName, void 0, (error) => {
        callback(failureErrorWithLog("Build failed", [error], []), null);
      });
    };
    if (plugins && plugins.length > 0) {
      if (streamIn.isSync)
        return handleError(new Error("Cannot use plugins in synchronous API calls"), "");
      handlePlugins(options, plugins, key, details, refs).then((result) => {
        if (!result.ok) {
          handleError(result.error, result.pluginName);
        } else {
          try {
            buildOrServeContinue({
              ...args,
              key,
              details,
              logPluginError,
              requestPlugins: result.requestPlugins,
              runOnEndCallbacks: result.runOnEndCallbacks,
              pluginRefs: result.pluginRefs
            });
          } catch (e) {
            handleError(e, "");
          }
        }
      }, (e) => handleError(e, ""));
    } else {
      try {
        buildOrServeContinue({
          ...args,
          key,
          details,
          logPluginError,
          requestPlugins: null,
          runOnEndCallbacks: (result, logPluginError2, done) => done(),
          pluginRefs: null
        });
      } catch (e) {
        handleError(e, "");
      }
    }
  };
  let buildOrServeContinue = ({
    callName,
    refs: callerRefs,
    serveOptions,
    options,
    isTTY,
    defaultWD,
    callback,
    key,
    details,
    logPluginError,
    requestPlugins,
    runOnEndCallbacks,
    pluginRefs
  }) => {
    const refs = {
      ref() {
        if (pluginRefs)
          pluginRefs.ref();
        if (callerRefs)
          callerRefs.ref();
      },
      unref() {
        if (pluginRefs)
          pluginRefs.unref();
        if (callerRefs)
          callerRefs.unref();
      }
    };
    let writeDefault = !streamIn.isWriteUnavailable;
    let {
      entries,
      flags,
      write,
      stdinContents,
      stdinResolveDir,
      absWorkingDir,
      incremental,
      nodePaths,
      watch,
      mangleCache
    } = flagsForBuildOptions(callName, options, isTTY, buildLogLevelDefault, writeDefault);
    let request = {
      command: "build",
      key,
      entries,
      flags,
      write,
      stdinContents,
      stdinResolveDir,
      absWorkingDir: absWorkingDir || defaultWD,
      incremental,
      nodePaths
    };
    if (requestPlugins)
      request.plugins = requestPlugins;
    if (mangleCache)
      request.mangleCache = mangleCache;
    let serve2 = serveOptions && buildServeData(refs, serveOptions, request, key);
    let rebuild;
    let stop2;
    let copyResponseToResult = (response, result) => {
      if (response.outputFiles)
        result.outputFiles = response.outputFiles.map(convertOutputFiles);
      if (response.metafile)
        result.metafile = JSON.parse(response.metafile);
      if (response.mangleCache)
        result.mangleCache = response.mangleCache;
      if (response.writeToStdout !== void 0)
        console.log(decodeUTF8(response.writeToStdout).replace(/\n$/, ""));
    };
    let buildResponseToResult = (response, callback2) => {
      let result = {
        errors: replaceDetailsInMessages(response.errors, details),
        warnings: replaceDetailsInMessages(response.warnings, details)
      };
      copyResponseToResult(response, result);
      runOnEndCallbacks(result, logPluginError, () => {
        if (result.errors.length > 0) {
          return callback2(failureErrorWithLog("Build failed", result.errors, result.warnings), null);
        }
        if (response.rebuild) {
          if (!rebuild) {
            let isDisposed = false;
            rebuild = () => new Promise((resolve, reject) => {
              if (isDisposed || closeData)
                throw new Error("Cannot rebuild");
              sendRequest(refs, { command: "rebuild", key }, (error2, response2) => {
                if (error2) {
                  const message = { id: "", pluginName: "", text: error2, location: null, notes: [], detail: void 0 };
                  return callback2(failureErrorWithLog("Build failed", [message], []), null);
                }
                buildResponseToResult(response2, (error3, result3) => {
                  if (error3)
                    reject(error3);
                  else
                    resolve(result3);
                });
              });
            });
            refs.ref();
            rebuild.dispose = () => {
              if (isDisposed)
                return;
              isDisposed = true;
              sendRequest(refs, { command: "rebuild-dispose", key }, () => {
              });
              refs.unref();
            };
          }
          result.rebuild = rebuild;
        }
        if (response.watch) {
          if (!stop2) {
            let isStopped = false;
            refs.ref();
            stop2 = () => {
              if (isStopped)
                return;
              isStopped = true;
              watchCallbacks.delete(key);
              sendRequest(refs, { command: "watch-stop", key }, () => {
              });
              refs.unref();
            };
            if (watch) {
              watchCallbacks.set(key, (serviceStopError, watchResponse) => {
                if (serviceStopError) {
                  if (watch.onRebuild)
                    watch.onRebuild(serviceStopError, null);
                  return;
                }
                let result2 = {
                  errors: replaceDetailsInMessages(watchResponse.errors, details),
                  warnings: replaceDetailsInMessages(watchResponse.warnings, details)
                };
                copyResponseToResult(watchResponse, result2);
                runOnEndCallbacks(result2, logPluginError, () => {
                  if (result2.errors.length > 0) {
                    if (watch.onRebuild)
                      watch.onRebuild(failureErrorWithLog("Build failed", result2.errors, result2.warnings), null);
                    return;
                  }
                  if (watchResponse.rebuildID !== void 0)
                    result2.rebuild = rebuild;
                  result2.stop = stop2;
                  if (watch.onRebuild)
                    watch.onRebuild(null, result2);
                });
              });
            }
          }
          result.stop = stop2;
        }
        callback2(null, result);
      });
    };
    if (write && streamIn.isWriteUnavailable)
      throw new Error(`The "write" option is unavailable in this environment`);
    if (incremental && streamIn.isSync)
      throw new Error(`Cannot use "incremental" with a synchronous build`);
    if (watch && streamIn.isSync)
      throw new Error(`Cannot use "watch" with a synchronous build`);
    sendRequest(refs, request, (error, response) => {
      if (error)
        return callback(new Error(error), null);
      if (serve2) {
        let serveResponse = response;
        let isStopped = false;
        refs.ref();
        let result = {
          port: serveResponse.port,
          host: serveResponse.host,
          wait: serve2.wait,
          stop() {
            if (isStopped)
              return;
            isStopped = true;
            serve2.stop();
            refs.unref();
          }
        };
        refs.ref();
        serve2.wait.then(refs.unref, refs.unref);
        return callback(null, result);
      }
      return buildResponseToResult(response, callback);
    });
  };
  let transform2 = ({ callName, refs, input, options, isTTY, fs, callback }) => {
    const details = createObjectStash();
    let start = (inputPath) => {
      try {
        if (typeof input !== "string")
          throw new Error('The input to "transform" must be a string');
        let {
          flags,
          mangleCache
        } = flagsForTransformOptions(callName, options, isTTY, transformLogLevelDefault);
        let request = {
          command: "transform",
          flags,
          inputFS: inputPath !== null,
          input: inputPath !== null ? inputPath : input
        };
        if (mangleCache)
          request.mangleCache = mangleCache;
        sendRequest(refs, request, (error, response) => {
          if (error)
            return callback(new Error(error), null);
          let errors = replaceDetailsInMessages(response.errors, details);
          let warnings = replaceDetailsInMessages(response.warnings, details);
          let outstanding = 1;
          let next = () => {
            if (--outstanding === 0) {
              let result = { warnings, code: response.code, map: response.map };
              if (response.mangleCache)
                result.mangleCache = response?.mangleCache;
              callback(null, result);
            }
          };
          if (errors.length > 0)
            return callback(failureErrorWithLog("Transform failed", errors, warnings), null);
          if (response.codeFS) {
            outstanding++;
            fs.readFile(response.code, (err, contents) => {
              if (err !== null) {
                callback(err, null);
              } else {
                response.code = contents;
                next();
              }
            });
          }
          if (response.mapFS) {
            outstanding++;
            fs.readFile(response.map, (err, contents) => {
              if (err !== null) {
                callback(err, null);
              } else {
                response.map = contents;
                next();
              }
            });
          }
          next();
        });
      } catch (e) {
        let flags = [];
        try {
          pushLogFlags(flags, options, {}, isTTY, transformLogLevelDefault);
        } catch {
        }
        const error = extractErrorMessageV8(e, streamIn, details, void 0, "");
        sendRequest(refs, { command: "error", flags, error }, () => {
          error.detail = details.load(error.detail);
          callback(failureErrorWithLog("Transform failed", [error], []), null);
        });
      }
    };
    if (typeof input === "string" && input.length > 1024 * 1024) {
      let next = start;
      start = () => fs.writeFile(input, next);
    }
    start(null);
  };
  let formatMessages2 = ({ callName, refs, messages, options, callback }) => {
    let result = sanitizeMessages(messages, "messages", null, "");
    if (!options)
      throw new Error(`Missing second argument in ${callName}() call`);
    let keys = {};
    let kind = getFlag(options, keys, "kind", mustBeString);
    let color = getFlag(options, keys, "color", mustBeBoolean);
    let terminalWidth = getFlag(options, keys, "terminalWidth", mustBeInteger);
    checkForInvalidFlags(options, keys, `in ${callName}() call`);
    if (kind === void 0)
      throw new Error(`Missing "kind" in ${callName}() call`);
    if (kind !== "error" && kind !== "warning")
      throw new Error(`Expected "kind" to be "error" or "warning" in ${callName}() call`);
    let request = {
      command: "format-msgs",
      messages: result,
      isWarning: kind === "warning"
    };
    if (color !== void 0)
      request.color = color;
    if (terminalWidth !== void 0)
      request.terminalWidth = terminalWidth;
    sendRequest(refs, request, (error, response) => {
      if (error)
        return callback(new Error(error), null);
      callback(null, response.messages);
    });
  };
  let analyzeMetafile2 = ({ callName, refs, metafile, options, callback }) => {
    if (options === void 0)
      options = {};
    let keys = {};
    let color = getFlag(options, keys, "color", mustBeBoolean);
    let verbose = getFlag(options, keys, "verbose", mustBeBoolean);
    checkForInvalidFlags(options, keys, `in ${callName}() call`);
    let request = {
      command: "analyze-metafile",
      metafile
    };
    if (color !== void 0)
      request.color = color;
    if (verbose !== void 0)
      request.verbose = verbose;
    sendRequest(refs, request, (error, response) => {
      if (error)
        return callback(new Error(error), null);
      callback(null, response.result);
    });
  };
  return {
    readFromStdout,
    afterClose,
    service: {
      buildOrServe,
      transform: transform2,
      formatMessages: formatMessages2,
      analyzeMetafile: analyzeMetafile2
    }
  };
}
function createObjectStash() {
  const map = /* @__PURE__ */ new Map();
  let nextID = 0;
  return {
    load(id) {
      return map.get(id);
    },
    store(value) {
      if (value === void 0)
        return -1;
      const id = nextID++;
      map.set(id, value);
      return id;
    }
  };
}
function extractCallerV8(e, streamIn, ident) {
  let note;
  let tried = false;
  return () => {
    if (tried)
      return note;
    tried = true;
    try {
      let lines = (e.stack + "").split("\n");
      lines.splice(1, 1);
      let location = parseStackLinesV8(streamIn, lines, ident);
      if (location) {
        note = { text: e.message, location };
        return note;
      }
    } catch {
    }
  };
}
function extractErrorMessageV8(e, streamIn, stash, note, pluginName) {
  let text = "Internal error";
  let location = null;
  try {
    text = (e && e.message || e) + "";
  } catch {
  }
  try {
    location = parseStackLinesV8(streamIn, (e.stack + "").split("\n"), "");
  } catch {
  }
  return { id: "", pluginName, text, location, notes: note ? [note] : [], detail: stash ? stash.store(e) : -1 };
}
function parseStackLinesV8(streamIn, lines, ident) {
  let at = "    at ";
  if (streamIn.readFileSync && !lines[0].startsWith(at) && lines[1].startsWith(at)) {
    for (let i = 1; i < lines.length; i++) {
      let line = lines[i];
      if (!line.startsWith(at))
        continue;
      line = line.slice(at.length);
      while (true) {
        let match = /^(?:new |async )?\S+ \((.*)\)$/.exec(line);
        if (match) {
          line = match[1];
          continue;
        }
        match = /^eval at \S+ \((.*)\)(?:, \S+:\d+:\d+)?$/.exec(line);
        if (match) {
          line = match[1];
          continue;
        }
        match = /^(\S+):(\d+):(\d+)$/.exec(line);
        if (match) {
          let contents;
          try {
            contents = streamIn.readFileSync(match[1], "utf8");
          } catch {
            break;
          }
          let lineText = contents.split(/\r\n|\r|\n|\u2028|\u2029/)[+match[2] - 1] || "";
          let column = +match[3] - 1;
          let length = lineText.slice(column, column + ident.length) === ident ? ident.length : 0;
          return {
            file: match[1],
            namespace: "file",
            line: +match[2],
            column: encodeUTF8(lineText.slice(0, column)).length,
            length: encodeUTF8(lineText.slice(column, column + length)).length,
            lineText: lineText + "\n" + lines.slice(1).join("\n"),
            suggestion: ""
          };
        }
        break;
      }
    }
  }
  return null;
}
function failureErrorWithLog(text, errors, warnings) {
  let limit = 5;
  let summary = errors.length < 1 ? "" : ` with ${errors.length} error${errors.length < 2 ? "" : "s"}:` + errors.slice(0, limit + 1).map((e, i) => {
    if (i === limit)
      return "\n...";
    if (!e.location)
      return `
error: ${e.text}`;
    let { file, line, column } = e.location;
    let pluginText = e.pluginName ? `[plugin: ${e.pluginName}] ` : "";
    return `
${file}:${line}:${column}: ERROR: ${pluginText}${e.text}`;
  }).join("");
  let error = new Error(`${text}${summary}`);
  error.errors = errors;
  error.warnings = warnings;
  return error;
}
function replaceDetailsInMessages(messages, stash) {
  for (const message of messages) {
    message.detail = stash.load(message.detail);
  }
  return messages;
}
function sanitizeLocation(location, where) {
  if (location == null)
    return null;
  let keys = {};
  let file = getFlag(location, keys, "file", mustBeString);
  let namespace = getFlag(location, keys, "namespace", mustBeString);
  let line = getFlag(location, keys, "line", mustBeInteger);
  let column = getFlag(location, keys, "column", mustBeInteger);
  let length = getFlag(location, keys, "length", mustBeInteger);
  let lineText = getFlag(location, keys, "lineText", mustBeString);
  let suggestion = getFlag(location, keys, "suggestion", mustBeString);
  checkForInvalidFlags(location, keys, where);
  return {
    file: file || "",
    namespace: namespace || "",
    line: line || 0,
    column: column || 0,
    length: length || 0,
    lineText: lineText || "",
    suggestion: suggestion || ""
  };
}
function sanitizeMessages(messages, property, stash, fallbackPluginName) {
  let messagesClone = [];
  let index = 0;
  for (const message of messages) {
    let keys = {};
    let id = getFlag(message, keys, "id", mustBeString);
    let pluginName = getFlag(message, keys, "pluginName", mustBeString);
    let text = getFlag(message, keys, "text", mustBeString);
    let location = getFlag(message, keys, "location", mustBeObjectOrNull);
    let notes = getFlag(message, keys, "notes", mustBeArray);
    let detail = getFlag(message, keys, "detail", canBeAnything);
    let where = `in element ${index} of "${property}"`;
    checkForInvalidFlags(message, keys, where);
    let notesClone = [];
    if (notes) {
      for (const note of notes) {
        let noteKeys = {};
        let noteText = getFlag(note, noteKeys, "text", mustBeString);
        let noteLocation = getFlag(note, noteKeys, "location", mustBeObjectOrNull);
        checkForInvalidFlags(note, noteKeys, where);
        notesClone.push({
          text: noteText || "",
          location: sanitizeLocation(noteLocation, where)
        });
      }
    }
    messagesClone.push({
      id: id || "",
      pluginName: pluginName || fallbackPluginName,
      text: text || "",
      location: sanitizeLocation(location, where),
      notes: notesClone,
      detail: stash ? stash.store(detail) : -1
    });
    index++;
  }
  return messagesClone;
}
function sanitizeStringArray(values, property) {
  const result = [];
  for (const value of values) {
    if (typeof value !== "string")
      throw new Error(`${JSON.stringify(property)} must be an array of strings`);
    result.push(value);
  }
  return result;
}
function convertOutputFiles({ path, contents }) {
  let text = null;
  return {
    path,
    contents,
    get text() {
      if (text === null)
        text = decodeUTF8(contents);
      return text;
    }
  };
}

// lib/deno/wasm.ts
var version = "0.14.48";
var build = (options) => ensureServiceIsRunning().then((service) => service.build(options));
var serve = () => {
  throw new Error(`The "serve" API does not work in Deno via WebAssembly`);
};
var transform = (input, options) => ensureServiceIsRunning().then((service) => service.transform(input, options));
var formatMessages = (messages, options) => ensureServiceIsRunning().then((service) => service.formatMessages(messages, options));
var analyzeMetafile = (metafile, options) => ensureServiceIsRunning().then((service) => service.analyzeMetafile(metafile, options));
var buildSync = () => {
  throw new Error(`The "buildSync" API does not work in Deno`);
};
var transformSync = () => {
  throw new Error(`The "transformSync" API does not work in Deno`);
};
var formatMessagesSync = () => {
  throw new Error(`The "formatMessagesSync" API does not work in Deno`);
};
var analyzeMetafileSync = () => {
  throw new Error(`The "analyzeMetafileSync" API does not work in Deno`);
};
var stop = () => {
  if (stopService)
    stopService();
};
var initializePromise;
var stopService;
var ensureServiceIsRunning = () => {
  return initializePromise || startRunningService("", void 0, true);
};
var initialize = async (options) => {
  options = validateInitializeOptions(options || {});
  let wasmURL = options.wasmURL;
  let wasmModule = options.wasmModule;
  let useWorker = options.worker !== false;
  if (initializePromise)
    throw new Error('Cannot call "initialize" more than once');
  initializePromise = startRunningService(wasmURL || "", wasmModule, useWorker);
  initializePromise.catch(() => {
    initializePromise = void 0;
  });
  await initializePromise;
};
var startRunningService = async (wasmURL, wasmModule, useWorker) => {
  let wasm;
  if (wasmModule) {
    wasm = wasmModule;
  } else {
    if (!wasmURL)
      wasmURL = new URL("esbuild.wasm", import.meta.url).href;
    wasm = await WebAssembly.compileStreaming(fetch(wasmURL));
  }
  let worker;
  if (useWorker) {
    let blob = new Blob([`onmessage=${'(postMessage=>{\n// Copyright 2018 The Go Authors. All rights reserved.\n// Use of this source code is governed by a BSD-style\n// license that can be found in the LICENSE file.\nlet onmessage,globalThis={};for(let r=self;r;r=Object.getPrototypeOf(r))for(let f of Object.getOwnPropertyNames(r))f in globalThis||Object.defineProperty(globalThis,f,{get:()=>self[f]});return(()=>{const r=()=>{const c=new Error("not implemented");return c.code="ENOSYS",c};if(!globalThis.fs){let c="";globalThis.fs={constants:{O_WRONLY:-1,O_RDWR:-1,O_CREAT:-1,O_TRUNC:-1,O_APPEND:-1,O_EXCL:-1},writeSync(n,s){c+=g.decode(s);const i=c.lastIndexOf(`\n`);return i!=-1&&(console.log(c.substr(0,i)),c=c.substr(i+1)),s.length},write(n,s,i,a,h,u){if(i!==0||a!==s.length||h!==null){u(r());return}const d=this.writeSync(n,s);u(null,d)},chmod(n,s,i){i(r())},chown(n,s,i,a){a(r())},close(n,s){s(r())},fchmod(n,s,i){i(r())},fchown(n,s,i,a){a(r())},fstat(n,s){s(r())},fsync(n,s){s(null)},ftruncate(n,s,i){i(r())},lchown(n,s,i,a){a(r())},link(n,s,i){i(r())},lstat(n,s){s(r())},mkdir(n,s,i){i(r())},open(n,s,i,a){a(r())},read(n,s,i,a,h,u){u(r())},readdir(n,s){s(r())},readlink(n,s){s(r())},rename(n,s,i){i(r())},rmdir(n,s){s(r())},stat(n,s){s(r())},symlink(n,s,i){i(r())},truncate(n,s,i){i(r())},unlink(n,s){s(r())},utimes(n,s,i,a){a(r())}}}if(globalThis.process||(globalThis.process={getuid(){return-1},getgid(){return-1},geteuid(){return-1},getegid(){return-1},getgroups(){throw r()},pid:-1,ppid:-1,umask(){throw r()},cwd(){throw r()},chdir(){throw r()}}),!globalThis.crypto)throw new Error("globalThis.crypto is not available, polyfill required (crypto.getRandomValues only)");if(!globalThis.performance)throw new Error("globalThis.performance is not available, polyfill required (performance.now only)");if(!globalThis.TextEncoder)throw new Error("globalThis.TextEncoder is not available, polyfill required");if(!globalThis.TextDecoder)throw new Error("globalThis.TextDecoder is not available, polyfill required");const f=new TextEncoder("utf-8"),g=new TextDecoder("utf-8");globalThis.Go=class{constructor(){this.argv=["js"],this.env={},this.exit=e=>{e!==0&&console.warn("exit code:",e)},this._exitPromise=new Promise(e=>{this._resolveExitPromise=e}),this._pendingEvent=null,this._scheduledTimeouts=new Map,this._nextCallbackTimeoutID=1;const c=(e,t)=>{this.mem.setUint32(e+0,t,!0),this.mem.setUint32(e+4,Math.floor(t/4294967296),!0)},n=e=>{const t=this.mem.getUint32(e+0,!0),o=this.mem.getInt32(e+4,!0);return t+o*4294967296},s=e=>{const t=this.mem.getFloat64(e,!0);if(t===0)return;if(!isNaN(t))return t;const o=this.mem.getUint32(e,!0);return this._values[o]},i=(e,t)=>{if(typeof t=="number"&&t!==0){if(isNaN(t)){this.mem.setUint32(e+4,2146959360,!0),this.mem.setUint32(e,0,!0);return}this.mem.setFloat64(e,t,!0);return}if(t===void 0){this.mem.setFloat64(e,0,!0);return}let l=this._ids.get(t);l===void 0&&(l=this._idPool.pop(),l===void 0&&(l=this._values.length),this._values[l]=t,this._goRefCounts[l]=0,this._ids.set(t,l)),this._goRefCounts[l]++;let m=0;switch(typeof t){case"object":t!==null&&(m=1);break;case"string":m=2;break;case"symbol":m=3;break;case"function":m=4;break}this.mem.setUint32(e+4,2146959360|m,!0),this.mem.setUint32(e,l,!0)},a=e=>{const t=n(e+0),o=n(e+8);return new Uint8Array(this._inst.exports.mem.buffer,t,o)},h=e=>{const t=n(e+0),o=n(e+8),l=new Array(o);for(let m=0;m<o;m++)l[m]=s(t+m*8);return l},u=e=>{const t=n(e+0),o=n(e+8);return g.decode(new DataView(this._inst.exports.mem.buffer,t,o))},d=Date.now()-performance.now();this.importObject={go:{"runtime.wasmExit":e=>{e>>>=0;const t=this.mem.getInt32(e+8,!0);this.exited=!0,delete this._inst,delete this._values,delete this._goRefCounts,delete this._ids,delete this._idPool,this.exit(t)},"runtime.wasmWrite":e=>{e>>>=0;const t=n(e+8),o=n(e+16),l=this.mem.getInt32(e+24,!0);globalThis.fs.writeSync(t,new Uint8Array(this._inst.exports.mem.buffer,o,l))},"runtime.resetMemoryDataView":e=>{e>>>=0,this.mem=new DataView(this._inst.exports.mem.buffer)},"runtime.nanotime1":e=>{e>>>=0,c(e+8,(d+performance.now())*1e6)},"runtime.walltime":e=>{e>>>=0;const t=new Date().getTime();c(e+8,t/1e3),this.mem.setInt32(e+16,t%1e3*1e6,!0)},"runtime.scheduleTimeoutEvent":e=>{e>>>=0;const t=this._nextCallbackTimeoutID;this._nextCallbackTimeoutID++,this._scheduledTimeouts.set(t,setTimeout(()=>{for(this._resume();this._scheduledTimeouts.has(t);)console.warn("scheduleTimeoutEvent: missed timeout event"),this._resume()},n(e+8)+1)),this.mem.setInt32(e+16,t,!0)},"runtime.clearTimeoutEvent":e=>{e>>>=0;const t=this.mem.getInt32(e+8,!0);clearTimeout(this._scheduledTimeouts.get(t)),this._scheduledTimeouts.delete(t)},"runtime.getRandomData":e=>{e>>>=0,crypto.getRandomValues(a(e+8))},"syscall/js.finalizeRef":e=>{e>>>=0;const t=this.mem.getUint32(e+8,!0);if(this._goRefCounts[t]--,this._goRefCounts[t]===0){const o=this._values[t];this._values[t]=null,this._ids.delete(o),this._idPool.push(t)}},"syscall/js.stringVal":e=>{e>>>=0,i(e+24,u(e+8))},"syscall/js.valueGet":e=>{e>>>=0;const t=Reflect.get(s(e+8),u(e+16));e=this._inst.exports.getsp()>>>0,i(e+32,t)},"syscall/js.valueSet":e=>{e>>>=0,Reflect.set(s(e+8),u(e+16),s(e+32))},"syscall/js.valueDelete":e=>{e>>>=0,Reflect.deleteProperty(s(e+8),u(e+16))},"syscall/js.valueIndex":e=>{e>>>=0,i(e+24,Reflect.get(s(e+8),n(e+16)))},"syscall/js.valueSetIndex":e=>{e>>>=0,Reflect.set(s(e+8),n(e+16),s(e+24))},"syscall/js.valueCall":e=>{e>>>=0;try{const t=s(e+8),o=Reflect.get(t,u(e+16)),l=h(e+32),m=Reflect.apply(o,t,l);e=this._inst.exports.getsp()>>>0,i(e+56,m),this.mem.setUint8(e+64,1)}catch(t){e=this._inst.exports.getsp()>>>0,i(e+56,t),this.mem.setUint8(e+64,0)}},"syscall/js.valueInvoke":e=>{e>>>=0;try{const t=s(e+8),o=h(e+16),l=Reflect.apply(t,void 0,o);e=this._inst.exports.getsp()>>>0,i(e+40,l),this.mem.setUint8(e+48,1)}catch(t){e=this._inst.exports.getsp()>>>0,i(e+40,t),this.mem.setUint8(e+48,0)}},"syscall/js.valueNew":e=>{e>>>=0;try{const t=s(e+8),o=h(e+16),l=Reflect.construct(t,o);e=this._inst.exports.getsp()>>>0,i(e+40,l),this.mem.setUint8(e+48,1)}catch(t){e=this._inst.exports.getsp()>>>0,i(e+40,t),this.mem.setUint8(e+48,0)}},"syscall/js.valueLength":e=>{e>>>=0,c(e+16,parseInt(s(e+8).length))},"syscall/js.valuePrepareString":e=>{e>>>=0;const t=f.encode(String(s(e+8)));i(e+16,t),c(e+24,t.length)},"syscall/js.valueLoadString":e=>{e>>>=0;const t=s(e+8);a(e+16).set(t)},"syscall/js.valueInstanceOf":e=>{e>>>=0,this.mem.setUint8(e+24,s(e+8)instanceof s(e+16)?1:0)},"syscall/js.copyBytesToGo":e=>{e>>>=0;const t=a(e+8),o=s(e+32);if(!(o instanceof Uint8Array||o instanceof Uint8ClampedArray)){this.mem.setUint8(e+48,0);return}const l=o.subarray(0,t.length);t.set(l),c(e+40,l.length),this.mem.setUint8(e+48,1)},"syscall/js.copyBytesToJS":e=>{e>>>=0;const t=s(e+8),o=a(e+16);if(!(t instanceof Uint8Array||t instanceof Uint8ClampedArray)){this.mem.setUint8(e+48,0);return}const l=o.subarray(0,t.length);t.set(l),c(e+40,l.length),this.mem.setUint8(e+48,1)},debug:e=>{console.log(e)}}}}async run(c){if(!(c instanceof WebAssembly.Instance))throw new Error("Go.run: WebAssembly.Instance expected");this._inst=c,this.mem=new DataView(this._inst.exports.mem.buffer),this._values=[NaN,0,null,!0,!1,globalThis,this],this._goRefCounts=new Array(this._values.length).fill(1/0),this._ids=new Map([[0,1],[null,2],[!0,3],[!1,4],[globalThis,5],[this,6]]),this._idPool=[],this.exited=!1;let n=4096;const s=e=>{const t=n,o=f.encode(e+"\\0");return new Uint8Array(this.mem.buffer,n,o.length).set(o),n+=o.length,n%8!==0&&(n+=8-n%8),t},i=this.argv.length,a=[];this.argv.forEach(e=>{a.push(s(e))}),a.push(0),Object.keys(this.env).sort().forEach(e=>{a.push(s(`${e}=${this.env[e]}`))}),a.push(0);const u=n;a.forEach(e=>{this.mem.setUint32(n,e,!0),this.mem.setUint32(n+4,0,!0),n+=8});const d=4096+8192;if(n>=d)throw new Error("total length of command line and environment variables exceeds limit");this._inst.exports.run(i,u),this.exited&&this._resolveExitPromise(),await this._exitPromise}_resume(){if(this.exited)throw new Error("Go program has already exited");this._inst.exports.resume(),this.exited&&this._resolveExitPromise()}_makeFuncWrapper(c){const n=this;return function(){const s={id:c,this:this,args:arguments};return n._pendingEvent=s,n._resume(),s.result}}}})(),onmessage=({data:r})=>{let f=new TextDecoder,g=globalThis.fs,c="";g.writeSync=(h,u)=>{if(h===1)postMessage(u);else if(h===2){c+=f.decode(u);let d=c.split(`\n`);d.length>1&&console.log(d.slice(0,-1).join(`\n`)),c=d[d.length-1]}else throw new Error("Bad write");return u.length};let n=[],s,i=0;onmessage=({data:h})=>{h.length>0&&(n.push(h),s&&s())},g.read=(h,u,d,e,t,o)=>{if(h!==0||d!==0||e!==u.length||t!==null)throw new Error("Bad read");if(n.length===0){s=()=>g.read(h,u,d,e,t,o);return}let l=n[0],m=Math.max(0,Math.min(e,l.length-i));u.set(l.subarray(i,i+m),d),i+=m,i===l.length&&(n.shift(),i=0),o(null,m)};let a=new globalThis.Go;a.argv=["","--service=0.14.48"],r instanceof WebAssembly.Module?WebAssembly.instantiate(r,a.importObject).then(h=>a.run(h)):WebAssembly.instantiate(r,a.importObject).then(({instance:h})=>a.run(h))},r=>onmessage(r);})'}(postMessage)`], { type: "text/javascript" });
    worker = new Worker(URL.createObjectURL(blob), { type: "module" });
  } else {
    let onmessage = (postMessage=>{
// Copyright 2018 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.
let onmessage,globalThis={};for(let r=self;r;r=Object.getPrototypeOf(r))for(let f of Object.getOwnPropertyNames(r))f in globalThis||Object.defineProperty(globalThis,f,{get:()=>self[f]});return(()=>{const r=()=>{const c=new Error("not implemented");return c.code="ENOSYS",c};if(!globalThis.fs){let c="";globalThis.fs={constants:{O_WRONLY:-1,O_RDWR:-1,O_CREAT:-1,O_TRUNC:-1,O_APPEND:-1,O_EXCL:-1},writeSync(n,s){c+=g.decode(s);const i=c.lastIndexOf(`
`);return i!=-1&&(console.log(c.substr(0,i)),c=c.substr(i+1)),s.length},write(n,s,i,a,h,u){if(i!==0||a!==s.length||h!==null){u(r());return}const d=this.writeSync(n,s);u(null,d)},chmod(n,s,i){i(r())},chown(n,s,i,a){a(r())},close(n,s){s(r())},fchmod(n,s,i){i(r())},fchown(n,s,i,a){a(r())},fstat(n,s){s(r())},fsync(n,s){s(null)},ftruncate(n,s,i){i(r())},lchown(n,s,i,a){a(r())},link(n,s,i){i(r())},lstat(n,s){s(r())},mkdir(n,s,i){i(r())},open(n,s,i,a){a(r())},read(n,s,i,a,h,u){u(r())},readdir(n,s){s(r())},readlink(n,s){s(r())},rename(n,s,i){i(r())},rmdir(n,s){s(r())},stat(n,s){s(r())},symlink(n,s,i){i(r())},truncate(n,s,i){i(r())},unlink(n,s){s(r())},utimes(n,s,i,a){a(r())}}}if(globalThis.process||(globalThis.process={getuid(){return-1},getgid(){return-1},geteuid(){return-1},getegid(){return-1},getgroups(){throw r()},pid:-1,ppid:-1,umask(){throw r()},cwd(){throw r()},chdir(){throw r()}}),!globalThis.crypto)throw new Error("globalThis.crypto is not available, polyfill required (crypto.getRandomValues only)");if(!globalThis.performance)throw new Error("globalThis.performance is not available, polyfill required (performance.now only)");if(!globalThis.TextEncoder)throw new Error("globalThis.TextEncoder is not available, polyfill required");if(!globalThis.TextDecoder)throw new Error("globalThis.TextDecoder is not available, polyfill required");const f=new TextEncoder("utf-8"),g=new TextDecoder("utf-8");globalThis.Go=class{constructor(){this.argv=["js"],this.env={},this.exit=e=>{e!==0&&console.warn("exit code:",e)},this._exitPromise=new Promise(e=>{this._resolveExitPromise=e}),this._pendingEvent=null,this._scheduledTimeouts=new Map,this._nextCallbackTimeoutID=1;const c=(e,t)=>{this.mem.setUint32(e+0,t,!0),this.mem.setUint32(e+4,Math.floor(t/4294967296),!0)},n=e=>{const t=this.mem.getUint32(e+0,!0),o=this.mem.getInt32(e+4,!0);return t+o*4294967296},s=e=>{const t=this.mem.getFloat64(e,!0);if(t===0)return;if(!isNaN(t))return t;const o=this.mem.getUint32(e,!0);return this._values[o]},i=(e,t)=>{if(typeof t=="number"&&t!==0){if(isNaN(t)){this.mem.setUint32(e+4,2146959360,!0),this.mem.setUint32(e,0,!0);return}this.mem.setFloat64(e,t,!0);return}if(t===void 0){this.mem.setFloat64(e,0,!0);return}let l=this._ids.get(t);l===void 0&&(l=this._idPool.pop(),l===void 0&&(l=this._values.length),this._values[l]=t,this._goRefCounts[l]=0,this._ids.set(t,l)),this._goRefCounts[l]++;let m=0;switch(typeof t){case"object":t!==null&&(m=1);break;case"string":m=2;break;case"symbol":m=3;break;case"function":m=4;break}this.mem.setUint32(e+4,2146959360|m,!0),this.mem.setUint32(e,l,!0)},a=e=>{const t=n(e+0),o=n(e+8);return new Uint8Array(this._inst.exports.mem.buffer,t,o)},h=e=>{const t=n(e+0),o=n(e+8),l=new Array(o);for(let m=0;m<o;m++)l[m]=s(t+m*8);return l},u=e=>{const t=n(e+0),o=n(e+8);return g.decode(new DataView(this._inst.exports.mem.buffer,t,o))},d=Date.now()-performance.now();this.importObject={go:{"runtime.wasmExit":e=>{e>>>=0;const t=this.mem.getInt32(e+8,!0);this.exited=!0,delete this._inst,delete this._values,delete this._goRefCounts,delete this._ids,delete this._idPool,this.exit(t)},"runtime.wasmWrite":e=>{e>>>=0;const t=n(e+8),o=n(e+16),l=this.mem.getInt32(e+24,!0);globalThis.fs.writeSync(t,new Uint8Array(this._inst.exports.mem.buffer,o,l))},"runtime.resetMemoryDataView":e=>{e>>>=0,this.mem=new DataView(this._inst.exports.mem.buffer)},"runtime.nanotime1":e=>{e>>>=0,c(e+8,(d+performance.now())*1e6)},"runtime.walltime":e=>{e>>>=0;const t=new Date().getTime();c(e+8,t/1e3),this.mem.setInt32(e+16,t%1e3*1e6,!0)},"runtime.scheduleTimeoutEvent":e=>{e>>>=0;const t=this._nextCallbackTimeoutID;this._nextCallbackTimeoutID++,this._scheduledTimeouts.set(t,setTimeout(()=>{for(this._resume();this._scheduledTimeouts.has(t);)console.warn("scheduleTimeoutEvent: missed timeout event"),this._resume()},n(e+8)+1)),this.mem.setInt32(e+16,t,!0)},"runtime.clearTimeoutEvent":e=>{e>>>=0;const t=this.mem.getInt32(e+8,!0);clearTimeout(this._scheduledTimeouts.get(t)),this._scheduledTimeouts.delete(t)},"runtime.getRandomData":e=>{e>>>=0,crypto.getRandomValues(a(e+8))},"syscall/js.finalizeRef":e=>{e>>>=0;const t=this.mem.getUint32(e+8,!0);if(this._goRefCounts[t]--,this._goRefCounts[t]===0){const o=this._values[t];this._values[t]=null,this._ids.delete(o),this._idPool.push(t)}},"syscall/js.stringVal":e=>{e>>>=0,i(e+24,u(e+8))},"syscall/js.valueGet":e=>{e>>>=0;const t=Reflect.get(s(e+8),u(e+16));e=this._inst.exports.getsp()>>>0,i(e+32,t)},"syscall/js.valueSet":e=>{e>>>=0,Reflect.set(s(e+8),u(e+16),s(e+32))},"syscall/js.valueDelete":e=>{e>>>=0,Reflect.deleteProperty(s(e+8),u(e+16))},"syscall/js.valueIndex":e=>{e>>>=0,i(e+24,Reflect.get(s(e+8),n(e+16)))},"syscall/js.valueSetIndex":e=>{e>>>=0,Reflect.set(s(e+8),n(e+16),s(e+24))},"syscall/js.valueCall":e=>{e>>>=0;try{const t=s(e+8),o=Reflect.get(t,u(e+16)),l=h(e+32),m=Reflect.apply(o,t,l);e=this._inst.exports.getsp()>>>0,i(e+56,m),this.mem.setUint8(e+64,1)}catch(t){e=this._inst.exports.getsp()>>>0,i(e+56,t),this.mem.setUint8(e+64,0)}},"syscall/js.valueInvoke":e=>{e>>>=0;try{const t=s(e+8),o=h(e+16),l=Reflect.apply(t,void 0,o);e=this._inst.exports.getsp()>>>0,i(e+40,l),this.mem.setUint8(e+48,1)}catch(t){e=this._inst.exports.getsp()>>>0,i(e+40,t),this.mem.setUint8(e+48,0)}},"syscall/js.valueNew":e=>{e>>>=0;try{const t=s(e+8),o=h(e+16),l=Reflect.construct(t,o);e=this._inst.exports.getsp()>>>0,i(e+40,l),this.mem.setUint8(e+48,1)}catch(t){e=this._inst.exports.getsp()>>>0,i(e+40,t),this.mem.setUint8(e+48,0)}},"syscall/js.valueLength":e=>{e>>>=0,c(e+16,parseInt(s(e+8).length))},"syscall/js.valuePrepareString":e=>{e>>>=0;const t=f.encode(String(s(e+8)));i(e+16,t),c(e+24,t.length)},"syscall/js.valueLoadString":e=>{e>>>=0;const t=s(e+8);a(e+16).set(t)},"syscall/js.valueInstanceOf":e=>{e>>>=0,this.mem.setUint8(e+24,s(e+8)instanceof s(e+16)?1:0)},"syscall/js.copyBytesToGo":e=>{e>>>=0;const t=a(e+8),o=s(e+32);if(!(o instanceof Uint8Array||o instanceof Uint8ClampedArray)){this.mem.setUint8(e+48,0);return}const l=o.subarray(0,t.length);t.set(l),c(e+40,l.length),this.mem.setUint8(e+48,1)},"syscall/js.copyBytesToJS":e=>{e>>>=0;const t=s(e+8),o=a(e+16);if(!(t instanceof Uint8Array||t instanceof Uint8ClampedArray)){this.mem.setUint8(e+48,0);return}const l=o.subarray(0,t.length);t.set(l),c(e+40,l.length),this.mem.setUint8(e+48,1)},debug:e=>{console.log(e)}}}}async run(c){if(!(c instanceof WebAssembly.Instance))throw new Error("Go.run: WebAssembly.Instance expected");this._inst=c,this.mem=new DataView(this._inst.exports.mem.buffer),this._values=[NaN,0,null,!0,!1,globalThis,this],this._goRefCounts=new Array(this._values.length).fill(1/0),this._ids=new Map([[0,1],[null,2],[!0,3],[!1,4],[globalThis,5],[this,6]]),this._idPool=[],this.exited=!1;let n=4096;const s=e=>{const t=n,o=f.encode(e+"\0");return new Uint8Array(this.mem.buffer,n,o.length).set(o),n+=o.length,n%8!==0&&(n+=8-n%8),t},i=this.argv.length,a=[];this.argv.forEach(e=>{a.push(s(e))}),a.push(0),Object.keys(this.env).sort().forEach(e=>{a.push(s(`${e}=${this.env[e]}`))}),a.push(0);const u=n;a.forEach(e=>{this.mem.setUint32(n,e,!0),this.mem.setUint32(n+4,0,!0),n+=8});const d=4096+8192;if(n>=d)throw new Error("total length of command line and environment variables exceeds limit");this._inst.exports.run(i,u),this.exited&&this._resolveExitPromise(),await this._exitPromise}_resume(){if(this.exited)throw new Error("Go program has already exited");this._inst.exports.resume(),this.exited&&this._resolveExitPromise()}_makeFuncWrapper(c){const n=this;return function(){const s={id:c,this:this,args:arguments};return n._pendingEvent=s,n._resume(),s.result}}}})(),onmessage=({data:r})=>{let f=new TextDecoder,g=globalThis.fs,c="";g.writeSync=(h,u)=>{if(h===1)postMessage(u);else if(h===2){c+=f.decode(u);let d=c.split(`
`);d.length>1&&console.log(d.slice(0,-1).join(`
`)),c=d[d.length-1]}else throw new Error("Bad write");return u.length};let n=[],s,i=0;onmessage=({data:h})=>{h.length>0&&(n.push(h),s&&s())},g.read=(h,u,d,e,t,o)=>{if(h!==0||d!==0||e!==u.length||t!==null)throw new Error("Bad read");if(n.length===0){s=()=>g.read(h,u,d,e,t,o);return}let l=n[0],m=Math.max(0,Math.min(e,l.length-i));u.set(l.subarray(i,i+m),d),i+=m,i===l.length&&(n.shift(),i=0),o(null,m)};let a=new globalThis.Go;a.argv=["","--service=0.14.48"],r instanceof WebAssembly.Module?WebAssembly.instantiate(r,a.importObject).then(h=>a.run(h)):WebAssembly.instantiate(r,a.importObject).then(({instance:h})=>a.run(h))},r=>onmessage(r);})((data) => worker.onmessage({ data }));
    worker = {
      onmessage: null,
      postMessage: (data) => setTimeout(() => onmessage({ data })),
      terminate() {
      }
    };
  }
  worker.postMessage(wasm);
  worker.onmessage = ({ data }) => readFromStdout(data);
  let { readFromStdout, service } = createChannel({
    writeToStdin(bytes) {
      worker.postMessage(bytes);
    },
    isSync: false,
    isWriteUnavailable: true,
    esbuild: wasm_exports
  });
  stopService = () => {
    worker.terminate();
    initializePromise = void 0;
    stopService = void 0;
  };
  return {
    build: (options) => new Promise((resolve, reject) => service.buildOrServe({
      callName: "build",
      refs: null,
      serveOptions: null,
      options,
      isTTY: false,
      defaultWD: "/",
      callback: (err, res) => err ? reject(err) : resolve(res)
    })),
    transform: (input, options) => new Promise((resolve, reject) => service.transform({
      callName: "transform",
      refs: null,
      input,
      options: options || {},
      isTTY: false,
      fs: {
        readFile(_, callback) {
          callback(new Error("Internal error"), null);
        },
        writeFile(_, callback) {
          callback(null);
        }
      },
      callback: (err, res) => err ? reject(err) : resolve(res)
    })),
    formatMessages: (messages, options) => new Promise((resolve, reject) => service.formatMessages({
      callName: "formatMessages",
      refs: null,
      messages,
      options,
      callback: (err, res) => err ? reject(err) : resolve(res)
    })),
    analyzeMetafile: (metafile, options) => new Promise((resolve, reject) => service.analyzeMetafile({
      callName: "analyzeMetafile",
      refs: null,
      metafile: typeof metafile === "string" ? metafile : JSON.stringify(metafile),
      options,
      callback: (err, res) => err ? reject(err) : resolve(res)
    }))
  };
};
export {
  analyzeMetafile,
  analyzeMetafileSync,
  build,
  buildSync,
  formatMessages,
  formatMessagesSync,
  initialize,
  serve,
  stop,
  transform,
  transformSync,
  version
};
