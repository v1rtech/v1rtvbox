// ============================================================
//  HDFilmCehennemi — Nuvio Provider
// ============================================================

var TMDB_API_KEY   = '500330721680edb6d5f7f12ba7cd9023';
var PRIMARY_DOMAIN = 'https://www.hdfilmcehennemi.nl';
var EMBED_DOMAIN   = 'https://hdfilmcehennemi.mobi';

var CDN_HOSTS = [
  'https://srv12.cdnimages96.shop',
  'https://srv12.cdnimages1128.shop',
  'https://srv12.cdnimages1132.shop',
  'https://srv12.cdnimages1397.shop',
  'https://srv12.cdnimages784.shop',
  'https://srv12.cdnimages965.shop',
  'https://srv12.cdnimages403.shop',
  'https://srv12.cdnimages391.shop',
  'https://srv12.cdnimages391.shop',
  'https://srv12.cdnimages391.shop',
];

var FALLBACK_DOMAINS = [
  'https://hdfilmcehennemini.org',
  'https://www.hdfilmcehennemi.ws'
];

var ANDROID_UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36';

// ── Header setleri ────────────────────────────────────────────

var PAGE_HEADERS = {
  'User-Agent':      ANDROID_UA,
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9',
  'Upgrade-Insecure-Requests': '1'
};

// authority: www.hdfilmcehennemi.pro → CF bypass, search JSON döner
var SEARCH_HEADERS = {
  'User-Agent':       ANDROID_UA,
  'Accept':           '*/*',
  'Accept-Language':  'tr-TR,tr;q=0.9',
  'Content-Type':     'application/json',
  'X-Requested-With': 'fetch',
  'authority':        'www.hdfilmcehennemi.pro',
  'Sec-Fetch-Dest':   'empty',
  'Sec-Fetch-Mode':   'cors',
  'Sec-Fetch-Site':   'same-origin'
};

var VIDEO_API_HEADERS = {
  'User-Agent':       ANDROID_UA,
  'Content-Type':     'application/json',
  'X-Requested-With': 'fetch'
};

var EMBED_HEADERS = {
  'User-Agent':               ANDROID_UA,
  'Accept':                   'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language':          'tr-TR,tr;q=0.9',
  'Sec-Ch-Ua':                '"Chromium";v="146", "Not-A.Brand";v="24"',
  'Sec-Ch-Ua-Mobile':         '?1',
  'Sec-Ch-Ua-Platform':       '"Android"',
  'Sec-Fetch-Dest':           'iframe',
  'Sec-Fetch-Mode':           'navigate',
  'Sec-Fetch-Site':           'cross-site',
  'Sec-Fetch-Storage-Access': 'none',
  'Sec-Gpc':                  '1',
  'Upgrade-Insecure-Requests': '1'
};

var CDN_HEADERS = {
  'User-Agent': ANDROID_UA,
  'Accept':     '*/*',
  'Origin':     EMBED_DOMAIN,
  'Referer':    EMBED_DOMAIN + '/'
};

// ── Yardımcılar ───────────────────────────────────────────────

function fixUrl(url) {
  if (!url) return '';
  url = (url + '').replace(/\\\//g, '/').replace(/\\/g, '').trim();
  if (url.startsWith('http')) return url;
  if (url.startsWith('//'))   return 'https:' + url;
  return PRIMARY_DOMAIN + (url.startsWith('/') ? '' : '/') + url;
}

function norm(s) {
  return (s || '').toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/İ/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/â/g,'a').replace(/û/g,'u')
    .replace(/&[a-z]+;/g,'').replace(/[^a-z0-9]/g,'');
}

// ── Domain ────────────────────────────────────────────────────

var _activeDomain = null;

function getActiveDomain() {
  if (_activeDomain) { console.log('[HDFC] Domain (cache): ' + _activeDomain); return Promise.resolve(_activeDomain); }
  return fetch(PRIMARY_DOMAIN + '/', { headers: PAGE_HEADERS })
    .then(function(r) {
      if (!r.ok) return _tryFallbacks();
      return r.text().then(function(html) {
        if (html.indexOf('Just a moment') === -1) {
          _activeDomain = PRIMARY_DOMAIN;
          return PRIMARY_DOMAIN;
        }
        return _tryFallbacks();
      });
    })
    .catch(function() { return _tryFallbacks(); });
}

function _tryFallbacks() {
  return new Promise(function(resolve) {
    var done = 0, settled = false;
    FALLBACK_DOMAINS.forEach(function(d) {
      fetch(d + '/', { headers: PAGE_HEADERS })
        .then(function(r) {
          done++;
          if (settled) return;
          if (r.ok) {
            return r.text().then(function(html) {
              if (html.indexOf('Just a moment') === -1) {
                settled = true; _activeDomain = d; resolve(d);
              } else if (done >= FALLBACK_DOMAINS.length && !settled) resolve(PRIMARY_DOMAIN);
            });
          } else if (done >= FALLBACK_DOMAINS.length && !settled) resolve(PRIMARY_DOMAIN);
        })
        .catch(function() {
          done++;
          if (!settled && done >= FALLBACK_DOMAINS.length) resolve(PRIMARY_DOMAIN);
        });
    });
  });
}

