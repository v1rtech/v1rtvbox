/**
 * DiziYou Provider for Nuvio
 */

// ─── Sabitler ─────────────────────────────────────────────────────────────────

var DOMAIN_LIST_URL = 'https://raw.githubusercontent.com/Kraptor123/domainListesi/refs/heads/main/eklenti_domainleri.txt';
var BASE_URL        = 'https://www.diziyou.one';
var STORAGE_URL     = 'https://storage.diziyou.one';
var TMDB_KEY        = 'c4ffcab48dfaa7b41625ac13d61aec31';
var CACHE_MS        = 60 * 60 * 1000;
var UA              = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─── Domain cache ─────────────────────────────────────────────────────────────

var _domain = null;
var _domainTs = 0;

function getBaseUrl() {
  var now = Date.now();
  if (_domain && (now - _domainTs) < CACHE_MS) return Promise.resolve(_domain);
  return fetch(DOMAIN_LIST_URL, { headers: { 'User-Agent': UA } })
    .then(function(r) { return r.ok ? r.text() : ''; })
    .then(function(text) {
      var lines = text.split('\n');
      for (var i = 0; i < lines.length; i++) {
        var l = lines[i].trim();
        if (l.toLowerCase().indexOf('diziyou=') === 0) {
          var d = l.substring(8).trim().replace(/\/$/, '');
          if (d) { _domain = d; _domainTs = Date.now(); return d; }
        }
      }
      _domain = BASE_URL; _domainTs = Date.now(); return BASE_URL;
    })
    .catch(function() { return _domain || BASE_URL; });
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────

function get(url, referer) {
  return fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
      'Referer': referer || BASE_URL + '/',
    }
  }).then(function(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status + ' → ' + url);
    return r.text();
  });
}

// ─── Slug dönüştürücü ────────────────────────────────────────────────────────

var TR_MAP = { 'ğ':'g','ü':'u','ş':'s','ı':'i','ö':'o','ç':'c','Ğ':'g','Ü':'u','Ş':'s','İ':'i','Ö':'o','Ç':'c' };
function trSlug(s) {
  return s.replace(/[ğüşıöçĞÜŞİÖÇ]/g, function(c) { return TR_MAP[c] || c; })
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// "the-boys" + 5 + 7 → "the-boys-5-sezon-7-bolum"
function epSlug(showSlug, s, e) {
  return showSlug + '-' + s + '-sezon-' + e + '-bolum';
}

// ─── TMDB ─────────────────────────────────────────────────────────────────────

function getTmdbInfo(tmdbId, mediaType) {
  var ep = mediaType === 'movie' ? 'movie' : 'tv';
  return fetch('https://api.themoviedb.org/3/' + ep + '/' + tmdbId +
    '?api_key=' + TMDB_KEY + '&language=tr-TR')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      return {
        title:    (d.name  || d.title  || '').trim(),
        origTitle:(d.original_name || d.original_title || '').trim(),
      };
    });
}

// ─── HTML parser ──────────────────────────────────────────────────────────────

