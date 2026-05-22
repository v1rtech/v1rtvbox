/**
 * patronHDFilmDelisi - Built from src/patronHDFilmDelisi/
 * Generated: 2026-04-29T15:20:35.938Z
 */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
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

// src/patronHDFilmDelisi/index.js
var patronHDFilmDelisi_exports = {};
__export(patronHDFilmDelisi_exports, {
  getStreams: () => getStreams
});
module.exports = __toCommonJS(patronHDFilmDelisi_exports);

// src/patronHDFilmDelisi/extractor.js
var import_cheerio = require("cheerio");

// src/patronHDFilmDelisi/http.js
var MAIN_URL = "https://hdfilmdelisi.one";
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8"
};
function fetchText(_0) {
  return __async(this, arguments, function* (url, extraHeaders = {}) {
    const response = yield fetch(url, {
      headers: __spreadValues(__spreadValues({}, HEADERS), extraHeaders),
      redirect: "follow"
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} -> ${url}`);
    }
    return yield response.text();
  });
}
function fixUrl(url) {
  if (!url)
    return "";
  if (url.startsWith("http://") || url.startsWith("https://"))
    return url;
  if (url.startsWith("//"))
    return `https:${url}`;
  if (url.startsWith("/"))
    return `${MAIN_URL}${url}`;
  return `${MAIN_URL}/${url}`;
}

// src/patronHDFilmDelisi/tmdb.js
var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
var PROVIDER_TAG = "[PatronHDFilmDelisi]";
function getTmdbTitleFromHtml(tmdbId, mediaType) {
  return __async(this, null, function* () {
    try {
      const type = mediaType === "movie" ? "movie" : "tv";
      const url = `https://www.themoviedb.org/${type}/${tmdbId}?language=tr-TR`;
      const response = yield fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
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
      console.log(`${PROVIDER_TAG} [HTML] Baslik bulundu: ${trTitle}`);
      return { trTitle, origTitle };
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
      console.log(`${PROVIDER_TAG} [API] Baslik bulundu: ${trTitle}`);
      return { trTitle, origTitle };
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

// src/patronHDFilmDelisi/extractor.js
var PROVIDER_NAME = "PatronHDFilmDelisi";
function normalize(value) {
  return (value || "").toLowerCase().replace(/[^a-z0-9çğıöşü]+/gi, " ").trim();
}
function slugify(value) {
  return (value || "").toLowerCase().replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function isLikelyMoviePage(html) {
  const lower = (html || "").toLowerCase();
  if (!lower)
    return false;
  if (lower.includes("<title>404") || lower.includes("404 not found"))
    return false;
  return lower.includes("/film/") || lower.includes("film \xF6zeti") || lower.includes("oyuncular") || lower.includes("imdb");
}
function pickBestMatch(results, query) {
  if (!results.length)
    return null;
  const q = normalize(query);
  return results.find((item) => normalize(item.title) === q) || results.find((item) => normalize(item.title).startsWith(q)) || results.find((item) => normalize(item.title).includes(q)) || results[0];
}
function extractCandidatesFromHtml(html) {
  const $ = (0, import_cheerio.load)(html);
  const candidates = [];
  $('a[href*="/film/"]').each((_, el) => {
    const href = fixUrl($(el).attr("href"));
    const title = $(el).find("h2,h3,h4").first().text().trim() || $(el).attr("title") || $(el).text().trim();
    if (href && title) {
      candidates.push({ title, href });
    }
  });
  return candidates;
}
function tryDirectSlug(query) {
  return __async(this, null, function* () {
    const slug = slugify(query);
    if (!slug)
      return null;
    const candidates = [`${MAIN_URL}/film/${slug}`];
    for (let i = 1; i <= 12; i++) {
      candidates.push(`${MAIN_URL}/film/${slug}-hdizle-${i}`);
    }
    for (const url of candidates) {
      try {
        const html = yield fetchText(url, {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Referer": MAIN_URL
        });
        if (isLikelyMoviePage(html))
          return url;
      } catch (_) {
        continue;
      }
    }
    return null;
  });
}
function collectObjectsDeep(value, out) {
  if (!value)
    return;
  if (Array.isArray(value)) {
    for (const item of value)
      collectObjectsDeep(item, out);
    return;
  }
  if (typeof value === "object") {
    out.push(value);
    for (const key of Object.keys(value))
      collectObjectsDeep(value[key], out);
  }
}
function extractCandidatesFromJson(raw) {
  try {
    const parsed = JSON.parse(raw);
    const objects = [];
    const candidates = [];
    collectObjectsDeep(parsed, objects);
    for (const item of objects) {
      const title = item.title || item.name || item.originalTitle || item.original_name || "";
      const slug = item.slug || "";
      const href = item.href || item.url || (slug ? `/film/${slug}` : "");
      if (!href)
        continue;
      if (!String(href).includes("/film/"))
        continue;
      candidates.push({
        title: title || String(href).split("/").pop().replace(/-/g, " "),
        href: fixUrl(href)
      });
    }
    return candidates;
  } catch (_) {
    return [];
  }
}
function searchMovie(query) {
  return __async(this, null, function* () {
    const endpoints = [
      `${MAIN_URL}/arama?q=${encodeURIComponent(query)}`,
      `${MAIN_URL}/arama?query=${encodeURIComponent(query)}`,
      `${MAIN_URL}/film-ara/${encodeURIComponent(query)}`,
      `${MAIN_URL}/search?q=${encodeURIComponent(query)}`,
      `${MAIN_URL}/api/search?q=${encodeURIComponent(query)}`,
      `${MAIN_URL}/api/search?query=${encodeURIComponent(query)}`,
      `${MAIN_URL}/api/film/search?q=${encodeURIComponent(query)}`,
      `${MAIN_URL}/api/film/search?query=${encodeURIComponent(query)}`
    ];
    for (const url of endpoints) {
      try {
        const body = yield fetchText(url, {
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "*/*",
          "Referer": MAIN_URL
        });
        const byHtml = extractCandidatesFromHtml(body);
        const byJson = extractCandidatesFromJson(body);
        const merged = [...byHtml, ...byJson];
        const seen = /* @__PURE__ */ new Set();
        const deduped = merged.filter((item) => {
          const key = `${item.href}|${item.title}`;
          if (seen.has(key))
            return false;
          seen.add(key);
          return true;
        });
        const best = pickBestMatch(deduped, query);
        if (best) {
          return best.href;
        }
      } catch (_) {
        continue;
      }
    }
    const directGuess = yield tryDirectSlug(query);
    if (directGuess)
      return directGuess;
    return null;
  });
}
function collectVideoUrlsFromJson(raw) {
  const out = [];
  try {
    const parsed = JSON.parse(raw);
    const objects = [];
    collectObjectsDeep(parsed, objects);
    for (const item of objects) {
      for (const key of Object.keys(item)) {
        const value = item[key];
        if (typeof value !== "string")
          continue;
        if (!/^https?:\/\//i.test(value))
          continue;
        const keyLower = key.toLowerCase();
        const valueLower = value.toLowerCase();
        if (valueLower.includes(".m3u8") || valueLower.includes(".mp4") || keyLower.includes("iframe") || keyLower.includes("embed") || keyLower.includes("source") || keyLower.includes("video") || keyLower === "src" || keyLower === "url") {
          out.push(value);
        }
      }
    }
  } catch (_) {
    return out;
  }
  return out;
}
function collectVideoUrlsFromText(text) {
  const out = [];
  const regex = /https?:\/\/[^\s"'<>\\]+/g;
  const matches = text.match(regex) || [];
  for (const url of matches) {
    const lower = url.toLowerCase();
    if (lower.includes(".m3u8") || lower.includes(".mp4") || lower.includes("embed") || lower.includes("iframe") || lower.includes("/video/") || lower.includes("/player/")) {
      out.push(url);
    }
  }
  return out;
}
function extractFromMoviePage(movieUrl) {
  return __async(this, null, function* () {
    const html = yield fetchText(movieUrl);
    const $ = (0, import_cheerio.load)(html);
    const streams = [];
    const seen = /* @__PURE__ */ new Set();
    const foundUrls = [];
    $("iframe").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src) {
        foundUrls.push(fixUrl(src));
      }
    });
    $("source").each((_, el) => {
      const src = $(el).attr("src");
      if (src) {
        foundUrls.push(fixUrl(src));
      }
    });
    $("script").each((_, el) => {
      const scriptText = $(el).html() || "";
      foundUrls.push(...collectVideoUrlsFromJson(scriptText));
      foundUrls.push(...collectVideoUrlsFromText(scriptText));
    });
    foundUrls.push(...collectVideoUrlsFromText(html));
    for (const url of foundUrls) {
      if (!url || url === movieUrl)
        continue;
      if (seen.has(url))
        continue;
      seen.add(url);
      const lower = url.toLowerCase();
      const isPlayable = lower.includes(".m3u8") || lower.includes(".mp4");
      streams.push({
        name: PROVIDER_NAME,
        title: isPlayable ? "HDFilmDelisi" : "HDFilmDelisi Embed",
        url,
        quality: "Auto",
        headers: {
          Referer: movieUrl,
          Origin: MAIN_URL
        }
      });
    }
    return streams;
  });
}
function extractStreams(tmdbId, mediaType) {
  return __async(this, null, function* () {
    if (mediaType !== "movie")
      return [];
    const { trTitle, origTitle } = yield getTmdbTitle(tmdbId, mediaType);
    console.log(`[${PROVIDER_NAME}] TMDB: ${tmdbId} | TR: ${trTitle} | ORIG: ${origTitle}`);
    if (!trTitle && !origTitle)
      return [];
    let movieUrl = null;
    if (trTitle)
      movieUrl = yield searchMovie(trTitle);
    if (!movieUrl && origTitle && origTitle !== trTitle) {
      movieUrl = yield searchMovie(origTitle);
    }
    if (!movieUrl) {
      console.warn(`[${PROVIDER_NAME}] Site'de icerik bulunamadi: ${trTitle || origTitle}`);
      return [];
    }
    console.log(`[${PROVIDER_NAME}] Sayfa bulundu: ${movieUrl}`);
    const streams = yield extractFromMoviePage(movieUrl);
    console.log(`[${PROVIDER_NAME}] Toplam stream: ${streams.length}`);
    return streams;
  });
}

// src/patronHDFilmDelisi/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      console.log(`[PatronHDFilmDelisi] Istek: ${mediaType} | TMDB: ${tmdbId} | S:${season} E:${episode}`);
      if (mediaType !== "movie") {
        return [];
      }
      return yield extractStreams(tmdbId, mediaType);
    } catch (error) {
      console.error(`[PatronHDFilmDelisi] Hata: ${error.message}`);
      return [];
    }
  });
}