// ── TMDB ──────────────────────────────────────────────────────

function fetchTmdbInfo(tmdbId, mediaType) {
  var ep = mediaType === 'tv' ? 'tv' : 'movie';
  return fetch('https://api.themoviedb.org/3/' + ep + '/' + tmdbId
    + '?api_key=' + TMDB_API_KEY + '&language=tr-TR')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      return {
        titleTr: d.title  || d.name  || '',
        titleEn: d.original_title || d.original_name || '',
        year:    (d.release_date || d.first_air_date || '').slice(0, 4)
      };
    });
}

// ── Arama ─────────────────────────────────────────────────────

function searchSite(domain, query) {
  var hdrs = Object.assign({}, SEARCH_HEADERS, { 'Referer': domain + '/' });
  return fetch(domain + '/search/?q=' + encodeURIComponent(query), { headers: hdrs })
    .then(function(r) {
      if (!r.ok) throw new Error('search HTTP ' + r.status);
      return r.json();
    })
    .then(function(data) {
      var results = (data.results || []).map(function(html) {
        var hM = html.match(/href="([^"]+)"/);
        if (!hM) return null;
        var tM = html.match(/<h4[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h4>/i) || html.match(/alt="([^"]+)"/);
        var yM = html.match(/<span[^>]*class="year"[^>]*>(\d{4})<\/span>/);
        var pM = html.match(/<span[^>]*class="type"[^>]*>([^<]+)<\/span>/);
        return {
          href:  hM[1],
          title: tM ? tM[1].trim() : '',
          year:  yM ? yM[1] : '',
          type:  pM ? pM[1].trim().toLowerCase() : ''
        };
      }).filter(Boolean);
      console.log('[HDFC] Arama "' + query + '" → ' + results.length + ' sonuç');
      return results;
    })
    .catch(function(e) {
      console.log('[HDFC] Arama hata: ' + e.message);
      return [];
    });
}

function pickBest(results, titleTr, titleEn, year, mediaType) {
  if (!results.length) return null;
  var nTr = norm(titleTr), nEn = norm(titleEn);
  var scored = results.map(function(r) {
    var score = 0, nt = norm(r.title), nh = norm(r.href);
    if (mediaType === 'movie' && (r.type === 'film' || r.type === 'movie')) score += 100;
    if (mediaType === 'tv'    && (r.type === 'dizi' || r.type === 'series')) score += 100;
    if (nt === nTr || nt === nEn)                               score += 50;
    else if (nt.indexOf(nTr) !== -1 || nt.indexOf(nEn) !== -1) score += 20;
    else if (nh.indexOf(nTr) !== -1 || nh.indexOf(nEn) !== -1) score += 10;
    // "The Godfather" → "godfather" prefix eşleşmesi (the, a, bir gibi article'lar)
    var nTrNoArt = nTr.replace(/^(the|a|bir|el|le|la|les|les|die|der|das)/, '');
    var nEnNoArt = nEn.replace(/^(the|a|bir|el|le|la|les|les|die|der|das)/, '');
    if (nTrNoArt && (nt.indexOf(nTrNoArt) !== -1 || nh.indexOf(nTrNoArt) !== -1)) score += 15;
    if (nEnNoArt && (nt.indexOf(nEnNoArt) !== -1 || nh.indexOf(nEnNoArt) !== -1)) score += 15;
    // "Godfather 1" gibi sayı suffix'i - sonundaki rakamları sil ve tekrar dene
    var nTrNoNum = nTr.replace(/\d+$/, '').replace(/[ivx]+$/, '');
    var nEnNoNum = nEn.replace(/\d+$/, '').replace(/[ivx]+$/, '');
    if (nTrNoNum && nTrNoNum !== nTr && nt.indexOf(nTrNoNum) !== -1) score += 10;
    if (nEnNoNum && nEnNoNum !== nEn && nt.indexOf(nEnNoNum) !== -1) score += 10;
    if (year && r.year === year)                                score += 30;
    else if (year && r.year && Math.abs(parseInt(r.year||0) - parseInt(year)) <= 1) score += 10;
    return { r: r, score: score };
  });
  scored.sort(function(a, b) { return b.score - a.score; });
  return scored[0].r.href;
}


// ── Sayfa HTML'ini çek (?router=1 ile) ───────────────────────
function fetchPageHtml(pageUrl) {
  var routerUrl = pageUrl + (pageUrl.indexOf('?') === -1 ? '?router=1' : '&router=1');
  var hdrs = Object.assign({}, SEARCH_HEADERS, { 'Referer': pageUrl });
  return fetch(routerUrl, { headers: hdrs })
    .then(function(r) {
      if (!r.ok) throw new Error('router HTTP ' + r.status);
      return r.json();
    })
    .then(function(json) {
      return json.html || json.data || '';
    })
    .catch(function() {
      return fetch(pageUrl, { headers: Object.assign({}, PAGE_HEADERS, { 'Referer': PRIMARY_DOMAIN + '/' }) })
        .then(function(r) { return r.ok ? r.text() : ''; })
        .catch(function() { return ''; });
    });
}

