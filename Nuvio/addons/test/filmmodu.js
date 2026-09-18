// ============================================================
//  FilmModu — Nuvio Provider
//  Sadece Film (movie) destekler
//  Hermes uyumlu: cheerio yok, sadece regex + fetch
// ============================================================

var BASE_URL = 'https://www.filmmodu.one';
var TMDB_API_KEY = '500330721680edb6d5f7f12ba7cd9023';

var HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
  'Referer': BASE_URL + '/'
};

// ── Yardımcı: HTML entity decode ────────────────────────────
function decodeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// ── Kalite filtresi: 1080p ve üzeri ─────────────────────────
function isHighQuality(label) {
  if (!label) return false;
  var l = String(label).toLowerCase().replace(/\s/g, '');
  if (l.indexOf('4k') !== -1 || l.indexOf('2160') !== -1) return true;
  if (l.indexOf('1440') !== -1) return true;
  if (l.indexOf('1080') !== -1) return true;
  var num = parseInt(l);
  if (!isNaN(num) && num >= 1080) return true;
  return false;
}

// ── HTML'den div.movie listesini regex ile parse et ──────────
function parseMovieList(html) {
  var results = [];
  // div.movie bloklarını bul
  var blockRegex = /<div[^>]+class="[^"]*movie[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
  var match;

  while ((match = blockRegex.exec(html)) !== null) {
    var block = match[0];

    // href
    var hrefMatch = block.match(/href="([^"]+)"/);
    var href = hrefMatch ? hrefMatch[1] : null;
    if (!href) continue;

    // link text (film adı)
    var textMatch = block.match(/<a[^>]*>([^<]+)<\/a>/);
    var text = textMatch ? decodeHtml(textMatch[1]) : null;

    // poster (data-src veya src)
    var posterMatch = block.match(/data-src="([^"]+)"/);
    if (!posterMatch) posterMatch = block.match(/<img[^>]+src="([^"]+)"/);
    var poster = posterMatch ? posterMatch[1] : null;

    if (href && text) {
      results.push({
        href: href.startsWith('http') ? href : BASE_URL + href,
        text: text,
        poster: poster ? (poster.startsWith('http') ? poster : BASE_URL + poster) : null
      });
    }
  }

  return results;
}

// ── HTML'den div.alternates linklerini parse et ──────────────
function parseAlternateLinks(html) {
  var links = [];
  var altBlockMatch = html.match(/<div[^>]+class="[^"]*alternates[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  if (!altBlockMatch) return links;

  var altBlock = altBlockMatch[1];
  var linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  var match;

  while ((match = linkRegex.exec(altBlock)) !== null) {
    var href = match[1].trim();
    var name = match[2].trim();
    if (name && name !== 'Fragman' && href) {
      links.push({
        href: href.startsWith('http') ? href : BASE_URL + href,
        name: name
      });
    }
  }

  return links;
}

// ── TMDB'den film bilgisi çek ────────────────────────────────
function fetchTmdbInfo(tmdbId) {
  var url = 'https://api.themoviedb.org/3/movie/' + tmdbId
    + '?api_key=' + TMDB_API_KEY
    + '&language=tr-TR';

  return fetch(url)
    .then(function(r) {
      if (!r.ok) throw new Error('TMDB hata: ' + r.status);
      return r.json();
    })
    .then(function(data) {
      return {
        titleTr: data.title || '',
        titleEn: data.original_title || '',
        year:    data.release_date ? data.release_date.slice(0, 4) : ''
      };
    });
}

// ── Normalize ────────────────────────────────────────────────
function normalizeStr(s) {
  return (s || '').toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]/g,' ').replace(/\s+/g,' ').trim();
}

// ── En iyi eşleşmeyi skor bazlı bul ─────────────────────────
function findBestMatch(results, titleEn, titleTr, year) {
  var nEn = normalizeStr(titleEn);
  var nTr = normalizeStr(titleTr);

  var scored = results.map(function(r) {
    var score = 0;
    var nHref = normalizeStr(r.href);
    var nText = normalizeStr(r.text);

    if (nEn && nHref.indexOf(nEn.replace(/ /g, '-')) !== -1) score += 100;
    else if (nTr && nHref.indexOf(nTr.replace(/ /g, '-')) !== -1) score += 100;
    else if (nEn) {
      var words = nEn.split(' ').filter(function(w) { return w.length > 2; });
      if (words.length > 0) {
        var matched = words.filter(function(w) { return nHref.indexOf(w) !== -1; }).length;
        score += Math.floor(matched / words.length * 60);
      }
    }

    if (nEn && nText === nEn) score += 50;
    else if (nTr && nText === nTr) score += 50;

    if (year && r.href.indexOf(year) !== -1) score += 80;
    else if (year) score -= 50;

    return { r: r, score: score };
  });

  scored.sort(function(a, b) { return b.score - a.score; });

  if (scored.length && scored[0].score >= 50) return scored[0].r.href;
  return null;
}

