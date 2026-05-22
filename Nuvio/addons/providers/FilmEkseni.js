/**
 * patronFilmEkseni - Built from src/patronFilmEkseni/
 * Generated: 2026-04-29T15:12:10.836Z
 */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
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

// src/patronFilmEkseni/index.js
var patronFilmEkseni_exports = {};
__export(patronFilmEkseni_exports, {
  getStreams: () => getStreams
});
module.exports = __toCommonJS(patronFilmEkseni_exports);

// src/patronFilmEkseni/http.js
var MAIN_URL = "https://filmekseni.cc";
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8"
};
function fetchText(_0) {
  return __async(this, arguments, function* (url, extraHeaders = {}) {
    const res = yield fetch(url, {
      headers: __spreadValues(__spreadValues({}, HEADERS), extraHeaders),
      redirect: "follow"
    });
    if (!res.ok)
      throw new Error(`HTTP ${res.status} \u2192 ${url}`);
    return yield res.text();
  });
}
function postText(_0, _1) {
  return __async(this, arguments, function* (url, body, extraHeaders = {}) {
    const res = yield fetch(url, {
      method: "POST",
      headers: __spreadValues(__spreadValues({}, HEADERS), extraHeaders),
      body,
      redirect: "follow"
    });
    if (!res.ok)
      throw new Error(`HTTP ${res.status} \u2192 ${url}`);
    return yield res.text();
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

// src/patronFilmEkseni/tmdb.js
var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
var PROVIDER_TAG = "[patronFilmEkseni]";
function getTmdbTitleFromHtml(tmdbId, mediaType) {
  return __async(this, null, function* () {
    try {
      const type = mediaType === "movie" ? "movie" : "tv";
      const url = `https://www.themoviedb.org/${type}/${tmdbId}?language=tr-TR`;
      const response = yield fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0",
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
      console.log(`${PROVIDER_TAG} [HTML] Ba\u015Fl\u0131k bulundu: ${trTitle}`);
      return { trTitle, origTitle };
    } catch (e) {
      console.warn(`${PROVIDER_TAG} [HTML] Scraping ba\u015Far\u0131s\u0131z: ${e.message}`);
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
      console.log(`${PROVIDER_TAG} [API] Ba\u015Fl\u0131k bulundu: ${trTitle}`);
      return { trTitle, origTitle };
    } catch (e) {
      console.warn(`${PROVIDER_TAG} [API] REST API ba\u015Far\u0131s\u0131z: ${e.message}`);
      return null;
    }
  });
}
function getTmdbTitle(tmdbId, mediaType) {
  return __async(this, null, function* () {
    const htmlResult = yield getTmdbTitleFromHtml(tmdbId, mediaType);
    if (htmlResult)
      return htmlResult;
    console.log(`${PROVIDER_TAG} HTML scraping ba\u015Far\u0131s\u0131z, TMDB REST API deneniyor...`);
    const apiResult = yield getTmdbTitleFromApi(tmdbId, mediaType);
    if (apiResult)
      return apiResult;
    console.error(`${PROVIDER_TAG} Her iki y\xF6ntem de ba\u015Far\u0131s\u0131z oldu: TMDB ID=${tmdbId}`);
    return { trTitle: "", origTitle: "" };
  });
}

// src/patronFilmEkseni/extractor.js
var import_cheerio = require("cheerio");
var VIDEO_HOST = "https://fmdzihoilrvjfvcvvhlbwlkypjsmemvyfxvppedcdqszdxotre.firgunedavay.shop";
function inferPlayerName(itemTitle = "", url = "") {
  const title = (itemTitle || "").toLowerCase();
  const lowerUrl = (url || "").toLowerCase();
  if (title.includes("vidmoly") || lowerUrl.includes("vidmoly"))
    return "VidMoly";
  if (title.includes("eksenload") || lowerUrl.includes("eksenload") || lowerUrl.includes("vidload.top") || lowerUrl.includes("firgunedavay.shop"))
    return "EksenLoad";
  if (title.includes("direkt link") || lowerUrl.includes(".m3u8") || lowerUrl.includes(".mp4"))
    return "Direkt";
  if (title.includes("embed"))
    return "Embed";
  return "Player";
}
function searchMovie(query) {
  return __async(this, null, function* () {
    const url = `${MAIN_URL}/search/`;
    const body = `query=${encodeURIComponent(query)}`;
    const html = yield postText(url, body, {
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "Referer": MAIN_URL
    });
    let results = [];
    try {
      const json = JSON.parse(html);
      if (json && json.result && Array.isArray(json.result)) {
        for (const item of json.result) {
          if (item.title && item.slug) {
            results.push({ title: item.title, href: `${MAIN_URL}/${item.slug}` });
          }
        }
      }
    } catch (e) {
    }
    if (results.length === 0)
      return null;
    const queryLower = query.toLowerCase();
    let exact = results.find((r) => r.title.toLowerCase() === queryLower);
    if (!exact)
      exact = results.find((r) => r.title.toLowerCase().startsWith(queryLower));
    if (!exact)
      exact = results.find((r) => r.title.toLowerCase().includes(queryLower));
    return exact ? exact.href : results[0].href;
  });
}
function extractFromMoviePage(movieUrl) {
  return __async(this, null, function* () {
    const html = yield fetchText(movieUrl);
    const $ = (0, import_cheerio.load)(html);
    const streams = [];
    const addedUrls = /* @__PURE__ */ new Set();
    const toProcess = [];
    const languageTabs = [];
    $("ul.nav-tabs li a").each((i, el) => {
      const title = $(el).text().trim().replace(/\s+/g, " ");
      const href = $(el).attr("href");
      if (href && !title.toLowerCase().includes("fragman")) {
        languageTabs.push({ title: title || "Film", url: fixUrl(href) });
      }
    });
    if (languageTabs.length === 0) {
      languageTabs.push({ title: "Film", url: movieUrl });
    }
    for (const langTab of languageTabs) {
      try {
        let pageHtml = html;
        if (langTab.url !== movieUrl && langTab.url !== movieUrl + "/") {
          pageHtml = yield fetchText(langTab.url);
        }
        const $page = (0, import_cheerio.load)(pageHtml);
        $page("div.card-video iframe").each((i, el) => {
          const src = $page(el).attr("data-src") || $page(el).attr("src");
          if (src) {
            toProcess.push({ url: fixUrl(src), title: `[${langTab.title}] Ana Sunucu` });
          }
        });
        const serverLinks = [];
        $page("div.tab-content a.nav-link").each((i, el) => {
          const href = $(el).attr("href");
          const serverName = $(el).text().trim() || `Sunucu ${i + 1}`;
          if (href) {
            const fullUrl = fixUrl(href);
            if (fullUrl !== langTab.url && fullUrl !== langTab.url + "/") {
              serverLinks.push({ url: fullUrl, serverName });
            }
          }
        });
        for (const srv of serverLinks) {
          try {
            const navHtml = yield fetchText(srv.url);
            const $nav = (0, import_cheerio.load)(navHtml);
            $nav("div.card-video iframe").each((i, el) => {
              const src = $nav(el).attr("data-src") || $nav(el).attr("src");
              if (src) {
                toProcess.push({ url: fixUrl(src), title: `[${langTab.title}] ${srv.serverName}` });
              }
            });
          } catch (e) {
            console.error(`[patronFilmEkseni] Sunucu sekmesi hatas\u0131 (${srv.url}): ${e.message}`);
          }
        }
      } catch (e) {
        console.error(`[patronFilmEkseni] Dil sekmesi hatas\u0131 (${langTab.url}): ${e.message}`);
      }
    }
    for (const item of toProcess) {
      try {
        const embedUrl = item.url;
        console.log(`[patronFilmEkseni] \u0130\u015Fleniyor: ${embedUrl} (${item.title})`);
        if (embedUrl.includes("eksenload") || embedUrl.includes("vidload.top") || embedUrl.includes("firgunedavay.shop")) {
          const streamResults = yield parseEksenLoad(embedUrl, movieUrl);
          for (const s of streamResults) {
            if (!addedUrls.has(s.url)) {
              addedUrls.add(s.url);
              s.title = `${item.title} - EksenLoad`;
              s.name = `patronFilmEkseni - ${inferPlayerName(s.title, s.url)}`;
              streams.push(s);
            }
          }
        } else if (embedUrl.includes("vidmoly")) {
          try {
            const extracted = yield VidMolyExtractor.extract(embedUrl, movieUrl);
            if (extracted) {
              extracted.title = `${item.title} - VidMoly`;
              extracted.name = `patronFilmEkseni - ${inferPlayerName(extracted.title, extracted.url)}`;
              if (!addedUrls.has(extracted.url)) {
                addedUrls.add(extracted.url);
                streams.push(extracted);
              }
            }
          } catch (err) {
            console.error(`[patronFilmEkseni] VidMoly parse hatas\u0131: ${err.message}`);
          }
        } else if (embedUrl.includes(".m3u8") || embedUrl.includes(".mp4")) {
          if (!addedUrls.has(embedUrl)) {
            addedUrls.add(embedUrl);
            streams.push({
              name: `patronFilmEkseni - ${inferPlayerName(`${item.title} - Direkt Link`, embedUrl)}`,
              title: `${item.title} - Direkt Link`,
              url: embedUrl,
              quality: "Auto",
              headers: { Referer: movieUrl }
            });
          }
        } else {
          if (!addedUrls.has(embedUrl)) {
            addedUrls.add(embedUrl);
            streams.push({
              name: `patronFilmEkseni - ${inferPlayerName(`${item.title} - Embed`, embedUrl)}`,
              title: `${item.title} - Embed`,
              url: embedUrl,
              quality: "Auto",
              headers: { Referer: movieUrl }
            });
          }
        }
      } catch (err) {
        console.error(`[patronFilmEkseni] Embed parse hatas\u0131: ${err.message}`);
      }
    }
    return streams;
  });
}
function parseEksenLoad(embedUrl, referer) {
  return __async(this, null, function* () {
    const streams = [];
    try {
      const html = yield fetchText(embedUrl, { Referer: referer });
      const $ = (0, import_cheerio.load)(html);
      let playerScript = "";
      $("script").each((i, el) => {
        const data = $(el).html() || "";
        if (data.includes("jwplayer") && data.includes("setup")) {
          playerScript = data;
          return false;
        }
      });
      if (!playerScript)
        return streams;
      let subtitles = [];
      const tracksMatches = playerScript.match(new RegExp("tracks\\s*:\\s*\\[(.*?)\\]", "s"));
      if (tracksMatches) {
        const tracksText = tracksMatches[1];
        const trackBlocks = tracksText.match(/\{[^}]+\}/g) || [];
        for (const block of trackBlocks) {
          const fMatch = block.match(/file\s*:\s*['"]([^'"]+)['"]/);
          const lMatch = block.match(/label\s*:\s*['"]([^'"]+)['"]/);
          if (fMatch && lMatch) {
            let sUrl = fMatch[1];
            if (sUrl.startsWith("/")) {
              sUrl = VIDEO_HOST + sUrl;
            } else if (!sUrl.startsWith("http")) {
              sUrl = VIDEO_HOST + "/" + sUrl;
            }
            subtitles.push({ file: sUrl, label: lMatch[1] });
          }
        }
      }
      const fileMatches = [...playerScript.matchAll(/file\s*:\s*['"]([^'"]+)['"]/g)];
      for (const match of fileMatches) {
        const rawPath = match[1];
        if (!rawPath)
          continue;
        if (rawPath.endsWith(".jpg") || rawPath.endsWith(".png") || rawPath.endsWith(".vtt") || rawPath.endsWith(".srt"))
          continue;
        let finalUrl;
        if (rawPath.startsWith("http")) {
          finalUrl = rawPath;
        } else if (rawPath.startsWith("/")) {
          finalUrl = VIDEO_HOST + rawPath;
        } else {
          finalUrl = VIDEO_HOST + "/" + rawPath;
        }
        if (finalUrl.includes("m3u8")) {
          streams.push({
            name: "patronFilmEkseni",
            title: "EksenLoad m3u8",
            url: finalUrl,
            quality: "Auto",
            subtitles: subtitles.length > 0 ? subtitles : void 0,
            headers: {
              Referer: new URL(embedUrl).origin + "/",
              Origin: new URL(embedUrl).origin,
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0",
              Accept: "*/*"
            }
          });
        } else {
          streams.push({
            name: "patronFilmEkseni",
            title: "EksenLoad Video",
            url: finalUrl,
            quality: "Auto",
            subtitles: subtitles.length > 0 ? subtitles : void 0,
            headers: {
              Referer: new URL(embedUrl).origin + "/",
              Origin: new URL(embedUrl).origin,
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0",
              Accept: "*/*"
            }
          });
        }
      }
    } catch (err) {
      console.error(`[patronFilmEkseni] EksenLoad parse hatas\u0131: ${err.message}`);
    }
    return streams;
  });
}
function extractStreams(tmdbId, mediaType) {
  return __async(this, null, function* () {
    if (mediaType !== "movie")
      return [];
    const { trTitle, origTitle } = yield getTmdbTitle(tmdbId, mediaType);
    console.log(`[patronFilmEkseni] TMDB: ${tmdbId} | Ba\u015Fl\u0131k: ${trTitle}`);
    if (!trTitle && !origTitle)
      return [];
    let movieUrl = null;
    if (trTitle)
      movieUrl = yield searchMovie(trTitle);
    if (!movieUrl && origTitle && origTitle !== trTitle)
      movieUrl = yield searchMovie(origTitle);
    if (!movieUrl) {
      console.warn(`[patronFilmEkseni] Site'de bulunamad\u0131: ${trTitle || origTitle}`);
      return [];
    }
    console.log(`[patronFilmEkseni] Sayfa: ${movieUrl}`);
    const streams = yield extractFromMoviePage(movieUrl);
    console.log(`[patronFilmEkseni] Stream say\u0131s\u0131: ${streams.length}`);
    return streams;
  });
}
var VidMolyExtractor = class {
  static canHandleUrl(url) {
    return url.includes("vidmoly") || this.supportedDomains.some((domain) => url.includes(domain));
  }
  static extract(embedUrl, referer = null) {
    return __async(this, null, function* () {
      var _a;
      try {
        console.log(`[VidMoly] Extracting: ${embedUrl}`);
        const headers = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Sec-Fetch-Dest": "iframe"
        };
        if (referer)
          headers.Referer = referer;
        const candidateUrls = [embedUrl];
        const normalizedUrl = embedUrl.replace(/https?:\/\/vidmoly\.[a-z]+/, "https://vidmoly.me");
        if (normalizedUrl !== embedUrl)
          candidateUrls.push(normalizedUrl);
        const watchUrl = normalizedUrl.replace(/\/embed-([a-z0-9]+)\.html/, "/w/$1");
        if (watchUrl !== normalizedUrl)
          candidateUrls.push(watchUrl);
        let html = "";
        let finalUrl = "";
        for (const url of candidateUrls) {
          try {
            const response = yield fetch(url, { headers });
            html = yield response.text();
            finalUrl = url;
            const lowerHtml = html.toLowerCase();
            if (lowerHtml.includes("this video not found") || lowerHtml.includes("file was deleted") || lowerHtml.includes("video not found")) {
              continue;
            }
            if (html.includes("sources:") || html.includes(".m3u8") || html.includes("jwplayer"))
              break;
          } catch (e) {
            continue;
          }
        }
        if (!html)
          throw new Error("Could not fetch VidMoly page");
        const $ = (0, import_cheerio.load)(html);
        if (html.includes("Select number") || html.toLowerCase().includes("select the number")) {
          const op = $('input[name="op"]').val();
          const fileCode = $('input[name="file_code"]').val();
          const answer = $("div.vhint b").text() || $("span.vhint b").text() || ((_a = html.match(/Please select (\d+)/)) == null ? void 0 : _a[1]);
          const ts = $('input[name="ts"]').val();
          const nonce = $('input[name="nonce"]').val();
          const ctok = $('input[name="ctok"]').val();
          if (op && fileCode && answer) {
            const formData = new URLSearchParams();
            formData.append("op", op);
            formData.append("file_code", fileCode);
            formData.append("answer", answer);
            if (ts)
              formData.append("ts", ts);
            if (nonce)
              formData.append("nonce", nonce);
            if (ctok)
              formData.append("ctok", ctok);
            const response = yield fetch(finalUrl, {
              method: "POST",
              headers: __spreadProps(__spreadValues({}, headers), { "Content-Type": "application/x-www-form-urlencoded" }),
              body: formData.toString()
            });
            html = yield response.text();
            finalUrl = response.url;
          }
        }
        let videoUrl = null;
        const scriptMatches = html.match(/eval\(function\(p,a,c,k,e,?[d]?\).*?\)\)/g);
        if (scriptMatches) {
          for (let script of scriptMatches) {
            const unpacked = this.unpackJS(script);
            const vidMatch = unpacked.match(/file\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i) || unpacked.match(/file\s*:\s*["']([^"']+\.mp4[^"']*)["']/i);
            if (vidMatch) {
              videoUrl = vidMatch[1];
              break;
            }
          }
        }
        if (!videoUrl && html.includes("#EXTM3U")) {
          const lines = html.split("\n");
          for (const line of lines) {
            if (line.trim().startsWith("http") && (line.includes(".m3u8") || line.includes(".mp4"))) {
              videoUrl = line.trim().replace(/['"]/g, "");
              break;
            }
          }
        }
        if (!videoUrl) {
          const sourcesMatch = html.match(/sources:\s*\[([^\]]*)\]/);
          if (sourcesMatch) {
            try {
              const sourcesText = this._addMarks(sourcesMatch[1], "file");
              const sources = JSON.parse(`[${sourcesText}]`);
              for (const source of sources) {
                if (source.file) {
                  videoUrl = source.file;
                  break;
                }
              }
            } catch (e) {
            }
          }
        }
        if (!videoUrl) {
          const fileMatch = html.match(/file\s*:\s*['"]([^'"]*\.m3u8[^'"]*)['"]/) || html.match(/file\s*:\s*['"]([^'"]*\.mp4[^'"]*)['"]/);
          if (fileMatch)
            videoUrl = fileMatch[1];
        }
        if (!videoUrl)
          throw new Error(`Could not extract video URL from ${embedUrl}`);
        console.log(`[VidMoly] Extracted: ${videoUrl}`);
        return {
          url: videoUrl,
          quality: "Auto",
          headers: { "Referer": finalUrl, "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        };
      } catch (error) {
        console.error(`[VidMoly] Extract error: ${error.message}`);
        return null;
      }
    });
  }
  static unpackJS(code) {
    try {
      const match = code.match(/}\('([^']*)',(\d+),(\d+),'([^']*)'\.split\('\|'\)/);
      if (!match)
        return code;
      let p = match[1];
      const a = parseInt(match[2], 10);
      const c = parseInt(match[3], 10);
      const k = match[4].split("|");
      const e = (c2) => (c2 < a ? "" : e(parseInt(c2 / a, 10))) + (c2 % a > 35 ? String.fromCharCode(c2 % a + 29) : (c2 % a).toString(36));
      let map = {};
      for (let i = 0; i < c; i++)
        map[e(i)] = k[i];
      const dictRegex = new RegExp("\\b(" + Object.keys(map).filter((key) => key).join("|") + ")\\b", "g");
      return p.replace(dictRegex, function(match2) {
        return map[match2] || match2;
      });
    } catch (err) {
      return code;
    }
  }
  static _addMarks(text, field) {
    return text.replace(new RegExp(`"?${field}"?`, "g"), `"${field}"`);
  }
};
__publicField(VidMolyExtractor, "name", "VidMoly");
__publicField(VidMolyExtractor, "supportedDomains", ["vidmoly.to", "vidmoly.me", "vidmoly.net", "vidmoly.biz", "videobin.co"]);

// src/patronFilmEkseni/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      console.log(`[patronFilmEkseni] \u0130stek: ${mediaType} | TMDB: ${tmdbId}`);
      if (mediaType !== "movie")
        return [];
      const streams = yield extractStreams(tmdbId, mediaType);
      return streams;
    } catch (error) {
      console.error(`[patronFilmEkseni] Hata: ${error.message}`);
      return [];
    }
  });
}
