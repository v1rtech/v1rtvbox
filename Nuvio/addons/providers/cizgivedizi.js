/**
 * CizgiVeDizi — Nuvio Provider  (v24)
 * cizgivedizi.com üzerinden çizgi film, dizi ve film stream sağlar.
 */

var BASE_URL    = 'https://www.cizgivedizi.com';
var TMDB_KEY    = '500330721680edb6d5f7f12ba7cd9023';
var SIBNET_HOST = 'https://video.sibnet.ru';
var LOG_TAG     = '[CizgiVeDizi]';

// Arama için sabit anchor (/_/ path 404 veriyor)
var SEARCH_DIZI = BASE_URL + '/dizi/gmb/gumball';
var SEARCH_FILM = BASE_URL + '/film/_/_';

var HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
  'Referer':         BASE_URL + '/'
};

var STOP = ['the','a','an','of','in','on','at','to','and','or','for',
            've','bir','ile','bu','mi','mu','mı','mü','da','de'];

// ── Log ──────────────────────────────────────────────────────

function log(msg) {
  console.log(LOG_TAG + ' ' + msg);
}

// ── Normalize ────────────────────────────────────────────────

function norm(s) {
  return (s || '').toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/İ/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/â/g,'a').replace(/î/g,'i').replace(/û/g,'u')
    .replace(/[^a-z0-9]/g,'');
}

// v24: Site güncellendi — bölüm sayfaları shell döndürüyor.
//      getHtmlFull → ?ajax=page ile gerçek içerik çekiyor.
//      fetchEpUrl  → ajax=episodes JSONundan bölüm URLi alıyor (daha hızlı, güvenilir).
//      fetchYearFromPage → ?ajax=page eklendi.
// ── Fetch ────────────────────────────────────────────────────

function getHtml(url, extra) {
  return fetch(url, { headers: Object.assign({}, HEADERS, extra || {}) })
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' → ' + url);
      return r.text();
    });
}

// Büyük sayfalar için streaming fetch.
// body.getReader() destekleniyorsa (Node/modern browser) chunkları okur,
// __embeds_b64 satırı görülür görülmez bağlantıyı keser — 256KB limiti aşılmaz.
// QuickJS (Nuvio runtime) getReader() desteklemez, text() kullanır.
// Ancak Nuvioda küçük sayfalarda (Baykuş Evi) zaten çalışıyor;
// büyük sayfalarda (Regular Show) stream olmadan çalışması mümkün değil —
// o durumda bu fonksiyon en azından ne bulursa döndürür.
function getHtmlFull(url, extra) {
  var baseHeaders = Object.assign({}, HEADERS, extra || {});
  var NEEDLE = '__embeds_b64';

  // Site artık shell döndürüyor — gerçek içerik ?ajax=page ile geliyor
  var pageUrl = url.indexOf('?') === -1 ? url + '?ajax=page' : url + '&ajax=page';

  return fetch(pageUrl, { headers: baseHeaders }).then(function(r) {
    if (!r.ok) return '';

    // getReader() mevcut mu? (Node.js 18+ ve modern browserda var)
    if (r.body && typeof r.body.getReader === 'function') {
      return new Promise(function(resolve) {
        var reader = r.body.getReader();
        var decoder = new TextDecoder('utf-8');
        var accumulated = '';

        function pump() {
          reader.read().then(function(ref) {
            var done  = ref.done;
            var value = ref.value;

            if (value) {
              accumulated += decoder.decode(value, { stream: !done });
            }

            // Needle bulundu mu?
            if (accumulated.indexOf(NEEDLE) !== -1) {
              // __embeds_b64ün bulunduğu satırın sonuna kadar oku
              var nlIdx = accumulated.indexOf(String.fromCharCode(10), accumulated.indexOf(NEEDLE));
              if (nlIdx !== -1 || done) {
                reader.cancel().catch(function(){});
                log('Stream erken kesildi — embed satırı bulundu (' +
                    Math.round(accumulated.length / 1024) + 'KB okundu)');
                resolve(accumulated);
                return;
              }
            }

            if (done) {
              resolve(accumulated);
              return;
            }

            // 2MB güvenlik sınırı
            if (accumulated.length > 2 * 1024 * 1024) {
              reader.cancel().catch(function(){});
              log('Stream 2MB sınırına ulaştı, kesiliyor');
              resolve(accumulated);
              return;
            }

            pump();
          }).catch(function() { resolve(accumulated); });
        }

        pump();
      });
    }

    // Fallback: getReader yok (QuickJS) — normal text()
    return r.text();
  }).catch(function() { return ''; });
}

