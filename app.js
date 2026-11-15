// Top Performing Notes: Celebrations and Pangram
// A smooth curve of likes for my 60 most-liked Notes, earliest to latest.
// Dots are colored by type; click a dot or quote to read the whole Note.
(function () {
'use strict';

const BRAND = { deep:'#1F6FA8', mid:'#C8DEF0', rule:'#D8ECF8', text:'#2B3640',
                celeb:'#1F6FA8', pang:'#F88C00', pangText:'#B85F00' };
const PINNED = new Set([18, 21]);   // Notes I always want a quote bubble for

// ---------- label placement: bubbles above the curve, no line crosses a box ----------
function placeOnce(pts,o,order){ // pts sorted by x; o:{W,ml,mr,t,base,fs,lw}
  const lh=o.fs*1.4, placed=[], out=[], leaders=[];
  const wrap=(s)=>{const cpl=Math.max(8,Math.floor(o.lw/(o.fs*0.58)));const lines=[];let cur='';s.split(' ').forEach(w=>{if((cur+' '+w).trim().length>cpl&&cur){lines.push(cur);cur=w;}else cur=(cur+' '+w).trim();});if(cur)lines.push(cur);if(lines.length>4){lines.length=4;lines[3]=lines[3].replace(/\s*\S*$/,'')+'…';}return lines;};
  const hit=(a,b,p)=>a.x0<b.x1+p&&a.x1>b.x0-p&&a.y0<b.y1+p&&a.y1>b.y0-p;
  // highest the curve reaches (smallest y) anywhere under x0..x1
  const leaderOf=(p,r,sd)=>{let lx,ly;if(sd===1){lx=r.x0;ly=(r.y0+r.y1)/2;}else if(sd===-1){lx=r.x1;ly=(r.y0+r.y1)/2;}else{lx=Math.max(r.x0+12,Math.min(r.x1-12,p.x));ly=r.y1;}return {x1:p.x,y1:p.y-5,x2:lx,y2:ly};};
  const segHits=(L,r,pad)=>{const n=Math.max(2,Math.ceil(Math.hypot(L.x2-L.x1,L.y2-L.y1)/3));for(let i=0;i<=n;i++){const x=L.x1+(L.x2-L.x1)*i/n,y=L.y1+(L.y2-L.y1)*i/n;if(x>r.x0-pad&&x<r.x1+pad&&y>r.y0-pad&&y<r.y1+pad)return true;}return false;};
  const curveTop=(x0,x1)=>{let m=o.base;for(let i=0;i<pts.length;i++){const a=pts[i],c=pts[i+1]||pts[i];if(c.x<x0||a.x>x1)continue;
    const f=(x)=>c.x===a.x?Math.min(a.y,c.y):a.y+(c.y-a.y)*((x-a.x)/(c.x-a.x));
    m=Math.min(m,f(Math.max(x0,a.x)),f(Math.min(x1,c.x)));}return m;};
  order.forEach(p=>{
    const lines=wrap(p.callout), w=Math.max(o.fs*8.4,Math.min(o.lw,Math.max(...lines.map(l=>l.length))*o.fs*0.58)+4)+20, h=(lines.length+1)*lh+14;
    const cands=[];
    for(let k=0;k<=70;k++){
      const lift=k*8;
      for(const f of [0.5,0.12,0.88,0.3,0.7,0.0,1.0]) cands.push({x0:p.x-f*w,y0:p.y-h-14-lift,s:f===0.5?0:(f<0.5?2:-2)});
      cands.push({x0:p.x+12,y0:p.y-h/2-lift,s:1});
      cands.push({x0:p.x-12-w,y0:p.y-h/2-lift,s:-1});
    }
    let best=null;
    for(const c of cands){
      const r={x0:c.x0,x1:c.x0+w,y0:c.y0,y1:c.y0+h};
      if(r.x0<o.ml-6||r.x1>o.W-o.mr+4||r.y0<o.t)continue;
      if(placed.some(q=>hit(r,q,8)))continue;
      if(r.y1>curveTop(r.x0,r.x1)-14)continue;
      const Ld=leaderOf(p,r,c.s);
      if(placed.some(q=>segHits(Ld,q,4)))continue;
      if(leaders.some(L=>segHits(L,r,4)))continue;
      best={r,s:c.s,lines};break;
    }
    if(best){placed.push(best.r);leaders.push(leaderOf(p,best.r,best.s));out.push({p,...best});}
  });
  return out;
}


function placeLabels(pts,o){
  const cs=pts.filter(p=>p.callout);
  const wgt=p=>PINNED.has(p.rank)?5:p.rank<=10?3:(p.mon>='2026-09'?2.6:1);
  let best=null,bs=-1, seed=12345;
  const rnd=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296;};
  const base=cs.slice().sort((a,b)=>((a.rank<=10?0:1)-(b.rank<=10?0:1))||(a.rank<=10?a.rank-b.rank:b.x-a.x));
  const tries=[base];
  for(let i=0;i<(o.tries||40);i++){ tries.push(cs.map(p=>[p,wgt(p)*rnd()*-1+rnd()*1.6]).sort((a,b)=>a[1]-b[1]).map(z=>z[0])); }
  tries.forEach(ord=>{const r=placeOnce(pts,o,ord);const sc=r.reduce((s,z)=>s+wgt(z.p)+0.001*z.p.x,0);if(sc>bs){bs=sc;best=r;}});
  return best;
}


// ---------- chart ----------
const el = document.getElementById('chart');
const parse = d3.utcParse('%Y-%m-%d'), fmt = d3.utcFormat('%b %-d'), mon = d3.utcFormat('%b');
const data = window.NOTES.map(r => ({ rank:r.rank, type:r.type, likes:r.likes, date:parse(r.date),
  callout:r.callout || '', full:r.text, link:r.link })).sort((a, b) => a.date - b.date || a.rank - b.rank);
const hi = t => t === 'Celebration' || t === 'Pangram';
const col = t => t === 'Celebration' ? BRAND.celeb : t === 'Pangram' ? BRAND.pang : BRAND.mid;
let SEL = null;

function draw() {
  const n = data.length;
  const W = Math.max(320, el.clientWidth || 800), narrow = W < 520;
  const H = narrow ? 820 : (W < 750 ? 820 : 780);
  const m = { l:44, r:14, t:16, b:52 }, base = H - m.b, head = narrow ? 84 : 70;
  const x = i => m.l + 12 + (i / (n - 1)) * (W - m.l - m.r - 24);
  const y = d3.scaleSqrt().domain([30, d3.max(data, d => d.likes)]).range([base, m.t + head]);
  const svg = d3.create('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img')
    .attr('aria-label', 'My 60 top performing Notes from earliest to latest, as a smooth curve of likes. The curve rises to a sharp peak at the Pangram Notes in July 2026. Celebration Notes appear all along the curve.');

  [50, 100, 200, 400, 600].forEach(v => {
    svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(v)).attr('y2', y(v)).style('stroke', BRAND.rule).style('stroke-dasharray', '2 4');
    svg.append('text').attr('x', m.l - 8).attr('y', y(v)).attr('dy', '0.32em').attr('text-anchor', 'end').style('fill', '#666').style('font-size', '11px').style('font-variant-numeric', 'tabular-nums').text(v);
  });
  svg.append('text').attr('x', m.l - 8).attr('y', m.t - 4).attr('text-anchor', 'end').style('fill', '#666').style('font-size', '11px').text('likes');
  svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', base).attr('y2', base).style('stroke', '#9DBFD9');

  // month names under the first Note of each month
  let lastMon = '', lastLabelX = -99;
  data.forEach((d, i) => {
    const mm = mon(d.date);
    if (mm === lastMon) return;
    lastMon = mm;
    if (x(i) - lastLabelX < (narrow ? 26 : 36)) return;
    lastLabelX = x(i);
    svg.append('line').attr('x1', x(i)).attr('x2', x(i)).attr('y1', base).attr('y2', base + 5).style('stroke', '#9DBFD9');
    svg.append('text').attr('x', x(i)).attr('y', base + 19).attr('text-anchor', 'middle').style('fill', '#666').style('font-size', '11px').text(narrow ? mm[0] : mm);
  });

  const pts = data.map((d, i) => ({ x:x(i), y:y(d.likes), likes:d.likes, callout:d.callout, rank:d.rank, type:d.type,
    date:d.date, full:d.full, link:d.link, mon:d.date.toISOString().slice(0, 7) }));
  const line = d3.line().x(p => p.x).y(p => p.y).curve(d3.curveMonotoneX);
  const area = d3.area().x(p => p.x).y0(base).y1(p => p.y).curve(d3.curveMonotoneX);
  svg.append('path').attr('d', area(pts)).style('fill', BRAND.mid).style('opacity', 0.6);
  svg.append('path').attr('d', line(pts)).style('fill', 'none').style('stroke', BRAND.deep).style('stroke-width', 2.25).style('stroke-linejoin', 'round');

  pts.filter(p => hi(p.type)).concat(pts.filter(p => !hi(p.type))).reverse().forEach(p => {
    svg.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', hi(p.type) ? 5.5 : 2.75).style('fill', col(p.type))
      .style('stroke', hi(p.type) ? '#FFFFFF' : BRAND.deep).style('stroke-width', hi(p.type) ? 1.5 : 1).style('pointer-events', 'none');
  });

  const openNote = p => { SEL = p.rank; showPop(); };
  pts.forEach(p => {
    svg.append('circle').attr('class', 'dot-hit').attr('cx', p.x).attr('cy', p.y).attr('r', hi(p.type) ? 10 : 8).style('fill', 'transparent')
      .attr('tabindex', 0).attr('role', 'button').attr('aria-label', `Open Note #${p.rank}, ${p.likes} likes`)
      .on('click', e => { e.stopPropagation(); openNote(p); })
      .on('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openNote(p); } })
      .append('title').text(`#${p.rank} · ${p.type} · ${p.likes} likes · ${fmt(p.date)}`);
  });

  // quote bubbles
  const fs = narrow ? 11 : 13, lh = fs * 1.4;
  const out = placeLabels(pts, { W, ml:m.l, mr:m.r, t:m.t, base, fs, lw:narrow ? 100 : (W > 1050 ? 135 : W > 950 ? 128 : 120), tries:200 });
  const tint = ty => ty === 'Celebration' ? '#E8F1F8' : ty === 'Pangram' ? '#FFF1DE' : '#FFFFFF';
  const edge = ty => ty === 'Celebration' ? BRAND.celeb : ty === 'Pangram' ? BRAND.pang : BRAND.mid;
  out.forEach(o => {
    const p = o.p, r = o.r, c = hi(p.type) ? col(p.type) : '#B7D2E6';
    let lx, ly;
    if (o.s === 1) { lx = r.x0; ly = (r.y0 + r.y1) / 2; }
    else if (o.s === -1) { lx = r.x1; ly = (r.y0 + r.y1) / 2; }
    else { lx = Math.max(r.x0 + 12, Math.min(r.x1 - 12, p.x)); ly = r.y1; }
    svg.append('line').attr('x1', p.x).attr('y1', p.y - 5).attr('x2', lx).attr('y2', ly).style('stroke', c).style('stroke-width', 1).style('stroke-opacity', 0.6);
    const g = svg.append('g').attr('class', 'lbl').on('click', e => { e.stopPropagation(); openNote(p); });
    g.append('rect').attr('x', r.x0).attr('y', r.y0).attr('width', r.x1 - r.x0).attr('height', r.y1 - r.y0).attr('rx', 12)
      .style('fill', tint(p.type)).style('fill-opacity', 0.55).style('stroke', edge(p.type)).style('stroke-opacity', 0.85).style('stroke-width', 1.25);
    const tx = r.x0 + 10, t = g.append('text').style('font-size', fs + 'px');
    o.lines.forEach((ln, j) => t.append('tspan').attr('x', tx).attr('y', r.y0 + 7 + fs + j * lh).style('fill', BRAND.text).style('font-weight', 500).style('letter-spacing', '0.01em').text(ln));
    t.append('tspan').attr('x', tx).attr('y', r.y0 + 7 + fs + o.lines.length * lh).style('fill', '#6B7782').style('font-size', (fs - 1) + 'px').style('font-weight', 400).text(`${p.likes} likes · ${fmt(p.date)}`);
  });

  // legend
  let lx = m.l;
  [['Celebration', col('Celebration')], ['Pangram', col('Pangram')], ['Everything else', col('Other')]].forEach(([tt, c]) => {
    svg.append('circle').attr('cx', lx + 5).attr('cy', H - 8).attr('r', tt === 'Everything else' ? 3.5 : 4.5).style('fill', c).style('stroke', tt === 'Everything else' ? BRAND.deep : 'none').style('stroke-width', 1);
    svg.append('text').attr('x', lx + 14).attr('y', H - 4).style('fill', '#666').style('font-size', '11px').text(tt);
    lx += 14 + tt.length * 6.6 + 20;
  });

  svg.on('click', () => { SEL = null; showPop(); });
  el.replaceChildren(svg.node());

  function showPop() {
    el.querySelectorAll('.pop').forEach(n => n.remove());
    const p = pts.find(q => q.rank === SEL); if (!p) return;
    const pop = document.createElement('div'); pop.className = 'pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Note #' + p.rank);
    const ph = document.createElement('div'); ph.className = 'ph';
    const tag = document.createElement('span'); tag.textContent = p.type; tag.style.fontWeight = '600';
    tag.style.color = p.type === 'Pangram' ? BRAND.pangText : p.type === 'Celebration' ? BRAND.celeb : '#1A1A1A';
    const meta = document.createElement('span'); meta.textContent = `#${p.rank} · ${p.likes} likes · ${fmt(p.date)}`;
    const xb = document.createElement('button'); xb.type = 'button'; xb.className = 'x'; xb.setAttribute('aria-label', 'Close'); xb.textContent = '×';
    xb.onclick = () => { SEL = null; showPop(); };
    ph.append(tag, meta, xb);
    const pt = document.createElement('div'); pt.className = 'pt'; pt.textContent = p.full;
    pop.append(ph, pt);
    if (p.link) { const a = document.createElement('a'); a.className = 'go'; a.href = p.link; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Open this Note on Substack ↗'; pop.append(a); }
    el.append(pop);
    const pw = Math.min(340, W - 8), left = Math.max(4, Math.min(W - pw - 4, p.x - pw / 2));
    pop.style.left = left + 'px';
    const hh = pop.offsetHeight || 240;
    const below = p.y + 16, top = (below + hh < H - 8) ? below : Math.max(4, p.y - hh - 16);
    pop.style.top = top + 'px';
  }
  showPop();
}

document.addEventListener('keydown', e => { if (e.key === 'Escape' && SEL !== null) { SEL = null; draw(); } });
let lastW = 0, raf = 0;
new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (el.clientWidth !== lastW) { lastW = el.clientWidth; draw(); } }); }).observe(el);
draw();
})();
