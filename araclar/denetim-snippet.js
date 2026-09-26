(function audit(options) {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const paint = canvas.getContext('2d', { willReadFrequently: true });
  const memo = new Map();
  const colour = (value) => {
    if (memo.has(value)) return memo.get(value);
    paint.clearRect(0, 0, 1, 1);
    paint.fillStyle = '#000';
    paint.fillStyle = value;
    paint.fillRect(0, 0, 1, 1);
    const d = paint.getImageData(0, 0, 1, 1).data;
    const c = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    memo.set(value, c);
    return c;
  };
  const over = (top, bottom) => {
    const a = top.a + bottom.a * (1 - top.a);
    if (a <= 0) return { r: 0, g: 0, b: 0, a: 0 };
    const mix = (x, y) => (x * top.a + y * bottom.a * (1 - top.a)) / a;
    return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a };
  };
  const linear = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const lum = (c) => 0.2126 * linear(c.r) + 0.7152 * linear(c.g) + 0.0722 * linear(c.b);
  const ratio = (x, y) => {
    const a = lum(x);
    const b = lum(y);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  const hex = (c) => '#' + [c.r, c.g, c.b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');
  const selector = (el) => {
    const parts = [];
    for (let n = el; n && n.nodeType === 1 && parts.length < 4; n = n.parentElement) {
      let s = n.tagName.toLowerCase();
      if (n.id) {
        parts.unshift(s + '#' + n.id);
        break;
      }
      const cls = Array.from(n.classList).slice(0, 2);
      if (cls.length) s += '.' + cls.join('.');
      parts.unshift(s);
    }
    return parts.join(' > ');
  };
  const visible = (el) => {
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  };
  const disabled = (el) => !!el.closest(':disabled, [aria-disabled="true"], [inert]');
  const ground = (el) => {
    const layers = [];
    let image = false;
    let opaque = false;
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') image = true;
      const c = colour(cs.backgroundColor);
      const o = parseFloat(cs.opacity);
      const layer = { r: c.r, g: c.g, b: c.b, a: c.a * (Number.isFinite(o) ? o : 1) };
      if (layer.a > 0) layers.push(layer);
      if (layer.a >= 1) {
        opaque = true;
        break;
      }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return { c: { r: base.r, g: base.g, b: base.b, a: 1 }, image, opaque };
  };

  const pairs = [];
  const seen = new Set();
  let checked = 0;
  const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    const text = t.nodeValue.replace(/\s+/g, ' ').trim();
    const el = t.parentElement;
    if (!text || !el || seen.has(el)) continue;
    if (/^(script|style|noscript|template|title)$/i.test(el.tagName)) continue;
    seen.add(el);
    if (!visible(el) || disabled(el)) continue;
    checked++;
    const cs = getComputedStyle(el);
    const g = ground(el);
    const fgRaw = colour(cs.color);
    const fg = over(fgRaw, g.c);
    const r = ratio(fg, g.c);
    if (r < options.esik)
      pairs.push({
        text: text.slice(0, 60),
        selector: selector(el),
        fg: hex(fgRaw) + (fgRaw.a < 1 ? ' ' + Math.round(fgRaw.a * 100) + '%' : ''),
        bg: hex(g.c),
        ratio: Math.round(r * 100) / 100,
        uncertain: g.image || !g.opaque,
      });
  }

  const targets = [];
  const clickable =
    'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [role="menuitem"], [onclick], [tabindex]:not([tabindex="-1"])';
  for (const el of document.querySelectorAll(clickable)) {
    if (!visible(el) || disabled(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < options.hedef || r.height < options.hedef)
      targets.push({
        selector: selector(el),
        text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().slice(0, 40),
        width: Math.round(r.width * 10) / 10,
        height: Math.round(r.height * 10) / 10,
      });
  }

  const out = {
    url: location.href,
    esik: options.esik,
    hedef: options.hedef,
    checked,
    pairs: pairs.sort((a, b) => a.ratio - b.ratio),
    targets,
  };
  if (options.url && location.href.replace(/\/$/, '') !== options.url.replace(/\/$/, '')) out.expected = options.url;
  return out;
})({"url":null,"esik":7,"hedef":24});
