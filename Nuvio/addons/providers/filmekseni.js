/**
 * FilmEkseni - Nuvio Provider
 * Kaynak: filmekseni.cc (Türkçe Film & Dizi)
 * Reverse engineered from FilmEkseni.cs3 CloudStream3 plugin
 */

const PROVIDER_ID = 'filmekseni';
const PROVIDER_NAME = 'Film Ekseni';
const MAIN_URL = 'https://filmekseni.cc';
const TMDB_API_KEY = '500330721680edb6d5f7f12ba7cd9023';
const TMDB_BASE = 'https://api.themoviedb.org/3';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0',
  'Referer': MAIN_URL + '/',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
};

// ─── Yardımcı Fonksiyonlar ───────────────────────────────────────────────────

async function safeFetch(url, options = {}) {
  const merged = {
    headers: { ...HEADERS, ...(options.headers || {}) },
    skipSizeCheck: true,
    ...options,
  };
  if (typeof fetchv2 === 'function') {
    try {
      return await fetchv2(
        url,
        merged.headers,
        merged.method || 'GET',
        merged.body || null,
        true,
        'utf-8'
      );
    } catch {}
  }
  return fetch(url, merged);
}

async function fetchText(url, options = {}) {
  const res = await safeFetch(url, options);
  return res && res.ok ? res.text() : '';
}

async function fetchJson(url, options = {}) {
  const res = await safeFetch(url, options);
  return res && res.ok ? res.json() : null;
}

function extractQuality(url) {
  const s = (url || '').toLowerCase();
  if (s.includes('2160') || s.includes('4k')) return '4K';
  if (s.includes('1080')) return '1080p';
  if (s.includes('720')) return '720p';
  if (s.includes('480')) return '480p';
  if (s.includes('360')) return '360p';
  return 'HD';
}

// ─── TMDB Yardımcıları ───────────────────────────────────────────────────────

async function getTmdbInfo(tmdbId, mediaType) {
  const type = mediaType === 'tv' ? 'tv' : 'movie';
  const url =
    `${TMDB_BASE}/${type}/${tmdbId}` +
    `?api_key=${TMDB_API_KEY}` +
    `&language=tr-TR` +
    `&append_to_response=external_ids`;
  const data = await fetchJson(url);
  if (!data) return null;
  return {
    title: data.title || data.name || '',
    originalTitle: data.original_title || data.original_name || '',
    imdbId: data.imdb_id || (data.external_ids && data.external_ids.imdb_id) || null,
    year: (data.release_date || data.first_air_date || '').slice(0, 4),
  };
}

// ─── Arama ──────────────────────────────────────────────────────────────────

/**
 * filmekseni.cc'nin /search/ endpoint'i JSON döndürür.
 * DEX analizinden: SearchApiResponse { result: SearchResultItem[] }
 * SearchResultItem: { postid, title, slug, slug_prefix, type, year, posterUrl, akatitle, original_title }
 */
async function searchFilmEkseni(query) {
  const url = `${MAIN_URL}/search/?q=${encodeURIComponent(query)}`;
  const res = await safeFetch(url, { headers: { ...HEADERS, 'Accept': 'application/json, */*' } });
  if (!res || !res.ok) return [];

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Bazı durumlarda HTML dönebilir, cheerio ile parse et
    const html = await res.text();
    return parseSearchHtml(html);
  }

  // JSON yanıtı: { result: [...] } formatında
  const items = data?.result || data?.results || (Array.isArray(data) ? data : []);
  return items;
}

function parseSearchHtml(html) {
  if (typeof cheerio === 'undefined') return [];
  const $ = cheerio.load(html);
  const results = [];
  $('div.card-list-item, article.card-list-item').each((_, el) => {
    const a = $(el).find('a').first();
    const href = a.attr('href') || '';
    const title = a.text().trim() || $(el).find('.title').text().trim();
    const poster = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
    if (href && title) {
      results.push({ href, title, posterUrl: poster });
    }
  });
  return results;
}

// ─── EksenLoad Video Extractor ───────────────────────────────────────────────

/**
 * EksenLoad sunucularından stream URL'lerini çıkarır.
 * Sunucular: eksenload.site / eksenload.top / d2.vidload.top
 */