// ── Base64 decode (QuickJS + Hermes uyumlu) ─────────────────

function b64decode(b64) {
  // 1) Buffer: React Native / Node ortamı
  if (typeof Buffer !== 'undefined') {
    try { return JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); } catch(e) {}
  }

  // 2) Pure-JS base64 → UTF-8 byte dizisi → string
  //    atob() sadece Latin-1 byteları döndürür; UTF-8 çok-baytlı
  //    karakterleri doğru okumak için byteları manuel decode ediyoruz.
  try {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var s = b64.replace(/[\r\n ]/g, '');
    // padding olmadan uzunluk 4ün katı olmayabilir, normalize et
    while (s.length % 4) s += '=';

    // base64 → byte array
    var bytes = [];
    for (var i = 0; i < s.length; i += 4) {
      var e1 = chars.indexOf(s[i]),
          e2 = chars.indexOf(s[i+1]),
          e3 = s[i+2] === '=' ? 0 : chars.indexOf(s[i+2]),
          e4 = s[i+3] === '=' ? 0 : chars.indexOf(s[i+3]);
      bytes.push((e1 << 2) | (e2 >> 4));
      if (s[i+2] !== '=') bytes.push(((e2 & 15) << 4) | (e3 >> 2));
      if (s[i+3] !== '=') bytes.push(((e3 &  3) << 6) | e4);
    }

    // UTF-8 byte dizisi → JS string
    var out = '', j = 0;
    while (j < bytes.length) {
      var b = bytes[j++];
      if (b < 0x80) {
        out += String.fromCharCode(b);
      } else if ((b & 0xE0) === 0xC0) {
        out += String.fromCharCode(((b & 0x1F) << 6) | (bytes[j++] & 0x3F));
      } else if ((b & 0xF0) === 0xE0) {
        var b2 = bytes[j++], b3 = bytes[j++];
        out += String.fromCharCode(((b & 0x0F) << 12) | ((b2 & 0x3F) << 6) | (b3 & 0x3F));
      } else {
        // 4-byte (emoji vb.) — surrogate pair
        var b2 = bytes[j++], b3 = bytes[j++], b4 = bytes[j++];
        var cp = (((b & 0x07) << 18) | ((b2 & 0x3F) << 12) | ((b3 & 0x3F) << 6) | (b4 & 0x3F)) - 0x10000;
        out += String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF));
      }
    }
    return JSON.parse(out);
  } catch(e) {}

  // 3) Son çare: atob + escape trick (ASCII-only base64 için çalışır)
  if (typeof atob !== 'undefined') {
    try { return JSON.parse(decodeURIComponent(escape(atob(b64)))); } catch(e) {}
    try { return JSON.parse(atob(b64)); } catch(e) {}
  }

  return null;
}

// ── Slug encode ──────────────────────────────────────────────

function encPath(s) {
  var out = '';
  for (var i = 0; i < (s || '').length; i++) {
    var code = s.charCodeAt(i);
    if (code > 127) out += encodeURIComponent(s[i]);
    else out += s[i];
  }
  return out;
}

// ── 1. TMDB ──────────────────────────────────────────────────

function fetchTmdbInfo(tmdbId, mediaType) {
  var ep  = mediaType === 'tv' ? 'tv' : 'movie';
  var url = 'https://api.themoviedb.org/3/' + ep + '/' + tmdbId
          + '?api_key=' + TMDB_KEY + '&language=tr-TR';
  return fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var info = {
        title:   d.title   || d.name                 || '',
        titleTr: d.title   || d.name                 || '',
        titleEn: d.original_title || d.original_name || '',
        year:    (d.release_date || d.first_air_date  || '').slice(0, 4)
      };
      log('TMDB: "' + info.titleEn + '" / "' + info.titleTr + '" (' + info.year + ')');
      return info;
    });
}

// ── 2. Arama ─────────────────────────────────────────────────

/**
 * Sorgu listesi — en spesifik'ten en genel'e:
 * TR tam → EN tam → EN son kelime → EN ilk → TR son → TR ilk → 2-kelime combolar
 */
