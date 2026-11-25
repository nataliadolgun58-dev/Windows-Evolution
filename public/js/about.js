// «Про проєкт»: числа беруться з бази через /api/stats
const box = document.getElementById('kpis');
fetch('/api/stats').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(s => {
  const k = (v, l) => `<div class="kpi"><div class="kpi-v">${v}</div><div class="kpi-l">${l}</div></div>`;
  box.innerHTML = k(s.totalSystems, 'версій Windows у базі') + k(s.betaSystems, 'бета-версій і кодових назв') + k(s.firstYear, 'рік першої версії') + k(s.evolutionYears, 'років еволюції');
}).catch(err => { console.error(err); box.innerHTML = '<div class="os-message is-error">База недоступна: ' + err.message + '</div>'; });
