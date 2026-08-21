/**
 * V1RFilmMakinesi - Built from src/V1RFilmMakinesi/
 * Generated: 2026-05-04T16:03:59.979Z
 */
if (typeof Buffer === 'undefined') {
  var Buffer = {
    from: function(data, encoding) {
      if (typeof data === 'string') {
        if (encoding === 'base64') {
          var b64 = data.replace(/-/g, '+').replace(/_/g, '/');
          while (b64.length % 4) b64 += '=';
          var decoded = atob(b64);
          return {
            _d: decoded,
            toString: function(enc) {
              if (enc === 'latin1' || enc === 'binary') return this._d;
              if (enc === 'hex') {
                var h = '';
                for (var i = 0; i < this._d.length; i++) h += ('0' + (this._d.charCodeAt(i) & 0xFF).toString(16)).slice(-2);
                return h;
              }
              return this._d;
            }
          };
        }
        return { _d: data, toString: function() { return this._d; } };
      }
      return { _d: '', toString: function() { return ''; } };
    },
    alloc: function(size, fill) {
      var s = ''; var ch = fill !== undefined ? String.fromCharCode(fill) : '\0';
      for (var i = 0; i < size; i++) s += ch;
      return { _d: s, toString: function() { return this._d; } };
    },
    isBuffer: function() { return false; }
  };
}
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/V1RFilmMakinesi/index.js
var V1RFilmMakinesi_exports = {};
__export(V1RFilmMakinesi_exports, {
  getStreams: () => getStreams
});
module.exports = __toCommonJS(V1RFilmMakinesi_exports);

// src/V1RFilmMakinesi/http.js
var cheerio = __toESM(require("cheerio-without-node-native"));
var MAIN_URL = "https://filmmakinesi.to";
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "DNT": "1",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Cache-Control": "max-age=0"
};
function fetchText(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    try {
      const fetchOptions = __spreadValues({
        headers: __spreadValues(__spreadValues({}, HEADERS), options.headers || {})
      }, options);
      const response = yield fetch(url, fetchOptions);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return yield response.text();
    } catch (e) {
      console.error(`[V1RFilmMakinesi] fetchText hatas\u0131 (${url}):`, e.message);
      throw e;
    }
  });
}
function fixUrl(url) {
  if (!url)
    return "";
  if (url.startsWith("http"))
    return url;
  if (url.startsWith("//"))
    return "https:" + url;
  if (url.startsWith("/"))
    return MAIN_URL + url;
  return MAIN_URL + "/" + url;
}