// ── FilmModu'nda arama ───────────────────────────────────────
function searchFilmModu(info) {
  var title = info.titleEn || info.titleTr;
  var searchUrl = BASE_URL + '/film-ara?term=' + encodeURIComponent(title);

  return fetch(searchUrl, { headers: HEADERS, redirect: 'follow' })
    .then(function(r) {
      if (!r.ok) throw new Error('Arama hatası: ' + r.status);
      // Redirect kontrolü: direkt film sayfasına yönlendirdi mi?
      var finalUrl = r.url || searchUrl;
      if (finalUrl !== searchUrl && finalUrl.indexOf('/film-ara') === -1) {
        return finalUrl;
      }
      return r.text().then(function(html) {
        // Zaten film sayfasındaysa canonical al
        var canonicalMatch = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/);
        if (canonicalMatch && html.indexOf('class="alternates"') !== -1) {
          return canonicalMatch[1];
        }

        var results = parseMovieList(html);
        if (results.length === 0) return null;
        return findBestMatch(results, info.titleEn, info.titleTr, info.year);
      });
    });
}

// ── Alternate linklerden stream çek ─────────────────────────
function fetchStreamsFromAlt(altLink, filmUrl, movieTitle) {
  var altHeaders = Object.assign({}, HEADERS, { 'Referer': filmUrl });

  return fetch(altLink.href, { headers: altHeaders })
    .then(function(r) {
      if (!r.ok) return [];
      return r.text();
    })
    .then(function(altHtml) {
      var videoIdMatch   = altHtml.match(/var videoId\s*=\s*'([^']+)'/);
      var videoTypeMatch = altHtml.match(/var videoType\s*=\s*'([^']+)'/);

      if (!videoIdMatch || !videoTypeMatch) return [];

      var videoId   = videoIdMatch[1];
      var videoType = videoTypeMatch[1];
      var sourceUrl = BASE_URL + '/get-source?movie_id=' + videoId + '&type=' + videoType;

      var sourceHeaders = Object.assign({}, HEADERS, {
        'Referer':          altLink.href,
        'X-Requested-With': 'XMLHttpRequest',
        'Accept':           'application/json, text/javascript, */*'
      });

      return fetch(sourceUrl, { headers: sourceHeaders })
        .then(function(r) {
          if (!r.ok) return [];
          return r.json();
        })
        .then(function(data) {
          if (!data || !data.sources || data.sources.length === 0) return [];

          var subtitleUrl = null;
          if (data.subtitle) {
            subtitleUrl = data.subtitle.startsWith('http')
              ? data.subtitle
              : BASE_URL + data.subtitle;
          }

          var streams = [];
          data.sources.forEach(function(source) {
            if (!source.src) return;

            var qualityLabel = source.label || (source.res ? (source.res + 'p') : 'HD');
            if (!isHighQuality(qualityLabel)) return;

            var srcUrl = source.src;
            // .m3u8 değilse ekle
            if (srcUrl.indexOf('.m3u8') === -1 && srcUrl.indexOf('.mp4') === -1) {
              srcUrl = srcUrl + '.m3u8';
            }

            var streamObj = {
              name:    'FilmModu',
              title:   '⌜ FILMMODU ⌟ | ' + altLink.name + ' | ' + qualityLabel,
              url:     srcUrl,
              quality: qualityLabel,
              headers: {
                'Referer':    BASE_URL + '/',
                'User-Agent': HEADERS['User-Agent']
              }
            };

            if (subtitleUrl) {
              streamObj.subtitles = [{
                id:   'sub_tr_0',
                url:  subtitleUrl,
                lang: 'tur'
              }];
            }

            streams.push(streamObj);
          });

          return streams;
        })
        .catch(function() { return []; });
    })
    .catch(function() { return []; });
}

// ── Film sayfasından alternate linkleri al ───────────────────
function fetchAlternateLinks(filmUrl) {
  return fetch(filmUrl, { headers: HEADERS })
    .then(function(r) {
      if (!r.ok) throw new Error('Film sayfası yüklenemedi: ' + r.status);
      return r.text();
    })
    .then(function(html) {
      return parseAlternateLinks(html);
    });
}

// ── Ana fonksiyon ────────────────────────────────────────────
function getStreams(tmdbId, mediaType, seasonNum, episodeNum) {
  if (mediaType !== 'movie') return Promise.resolve([]);

  return fetchTmdbInfo(tmdbId)
    .then(function(info) {
      if (!info.titleEn && !info.titleTr) return [];

      var movieTitle = info.titleTr || info.titleEn;

      // Önce İngilizce başlıkla ara
      return searchFilmModu(info)
        .then(function(filmUrl) {
          // Bulamazsa Türkçe başlıkla tekrar dene
          if (!filmUrl && info.titleTr && info.titleTr !== info.titleEn) {
            return searchFilmModu({
              titleEn: info.titleTr,
              titleTr: info.titleEn,
              year:    info.year
            });
          }
          return filmUrl;
        })
        .then(function(filmUrl) {
          if (!filmUrl) return [];

          return fetchAlternateLinks(filmUrl)
            .then(function(altLinks) {
              if (altLinks.length === 0) return [];

              var promises = altLinks.map(function(alt) {
                return fetchStreamsFromAlt(alt, filmUrl, movieTitle);
              });

              return Promise.all(promises).then(function(results) {
                var allStreams = [];
                results.forEach(function(arr) {
                  if (arr && arr.length > 0) {
                    arr.forEach(function(s) { allStreams.push(s); });
                  }
                });
                return allStreams;
              });
            });
        });
    })
    .catch(function(err) {
      console.error('[FilmModu] Hata:', err.message || err);
      return [];
    });
}

// ── Export ───────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getStreams: getStreams };
} else {
  global.getStreams = getStreams;
}
