/**
 * DiziYo Provider
 */

"use strict";

var BASE_URL   = "https://www.diziyo.so";
var PLAYER_URL = "https://www.dzyhd.site";
var TMDB_KEY   = "500330721680edb6d5f7f12ba7cd9023";
var UA         = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ─── HTTP ─────────────────────────────────────────────────────────────────────

function get(url, referer) {
  return fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      "Referer": referer || BASE_URL + "/",
    }
  }).then(function(r) {
    if (!r.ok) throw new Error("HTTP " + r.status + " - " + url);
    return r.text();
  });
}

// ─── Slug ─────────────────────────────────────────────────────────────────────

var TR_MAP = {"ğ":"g","ü":"u","ş":"s","ı":"i","ö":"o","ç":"c","Ğ":"g","Ü":"u","Ş":"s","İ":"i","Ö":"o","Ç":"c"};
function trSlug(s) {
  return s.replace(/[ğüşıöçĞÜŞİÖÇ]/g, function(c) { return TR_MAP[c] || c; })
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// ─── TMDB ─────────────────────────────────────────────────────────────────────

function getTmdbInfo(tmdbId, mediaType) {
  var ep = mediaType === "movie" ? "movie" : "tv";
  return fetch("https://api.themoviedb.org/3/" + ep + "/" + tmdbId +
    "?api_key=" + TMDB_KEY + "&language=tr-TR")
    .then(function(r) { return r.json(); })
    .then(function(d) {
      return {
        title:     (d.name || d.title || "").trim(),
        origTitle: (d.original_name || d.original_title || "").trim(),
      };
    });
}

// ─── .txt → m3u8 çözümleme ───────────────────────────────────────────────────
// Sunucu .txt uzantılı URL verirse içeriğini fetch edip en iyi kalite URL'yi al

function resolveTxtUrl(url, referer) {
  var clean = url.split("?")[0];
  if (!clean.endsWith(".txt")) return Promise.resolve(url);

  return fetch(url, {
    headers: { "User-Agent": UA, "Referer": referer || BASE_URL + "/" }
  })
  .then(function(r) { return r.ok ? r.text() : null; })
  .then(function(text) {
    if (!text || text.trim().indexOf("#EXTM3U") !== 0) return url;
    var base = url.substring(0, url.lastIndexOf("/") + 1);
    var lines = text.split("\n");
    var best = null, bestBw = -1;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line.indexOf("#EXT-X-STREAM-INF") === 0) {
        var bwM = line.match(/BANDWIDTH=(\d+)/);
        var bw = bwM ? parseInt(bwM[1]) : 0;
        var next = (lines[i + 1] || "").trim();
        if (next && next.charAt(0) !== "#" && bw > bestBw) {
          bestBw = bw;
          if (next.indexOf("http") === 0) {
            best = next; // absolute URL
          } else if (next.charAt(0) === "/") {
            // Root-relative path: domain + path
            var domainM = url.match(/^(https?:\/\/[^\/]+)/);
            best = domainM ? domainM[1] + next : base + next;
          } else {
            best = base + next; // relative path
          }
        }
      }
    }
    console.log("[DiziYo] .txt → " + (best || url));
    return best || url;
  })
  .catch(function() { return url; });
}

// ─── iframe URL çıkarma ──────────────────────────────────────────────────────

function extractIframeUrl(html) {
  // DEX: <iframe[^>]+src=["']([^"']*/video/[^"']+)["']
  // .dzn-player-stage iframe
  var pats = [
    /<div[^>]+dzn-player-stage[^>]*>[\s\S]*?<iframe[^>]+src=["']([^"']+)["']/i,
    /<iframe[^>]+src=["']([^"']*dzyhd[^"']+)["']/i,
    /<iframe[^>]+src=["']([^"']*\/video\/[^"']+)["']/i,
  ];
  for (var i = 0; i < pats.length; i++) {
    var m = html.match(pats[i]);
    if (m) return m[1];
  }
  return null;
}

