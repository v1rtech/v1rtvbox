/**
 * DiziLife Provider for Nuvio
 * Saf JS AES-CBC (require('crypto') YOK - Nuvio uyumlu)
 */
"use strict";

var BASE_URL = "https://dizi73.life";
var TMDB_KEY = "500330721680edb6d5f7f12ba7cd9023";
var UA       = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

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
    if (!r.ok) throw new Error("HTTP " + r.status);
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

// ─── Saf JS MD5 ──────────────────────────────────────────────────────────────

function md5(data) {
  var bytes = data.slice();
  function rotl(n,s){return(n<<s)|(n>>>(32-s));}
  function add(a,b){return((a+b)&0xFFFFFFFF)>>>0;}
  var T=[];for(var i=0;i<64;i++)T[i]=(Math.abs(Math.sin(i+1))*4294967296)>>>0;
  var len=bytes.length;
  bytes.push(0x80);
  while(bytes.length%64!==56)bytes.push(0);
  var bits=len*8;
  for(var j=0;j<8;j++)bytes.push((bits/Math.pow(2,j*8))&0xff);
  var a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
  for(var k=0;k<bytes.length;k+=64){
    var M=[];
    for(var m=0;m<16;m++)M[m]=(bytes[k+m*4])|(bytes[k+m*4+1]<<8)|(bytes[k+m*4+2]<<16)|(bytes[k+m*4+3]<<24);
    var A=a0,B=b0,C=c0,D=d0;
    var s1=[7,12,17,22],s2=[5,9,14,20],s3=[4,11,16,23],s4=[6,10,15,21];
    for(var n=0;n<64;n++){
      var F,g;
      if(n<16){F=((B&C)|((~B>>>0)&D))>>>0;g=n;}
      else if(n<32){F=((D&B)|((~D>>>0)&C))>>>0;g=(5*n+1)%16;}
      else if(n<48){F=(B^C^D)>>>0;g=(3*n+5)%16;}
      else{F=(C^(B|((~D)>>>0)))>>>0;g=(7*n)%16;}
      var sh=n<16?s1[n%4]:n<32?s2[n%4]:n<48?s3[n%4]:s4[n%4];
      var tmp=add(add(add(A,F),M[g]>>>0),T[n]);
      A=D;D=C;C=B;B=add(B,rotl(tmp,sh));
    }
    a0=add(a0,A);b0=add(b0,B);c0=add(c0,C);d0=add(d0,D);
  }
  var out=[];
  [a0,b0,c0,d0].forEach(function(v){for(var x=0;x<4;x++)out.push((v>>>(x*8))&0xff);});
  return out;
}

// ─── Saf JS AES-256-CBC ──────────────────────────────────────────────────────

var SBOX=[99,124,119,123,242,107,111,197,48,1,103,43,254,215,171,118,202,130,201,125,250,89,71,240,173,212,162,175,156,164,114,192,183,253,147,38,54,63,247,204,52,165,229,241,113,216,49,21,4,199,35,195,24,150,5,154,7,18,128,226,235,39,178,117,9,131,44,26,27,110,90,160,82,59,214,179,41,227,47,132,83,209,0,237,32,252,177,91,106,203,190,57,74,76,88,207,208,239,170,251,67,77,51,133,69,249,2,127,80,60,159,168,81,163,64,143,146,157,56,245,188,182,218,33,16,255,243,210,205,12,19,236,95,151,68,23,196,167,126,61,100,93,25,115,96,129,79,220,34,42,144,136,70,238,184,20,222,94,11,219,224,50,58,10,73,6,36,92,194,211,172,98,145,149,228,121,231,200,55,109,141,213,78,169,108,86,244,234,101,122,174,8,186,120,37,46,28,166,180,198,232,221,116,31,75,189,139,138,112,62,181,102,72,3,246,14,97,53,87,185,134,193,29,158,225,248,152,17,105,217,142,148,155,30,135,233,206,85,40,223,140,161,137,13,191,230,66,104,65,153,45,15,176,84,187,22];

var INV_SBOX = (function(){var t=new Array(256);for(var i=0;i<256;i++)t[SBOX[i]]=i;return t;})();

