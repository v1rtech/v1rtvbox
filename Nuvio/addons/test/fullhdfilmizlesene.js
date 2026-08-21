/**
 * FullHDFilmizlesene Provider for Nuvio
 */

var cheerio = require('cheerio-without-node-native');

// ─── Sabitler ─────────────────────────────────────────────────────────────────

var DOMAIN_LIST_URL = 'https://raw.githubusercontent.com/Kraptor123/domainListesi/refs/heads/main/eklenti_domainleri.txt';
var FALLBACK_URL    = 'https://www.fullhdfilmizlesene.now';
var TMDB_KEY        = '4ef0d7355d9ffb5151e987764708ce96';
var CACHE_MS        = 60 * 60 * 1000; // 1 saat

var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─── Domain cache ─────────────────────────────────────────────────────────────

var _domain   = null;
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
                // Satır formatı: fullhdfilmizlesene=https://www.site.live
                if (l.toLowerCase().indexOf('fullhdfilmizlesene=') === 0) {
                    var d = l.substring(19).trim().replace(/\/$/, '');
                    if (d) { _domain = d; _domainTs = Date.now(); return d; }
                }
            }
            _domain = FALLBACK_URL; _domainTs = Date.now();
            return FALLBACK_URL;
        })
        .catch(function() { return _domain || FALLBACK_URL; });
}

// ─── Headers ──────────────────────────────────────────────────────────────────

function makeHeaders(baseUrl, referer) {
    return {
        'User-Agent': UA,
        'Referer':    referer || (baseUrl + '/'),
        'Origin':     baseUrl,
        'Accept':     'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
    };
}

// ─── Normalize + eşleştirme ───────────────────────────────────────────────────

function normalize(str) {
    if (!str) return '';
    return str.toLowerCase()
        .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
        .replace(/ı/g,'i').replace(/İ/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
        .replace(/[^a-z0-9\s]/g,' ')
        .replace(/\s+/g,' ')
        .trim();
}

// Site genellikle "The Matrix 1" gibi sayı suffix ekler — onu soy, sonra karşılaştır.
function stripNumberSuffix(tokens) {
    if (tokens.length > 1 && /^\d+$/.test(tokens[tokens.length - 1])) {
        return tokens.slice(0, tokens.length - 1);
    }
    return tokens;
}

function matchScore(siteTitle, candidateTitles) {
    var normSite        = normalize(siteTitle);
    var siteTokens      = normSite.split(' ');
    var siteClean       = stripNumberSuffix(siteTokens); // "the matrix 1" → ["the","matrix"]
    var best = 0;

    for (var i = 0; i < candidateTitles.length; i++) {
        var normCand   = normalize(candidateTitles[i]);
        var candTokens = normCand.split(' ');

        // Birebir tam eşleşme
        if (normSite === normCand) return 1000;

        // "The Matrix 1" (site) ↔ "The Matrix" (TMDB): suffix soyulunca tam eşleşme
        if (siteClean.length === candTokens.length) {
            var cleanOk = true;
            for (var j = 0; j < siteClean.length; j++) {
                if (siteClean[j] !== candTokens[j]) { cleanOk = false; break; }
            }
            if (cleanOk) { best = Math.max(best, 950); continue; }
        }

        // Token sayısı eşit + tüm tokenlar eşleşiyor
        if (siteTokens.length === candTokens.length) {
            var allMatch = true;
            for (var k = 0; k < siteTokens.length; k++) {
                if (siteTokens[k] !== candTokens[k]) { allMatch = false; break; }
            }
            if (allMatch) { best = Math.max(best, 900); continue; }
        }

        // Ortak token oranı — her iki yönde hesapla
        var cSC = 0;
        for (var m = 0; m < siteTokens.length; m++) {
            if (candTokens.indexOf(siteTokens[m]) !== -1) cSC++;
        }
        var cCS = 0;
        for (var n = 0; n < candTokens.length; n++) {
            if (siteTokens.indexOf(candTokens[n]) !== -1) cCS++;
        }
        var ratio = Math.max(cSC, cCS) / Math.max(siteTokens.length, candTokens.length);

        if (siteTokens.length !== candTokens.length) {
            // Suffix soyulduktan sonra aday tamamen kapsamıyor mu?
            var cleanRatio = siteClean.length > 0
                ? cSC / Math.max(siteClean.length, candTokens.length)
                : 0;
            if (cleanRatio >= 1.0) {
                best = Math.max(best, 800); // suffix sonrası tam kapsama
            } else {
                best = Math.max(best, Math.round(ratio * 200)); // Cars ≠ Cars 3 koruması
            }
        } else if (ratio > 0.8) {
            best = Math.max(best, Math.round(ratio * 500));
        }
    }
    return best;
}

// ─── Base64 / RapidVid çözücü ─────────────────────────────────────────────────

function universalAtob(str) {
    try {
        if (typeof atob === 'function') return atob(str);
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var out = '';
        str = String(str).replace(/[=]+$/, '');
        for (var bc = 0, bs, buffer, idx = 0;
             buffer = str.charAt(idx++);
             ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4)
                 ? out += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
            buffer = chars.indexOf(buffer);
        }
        return out;
    } catch(e) { return null; }
}