// ─── API: video/api.php?v={id} → { file: "...m3u8" } ────────────────────────

function getM3u8FromApi(iframeUrl, pageUrl) {
  // iframe URL'den video ID çıkar
  // Örnek: https://www.dzyhd.site/video/{32char_hex}
  var idM = iframeUrl.match(/[?&](?:v|id)=([A-Za-z0-9_-]+)/)
          || iframeUrl.match(/\/video\/([a-f0-9]{32})(?:[/?#]|$)/i)
          || iframeUrl.match(/\/video\/([A-Za-z0-9_-]+)(?:[/?#]|$)/);

  if (!idM) {
    return get(iframeUrl, pageUrl).then(function(html) {
      var m = html.match(/(https?:\/\/[^\s"'<>]+\.(?:m3u8|txt)[^\s"'<>]*)/i);
      return m ? resolveTxtUrl(m[1], iframeUrl) : null;
    });
  }

  var videoId = idM[1];
  console.log("[DiziYo] videoId=" + videoId);

  // 1. Önce api-vidmoly.php dene (gerçek m3u8 verir)
  function tryVidmoly() {
    var apiUrl = PLAYER_URL + "/video/api-vidmoly.php?v=" + videoId + "&_=" + Date.now();
    console.log("[DiziYo] Vidmoly API: " + apiUrl);
    return fetch(apiUrl, {
      method: "POST",
      headers: { "User-Agent": UA, "Referer": iframeUrl, "X-Requested-With": "XMLHttpRequest",
                 "Content-Type": "application/x-www-form-urlencoded" },
      body: ""
    })
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(d) {
      if (!d) return null;
      // Response: {"embed": "https://vidmoly.biz/embed-xxx.html"}
      var embedUrl = d.embed || d.iframe || d.url || d.src;
      if (!embedUrl) {
        var str = JSON.stringify(d);
        var m = str.match(/(https?:\/\/[^"\\]+vidmoly[^"\\]*)/i)
             || str.match(/(https?:\/\/[^"\\]+\.html[^"\\]*)/i);
        embedUrl = m ? m[1] : null;
      }
      if (!embedUrl) return null;
      console.log("[DiziYo] Vidmoly embed: " + embedUrl);
      return extractFromVidmoly(embedUrl, iframeUrl);
    })
    .catch(function() { return null; });
  }

  // 2. api.php (alternatif - .txt döner)
  function tryAltApi() {
    var apiUrl = PLAYER_URL + "/video/api.php?v=" + videoId + "&_=" + Date.now();
    console.log("[DiziYo] Alt API: " + apiUrl);
    return fetch(apiUrl, {
      headers: { "User-Agent": UA, "Referer": iframeUrl, "X-Requested-With": "XMLHttpRequest" }
    })
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(d) {
      if (!d) return null;
      var url = d.file || d.m3u8Url || d.sourceUrl || d.url || d.source;
      if (!url) {
        var str = JSON.stringify(d);
        var m = str.match(/(https?:\/\/[^"\\]+\.(?:m3u8|txt)[^"\\]*)/i);
        url = m ? m[1] : null;
      }
      return url ? resolveTxtUrl(url, iframeUrl) : null;
    })
    .catch(function() { return null; });
  }

  return tryVidmoly().then(function(m3u8) {
    return m3u8 || tryAltApi();
  });
}

// Vidmoly embed sayfasından m3u8 çıkar
// embed-{slug}.html → slug → sources API
function extractFromVidmoly(embedUrl, referer) {
  // Slug çıkar: vidmoly.biz/embed-ABC123.html → ABC123
  var slugM = embedUrl.match(/embed-([A-Za-z0-9]+)\.html/i);
  var slug = slugM ? slugM[1] : null;

  // 1. Vidmoly sources API dene
  function trySourcesApi() {
    if (!slug) return Promise.resolve(null);
    // Vidmoly standart sources endpoint'leri
    var apis = [
      "https://vidmoly.biz/api/sources/" + slug,
      "https://vidmoly.me/api/sources/" + slug,
      "https://vidmoly.biz/player/index.php?data=" + slug + "&do=getVideo",
    ];
    function tryApi(i) {
      if (i >= apis.length) return Promise.resolve(null);
      return fetch(apis[i], {
        method: "POST",
        headers: {
          "User-Agent": UA,
          "Referer": embedUrl,
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "r=" + encodeURIComponent(embedUrl) + "&d=vidmoly.biz"
      })
      .then(function(r) { return r.ok ? r.text() : null; })
      .then(function(text) {
        if (!text) return tryApi(i+1);
        // m3u8 URL ara
        var m = text.match(/(https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*)/i);
        if (m) { console.log("[DiziYo] Sources API m3u8: " + m[1].substring(0,60)); return m[1]; }
        // JSON parse et
        try {
          var d = JSON.parse(text);
          var sources = d.data || d.sources || d.file;
          if (typeof sources === "string" && sources.indexOf("m3u8") !== -1) return sources;
          if (Array.isArray(sources)) {
            var best = sources[sources.length-1];
            return best.file || best.src || best.url || null;
          }
        } catch(e2) {}
        return tryApi(i+1);
      })
      .catch(function() { return tryApi(i+1); });
    }
    return tryApi(0);
  }

  // 2. Embed HTML fetch (JWPlayer setup içinde m3u8 olabilir)
  function tryEmbedHtml() {
    return fetch(embedUrl, {
      headers: { "User-Agent": UA, "Referer": referer }
    })
    .then(function(r) { return r.ok ? r.text() : null; })
    .then(function(html) {
      if (!html) return null;
      var m = html.match(/(https?:\/\/[^\s"'\\]+\.m3u8[^\s"'\\]*)/i);
      if (m) { console.log("[DiziYo] Embed HTML m3u8: " + m[1].substring(0,60)); return m[1]; }
      // JWPlayer setup config
      var jwM = html.match(/jwplayer[^.]*\.setup\s*\(\s*(\{[\s\S]*?\})\s*\)/);
      if (jwM) {
        var fileM = jwM[1].match(/"file"\s*:\s*"([^"]+\.m3u8[^"]*)"/i);
        if (fileM) return fileM[1];
      }
      return null;
    })
    .catch(function() { return null; });
  }

  return trySourcesApi().then(function(m) { return m || tryEmbedHtml(); });
}

// ─── Bölüm URL adayları ───────────────────────────────────────────────────────

function episodeUrls(slug, season, episode) {
  return [
    BASE_URL + "/" + slug + "-" + season + "-sezon-" + episode + "-bolum-izle",
    BASE_URL + "/" + slug + "/season-" + season + "/episode-" + episode,
    BASE_URL + "/dizi/" + slug + "/sezon-" + season + "/bolum-" + episode,
    BASE_URL + "/" + slug + "-sezon-" + season + "-bolum-" + episode + "-izle",
  ];
}

function movieUrls(slug) {
  return [
    BASE_URL + "/" + slug + "-izle",
    BASE_URL + "/film/" + slug,
    BASE_URL + "/" + slug,
  ];
}

// ─── Benzerlik ───────────────────────────────────────────────────────────────

function similarity(a, b) {
  if (!a || !b) return 0;
  a = a.toLowerCase(); b = b.toLowerCase();
  if (a === b) return 1;
  if (a.indexOf(b) !== -1 || b.indexOf(a) !== -1) return 0.8;
  var aw = a.split(/\s+/), bw = b.split(/\s+/), c = 0;
  aw.forEach(function(w) { if (bw.indexOf(w) !== -1 && w.length > 1) c++; });
  return c / Math.max(aw.length, bw.length);
}

// ─── URL deneme ───────────────────────────────────────────────────────────────

function tryUrl(url) {
  return get(url, BASE_URL + "/")
    .then(function(html) {
      var iframe = extractIframeUrl(html);
      return iframe ? { pageUrl: url, iframeUrl: iframe } : null;
    })
    .catch(function() { return null; });
}

// Sayfayı fetch et, dzn-player-tabs içindeki tüm tab URL'lerini çıkar
// Sonra her tab'dan iframe URL'sini al
function getVersionsFromPage(url) {
  return get(url, BASE_URL + "/")
    .then(function(html) {
      // dzn-player-tabs içindeki tüm <a href> + dzn-flag class çiftlerini çıkar
      var tabsBlock = html.match(/id="dznPlayerTabs"[^>]*>([\s\S]*?)<\/div>/);
      if (!tabsBlock) return null;

      var tabs = [];
      var tabRe = /<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?dzn-flag\s+(trsub|trdub|ensub)[^"]*[\s\S]*?<\/a>/g;
      var m;
      while ((m = tabRe.exec(tabsBlock[1])) !== null) {
        tabs.push({ url: m[1], type: m[2] });
      }

      // Hiç tab bulunamadıysa ana flag'e bak
      if (tabs.length === 0) {
        var flagM = tabsBlock[1].match(/dzn-flag\s+(trsub|trdub|ensub)/);
        var hrefM = tabsBlock[1].match(/href="([^"]+)"/);
        if (flagM && hrefM) tabs.push({ url: hrefM[1], type: flagM[1] });
      }

      // Hâlâ boşsa en azından ana URL'yi ekle
      if (tabs.length === 0) tabs.push({ url: url, type: "unknown" });

      console.log("[DiziYo] Tabs bulundu: " + tabs.map(function(t){return t.type;}).join(", "));

      // Her tab'dan iframe çek
      var promises = tabs.map(function(tab) {
        return get(tab.url, BASE_URL + "/")
          .then(function(tabHtml) {
            var iframe = extractIframeUrl(tabHtml);
            if (!iframe) return null;
            return { pageUrl: tab.url, iframeUrl: iframe, type: tab.type };
          })
          .catch(function() { return null; });
      });

      return Promise.all(promises).then(function(results) {
        return results.filter(Boolean);
      });
    })
    .catch(function() { return null; });
}

function tryUrls(urls, idx) {
  if (idx >= urls.length) return Promise.resolve([]);
  return getVersionsFromPage(urls[idx]).then(function(found) {
    if (found && found.length > 0) return found;
    return tryUrls(urls, idx + 1);
  });
}

// ─── Arama ───────────────────────────────────────────────────────────────────

function searchSlug(info, mediaType) {
  var q = info.title || info.origTitle;
  // Arama: POST /wp-admin/admin-ajax.php {"action":"dzn_ajax_search","term":q}
  return fetch(BASE_URL + "/wp-admin/admin-ajax.php", {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded",
      "Referer": BASE_URL + "/",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: "action=dzn_ajax_search&term=" + encodeURIComponent(q)
  })
  .then(function(r) { return r.ok ? r.text() : ""; })
  .then(function(html) {
    // Response: HTML fragment, href="https://www.diziyo.so/dizi/{slug}/"
    var re = /href="(https?:\/\/[^"]*diziyo\.[^"\/]+\/(?:dizi\/)?([^"\/]+)\/)"/g;
    var results = [], seen = {}, m;
    while ((m = re.exec(html)) !== null) {
      var slug = m[2];
      if (!seen[slug] && slug.length > 2) {
        seen[slug] = 1;
        results.push({ url: m[1], slug: slug });
      }
    }
    var best = null, bestScore = 0.25;
    results.forEach(function(r) {
      var s = Math.max(
        similarity(r.slug.replace(/-/g, " "), (info.title || "").toLowerCase()),
        similarity(r.slug.replace(/-/g, " "), (info.origTitle || "").toLowerCase())
      );
      if (s > bestScore) { bestScore = s; best = r; }
    });
    return best ? best.slug : null;
  })
  .catch(function() { return null; });
}

// ─── Dizi sayfasından bölüm URL'si bul ──────────────────────────────────────

function findEpisodeFromShowPage(slug, season, episode) {
  // /dizi/{slug}/bolumler endpoint'i — DEX'te /bolumler var
  var showUrl = BASE_URL + "/dizi/" + slug;
  return get(showUrl, BASE_URL + "/")
    .then(function(html) {
      // Bölüm linklerini tara
      var re = /href=["']([^"']*season-(\d+)[^"']*episode-(\d+)[^"']*|[^"']*-(\d+)-sezon-(\d+)-bolum[^"']*)["']/gi;
      var m;
      while ((m = re.exec(html)) !== null) {
        var s = parseInt(m[2] || m[4]);
        var e = parseInt(m[3] || m[5]);
        if (s === season && e === episode) {
          var href = m[1];
          if (href.charAt(0) === "/") href = BASE_URL + href;
          return tryUrl(href);
        }
      }
      return null;
    })
    .catch(function() { return null; });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function getStreams(tmdbId, mediaType, season, episode) {
  console.log("[DiziYo] " + tmdbId + " " + mediaType + " S" + season + "E" + episode);
  var hdrs = { "Referer": BASE_URL + "/", "Origin": BASE_URL, "User-Agent": UA };

  return getTmdbInfo(tmdbId, mediaType)
    .then(function(info) {
      console.log("[DiziYo] " + info.title + " / " + info.origTitle);

      var slugs = [];
      var s1 = trSlug(info.origTitle), s2 = trSlug(info.title);
      if (s1) slugs.push(s1);
      if (s2 && s2 !== s1) slugs.push(s2);

      function buildUrls(slug) {
        return mediaType === "movie" ? movieUrls(slug) : episodeUrls(slug, season, episode);
      }

      // Tüm slug adaylarından URL listesi oluştur
      var allUrls = [];
      slugs.forEach(function(sl) {
        buildUrls(sl).forEach(function(u) { allUrls.push(u); });
      });

      return tryUrls(allUrls, 0)
        .then(function(results) {
          if (results.length > 0) return results;
          // Arama yap
          return searchSlug(info, mediaType).then(function(found) {
            if (!found) return [];
            console.log("[DiziYo] Arama: " + found);
            return tryUrls(buildUrls(found), 0).then(function(results2) {
              if (results2.length > 0) return results2;
              if (mediaType !== "movie") {
                return findEpisodeFromShowPage(found, season, episode)
                  .then(function(r) { return r ? [r] : []; });
              }
              return [];
            });
          });
        });
    })
    .then(function(results) {
      if (!results || results.length === 0) { console.warn("[DiziYo] bulunamadi"); return []; }

      // Her versiyondan stream çek
      var promises = results.map(function(result, idx) {
        var isDub = (result.type === "trdub"); // type'a göre belirle
        console.log("[DiziYo] iframe[" + idx + "]=" + result.iframeUrl);
        return getM3u8FromApi(result.iframeUrl, result.pageUrl)
          .then(function(m3u8) {
            if (!m3u8) return null;
            console.log("[DiziYo] m3u8[" + idx + "]=" + m3u8.substring(0, 60) + "...");
            var titleMap = {
              "trdub": "DiziYo - Turkce Dublaj",
              "trsub": "DiziYo - Turkce Altyazili",
              "ensub": "DiziYo - Ingilizce Altyazili",
              "unknown": "DiziYo",
            };
            return {
              name:    "DiziYo",
              title:   titleMap[result.type] || "DiziYo",
              url:     m3u8,
              quality: "1080p",
              headers: hdrs,
            };
          })
          .catch(function() { return null; });
      });

      return Promise.all(promises).then(function(streams) {
        return streams.filter(Boolean);
      });
    })
    .catch(function(err) {
      console.error("[DiziYo] " + err.message);
      return [];
    });
}

module.exports = { getStreams: getStreams };