function buildQueries(titleTr, titleEn) {
  var seen = {}, out = [];
  function add(q) {
    q = (q || '').trim();
    if (q && !seen[q]) { seen[q] = true; out.push(q); }
  }
  var enW = (titleEn||'').split(/[\s\-:,]+/).filter(function(w) {
    return STOP.indexOf(w.toLowerCase()) === -1 && w.length > 2;
  });
  var trW = (titleTr||'').split(/[\s\-:,]+/).filter(function(w) {
    return STOP.indexOf(w.toLowerCase()) === -1 && w.length > 2;
  });

  add(titleTr);
  add(titleEn);
  if (enW.length > 0) add(enW[enW.length - 1]);       // EN son kelime: "Gumball"
  if (enW.length > 1) add(enW[0]);                     // EN ilk kelime
  if (enW.length > 2) add(enW[0] + ' ' + enW[1]);
  if (trW.length > 0) add(trW[trW.length - 1]);        // TR son kelime
  if (trW.length > 1) add(trW[0]);
  for (var i = 0; i < trW.length - 1; i++) add(trW[i] + ' ' + trW[i+1]); // "Muhteşem Tuhaf"
  for (var j = 1; j < enW.length - 1; j++) add(enW[j] + ' ' + enW[j+1]);
  return out;
}

function searchSite(query, mediaType) {
  var anchor = mediaType === 'movie' ? SEARCH_FILM : SEARCH_DIZI;
  var url    = anchor + '?ajax=search&q=' + encodeURIComponent(query);
  return fetch(url, {
    headers: Object.assign({}, HEADERS, {
      'Accept':           'application/json, */*',
      'X-Requested-With': 'XMLHttpRequest'
    })
  })
    .then(function(r) { return r.ok ? r.json() : []; })
    .catch(function() { return []; });
}

/**
 * Skorlama:
 * - name içinde yıl varsa (ducktales (2017)): TMDB yılı ile karşılaştır → net seçim
 * - Yıl yoksa: isim benzerliği (tam, kapsama, kısmi)
 */
function scoreItem(item, titleEn, titleTr, year) {
  var raw = item.name || '';
  var n   = norm(raw);
  var ne  = norm(titleEn);
  var nt  = norm(titleTr);

  var nyM = raw.match(/\b(19[89]\d|20[0-3]\d)\b/);
  var ny  = nyM ? nyM[1] : null;

  var nc  = n.replace(/\d{4}/g,'').replace(/[^a-z0-9]/g,'');
  var nec = ne.replace(/\d{4}/g,'').replace(/[^a-z0-9]/g,'');
  var ntc = nt.replace(/\d{4}/g,'').replace(/[^a-z0-9]/g,'');

  var s = 0;
  if (nc === nec || nc === ntc)                         s = 80;
  else if (nec.length > 2 && nec.indexOf(nc) !== -1)   s = 80; // EN ⊃ name
  else if (ntc.length > 2 && ntc.indexOf(nc) !== -1)   s = 75; // TR ⊃ name
  else if (nc.length > 4  && nc.indexOf(nec) !== -1)   s = 70;
  else if (nc.length > 4  && nc.indexOf(ntc) !== -1)   s = 70;

  if (s === 0) return 0;
  if (ny && year) return ny === year ? s + 20 : 5; // yıl varsa kesin ayırt
  return s;
}

/**
 * Eşit skorlu (tie) adaylarda dizi sayfasından yıl çek.
 * badge-date-text span içindeki ilk yılı al.
 */
function fetchYearFromPage(item, mediaType) {
  var type = mediaType === 'movie' ? 'film' : 'dizi';
  var url  = BASE_URL + '/' + type + '/' + encPath(item.id) + '/' + encPath(item.slug) + '?ajax=page';
  // İlk 60KBda badge-date-text bulunabilir
  return getHtml(url, { 'Range': 'bytes=0-61440' })
    .then(function(html) {
      var m = html.match(/badge-date-text[^>]*>[^<]*((?:19[89]|20[0-3])\d)/i);
      return m ? m[1] : null;
    })
    .catch(function() { return null; });
}