// src/V1RFilmMakinesi/tmdb.js
var TMDB_API_KEY = "1462bcc4b20812e1e1fce2f3f2056264";
var PROVIDER_TAG = "[V1RFilmMakinesi]";
function getTmdbTitleFromHtml(tmdbId, mediaType) {
  return __async(this, null, function* () {
    try {
      const type = mediaType === "movie" ? "movie" : "tv";
      const url = `https://www.themoviedb.org/${type}/${tmdbId}?language=tr-TR`;
      const response = yield fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const html = yield response.text();
      let trTitle = "";
      const ogMatch = html.match(/<meta property="og:title" content="([^"]+)">/);
      if (ogMatch) {
        trTitle = ogMatch[1];
      } else {
        const titleMatch = html.match(/<title>([^<]+)<\/title>/);
        if (titleMatch) {
          trTitle = titleMatch[1].split("(")[0].split("\u2014")[0].trim();
        }
      }
      let origTitle = trTitle;
      const origMatch = html.match(/<h3 class="caption" dir="auto">([^<]+)<\/h3>/) || html.match(/<strong class="original_title">([^<]+)<\/strong>/);
      if (origMatch) {
        const cleaned = origMatch[1].replace("Orijinal Ad\u0131", "").trim();
        if (cleaned.length > 0)
          origTitle = cleaned;
      }
      if (!trTitle)
        return null;
      let year = null;
      const yearMatch = html.match(/release_date["\s:]+(\d{4})-\d{2}-\d{2}/) || html.match(/<span class="release"[^>]*>\s*(\d{4})/) || html.match(/\((\d{4})\)/);
      if (yearMatch) year = parseInt(yearMatch[1], 10);
      console.log(`${PROVIDER_TAG} [HTML] Baslik bulundu: ${trTitle} (${year})`);
      return { trTitle, origTitle, year };
    } catch (e) {
      console.warn(`${PROVIDER_TAG} [HTML] Scraping basarisiz: ${e.message}`);
      return null;
    }
  });
}
function getTmdbTitleFromApi(tmdbId, mediaType) {
  return __async(this, null, function* () {
    try {
      const type = mediaType === "movie" ? "movie" : "tv";
      const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=tr-TR`;
      const response = yield fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = yield response.json();
      const trTitle = data.title || data.name || "";
      const origTitle = data.original_title || data.original_name || trTitle;
      if (!trTitle)
        return null;
      const dateStr = data.release_date || data.first_air_date || "";
      const year = dateStr ? parseInt(dateStr.slice(0, 4), 10) : null;
      console.log(`${PROVIDER_TAG} [API] Baslik bulundu: ${trTitle} (${year})`);
      return { trTitle, origTitle, year };
    } catch (e) {
      console.warn(`${PROVIDER_TAG} [API] REST API basarisiz: ${e.message}`);
      return null;
    }
  });
}
function getTmdbTitle(tmdbId, mediaType) {
  return __async(this, null, function* () {
    const htmlResult = yield getTmdbTitleFromHtml(tmdbId, mediaType);
    if (htmlResult)
      return htmlResult;
    console.log(`${PROVIDER_TAG} HTML scraping basarisiz, TMDB REST API deneniyor...`);
    const apiResult = yield getTmdbTitleFromApi(tmdbId, mediaType);
    if (apiResult)
      return apiResult;
    console.error(`${PROVIDER_TAG} Her iki yontem de basarisiz oldu: TMDB ID=${tmdbId}`);
    return { trTitle: "", origTitle: "" };
  });
}

// src/V1RFilmMakinesi/extractors/closeload.js
function decodeBase64Latin1(input) {
  try {
    if (!input)
      return "";
    let padded = input.replace(/\s/g, "");
    while (padded.length % 4 !== 0) {
      padded += "=";
    }
    if (typeof atob === "function") {
      return atob(padded);
    }
    return Buffer.from(padded, "base64").toString("latin1");
  } catch (e) {
    return input;
  }
}
function rotN(str, shift) {
  return str.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode((c.charCodeAt(0) - base + shift) % 26 + base);
  });
}
function decryptNative(html) {
  try {
    const scriptBlockMatch = html.match(
      /<script[^>]*>([\s\S]*?dc_[a-zA-Z0-9_]+\([\s\S]*?)<\/script>/i
    );
    const scriptContent = scriptBlockMatch == null ? void 0 : scriptBlockMatch[1];
    if (!scriptContent)
      return null;
    // Function constructor ile çalıştır
    const dcFnMatch2 = scriptContent.match(/function\s+(dc_\w+)\s*\(value_parts\)\s*\{([\s\S]*?)return\s+unmix\s*\}/);
    const sVarMatch2 = scriptContent.match(/var\s+s_\w+\s*=\s*(dc_\w+)\s*\(\[([\s\S]*?)\]\s*\)\s*;/);
    if (dcFnMatch2 && sVarMatch2) {
      try {
        const cleanBody2 = dcFnMatch2[2].replace(/\\'/g, "'").replace(/\\\\/g, "\\");
        const dc2 = new Function("value_parts", cleanBody2 + "\nreturn unmix;");
        const partsList2 = sVarMatch2[2].match(/"((?:[^"\\]|\\.)*)"/g)
          .map(function(s) { return s.slice(1,-1).replace(/\\"/g,'"').replace(/\\\\/g,'\\'); });
        const res2 = dc2(partsList2);
        console.log("[CloseLoad] Function() result=" + (res2 ? res2.substring(0,120) : "null"));
        if (res2 && /^https?:\/\//i.test(res2)) return res2;
      } catch(fnErr2) {
        console.warn("[CloseLoad] Function() hata:", fnErr2 && fnErr2.message);
      }
    }
    const arrayMatch = scriptContent.match(/\(\[((?:"[^"]+",?\s*)+)\]\)/);
    if (!(arrayMatch == null ? void 0 : arrayMatch[1]))
      return null;
    const parts = arrayMatch[1].split(",").map((s) => s.trim().replace(/^"|"$/g, "").replace(/\\\//g, "/"));
    const funcStartIdx = scriptContent.indexOf("function dc_");
    const funcEndIdx = scriptContent.indexOf("function d1x()", funcStartIdx);
    const functionBody = funcStartIdx !== -1 ? scriptContent.substring(funcStartIdx, funcEndIdx !== -1 ? funcEndIdx : scriptContent.length) : scriptContent;
    const rotShiftMatch = functionBody.match(/charCodeAt\(0\)\s*\+\s*(\d+)/);
    const rotShift = (rotShiftMatch == null ? void 0 : rotShiftMatch[1]) ? Number(rotShiftMatch[1]) : 13;
    const reverseIdx = functionBody.indexOf(".reverse()");
    const atobIdx = functionBody.indexOf("atob(");
    const rotIdx = functionBody.indexOf(".replace(");
    const operations = [
      { idx: reverseIdx, op: "reverse" },
      { idx: atobIdx, op: "atob" },
      { idx: rotIdx, op: "rot" }
    ].filter((x) => x.idx !== -1 && x.idx !== void 0).sort((a, b) => a.idx - b.idx);
    let result = parts.join("");
    for (const { op } of operations) {
      if (op === "reverse")
        result = result.split("").reverse().join("");
      else if (op === "atob")
        result = decodeBase64Latin1(result);
      else if (op === "rot")
        result = rotN(result, rotShift);
    }
    // Şema 1: acc + adım tabanlı XOR (CS3 referansı)
    const accInitMatch = scriptContent.match(/var\s+acc\s*=\s*(\d+)/);
    const accStepMatch = scriptContent.match(/acc\s*=\s*\(\s*acc\s*\+\s*(\d+)\s*\)/);
    const baseOffsetMatch = scriptContent.match(/o\s*-\s*base\s*\+\s*(\d+)/);
    const xorMode = scriptContent.includes("xor") || (accInitMatch && accStepMatch);
    if (xorMode && accInitMatch) {
      const accInit = Number(accInitMatch[1]);
      const accStep = accStepMatch ? Number(accStepMatch[1]) : 1;
      const baseOffset = baseOffsetMatch ? Number(baseOffsetMatch[1]) : 0;
      let acc = accInit;
      let unmix = "";
      for (let i = 0; i < result.length; i++) {
        const o = result.charCodeAt(i);
        const base = acc % 256;
        const decryptedCode = ((o - base + baseOffset) ^ (acc & 0xff) + 256) % 256;
        unmix += String.fromCharCode(decryptedCode);
        acc = (acc + accStep) & 0xffffffff;
      }
      if (unmix && /^https?:\/\//i.test(unmix)) {
        return unmix;
      }
    }
    // Şema 2: magicNum % (i + offset) tabanlı (eski yöntem)
    const moduloMatch = scriptContent.match(/(\d+)\s*%\s*\(i\s*\+\s*(\d+)\)/);
    const magicNum = (moduloMatch == null ? void 0 : moduloMatch[1]) ? Number(moduloMatch[1]) : 399756995;
    const magicOffset = (moduloMatch == null ? void 0 : moduloMatch[2]) ? Number(moduloMatch[2]) : 5;
    let unmix2 = "";
    for (let i = 0; i < result.length; i++) {
      const decryptedCode = (result.charCodeAt(i) - magicNum % (i + magicOffset) + 256) % 256;
      unmix2 += String.fromCharCode(decryptedCode);
    }
    if (unmix2 && /^https?:\/\//i.test(unmix2)) {
      return unmix2;
    }
    return null;
  } catch (e) {
    console.error("[CloseLoad] decryptNative error:", e == null ? void 0 : e.message);
    return null;
  }
}
function processSubtitles(html) {
  var _a, _b, _c;
  const subtitles = [];
  try {
    const tracksMatch = html.match(/tracks\s*:\s*(\[[\s\S]*?\])/i);
    if (!(tracksMatch == null ? void 0 : tracksMatch[1]))
      return subtitles;
    const blocks = tracksMatch[1].match(/\{[^}]*\}/g) || [];
    for (const block of blocks) {
      const file = (_b = (_a = block.match(/"file"\s*:\s*"([^"]+)"/)) == null ? void 0 : _a[1]) == null ? void 0 : _b.replace(/\\\//g, "/");
      const label = ((_c = block.match(/"label"\s*:\s*"([^"]+)"/)) == null ? void 0 : _c[1]) || "Altyazi";
      if (file && /^https?:\/\//i.test(file)) {
        subtitles.push({ label, file });
      }
    }
  } catch (e) {
  }
  return subtitles;
}
function extractCloseLoad(url, referer) {
  return __async(this, null, function* () {
    var _a;
    try {
      const CLOSELOAD_ORIGIN = "https://closeload.filmmakinesi.to";
      const headers = {
        "User-Agent": HEADERS["User-Agent"],
        "Referer": referer || CLOSELOAD_ORIGIN + "/",
        "Origin": CLOSELOAD_ORIGIN,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
      };
      const response = yield fetch(url, { headers });
      if (!response.ok) {
        console.warn(`[CloseLoad] HTTP ${response.status} \u2014 ${url}`);
        return null;
      }
      const html = yield response.text();
      let videoUrl = decryptNative(html);
      if (!videoUrl) {
        const ldMatch = html.match(/"contentUrl"\s*:\s*"([^"]+)"/i);
        videoUrl = ((_a = ldMatch == null ? void 0 : ldMatch[1]) == null ? void 0 : _a.replace(/\\\//g, "/")) || null;
      }
      if (!videoUrl) {
        const directPatterns = [
          html.match(/file\s*:\s*["'](https?:\/\/[^"']+\.(?:m3u8|mp4)[^"']*)["']/i),
          html.match(/["'](https?:\/\/[^"']+\.(?:m3u8|mp4)[^"']*)["']/i),
          html.match(/sources\s*:\s*\[\s*\{\s*["']?file["']?\s*:\s*["']([^"']+)["']/i),
          html.match(/player\.src\(["']([^"']+)["']\)/i),
          html.match(/source\s*:\s*["'](https?:\/\/[^"']+)["']/i)
        ];
        for (const m of directPatterns) {
          if (m == null ? void 0 : m[1]) {
            videoUrl = m[1];
            break;
          }
        }
      }
      if (videoUrl && /^https?:\/\//i.test(videoUrl)) {
        const subtitles = processSubtitles(html);
        return {
          url: videoUrl,
          quality: "1080p",
          headers: {
            "Referer": CLOSELOAD_ORIGIN + "/",
            "User-Agent": HEADERS["User-Agent"]
          },
          subtitles
        };
      }
      console.warn("[CloseLoad] Video URL cikarilamadi:", url);
      return null;
    } catch (err) {
      console.error("[CloseLoad] Hata:", (err == null ? void 0 : err.message) || err);
      return null;
    }
  });
}

// src/V1RFilmMakinesi/extractors/vidmoly.js
var cheerio2 = __toESM(require("cheerio-without-node-native"));
function unpackJS(code) {
  try {
    const matchSingle = code.match(/}\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/);
    const matchDouble = code.match(/}\("([\s\S]*?)",\s*(\d+),\s*(\d+),\s*"([\s\S]*?)"\.split\("\|"\)/);
    const match = matchSingle || matchDouble;
    if (!match)
      return code;
    let p = match[1];
    const a = parseInt(match[2], 10);
    const c = parseInt(match[3], 10);
    const k = match[4].split("|");
    const e = (c2) => {
      return (c2 < a ? "" : e(parseInt(c2 / a, 10))) + (c2 % a > 35 ? String.fromCharCode(c2 % a + 29) : (c2 % a).toString(36));
    };
    let map = {};
    for (let i = 0; i < c; i++) {
      map[e(i)] = k[i];
    }
    const dictRegex = new RegExp("\\b(" + Object.keys(map).filter((key) => key).join("|") + ")\\b", "g");
    const unpacked = p.replace(dictRegex, function(match2) {
      return map[match2] || match2;
    });
    return unpacked;
  } catch (err) {
    return code;
  }
}
function extractVidMoly(url, referer) {
  return __async(this, null, function* () {
    try {
      let fetchUrl = url;
      fetchUrl = fetchUrl.replace(/https?:\/\/vidmoly\.[a-z]+/, "https://vidmoly.me");
      fetchUrl = fetchUrl.replace(/\/embed-([a-z0-9]+)\.html/, "/w/$1");
      let headers = {
        "User-Agent": HEADERS["User-Agent"],
        "Sec-Fetch-Dest": "iframe"
      };
      if (referer)
        headers["Referer"] = referer;
      let response = yield fetch(fetchUrl, { headers });
      let html = yield response.text();
      if (html.toLowerCase().includes("video not found") || html.toLowerCase().includes("file was deleted")) {
        return null;
      }
      if (html.includes("Select number") || html.toLowerCase().includes("select the number")) {
        const $ = cheerio2.load(html);
        const opVal = $("input[name='op']").val();
        const fileCodeVal = $("input[name='file_code']").val();
        let answerVal = $("div.vhint b").text() || $("span.vhint b").text();
        if (!answerVal) {
          const ansMatch = html.match(/Please select (\d+)/i);
          if (ansMatch)
            answerVal = ansMatch[1];
        }
        const tsVal = $("input[name='ts']").val();
        const nonceVal = $("input[name='nonce']").val();
        const ctokVal = $("input[name='ctok']").val();
        if (opVal && fileCodeVal && answerVal) {
          const formData = new URLSearchParams();
          formData.append("op", opVal);
          formData.append("file_code", fileCodeVal);
          formData.append("answer", answerVal);
          formData.append("ts", tsVal);
          formData.append("nonce", nonceVal);
          formData.append("ctok", ctokVal);
          let postResponse = yield fetch(fetchUrl, {
            method: "POST",
            headers: __spreadProps(__spreadValues({}, headers), { "Content-Type": "application/x-www-form-urlencoded" }),
            body: formData.toString()
          });
          html = yield postResponse.text();
        }
      }
      let videoUrl = null;
      const scriptMatches = html.match(/eval\(function\(p,a,c,k,e,?[d]?\).*?\)\)/g);
      if (scriptMatches) {
        for (let script of scriptMatches) {
          const unpacked = unpackJS(script);
          const vidMatch = unpacked.match(/file\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i) || unpacked.match(/file\s*:\s*["']([^"']+\.mp4[^"']*)["']/i);
          if (vidMatch) {
            videoUrl = vidMatch[1];
            break;
          }
        }
      }
      if (!videoUrl) {
        const vidMatch = html.match(/file\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i) || html.match(/file\s*:\s*["']([^"']+\.mp4[^"']*)["']/i);
        if (vidMatch) {
          videoUrl = vidMatch[1];
        }
      }
      if (videoUrl) {
        return {
          url: videoUrl,
          headers: { "Referer": "https://vidmoly.me/" }
        };
      }
      return null;
    } catch (err) {
      console.error("[VidMoly] Error extracting:", err.message);
      return null;
    }
  });
}

// src/V1RFilmMakinesi/extractors/sibnet.js
function extractSibnet(url) {
  return __async(this, null, function* () {
    try {
      const fetchUrl = url;
      const response = yield fetch(fetchUrl, {
        headers: {
          "User-Agent": HEADERS["User-Agent"],
          "Referer": "https://video.sibnet.ru/"
        }
      });
      const html = yield response.text();
      const match = html.match(/src\s*:\s*["'](\/v\/[^"']+)["']/);
      if (match) {
        let videoUrl = "https://video.sibnet.ru" + match[1];
        try {
          const redirectRes = yield fetch(videoUrl, {
            method: "GET",
            redirect: "manual",
            headers: {
              "User-Agent": HEADERS["User-Agent"],
              "Referer": url
            }
          });
          let finalUrl = redirectRes.headers.get("location");
          if (finalUrl) {
            if (finalUrl.startsWith("//"))
              finalUrl = "https:" + finalUrl;
            videoUrl = finalUrl;
          } else if (redirectRes.url && redirectRes.url !== videoUrl) {
            videoUrl = redirectRes.url;
          }
        } catch (e) {
        }
        return {
          url: videoUrl,
          headers: { "Referer": url }
        };
      }
      return null;
    } catch (err) {
      return null;
    }
  });
}

// src/V1RFilmMakinesi/extractors/rapid.js
function extractRapid(url, referer) {
  return __async(this, null, function* () {
    try {
      const origin = new URL(url).origin;
      const headers = {
        "User-Agent": HEADERS["User-Agent"],
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": referer || "https://filmmakinesi.to/",
        "Origin": origin
      };
      const response = yield fetch(url, { headers });
      if (!response.ok) {
        console.warn(`[Rapid] HTTP ${response.status} \u2014 ${url}`);
        return null;
      }
      const html = yield response.text();
      console.log("[Rapid] len=" + html.length + " eval=" + html.includes("eval(function(p,a,c,k") + " m3u8=" + html.includes(".m3u8") + " sources=" + html.includes("sources") + " jwplayer=" + html.includes("jwplayer") + " playmix=" + html.includes("playmix") + " file=" + html.includes("\"file\""));
      console.log("[Rapid] mid=" + html.substring(2000, 2400).replace(/\n/g, " "));
      const scriptBlocks = [];
      const scriptTagRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
      let scriptTagMatch;
      while ((scriptTagMatch = scriptTagRegex.exec(html)) !== null) {
        const content = scriptTagMatch[1];
        if (content.includes("eval(function(p,a,c,k")) {
          scriptBlocks.push(content.trim());
        }
      }
      console.log("[Rapid] scriptBlocks=" + scriptBlocks.length);
      if (scriptBlocks.length === 0) {
        const inlineMatch = html.match(/eval\(function\(p,a,c,k[\s\S]*?\}\(['"]([\s\S]*?)['"],\s*\d+,\s*\d+,\s*['"][\s\S]*?['"]\s*\.split\(['"|]\|['"|]\)\s*\)\)/g);
        if (inlineMatch) scriptBlocks.push(...inlineMatch);
      }
      if (scriptBlocks.length > 0) {
        for (let i = 0; i < scriptBlocks.length; i++) {
          const unpacked = unpackJS(scriptBlocks[i]);
          const changed = unpacked !== scriptBlocks[i];
          console.log("[Rapid] unpacked[" + i + "] changed=" + changed + " len=" + unpacked.length);
          for (let j = 0; j < unpacked.length; j += 500) {
            console.log("[Rapid] unpacked[" + i + "][" + j + "]=" + unpacked.substring(j, j + 500).replace(/\n/g, " "));
          }
          // dc_ decrypt: operasyon sırasını parse et, manuel uygula
          try {
            const dcFnMatch = unpacked.match(/function\s+(dc_\w+)\s*\(value_parts\)\s*\{([\s\S]*?)return\s+unmix\s*\}/);
            const sVarMatch = unpacked.match(/var\s+s_\w+\s*=\s*(dc_\w+)\s*\(\[([\s\S]*?)\]\s*\)\s*;/);
            if (dcFnMatch && sVarMatch) {
              const fnName = dcFnMatch[1];
              const fnBody = dcFnMatch[2];
              const partsRaw = sVarMatch[2];
              // Function constructor ile çalıştır
              try {
                const cleanBody = fnBody.replace(/\\'/g, "'").replace(/\\\\/g, "\\");
                const dc = new Function("value_parts", cleanBody + "\nreturn unmix;");
                const partsList = partsRaw.match(/"((?:[^"\\]|\\.)*)"/g)
                  .map(function(s) { return s.slice(1,-1).replace(/\\"/g,'"').replace(/\\\\/g,'\\'); });
                const result = dc(partsList);
                console.log("[Rapid] Function() result=" + (result ? result.substring(0,120) : "null"));
                if (result && (result.includes(".m3u8") || result.includes(".mp4") || result.startsWith("http"))) {
                  return {
                    url: result.trim(),
                    quality: "Auto",
                    headers: {
                      "User-Agent": headers["User-Agent"],
                      "Referer": origin + "/",
                      "Origin": origin
                    }
                  };
                }
              } catch (fnErr) {
                console.warn("[Rapid] Function() hata:", fnErr && fnErr.message, "- manuel parse deneniyor");
              }
              // Fallback: manuel parse
              const parts = partsRaw.match(/"([^"]*)"/g) || [];
              let val = parts.map(function(p) { return p.slice(1, -1); }).join("");
              const accMatch = fnBody.match(/var\s+acc\s*=\s*(\d+)/);
              const stepMatch = fnBody.match(/acc\s*=\s*\(\s*acc\s*\+\s*(\d+)\s*\)/);
              const accInit = accMatch ? parseInt(accMatch[1]) : 0;
              const step = stepMatch ? parseInt(stepMatch[1]) : 1;
              const ops = [];
              const lines = fnBody.split(";");
              for (const line of lines) {
                const t = line.trim();
                if (t.includes("atob(result)")) {
                  ops.push({ type: "atob" });
                } else if (t.includes(".reverse()")) {
                  ops.push({ type: "reverse" });
                } else if (t.includes("result.replace") && t.includes("charCodeAt")) {
                  const rotM = t.match(/\(o-base\+(\d+)\)%26/);
                  ops.push({ type: "rot", n: rotM ? parseInt(rotM[1]) : 13 });
                }
              }
              console.log("[Rapid] dc ops=" + ops.map(function(o){return o.type+(o.n!=null?o.n:"");}).join(",") + " acc=" + accInit + " step=" + step);
              // Her adımda Uint8Array ile çalış
              let bytes = null; // null = string aşaması, array = binary aşama
              for (let oi = 0; oi < ops.length; oi++) {
                const op = ops[oi];
                if (op.type === "atob") {
                  // Her atob adımında: mevcut değeri latin1 string olarak al,
                  // base64 olmayan karakterleri filtrele, decode et
                  let src;
                  if (bytes !== null) {
                    src = "";
                    for (let bi = 0; bi < bytes.length; bi++) src += String.fromCharCode(bytes[bi]);
                  } else {
                    src = val;
                  }
                  let b64 = src.replace(/[^A-Za-z0-9+/=]/g, "");
                  while (b64.length % 4 !== 0) b64 += "=";
                  const decoded = atob(b64);
                  bytes = new Uint8Array(decoded.length);
                  for (let bi = 0; bi < decoded.length; bi++) bytes[bi] = decoded.charCodeAt(bi) & 0xff;
                  console.log("[Rapid] atob[" + oi + "] b64len=" + b64.length + " outlen=" + bytes.length);
                } else if (op.type === "reverse") {
                  if (bytes !== null) {
                    bytes = bytes.slice().reverse();
                  } else {
                    val = val.split("").reverse().join("");
                  }
                } else if (op.type === "rot") {
                  if (bytes !== null) {
                    for (let bi = 0; bi < bytes.length; bi++) {
                      const c = bytes[bi];
                      if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) {
                        const base = c <= 90 ? 65 : 97;
                        bytes[bi] = (c - base + op.n) % 26 + base;
                      }
                    }
                  } else {
                    val = val.replace(/[a-zA-Z]/g, function(c) {
                      const o = c.charCodeAt(0);
                      const base = o <= 90 ? 65 : 97;
                      return String.fromCharCode((o - base + op.n) % 26 + base);
                    });
                  }
                }
              }
              // bytes → string
              if (bytes !== null) {
                val = "";
                for (let bi = 0; bi < bytes.length; bi++) val += String.fromCharCode(bytes[bi]);
              }
              // acc/xor
              let acc2 = accInit;
              let unmix = "";
              for (let k = 0; k < val.length; k++) {
                const b = val.charCodeAt(k) & 0xff;
                acc2 = (acc2 + step) % 256;
                const plain = b ^ acc2;
                acc2 = (acc2 + b) % 256;
                unmix += String.fromCharCode(plain);
              }
              console.log("[Rapid] dc_decrypt fallback result=" + unmix.substring(0, 120));
              if (unmix && (unmix.includes(".m3u8") || unmix.includes(".mp4") || unmix.startsWith("http"))) {
                return {
                  url: unmix.trim(),
                  quality: "Auto",
                  headers: {
                    "User-Agent": headers["User-Agent"],
                    "Referer": origin + "/",
                    "Origin": origin
                  }
                };
              }
            }
          } catch (dcErr) {
            console.warn("[Rapid] dc_decrypt hata:", dcErr && dcErr.message);
          }
          const streamMatch = unpacked.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)['"]/i) || unpacked.match(/["'](https?:\/\/[^"']+\.mp4[^"']*)['"]/i) || unpacked.match(/file\s*[=:]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)['"]/i) || unpacked.match(/["']file["']\s*:\s*["']([^"']+)["']/i) || unpacked.match(/sources\s*:\s*\[\s*\{[^}]*["']?file["']?\s*:\s*["']([^"']+)["']/i);
          if (streamMatch == null ? void 0 : streamMatch[1]) {
            return {
              url: streamMatch[1].trim(),
              quality: "Auto",
              headers: {
                "User-Agent": headers["User-Agent"],
                "Referer": origin + "/",
                "Origin": origin
              }
            };
          }
        }
      }
      const directMatch = html.match(/file\s*:\s*["']([^"']+\.m3u8[^"']*)['"]/i) || html.match(/file\s*:\s*["']([^"']+\.mp4[^"']*)['"]/i) || html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)['"]/i) || html.match(/["'](https?:\/\/[^"']+\.mp4[^"']*)['"]/i) || html.match(/source\s*:\s*["']([^"']+\.m3u8[^"']*)['"]/i);
      if (directMatch == null ? void 0 : directMatch[1]) {
        return {
          url: directMatch[1].trim(),
          quality: "Auto",
          headers: {
            "User-Agent": headers["User-Agent"],
            "Referer": origin + "/",
            "Origin": origin
          }
        };
      }
      const b64Match = html.match(/atob\(['"]([A-Za-z0-9+/=]{20,})['"]\)/);
      if (b64Match == null ? void 0 : b64Match[1]) {
        try {
          const decoded = typeof atob === "function" ? atob(b64Match[1]) : Buffer.from(b64Match[1], "base64").toString("utf-8");
          const urlMatch = decoded.match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/i) || decoded.match(/(https?:\/\/[^\s"']+\.mp4[^\s"']*)/i);
          if (urlMatch == null ? void 0 : urlMatch[1]) {
            return {
              url: urlMatch[1].trim(),
              quality: "Auto",
              headers: {
                "User-Agent": headers["User-Agent"],
                "Referer": origin + "/"
              }
            };
          }
        } catch (e) {
        }
      }
      console.warn("[Rapid] Stream URL bulunamad\u0131:", url);
      return null;
    } catch (err) {
      console.error("[Rapid] Hata:", (err == null ? void 0 : err.message) || err);
      return null;
    }
  });
}

// src/V1RFilmMakinesi/extractor.js
var import_cheerio_without_node_native = __toESM(require("cheerio-without-node-native"));
function inferLanguage(label = "") {
  const value = (label || "").toLowerCase();
  if (value.includes("dublaj"))
    return "Dublaj";
  if (value.includes("altyazi") || value.includes("altyaz\u0131") || value.includes("sub"))
    return "Altyazi";
  if (/\btr\b|turkce|türkçe/.test(value))
    return "TR";
  if (/\ben\b|english/.test(value))
    return "EN";
  return "Bilinmiyor";
}
function buildMeta(player, label) {
  const lang = inferLanguage(label);
  return {
    name: `V1RFilmMakinesi - ${player} - ${lang}`,
    title: `${player} | ${lang} | ${label}`
  };
}
function searchMovie(query, year) {
  return __async(this, null, function* () {
    const searchUrl = `${MAIN_URL}/arama/?s=${encodeURIComponent(query)}`;
    const html = yield fetchText(searchUrl);
    const $ = import_cheerio_without_node_native.default.load(html);
    const results = [];
    $("div.item-relative").each((i, el) => {
      const anchor = $(el).find("a").first();
      const href = anchor.attr("href");
      let title = $(el).find("div.title").text().trim();
      if (!title && anchor.attr("title"))
        title = anchor.attr("title").trim();
      if (!title && anchor.attr("data-title"))
        title = anchor.attr("data-title").trim();
      if (title && href) {
        results.push({ title, href: fixUrl(href) });
      }
    });
    if (results.length === 0)
      return null;
    const queryLower = query.toLowerCase();
    const titleMatches = results.filter((r) => {
      const tl = r.title.toLowerCase();
      return tl === queryLower || tl.startsWith(queryLower) || tl.includes(queryLower);
    });
    const candidates = titleMatches.length > 0 ? titleMatches : results;
    if (year && candidates.length > 1) {
      const byYear = candidates.find((r) => {
        const urlYearMatch = r.href.match(/[-\/](\d{4})[\/\-]?(?:izle|film)?[\/]?$/);
        const titleYearMatch = r.title.match(/\((\d{4})\)/);
        const urlYear = urlYearMatch ? parseInt(urlYearMatch[1], 10) : null;
        const titleYear = titleYearMatch ? parseInt(titleYearMatch[1], 10) : null;
        return urlYear === year || titleYear === year;
      });
      if (byYear) {
        console.log(`${PROVIDER_TAG} Yil eslesmesi bulundu: ${byYear.href} (${year})`);
        return byYear.href;
      }
      console.warn(`${PROVIDER_TAG} Yil (${year}) eslesmiyor, ilk baslik eslesimi kullaniliyor`);
    }
    return candidates[0] ? candidates[0].href : results[0].href;
  });
}
function extractFromMoviePage(movieUrl) {
  return __async(this, null, function* () {
    let html;
    try {
      html = yield fetchText(movieUrl);
    } catch (e) {
      console.error(`[V1RFilmMakinesi] Sayfa alinamadi: ${e.message}`);
      return [];
    }
    const $ = import_cheerio_without_node_native.default.load(html);
    const streams = [];
    const linkUrls = [];
    $("iframe").each((i, el) => {
      const src = $(el).attr("data-src") || $(el).attr("src");
      if (src && src.trim() !== "" && !src.includes("youtube")) {
        linkUrls.push({ url: fixUrl(src.trim()), title: `Sunucu ${i + 1}` });
      }
    });
    $(".video-parts a[data-video_url]").each((i, el) => {
      const vUrl = $(el).attr("data-video_url");
      const title = $(el).text().trim() || `Sunucu ${i + 1}`;
      if (vUrl && vUrl.trim() !== "") {
        linkUrls.push({ url: fixUrl(vUrl.trim()), title });
      }
    });
    $("[data-video_url], [data-video-url]").each((i, el) => {
      const vUrl = $(el).attr("data-video_url") || $(el).attr("data-video-url");
      const title = $(el).text().trim() || $(el).attr("title") || `Sunucu ${i + 1}`;
      if (vUrl && vUrl.trim() !== "" && vUrl.includes("http")) {
        const exists = linkUrls.some((u) => u.url === fixUrl(vUrl.trim()));
        if (!exists)
          linkUrls.push({ url: fixUrl(vUrl.trim()), title });
      }
    });
    if (linkUrls.length === 0) {
      const pageText = html;
      const embedRegex = /(https?:\/\/(?:closeload|rapid|vidmoly|sibnet)[^"'<\s]+)/gi;
      const matches = [...pageText.matchAll(embedRegex)];
      for (let i = 0; i < matches.length; i++) {
        const found = matches[i][1];
        if (!linkUrls.some((u) => u.url === found)) {
          linkUrls.push({ url: found, title: `Sunucu ${i + 1}` });
        }
      }
    }
    console.log(`[V1RFilmMakinesi] Bulunan link sayisi: ${linkUrls.length}`);
    for (const l of linkUrls)
      console.log(`  - ${l.url.substring(0, 80)} (${l.title})`);
    for (let i = 0; i < linkUrls.length; i++) {
      const { url: embedUrl, title: label } = linkUrls[i];
      if (!embedUrl || embedUrl.includes("youtube"))
        continue;
      try {
        if (embedUrl.includes("closeload")) {
          const clRes = yield extractCloseLoad(embedUrl, movieUrl);
          if (clRes) {
            const meta = buildMeta("CloseLoad", label);
            streams.push({
              name: meta.name,
              title: meta.title,
              url: clRes.url,
              quality: clRes.quality || "720p",
              type: "hls",
              headers: clRes.headers || { Referer: MAIN_URL + "/" }
            });
            continue;
          }
        }
        if (embedUrl.includes("rapid")) {
          const rapidRes = yield extractRapid(embedUrl, movieUrl);
          if (rapidRes) {
            const meta = buildMeta("Rapid", label);
            const stream = {
              name: meta.name,
              title: meta.title,
              url: rapidRes.url,
              quality: rapidRes.quality || "Auto",
              headers: rapidRes.headers
            };
            if (rapidRes.url.includes(".m3u8"))
              stream.type = "hls";
            streams.push(stream);
            continue;
          }
        }
        if (embedUrl.includes("vidmoly")) {
          const vidmolyRes = yield extractVidMoly(embedUrl, movieUrl);
          if (vidmolyRes) {
            const meta = buildMeta("VidMoly", label);
            const stream = {
              name: meta.name,
              title: meta.title,
              url: vidmolyRes.url,
              quality: "720p",
              headers: __spreadValues(__spreadValues({}, HEADERS), vidmolyRes.headers)
            };
            if (vidmolyRes.url.includes(".m3u8"))
              stream.type = "hls";
            streams.push(stream);
            continue;
          }
        }
        if (embedUrl.includes("sibnet.ru")) {
          const sibnetRes = yield extractSibnet(embedUrl);
          if (sibnetRes) {
            const meta = buildMeta("Sibnet", label);
            const stream = {
              name: meta.name,
              title: meta.title,
              url: sibnetRes.url,
              quality: "720p",
              headers: __spreadValues(__spreadValues({}, HEADERS), sibnetRes.headers)
            };
            if (sibnetRes.url.includes(".m3u8"))
              stream.type = "hls";
            streams.push(stream);
            continue;
          }
        }
        if (embedUrl.includes(".m3u8") || embedUrl.includes(".mp4")) {
          const meta = buildMeta("Direkt", label);
          const stream = {
            name: meta.name,
            title: meta.title,
            url: embedUrl,
            quality: "720p",
            headers: { Referer: movieUrl }
          };
          if (embedUrl.includes(".m3u8"))
            stream.type = "hls";
          streams.push(stream);
        }
      } catch (err) {
        console.error(`[V1RFilmMakinesi] Cikarma hatasi: ${err.message}`);
      }
    }
    return streams;
  });
}
function extractStreams(tmdbId, mediaType) {
  return __async(this, null, function* () {
    if (mediaType !== "movie")
      return [];
    const { trTitle, origTitle, year } = yield getTmdbTitle(tmdbId, mediaType);
    console.log(`[V1RFilmMakinesi] TMDB: ${tmdbId} | Baslik: ${trTitle} | Yil: ${year}`);
    if (!trTitle && !origTitle)
      return [];
    let movieUrl = null;
    if (trTitle) {
      movieUrl = yield searchMovie(trTitle, year);
    }
    if (!movieUrl && origTitle && origTitle !== trTitle) {
      movieUrl = yield searchMovie(origTitle, year);
    }
    if (!movieUrl) {
      console.warn(`[V1RFilmMakinesi] Site'de icerik bulunamadi: ${trTitle || origTitle}`);
      return [];
    }
    console.log(`[V1RFilmMakinesi] Sayfa bulundu: ${movieUrl}`);
    const streams = yield extractFromMoviePage(movieUrl);
    console.log(`[V1RFilmMakinesi] Toplam stream: ${streams.length}`);
    return streams;
  });
}

// src/V1RFilmMakinesi/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      console.log(`[V1RFilmMakinesi] \u0130stek: ${mediaType} | TMDB: ${tmdbId}`);
      if (mediaType !== "movie") {
        return [];
      }
      const streams = yield extractStreams(tmdbId, mediaType);
      return streams;
    } catch (error) {
      console.error(`[V1RFilmMakinesi] Hata: ${error.message}`);
      return [];
    }
  });
}
