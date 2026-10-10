// 短縮リンクの展開専用。許可リストのドメインのリダイレクトだけを辿り、保存もログ出力もしない。
const ALLOW = /(^|\.)(amzn\.to|amzn\.asia|a\.co|instagr\.am|vt\.tiktok\.com|vm\.tiktok\.com|tiktok\.com|t\.co|bit\.ly|goo\.gl|ow\.ly|buff\.ly|youtu\.be|lnkd\.in|fb\.me|fb\.watch|tinyurl\.com|is\.gd|t\.ly|x\.gd|s\.click\.aliexpress\.com)$/i;
const CORS = { 'access-control-allow-origin': '*', 'cache-control': 'no-store' };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'content-type': 'application/json' } });

export default {
  async fetch(req) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: { ...CORS, 'access-control-allow-methods': 'GET' } });
    let cur;
    try { cur = new URL(new URL(req.url).searchParams.get('u')); } catch { return json({ error: 'bad url' }, 400); }
    if (!/^https?:$/.test(cur.protocol)) return json({ error: 'bad url' }, 400);
    for (let i = 0; i < 6; i++) {
      if (!ALLOW.test(cur.hostname)) break;
      let r;
      try { r = await fetch(cur, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (compatible; CleanLink)' } }); }
      catch { return json({ error: 'fetch failed' }, 502); }
      const loc = r.headers.get('location');
      if (r.status < 300 || r.status >= 400 || !loc) break;
      try { cur = new URL(loc, cur); } catch { break; }
    }
    return json({ url: cur.href });
  },
};
