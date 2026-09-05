// ============================================================
//  DDizi — Nuvio Provider  v1.1
//  Site: https://www.ddizi.im
// ============================================================

var BASE_URL     = "https://www.ddizi.im";
var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";

// Desktop UA — site bot-detection'ı geçmek için
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";

var TR_CHAR_MAP = {
  "ğ":"g","ü":"u","ş":"s","ı":"i","ö":"o","ç":"c",
  "Ğ":"g","Ü":"u","Ş":"s","İ":"i","Ö":"o","Ç":"c"
};

// Cached session cookie (PHPSESSID) — her getStreams çağrısında bir kez alınır
var _sessionCookie = null;

function fetchSessionCookie() {
  if (_sessionCookie) return Promise.resolve(_sessionCookie);
  return fetch(BASE_URL + "/", {
    headers: {
      "User-Agent"      : UA,
      "Accept"          : "text/html,application/xhtml+xml,*/*;q=0.8",
      "Accept-Language" : "tr-TR,tr;q=0.9,en;q=0.8"
    }
  })
  .then(function(r) {
    var sc = r.headers.get("set-cookie") || "";
    // PHPSESSID=xxx; path=/ formatından değeri çıkar
    var parts = sc.split(",").map(function(c) { return c.trim().split(";")[0]; });
    _sessionCookie = parts.filter(Boolean).join("; ") || "";
    console.log("[DDizi] session cookie: " + _sessionCookie.substring(0, 40));
    return _sessionCookie;
  })
  .catch(function() { return ""; });
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────

function get(url, referer, cookie) {
  var hdrs = {
    "User-Agent"      : UA,
    "Accept"          : "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language" : "tr-TR,tr;q=0.9,en;q=0.8",
    "Referer"         : referer || BASE_URL + "/"
  };
  if (cookie) hdrs["Cookie"] = cookie;
  return fetch(url, { headers: hdrs })
    .then(function(r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " " + url);
      return r.text();
    });
}

function post(url, body, referer, cookie) {
  var hdrs = {
    "User-Agent"   : UA,
    "Content-Type" : "application/x-www-form-urlencoded",
    "Referer"      : referer || BASE_URL + "/",
    "Accept"       : "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8"
  };
  if (cookie) hdrs["Cookie"] = cookie;
  return fetch(url, { method: "POST", headers: hdrs, body: body })
    .then(function(r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " " + url);
      return r.text();
    });
}

// ─── TMDB ─────────────────────────────────────────────────────────────────────

function getTmdbInfo(tmdbId, mediaType) {
  var ep = mediaType === "movie" ? "movie" : "tv";
  return fetch(
    "https://api.themoviedb.org/3/" + ep + "/" + tmdbId +
    "?api_key=" + TMDB_API_KEY + "&language=tr-TR"
  )
  .then(function(r) { return r.json(); })
  .then(function(d) {
    return {
      title    : (d.name || d.title || "").trim(),
      origTitle: (d.original_name || d.original_title || "").trim()
    };
  });
}

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

function normalizeTitle(t) {
  if (!t) return "";
  var s = t;
  Object.keys(TR_CHAR_MAP).forEach(function(k) {
    s = s.split(k).join(TR_CHAR_MAP[k]);
  });
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function similarity(a, b) {
  if (!a || !b) return 0;
  a = normalizeTitle(a); b = normalizeTitle(b);
  if (a === b) return 1;
  if (a.indexOf(b) !== -1 || b.indexOf(a) !== -1) return 0.85;
  var aw = a.split(" "), bw = b.split(" "), c = 0;
  aw.forEach(function(w) {
    if (w.length > 1 && bw.indexOf(w) !== -1) c++;
  });
  return c / Math.max(aw.length, bw.length);
}

// ─── DDizi Arama ──────────────────────────────────────────────────────────────

function searchDdizi(query, cookie) {
  return post(BASE_URL + "/arama/", "arama=" + encodeURIComponent(query), BASE_URL + "/", cookie)
    .then(function(html) {
      var results = [];
      var re = /<div[^>]+dizi-boxpost-cat[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*title="([^"]+)"[\s\S]*?<\/div>/gi;
      var m;
      while ((m = re.exec(html)) !== null) {
        var href  = m[1];
        var title = m[2].replace(/\s*(son bölüm izle|izle)\s*$/i, "").trim();
        if (href && title) {
          results.push({ url: href, title: title });
        }
      }
      return results;
    })
    .catch(function() { return []; });
}