function decodeRapidVid(encodedData) {
    try {
        if (!encodedData) return null;
        var reversed   = encodedData.split('').reverse().join('');
        var decodedBin = universalAtob(reversed.replace(/[^A-Za-z0-9+/=]/g, ''));
        if (!decodedBin) return null;
        var key      = 'K9L';
        var adjusted = '';
        for (var i = 0; i < decodedBin.length; i++) {
            var shift = (key.charCodeAt(i % key.length) % 5) + 1;
            adjusted += String.fromCharCode(decodedBin.charCodeAt(i) - shift);
        }
        var finalUrl = universalAtob(adjusted);
        return (finalUrl && finalUrl.startsWith('http')) ? finalUrl.replace(/\\/g, '').trim() : null;
    } catch(e) { return null; }
}

// ─── Stream sağlayıcıları ─────────────────────────────────────────────────────

function fetchAtom(apiBase, vidid, movieTitle, baseUrl) {
    var url = apiBase + '?id=' + vidid + '&type=t&name=atom&get=video&format=json';
    var hdrs = makeHeaders(baseUrl);

    return fetch(url, { headers: hdrs })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data || !data.html) return null;
            var playerUrl = data.html.replace(/\\/g, '');
            return fetch(playerUrl, { headers: hdrs })
                .then(function(r2) { return r2.text(); })
                .then(function(html) {
                    var m = html.match(/av\(['"]([^'"]+)['"]\)/);
                    if (!m) return null;
                    var url = decodeRapidVid(m[1]);
                    if (!url) return null;
                    return {
                        name:    movieTitle,
                        title:   '⌜ FULLHDFILM ⌟ | Atom | 🇹🇷 Dublaj',
                        url:     url,
                        quality: 'Auto',
                        headers: makeHeaders(baseUrl, playerUrl)
                    };
                });
        })
        .catch(function(e) {
            console.error('[FULLHDFILM] Atom hatası: ' + e.message);
            return null;
        });
}

function fetchTurbo(apiBase, vidid, movieTitle, baseUrl) {
    var url  = apiBase + '?id=' + vidid + '&type=t&name=advid&get=video&pno=tr&format=json';
    var hdrs = makeHeaders(baseUrl);

    return fetch(url, { headers: hdrs })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data || !data.html || data.html.indexOf('/watch/') === -1) return null;
            var m = data.html.match(/\/watch\/(.*?)"/);
            if (!m) return null;
            var watchId = m[1];
            var playUrl = 'https://turbo.imgz.me/play/' + watchId + '?autoplay=true';
            return fetch(playUrl, { headers: makeHeaders(baseUrl, baseUrl + '/') })
                .then(function(r2) { return r2.text(); })
                .then(function(html) {
                    var fm = html.match(/file:\s*"(.*?\.m3u8.*?)"/i);
                    if (!fm) return null;
                    return {
                        name:    movieTitle,
                        title:   '⌜ FULLHDFILM ⌟ | Turbo | 🇹🇷 Dublaj',
                        url:     fm[1],
                        quality: 'Auto',
                        headers: makeHeaders('https://turbo.imgz.me', playUrl)
                    };
                });
        })
        .catch(function(e) {
            console.error('[FULLHDFILM] Turbo hatası: ' + e.message);
            return null;
        });
}

