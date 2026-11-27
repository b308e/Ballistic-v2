/* ============================================================================
   UX-ERWEITERUNG: SEITENWIND-KORREKTUR (Windage) v1.1.0
   ----------------------------------------------------------------------------
   - Liest die Seitenabweichung (Abdrift-Spalte) der berechneten Tabelle.
   - Rechnet sie in Korrektur um: mil + Klicks (Klickwert aus dem Schuss-Setup),
     mit Richtung L/R und Vorzeichen-Konvention "+ Abdrift = rechts".
   - Eigener Trim (± Klicks), persistiert, wirkt auf alle Distanzen.
   - Ergänzt die Haupttabelle um die Spalte "Windage (Klicks)".
   - Eigenes Panel "Seitenwind-Korrektur" mit Live-Readout der Windkomponenten.
   Kopplung nur über DOM + Events, keine Änderung an bestehender Logik.
   ========================================================================== */
(function () {
  'use strict';
  if (window.__sniperWindageMounted) return;
  window.__sniperWindageMounted = true;

  var KEY = 'sniperUx.v1';
  var st = { trim: 0, ref: 0 };
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var p = JSON.parse(raw);
      if (p && typeof p.windTrim === 'number') st.trim = p.windTrim;
      if (p && typeof p.windRef === 'number') st.windRef = p.windRef;
      if (p && typeof p.windRef === 'number') st.ref = p.windRef;
    }
  } catch (e) {}
  function save() {
    try {
      var cur = {};
      try { cur = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
      cur.windTrim = st.trim; cur.windRef = st.ref;
      localStorage.setItem(KEY, JSON.stringify(cur));
    } catch (e) {}
  }
  function DE() { return (document.documentElement.lang || 'de').toLowerCase().indexOf('de') === 0; }
  function L(de, en) { return DE() ? de : en; }

  function num(v) {
    if (v === null || v === undefined) return null;
    var n = parseFloat(String(v).replace(',', '.'));
    return isFinite(n) ? n : null;
  }
  function cellNum(td) {
    if (!td) return null;
    var node = td.childNodes[0];
    var txt = (node && node.nodeType === 3 ? node.textContent : td.textContent) || '';
    return num(txt.replace(/[^0-9.+\-]/g, ''));
  }

  /* --- Windvektor aus den Env-Feldern ------------------------------------ */
  function wind() {
    var sp = num((document.querySelector('[data-field="env.windSpeed"]') || {}).value) || 0;
    var unit = (document.querySelector('[data-field="env.windUnit"]') || {}).value || 'm/s';
    if (unit === 'km/h') sp = sp / 3.6;
    if (unit === 'mph') sp = sp * 0.44704;
    if (unit === 'ft/s') sp = sp * 0.3048;
    var ang = num((document.querySelector('.wind-side input[data-field="env.windAngleDeg"]') ||
      document.querySelector('input.range[data-field="env.windAngleDeg"]') || {}).value) || 0;
    var rad = ang * Math.PI / 180;
    return { speed: sp, angle: ang, cross: sp * Math.sin(rad), head: sp * Math.cos(rad) };
  }

  /* --- Klickwert aus dem Schuss-Setup (MIL oder MOA, auch Brüche) --------- */
  function clickMil() {
    var sel = null;
    var fields = document.querySelectorAll('.shot-panel select[data-field], select[data-field]');
    for (var i = 0; i < fields.length; i++) {
      var lab = fields[i].closest('.field');
      if (lab && /klickwert|click/i.test(lab.textContent)) { sel = fields[i]; break; }
    }
    if (!sel) return 0.1;
    var txt = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].textContent : '';
    var m = txt.match(/(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)\s*(MIL|MOA)/i);
    if (!m) return 0.1;
    var val = m[1].indexOf('/') >= 0
      ? (function (f) { var a = f.split('/'); return parseFloat(a[0]) / parseFloat(a[1]); })(m[1].replace(/\s/g, ''))
      : parseFloat(m[1].replace(',', '.'));
    if (!isFinite(val) || val <= 0) return 0.1;
    return /MOA/i.test(m[2]) ? val * 0.2908882086657216 : val;
  }

  /* --- Zeilen der berechneten Tabelle (Distanz, Abdrift cm) -------------- */
  function rows() {
    var card = document.querySelector('.result-card');
    if (!card) return [];
    var table = card.querySelector('.table-block .data-table');
    if (!table) return [];
    var out = [];
    var trs = table.querySelectorAll('tbody tr');
    for (var i = 0; i < trs.length; i++) {
      var td = trs[i].children;
      var d = cellNum(td[0]), drift = cellNum(td[5]);
      if (d !== null && drift !== null) out.push({ d: d, drift: drift });
    }
    return out;
  }

  /* Korrektur in Klicks: + = Korrektur nach rechts, − = nach links.
     Abdrift + = Geschoss nach rechts => Korrektur nach links (negativ). */
  function corrClicks(d, drift, cm) {
    if (d <= 0) return null;
    var mil = (drift * 10) / d;
    return -(mil / cm);
  }
  function dirTxt(c) { return c < -0.005 ? 'L' : c > 0.005 ? 'R' : '·'; }
  function dirLong(c) {
    return c < -0.005 ? L('links', 'left') : c > 0.005 ? L('rechts', 'right') : L('keine', 'none');
  }
  function fmt1(n) { return (Math.round(n * 10) / 10).toFixed(1); }

  /* --- Haupttabelle um Windage-Spalte ergänzen --------------------------- */
  function augmentTables() {
    var cm = clickMil();
    var cards = document.querySelectorAll('.result-card');
    for (var c = 0; c < cards.length; c++) {
      var table = cards[c].querySelector('.table-block .data-table');
      if (!table || table.dataset.uxWindage) continue;
      table.dataset.uxWindage = '1';
      var head = table.querySelector('thead tr');
      if (head) {
        var th = document.createElement('th');
        th.textContent = L('Windage (Klicks)', 'Windage (clicks)');
        head.appendChild(th);
      }
      var trs = table.querySelectorAll('tbody tr');
      for (var i = 0; i < trs.length; i++) {
        var td = trs[i].children;
        var d = cellNum(td[0]), drift = cellNum(td[5]);
        var out = document.createElement('td');
        var base = corrClicks(d, drift, cm);
        if (base === null) { out.textContent = '–'; }
        else {
          var corr = base + st.trim;
          out.innerHTML = '<span class="strong">' + fmt1(Math.abs(corr)) + ' ' + dirTxt(corr) + '</span>' +
            '<span class="sub">' + (corr < 0 ? L('links dialen', 'dial left') : corr > 0 ? L('rechts dialen', 'dial right') : L('halten', 'hold')) + '</span>';
        }
        trs[i].appendChild(out);
      }
    }
  }

  /* --- Panel -------------------------------------------------------------- */
  function mountPanel() {
    if (document.getElementById('ux-windage')) return;
    var host = document.querySelector('.results-grid');
    host = host ? host.parentElement : document.querySelector('.results');
    if (!host || !document.querySelector('.result-card')) return;
    var anchor = document.getElementById('ux-drop-chart') || host.querySelector('.results-grid') || host.lastElementChild;
    var card = document.createElement('div');
    card.className = 'card';
    card.id = 'ux-windage';
    card.innerHTML =
      '<h3>' + L('Seitenwind-Korrektur', 'Crosswind Correction') + '</h3>' +
      '<div class="chips" id="ux-wchips"></div>' +
      '<div class="version-hero" style="margin-top:10px">' +
        '<div class="version-badge" id="ux-whero">–</div>' +
        '<div class="version-meta"><span id="ux-wdir">–</span>' +
        '<span>' + L('Korrektur bei Referenzdistanz (inkl. Trim)', 'Correction at reference distance (incl. trim)') + '</span></div>' +
      '</div>' +
      '<div class="chart-controls">' +
        '<span class="control-label">' + L('Referenz', 'Reference') + '</span>' +
        '<select class="input" id="ux-wref"></select>' +
        '<span class="control-label">Trim</span>' +
        '<button type="button" class="btn btn-small" data-wtrim="-0.5">−0.5</button>' +
        '<b class="num" id="ux-wtrim" style="min-width:64px;text-align:center">+0.0</b>' +
        '<button type="button" class="btn btn-small" data-wtrim="0.5">+0.5</button>' +
        '<button type="button" class="btn btn-small btn-ghost" id="ux-wreset">' + L('Nullen', 'Zero') + '</button>' +
      '</div>' +
      '<div class="table-scroll"><table class="data-table" style="min-width:360px">' +
        '<thead><tr><th>' + L('Distanz (m)', 'Distance (m)') + '</th><th>' + L('Abdrift (cm)', 'Drift (cm)') + '</th>' +
        '<th>mil</th><th>' + L('Klicks korrigiert', 'Clicks corrected') + '</th></tr></thead>' +
        '<tbody id="ux-wbody"></tbody></table></div>' +
      '<p class="hint">' + L('Konvention: + Abdrift = Geschoss nach rechts → Korrektur links (L). Trim + = Korrektur nach rechts, wirkt auf alle Distanzen und bleibt gespeichert.', 'Convention: + drift = bullet right → correct left (L). Trim + = correction right, applies to all distances and is saved.') + '</p>';
    if (anchor && anchor.parentElement === host) anchor.insertAdjacentElement('afterend', card);
    else host.appendChild(card);
    card.addEventListener('click', function (ev) {
      var t = ev.target.closest && ev.target.closest('[data-wtrim]');
      if (t) { st.trim = Math.round((st.trim + parseFloat(t.getAttribute('data-wtrim'))) * 10) / 10; save(); refresh(); return; }
      if (ev.target.id === 'ux-wreset') { st.trim = 0; save(); refresh(); }
    });
    card.addEventListener('change', function (ev) {
      if (ev.target.id === 'ux-wref') { st.ref = parseInt(ev.target.value, 10) || 0; save(); refresh(); }
    });
  }

  function refresh() {
    mountPanel();
    var card = document.getElementById('ux-windage');
    if (!card) return;
    var w = wind(), cm = clickMil(), rs = rows();

    var chips = document.getElementById('ux-wchips');
    if (chips) chips.innerHTML =
      '<span class="chip"><span class="chip-label">' + L('Seitenwind', 'Crosswind') + '</span><span class="chip-value">' + fmt1(Math.abs(w.cross)) + ' m/s ' + (w.cross > 0.01 ? L('von rechts', 'from right') : w.cross < -0.01 ? L('von links', 'from left') : '–') + '</span></span>' +
      '<span class="chip"><span class="chip-label">' + L('Längswind', 'Head/Tail') + '</span><span class="chip-value">' + fmt1(Math.abs(w.head)) + ' m/s ' + (w.head > 0.01 ? L('Gegenwind', 'head') : w.head < -0.01 ? L('Rückenwind', 'tail') : '–') + '</span></span>' +
      '<span class="chip"><span class="chip-label">' + L('Klickwert', 'Click value') + '</span><span class="chip-value">' + (Math.round(cm * 1000) / 1000) + ' mil</span></span>';

    var sel = document.getElementById('ux-wref');
    if (sel) {
      var opts = rs.map(function (r) { return '<option value="' + r.d + '">' + r.d + ' m</option>'; }).join('');
      if (sel.innerHTML !== opts) sel.innerHTML = opts;
      if (!st.ref || !rs.some(function (r) { return r.d === st.ref; })) st.ref = rs.length ? rs[Math.min(2, rs.length - 1)].d : 0;
      sel.value = String(st.ref);
    }

    var hero = document.getElementById('ux-whero'), dir = document.getElementById('ux-wdir');
    var row = null;
    for (var i = 0; i < rs.length; i++) if (rs[i].d === st.ref) row = rs[i];
    if (row && row.d > 0) {
      var corr = corrClicks(row.d, row.drift, cm) + st.trim;
      if (hero) hero.textContent = fmt1(Math.abs(corr)) + ' ' + dirTxt(corr);
      if (dir) dir.textContent = L('Klicks nach ', 'clicks ') + dirLong(corr) + ' · ' + fmt1(Math.abs(corr) * cm) + ' mil';
    } else {
      if (hero) hero.textContent = '–';
      if (dir) dir.textContent = L('Keine berechneten Werte – BC prüfen.', 'No computed values – check BC.');
    }

    var tb = document.getElementById('ux-wtrim');
    if (tb) tb.textContent = (st.trim >= 0 ? '+' : '') + fmt1(st.trim);

    var body = document.getElementById('ux-wbody');
    if (body) body.innerHTML = rs.map(function (r) {
      var base = corrClicks(r.d, r.drift, cm);
      if (base === null) return '<tr><td>' + r.d + '</td><td>–</td><td>–</td><td>–</td></tr>';
      var corr = base + st.trim;
      return '<tr><td>' + r.d + '</td><td>' + fmt1(r.drift) + '</td><td>' + fmt1(Math.abs(base) * cm) + '</td>' +
        '<td><span class="strong">' + fmt1(Math.abs(corr)) + ' ' + dirTxt(corr) + '</span></td></tr>';
    }).join('') || '<tr><td colspan="4">–</td></tr>';

    augmentTables();
  }

  /* --- Lifecycle: nach jedem App-Render neu mounten/aktualisieren --------- */
  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; refresh(); });
  }
  new MutationObserver(schedule).observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
  document.addEventListener('input', function (ev) {
    var f = ev.target.getAttribute && ev.target.getAttribute('data-field');
    if (f && /^env\.(windSpeed|windUnit|windAngleDeg)$/.test(f)) schedule();
  });
  document.addEventListener('change', function (ev) {
    var f = ev.target.getAttribute && ev.target.getAttribute('data-field');
    if (f && (/wind/i.test(f) || /click|klick/i.test(f))) schedule();
  });
  schedule();
})();