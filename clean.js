// URL整形ロジック(端末内だけで動く。外部通信なし)
const TRACK = /^(utm_.*|fbclid|gclid|gbraid|wbraid|dclid|msclkid|yclid|twclid|ttclid|igsh|igshid|si|feature|pp|mc_eid|mc_cid|_hsenc|_hsmi|spm|scm|share_id|share_source|ref|ref_|referrer|source|cmpid|aff|affid|tag|linkCode|ascsubtag|psc|th)$/i;
const SHORT = /(^|\.)(amzn\.to|amzn\.asia|a\.co|instagr\.am|vt\.tiktok\.com|vm\.tiktok\.com|t\.co|bit\.ly|goo\.gl|ow\.ly|buff\.ly)$/i;

export function extractUrl(text) {
  const m = String(text || '').match(/https?:\/\/[^\s<>"'「」『』]+/i);
  return m ? m[0].replace(/[)\]、。,.!?]+$/, '') : '';
}

export function cleanUrl(raw) {
  const src = extractUrl(raw);
  if (!src) return { error: 'URLが見つかりません' };
  let u;
  try { u = new URL(src); } catch { return { error: 'URLの形式が正しくありません' }; }
  const host = u.hostname.replace(/^(www|m|mobile)\./i, '');
  const notes = [];
  let out;

  if (SHORT.test(host)) notes.push('短縮リンクです。個人情報が残っている可能性があるので、開いて表示されたURLを共有し直すとより確実です');

  if (/(^|\.)amazon\.[a-z.]+$/i.test(host)) {
    const m = u.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/ASIN|product)\/([A-Z0-9]{10})/i);
    out = m ? `${u.protocol}//${u.hostname.replace(/^(m|smile)\./, 'www.')}/dp/${m[1].toUpperCase()}` : `${u.origin}${u.pathname}`;
    if (!m) notes.push('商品ID(ASIN)が見つからないため、パスだけ残しました');
  } else if (/(^|\.)instagram\.com$/i.test(host)) {
    out = `https://www.instagram.com${u.pathname}`;
  } else if (/(^|\.)(x|twitter)\.com$/i.test(host)) {
    out = `https://${u.hostname.replace(/^(www|mobile)\./, '')}${u.pathname}`;
  } else if (/(^|\.)tiktok\.com$/i.test(host)) {
    out = `${u.origin}${u.pathname}`;
  } else if (host === 'youtu.be') {
    const t = u.searchParams.get('t');
    out = `https://youtu.be${u.pathname}${t ? '?t=' + t : ''}`;
  } else if (/(^|\.)youtube\.com$/i.test(host)) {
    const keep = ['v', 't', 'list'].filter(k => u.searchParams.has(k));
    out = `https://www.youtube.com${u.pathname}` + (keep.length ? '?' + keep.map(k => `${k}=${encodeURIComponent(u.searchParams.get(k))}`).join('&') : '');
  } else {
    const p = new URLSearchParams();
    for (const [k, v] of u.searchParams) if (!TRACK.test(k)) p.append(k, v);
    out = `${u.origin}${u.pathname}` + (p.toString() ? '?' + p : '');
  }
  // フラグメント(#...)は常に除去
  return { url: out, before: src, notes, removed: src.length - out.length };
}

export const isShort = u => { try { return SHORT.test(new URL(u).hostname); } catch { return false; } };