function gmul(a,b){var p=0;for(var i=0;i<8;i++){if(b&1)p^=a;var h=a&0x80;a=(a<<1)&0xff;if(h)a^=0x1b;b>>=1;}return p;}

function aesKeyExpand(key){
  var RCON=[1,2,4,8,16,32,64,128,27,54];
  var nk=key.length/4,nr=nk+6,w=key.slice();
  for(var i=nk;i<4*(nr+1);i++){
    var t=w.slice((i-1)*4,i*4);
    if(i%nk===0){t=[SBOX[t[1]],SBOX[t[2]],SBOX[t[3]],SBOX[t[0]]];t[0]^=RCON[i/nk-1];}
    else if(nk>6&&i%nk===4){t=[SBOX[t[0]],SBOX[t[1]],SBOX[t[2]],SBOX[t[3]]];}
    for(var j=0;j<4;j++)w.push(w[(i-nk)*4+j]^t[j]);
  }
  return w;
}

function aesCbcDecrypt(ct,key,iv){
  var rk=aesKeyExpand(key),nr=key.length/4+6;
  function addRk(s,r){for(var i=0;i<16;i++)s[i]^=rk[r*16+i];}
  function invSub(s){for(var i=0;i<16;i++)s[i]=INV_SBOX[s[i]];}
  function invShift(s){var t;t=s[13];s[13]=s[9];s[9]=s[5];s[5]=s[1];s[1]=t;t=s[2];s[2]=s[10];s[10]=t;t=s[6];s[6]=s[14];s[14]=t;t=s[3];s[3]=s[7];s[7]=s[11];s[11]=s[15];s[15]=t;}
  function invMix(s){for(var c=0;c<4;c++){var i=c*4,s0=s[i],s1=s[i+1],s2=s[i+2],s3=s[i+3];s[i]=gmul(s0,14)^gmul(s1,11)^gmul(s2,13)^gmul(s3,9);s[i+1]=gmul(s0,9)^gmul(s1,14)^gmul(s2,11)^gmul(s3,13);s[i+2]=gmul(s0,13)^gmul(s1,9)^gmul(s2,14)^gmul(s3,11);s[i+3]=gmul(s0,11)^gmul(s1,13)^gmul(s2,9)^gmul(s3,14);}}
  function decBlock(block){var s=block.slice();addRk(s,nr);for(var r=nr-1;r>0;r--){invShift(s);invSub(s);addRk(s,r);invMix(s);}invShift(s);invSub(s);addRk(s,0);return s;}
  var out=[],prev=iv.slice();
  for(var b=0;b<ct.length;b+=16){var blk=ct.slice(b,b+16),dec=decBlock(blk);for(var i=0;i<16;i++)out.push(dec[i]^prev[i]);prev=blk;}
  var pad=out[out.length-1];if(pad>0&&pad<=16)out=out.slice(0,out.length-pad);
  return out;
}

// ─── EVP_BytesToKey ───────────────────────────────────────────────────────────

function strToBytes(s){
  var out=[];
  for(var i=0;i<s.length;i++){
    var c=s.charCodeAt(i);
    if(c<128)out.push(c);
    else if(c<2048){out.push(192|(c>>6));out.push(128|(c&63));}
    else{out.push(224|(c>>12));out.push(128|((c>>6)&63));out.push(128|(c&63));}
  }
  return out;
}

function base64ToBytes(b64){
  var chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  b64=b64.replace(/[^A-Za-z0-9+/]/g,"");
  var out=[],buf=0,bits=0;
  for(var i=0;i<b64.length;i++){buf=(buf<<6)|chars.indexOf(b64[i]);bits+=6;if(bits>=8){bits-=8;out.push((buf>>>bits)&0xff);}}
  return out;
}

function evpBytesToKey(pass,salt){
  var pw=strToBytes(pass),d=[],di=[];
  while(d.length<48){di=md5(di.concat(pw).concat(salt));d=d.concat(di);}
  return{key:d.slice(0,32),iv:d.slice(32,48)};
}

// ─── CryptoJS AES Decrypt ────────────────────────────────────────────────────

