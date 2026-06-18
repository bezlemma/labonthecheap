/* Lab on the Cheap — search, random post, and category filters.
   BASE is derived from this script's own src so every link works whether the
   site is served from a domain root or a project subpath (e.g. /labonthecheap/). */
const SC = document.querySelector('script[src$="assets/app.js"]');
const BASE = SC ? SC.getAttribute('src').replace(/assets\/app\.js$/, '') : '';

let IDX = null;
async function idx() {
  if (!IDX) {
    // Prefer the embedded index (works from file:// too, where fetch() is blocked).
    if (Array.isArray(window.LOTC_INDEX)) {
      IDX = window.LOTC_INDEX;
    } else {
      const res = await fetch(BASE + 'search.json');
      IDX = await res.json();
    }
  }
  return IDX;
}

const q = document.getElementById('q');
const results = document.getElementById('results');
const list = document.getElementById('postlist');
const chips = document.getElementById('filters');

function esc(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* ---- search ---- */
async function run(term) {
  const data = await idx();
  term = term.trim().toLowerCase();
  if (!term) {
    if (results) { results.hidden = true; results.innerHTML = ''; }
    if (list) list.hidden = false;
    if (chips) chips.hidden = false;
    return;
  }
  if (list) list.hidden = true;
  if (chips) chips.hidden = true;
  const hits = data.filter(p => (p.t + ' ' + p.x).toLowerCase().includes(term)).slice(0, 60);
  let h = '<h2>' + hits.length + ' result' + (hits.length == 1 ? '' : 's') + ' for “' + esc(term) + '”</h2>';
  if (!hits.length) { h += '<p class="nores">No posts matched. Try another term.</p>'; }
  else { h += '<ul>' + hits.map(p => '<li><a href="' + BASE + p.u + '">' + esc(p.t) + '<time>' + p.d + '</time></a></li>').join('') + '</ul>'; }
  if (results) { results.innerHTML = h; results.hidden = false; }
}
if (q) {
  if (results) {
    // Pages with a results container (the homepage): live search.
    let t;
    q.addEventListener('input', e => { clearTimeout(t); const v = e.target.value; t = setTimeout(() => run(v), 120); });
    // Honor ?q= so search works when arriving from another page.
    const initial = new URLSearchParams(location.search).get('q');
    if (initial) { q.value = initial; run(initial); }
  } else {
    // Pages without a results container (post pages): send search to the homepage.
    const go = () => {
      const term = q.value.trim();
      if (term) location.href = BASE + 'index.html?q=' + encodeURIComponent(term);
    };
    q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
  }
}

/* ---- random post ---- */
const rb = document.getElementById('rand');
if (rb) {
  rb.addEventListener('click', async () => {
    try {
      const d = await idx();
      if (d.length) location.href = BASE + d[Math.floor(Math.random() * d.length)].u;
    } catch (e) { /* search.json unavailable */ }
  });
}

/* ---- category filters (homepage only) ---- */
const CATS = [
  ['Microscopy', /microscop|tirf|flim|light.?sheet|confocal|foldscope|flexiscope|two.?photon|2.?photon|imaging|objective|optics|optical|lens/i],
  ['3D Printing', /3d.?print|3d.?fuge|3-?d|additive|sla|filament|printer/i],
  ['Centrifuges', /centrifuge|fuge|spin/i],
  ['PCR & Thermal', /pcr|thermocycler|qpcr|incubator|water.?bath|cooling|dry.?ice|autoclave|peltier/i],
  ['Microfluidics', /microfluidic|fluidic|droplet|syringe.?pump|peristaltic|pump|millifluidic|liquid/i],
  ['Spectroscopy', /spectrom|spectroscop|raman|spectrophotom|polarimeter|turbidi|plate.?reader|fluorescen/i],
  ['Electronics', /electron|oscilloscope|potentiostat|stimul|electrop|sensor|arduino|raspberry|pick.?and.?place|pcb/i],
  ['DIY & Hacks', /diy|hack|cheap|budget|hand.?me.?down|surplus|salad|kitchen|balloon|bicycle|soda/i]
];

function categorize(text) {
  return CATS.filter(([, re]) => re.test(text)).map(([name]) => name);
}

if (chips && list) {
  const items = Array.from(list.querySelectorAll('.card'));
  const counts = {};
  items.forEach(li => {
    const title = (li.querySelector('h2')?.textContent || '') + ' ' + (li.querySelector('p')?.textContent || '');
    const cats = categorize(title);
    li.dataset.cats = cats.join('|');
    cats.forEach(c => counts[c] = (counts[c] || 0) + 1);
  });

  const active = new Set(); // empty = show all
  const present = CATS.map(([n]) => n).filter(n => counts[n] >= 4);

  function render() {
    chips.innerHTML =
      '<button class="chip' + (active.size === 0 ? ' on' : '') + '" data-cat="">All</button>' +
      present.map(n => '<button class="chip' + (active.has(n) ? ' on' : '') + '" data-cat="' + esc(n) + '">' + esc(n) + '</button>').join('');
  }

  function apply() {
    items.forEach(li => {
      const cats = li.dataset.cats ? li.dataset.cats.split('|') : [];
      const show = active.size === 0 || cats.some(c => active.has(c));
      li.hidden = !show;
    });
  }

  chips.addEventListener('click', e => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    const cat = btn.dataset.cat;
    if (!cat) active.clear();
    else if (active.has(cat)) active.delete(cat);
    else active.add(cat);
    render();
    apply();
  });

  render();
}
