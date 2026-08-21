/**
 * patronSetfilm - Built from src/patronSetfilm/
 * Generated: 2026-05-04T15:05:22.235Z
 */
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

// src/patronSetfilm/index.js
var patronSetfilm_exports = {};
__export(patronSetfilm_exports, {
  getStreams: () => getStreams
});
module.exports = __toCommonJS(patronSetfilm_exports);

// src/patronSetfilm/extractor.js
var import_cheerio_without_node_native2 = __toESM(require("cheerio-without-node-native"));

// src/patronSetfilm/http.js
var MAIN_URL = "https://www.setfilmizle.uk";
var AJAX_URL = `${MAIN_URL}/wp-admin/admin-ajax.php`;
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
};
function fixUrl(url, baseUrl) {
  if (!url)
    return "";
  if (url.startsWith("http://") || url.startsWith("https://"))
    return url;
  if (url.startsWith("//"))
    return `https:${url}`;
  if (!baseUrl)
    return url;
  try {
    return new URL(url, baseUrl).toString();
  } catch (_) {
    return url;
  }
}
function fetchText(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const response = yield fetch(url, __spreadProps(__spreadValues({}, options), {
      headers: __spreadValues(__spreadValues({}, HEADERS), options.headers || {})
    }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} -> ${url}`);
    }
    return yield response.text();
  });
}
function fetchJSON(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const text = yield fetchText(url, options);
    try {
      return JSON.parse(text.replace(/^\ufeff/, ""));
    } catch (e) {
      throw new Error(`JSON parse error: ${e.message}`);
    }
  });
}

// src/patronSetfilm/tmdb.js
var import_cheerio_without_node_native = __toESM(require("cheerio-without-node-native"));
var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
var PROVIDER_TAG = "[SetFilmIzle]";
function decodeHtml(text) {
  return (text || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#039;/g, "'");
}
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
      const ogMatch = html.match(/<meta property="og:title" content="([^"]+)">/i);
      if (ogMatch) {
        trTitle = decodeHtml(ogMatch[1]).split("(")[0].trim();
      } else {
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) {
          trTitle = decodeHtml(titleMatch[1]).split("(")[0].split("\u2014")[0].split("\xE2\u20AC\u201D")[0].trim();
        }
      }
      let origTitle = trTitle;
      const $ = import_cheerio_without_node_native.default.load(html);
      $("section.facts p").each((_, el) => {
        const text = $(el).text();
        if (text.includes("Orijinal Ba\u015Fl\u0131k") || text.includes("Original Title")) {
          const found = text.replace("Orijinal Ba\u015Fl\u0131k", "").replace("Original Title", "").trim();
          if (found)
            origTitle = decodeHtml(found);
        }
      });
      if (origTitle === trTitle) {
        const origMatch = html.match(/<h3 class="caption" dir="auto">([^<]+)<\/h3>/i) || html.match(/<strong class="original_title">([^<]+)<\/strong>/i);
        if (origMatch) {
          const matched = decodeHtml(origMatch[1]).replace("Orijinal Adi", "").replace("Orijinal Ad\u0131", "").trim();
          if (matched)
            origTitle = matched;
        }
      }
      let shortTitle = "";
      if (origTitle && (origTitle.includes(":") || origTitle.toLowerCase().includes(" and "))) {
        shortTitle = origTitle.split(":")[0].split(/ and /i)[0].trim();
      }
      if (!trTitle)
        return null;
      console.log(`${PROVIDER_TAG} [HTML] Baslik bulundu: ${trTitle}`);
      return { trTitle, origTitle, shortTitle };
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
      let shortTitle = "";
      if (origTitle && (origTitle.includes(":") || origTitle.toLowerCase().includes(" and "))) {
        shortTitle = origTitle.split(":")[0].split(/ and /i)[0].trim();
      }
      if (!trTitle)
        return null;
      console.log(`${PROVIDER_TAG} [API] Baslik bulundu: ${trTitle}`);
      return { trTitle, origTitle, shortTitle };
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
    return { trTitle: "", origTitle: "", shortTitle: "" };
  });
}

// src/patronSetfilm/extractor.js
var PROVIDER_NAME = "SetFilmIzle";
function normalizeTitle(value) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function detectLang(partKey = "", rawText = "") {
  const v = `${partKey} ${rawText}`.toLowerCase();
  if (v.includes("dublaj"))
    return "TR Dublaj";
  if (v.includes("altyazi") || v.includes("altyaz\u0131"))
    return "TR Altyaz\u0131";
  if (v.includes("orijinal"))
    return "Orijinal";
  return "Bilinmiyor";
}
function detectPlayer(name, url) {
  const n = (name || "").trim();
  if (n)
    return n;
  const u = (url || "").toLowerCase();
  if (u.includes("fastplay"))
    return "FastPlay";
  if (u.includes("setprime") || u.includes("stplay.cfd"))
    return "SetPrime";
  if (u.includes("setplay"))
    return "SetPlay";
  if (u.includes("vidmoly"))
    return "VidMoly";
  return "Player";
}
function looksLikeHls(url) {
  return /\.(m3u8|m3u)(\?|#|$)/i.test(url) || /\/hls\//i.test(url);
}
function withType(stream) {
  if (looksLikeHls(stream.url))
    stream.type = "hls";
  return stream;
}
function getNonce() {
  return __async(this, arguments, function* (kind = "search", referer = MAIN_URL) {
    var _a, _b;
    try {
      const body = new URLSearchParams();
      body.append("action", "st_cache_refresh_nonces");
      const data = yield fetchJSON(AJAX_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Referer": referer,
          "X-Requested-With": "XMLHttpRequest"
        },
        body: body.toString()
      });
      if ((data == null ? void 0 : data.success) && ((_b = (_a = data.data) == null ? void 0 : _a.nonces) == null ? void 0 : _b[kind])) {
        return data.data.nonces[kind];
      }
    } catch (e) {
    }
    try {
      const html = yield fetchText(referer);
      const m = html.match(new RegExp(`${kind}s*:\\s*["']([^"']+)["']`));
      return m ? m[1] : "";
    } catch (e) {
      return "";
    }
  });
}
function searchSetFilm(query, nonce) {
  return __async(this, null, function* () {
    const body = new URLSearchParams();
    body.append("action", "ajax_search");
    body.append("search", query);
    body.append("original_search", query);
    body.append("nonce", nonce);
    const data = yield fetchJSON(AJAX_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": MAIN_URL,
        "X-Requested-With": "XMLHttpRequest"
      },
      body: body.toString()
    });
    const html = data.html || "";
    const $ = import_cheerio_without_node_native2.default.load(html);
    const results = [];
    $("article").each((_, el) => {
      const title = $(el).find("h2").text().trim();
      const href = $(el).find("a").attr("href");
      if (title && href) {
        results.push({ title, href: fixUrl(href, MAIN_URL) });
      }
    });
    return results;
  });
}
function fetchVideoUrl(postId, playerName, partKey, nonce, referer) {
  return __async(this, null, function* () {
    var _a;
    const body = new URLSearchParams();
    body.append("action", "get_video_url");
    body.append("nonce", nonce);
    body.append("post_id", postId);
    body.append("player_name", playerName || "");
    body.append("part_key", partKey || "");
    try {
      const data = yield fetchJSON(AJAX_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Referer": referer,
          "X-Requested-With": "XMLHttpRequest"
        },
        body: body.toString()
      });
      let iframeUrl = ((_a = data.data) == null ? void 0 : _a.url) || "";
      if (!iframeUrl)
        return null;
      if (!iframeUrl.includes("setplay") && partKey) {
        iframeUrl += (iframeUrl.includes("?") ? "&" : "?") + `partKey=${partKey}`;
      }
      return iframeUrl;
    } catch (e) {
      console.warn(`[${PROVIDER_NAME}] get_video_url failed: ${e.message}`);
      return null;
    }
  });
}
function resolveFastPlay(url, referer) {
  return __async(this, null, function* () {
    try {
      const html = yield fetchText(url, { headers: { "Referer": referer } });
      const streamUrlMatch = html.match(/const\s+streamUrl\s*=\s*["']([^"']+)["']/) || html.match(/streamUrl\s*=\s*["']([^"']+)["']/);
      let streamUrl = streamUrlMatch && streamUrlMatch[1] || "";
      if (!streamUrl) {
        const manifest = html.match(/["'](\/manifests\/[^"']+)["']/);
        if (manifest)
          streamUrl = "https://fastplay.mom" + manifest[1];
      }
      if (!streamUrl)
        return null;
      let final = fixUrl(streamUrl, "https://fastplay.mom");
      if (!looksLikeHls(final) && !/\.(mp4|mkv)(\?|#|$)/i.test(final)) {
        final += final.includes("#") ? "" : "#.m3u8";
      }
      return withType({
        url: final,
        quality: "Auto",
        headers: { "Referer": url }
      });
    } catch (e) {
      console.warn(`[FastPlay] ${e.message}`);
      return null;
    }
  });
}
function resolveSetPrime(url, referer) {
  return __async(this, null, function* () {
    var _a;
    try {
      const clean = url.split("&partKey=")[0].split("?partKey=")[0];
      const postUrl = clean.replace("embed?i=", "embed/get?i=");
      const text = yield fetchText(postUrl, {
        method: "POST",
        headers: {
          "Referer": clean,
          "X-Requested-With": "XMLHttpRequest"
        }
      });
      let suffix = null;
      try {
        const json = JSON.parse(text);
        if ((_a = json == null ? void 0 : json.Links) == null ? void 0 : _a.length)
          suffix = json.Links[0];
      } catch (e) {
        const m = text.match(/Links":\["([^"\]]+)"/);
        if (m)
          suffix = m[1];
      }
      if (!suffix)
        return null;
      const out = `https://setplay.site${suffix}`;
      return withType({
        url: out,
        quality: "Auto",
        headers: { "Referer": clean }
      });
    } catch (e) {
      console.warn(`[SetPrime] ${e.message}`);
      return null;
    }
  });
}
function resolveSetPlay(url, referer) {
  return __async(this, null, function* () {
    try {
      const html = yield fetchText(url, {
        headers: {
          "Referer": referer || MAIN_URL + "/"
        }
      });
      const fireMatch = html.match(/FirePlayer\s*\(\s*[^,]+,\s*(\{[\s\S]+?\})\s*,\s*(?:true|false)\s*\)/);
      if (fireMatch) {
        try {
          const data = JSON.parse(fireMatch[1]);
          const videoUrl = data.videoUrl;
          const videoServer = data.videoServer || "1";
          if (videoUrl) {
            const base = new URL(url).origin;
            let m3u = `${base}${videoUrl.replace(/\\\//g, "/")}?s=${videoServer}`;
            if (!looksLikeHls(m3u) && !/\.(mp4|mkv)(\?|#|$)/i.test(m3u)) {
              m3u += m3u.includes("#") ? "" : "#.m3u8";
            }
            return withType({
              url: m3u,
              quality: "Auto",
              headers: { "Referer": url }
            });
          }
        } catch (e) {
          console.warn(`[SetPlay] FirePlayer parse: ${e.message}`);
        }
      }
      const srcMatch = html.match(new RegExp("sources\\s*:\\s*\\[(.+?)\\]", "s"));
      if (srcMatch) {
        const fileM = srcMatch[1].match(/file\s*:\s*["']([^"']+)["']/);
        if (fileM) {
          return withType({
            url: fileM[1],
            quality: "Auto",
            headers: { "Referer": url }
          });
        }
      }
      const direct = html.match(/["'](https?:\/\/[^"']+\.(m3u8|mp4|mkv)[^"']*)["']/i);
      if (direct) {
        return withType({
          url: direct[1],
          quality: "Auto",
          headers: { "Referer": url }
        });
      }
      if (html.includes("player_base_url")) {
        const manM = html.match(/["'](\/manifests\/[^"']+)["']/);
        if (manM) {
          const baseM = html.match(/player_base_url\s*=\s*["']([^"']+)["']/);
          const base = baseM ? baseM[1] : "https://setplay.shop/player";
          return withType({
            url: fixUrl(manM[1], base) + "#.m3u8",
            quality: "Auto",
            headers: { "Referer": url }
          });
        }
      }
    } catch (e) {
      console.warn(`[SetPlay] ${e.message}`);
    }
    return null;
  });
}
function extractStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      const { trTitle, origTitle, shortTitle } = yield getTmdbTitle(tmdbId, mediaType);
      console.log(`[${PROVIDER_NAME}] TMDB: ${tmdbId} | TR: ${trTitle} | ORIG: ${origTitle}`);
      if (!trTitle && !origTitle)
        return [];
      const searchNonce = yield getNonce("search");
      console.log(`[${PROVIDER_NAME}] Search nonce: ${searchNonce}`);
      let results = yield searchSetFilm(trTitle, searchNonce);
      if (!results.length && origTitle && origTitle !== trTitle) {
        results = yield searchSetFilm(origTitle, searchNonce);
      }
      if (!results.length && shortTitle) {
        results = yield searchSetFilm(shortTitle, searchNonce);
      }
      const q = normalizeTitle(trTitle || origTitle);
      const match = results.find((r) => normalizeTitle(r.title) === q) || results.find((r) => normalizeTitle(r.title).includes(q)) || results[0];
      if (!match) {
        console.warn(`[${PROVIDER_NAME}] Content not found`);
        return [];
      }
      let contentUrl = match.href;
      const isMovie = mediaType === "movie";
      if (!isMovie) {
        const seriesHtml = yield fetchText(contentUrl);
        const $s = import_cheerio_without_node_native2.default.load(seriesHtml);
        let episodeUrl = "";
        $s("div#episodes ul.episodios li").each((_, el) => {
          const epTitle = $s(el).find("h4.episodiotitle a").text().trim();
          const epHref = $s(el).find("h4.episodiotitle a").attr("href");
          const sMatch = epTitle.match(/([0-9]+)\.?\s*(Sezon|Season)/i);
          const eMatch = epTitle.match(/([0-9]+)\.?\s*(Bölüm|Episode)/i);
          if (sMatch && eMatch) {
            if (parseInt(sMatch[1], 10) === season && parseInt(eMatch[1], 10) === episode) {
              episodeUrl = fixUrl(epHref, MAIN_URL);
            }
          }
        });
        if (!episodeUrl) {
          console.warn(`[${PROVIDER_NAME}] Episode S${season}E${episode} not found`);
          return [];
        }
        contentUrl = episodeUrl;
      }
      const pageHtml = yield fetchText(contentUrl);
      const $ = import_cheerio_without_node_native2.default.load(pageHtml);
      const videoNonce = yield getNonce("video", contentUrl);
      const streams = [];
      let playerEls = $("a[data-player-name]");
      if (!playerEls.length) {
        playerEls = $("nav.player a");
      }
      console.log(`[${PROVIDER_NAME}] Found ${playerEls.length} player elements`);
      const work = [];
      playerEls.each((_, el) => {
        const postId = $(el).attr("data-post-id");
        const playerName = $(el).attr("data-player-name") || $(el).find("b").text().trim() || $(el).text().trim();
        const partKey = $(el).attr("data-part-key") || "";
        if (!postId || postId.startsWith("${") || postId === "postId")
          return;
        const rawText = $(el).text().trim();
        const langLabel = detectLang(partKey, rawText);
        const playerLabel = detectPlayer(playerName, "");
        const title = `${playerLabel} | ${langLabel}`;
        const displayName = `${PROVIDER_NAME} - ${langLabel}`;
        work.push((() => __async(this, null, function* () {
          const iframeUrl = yield fetchVideoUrl(postId, playerName, partKey, videoNonce, contentUrl);
          if (!iframeUrl)
            return;
          const lower = iframeUrl.toLowerCase();
          let resolved = null;
          if (lower.includes("fastplay")) {
            resolved = yield resolveFastPlay(iframeUrl, contentUrl);
          } else if (lower.includes("setprime") || lower.includes("stplay.cfd")) {
            const primeUrl = iframeUrl.includes("partKey=") ? iframeUrl : `${iframeUrl}${iframeUrl.includes("?") ? "&" : "?"}partKey=${partKey || ""}`;
            resolved = yield resolveSetPrime(primeUrl, contentUrl);
          } else if (lower.includes("setplay")) {
            resolved = yield resolveSetPlay(iframeUrl, contentUrl);
          }
          if (resolved) {
            streams.push(__spreadValues({ name: displayName, title }, resolved));
            return;
          }
          let finalUrl = iframeUrl;
          if (lower.includes("stplay.cfd") && !lower.includes("partkey=")) {
            finalUrl += `${finalUrl.includes("?") ? "&" : "?"}partKey=${partKey || ""}`;
          }
          const playable = /\.(m3u8|mp4|mkv)(\?|#|$)/i.test(finalUrl) || /\/cdn\/hls\//i.test(finalUrl) || /\/manifests\//i.test(finalUrl);
          if (playable) {
            if (!looksLikeHls(finalUrl) && !/\.(mp4|mkv)(\?|#|$)/i.test(finalUrl)) {
              finalUrl += finalUrl.includes("#") ? "" : "#.m3u8";
            }
            streams.push(withType({
              name: displayName,
              title,
              url: finalUrl,
              quality: "Auto",
              headers: { "Referer": contentUrl }
            }));
          }
        }))());
      });
      yield Promise.all(work);
      const dedup = [];
      const seen = /* @__PURE__ */ new Set();
      for (const s of streams) {
        const key = `${s.url}|${s.title}|${s.name}`;
        if (seen.has(key))
          continue;
        seen.add(key);
        dedup.push(s);
      }
      console.log(`[${PROVIDER_NAME}] Returning ${dedup.length} streams`);
      return dedup;
    } catch (error) {
      console.error(`[${PROVIDER_NAME}] Extractor error: ${error.message}`);
      return [];
    }
  });
}

// src/patronSetfilm/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      console.log(`[SetFilmIzle] getStreams called for ${mediaType} ${tmdbId} S${season}E${episode}`);
      const streams = yield extractStreams(tmdbId, mediaType, season, episode);
      console.log(`[SetFilmIzle] Returning ${streams.length} streams`);
      return streams;
    } catch (error) {
      console.error(`[SetFilmIzle] Error in getStreams: ${error.message}`);
      return [];
    }
  });
}