async function extractEksenLoad(playerUrl) {
  const streams = [];

  const html = await fetchText(playerUrl, {
    headers: { ...HEADERS, Referer: MAIN_URL + '/' },
  });
  if (!html) return streams;

  // jwplayer kaynak tespiti
  const jwMatch = html.match(/file\s*:\s*["']([^"']+\.m3u8[^"']*)['"]/i);
  if (jwMatch) {
    const streamUrl = jwMatch[1];
    streams.push({
      name: PROVIDER_NAME,
      url: streamUrl,
      quality: extractQuality(streamUrl) || '1080p',
      headers: { Referer: playerUrl, 'User-Agent': HEADERS['User-Agent'] },
    });
    return streams;
  }

  // Script içinden kaynak tespiti
  const scriptMatches = html.matchAll(/sources?\s*[:=]\s*\[?\s*\{[^}]*file\s*:\s*["']([^"']+)['"]/gi);
  for (const m of scriptMatches) {
    if (m[1] && m[1].startsWith('http')) {
      streams.push({
        name: PROVIDER_NAME,
        url: m[1],
        quality: extractQuality(m[1]) || 'HD',
        headers: { Referer: playerUrl, 'User-Agent': HEADERS['User-Agent'] },
      });
    }
  }

  // vidload.top CDN tespiti
  const vidloadMatch = html.match(/https?:\/\/(?:d2\.vidload\.top|eksenload\.(?:site|top))[^\s"'<>]+/gi);
  if (vidloadMatch) {
    for (const url of new Set(vidloadMatch)) {
      if (url.includes('.m3u8') || url.includes('.mp4')) {
        streams.push({
          name: PROVIDER_NAME,
          url,
          quality: extractQuality(url) || '1080p',
          headers: { Referer: playerUrl, 'User-Agent': HEADERS['User-Agent'] },
        });
      }
    }
  }

  return streams;
}

// ─── Sayfa Yükleyici ─────────────────────────────────────────────────────────

async function loadStreamsFromPage(pageUrl, mediaType, season, episode) {
  const streams = [];
  const html = await fetchText(pageUrl);
  if (!html || typeof cheerio === 'undefined') return streams;

  const $ = cheerio.load(html);

  if (mediaType === 'tv') {
    // Dizi: sezon/bölüm seçimi
    // DEX'ten: #seasonsTabs-tabContent .tab-pane, div.tab-content a.nav-link
    const tabSelector = `#seasonsTabs-tabContent .tab-pane`;
    let episodeUrl = null;

    $('div.tab-content a.nav-link, .episode-list a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().toLowerCase();
      // Sezon ve bölüm eşleştirme
      const seasonMatch = text.match(/sezon\s*(\d+)|s(\d+)/i);
      const epMatch = text.match(/bölüm\s*(\d+)|ep?\s*(\d+)/i);
      const sNum = parseInt(seasonMatch?.[1] || seasonMatch?.[2] || '0');
      const eNum = parseInt(epMatch?.[1] || epMatch?.[2] || '0');
      if (sNum === Number(season) && eNum === Number(episode)) {
        episodeUrl = href;
      }
    });

    if (!episodeUrl) {
      // Alternatif: /season/ URL yapısı
      episodeUrl = `${pageUrl}/sezon-${season}/bolum-${episode}`;
    }

    const epHtml = await fetchText(episodeUrl);
    if (!epHtml) return streams;
    const $ep = cheerio.load(epHtml);

    const iframeUrl = $ep('div.card-video iframe, .player-container iframe').attr('src');
    if (iframeUrl) {
      const fullIframe = iframeUrl.startsWith('http') ? iframeUrl : `https:${iframeUrl}`;
      const epStreams = await extractEksenLoad(fullIframe);
      streams.push(...epStreams);
    }
  } else {
    // Film
    const iframeUrl = $('div.card-video iframe, .player-container iframe').attr('src');
    if (iframeUrl) {
      const fullIframe = iframeUrl.startsWith('http') ? iframeUrl : `https:${iframeUrl}`;
      const movieStreams = await extractEksenLoad(fullIframe);
      streams.push(...movieStreams);
    }
  }

  return streams;
}

// ─── Ana getStreams Fonksiyonu ────────────────────────────────────────────────

async function getStreams(tmdbId, mediaType, seasonNum, episodeNum) {
  try {
    const tmdbInfo = await getTmdbInfo(tmdbId, mediaType);
    if (!tmdbInfo || !tmdbInfo.title) return [];

    const { title, originalTitle, year } = tmdbInfo;

    // 1. Türkçe başlıkla ara
    let searchResults = await searchFilmEkseni(title);

    // 2. Sonuç yoksa orijinal başlıkla dene
    if (!searchResults.length && originalTitle && originalTitle !== title) {
      searchResults = await searchFilmEkseni(originalTitle);
    }

    if (!searchResults.length) return [];

    // 3. En iyi eşleşmeyi bul
    const titleLower = title.toLowerCase();
    const origLower = originalTitle.toLowerCase();

    let best = searchResults.find(item => {
      const t = (item.title || '').toLowerCase();
      const at = (item.akatitle || '').toLowerCase();
      const ot = (item.original_title || '').toLowerCase();
      return t === titleLower || at === titleLower || ot === origLower;
    }) || searchResults.find(item => {
      const t = (item.title || '').toLowerCase();
      return t.includes(titleLower) || titleLower.includes(t);
    }) || searchResults[0];

    if (!best) return [];

    // 4. Sayfa URL'sini oluştur
    let pageUrl = best.href || best.link;
    if (!pageUrl && best.slug) {
      const prefix = best.slug_prefix || (mediaType === 'tv' ? 'dizi' : 'film');
      pageUrl = `${MAIN_URL}/${prefix}/${best.slug}`;
    }
    if (!pageUrl) return [];
    if (!pageUrl.startsWith('http')) pageUrl = MAIN_URL + pageUrl;

    // 5. Stream'leri yükle
    const streams = await loadStreamsFromPage(pageUrl, mediaType, seasonNum, episodeNum);
    return streams;
  } catch (err) {
    return [];
  }
}

// ─── Export ──────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getStreams };
} else {
  global.getStreams = getStreams;
}
