/* ============================================================================
   ux-reticle.js — Zielfernrohr-Simulation / Holdover v1.1.0
   ----------------------------------------------------------------------------
   - Blick durchs ZF: Szene + Ziel-Silhouette + Absehen + Haltepunkt-Marker.
   - Absehen: Mil-Dot, MOA, Horus, Tremor3, G2C (4er-Absehen).
   - FFP/SFP: FFP skaliert das Absehen mit der Vergrößerung, SFP hält es konstant
     (Kalibrierung bei 10x) – der Lerneffekt wird sofort sichtbar.
   - Modus Hold: amber Haltepunkt + grüner Treffpunkt-Offset; Modus Dial: Lösung
     ist eingedialt, Treffpunkt liegt im Zentrum.
   - Controls dauerhaft sichtbar: Absehen, Zoom, FFP/SFP, Distanz, Ziel, Höhe,
     Modus, Wind, Beleuchtung, Sway, Export, Reset.
   Kopplung nur über DOM (Tabelle lesen + Events), keine App-Interna.
   ========================================================================== */
(function () {
  'use strict';
  if (window.__sniperReticleMounted) return;
  window.__sniperReticleMounted = true;

  var KEY = 'sniperReticle.v1';
  var DEF = { ret: 'mildot', mag: 10, ffp: true, dist: 0, target: 'ipsc', hCm: 45, mode: 'hold', wind: true, illum: true, sway: false, sceneOffsetMil: 0 };
  var S = JSON.parse(JSON.stringify(DEF));
  try { var p = JSON.parse(localStorage.getItem(KEY) || '{}'); for (var k in DEF) if (p[k] !== undefined) S[k] = p[k]; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function DE() { return (document.documentElement.lang || 'de').toLowerCase().indexOf('de') === 0; }
  function L(a, b) { return DE() ? a : b; }
  function cssVar(n, f) { var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v || f; }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : null; }
  function cellNum(td) {
    if (!td) return null;
    var node = td.childNodes[0];
    var txt = (node && node.nodeType === 3 ? node.textContent : td.textContent) || '';
    return num(txt.replace(/[^0-9.+\-]/g, ''));
  }
  function rows() {
    var card = document.querySelector('.result-card');
    if (!card) return [];
    var t = card.querySelector('.table-block .data-table');
    if (!t) return [];
    var out = [], trs = t.querySelectorAll('tbody tr');
    for (var i = 0; i < trs.length; i++) {
      var td = trs[i].children, d = cellNum(td[0]), dr = cellNum(td[3]), wi = cellNum(td[5]);
      /* Drop-Konvention: Die Tabelle notiert den Fall oft als Betrag (positiv).
         Physikalisch zeigt dropCm nach unten. Wir normalisieren hier auf den
         Betrag und stellen die korrekte Richtung erst im Renderer her
         (impactY = cy - |drop|*ppm, holdY = cy + |drop|*ppm). So liegt der
         grüne Treffpunkt bei jeder Distanz > 0 unterhalb des amber Haltepunkts. */
      if (d !== null && dr !== null) out.push({ d: d, drop: Math.abs(dr), drift: wi || 0 });
    }
    return out;
  }
  function clickMil() {
    var sels = document.querySelectorAll('select[data-field]');
    for (var i = 0; i < sels.length; i++) {
      var lab = sels[i].closest('.field');
      if (lab && /klickwert|click/i.test(lab.textContent)) {
        var txt = sels[i].options[sels[i].selectedIndex] ? sels[i].options[sels[i].selectedIndex].textContent : '';
        var m = txt.match(/(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)\s*(MIL|MOA)/i);
        if (m) {
          var v = m[1].indexOf('/') >= 0 ? (function (f) { var a = f.split('/'); return parseFloat(a[0]) / parseFloat(a[1]); })(m[1].replace(/\s/g, '')) : parseFloat(m[1].replace(',', '.'));
          if (isFinite(v) && v > 0) return /MOA/i.test(m[2]) ? v * 0.2908882086657216 : v;
        }
      }
    }
    return 0.1;
  }
  function solution() {
    var rs = rows();
    if (!rs.length) return null;
    if (!S.dist || !rs.some(function (r) { return r.d === S.dist; })) S.dist = rs[Math.min(3, rs.length - 1)].d;
    var r = null;
    for (var i = 0; i < rs.length; i++) if (rs[i].d === S.dist) r = rs[i];
    if (!r || r.d <= 0) return null;
    var dropMil = (r.drop * 10) / r.d;
    var windMil = S.wind ? (r.drift * 10) / r.d : 0;
    return { d: r.d, dropMil: dropMil, windMil: windMil, cm: clickMil() };
  }

  var canvas = null, wrap = null, ro = null, raf = null;

  function mount() {
    if (document.getElementById('ux-reticle')) return;
    var host = document.querySelector('.results-grid');
    host = host ? host.parentElement : document.querySelector('.results');
    if (!host || !document.querySelector('.result-card')) return;
    var anchor = document.getElementById('ux-windage') || document.getElementById('ux-drop-chart') || host.querySelector('.results-grid') || host.lastElementChild;
    var card = document.createElement('div');
    card.className = 'card';
    card.id = 'ux-reticle';
    card.innerHTML =
      '<div class="chart-head"><h3>' + L('Zielfernrohr · Haltepunkt', 'Scope · Hold Point') + '</h3>' +
      '<div class="chips" id="rt-chips" style="margin:0"></div></div>' +
      '<div id="rt-wrap" style="position:relative;height:min(62vw,440px);border:1px solid var(--line-soft);border-radius:14px;overflow:hidden;background:#04060a">' +
      '<canvas id="rt-canvas" style="position:absolute;inset:0;width:100%;height:100%;display:block"></canvas></div>' +
      '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:8px;font-size:.7rem;color:var(--text-faint)">' +
      '<span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + cssVar('--amber', '#f5a524') + ';margin-right:5px"></i>' + L('Haltepunkt (hier zielen)', 'Hold point (aim here)') + '</span>' +
      '<span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + cssVar('--green', '#38d39f') + ';margin-right:5px"></i>' + L('Treffpunkt bei Zentrum-Halt', 'Impact if holding center') + '</span></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:12px">' +
        '<label class="field"><span class="field-label">' + L('Absehen', 'Reticle') + '</span>' +
        '<select class="input" id="rt-ret"><option value="mildot">Mil-Dot</option><option value="moa">MOA</option><option value="horus">Horus</option><option value="tremor">Tremor3</option><option value="g2c">G2C (4er)</option></select></label>' +
        '<label class="field"><span class="field-label">' + L('Vergrößerung', 'Magnification') + ' <b id="rt-magv">10×</b></span>' +
        '<input class="range" type="range" id="rt-mag" min="1" max="25" step="1" value="10"></label>' +
        '<div class="field"><span class="field-label">' + L('Absehen-Ebene', 'Reticle plane') + '</span>' +
        '<div class="segmented" style="margin:0"><button type="button" class="seg-btn" id="rt-ffp">FFP</button><button type="button" class="seg-btn" id="rt-sfp">SFP</button></div></div>' +
        '<label class="field"><span class="field-label">' + L('Distanz', 'Distance') + '</span><select class="input" id="rt-dist"></select></label>' +
        '<label class="field"><span class="field-label">' + L('Ziel', 'Target') + '</span>' +
        '<select class="input" id="rt-target"><option value="ipsc">IPSC (45 cm)</option><option value="mann">' + L('Mann (175 cm)', 'Man (175 cm)') + '</option><option value="brust">' + L('Brust (50 cm)', 'Chest (50 cm)') + '</option><option value="hase">' + L('Hase (35 cm)', 'Hare (35 cm)') + '</option><option value="custom">' + L('Eigene Höhe', 'Custom height') + '</option></select></label>' +
        '<label class="field"><span class="field-label">' + L('Zielhöhe (cm)', 'Target height (cm)') + '</span>' +
        '<input class="input" type="number" id="rt-h" min="5" max="300" step="1" value="45"></label>' +
        '<div class="field"><span class="field-label">' + L('Korrektur', 'Correction') + '</span>' +
        '<div class="segmented" style="margin:0"><button type="button" class="seg-btn" id="rt-hold">Hold</button><button type="button" class="seg-btn" id="rt-dial">Dial</button></div></div>' +
        '<div class="field"><span class="field-label">' + L('Wind einrechnen', 'Include wind') + '</span>' +
        '<span class="toggle-row" style="min-height:38px"><span class="hint" style="margin:0">' + L('Seitenabweichung', 'Lateral drift') + '</span><span class="switch"><input type="checkbox" id="rt-wind"><span class="slider"></span></span></span></div>' +
        '<div class="field"><span class="field-label">' + L('Beleuchtung', 'Illumination') + '</span>' +
        '<span class="toggle-row" style="min-height:38px"><span class="hint" style="margin:0">' + L('Rotpunkt', 'Red dot') + '</span><span class="switch"><input type="checkbox" id="rt-illum"><span class="slider"></span></span></span></div>' +
        '<div class="field"><span class="field-label">' + L('Atem-Sway', 'Breathing sway') + '</span>' +
        '<span class="toggle-row" style="min-height:38px"><span class="hint" style="margin:0">' + L('Simulation', 'Simulation') + '</span><span class="switch"><input type="checkbox" id="rt-sway"><span class="slider"></span></span></span></div>' +
        '<label class="field"><span class="field-label">' + L('Szenenversatz (Mil)', 'Scene offset (Mil)') + ' <b id="rt-offv">0.0</b></span>' +
        '<input class="range" type="range" id="rt-offset" min="-10" max="10" step="0.5" value="0"></label>' +
        '<div class="field"><span class="field-label">' + L('Aktionen', 'Actions') + '</span>' +
        '<div class="btn-row" style="margin:0"><button type="button" class="btn btn-small btn-primary" id="rt-export">PNG</button>' +
        '<button type="button" class="btn btn-small btn-ghost" id="rt-reset">Reset</button></div></div>' +
      '</div>';
    if (anchor && anchor.parentElement === host) anchor.insertAdjacentElement('afterend', card);
    else host.appendChild(card);

    wrap = card.querySelector('#rt-wrap');
    canvas = card.querySelector('#rt-canvas');
    syncControls();
    card.addEventListener('input', onCtl);
    card.addEventListener('change', onCtl);
    card.addEventListener('click', function (ev) {
      var id = ev.target.id;
      if (id === 'rt-ffp') { S.ffp = true; save(); syncControls(); draw(); }
      if (id === 'rt-sfp') { S.ffp = false; save(); syncControls(); draw(); }
      if (id === 'rt-hold') { S.mode = 'hold'; save(); syncControls(); draw(); }
      if (id === 'rt-dial') { S.mode = 'dial'; save(); syncControls(); draw(); }
      if (id === 'rt-export' && canvas) {
        var a = document.createElement('a');
        a.download = 'zielfernrohr-haltepunkt.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
      if (id === 'rt-reset') { S = JSON.parse(JSON.stringify(DEF)); save(); syncControls(); draw(); }
    });
    if (ro) ro.disconnect();
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { draw(); }); ro.observe(wrap); }
    draw();
  }

  function onCtl(ev) {
    var id = ev.target.id, v = ev.target.value;
    if (id === 'rt-ret') S.ret = v;
    else if (id === 'rt-mag') { S.mag = parseInt(v, 10) || 10; var b = document.getElementById('rt-magv'); if (b) b.textContent = S.mag + '×'; }
    else if (id === 'rt-dist') S.dist = parseInt(v, 10) || 0;
    else if (id === 'rt-target') {
      S.target = v;
      var h = { mann: 175, brust: 50, hase: 35, ipsc: 45 }[v];
      if (h) { S.hCm = h; var hi = document.getElementById('rt-h'); if (hi) hi.value = h; }
    }
    else if (id === 'rt-h') { S.hCm = Math.max(5, Math.min(300, num(v) || 45)); S.target = 'custom'; var ts = document.getElementById('rt-target'); if (ts) ts.value = 'custom'; }
    else if (id === 'rt-wind') S.wind = ev.target.checked;
    else if (id === 'rt-illum') S.illum = ev.target.checked;
    else if (id === 'rt-sway') { S.sway = ev.target.checked; loop(); }
    else if (id === 'rt-offset') {
      S.sceneOffsetMil = Math.max(-10, Math.min(10, num(v) || 0));
      var ob = document.getElementById('rt-offv'); if (ob) ob.textContent = S.sceneOffsetMil.toFixed(1);
    }
    else return;
    save(); draw();
  }

  function syncControls() {
    var card = document.getElementById('ux-reticle');
    if (!card) return;
    var set = function (id, val) { var el = card.querySelector('#' + id); if (el) el.value = val; };
    var chk = function (id, val) { var el = card.querySelector('#' + id); if (el) el.checked = !!val; };
    set('rt-ret', S.ret); set('rt-mag', S.mag); set('rt-h', S.hCm); set('rt-target', S.target);
    set('rt-offset', S.sceneOffsetMil || 0);
    chk('rt-wind', S.wind); chk('rt-illum', S.illum); chk('rt-sway', S.sway);
    var mv = card.querySelector('#rt-magv'); if (mv) mv.textContent = S.mag + '×';
    var ov2 = card.querySelector('#rt-offv'); if (ov2) ov2.textContent = (S.sceneOffsetMil || 0).toFixed(1);
    card.querySelector('#rt-ffp').classList.toggle('active', S.ffp);
    card.querySelector('#rt-sfp').classList.toggle('active', !S.ffp);
    card.querySelector('#rt-hold').classList.toggle('active', S.mode === 'hold');
    card.querySelector('#rt-dial').classList.toggle('active', S.mode === 'dial');
    var ds = card.querySelector('#rt-dist'), rs = rows();
    var opts = rs.map(function (r) { return '<option value="' + r.d + '">' + r.d + ' m</option>'; }).join('');
    if (ds.innerHTML !== opts) ds.innerHTML = opts;
    ds.value = String(S.dist);
  }

  function loop() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (!S.sway) { draw(0); return; }
    var tick = function (t) { draw(t); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    else if (S.sway) loop();
  });

  /* --- Rendering ---------------------------------------------------------- */
  function draw(t) {
    if (!canvas || !canvas.isConnected || !wrap) return;
    var W = wrap.clientWidth, H = wrap.clientHeight;
    if (!W || !H) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var sol = solution();
    var cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 4;
    var fovMil = 370 / S.mag;
    var ppm = (R * 2) / fovMil;
    var retPPM = S.ffp ? ppm : (R * 2) / (370 / 10);
    var swayX = 0, swayY = 0;
    if (S.sway && t) {
      swayX = Math.sin(t / 900) * ppm * 0.22 + Math.sin(t / 311) * ppm * 0.06;
      swayY = Math.cos(t / 1150) * ppm * 0.18 + Math.sin(t / 477) * ppm * 0.05;
    }

    /* Szenenversatz: >0 schiebt Boden/Horizont/Silhouette nach unten. Die
       Marker (Hold/Impact) werden konsistent mit demselben Versatz gezeichnet,
       damit der Abstand Hold->Impact exakt dropMil * ppm betraegt und der
       grüne Punkt nie über dem amber Punkt liegt. */
    var offPx = (S.sceneOffsetMil || 0) * ppm;
    var groundY = cy + R * 0.35;

    /* Szene */
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, cssVar('--bg-deep', '#06090d'));
    sky.addColorStop(0.55, cssVar('--surface-2', '#16202e'));
    sky.addColorStop(0.72, cssVar('--surface-3', '#1c2938'));
    sky.addColorStop(1, cssVar('--bg-deep', '#06090d'));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    var glow = ctx.createRadialGradient(cx, groundY + offPx, 4, cx, groundY + offPx, R * 1.2);
    glow.addColorStop(0, 'rgba(245,165,36,0.16)'); glow.addColorStop(1, 'rgba(245,165,36,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(6,9,13,0.55)';
    ctx.fillRect(0, groundY + offPx, W, H);
    ctx.strokeStyle = 'rgba(157,176,195,0.10)'; ctx.lineWidth = 1;
    for (var g = 1; g <= 4; g++) {
      ctx.beginPath(); ctx.moveTo(0, groundY + offPx + g * R * 0.14); ctx.lineTo(W, groundY + offPx + g * R * 0.14); ctx.stroke();
    }

    ctx.translate(swayX, swayY);

    /* Ziel-Silhouette, angular korrekt skaliert.
       Aim-Punkt (IPSC: Mitte A-Zone) bleibt am Fadenkreuz-Zentrum (cx, cy);
       der Szenenversatz (Szenenboden / Horizont) wird ueber sceneOffsetMil
       vertikal verschoben, sodass die A-Zone auch bei grossen Distanzen und
       hohem Drop im sichtbaren Bereich bleibt. */
    var hMil = sol ? (S.hCm * 10) / sol.d : (S.hCm * 10) / 300;
    var hPx = Math.max(3, hMil * ppm);
    /* Silhouette gegenlaeufig zum Szenenversatz: erhoeht man sceneOffsetMil,
       wandert die Szene (Boden/Horizont) nach unten und das Ziel relativ dazu
       nach oben – so bleibt der Haltepunkt (amber, oberhalb des Kreuzes) bei
       grossen Distanzen im sichtbaren Bereich. */
    var aimY = cy - offPx;              // Aim-Punkt = Kreuz − Szenenversatz
    var topY = aimY - hPx * 0.55;       // Oberkante des Ziels
    var baseY = topY + hPx;             // Unterkante des Ziels
    ctx.fillStyle = cssVar('--text-dim', '#9db0c3');
    ctx.strokeStyle = 'rgba(245,165,36,0.5)'; ctx.lineWidth = 1;
    if (S.target === 'hase') {
      /* Hase: Aim-Punkt am Körperzentrum, proportional zur Höhe */
      ctx.beginPath(); ctx.ellipse(cx, aimY, hPx * 0.55, hPx * 0.35, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx - hPx * 0.2, topY + hPx * 0.2, hPx * 0.09, hPx * 0.28, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + hPx * 0.12, topY + hPx * 0.2, hPx * 0.09, hPx * 0.28, 0.2, 0, Math.PI * 2); ctx.fill();
    } else if (S.target === 'ipsc' || S.target === 'brust' || S.target === 'custom') {
      /* IPSC-Scheibe: Breite ~0.62 * Höhe, angeschrägte Schultern,
         A-Zone-Mitte exakt auf aimY (= Kreuz), C-Zone, Kopf-Box. */
      var bw = hPx * 0.62, hw = bw / 2;
      var sh = hPx * 0.14;                      // Schulter-Schräge
      var headW = hPx * 0.2, headH = hPx * 0.17; // Kopf-Box oben
      ctx.beginPath();
      ctx.moveTo(cx - hw, topY + sh);
      ctx.lineTo(cx - headW, topY + headH);
      ctx.lineTo(cx - headW, topY);
      ctx.lineTo(cx + headW, topY);
      ctx.lineTo(cx + headW, topY + headH);
      ctx.lineTo(cx + hw, topY + sh);
      ctx.lineTo(cx + hw, baseY);
      ctx.lineTo(cx - hw, baseY);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      /* C-Zone (unterer Bereich der Scheibe) */
      ctx.strokeRect(cx - hw * 0.66, aimY + hPx * 0.1, hw * 1.32, hPx * 0.3);
      /* A-Zone: Rechteck um den Aim-Punkt, Mitte auf aimY */
      var aw = hPx * 0.26, ah = hPx * 0.22;
      ctx.strokeRect(cx - aw, aimY - ah, aw * 2, ah * 2);
      ctx.fillStyle = 'rgba(245,165,36,0.35)';
      ctx.beginPath(); ctx.arc(cx, aimY, Math.max(1.5, hPx * 0.06), 0, Math.PI * 2); ctx.fill();
    } else {
      /* Mann: schlank, Breite ~0.28 * Höhe, Kopf ~13% der Höhe (gesamte Figur inkl. Kopf).
         Aim-Punkt (Brust) fest auf (cx, cy). */
      var mw = hPx * 0.28, mhw = mw / 2;        // volle/halbe Schulterbreite
      var headH = hPx * 0.13;                   // Kopfdurchmesser = 13% der Gesamthöhe
      var kr = headH / 2;                       // Kopfradius
      var headTop = topY;                       // Oberkante Kopf = Ziel-Oberkante
      var shoulderY = headTop + headH;          // Schultern direkt unter dem Kopf
      ctx.beginPath(); ctx.arc(cx, headTop + kr, kr, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - mhw, shoulderY);
      ctx.lineTo(cx + mhw, shoulderY);
      ctx.lineTo(cx + mhw * 0.85, headTop + hPx * 0.56);
      ctx.lineTo(cx + mhw * 0.6, baseY);
      ctx.lineTo(cx + mhw * 0.15, baseY);
      ctx.lineTo(cx, headTop + hPx * 0.6);
      ctx.lineTo(cx - mhw * 0.15, baseY);
      ctx.lineTo(cx - mhw * 0.6, baseY);
      ctx.lineTo(cx - mhw * 0.85, headTop + hPx * 0.56);
      ctx.closePath(); ctx.fill();
    }

    /* Marker */
    if (sol) {
      /* Vorzeichen-Konvention: dropCm in der Tabelle ist negativ (Treffpunkt
         unter der Visierlinie). Canvas-Y zeigt nach unten (Y+ = tiefer), daher
         wird der Betrag des Drops SUBTRAHIERT:
           impactY = cy - |dropMil| * ppm   -> gruen liegt UNTEN
           holdY   = cy + |dropMil| * ppm   -> amber Haltepunkt liegt OBEN.
         Akzeptanzkriterium: bei jeder Distanz > 0 liegt der grüne Punkt
         unterhalb (oder auf Höhe) des amber Punkts – nie darüber. */
      var dropMag = Math.abs(sol.dropMil);
      var ix = cx + sol.windMil * ppm, iy = cy - dropMag * ppm + offPx;
      if (S.mode === 'dial') { ix = cx; iy = cy + offPx; }

      /* Semantische Canvas-Labels: farbig unterlegte Text-Badges direkt
         neben den Markern, damit Amber (Halten) und Gruen (Treff) auch ohne
         Farbunterscheidung (z.B. Farbfehlsicht / Display) zuordenbar sind. */
      ctx.font = '700 9px ' + cssVar('--font-ui', 'sans-serif');
      function markerLabel(text, color, x, y) {
        var padX = 4, hgt = 13;
        var w = ctx.measureText(text).width + padX * 2;
        var flip = (x + 12 + w) > (cx + R - 6);   // am rechten Rand nach links spiegeln
        var bx = flip ? x - 12 - w : x + 12;
        var by = Math.max(cy - R + 6, Math.min(cy + R - hgt - 6, y - hgt / 2));
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(4,6,10,0.78)';
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bx, by, w, hgt, 3); ctx.fill(); }
        else ctx.fillRect(bx, by, w, hgt);
        ctx.strokeStyle = color; ctx.lineWidth = 1;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bx, by, w, hgt, 3); ctx.stroke(); }
        else ctx.strokeRect(bx, by, w, hgt);
        ctx.fillStyle = color;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(text, bx + padX, by + hgt / 2 + 0.5);
        ctx.restore();
      }

      ctx.fillStyle = cssVar('--green', '#38d39f');
      ctx.shadowColor = cssVar('--green', '#38d39f'); ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(ix, iy, 4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = cssVar('--green', '#38d39f'); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(ix, iy, 8, 0, Math.PI * 2); ctx.stroke();
      markerLabel(L('TREFFPUNKT', 'IMPACT'), cssVar('--green', '#38d39f'), ix, iy);
      if (S.mode === 'hold') {
        var hx = cx - sol.windMil * ppm, hy = cy + dropMag * ppm + offPx;
        ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(245,165,36,0.6)';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(hx, hy); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = cssVar('--amber', '#f5a524');
        ctx.shadowColor = cssVar('--amber', '#f5a524'); ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(hx, hy, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = cssVar('--amber', '#f5a524'); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(hx, hy, 9, 0, Math.PI * 2); ctx.stroke();
        markerLabel(L('HALTEPUNKT', 'HOLD'), cssVar('--amber', '#f5a524'), hx, hy);
      }
    }

    /* Absehen */
    drawReticle(ctx, cx, cy, R, retPPM);
    ctx.restore();

    /* Tubus + Glas */
    ctx.fillStyle = '#04060a';
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx, cy, R, 0, Math.PI * 2, true); ctx.fill('evenodd');
    ctx.strokeStyle = cssVar('--line', '#24344a'); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    var glass = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.1, cx, cy, R);
    glass.addColorStop(0, 'rgba(88,166,255,0.07)'); glass.addColorStop(0.6, 'rgba(88,166,255,0.015)'); glass.addColorStop(1, 'rgba(4,6,10,0.35)');
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = glass; ctx.fillRect(0, 0, W, H); ctx.restore();

    updateChips(sol, fovMil, hMil);
  }

  function drawReticle(ctx, cx, cy, R, ppm) {
    var etch = cssVar('--text', '#e9f0f7');
    var lw = Math.max(1, ppm * 0.045);
    ctx.strokeStyle = etch; ctx.fillStyle = etch; ctx.lineWidth = lw;
    ctx.font = '600 8px ' + cssVar('--font-num', 'monospace');
    ctx.textAlign = 'center';
    function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(cx + x1 * ppm, cy + y1 * ppm); ctx.lineTo(cx + x2 * ppm, cy + y2 * ppm); ctx.stroke(); }
    function dot(x, y, r) { ctx.beginPath(); ctx.arc(cx + x * ppm, cy + y * ppm, Math.max(1.1, r * ppm), 0, Math.PI * 2); ctx.fill(); }
    var ext = R / ppm + 1;
    if (S.ret === 'mildot') {
      line(-ext, 0, -10, 0); line(10, 0, ext, 0); line(0, -ext, 0, -10); line(0, 10, 0, ext);
      ctx.lineWidth = lw * 0.6;
      line(-10, 0, 10, 0); line(0, -10, 0, 10);
      for (var i = 1; i <= 10; i++) { dot(i, 0, 0.11); dot(-i, 0, 0.11); dot(0, i, 0.11); dot(0, -i, 0.11); }
    } else if (S.ret === 'moa') {
      var moa = 0.2908882;
      line(-ext, 0, -20 * moa, 0); line(20 * moa, 0, ext, 0); line(0, -ext, 0, -20 * moa); line(0, 20 * moa, 0, ext);
      ctx.lineWidth = lw * 0.6;
      line(-20 * moa, 0, 20 * moa, 0); line(0, -20 * moa, 0, 20 * moa);
      for (var m = 1; m <= 20; m++) {
        var len = m % 5 === 0 ? 0.5 : 0.25;
        line(m * moa, -len, m * moa, len); line(-m * moa, -len, -m * moa, len);
        line(-len, m * moa, len, m * moa); line(-len, -m * moa, len, -m * moa);
        if (m % 5 === 0) { ctx.fillText(m + '', cx + m * moa * ppm, cy - 0.7 * ppm); ctx.fillText(m + '', cx - 0.9 * ppm, cy + m * moa * ppm); }
      }
    } else if (S.ret === 'horus') {
      ctx.lineWidth = lw * 0.55;
      line(-ext, 0, ext, 0); line(0, -ext, 0, ext);
      for (var y = 1; y <= 10; y++) {
        line(-5, y, 5, y);
        for (var x = -5; x <= 5; x += 0.5) { var hl = (x % 1 === 0) ? 0.22 : 0.1; line(x, y - hl, x, y + hl); }
        ctx.fillText(y + '', cx + 5.6 * ppm, cy + y * ppm + 2);
      }
      for (var xx = -5; xx <= 5; xx++) { if (xx !== 0) line(xx, 0, xx, 10); }
    } else if (S.ret === 'tremor') {
      ctx.lineWidth = lw * 0.55;
      line(-ext, 0, ext, 0); line(0, -ext, 0, ext);
      for (var ty2 = 1; ty2 <= 10; ty2++) {
        for (var tx = -6; tx <= 6; tx++) {
          if (tx === 0 && ty2 === 0) continue;
          dot(tx, ty2, (tx % 1 === 0 && ty2 % 1 === 0) ? 0.09 : 0.055);
        }
        if (ty2 % 2 === 0) ctx.fillText(ty2 + '', cx + 6.7 * ppm, cy + ty2 * ppm + 2);
      }
      for (var ux = -6; ux <= 6; ux++) dot(ux, 0, 0.07);
    } else { /* g2c */
      ctx.lineWidth = lw * 3.2;
      line(-ext, 0, -6, 0); line(6, 0, ext, 0); line(0, -ext, 0, -6); line(0, 6, 0, ext);
      ctx.lineWidth = lw * 0.6;
      line(-6, 0, 6, 0); line(0, -6, 0, 6);
      [4, 6, 8].forEach(function (b) { ctx.lineWidth = lw * 1.4; line(-1.2, b, 1.2, b); });
    }
    if (S.illum) {
      ctx.fillStyle = cssVar('--red', '#ff5d6c');
      ctx.shadowColor = cssVar('--red', '#ff5d6c'); ctx.shadowBlur = 9;
      ctx.beginPath(); ctx.arc(cx, cy, Math.max(1.6, ppm * 0.09), 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = etch;
      ctx.beginPath(); ctx.arc(cx, cy, Math.max(1.2, ppm * 0.06), 0, Math.PI * 2); ctx.fill();
    }
  }

  function updateChips(sol, fovMil, hMil) {
    var el = document.getElementById('rt-chips');
    if (!el) return;
    if (!sol) { el.innerHTML = '<span class="chip"><span class="chip-label">' + L('Status', 'Status') + '</span><span class="chip-value">' + L('Keine Berechnung', 'No solution') + '</span></span>'; return; }
    var cm = sol.cm;
    var eC = Math.abs(sol.dropMil) / cm, wC = Math.abs(sol.windMil) / cm;
    el.innerHTML =
      '<span class="chip"><span class="chip-label">Drop</span><span class="chip-value">−' + sol.dropMil.toFixed(2) + ' mil</span></span>' +
      '<span class="chip"><span class="chip-label">' + L('Wind', 'Wind') + '</span><span class="chip-value">' + sol.windMil.toFixed(2) + ' mil</span></span>' +
      '<span class="chip"><span class="chip-label">' + L('Höhe Klicks', 'Elev clicks') + '</span><span class="chip-value">' + eC.toFixed(1) + '</span></span>' +
      '<span class="chip"><span class="chip-label">' + L('Seite Klicks', 'Wind clicks') + '</span><span class="chip-value">' + wC.toFixed(1) + (sol.windMil > 0.005 ? ' L' : sol.windMil < -0.005 ? ' R' : '') + '</span></span>' +
      '<span class="chip"><span class="chip-label">FOV</span><span class="chip-value">' + fovMil.toFixed(1) + ' mil</span></span>' +
      '<span class="chip"><span class="chip-label">' + L('Ziel', 'Target') + '</span><span class="chip-value">' + hMil.toFixed(2) + ' mil</span></span>';
  }

  /* --- Lifecycle ---------------------------------------------------------- */
  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () {
      pending = false;
      mount();
      if (canvas && !canvas.isConnected) canvas = null;
      if (canvas) { syncControls(); draw(); }
    });
  }
  new MutationObserver(schedule).observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
  window.addEventListener('resize', function () { draw(); });
  schedule();
})();