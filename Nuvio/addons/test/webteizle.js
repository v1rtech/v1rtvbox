// ============================================================
//  WebteIzle — Nuvio Provider  v10
// ============================================================

var BASE_URL     = 'https://webteizle3.xyz';
var TMDB_API_KEY = '500330721680edb6d5f7f12ba7cd9023';

var HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
  'Referer': BASE_URL + '/'
};

// ═══════════════════════════════════════════════════════════
//  YARDIMCILAR
// ═══════════════════════════════════════════════════════════

function getCrypto() {
  if (typeof crypto !== 'undefined' && crypto && crypto.subtle) return crypto;
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) return globalThis.crypto;
  if (typeof self !== 'undefined' && self.crypto && self.crypto.subtle) return self.crypto;
  return null;
}

// güvenli random — crypto.getRandomValues varsa kullan, yoksa Math.random
function secureRandom(n) {
  var buf = new Uint8Array(n);
  var c = typeof crypto !== 'undefined' ? crypto
        : (typeof globalThis !== 'undefined' ? globalThis.crypto : null);
  if (c && c.getRandomValues) {
    c.getRandomValues(buf);
  } else {
    for (var i = 0; i < n; i++) buf[i] = Math.random() * 256 | 0;
  }
  return buf;
}

function b64urlToBytes(str) {
  var b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  var bin = atob(b64);
  var out = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64url(buf) {
  var bytes = new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer || buf);
  // normalise — typed array'in tamamını al
  if (buf instanceof Uint8Array) bytes = buf;
  var bin = '';
  for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function randomHex(n) {
  return Array.from(secureRandom(n)).map(function(b) { return ('0' + b.toString(16)).slice(-2); }).join('');
}

function cookieStr(map) {
  return Object.keys(map).map(function(k) { return k + '=' + map[k]; }).join('; ');
}
function parseCookies(header, map) {
  if (!header) return;
  header.split(',').forEach(function(c) {
    var kv = c.trim().split(';')[0]; var eq = kv.indexOf('=');
    if (eq > 0) map[kv.slice(0, eq).trim()] = kv.slice(eq + 1);
  });
}

// ═══════════════════════════════════════════════════════════
//  PURE-JS SHA-256
//  (kullanılır: ECDSA signing için mesaj hash'i)
// ═══════════════════════════════════════════════════════════
var _SHA256_K = [
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
];

function sha256(data) {
  var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  var len = data.length;
  var padLen = Math.ceil((len + 9) / 64) * 64;
  var padded = new Uint8Array(padLen);
  padded.set(data);
  padded[len] = 0x80;
  var bitHi = Math.floor(len * 8 / 0x100000000);
  var bitLo = (len * 8) >>> 0;
  var dv = new DataView(padded.buffer);
  dv.setUint32(padLen - 8, bitHi >>> 0);
  dv.setUint32(padLen - 4, bitLo >>> 0);

  var rot = function(x, n) { return (x >>> n) | (x << (32 - n)); };
  var w = new Array(64);

  for (var i = 0; i < padLen; i += 64) {
    for (var j = 0; j < 16; j++) w[j] = dv.getUint32(i + j * 4);
    for (var j = 16; j < 64; j++) {
      var s0 = rot(w[j-15],7) ^ rot(w[j-15],18) ^ (w[j-15] >>> 3);
      var s1 = rot(w[j-2],17) ^ rot(w[j-2],19)  ^ (w[j-2]  >>> 10);
      w[j] = (w[j-16] + s0 + w[j-7] + s1) >>> 0;
    }
    var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for (var j = 0; j < 64; j++) {
      var S1  = rot(e,6) ^ rot(e,11) ^ rot(e,25);
      var ch  = (e & f) ^ (~e & g);
      var t1  = (h + S1 + ch + _SHA256_K[j] + w[j]) >>> 0;
      var S0  = rot(a,2) ^ rot(a,13) ^ rot(a,22);
      var maj = (a & b) ^ (a & c) ^ (b & c);
      var t2  = (S0 + maj) >>> 0;
      h=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;
    }
    H[0]=(H[0]+a)>>>0; H[1]=(H[1]+b)>>>0; H[2]=(H[2]+c)>>>0; H[3]=(H[3]+d)>>>0;
    H[4]=(H[4]+e)>>>0; H[5]=(H[5]+f)>>>0; H[6]=(H[6]+g)>>>0; H[7]=(H[7]+h)>>>0;
  }

  var out = new Uint8Array(32);
  var dvo = new DataView(out.buffer);
  for (var i = 0; i < 8; i++) dvo.setUint32(i * 4, H[i]);
  return out;
}

// ═══════════════════════════════════════════════════════════
//  PURE-JS P-256 ECDSA  (BigInt required — Hermes 0.11+)
// ═══════════════════════════════════════════════════════════
var _EC = (function() {
  var p  = BigInt('0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF');
  var a  = BigInt('0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC');
  var n  = BigInt('0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551');
  var Gx = BigInt('0x6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296');
  var Gy = BigInt('0x4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5');
  var _0 = BigInt(0), _1 = BigInt(1), _2 = BigInt(2), _3 = BigInt(3);

  function mod(x, m) { return ((x % m) + m) % m; }

  function inv(a, m) {
    var r=m, nr=mod(a,m), t=_0, nt=_1, q, tmp;
    while (nr !== _0) {
      q=r/nr;
      tmp=r-q*nr; r=nr; nr=tmp;
      tmp=t-q*nt; t=nt; nt=tmp;
    }
    return mod(t, m);
  }

  // Affine point add/double (null = point at infinity)
  function add(P, Q) {
    if (!P) return Q;
    if (!Q) return P;
    var x1=P[0],y1=P[1],x2=Q[0],y2=Q[1];
    if (x1===x2) {
      if (y1!==y2) return null;
      // double
      var l=mod((_3*x1*x1+a)*inv(_2*y1,p),p);
      var x3=mod(l*l-_2*x1,p);
      return [x3, mod(l*(x1-x3)-y1,p)];
    }
    var l2=mod((y2-y1)*inv(x2-x1,p),p);
    var x3=mod(l2*l2-x1-x2,p);
    return [x3, mod(l2*(x1-x3)-y1,p)];
  }

  function mul(k, P) {
    var R=null, A=P;
    while (k>_0) { if (k&_1) R=add(R,A); A=add(A,A); k>>=_1; }
    return R;
  }

  var G=[Gx,Gy];

  function fromBytes(bytes) {
    var hex='';
    for (var i=0;i<bytes.length;i++) hex+=('0'+bytes[i].toString(16)).slice(-2);
    return BigInt('0x'+hex);
  }
  function toBytes32(bi) {
    var hex=bi.toString(16).padStart(64,'0');
    var out=new Uint8Array(32);
    for (var i=0;i<32;i++) out[i]=parseInt(hex.slice(i*2,i*2+2),16);
    return out;
  }

  // Text encode UTF-8
  function encodeUtf8(str) {
    var bytes=[], i=0;
    while(i<str.length){
      var c=str.charCodeAt(i);
      if(c<0x80){bytes.push(c);}
      else if(c<0x800){bytes.push(0xC0|(c>>6),0x80|(c&0x3F));}
      else{bytes.push(0xE0|(c>>12),0x80|((c>>6)&0x3F),0x80|(c&0x3F));}
      i++;
    }
    return new Uint8Array(bytes);
  }

  function genKey() {
    var db, d;
    do {
      db = secureRandom(32);
      d  = mod(fromBytes(db), n-_1)+_1;
    } while (d===_0);
    var Q = mul(d, G);
    return { d:d, x:Q[0], y:Q[1], xBytes:toBytes32(Q[0]), yBytes:toBytes32(Q[1]), dBytes:toBytes32(d) };
  }

  function sign(key, message) {
    // message is a string (nonce)
    var msgBytes = encodeUtf8(message);
    var hash = sha256(msgBytes);
    var e = fromBytes(hash);
    var d = key.d;
    var r, s, k;
    var attempts = 0;
    do {
      do {
        var kb = secureRandom(32);
        k = mod(fromBytes(kb), n-_1)+_1;
        var R = mul(k, G);
        r = mod(R[0], n);
        attempts++;
        if (attempts > 100) throw new Error('ECDSA sign: too many retries');
      } while (r===_0);
      s = mod(inv(k,n)*(e+r*d), n);
    } while (s===_0);
    var sig = new Uint8Array(64);
    sig.set(toBytes32(r), 0);
    sig.set(toBytes32(s), 32);
    return sig;
  }

  // Export public key as JWK (for attest body)
  function pubJwk(key) {
    return {
      kty: 'EC',
      crv: 'P-256',
      x: bytesToB64url(key.xBytes),
      y: bytesToB64url(key.yBytes),
      key_ops: ['verify'],
      ext: true
    };
  }

  return { genKey: genKey, sign: sign, pubJwk: pubJwk };
})();

// ═══════════════════════════════════════════════════════════
//  FILEMOON ECDSA: crypto.subtle varsa native, yoksa pure-JS
// ═══════════════════════════════════════════════════════════

function fmGenerateAndSign(nonce) {
  var c = getCrypto();

  if (c) {
    // Native path — crypto.subtle
    return c.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
      .then(function(kp) {
        return c.subtle.sign(
          { name: 'ECDSA', hash: { name: 'SHA-256' } },
          kp.privateKey,
          new TextEncoder().encode(nonce)
        ).then(function(sig) {
          return c.subtle.exportKey('jwk', kp.publicKey).then(function(pub) {
            return { signature: bytesToB64url(new Uint8Array(sig)), public_key: pub };
          });
        });
      });
  }

  // Pure-JS fallback (Hermes / no crypto.subtle)
  try {
    if (typeof BigInt === 'undefined') throw new Error('BigInt yok');
    var key = _EC.genKey();
    var sig = _EC.sign(key, nonce);
    return Promise.resolve({
      signature:  bytesToB64url(sig),
      public_key: _EC.pubJwk(key)
    });
  } catch(e) {
    return Promise.reject(new Error('ECDSA fallback hata: ' + e.message));
  }
}

// AES-256-GCM decrypt — crypto.subtle varsa native, yoksa pure-JS
// Nuvio QuickJS engine'de crypto.subtle YOK, pure-JS fallback kullanılır
function aesGcmDecrypt(keyBytes, ivBytes, dataBytes) {
  // native path
  var c = getCrypto();
  if (c && c.subtle) {
    return c.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt'])
      .then(function(k) { return c.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, k, dataBytes); })
      .then(function(buf) {
        var bytes = new Uint8Array(buf), str = '';
        for (var i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
        return str;
      });
  }
  // pure-JS AES-256-GCM (Nuvio/QuickJS için)
  try {
    var plain = aesGcmDecryptPure(keyBytes, ivBytes, dataBytes);
    if (plain === null) return Promise.reject(new Error('AES-GCM auth tag hatası'));
    return Promise.resolve(plain);
  } catch(e) {
    return Promise.reject(e);
  }
}

// ── Pure-JS AES-256-GCM ────────────────────────────────────────
// Pure-JS AES-256-GCM — Nuvio QuickJS için

// Sabit AES S-box
var _AES_SBOX = [
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
];
var _AES_RCON = [0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36,0x6c,0xd8,0xab,0x4d];

function _xtime(b) { return ((b<<1)^(b&0x80?0x1b:0))&0xff; }
function _mul(a,b) {
  var r=0;
  while(b){if(b&1)r^=a;a=_xtime(a);b>>=1;}
  return r;
}

function _aesKeySchedule256(key) {
  var w = new Array(60);
  for(var i=0;i<8;i++)
    w[i]=(key[4*i]<<24)|(key[4*i+1]<<16)|(key[4*i+2]<<8)|key[4*i+3];
  for(var i=8;i<60;i++){
    var t=w[i-1];
    if(i%8===0){
      t=(((_AES_SBOX[(t>>>16)&0xff])<<24)|((_AES_SBOX[(t>>>8)&0xff])<<16)|
         ((_AES_SBOX[t&0xff])<<8)|(_AES_SBOX[(t>>>24)&0xff]))^(_AES_RCON[i/8-1]<<24);
    } else if(i%8===4){
      t=((_AES_SBOX[(t>>>24)&0xff])<<24)|((_AES_SBOX[(t>>>16)&0xff])<<16)|
        ((_AES_SBOX[(t>>>8)&0xff])<<8)|(_AES_SBOX[t&0xff]);
    }
    w[i]=(w[i-8]^t)>>>0;
  }
  return w;
}

function _aesEncryptBlock(blk, w) {
  var s=new Uint8Array(16), t=new Uint8Array(16);
  for(var i=0;i<16;i++) s[i]=blk[i]^((w[i>>2]>>>(24-8*(i&3)))&0xff);
  for(var r=1;r<=14;r++){
    // SubBytes + ShiftRows
    t[0]=_AES_SBOX[s[0]]; t[1]=_AES_SBOX[s[5]]; t[2]=_AES_SBOX[s[10]]; t[3]=_AES_SBOX[s[15]];
    t[4]=_AES_SBOX[s[4]]; t[5]=_AES_SBOX[s[9]]; t[6]=_AES_SBOX[s[14]]; t[7]=_AES_SBOX[s[3]];
    t[8]=_AES_SBOX[s[8]]; t[9]=_AES_SBOX[s[13]]; t[10]=_AES_SBOX[s[2]]; t[11]=_AES_SBOX[s[7]];
    t[12]=_AES_SBOX[s[12]]; t[13]=_AES_SBOX[s[1]]; t[14]=_AES_SBOX[s[6]]; t[15]=_AES_SBOX[s[11]];
    if(r<14){
      // MixColumns
      for(var c=0;c<4;c++){
        var a0=t[c*4],a1=t[c*4+1],a2=t[c*4+2],a3=t[c*4+3];
        s[c*4]  =_xtime(a0)^_xtime(a1)^a1^a2^a3;
        s[c*4+1]=a0^_xtime(a1)^_xtime(a2)^a2^a3;
        s[c*4+2]=a0^a1^_xtime(a2)^_xtime(a3)^a3;
        s[c*4+3]=_xtime(a0)^a0^a1^a2^_xtime(a3);
      }
    } else {
      for(var i=0;i<16;i++) s[i]=t[i];
    }
    // AddRoundKey
    for(var i=0;i<16;i++) s[i]^=(w[r*4+(i>>2)]>>>(24-8*(i&3)))&0xff;
  }
  return s;
}

// GCM: GF(2^128) multiply
function _gmul128(x, y) {
  var z=new Uint8Array(16), v=new Uint8Array(y);
  for(var i=0;i<128;i++){
    if(x[i>>3]&(0x80>>(i&7)))
      for(var j=0;j<16;j++) z[j]^=v[j];
    var lsb=v[15]&1;
    for(var j=15;j>0;j--) v[j]=(v[j]>>1)|((v[j-1]&1)<<7);
    v[0]>>=1;
    if(lsb) v[0]^=0xe1;
  }
  return z;
}

function _ghash(H, data) {
  var y=new Uint8Array(16);
  for(var i=0;i<data.length;i+=16){
    var blk=new Uint8Array(16);
    for(var j=0;j<16&&i+j<data.length;j++) blk[j]=data[i+j];
    for(var j=0;j<16;j++) y[j]^=blk[j];
    y=_gmul128(y,H);
  }
  return y;
}

function aesGcmDecryptPure(key, iv, data) {
  var w = _aesKeySchedule256(new Uint8Array(key));
  // H = AES(key, 0^128)
  var H = _aesEncryptBlock(new Uint8Array(16), w);
  // J0 (IV=12 bytes)
  var J0 = new Uint8Array(16);
  for(var i=0;i<12;i++) J0[i]=iv[i]; J0[15]=0x01;
  // Split ciphertext + tag
  var ctLen = data.length - 16;
  var ct  = data.slice(0, ctLen);
  var tag = data.slice(ctLen);
  // CTR decrypt starting from J0+1
  var ctr = new Uint8Array(J0); ctr[15]=0x02;
  var plain = new Uint8Array(ctLen);
  for(var i=0;i<ctLen;i+=16){
    var ks=_aesEncryptBlock(ctr, w);
    for(var j=0;j<16&&i+j<ctLen;j++) plain[i+j]=ct[i+j]^ks[j];
    for(var k=15;k>=12;k--){ctr[k]=(ctr[k]+1)&0xff;if(ctr[k]!==0)break;}
  }
  // Compute auth tag: GHASH(H, pad(CT) || len64(0) || len64(CT))
  var padLen = (16-ctLen%16)%16;
  var ghashData = new Uint8Array(ctLen + padLen + 16);
  for(var i=0;i<ctLen;i++) ghashData[i]=ct[i];
  // len64(AAD)=0, len64(CT) in bits, big-endian
  var ctBits = ctLen * 8;
  ghashData[ghashData.length-1] = ctBits & 0xff;
  ghashData[ghashData.length-2] = (ctBits>>>8) & 0xff;
  ghashData[ghashData.length-3] = (ctBits>>>16) & 0xff;
  ghashData[ghashData.length-4] = (ctBits>>>24) & 0xff;
  var S = _ghash(H, ghashData);
  var J0enc = _aesEncryptBlock(J0, w);
  var computed = new Uint8Array(16);
  for(var i=0;i<16;i++) computed[i]=S[i]^J0enc[i];
  // Constant-time compare
  var diff=0;
  for(var i=0;i<16;i++) diff|=(computed[i]^tag[i]);
  if(diff!==0){ console.log('Tag mismatch! computed='+Buffer.from(computed).toString('hex')+' got='+Buffer.from(tag).toString('hex')); return null; }
  var str='';
  for(var i=0;i<plain.length;i++) str+=String.fromCharCode(plain[i]);
  return str;
}

// ═══════════════════════════════════════════════════════════
//  TMDB + SAYFA BULMA
// ═══════════════════════════════════════════════════════════

function fetchTmdbInfo(tmdbId, mediaType) {
  var endpoint = (mediaType === 'tv') ? 'tv' : 'movie';
  return fetch('https://api.themoviedb.org/3/' + endpoint + '/' + tmdbId
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

function titleToSlug(t) {
  return (t || '').toLowerCase()
    .replace(/\u011f/g,'g').replace(/\u00fc/g,'u').replace(/\u015f/g,'s')
    .replace(/\u0131/g,'i').replace(/\u0130/g,'i').replace(/\u00f6/g,'o').replace(/\u00e7/g,'c')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function findFilmPage(titleTr, titleEn, mediaType, season, episode) {
  var slugTr = titleToSlug(titleTr);
  var slugEn = titleToSlug(titleEn);
  var candidates = [];

  if (mediaType === 'tv' && season && episode) {
    // Dizi: direkt bölüm URL'si dene
    var suffix = '/' + season + '-sezon-' + episode + '-bolum';
    if (slugTr) {
      candidates.push(BASE_URL + '/izle/dublaj/'  + slugTr + suffix);
      candidates.push(BASE_URL + '/izle/altyazi/' + slugTr + suffix);
    }
    if (slugEn && slugEn !== slugTr) {
      candidates.push(BASE_URL + '/izle/dublaj/'  + slugEn + suffix);
      candidates.push(BASE_URL + '/izle/altyazi/' + slugEn + suffix);
    }
  } else {
    // Film: ana sayfa
    if (slugTr) {
      candidates.push(BASE_URL + '/izle/dublaj/'  + slugTr);
      candidates.push(BASE_URL + '/izle/altyazi/' + slugTr);
    }
    if (slugEn && slugEn !== slugTr) {
      candidates.push(BASE_URL + '/izle/dublaj/'  + slugEn);
      candidates.push(BASE_URL + '/izle/altyazi/' + slugEn);
    }
  }

  function tryNext(i) {
    if (i >= candidates.length) return searchFallback(titleTr, titleEn, mediaType, season, episode);
    return fetch(candidates[i], { headers: HEADERS })
      .then(function(r) {
        if (!r.ok) return tryNext(i + 1);
        return r.text().then(function(html) {
          if (html.indexOf('data-id') === -1) return tryNext(i + 1);
          // Dizi sayfasında data-s= olmalı
          if (mediaType === 'tv' && html.indexOf('data-s=') === -1) return tryNext(i + 1);
          return { url: candidates[i], html: html };
        });
      }).catch(function() { return tryNext(i + 1); });
  }
  return tryNext(0);
}

function searchFallback(titleTr, titleEn, mediaType, season, episode) {
  return fetch(BASE_URL + '/ajax/arama.asp', {
    method: 'POST',
    headers: Object.assign({}, HEADERS, {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest'
    }),
    body: 'q=' + encodeURIComponent(titleTr || titleEn)
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    var filmler = (data.results && data.results.filmler && data.results.filmler.results) || [];
    var diziler = (data.results && data.results.diziler && data.results.diziler.results) || [];
    var items = (mediaType === 'tv') ? diziler.concat(filmler) : filmler.concat(diziler);
    if (!items.length) throw new Error('Icerik bulunamadi');
    var pageUrl = items[0].url.startsWith('http') ? items[0].url : BASE_URL + items[0].url;
    if (mediaType === 'tv' && season && episode) {
      pageUrl = pageUrl.replace(/\/?$/, '') + '/' + season + '-sezon-' + episode + '-bolum';
    }
    return fetch(pageUrl, { headers: HEADERS })
      .then(function(r) { return r.text().then(function(html) { return { url: pageUrl, html: html }; }); });
  });
}

function parseFilmId(html) {
  var m = html.match(/data-id="(\d+)"[^>]*id="wip"/)
       || html.match(/id="wip"[^>]*data-id="(\d+)"/)
       || html.match(/data-id="(\d+)"/);
  return m ? m[1] : null;
}

function parseDilList(html, pageUrl) {
  var d = [];
  if (html.indexOf('/izle/dublaj/')  !== -1 || pageUrl.indexOf('/izle/dublaj/')  !== -1) d.push({ dil: '0', ad: 'TR Dublaj' });
  if (html.indexOf('/izle/altyazi/') !== -1 || pageUrl.indexOf('/izle/altyazi/') !== -1) d.push({ dil: '1', ad: 'TR Altyazı' });
  if (!d.length) { d.push({ dil: '0', ad: 'TR Dublaj' }); d.push({ dil: '1', ad: 'TR Altyazı' }); }
  return d;
}

function fetchAlternatifler(filmId, dil, season, episode) {
  return fetch(BASE_URL + '/ajax/dataAlternatif3.asp', {
    method: 'POST',
    headers: Object.assign({}, HEADERS, {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': BASE_URL
    }),
    body: 'filmid=' + filmId + '&dil=' + dil + '&s=' + (season || '') + '&b=' + (episode || '') + '&bot=0'
  })
  .then(function(r) { return r.json(); })
  .then(function(d) { return (d.status === 'success' && Array.isArray(d.data)) ? d.data : []; });
}

function fetchEmbedData(embedId) {
  return fetch(BASE_URL + '/ajax/dataEmbed.asp', {
    method: 'POST',
    headers: Object.assign({}, HEADERS, {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': BASE_URL
    }),
    body: 'id=' + embedId
  })
  .then(function(r) { return r.text(); })
  .then(function(html) {
    var mIframe = html.match(/<iframe[^>]+src="([^"]+)"/i);
    if (mIframe) {
      var iSrc = mIframe[1];
      // bysezoxexe / 398fitus / filemoon → slug çıkar, filemoon tipine yönlendir
      var fmSlugM = iSrc.match(/\/(?:e|ys8|je8|s8w|7szbi|od7ha|v|f|embed)\/([a-zA-Z0-9]+)/);
      if (fmSlugM && (iSrc.indexOf('bysezoxexe') !== -1 || iSrc.indexOf('398fitus') !== -1 || iSrc.indexOf('filemoon') !== -1)) {
        return { type: 'filemoon', videoId: fmSlugM[1], iframeSrc: iSrc };
      }
      return { type: 'iframe', url: iSrc };
    }
    var mFm = html.match(/filemoon\s*\(\s*['"]([^'"]+)['"]/i);
    if (mFm) return { type: 'filemoon', videoId: mFm[1] };
    var mVm = html.match(/vidmoly\s*\(\s*['"]([^'"]+)['"]/i);
    if (mVm) return { type: 'vidmoly', videoId: mVm[1] };
    var mMr = html.match(/mailru\s*\(\s*['"]([^'"]+)['"]/i);
    if (mMr) return { type: 'mailru', videoId: mMr[1] };
    return null;
  });
}

// ═══════════════════════════════════════════════════════════
//  PROVIDER: VidMoly
// ═══════════════════════════════════════════════════════════
function extractVidMoly(videoId) {
  var url = 'https://vidmoly.net/embed-' + videoId + '.html';
  return fetch(url, { headers: Object.assign({}, HEADERS, { 'Referer': BASE_URL + '/' }) })
    .then(function(r) { return r.text(); })
    .then(function(html) {
      var m = html.match(/file\s*:\s*['"]?(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
      return m ? { url: m[1], type: 'hls', referer: url } : null;
    })
    .catch(function() { return null; });
}

// ═══════════════════════════════════════════════════════════
//  PROVIDER: FileMoon (ECDSA-P256 + AES-256-GCM)
// ═══════════════════════════════════════════════════════════
var FM_API    = 'https://398fitus.com';
var FM_DOMAIN = 'bysezoxexe.com';

function fmBaseH(cookies, playerDomain) {
  var domain = playerDomain || FM_DOMAIN;
  var h = {
    'User-Agent':      HEADERS['User-Agent'],
    'Accept':          'application/json, */*',
    'Accept-Language': 'tr-TR,tr;q=0.7',
    'Origin':          'https://' + domain,
    'Referer':         'https://' + domain + '/'
  };
  if (cookies && Object.keys(cookies).length) h['Cookie'] = cookieStr(cookies);
  return h;
}

function fmEmbedH(videoId) {
  return {
    'x-embed-origin':  BASE_URL.replace('https://', ''),
    'x-embed-parent':  'https://' + FM_DOMAIN + '/e/' + videoId,
    'x-embed-referer': BASE_URL + '/'
  };
}

function extractFileMoon(videoId, iframeSrc) {
  var cookies  = {};
  var viewerId = randomHex(16);
  var deviceId = randomHex(16);

  // playerDomain: iframeSrc'den belirle
  // playerApi her zaman 398fitus.com — bysezoxexe.com embed'i de 398fitus üzerinden çalışıyor
  var playerApi    = FM_API;         // https://398fitus.com
  var playerDomain = '398fitus.com';
  if (iframeSrc) {
    if (iframeSrc.indexOf('filemoon.sx') !== -1) { playerApi = 'https://filemoon.sx'; playerDomain = 'filemoon.sx'; }
    else if (iframeSrc.indexOf('filemoon.to') !== -1) { playerApi = 'https://filemoon.to'; playerDomain = 'filemoon.to'; }
    // bysezoxexe.com ve 398fitus.com → her ikisi de FM_API=398fitus.com kullanır
  }

  // 1) Settings — cookie al, hata olursa devam et
  return fetch(playerApi + '/api/videos/' + videoId + '/embed/settings', {
    headers: Object.assign(fmBaseH(cookies, playerDomain), fmEmbedH(videoId))
  })
  .then(function(r) { parseCookies(r.headers.get('set-cookie'), cookies); return r.text(); })
  .catch(function() { return ''; })

  // 1b) embed/view — browser'ın yaptığı gibi view kaydı (heartbeat token için şart)
  .then(function() {
    return fetch(playerApi + '/api/videos/' + videoId + '/embed/view', {
      method: 'POST',
      headers: Object.assign(fmBaseH(cookies, playerDomain), fmEmbedH(videoId), { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ viewer_id: viewerId })
    })
    .then(function(r) { parseCookies(r.headers.get('set-cookie'), cookies); return r.text(); })
    .catch(function() { return ''; });
  })

  // 2) Challenge
  .then(function() {
    return fetch(playerApi + '/api/videos/access/challenge', {
      method: 'POST',
      headers: Object.assign(fmBaseH(cookies, playerDomain), { 'Content-Type': 'application/json' }),
      body: ''
    });
  })
  .then(function(r) { parseCookies(r.headers.get('set-cookie'), cookies); return r.json(); })

  // 3) ECDSA sign + Attest
  .then(function(ch) {
    if (!ch.challenge_id) throw new Error('challenge_id yok');
    return fmGenerateAndSign(ch.nonce).then(function(ec) {
      var body = {
        viewer_id: viewerId, device_id: deviceId,
        challenge_id: ch.challenge_id, nonce: ch.nonce,
        signature: ec.signature, public_key: ec.public_key,
        client: {
          user_agent: HEADERS['User-Agent'],
          architecture: 'x86', bitness: '64',
          platform: 'Windows', platform_version: '10.0.0', model: '',
          ua_full_version: '137.0.0.0',
          brand_full_versions: [{ brand: 'Firefox', version: '137.0.0.0' }],
          pixel_ratio: 1, screen_width: 1920, screen_height: 1080,
          color_depth: 24, languages: ['tr-TR', 'tr'],
          timezone: 'Europe/Istanbul', hardware_concurrency: 4,
          device_memory: 8, touch_points: 0,
          webgl_vendor: 'Mozilla', webgl_renderer: 'Mozilla',
          canvas_hash: bytesToB64url(secureRandom(32)),
          audio_hash:  bytesToB64url(secureRandom(32)),
          pointer_type: 'fine,mouse',
          extra: { vendor: 'Mozilla', appVersion: '5.0 (Windows)' }
        },
        storage: {
          cookie: viewerId, local_storage: viewerId,
          indexed_db: viewerId + ':' + deviceId,
          cache_storage: viewerId + ':' + deviceId
        },
        attributes: { entropy: 'high' }
      };
      return fetch(playerApi + '/api/videos/access/attest', {
        method: 'POST',
        headers: Object.assign(fmBaseH(cookies, playerDomain), { 'Content-Type': 'application/json' }),
        body: JSON.stringify(body)
      });
    });
  })
  .then(function(r) { parseCookies(r.headers.get('set-cookie'), cookies); return r.json(); })

  // 4) Playback — fingerprint wrapper
  .then(function(at) {
    if (!at.token) throw new Error('attest token yok: ' + JSON.stringify(at).slice(0, 100));
    console.log('[WebteIzle] FileMoon attest OK confidence=' + at.confidence);
    return fetch(playerApi + '/api/videos/' + videoId + '/embed/playback', {
      method: 'POST',
      headers: Object.assign(fmBaseH(cookies, playerDomain), fmEmbedH(videoId), { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        fingerprint: {
          token:      at.token,
          viewer_id:  at.viewer_id,
          device_id:  at.device_id,
          confidence: at.confidence
        }
      })
    });
  })
  .then(function(r) { return r.json(); })

  // 5) AES-256-GCM decrypt
  .then(function(data) {
    if (!data || !data.playback) throw new Error('playback yok');
    var pb = data.playback;
    var kp = pb.key_parts;
    if (!kp || kp.length < 2) throw new Error('key_parts eksik');
    var k0 = b64urlToBytes(kp[0]);
    var k1 = b64urlToBytes(kp[1]);
    var key = new Uint8Array(k0.length + k1.length);
    key.set(k0); key.set(k1, k0.length);
    return aesGcmDecrypt(key, b64urlToBytes(pb.iv), b64urlToBytes(pb.payload));
  })

  // 6) Parse sources → m3u8 URL
  .then(function(plain) {
    var parsed;
    try { parsed = JSON.parse(plain); } catch(e) { throw new Error('JSON parse hata'); }
    var sources = parsed.sources || [];
    if (!sources.length) throw new Error('sources boş');
    // 1080p tercih et
    var best = sources[0];
    for (var i = 0; i < sources.length; i++) {
      if ((sources[i].label || '').indexOf('1080') !== -1 || (sources[i].height || 0) >= 1080) {
        best = sources[i]; break;
      }
    }
    var url = best.url || '';
    if (!url) throw new Error('url boş');
    // Decrypt sonrası URL'de kalabilecek whitespace/boşluk karakterlerini temizle
    url = url.replace(/\s+/g, '');
    // asn parametresi IP'ye bağlı token - boşalt
    url = url.replace(/([?&])asn=[^&]*/g, function(m, sep) { return sep + 'asn='; });
    console.log('[WebteIzle] FileMoon ✓ ' + url.slice(0, 80));

    // Heartbeat — stream token'ını canlı tut (browser da bunu yapıyor)
    // Fire-and-forget: sonucu bekleme
    try {
      fetch(playerApi + '/api/videos/' + videoId + '/embed/heartbeat', {
        method: 'POST',
        headers: Object.assign(fmBaseH(cookies, playerDomain), fmEmbedH(videoId), { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ viewer_id: viewerId, device_id: deviceId })
      }).catch(function() {});
    } catch(e) {}

    return { url: url, type: 'hls', referer: 'https://' + FM_DOMAIN + '/' };
  })
  .catch(function(e) {
    console.error('[WebteIzle] FileMoon hata:', e.message);
    return null;
  });
}

// ═══════════════════════════════════════════════════════════
//  PROVIDER: Mail.ru (Meta API → direct MP4)
// ═══════════════════════════════════════════════════════════
function extractMailRu(videoId) {
  var parts = videoId.split('/');
  if (parts.length < 3) return Promise.resolve(null);
  var mobileUrl = 'https://m.my.mail.ru/' + parts[0] + '/' + parts[1]
                + '/video/' + parts.slice(2).join('/') + '.html?from=videoplayer';
  var mrH = {
    'User-Agent':      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
    'Accept':          'text/html,application/xhtml+xml,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.7',
    'Referer':         BASE_URL + '/'
  };
  return fetch(mobileUrl, { headers: mrH })
    .then(function(r) { return r.text(); })
    .then(function(html) {
      var metaM = html.match(/data-meta-url="([^"]+)"/);
      if (!metaM) { console.error('[WebteIzle] MailRu: data-meta-url yok'); return null; }
      return fetch(metaM[1], {
        headers: { 'User-Agent': mrH['User-Agent'], 'Accept': 'application/json,*/*', 'Referer': mobileUrl }
      })
      .then(function(r2) { return r2.json(); })
      .then(function(meta) {
        var videos = meta.videos || [];
        if (!videos.length) { console.error('[WebteIzle] MailRu: videos boş'); return null; }
        var raw = videos[0].url || '';
        if (!raw) return null;
        if (raw.startsWith('//')) raw = 'https:' + raw;
        console.log('[WebteIzle] MailRu ✓ ' + raw.slice(0, 80));
        return { url: raw, type: 'direct', referer: 'https://my.mail.ru/' };
      });
    })
    .catch(function(e) { console.error('[WebteIzle] MailRu hata:', e.message); return null; });
}

// ═══════════════════════════════════════════════════════════
//  EMBED İŞLEYİCİ
// ═══════════════════════════════════════════════════════════
function processEmbed(embedData, dilAd, movieTitle) {
  var baslik = (embedData.baslik || '').toLowerCase();
  if (baslik === 'pixel' || baslik === 'netu') return Promise.resolve(null);

  var flag     = dilAd.includes('Dublaj') ? '🇹🇷 ' : '🌐 ';
  var q        = (embedData.kalitesi === 1) ? '1080p' : (embedData.kalite || 'Auto');

  return fetchEmbedData(embedData.id).then(function(embed) {
    if (!embed) return null;
    var titleStr = '⌜ WEBTEIZLE ⌟ | ' + (embedData.baslik || 'Kaynak') + ' | ' + flag + dilAd;

    if (embed.type === 'vidmoly') {
      return extractVidMoly(embed.videoId).then(function(s) {
        if (!s) return null;
        return { url: s.url, name: movieTitle, title: titleStr, quality: q,
                 type: 'hls', headers: { 'Referer': s.referer } };
      });
    }

    if (embed.type === 'filemoon') {
      return extractFileMoon(embed.videoId, embed.iframeSrc).then(function(s) {
        if (!s) return null;
        return { url: s.url, name: movieTitle, title: titleStr, quality: q,
                 type: 'hls', headers: { 'Referer': s.referer, 'Origin': 'https://bysezoxexe.com' } };
      });
    }

    if (embed.type === 'mailru') {
      return extractMailRu(embed.videoId).then(function(s) {
        if (!s) return null;
        return { url: s.url, name: movieTitle, title: titleStr, quality: q,
                 type: s.type, headers: { 'Referer': s.referer, 'Origin': 'https://my.mail.ru' } };
      });
    }

    if (embed.type === 'iframe' && embed.url) {
      var src = embed.url.startsWith('//') ? 'https:' + embed.url : embed.url;
      return fetch(src, { headers: Object.assign({}, HEADERS, { 'Referer': BASE_URL + '/' }) })
        .then(function(r) { return r.text(); })
        .then(function(html) {
          var m = html.match(/file\s*:\s*['"]?(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
          if (!m) return null;
          return { url: m[1], name: movieTitle, title: titleStr, quality: q,
                   type: 'hls', headers: { 'Referer': src } };
        })
        .catch(function() { return null; });
    }

    return null;
  });
}

// ═══════════════════════════════════════════════════════════
//  ANA FONKSİYON
// ═══════════════════════════════════════════════════════════
function getStreams(tmdbId, mediaType, season, episode) {
  return fetchTmdbInfo(tmdbId, mediaType)
    .then(function(info) {
      var movieName = info.titleTr || info.titleEn;
      return findFilmPage(info.titleTr, info.titleEn, mediaType, season, episode)
        .then(function(result) {
          var filmId = parseFilmId(result.html);
          if (!filmId) throw new Error('Film ID bulunamadi');
          var diller  = parseDilList(result.html, result.url);
          var streams = [];
          return Promise.all(diller.map(function(d) {
            return fetchAlternatifler(filmId, d.dil, season, episode)
              .then(function(list) {
                return Promise.all(list.map(function(e) {
                  return processEmbed(e, d.ad, movieName);
                }));
              })
              .then(function(results) {
                results.forEach(function(s) { if (s) streams.push(s); });
              });
          })).then(function() { return streams; });
        });
    })
    .catch(function(e) {
      console.error('[WebteIzle] hata:', e.message || e);
      return [];
    });
}

module.exports = { getStreams: getStreams };