function buildEpisodeUrl(url, s, e) {
  // Placeholder - gerçek URL sayfa parse ile bulunacak
  return url.replace(/\/$/, '') + '/sezon-' + s + '/bolum-' + e + '-hd1/';
}

function parseEpisodeLinks(html) {
  // /dizi/{slug}/sezon-{S}/bolum-{E}-{suffix}/ linklerini topla
  var eps = {}, re = /href="(https?:\/\/[^"]+\/dizi\/[^"]+\/sezon-(\d+)\/bolum-(\d+)-[^"\/]+\/)"/gi, m;
  while ((m = re.exec(html)) !== null) {
    var key = parseInt(m[2]) + '_' + parseInt(m[3]);
    if (!eps[key]) eps[key] = { url: m[1], season: parseInt(m[2]), episode: parseInt(m[3]) };
  }
  return eps;
}

// ── Altyazı parse ─────────────────────────────────────────────

function extractSubtitles(html) {
  var subs = [];

  // 1. tracks: [{file, kind, label}]
  var trkM = html.match(/tracks\s*:\s*\[([\s\S]*?)\]/);
  if (trkM) {
    try {
      var arr = JSON.parse('[' + trkM[1] + ']');
      arr.forEach(function(t) {
        if (t.file && (t.kind === 'captions' || t.kind === 'subtitles')) {
          subs.push({ url: t.file.replace(/\\\//g, '/'), language: t.label || t.language || 'TR', label: t.label || t.language || 'TR' });
        }
      });
      if (subs.length) return subs;
    } catch (e) {}
    var fRe = /"file"\s*:\s*"([^"]+)"/g, lRe = /"label"\s*:\s*"([^"]+)"/g, kRe = /"kind"\s*:\s*"([^"]+)"/g;
    var files = [], labels = [], kinds = [], m;
    while ((m = fRe.exec(trkM[1])) !== null) files.push(m[1].replace(/\\\//g, '/'));
    while ((m = lRe.exec(trkM[1])) !== null) labels.push(m[1]);
    while ((m = kRe.exec(trkM[1])) !== null) kinds.push(m[1]);
    for (var i = 0; i < files.length; i++) {
      if (kinds[i] === 'captions' || kinds[i] === 'subtitles') {
        subs.push({ url: files[i], language: labels[i] || 'TR', label: labels[i] || 'TR' });
      }
    }
    if (subs.length) return subs;
  }

  // 2. <track> tags
  var tagRe = /<track[^>]+>/gi, tm;
  while ((tm = tagRe.exec(html)) !== null) {
    var tag = tm[0];
    if (tag.indexOf('captions') === -1 && tag.indexOf('subtitles') === -1) continue;
    var srcM = tag.match(/\bsrc=["']([^"']+)['"]/i);
    var labM = tag.match(/\blabel=["']([^"']+)['"]/i);
    if (!srcM) continue;
    var tUrl = srcM[1].startsWith('http') ? srcM[1] : EMBED_DOMAIN + srcM[1];
    var lang = labM ? labM[1] : 'TR';
    subs.push({ url: tUrl, language: lang, label: lang });
  }

  return subs; // her zaman array, undefined değil
}

// ── M3U8 → stream nesneleri ───────────────────────────────────

function buildStreamsFromM3u8(m3u8Text, masterUrl, subtitles, sourceName) {
  var lines    = m3u8Text.split('\n').map(function(l) { return l.trim(); });
  var hasAudio = {};
  lines.forEach(function(l) {
    var a = l.match(/#EXT-X-MEDIA:.*?NAME="([^"]+)"/i);
    if (a) hasAudio[a[1]] = true;
  });
  var quality = 'Auto';
  for (var i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('#EXT-X-STREAM-INF:')) continue;
    var r = lines[i].match(/RESOLUTION=(\d+x\d+)/i);
    if (r) {
      var w = parseInt(r[1].split('x')[0]);
      quality = w >= 1920 ? '1080p' : w >= 1280 ? '720p' : w >= 854 ? '480p' : 'Auto';
    }
    break;
  }
  var hasTr   = !!(hasAudio['Turkish']        || hasAudio['Türkçe']);
  var hasOrig = !!(hasAudio['Original Audio'] || hasAudio['Original'] || hasAudio['English']);
  var isDual  = hasTr && hasOrig;
  var subs    = subtitles || [];
  var trSubs  = subs.filter(function(s) { return /turkish|türkçe/i.test(s.language); });
  var enSubs  = subs.filter(function(s) { return /english/i.test(s.language); });
  // sourceName "DUAL | Close" gibi gelebilir - lang prefix'i ayrıca ekliyoruz, tekrar etmesin
  var _nameClean = (sourceName || '').replace(/^[A-Z]+\s*\|\s*/, ''); // "DUAL | Close" → "Close"
  var prefix  = '⌜ HDFILMCEHENNEMI ⌟' + (_nameClean ? ' | ' + _nameClean : '');
  var base    = { name: 'HDFilmCehennemi', url: masterUrl, quality: quality, type: 'hls', headers: CDN_HEADERS };
  var streams = [];
  if (isDual) {
    streams.push(Object.assign({}, base, { title: prefix + ' | DUAL | ' + quality,          subtitles: trSubs.length ? trSubs : subs }));
    streams.push(Object.assign({}, base, { title: prefix + ' | 🌐 Orijinal | ' + quality,   subtitles: enSubs.length ? enSubs : subs }));
  } else if (hasTr) {
    streams.push(Object.assign({}, base, { title: prefix + ' | 🇹🇷 TR Dublaj | ' + quality,  subtitles: trSubs.length ? trSubs : subs }));
  } else if (hasOrig) {
    streams.push(Object.assign({}, base, { title: prefix + ' | 🌐 Orijinal | ' + quality,   subtitles: enSubs.length ? enSubs : subs }));
  } else {
    streams.push(Object.assign({}, base, { title: prefix + ' | 🎬 Video | ' + quality,      subtitles: subs }));
  }
  return streams;
}

// ── CLOSE: CDN host listesi denemesi (V5 akışı) ──────────────

function tryCdnHosts(filename, subtitles, sourceName) {
  return new Promise(function(resolve) {
    var done = 0, settled = false;
    CDN_HOSTS.forEach(function(host) {
      var masterUrl = host + '/hls/' + filename + '.mp4/txt/master.txt';
      fetch(masterUrl, { headers: CDN_HEADERS })
        .then(function(r) {
          done++;
          if (settled) { return; }
          if (r.ok) {
            return r.text().then(function(m3u8) {
              if (!settled && m3u8.indexOf('#EXTM3U') !== -1) {
                settled = true;
                console.log('[HDFC] CDN hit: ' + host);
                resolve(buildStreamsFromM3u8(m3u8, masterUrl, subtitles, sourceName));
              } else if (done >= CDN_HOSTS.length && !settled) resolve([]);
            });
          } else if (done >= CDN_HOSTS.length && !settled) resolve([]);
        })
        .catch(function() {
          done++;
          if (!settled && done >= CDN_HOSTS.length) resolve([]);
        });
    });
  });
}

function fetchStreamsFromEmbed(embedUrl, pageReferer, sourceName) {
  var hdrs = Object.assign({}, EMBED_HEADERS, {
    'Referer': pageReferer,
    'Cookie':  'guide_tooltip_closeloadxx=1',
    'Origin':  pageReferer.split('/').slice(0, 3).join('/')
  });

  return fetch(embedUrl, { headers: hdrs })
    .then(function(r) {
      if (!r.ok) throw new Error('embed HTTP ' + r.status);
      return r.text();
    })
    .then(function(html) {
      var subtitles = extractSubtitles(html);
      var thumbM    = html.match(/hdfilmcehennemi\.mobi\/img\/([^"'\s]+)\.(?:jpg|webp)/i);
      if (!thumbM) {
        console.log('[HDFC] Close: thumbnail bulunamadı');
        return [];
      }
      var filename = thumbM[1];
      console.log('[HDFC] Close CDN: ' + filename + ' | subs=' + subtitles.length);
      return tryCdnHosts(filename, subtitles, sourceName);
    })
    .catch(function(e) {
      console.log('[HDFC] Close embed hata: ' + e.message);
      return [];
    });
}

// ── RAPIDRAME: patron'un decodeDcHello + resolveVideoFromScript ──

function _base64ToBytes(str) {
  try {
    var b = (typeof atob === 'function') ? atob(str) : Buffer.from(str, 'base64').toString('latin1');
    var out = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
    return out;
  } catch (e) { return null; }
}

function _bytesToStr(bytes) {
  var s = '';
  for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

function _rot13Str(s) {
  return s.replace(/[A-Za-z]/g, function(c) {
    var base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode((c.charCodeAt(0) - base + 13) % 26 + base);
  });
}

function _rot13Bytes(bytes) {
  var out = new Uint8Array(bytes.length);
  for (var i = 0; i < bytes.length; i++) {
    var b = bytes[i];
    if (b >= 97 && b <= 122) b = (b - 97 + 13) % 26 + 97;
    else if (b >= 65 && b <= 90) b = (b - 65 + 13) % 26 + 65;
    out[i] = b;
  }
  return out;
}

function _reverseBytes(bytes) {
  var out = new Uint8Array(bytes.length);
  for (var i = 0; i < bytes.length; i++) out[i] = bytes[bytes.length - 1 - i];
  return out;
}

function _reverseStr(s) { return s.split('').reverse().join(''); }

function _unmix(bytes) {
  var out = '';
  for (var i = 0; i < bytes.length; i++) {
    out += String.fromCharCode((bytes[i] - (399756995 % (i + 5)) + 256) % 256);
  }
  return out;
}

function _isValidUrl(s) {
  if (!s || s.length < 10) return false;
  if (/[\x00-\x08\x0E-\x1F]/.test(s)) return false;
  return /^https?:\/\//i.test(s) || s.indexOf('m3u8') !== -1 || s.indexOf('mp4') !== -1;
}

// patron'un decodeDcHello — 8 strateji dener, çalışanı döner
function decodeDcHello(parts) {
  var s = parts.join('');

  function rot13Str(v) {
    return v.replace(/[A-Za-z]/g, function(c) {
      var b = c <= 'Z' ? 65 : 97;
      return String.fromCharCode((c.charCodeAt(0) - b + 13) % 26 + b);
    });
  }
  function revStr(v) { return v.split('').reverse().join(''); }
  function b64ToBytes(v) {
    try {
      var decoded = (typeof Buffer !== 'undefined')
        ? Buffer.from(v, 'base64').toString('latin1')
        : atob(v);
      var arr = new Uint8Array(decoded.length);
      for (var i = 0; i < decoded.length; i++) arr[i] = decoded.charCodeAt(i);
      return arr;
    } catch (e) { return null; }
  }
  function bytesToStr(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return s;
  }
  function rot13Bytes(bytes) {
    var out = new Uint8Array(bytes.length);
    for (var i = 0; i < bytes.length; i++) {
      var b = bytes[i];
      if (b >= 97 && b <= 122) b = (b - 97 + 13) % 26 + 97;
      else if (b >= 65 && b <= 90) b = (b - 65 + 13) % 26 + 65;
      out[i] = b;
    }
    return out;
  }
  function revBytes(bytes) { return Uint8Array.from(Array.from(bytes).reverse()); }
  function unmix(bytes) {
    var out = '';
    for (var i = 0; i < bytes.length; i++) {
      out += String.fromCharCode((bytes[i] - (399756995 % (i + 5)) + 256) % 256);
    }
    return out;
  }
  function isValid(v) {
    if (!v || v.length < 10) return false;
    if (/[\x00-\x08\x0E-\x1F]/.test(v)) return false;
    return /^https?:\/\//i.test(v) || v.indexOf('m3u8') !== -1 || v.indexOf('mp4') !== -1;
  }

  var strategies = [
    // Strateji 0 (Close): ROT13 → base64 → reverse → unmix
    function() { var b = b64ToBytes(rot13Str(s)); return b ? unmix(revBytes(b)) : ''; },
    // Strateji 1 (Rapidrame): reverse → base64 → base64 → unmix (çift atob!)
    function() { var rev = revStr(s); var b1 = b64ToBytes(rev); if (!b1) return ''; var b2 = b64ToBytes(bytesToStr(b1)); return b2 ? unmix(b2) : ''; },
    // Diğer stratejiler fallback
    function() { var b = b64ToBytes(revStr(rot13Str(s))); return b ? unmix(b) : ''; },
    function() { var b = b64ToBytes(revStr(s)); return b ? unmix(rot13Bytes(b)) : ''; },
    function() { var b = b64ToBytes(rot13Str(revStr(s))); return b ? unmix(b) : ''; },
    function() { var b = b64ToBytes(s); return b ? unmix(revBytes(rot13Bytes(b))) : ''; },
    function() { var b = b64ToBytes(s); return b ? unmix(rot13Bytes(revBytes(b))) : ''; },
    function() { var b = b64ToBytes(revStr(rot13Str(s))); if (!b) return ''; var n = b64ToBytes(bytesToStr(b)); return n ? unmix(n) : ''; }
  ];

  for (var i = 0; i < strategies.length; i++) {
    try {
      var result = strategies[i]();
      if (isValid(result)) return result;
    } catch (e) {}
  }
  return '';
}
function _parseQuotedArray(arraySource) {
  var values = [], re = /"([^"]*)"|'([^']*)'/g, m;
  while ((m = re.exec(arraySource)) !== null) {
    values.push(m[1] !== undefined ? m[1] : (m[2] || ''));
  }
  return values;
}
function _scanPackedScript(script) {
  var blocks = [], searchIdx = 0;
  while (true) {
    var s1 = script.indexOf('eval(function(p,a,c,k,e,d)', searchIdx);
    var s2 = script.indexOf('eval(function(p,a,c,k,e', searchIdx);
    var start = (s1 >= 0 && s2 >= 0) ? Math.min(s1, s2) : (s1 >= 0 ? s1 : s2);
    if (start < 0) break;
    var depth = 0, end = -1;
    for (var i = start + 4; i < script.length; i++) {
      if (script[i] === '(') depth++;
      else if (script[i] === ')') { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    if (end < 0) break;
    blocks.push(script.slice(start, end));
    searchIdx = end;
  }
  return blocks;
}

function _unpackEvalBlock(block) {
  try {
    // eval scope'una atob polyfill inject et (QuickJS uyumluluğu)
    var _atob = typeof atob === 'function' ? atob : function(s) {
      return Buffer.from(s, 'base64').toString('latin1');
    };
    var _btoa = typeof btoa === 'function' ? btoa : function(s) {
      return Buffer.from(s, 'latin1').toString('base64');
    };
    /* jshint ignore:start */
    return (function(atob, btoa) {
      return eval(block.replace(/^eval\(/, '('));
    })(_atob, _btoa);
    /* jshint ignore:end */
  } catch (e) { return ''; }
}

// patron'un parseTracks
function _parseTracks(script) {
  var raw = (script.match(/tracks\s*:\s*\[([\s\S]*?)\]\s*,\s*image\s*:/i) || [])[1];
  if (!raw) return [];
  try { return JSON.parse('[' + raw + ']'); } catch (e) { return []; }
}

// patron'un resolveVideoFromScript
function resolveVideoFromScript(script) {
  var unpacked = _scanPackedScript(script).map(_unpackEvalBlock).filter(Boolean).join('\n');
  var combined = script + '\n' + unpacked;

  // 1. file_link = "..."
  var flM = combined.match(/file_link\s*=\s*"([^"]+)";/i);
  if (flM) {
    var pts = _parseQuotedArray(flM[1]);
    var dec = decodeDcHello(pts);
    if (dec) return dec.startsWith('http') ? dec : 'https' + dec.substring(dec.indexOf('://'));
  }

  // 2. sources: [{file: VAR}]
  var srcVar = (combined.match(/sources\s*:\s*\[\s*\{\s*file\s*:\s*([A-Za-z0-9_]+)\s*[,}]/i) || [])[1];
  if (srcVar) {
    var varRe = new RegExp('var\\s+' + srcVar + '\\s*=\\s*[A-Za-z0-9_]+\\(\\[([\\s\\S]*?)\\]\\)', 'i');
    var varM  = combined.match(varRe);
    if (varM) {
      var pts2 = _parseQuotedArray(varM[1]);
      var dec2 = decodeDcHello(pts2);
      if (dec2) return dec2;
    }
  }

  // 3. Direkt m3u8/mp4
  var dm = combined.match(/sources\s*:\s*\[\s*\{\s*file\s*:\s*"([^"]+\.m3u8[^"]*)"/i)
        || combined.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)['"]/i)
        || combined.match(/["'](https?:\/\/[^"']+\.mp4[^"']*)['"]/i);
  return dm ? dm[1] : '';
}
function resolveRapidrameSource(rplayerUrl, sourceName, pageReferer) {
  // rplayer URL'i sonda / ile olmalı (301 redirect önlemek için)
  var rplayerUrlSlash = rplayerUrl.endsWith('/') ? rplayerUrl : rplayerUrl + '/';
  return fetch(rplayerUrlSlash, {
    redirect: 'follow',
    headers: {
      'User-Agent': ANDROID_UA,
      'Referer':    PRIMARY_DOMAIN + '/',
      'Accept':     'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  })
  .then(function(r) {
    if (!r.ok) throw new Error('rplayer HTTP ' + r.status);
    return r.text();
  })
  .then(function(html) {
    // script tag'larından sources: veya file_link= içereni bul
    var scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    var script = '', m;
    while ((m = scriptRe.exec(html)) !== null) {
      if (m[1].indexOf('sources:') !== -1 || m[1].indexOf('file_link=') !== -1) {
        script = m[1];
        break;
      }
    }
    if (!script) {
      console.log('[HDFC] Rapidrame: script bulunamadı');
      return [];
    }

    var videoUrl = resolveVideoFromScript(script);
    if (!videoUrl) {
      console.log('[HDFC] Rapidrame: video URL çözülemedi');
      return [];
    }
    console.log('[HDFC] Rapidrame: ' + videoUrl);

    // Altyazılar
    var tracks   = _parseTracks(script).filter(function(t) { return t.kind === 'captions' && t.file; });
    var subtitles = tracks.map(function(t) {
      return { url: t.file, language: t.label || 'TR', label: t.label || 'TR' };
    });

    var rapHeaders = {
      'Referer':    PRIMARY_DOMAIN + '/',
      'Origin':     PRIMARY_DOMAIN,
      'User-Agent': ANDROID_UA,
      'Accept':     '*/*'
    };

    // master.txt çek ve stream oluştur
    return fetch(videoUrl, { headers: rapHeaders })
      .then(function(r2) { return r2.ok ? r2.text() : null; })
      .then(function(m3u8) {
        if (!m3u8 || m3u8.indexOf('#EXTM3U') === -1) {
          return [{
            name:      'HDFilmCehennemi',
            title:     '⌜ HDFILMCEHENNEMI ⌟ | ' + sourceName + ' | Auto',
            url:       videoUrl,
            quality:   'Auto',
            type:      'hls',
            headers:   rapHeaders,
            subtitles: subtitles
          }];
        }
        return buildStreamsFromM3u8(m3u8, videoUrl, subtitles, sourceName);
      })
      .catch(function() {
        return [{
          name:      'HDFilmCehennemi',
          title:     '⌜ HDFILMCEHENNEMI ⌟ | ' + sourceName + ' | Auto',
          url:       videoUrl,
          quality:   'Auto',
          type:      'hls',
          headers:   rapHeaders,
          subtitles: subtitles
        }];
      });
  })
  .catch(function(e) {
    console.log('[HDFC] Rapidrame hata: ' + e.message);
    return [];
  });
}

// ── /video/{id}/ → Close veya Rapidrame ──────────────────────
// sourceName'de "rapidrame" geçiyorsa → /rplayer/ yolu
// sourceName'de "close" geçiyorsa (veya varsayılan) → embed → CDN

function getVideoSource(domain, videoId, sourceName, pageReferer) {
  return fetch(domain + '/video/' + videoId + '/', {
    headers: Object.assign({}, VIDEO_API_HEADERS, { 'Referer': pageReferer })
  })
  .then(function(r) {
    if (!r.ok) throw new Error('video/ HTTP ' + r.status);
    return r.text();
  })
  .then(function(raw) {
    var iframe = null;
    var iframeClass = '';
    try {
      var json = JSON.parse(raw);
      var htmlContent = (json.data || {}).html || '';
      // iframe class'ını al: class="close" veya class="rapidrame"
      var classM = htmlContent.match(/class=["']([^"']+)["']/i);
      if (classM) iframeClass = classM[1].toLowerCase();
      var m1 = htmlContent.match(/data-src=["']([^"']+)["']/i);
      if (m1) iframe = m1[1].replace(/\\/g, '');
      if (!iframe) {
        var m2 = htmlContent.match(/data-src=\\"([^"]+)/i);
        if (m2) iframe = m2[1].replace(/\\/g, '');
      }
    } catch (e) {
      var m3 = raw.match(/data-src=\\"([^"]+)/i);
      if (m3) iframe = m3[1].replace(/\\/g, '');
    }
    if (!iframe) { console.log('[HDFC] iframe bulunamadı: ' + sourceName); return []; }

    console.log('[HDFC] ' + sourceName + ' → class=' + iframeClass + ' iframe: ' + iframe);

    // class="rapidrame" VEYA sourceName'de rapidrame → Rapidrame yolu
    var isRapidrame = iframeClass === 'rapidrame' || sourceName.toLowerCase().indexOf('rapidrame') !== -1;

    // Rapidrame yolu
    if (isRapidrame) {
      var rplayerUrl = null;

      // iframe zaten /rplayer/ URL'i ise direkt kullan
      if (iframe.indexOf('/rplayer/') !== -1) {
        // sonda / olsun
        rplayerUrl = iframe.endsWith('/') ? iframe : iframe + '/';
      }
      // iframe'de rapidrame_id= varsa → /rplayer/{id}/ oluştur
      else if (iframe.indexOf('rapidrame_id=') !== -1) {
        var rapId = iframe.split('rapidrame_id=')[1].split('&')[0];
        rplayerUrl = domain + '/rplayer/' + rapId + '/';
      }

      if (rplayerUrl) {
        console.log('[HDFC] → Rapidrame rplayer: ' + rplayerUrl);
        return resolveRapidrameSource(rplayerUrl, sourceName, pageReferer);
      }
    }

    // Close yolu: .mobi/video/embed/ → embed sayfası → thumbnail → CDN host
    // NOT: query string dahil gönder (rapidrame_id ile thumbnail geliyor)
    if (iframe.indexOf('hdfilmcehennemi.mobi') !== -1) {
      console.log('[HDFC] → Close embed: ' + iframe);
      return fetchStreamsFromEmbed(iframe, pageReferer, sourceName);
    }

    // Diğer iframe türleri
    return fetchStreamsFromEmbed(fixUrl(iframe), pageReferer, sourceName);
  })
  .catch(function(e) {
    console.log('[HDFC] getVideoSource hata: ' + e.message);
    return [];
  });
}

// ── Film/bölüm sayfası: alternative-links ────────────────────

function _parseAlternativeLinks(html) {
  var sources = [];
  var altRe   = /<div[^>]+class="[^"]*alternative-links[^"]*"[^>]*data-lang="([^"]*)"[^>]*>([\s\S]*?)<\/div>/g;
  var altM;
  while ((altM = altRe.exec(html)) !== null) {
    var lang  = (altM[1] || '').toUpperCase();
    var block = altM[2];
    var btnRe = /<button[^>]+data-video="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g;
    var btnM;
    while ((btnM = btnRe.exec(block)) !== null) {
      var text = btnM[2].replace(/<[^>]+>/g, '').replace(/\(HDrip Xbet\)/g, '').trim();
      var name = (lang ? lang + ' | ' : '') + text;
      if (btnM[1]) sources.push({ videoId: btnM[1], name: name });
    }
  }
  return sources;
}

function _processSourcesSequential(domain, sources, pageUrl) {
  // Önce Close, sonra Rapidrame — sıralı çalıştır, ikisi de sonuç listesine gir
  var results = [];
  var close    = sources.filter(function(s) { return s.name.toLowerCase().indexOf('rapidrame') === -1; });
  var rapidrame = sources.filter(function(s) { return s.name.toLowerCase().indexOf('rapidrame') !== -1; });
  var ordered  = close.concat(rapidrame); // Close önce

  function next(i) {
    if (i >= ordered.length) return Promise.resolve();
    var src = ordered[i];
    console.log('[HDFC] İşleniyor: ' + src.name + ' (id=' + src.videoId + ')');
    return getVideoSource(domain, src.videoId, src.name, pageUrl)
      .then(function(ss) {
        ss.forEach(function(s) { results.push(s); });
        return next(i + 1);
      });
  }
  return next(0).then(function() { return results; });
}

function fetchStreamsFromPage(domain, pageUrl) {
  // Önce ?router=1 ile JSON dene (Nuvio'da çalışan yol)
  var routerUrl = pageUrl + (pageUrl.indexOf('?') === -1 ? '?router=1' : '&router=1');
  var routerHdrs = Object.assign({}, SEARCH_HEADERS, {
    'Referer':                  pageUrl,
    'Mofycore-Router-Prefetch': 'false'
  });

  return fetch(routerUrl, { headers: routerHdrs })
    .then(function(r) {
      console.log('[HDFC] Router response: HTTP ' + r.status);
      if (!r.ok) throw new Error('router HTTP ' + r.status);
      return r.json();
    })
    .then(function(json) {
      var html = json.html || json.data || '';
      if (typeof html !== 'string') html = JSON.stringify(html);
      console.log('[HDFC] Router HTML: ' + html.length + ' kar');
      return html;
    })
    .catch(function(e) {
      // Fallback: direkt GET
      console.log('[HDFC] Router hata: ' + e.message + ' → direkt GET');
      return fetch(pageUrl, {
        headers: Object.assign({}, PAGE_HEADERS, { 'Referer': domain + '/' })
      })
      .then(function(r) { return r.ok ? r.text() : ''; })
      .catch(function() { return ''; });
    })
    .then(function(html) {
      if (!html) { console.log('[HDFC] Sayfa boş'); return []; }
      console.log('[HDFC] Sayfa ' + html.length + ' kar | ' + pageUrl);

      var sources = _parseAlternativeLinks(html);
      console.log('[HDFC] ' + sources.length + ' kaynak: ' +
        sources.map(function(s) { return s.name; }).join(', '));

      if (!sources.length) return [];
      return _processSourcesSequential(domain, sources, pageUrl);
    });
}

// ── Ana fonksiyon ─────────────────────────────────────────────

function getStreams(tmdbId, mediaType, season, episode) {
  return Promise.all([getActiveDomain(), fetchTmdbInfo(tmdbId, mediaType)])
    .then(function(init) {
      var domain = init[0], info = init[1];
      console.log('[HDFC] ' + info.titleTr + ' (' + info.titleEn + ') ' + info.year);

      var queries = [searchSite(domain, info.titleTr)];
      if (info.titleEn && info.titleEn !== info.titleTr) {
        queries.push(searchSite(domain, info.titleEn));
      }

      return Promise.all(queries).then(function(all) {
        var seen = {}, combined = [];
        (all[0] || []).concat(all[1] || []).forEach(function(r) {
          if (!seen[r.href]) { seen[r.href] = true; combined.push(r); }
        });

        if (!combined.length) { console.log('[HDFC] Arama sonuç yok'); return []; }

        var pageUrl = pickBest(combined, info.titleTr, info.titleEn, info.year, mediaType);
        if (!pageUrl) return [];

        if (mediaType === 'tv' && season && episode) {
          var sNum = parseInt(season), eNum = parseInt(episode);
          // Dizi ana sayfasından bölüm URL'ini bul
          return fetchPageHtml(pageUrl)
            .then(function(diziHtml) {
              var eps = parseEpisodeLinks(diziHtml);
              var key = sNum + '_' + eNum;
              var epUrl = eps[key] ? eps[key].url : buildEpisodeUrl(pageUrl, sNum, eNum);
              console.log('[HDFC] Bölüm URL: ' + epUrl);
              return fetchStreamsFromPage(domain, epUrl);
            });
        }

        console.log('[HDFC] URL: ' + pageUrl);
        return fetchStreamsFromPage(domain, pageUrl);
      });
    })
    .then(function(streams) {
      var seen = {}, out = [];
      (streams || []).forEach(function(s) {
        if (s && s.url && !seen[s.url]) { seen[s.url] = true; out.push(s); }
      });
      return out;
    })
    .catch(function(e) {
      console.error('[HDFC] Hata: ' + (e.message || e));
      return [];
    });
}

if (typeof module !== 'undefined' && module.exports) module.exports = { getStreams: getStreams };
else global.getStreams = getStreams;