// iframe#diziyouPlayer → player id
function extractPlayerId(html) {
  // Sırası: önce id= src=, sonra src= id=
  var patterns = [
    /id=["']diziyouPlayer["'][^>]+src=["'][^"']*\/player\/(\d+)\.html/i,
    /src=["'][^"']*\/player\/(\d+)\.html["'][^>]*id=["']diziyouPlayer["']/i,
    /["']https?:\/\/[^"']*\/player\/(\d+)\.html["']/i,
  ];
  for (var i = 0; i < patterns.length; i++) {
    var m = html.match(patterns[i]);
    if (m) return m[1];
  }
  return null;
}

// .otherepisodes blokları → [{season, episode, url}]
function parseEpisodes(html) {
  var list = [];
  var re = /<div[^>]+class="[^"]*otherepisodes[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
  var m;
  while ((m = re.exec(html)) !== null) {
    var block = m[1];
    var hM = block.match(/href=["']([^"']+)["']/i);
    var nM = block.match(/class="[^"]*epidosename[^"]*"[^>]*>([\s\S]*?)<\/(?:div|a)>/i);
    if (!hM || !nM) continue;
    var name = nM[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
    var sM = name.match(/(\d+)\.\s*Sezon/i);
    var eM = name.match(/(\d+)\.\s*B[oö]l[uü]m/i);
    if (sM && eM) list.push({ season: +sM[1], episode: +eM[1], url: hM[1] });
  }
  return list;
}

// ─── Benzerlik ────────────────────────────────────────────────────────────────

function sim(a, b) {
  if (!a || !b) return 0;
  a = a.toLowerCase(); b = b.toLowerCase();
  if (a === b) return 1;
  if (a.indexOf(b) !== -1 || b.indexOf(a) !== -1) return 0.8;
  var aw = a.split(/\s+/), bw = b.split(/\s+/), c = 0;
  aw.forEach(function(w) { if (bw.indexOf(w) !== -1 && w.length > 1) c++; });
  return c / Math.max(aw.length, bw.length);
}

// ─── URL çözümleme ────────────────────────────────────────────────────────────

function tryGet(url, referer) {
  return get(url, referer)
    .then(function(html) {
      var id = extractPlayerId(html);
      return id ? { playerId: id, html: html, url: url } : null;
    })
    .catch(function() { return null; });
}

function resolveEpisodeUrl(baseUrl, info, season, episode) {
  var slugEn = trSlug(info.origTitle);
  var slugTr = trSlug(info.title);
  var referer = baseUrl + '/';

  // 1. Direkt slug tahminleri (en hızlı)
  var candidates = [];
  if (slugEn) candidates.push(baseUrl + '/' + epSlug(slugEn, season, episode) + '/');
  if (slugTr && slugTr !== slugEn) candidates.push(baseUrl + '/' + epSlug(slugTr, season, episode) + '/');

  function tryList(i) {
    if (i >= candidates.length) return Promise.resolve(null);
    return tryGet(candidates[i], referer).then(function(r) {
      return r || tryList(i + 1);
    });
  }

  return tryList(0).then(function(r) {
    if (r) return r;

    // 2. Önce dizi ana sayfası dene → bölüm listesinden bul
    var showCandidates = [];
    if (slugEn) showCandidates.push(baseUrl + '/' + slugEn + '/');
    if (slugTr && slugTr !== slugEn) showCandidates.push(baseUrl + '/' + slugTr + '/');

    function tryShow(i) {
      if (i >= showCandidates.length) return Promise.resolve(null);
      return get(showCandidates[i], referer)
        .then(function(showHtml) {
          var eps = parseEpisodes(showHtml);
          for (var k = 0; k < eps.length; k++) {
            if (eps[k].season === season && eps[k].episode === episode)
              return tryGet(eps[k].url, referer);
          }
          return null;
        })
        .catch(function() { return null; })
        .then(function(r) { return r || tryShow(i + 1); });
    }

    return tryShow(0);
  }).then(function(r) {
    if (r) return r;

    // 3. Arama sayfası
    console.log('[DiziYou] Slug denemeleri başarısız, arama yapılıyor...');
    var q = info.title || info.origTitle;
    return get(baseUrl + '/?s=' + encodeURIComponent(q), referer)
      .then(function(searchHtml) {
        // arama sonuçlarındaki show linklerini topla
        var showRe = /href=["'](https?:\/\/(?:www\.)?diziyou\.[a-z]+\/([^"'\/]+)\/)["'][^>]*title=["']([^"']+)["']/gi;
        var shows = [];
        var sm;
        while ((sm = showRe.exec(searchHtml)) !== null) {
          shows.push({ url: sm[1], title: sm[3] });
        }
        // en iyi eşleşmeyi bul
        var best = null, bestScore = 0.3;
        shows.forEach(function(s) {
          var score = Math.max(sim(s.title, info.title), sim(s.title, info.origTitle));
          if (score > bestScore) { bestScore = score; best = s; }
        });
        if (!best) return null;
        console.log('[DiziYou] Arama eşleşti: ' + best.title + ' (' + bestScore.toFixed(2) + ')');

        return get(best.url, referer).then(function(showHtml) {
          var eps = parseEpisodes(showHtml);
          for (var k = 0; k < eps.length; k++) {
            if (eps[k].season === season && eps[k].episode === episode)
              return tryGet(eps[k].url, referer);
          }
          // Bölüm listesinde yoksa dizi slug'ından tahmin et
          var showSlug = best.url.replace(/\/$/, '').split('/').pop();
          return tryGet(baseUrl + '/' + epSlug(showSlug, season, episode) + '/', referer);
        });
      });
  });
}

// ─── Stream oluşturucu ────────────────────────────────────────────────────────

/**
 * Altyazı URL kuralı:
 *   Türkçe altyazılı (EN ses):  player/{id}.html    → subtitles/{id}/tr.vtt + en.vtt
 *   Türkçe dublaj       (TR ses): player/{id}_tr.html → subtitles/{id}_tr/tr.vtt
 *   İngilizce altyazılı (EN ses): player/{id}.html    → subtitles/{id}/en.vtt (default)
 *
 * Stream URL kuralı:
 *   Türkçe altyazılı + İngilizce: episodes/{id}/play.m3u8
 *   Türkçe dublaj:                 episodes/{id}_tr/play.m3u8
 */
function buildSingleStream(playerId, isDub, episodeUrl) {
  var suffix    = isDub ? '_tr' : '';
  var playerUrl = BASE_URL + '/player/' + playerId + suffix + '.html';
  var epBase    = STORAGE_URL + '/episodes/' + playerId + suffix;
  // Altyazı base: dublajda {id}_tr/, altyazılıda {id}/
  var subBase   = STORAGE_URL + '/subtitles/' + playerId + suffix;
  // Orijinal (şifresiz) altyazı base her zaman {id}/ altında
  var subOrig   = STORAGE_URL + '/subtitles/' + playerId;

  return get(playerUrl, episodeUrl)
    .then(function(ph) {
      var srcM = ph.match(/id=["']diziyouSource["'][^>]*src=["']([^"']+)["']/i)
              || ph.match(/src=["']([^"']+\.m3u8[^"']*)["'][^>]*type=["']application\/x-mpegURL["']/i);
      var m3u8 = srcM ? srcM[1] : (epBase + '/play.m3u8');

      var trM = ph.match(/<track[^>]+src=["']([^"']+)["'][^>]*srclang=["']tr["']/i)
             || ph.match(/<track[^>]+srclang=["']tr["'][^>]*src=["']([^"']+)["']/i);
      var enM = ph.match(/<track[^>]+src=["']([^"']+)["'][^>]*srclang=["']en["']/i)
             || ph.match(/<track[^>]+srclang=["']en["'][^>]*src=["']([^"']+)["']/i);

      // Dublajda: tr.vtt → {id}_tr/tr.vtt, ingilizce altyazı yok
      // Altyazılıda: tr.vtt + en.vtt → {id}/tr.vtt, {id}/en.vtt
      var trVtt = trM ? trM[1] : (subBase + '/tr.vtt');
      var enVtt = enM ? enM[1] : (subOrig + '/en.vtt');

      var subtitles = isDub
        ? [{ language: 'tr', url: trVtt, label: 'Türkçe', type: 'vtt' }]
        : [
            { language: 'tr', url: trVtt, label: 'Türkçe', type: 'vtt' },
            { language: 'en', url: enVtt, label: 'English', type: 'vtt' },
          ];

      return {
        name:      'DiziYou',
        title:     isDub ? 'DiziYou — Türkçe Dublaj' : 'DiziYou — Türkçe Altyazılı',
        url:       m3u8,
        quality:   '1080p',
        headers:   { 'Referer': BASE_URL + '/', 'Origin': BASE_URL, 'User-Agent': UA },
        subtitles: subtitles,
      };
    })
    .catch(function() {
      // Player HTML alınamazsa doğrudan URL kullan
      var subtitles = isDub
        ? [{ language: 'tr', url: subBase + '/tr.vtt', label: 'Türkçe', type: 'vtt' }]
        : [
            { language: 'tr', url: subOrig + '/tr.vtt', label: 'Türkçe', type: 'vtt' },
            { language: 'en', url: subOrig + '/en.vtt', label: 'English', type: 'vtt' },
          ];
      return {
        name:      'DiziYou',
        title:     isDub ? 'DiziYou — Türkçe Dublaj' : 'DiziYou — Türkçe Altyazılı',
        url:       epBase + '/play.m3u8',
        quality:   '1080p',
        headers:   { 'Referer': BASE_URL + '/', 'Origin': BASE_URL, 'User-Agent': UA },
        subtitles: subtitles,
      };
    });
}

function buildStreams(playerId, episodeUrl) {
  console.log('[DiziYou] ✅ player_id=' + playerId);
  // Her iki versiyonu paralel çek
  return Promise.all([
    buildSingleStream(playerId, false, episodeUrl), // Türkçe Altyazılı (EN ses)
    buildSingleStream(playerId, true,  episodeUrl), // Türkçe Dublaj    (TR ses)
  ]).then(function(results) {
    return results.filter(Boolean);
  });
}

// ─── Ana fonksiyon ────────────────────────────────────────────────────────────

function getStreams(tmdbId, mediaType, season, episode) {
  console.log('[DiziYou] getStreams → tmdbId=' + tmdbId + ' type=' + mediaType +
    (season ? ' S' + season + 'E' + episode : ''));

  return getBaseUrl()
    .then(function(baseUrl) {
      return getTmdbInfo(tmdbId, mediaType)
        .then(function(info) {
          console.log('[DiziYou] TMDB: "' + info.title + '" / "' + info.origTitle + '"');
          if (mediaType === 'movie') {
            var slugEn = trSlug(info.origTitle);
            var slugTr = trSlug(info.title);
            var candidates = [baseUrl + '/' + slugEn + '/', baseUrl + '/' + slugTr + '/'];
            function tryMovie(i) {
              if (i >= candidates.length) return Promise.resolve(null);
              return tryGet(candidates[i], baseUrl + '/').then(function(r) {
                return r || tryMovie(i + 1);
              });
            }
            return tryMovie(0);
          }
          return resolveEpisodeUrl(baseUrl, info, season, episode);
        });
    })
    .then(function(result) {
      if (!result) {
        console.warn('[DiziYou] Bölüm bulunamadı.');
        return [];
      }
      return buildStreams(result.playerId, result.url);
    })
    .catch(function(err) {
      console.error('[DiziYou] Hata: ' + err.message);
      return [];
    });
}

module.exports = { getStreams: getStreams };