function getStreamsFromVidid(vidid, movieTitle, baseUrl) {
    var apiBase = baseUrl + '/player/api.php';
    return Promise.all([
        fetchAtom(apiBase, vidid, movieTitle, baseUrl),
        fetchTurbo(apiBase, vidid, movieTitle, baseUrl)
    ]).then(function(results) {
        return results.filter(function(r) { return r !== null; });
    });
}

// ─── Film sayfası → vidid ─────────────────────────────────────────────────────

function fetchFilmStreams(filmUrl, movieTitle, baseUrl) {
    var fullUrl = filmUrl.startsWith('http') ? filmUrl : baseUrl + filmUrl;
    console.error('[FULLHDFILM] Film sayfası: ' + fullUrl);

    return fetch(fullUrl, { headers: makeHeaders(baseUrl) })
        .then(function(r) { return r.text(); })
        .then(function(html) {
            var m = html.match(/vidid\s*=\s*['"](\d+)['"]/);
            if (!m) {
                // Alternatif pattern
                m = html.match(/data-id=['"](\d+)['"]/);
            }
            if (!m) {
                console.error('[FULLHDFILM] vidid bulunamadı.');
                return [];
            }
            console.error('[FULLHDFILM] vidid: ' + m[1]);
            return getStreamsFromVidid(m[1], movieTitle, baseUrl);
        })
        .catch(function(e) {
            console.error('[FULLHDFILM] Film sayfası hatası: ' + e.message);
            return [];
        });
}

// ─── Arama + eşleştirme ───────────────────────────────────────────────────────

function searchAndMatch(query, allTitles, targetYear, baseUrl) {
    var searchUrl = baseUrl + '/arama/' + query.replace(/\s+/g, '+');
    console.error('[FULLHDFILM] Aranıyor: ' + searchUrl + ' | Hedef yıl: ' + (targetYear || 'yılsız'));

    return fetch(searchUrl, { headers: makeHeaders(baseUrl) })
        .then(function(r) { return r.text(); })
        .then(function(html) {
            var $ = cheerio.load(html);
            var candidates = [];

            $('ul.list li.film').each(function(i, el) {
                var link      = $(el).find('a.tt').attr('href');
                var siteTitle = $(el).find('.film-title').text().trim();
                var siteYear  = $(el).find('.film-yil').text().trim();

                if (!link || !siteTitle) return;

                if (targetYear && siteYear !== targetYear) {
                    console.error('[FULLHDFILM] Yıl uyuşmadı → ' + siteTitle + ' (' + siteYear + ')');
                    return;
                }

                var score = matchScore(siteTitle, allTitles);
                console.error('[FULLHDFILM] Aday: ' + siteTitle + ' (' + siteYear + ') → ' + score + ' puan');

    // Yıl eşleşiyorsa düşük skor yeterli — yıl zaten yanlış filmi eler
                // Yılsız aramada ise eşik yüksek kalır (Cars ≠ Cars 3 koruması)
                var minScore = targetYear ? 50 : 500;
                if (score >= minScore) {
                    candidates.push({ link: link, score: score, title: siteTitle, year: siteYear });
                }
            });

            if (candidates.length === 0) {
                console.error('[FULLHDFILM] Uygun aday bulunamadı.');
                return null;
            }

            candidates.sort(function(a, b) { return b.score - a.score; });
            var best = candidates[0];
            console.error('[FULLHDFILM] SEÇİLEN: ' + best.title + ' (' + best.year + ') → ' + best.score + ' puan');
            return best.link;
        })
        .catch(function(e) {
            console.error('[FULLHDFILM] Arama hatası: ' + e.message);
            return null;
        });
}

// ─── Fallback zinciri ─────────────────────────────────────────────────────────

function runFallbackChain(steps, movieTitle, baseUrl) {
    function next(i) {
        if (i >= steps.length) {
            console.error('[FULLHDFILM] Tüm denemeler başarısız.');
            return Promise.resolve([]);
        }
        var s = steps[i];
        console.error('[FULLHDFILM] Deneme ' + (i + 1) + '/' + steps.length + ': "' + s.query + '" (yıl: ' + (s.year || 'yok') + ')');
        return searchAndMatch(s.query, s.allTitles, s.year, baseUrl)
            .then(function(filmUrl) {
                if (filmUrl) return fetchFilmStreams(filmUrl, movieTitle, baseUrl);
                return next(i + 1);
            });
    }
    return next(0);
}

// ─── TMDB bilgisi ─────────────────────────────────────────────────────────────

function fetchTmdbData(tmdbId) {
    var url = 'https://api.themoviedb.org/3/movie/' + tmdbId
        + '?language=tr-TR&api_key=' + TMDB_KEY + '&append_to_response=alternative_titles';

    return fetch(url)
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var titleTr  = data.title || '';
            var titleEn  = data.original_title || '';
            var year     = data.release_date ? data.release_date.split('-')[0] : '';

            var allTitles = [titleTr, titleEn];
            if (data.alternative_titles && data.alternative_titles.titles) {
                data.alternative_titles.titles.forEach(function(t) {
                    if (t.title) allTitles.push(t.title);
                });
            }
            // Tekrarları temizle
            allTitles = allTitles.filter(function(t, idx, arr) {
                return t && arr.indexOf(t) === idx;
            });

            return { titleTr: titleTr, titleEn: titleEn, year: year, allTitles: allTitles };
        });
}

// ─── Ana fonksiyon ────────────────────────────────────────────────────────────

function getStreams(tmdbId, mediaType) {
    if (mediaType !== 'movie') {
        console.error('[FULLHDFILM] Sadece film destekleniyor.');
        return Promise.resolve([]);
    }

    console.error('[FULLHDFILM] === Başlatılıyor: tmdbId=' + tmdbId + ' ===');

    return getBaseUrl()
        .then(function(baseUrl) {
            console.error('[FULLHDFILM] Domain: ' + baseUrl);

            return fetchTmdbData(tmdbId)
                .then(function(tmdb) {
                    var titleTr   = tmdb.titleTr;
                    var titleEn   = tmdb.titleEn;
                    var year      = tmdb.year;
                    var allTitles = tmdb.allTitles;
                    var movieTitle = titleTr || titleEn;

                    console.error('[FULLHDFILM] Film: "' + titleTr + '" / "' + titleEn + '" (' + year + ')');

                    // Fallback sırası:
                    // 1. TR başlık + yıl
                    // 2. EN başlık + yıl
                    // 3. TR başlık yılsız
                    // 4. EN başlık yılsız
                    var steps = [];

                    if (titleTr) {
                        steps.push({ query: titleTr, allTitles: allTitles, year: year });
                    }
                    if (titleEn && titleEn !== titleTr) {
                        steps.push({ query: titleEn, allTitles: allTitles, year: year });
                    }
                    if (titleTr) {
                        steps.push({ query: titleTr, allTitles: allTitles, year: '' });
                    }
                    if (titleEn && titleEn !== titleTr) {
                        steps.push({ query: titleEn, allTitles: allTitles, year: '' });
                    }

                    return runFallbackChain(steps, movieTitle, baseUrl);
                });
        })
        .catch(function(e) {
            console.error('[FULLHDFILM] Genel hata: ' + e.message);
            return [];
        });
}

// ─── Export ───────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getStreams: getStreams };
} else {
    globalThis.getStreams = getStreams;
}