function findBestResult(results, titleTr, titleOrig) {
  var best = null, bestScore = 0.3;
  results.forEach(function(r) {
    var s = Math.max(
      similarity(r.title, titleTr),
      similarity(r.title, titleOrig)
    );
    if (s > bestScore) { bestScore = s; best = r; }
  });
  return best;
}

// ─── Bölüm Sayfaları ──────────────────────────────────────────────────────────
// DDizi URL formatı: /diziler/{id}/{slug}-{bolum}-son-bolum-izle
// Dizi sayfasında bölümler div.dizi-boxpost-cat içinde, sayfalama /sayfa-N

function fetchEpisodeUrls(diziUrl, targetEpisode, cookie) {
  return fetchAllEpisodes(diziUrl, cookie).then(function(eps) {
    // Bölüm numarasına göre sırala ve hedefi bul
    var match = null;
    eps.forEach(function(ep) {
      var m = ep.title.match(/(\d+)\.Bölüm/i);
      if (m && parseInt(m[1]) === targetEpisode) match = ep.url;
    });
    return match;
  });
}

function fetchAllEpisodes(diziUrl, cookie) {
  return get(diziUrl, BASE_URL + "/", cookie).then(function(html) {
    var eps      = parseEpisodeList(html);
    var pageUrls = extractPageUrls(html, diziUrl);

    if (pageUrls.length === 0) return eps;

    var promises = pageUrls.map(function(pu) {
      return get(pu, diziUrl, cookie)
        .then(function(ph) { return parseEpisodeList(ph); })
        .catch(function() { return []; });
    });

    return Promise.all(promises).then(function(pages) {
      pages.forEach(function(pg) { eps = eps.concat(pg); });
      return eps;
    });
  });
}

function parseEpisodeList(html) {
  var eps = [];
  var re  = /<div[^>]+dizi-boxpost-cat[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*title="([^"]+)"[\s\S]*?<\/div>/gi;
  var m;
  while ((m = re.exec(html)) !== null) {
    var href  = m[1];
    var title = m[2].replace(/\s*izle\s*$/i, "").trim();
    if (href && href.indexOf("/izle/") !== -1) {
      eps.push({ url: href, title: title });
    }
  }
  return eps;
}

function extractPageUrls(html, baseUrl) {
  var urls = [];
  var seen = {};
  var re   = /href="([^"]+\/sayfa-(\d+))"/gi;
  var m;
  while ((m = re.exec(html)) !== null) {
    var n = parseInt(m[2]);
    if (n > 0 && !seen[n]) {
      seen[n] = 1;
      urls.push(m[1].indexOf("http") === 0 ? m[1] : BASE_URL + m[1]);
    }
  }
  return urls;
}

// ─── Video Çözümleme ──────────────────────────────────────────────────────────
// Bölüm sayfası → iframe /player/oynat/{hash} → JWPlayer sources