function findContent(info, mediaType) {
  var queries = buildQueries(info.titleTr, info.titleEn);
  log('Sorgular: ' + JSON.stringify(queries.slice(0, 5)) + (queries.length > 5 ? '...' : ''));

  return queries.reduce(function(chain, query) {
    return chain.then(function(found) {
      if (found) return found;
      return searchSite(query, mediaType).then(function(results) {
        if (!results.length) {
          log('Sorgu "' + query + '" → 0 sonuç');
          return null;
        }
        log('Sorgu "' + query + '" → ' + results.length + ' sonuç: [' +
            results.map(function(r) { return r.id; }).join(', ') + ']');

        var candidates = results
          .map(function(item) {
            return { item: item, score: scoreItem(item, info.titleEn, info.titleTr, info.year) };
          })
          .filter(function(c) { return c.score >= 70; })
          .sort(function(a, b) { return b.score - a.score; });

        if (!candidates.length) {
          log('Hiç aday kalmadı (min score 70)');
          return null;
        }

        log('Adaylar: ' + candidates.map(function(c) {
          return c.item.id + '(' + c.score + ')';
        }).join(', '));

        // Net fark varsa direkt al
        if (candidates.length === 1 || candidates[0].score - candidates[1].score >= 10) {
          log('Seçildi: ' + candidates[0].item.id + ' score=' + candidates[0].score);
          return candidates[0].item;
        }

        // Tie: yıl ile ayırt et
        log('Tie durumu — yıl fetch ediliyor');
        return Promise.all(
          candidates.slice(0, 3).map(function(c) {
            return fetchYearFromPage(c.item, mediaType).then(function(yr) {
              log('  ' + c.item.id + ' yıl=' + (yr || '?'));
              return { item: c.item, year: yr, score: c.score };
            });
          })
        ).then(function(withYears) {
          var exact = withYears.find(function(c) { return c.year === info.year; });
          if (exact) {
            log('Yıl eşleşti: ' + exact.item.id);
            return exact.item;
          }
          log('Yıl eşleşmedi, ilk aday: ' + withYears[0].item.id);
          return withYears[0].item;
        });
      });
    });
  }, Promise.resolve(null));
}

// ── 3. Global bölüm numarası ──────────────────────────────────

function fetchGlobalEpNo(tmdbId, seasonNum, episodeNum) {
  if (seasonNum <= 1) return Promise.resolve(episodeNum);

  var promises = [];
  for (var s = 1; s < seasonNum; s++) {
    (function(sn) {
      promises.push(
        fetch('https://api.themoviedb.org/3/tv/' + tmdbId + '/season/' + sn +
              '?api_key=' + TMDB_KEY)
          .then(function(r) { return r.json(); })
          .then(function(d) { return (d.episodes && d.episodes.length) || 0; })
          .catch(function() { return 0; })
      );
    })(s);
  }

  return Promise.all(promises).then(function(counts) {
    var total = counts.reduce(function(a, b) { return a + b; }, 0);
    log('Global ep: S' + seasonNum + 'E' + episodeNum +
        ' → önceki sezonlar=' + total + ' → global #' + (total + episodeNum));
    return total + episodeNum;
  });
}

// ── 4. HTML → embed URLleri ─────────────────────────────────

function parseEmbeds(html) {
  // A: window.__embeds_b64 = 'BASE64'
  var b64m = html.match(/window\.__embeds_b64\s*=\s*'([^']+)'/)
          || html.match(/window\.__embeds_b64\s*=\s*"([^"]+)"/);
  if (b64m) {
    var arr = b64decode(b64m[1]);
    if (Array.isArray(arr) && arr.length) {
      log('__embeds_b64: ' + arr.length + ' embed');
      return arr.filter(Boolean);
    }
  }

  // B: window.__embeds = [...]
  var dm = html.match(/window\.__embeds\s*=\s*(\[[^\]]{10,}\])/);
  if (dm) {
    try {
      var arr2 = JSON.parse(dm[1]);
      if (Array.isArray(arr2) && arr2.length) {
        log('__embeds: ' + arr2.length + ' embed');
        return arr2.filter(Boolean);
      }
    } catch(e) {}
  }

  // C: Script içinden embed URLleri
  var urls = [], seen = {};
  var scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  var sm;
  while ((sm = scriptRe.exec(html)) !== null) {
    var urlRe = /["']((?:https?:)?\/\/(?:video\.sibnet\.ru\/shell\.php[^"'\s<>]+|my\.mail\.ru\/video\/embed\/[^"'\s<>]+|www\.mp4upload\.com\/embed-[^"'\s<>]+|vidmoly\.to\/e\/[^"'\s<>]+|ok\.ru\/videoembed\/[^"'\s<>]+|vk\.com\/video_ext[^"'\s<>]+))/gi;
    var um;
    while ((um = urlRe.exec(sm[1])) !== null) {
      var u = um[1];
      if (!seen[u]) { seen[u] = true; urls.push(u); }
    }
  }
  if (urls.length) log('Script parse: ' + urls.length + ' embed');
  return urls;
}

