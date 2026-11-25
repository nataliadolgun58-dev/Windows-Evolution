// Зображення ОС. Порядок пошуку:
// 1) власний файл у папці images/os/<slug>.png|jpg|webp|gif|svg  (має найвищий пріоритет);
// 2) головне зображення зі статті Вікіпедії (відкритий API Wikimedia), посилання на джерело показується;
// 3) піксельна заглушка, якщо зображення немає.
window.OsImages = (function () {
  let local = null;
  const CK = 'we-img-v2:';
  const cacheGet = k => { try { const v = JSON.parse(localStorage.getItem(CK + k)); if (v && Date.now() - v.t < (v.d ? 7 : 1) * 864e5) return v; } catch (e) { /* без кешу */ } return null; };
  const cacheSet = (k, d) => { try { localStorage.setItem(CK + k, JSON.stringify({ t: Date.now(), d })); } catch (e) { /* без кешу */ } };

  async function loadLocal() {
    if (local) return local;
    try { const r = await fetch('/api/os-images'); local = r.ok ? await r.json() : {}; } catch (e) { local = {}; }
    return local;
  }

  async function fromWikipedia(source) {
    const m = /wikipedia\.org\/wiki\/([^#?]+)/.exec(source || '');
    if (!m) return null;
    const title = m[1];
    const cached = cacheGet(title);
    if (cached) return cached.d;
    try {
      const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + title, { headers: { Accept: 'application/json' } });
      if (!r.ok) { if (r.status === 404) cacheSet(title, null); return null; }  // 429/5xx — тимчасово, не кешуємо
      const j = await r.json();
      const src = j.thumbnail && j.thumbnail.source;
      const d = src ? { src, page: (j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page) || source, credit: 'Вікіпедія' } : null;
      cacheSet(title, d);
      return d;
    } catch (e) { return null; }
  }

  async function resolve(os) {
    const loc = await loadLocal();
    if (loc[os.slug]) return { src: 'images/os/' + encodeURIComponent(loc[os.slug]), page: null, credit: 'Власне зображення' };
    return fromWikipedia(os.source);
  }

  function put(box, d, os, withCredit) {
    const img = new Image();
    img.alt = 'Зображення: ' + os.name;
    // УВАГА: не ставити img.loading = 'lazy' — для Image(), якого ще немає в DOM, браузер не завантажує файл взагалі
    img.onload = () => {
      box.classList.add('has-img');
      box.innerHTML = '';
      box.appendChild(img);
      if (withCredit && d.page) {
        const c = document.createElement('a');
        c.className = 'img-credit'; c.href = d.page; c.target = '_blank'; c.rel = 'noopener noreferrer';
        c.textContent = 'Зображення: ' + d.credit + ' ▸';
        box.appendChild(c);
      } else if (withCredit) {
        const c = document.createElement('span'); c.className = 'img-credit'; c.textContent = d.credit; box.appendChild(c);
      }
    };
    img.onerror = () => { box.classList.add('no-img'); };
    img.src = d.src;
  }

  // Заповнює всі .os-thumb[data-slug] у контейнері; одночасно не більше 5 запитів
  function hydrate(root, list, withCredit) {
    const bySlug = new Map((list || []).map(o => [o.slug, o]));
    const boxes = [...root.querySelectorAll('.os-thumb[data-slug]')];
    let i = 0;
    async function worker() {
      while (i < boxes.length) {
        const box = boxes[i++], os = bySlug.get(box.dataset.slug);
        if (!os) continue;
        const d = await resolve(os);
        if (d) put(box, d, os, withCredit); else box.classList.add('no-img');
      }
    }
    return Promise.all(Array.from({ length: Math.min(5, boxes.length) }, worker));
  }

  const placeholder = '<span class="os-thumb-ph" aria-hidden="true"></span>';
  return { hydrate, placeholder };
})();