function cryptoJsDecrypt(b64,passphrase){
  var raw=base64ToBytes(b64);
  var isSalted=raw.length>16&&raw[0]===83&&raw[1]===97&&raw[2]===108&&raw[3]===116&&raw[4]===101&&raw[5]===100&&raw[6]===95&&raw[7]===95;
  var salt=isSalted?raw.slice(8,16):[];
  var ct=isSalted?raw.slice(16):raw;
  var kiv=evpBytesToKey(passphrase,salt);
  var dec=aesCbcDecrypt(ct,kiv.key,kiv.iv);
  var str="";
  for(var i=0;i<dec.length;){
    var b=dec[i++];
    if(b<128)str+=String.fromCharCode(b);
    else if(b<224)str+=String.fromCharCode(((b&31)<<6)|(dec[i++]&63));
    else str+=String.fromCharCode(((b&15)<<12)|((dec[i++]&63)<<6)|(dec[i++]&63));
  }
  return str;
}

// ─── Player çözme ────────────────────────────────────────────────────────────

function decodeObfVar(s){
  var rev=s.split("").reverse().join("");
  return cryptoJsDecrypt === undefined ? "" : (function(){
    // atob: base64 decode
    var chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    rev=rev.replace(/[^A-Za-z0-9+/]/g,"");
    var missing=rev.length%4;
    if(missing)rev+="====".slice(0,4-missing);
    var bytes=base64ToBytes(rev);
    return bytes.map(function(b){return String.fromCharCode(b);}).join("");
  })();
}

// Düzeltilmiş decodeObfVar
function decodeObf(s){
  var rev=s.split("").reverse().join("");
  var missing=rev.length%4;
  if(missing)rev+="====".slice(0,4-missing);
  var bytes=base64ToBytes(rev);
  return bytes.map(function(b){return String.fromCharCode(b);}).join("");
}

