// Інтерактивна хронологія Windows: усі дані з /api/os (база даних).
const $ = id => document.getElementById(id);
const tl = $('timeline'), countEl = $('count'), msgEl = $('message'), decEl = $('decades');
const catBoxes = [...document.querySelectorAll('#cats input')];
const CAT = { desktop: 'ПК', beta: 'БЕТА', server: 'СЕРВЕР', device: 'ПРИСТРІЙ' };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let all = [], observer = null;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MONTHS = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
function fmtDate(d) { const [y, m, day] = d.split('-').map(Number); return `${day} ${MONTHS[m - 1]} ${y}`; }
const ul = a => (a && a.length) ? `<ul class="px-list">${a.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '';

// Піксельне «вікно»: колір залежить від лінії/категорії (це ілюстрація, а не скриншот системи)
function icon(os) {
  const c = os.category === 'beta' ? '#ffd0eb' : os.line === 'NT' ? '#ff83c8' : os.line === 'CE' ? '#9bd1ff' : '#f4b6d8';
  return `<svg class="tl-icon" viewBox="0 0 16 14" shape-rendering="crispEdges" aria-hidden="true">
    <rect x="0" y="0" width="16" height="14" fill="#0c1129"/><rect x="1" y="1" width="14" height="3" fill="${c}"/>
    <rect x="12" y="2" width="2" height="1" fill="#0c1129"/><rect x="1" y="5" width="14" height="8" fill="#26306a"/>
    <rect x="3" y="7" width="4" height="3" fill="${c}"/><rect x="9" y="7" width="4" height="1" fill="${c}"/>
    <rect x="9" y="9" width="3" height="1" fill="${c}"/><rect x="3" y="11" width="10" height="1" fill="#3b50a7"/></svg>`;
}

function item(os, i) {
  const y = os.release_date.slice(0, 4);
  return `<li class="tl-item ${i % 2 ? 'right' : 'left'}" data-year="${y}" data-decade="${y.slice(0, 3)}0">
    <span class="tl-dot"></span>
    <article class="tl-card">
      <header class="tl-head">${icon(os)}
        <div><div class="tl-year">${y}</div><h2 class="tl-name">${esc(os.name)}</h2></div>
      </header>
      <div class="os-thumb" data-slug="${esc(os.slug)}">${OsImages.placeholder}</div>
      <div class="os-tags"><span class="tag tag-cat">${CAT[os.category] || 'ПК'}</span><span class="tag">${fmtDate(os.release_date)}</span>${os.bits ? `<span class="tag">${esc(os.bits)}-BIT</span>` : ''}</div>
      <p class="tl-sum">${esc(os.summary || '')}</p>
      <div class="tl-more" hidden>
        ${os.significance ? `<h3 class="tl-sub">ІСТОРИЧНЕ ЗНАЧЕННЯ</h3><p>${esc(os.significance)}</p>` : ''}
        ${os.innovation && os.innovation.length ? `<h3 class="tl-sub">НОВОВВЕДЕННЯ</h3>${ul(os.innovation)}` : ''}
        ${os.fact && os.fact.length ? `<h3 class="tl-sub">ЦІКАВИЙ ФАКТ</h3>${ul(os.fact)}` : ''}
        <a class="os-open" href="details.html?slug=${encodeURIComponent(os.slug)}">ПОВНА КАРТКА ▸</a>
      </div>
      <button class="px-btn px-btn-ghost tl-toggle" type="button" aria-expanded="false">ДЕТАЛЬНІШЕ ▾</button>
    </article></li>`;
}

function render() {
  const cats = catBoxes.filter(b => b.checked).map(b => b.value);
  const list = all.filter(o => cats.includes(o.category));
  if (observer) observer.disconnect();
  tl.innerHTML = list.map(item).join('');
  countEl.textContent = `Подій: ${list.length}`;
  msgEl.hidden = !!list.length;
  if (!list.length) { msgEl.className = 'os-message'; msgEl.textContent = 'Обери хоча б одну категорію, щоб побачити хронологію.'; }

  // кнопки десятиліть — тільки ті, що є в поточному списку
  const decades = [...new Set(list.map(o => o.release_date.slice(0, 3) + '0'))];
  decEl.innerHTML = decades.map(d => `<button class="px-btn px-btn-ghost" type="button" data-decade="${d}">${d}-ті</button>`).join('');

  // плавна поява при прокручуванні
  const items = [...tl.children];
  if (reduce || !('IntersectionObserver' in window)) { items.forEach(e => e.classList.add('in')); OsImages.hydrate(tl, list, false); return; }
  observer = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); } }), { threshold: 0.15 });
  items.forEach(e => observer.observe(e));
  OsImages.hydrate(tl, list, false);
}

tl.addEventListener('click', e => {
  const b = e.target.closest('.tl-toggle'); if (!b) return;
  const more = b.parentElement.querySelector('.tl-more');
  const open = more.hidden;
  more.hidden = !open;
  b.setAttribute('aria-expanded', open);
  b.textContent = open ? 'СХОВАТИ ▴' : 'ДЕТАЛЬНІШЕ ▾';
});
decEl.addEventListener('click', e => {
  const b = e.target.closest('button[data-decade]'); if (!b) return;
  const target = tl.querySelector(`[data-decade="${b.dataset.decade}"]`);
  if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
});
catBoxes.forEach(b => b.addEventListener('change', render));

(async function init() {
  try {
    const res = await fetch('/api/os?sort=date&order=asc');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    all = await res.json();
    render();
  } catch (err) {
    console.error(err); countEl.textContent = 'Помилка';
    msgEl.hidden = false; msgEl.className = 'os-message is-error';
    msgEl.textContent = 'Не вдалося завантажити хронологію: ' + err.message;
  }
})();