function parseSourceNames(html) {
  var names = [], re = /data-kaynak="(\d+)"[^>]*>\s*([^<]+?)\s*<\/a>/gi, m;
  while ((m = re.exec(html)) !== null) names[parseInt(m[1])] = m[2].trim();
  return names;
}

// ── 5. Embed → Stream ─────────────────────────────────────────

function toAbs(url) {
  if (!url) return null;
  if (url.indexOf('http') === 0) return url;
  if (url.indexOf('//') === 0) return 'https:' + url;
  return null;
}

function isVideoUrl(url) {
  var p = (url || '').toLowerCase().split('?')[0];
  var bad = ['.css','.js','.woff','.woff2','.ttf','.eot','.png','.jpg','.gif','.svg','.ico','.map','.json'];
  for (var i = 0; i < bad.length; i++) if (p.slice(-bad[i].length) === bad[i]) return false;
  return p.indexOf('.m3u8') !== -1 || p.indexOf('.mp4') !== -1;
}

function extractSibnet(url) {
  var full = toAbs(url);
  return getHtml(full, { 'Referer': 'https://video.sibnet.ru/', 'Range': 'bytes=0-98303' })
    .then(function(html) {
      var m = html.match(/player\.src\s*\(\s*\[\s*\{[^}]*src\s*:\s*["']([^"']+\.mp4)["']/i)
           || html.match(/["']((?:https?:\/\/video\.sibnet\.ru)?\/v\/[^"']+\.mp4)["']/i);
      if (!m) return null;
      var mp4 = m[1].indexOf('http') === 0 ? m[1] : SIBNET_HOST + m[1];
      return { url: mp4, type: 'direct', headers: { 'Referer': full } };
    }).catch(function() { return null; });
}

function extractVidmoly(url) {
  var full = toAbs(url);
  return getHtml(full, { 'Referer': BASE_URL + '/', 'Range': 'bytes=0-98303' })
    .then(function(html) {
      var m = html.match(/(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
      return m ? { url: m[1], type: 'hls', headers: { 'Referer': full } } : null;
    }).catch(function() { return null; });
}

function extractMp4upload(url) {
  var full = toAbs(url);
  return getHtml(full, { 'Referer': BASE_URL + '/', 'Range': 'bytes=0-98303' })
    .then(function(html) {
      var m = html.match(/sources\s*:\s*\[\s*\{[^}]*file\s*:\s*["'](https?:\/\/[^"']+)["']/i)
           || html.match(/[,\{]\s*file\s*:\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8)[^"']*)/i);
      if (m && isVideoUrl(m[1]))
        return { url: m[1], type: m[1].indexOf('.m3u8') !== -1 ? 'hls' : 'direct', headers: { 'Referer': full } };
      var all = html.match(/https?:\/\/[^\s"'<>\\]+/g) || [];
      for (var i = 0; i < all.length; i++) {
        if (isVideoUrl(all[i]) && all[i].indexOf('mp4upload') !== -1)
          return { url: all[i], type: all[i].indexOf('.m3u8') !== -1 ? 'hls' : 'direct', headers: { 'Referer': full } };
      }
      return null;
    }).catch(function() { return null; });
}

function extractMailRu(url) {
  var full = toAbs(url);
  return getHtml(full, { 'Referer': BASE_URL + '/', 'Range': 'bytes=0-98303' })
    .then(function(html) {
      var m = html.match(/(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
      return m ? { url: m[1], type: 'hls', headers: { 'Referer': full } } : null;
    }).catch(function() { return null; });
}

function extractStream(url) {
  var full = toAbs(url);
  if (!full) return Promise.resolve(null);
  var lo   = full.toLowerCase();
  if (lo.indexOf('sibnet')    !== -1) return extractSibnet(url);
  if (lo.indexOf('vidmoly')   !== -1) return extractVidmoly(url);
  if (lo.indexOf('mp4upload') !== -1) { log('mp4upload atlandı'); return Promise.resolve(null); }
  if (lo.indexOf('mail.ru')   !== -1) return extractMailRu(url);
  log('Desteklenmeyen embed: ' + full.slice(0, 60));
  return Promise.resolve(null);
}

// ── Ana Akış ─────────────────────────────────────────────────

function buildEpUrl(item, mediaType, epGlobalNo) {
  if (mediaType === 'movie')
    return BASE_URL + '/film/' + encPath(item.id) + '/' + encPath(item.slug);
  // Temel URL — epSlug olmadan, site 301 ile doğru sluga yönlendirir
  return BASE_URL + '/dizi/' + encPath(item.id) + '/' + encPath(item.slug)
       + '/' + epGlobalNo;
}

// ajax=episodes JSONundan globalNoya karşılık gelen bölüm URLini bul
function fetchEpUrl(item, epGlobalNo) {
  var diziUrl = BASE_URL + '/dizi/' + encPath(item.id) + '/' + encPath(item.slug);
  var jsonUrl = diziUrl + '?ajax=episodes&diziid=' + encPath(item.id);

  return fetch(jsonUrl, { headers: HEADERS })
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(j) {
      if (j && j.all) {
        var ep = j.all[epGlobalNo - 1];
        if (ep && ep.link) {
          var found = BASE_URL + ep.link;
          log('epUrl: ' + found);
          return found;
        }
        // display_id ile eşleştir (sıra garantili değilse)
        for (var i = 0; i < j.all.length; i++) {
          if (j.all[i].display_id === epGlobalNo) {
            var found2 = BASE_URL + j.all[i].link;
            log('epUrl JSON display_id ile: ' + found2);
            return found2;
          }
        }
      }
      log('epUrl JSON dan bulunamadi, fallback');
      return diziUrl + '/' + epGlobalNo + '/-';
    })
    .catch(function() {
      return diziUrl + '/' + epGlobalNo + '/-';
    });
}

function getStreams(tmdbId, mediaType, season, episode) {
  log('START tmdbId=' + tmdbId + ' type=' + mediaType +
      (mediaType === 'tv' ? ' S' + season + 'E' + episode : ''));

  var infoP = fetchTmdbInfo(tmdbId, mediaType);
  var epNoP = mediaType === 'tv'
    ? fetchGlobalEpNo(tmdbId, season, episode)
    : Promise.resolve(null);

  return Promise.all([infoP, epNoP])
    .then(function(res) {
      var info     = res[0];
      var epGlobal = res[1];

      return findContent(info, mediaType).then(function(item) {
        if (!item) {
          log('İçerik bulunamadı');
          return [];
        }
        log('Eşleşti: "' + item.name + '" id=' + item.id + ' slug=' + item.slug);

        var epUrlPromise = mediaType === 'tv'
          ? fetchEpUrl(item, epGlobal)
          : Promise.resolve(buildEpUrl(item, mediaType, epGlobal));

        return epUrlPromise.then(function(epUrl) {
        log('Bölüm URL: ' + epUrl);
        return getHtmlFull(epUrl);
        }).then(function(html) {
          var embeds   = parseEmbeds(html);
          var srcNames = parseSourceNames(html);

          if (!embeds.length) {
            log('Embed bulunamadı');
            return [];
          }
          var topEmbeds = embeds.slice(0, 3);
          log(embeds.length + ' embed, ilk ' + topEmbeds.length + ' alınıyor: ' + topEmbeds.join(', '));

          return Promise.all(
            topEmbeds.map(function(embedUrl, idx) {
              return extractStream(embedUrl).then(function(stream) {
                if (!stream) return null;
                var srcName = srcNames[idx] || ('Kaynak ' + idx);
                return {
                  name:    info.title,
                  title:   '⌜ ÇİZGİVEDİZİ ⌟ | ' + srcName + ' | Auto',
                  url:     stream.url,
                  quality: 'Auto',
                  type:    stream.type,
                  headers: stream.headers || {}
                };
              });
            })
          ).then(function(all) {
            var filtered = all.filter(Boolean);
            log('Stream sayısı: ' + filtered.length);
            return filtered;
          });
        });
      });
    })
    .catch(function(e) {
      log('HATA: ' + e.message);
      return [];
    });
}

// ── Export ───────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getStreams: getStreams };
} else {
  global.getStreams = getStreams;
}