function decryptPlayerPage(html){
  // 1. Direkt m3u8 URL var mı?
  var directM = html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)['"]/i);
  if(directM) return directM[1];

  // 2. CDN URL: one.xxxxx.click/{token}/... formatı
  var cdnM = html.match(/["'](https?:\/\/[^"']+\.click\/[A-Za-z0-9_-]+\/[^"']+\.m3u8[^"']*)['"]/i)
           ||html.match(/["'](https?:\/\/[^"']+\.click\/[^"']+)['"]/i);
  if(cdnM) return cdnM[1];

  // 3. Obfuscated AES decrypt (eski yöntem - fallback)
  var matches=[];
  var re=/_[a-f0-9]{8}=_[a-f0-9]{8}\("([A-Za-z0-9+/=]{20,})"\)/g;
  var m;
  while((m=re.exec(html))!==null)matches.push(m[1]);
  if(matches.length<3){
    console.error("[DiziLife] obf var bulunamadi:"+matches.length);
    return null;
  }

  var sorted=matches.slice().sort(function(a,b){return b.length-a.length;});
  var cipherB64 =decodeObf(sorted[0]);
  var passphrase=decodeObf(sorted[2]);
  var replaceDst=decodeObf(sorted[1]);

  var replaceSrc="?aztsdxdevfqwea";
  var joinM=html.match(/\[([^\]]+)\]\.join\(''\)/);
  if(joinM){try{replaceSrc=joinM[1].split(",").map(function(s){return s.replace(/['"]/g,"").trim();}).join("");}catch(e){}}

  console.log("[DiziLife] AES decrypt: passphrase="+passphrase.substring(0,8)+"...");
  try{
    var decrypted=cryptoJsDecrypt(cipherB64,passphrase);
    if(replaceDst&&replaceSrc)decrypted=decrypted.split(replaceSrc).join(replaceDst);
    var urlM=decrypted.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/i);
    return urlM?urlM[0]:null;
  }catch(e){console.error("[DiziLife] decrypt hatasi:"+e.message);return null;}
}

// ─── URL çözümleme ───────────────────────────────────────────────────────────

function extractPlayerUrl(html){
  var m=html.match(/(https?:\/\/dcdl[a-z0-9]+\.xyz\/player\/[A-Za-z0-9_-]+)/i)
     ||html.match(/href=["'](https?:\/\/[^"']+\/player\/[A-Za-z0-9_-]+)["']/i);
  return m?m[1]:null;
}

function similarity(a,b){
  if(!a||!b)return 0;
  a=a.toLowerCase();b=b.toLowerCase();
  if(a===b)return 1;
  if(a.indexOf(b)!==-1||b.indexOf(a)!==-1)return 0.8;
  var aw=a.split(/\s+/),bw=b.split(/\s+/),c=0;
  aw.forEach(function(w){if(bw.indexOf(w)!==-1&&w.length>1)c++;});
  return c/Math.max(aw.length,bw.length);
}

function trySlug(slug,season,episode,mediaType){
  var url=mediaType==="movie"
    ?BASE_URL+"/film/"+slug
    :BASE_URL+"/dizi/"+slug+"/sezon/"+season+"/bolum/"+episode;
  return get(url,BASE_URL+"/")
    .then(function(html){
      var p=extractPlayerUrl(html);
      return p?{playerUrl:p,pageUrl:url}:null;
    })
    .catch(function(){return null;});
}

function searchSlug(info,mediaType){
  var q=info.title||info.origTitle;
  return get(BASE_URL+"/ara?q="+encodeURIComponent(q),BASE_URL+"/")
    .then(function(html){
      var prefix=mediaType==="movie"?"/film/":"/dizi/";
      var re2=new RegExp("href=[\"']"+prefix+"([^\"'/]+)[\"']","g");
      var seen={},results=[],m;
      while((m=re2.exec(html))!==null)if(!seen[m[1]]){seen[m[1]]=1;results.push(m[1]);}
      var best=null,bestScore=0.25;
      results.forEach(function(sl){
        var s=Math.max(similarity(sl.replace(/-/g," "),(info.title||"").toLowerCase()),
                       similarity(sl.replace(/-/g," "),(info.origTitle||"").toLowerCase()));
        if(s>bestScore){bestScore=s;best=sl;}
      });
      return best;
    })
    .catch(function(){return null;});
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function getStreams(tmdbId,mediaType,season,episode){
  console.log("[DiziLife] "+tmdbId+" "+mediaType+" S"+season+"E"+episode);
  var hdrs={"Referer":BASE_URL+"/","Origin":BASE_URL,"User-Agent":UA};

  return getTmdbInfo(tmdbId,mediaType)
    .then(function(info){
      console.log("[DiziLife] "+info.title+" / "+info.origTitle);
      var slugs=[];
      var s1=trSlug(info.origTitle),s2=trSlug(info.title);
      if(s1)slugs.push(s1);
      if(s2&&s2!==s1)slugs.push(s2);

      function tryNext(i){
        if(i>=slugs.length){
          return searchSlug(info,mediaType).then(function(found){
            if(!found)return null;
            console.log("[DiziLife] Arama: "+found);
            return trySlug(found,season,episode,mediaType);
          });
        }
        return trySlug(slugs[i],season,episode,mediaType)
          .then(function(r){return r||tryNext(i+1);});
      }
      return tryNext(0);
    })
    .then(function(result){
      if(!result){console.warn("[DiziLife] bulunamadi");return[];}
      console.log("[DiziLife] player="+result.playerUrl);
      var playerUrl = result.playerUrl;
      var tokenM = playerUrl.match(/\/player\/([A-Za-z0-9_-]+)/);
      var token = tokenM ? tokenM[1] : null;

      if (!token) { console.warn("[DiziLife] token alinamadi"); return []; }

      // Token aynı, domain farklı:
      // /player/{token} → one.82b6b2a6748f1e.click/{token}/master.m3u8
      var CDN = "https://one.82b6b2a6748f1e.click";
      var m3u8 = CDN + "/" + token + "/master.m3u8";
      console.log("[DiziLife] CDN m3u8=" + m3u8);

      return [{
        name:    "DiziLife",
        title:   "DiziLife",
        url:     m3u8,
        quality: "1080p",
        headers: hdrs,
      }];
    })
    .catch(function(err){console.error("[DiziLife] "+err.message);return[];});
}

module.exports={getStreams:getStreams};