function extractVideoUrl(episodeUrl, cookie) {
  return get(episodeUrl, BASE_URL + "/", cookie)
    .then(function(html) {
      // iframe src çıkar
      var iframeM = html.match(/<iframe[^>]+src="(\/player\/oynat\/[^"]+)"/i)
                 || html.match(/<iframe[^>]+src="([^"]+player\/oynat\/[^"]+)"/i);
      if (!iframeM) {
        console.warn("[DDizi] iframe bulunamadı: " + episodeUrl);
        return null;
      }

      var playerUrl = iframeM[1].indexOf("http") === 0
                    ? iframeM[1]
                    : BASE_URL + iframeM[1];

      console.log("[DDizi] Player: " + playerUrl);

      return get(playerUrl, episodeUrl, cookie)
        .then(function(playerHtml) {
          var streams = [];

          // sources: [{file:"URL", label:"...", type:"..."}, ...]
          var srcRe = /\{[^}]*file\s*:\s*"([^"]+)"[^}]*label\s*:\s*"([^"]*)"[^}]*type\s*:\s*"([^"]+)"[^}]*\}/gi;
          var m;
          while ((m = srcRe.exec(playerHtml)) !== null) {
            streams.push({ url: m[1], label: m[2] || "HD", type: m[3] });
          }

          // Alternatif sıra: label önce, file sonra
          if (streams.length === 0) {
            var srcRe2 = /\{[^}]*label\s*:\s*"([^"]*)"[^}]*file\s*:\s*"([^"]+)"[^}]*type\s*:\s*"([^"]+)"[^}]*\}/gi;
            while ((m = srcRe2.exec(playerHtml)) !== null) {
              streams.push({ url: m[2], label: m[1] || "HD", type: m[3] });
            }
          }

          // Son çare: herhangi bir file: "..." ile mp4/m3u8
          if (streams.length === 0) {
            var singleM = playerHtml.match(/file\s*:\s*"([^"]+\.(?:mp4|m3u8)[^"]*)"/i);
            if (singleM) {
              streams.push({ url: singleM[1], label: "HD", type: "mp4" });
            }
          }

          // En iyi kaliteyi seç (son kayıt genellikle en yüksek)
          if (streams.length === 0) {
            console.warn("[DDizi] stream bulunamadı: " + playerUrl);
            return null;
          }

          // Kaliteye göre sırala: 1080 > 720 > 480 > 360
          var order = { "1080p": 4, "720p": 3, "480p": 2, "360p": 1 };
          streams.sort(function(a, b) {
            return (order[b.label] || 0) - (order[a.label] || 0);
          });

          var best = streams[0];
          console.log("[DDizi] stream: " + best.label + " " + best.url.substring(0, 60));
          return {
            name    : "DDizi · " + best.label,
            url     : best.url,
            quality : best.label,
            headers : { "Referer": playerUrl, "User-Agent": UA }
          };
        });
    })
    .catch(function(e) {
      console.error("[DDizi] extractVideoUrl: " + e.message);
      return null;
    });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function getStreams(tmdbId, mediaType, season, episode) {
  console.log("[DDizi] tmdbId=" + tmdbId + " type=" + mediaType + " S" + season + "E" + episode);

  // DDizi yalnızca dizi içeriyor
  if (mediaType === "movie") {
    console.log("[DDizi] Film desteklenmiyor");
    return Promise.resolve([]);
  }

  // Session cookie + TMDB bilgisi paralel al
  return Promise.all([fetchSessionCookie(), getTmdbInfo(tmdbId, mediaType)])
    .then(function(init) {
      var cookie = init[0];
      var info   = init[1];
      console.log("[DDizi] TMDB: " + info.title + " / " + info.origTitle);

      var queries = [];
      if (info.title) queries.push(info.title);
      if (info.origTitle && info.origTitle !== info.title) queries.push(info.origTitle);

      function tryNextQuery(i) {
        if (i >= queries.length) return Promise.resolve(null);
        return searchDdizi(queries[i], cookie).then(function(results) {
          var best = findBestResult(results, info.title, info.origTitle);
          if (best) return best;
          return tryNextQuery(i + 1);
        });
      }

      return tryNextQuery(0).then(function(best) {
        if (!best) {
          console.warn("[DDizi] dizi bulunamadı: " + info.title);
          return [];
        }

        console.log("[DDizi] Dizi: " + best.title + " → " + best.url);

        return fetchEpisodeUrls(best.url, episode, cookie)
          .then(function(epUrl) {
            if (!epUrl) {
              console.warn("[DDizi] S" + season + "E" + episode + " bulunamadı");
              return [];
            }

            console.log("[DDizi] Bölüm URL: " + epUrl);
            return extractVideoUrl(epUrl, cookie).then(function(stream) {
              return stream ? [stream] : [];
            });
          });
      });
    })
    .catch(function(e) {
      console.error("[DDizi] " + e.message);
      return [];
    });
}

module.exports = { getStreams: getStreams };
