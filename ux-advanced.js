/* ============================================================================
   UX-ERWEITERUNG v1.1.0 — wird NACH dem bestehenden app.js-Code angehängt.
   ----------------------------------------------------------------------------
   Enthält:
     A) Windrichtung als interaktiver Kompass-Ring (Drag, Tastatur, Quick-Keys)
     B) Drop-Kurve als Canvas-Chart (A/B + Hersteller-Referenzen, bis 4 Spuren)
     C) Sensor-Overlay: Live-Kompass & Neigungsmesser, Messdauer 2–10 s
     D) Einstellungen: Messdauer-Regler + App-Versions-Karte
   Kopplung nur über DOM (data-field Events + MutationObserver). Keine Änderung
   an bestehender Logik, keine globalen Abhängigkeiten außer window.Ballistics
   (optional, nur für Versionsanzeige) und den DB-Versions-Globals.
   ========================================================================== */
(function () {
  'use strict';
  if (window.__sniperUxMounted) return;
  window.__sniperUxMounted = true;

  var UX_KEY = 'sniperUx.v1';
  var prefs = { sensorSecs: 5 };
  try {
    var raw = localStorage.getItem(UX_KEY);
    if (raw) { var p = JSON.parse(raw); if (p && p.sensorSecs >= 2 && p.sensorSecs <= 10) prefs.sensorSecs = p.sensorSecs; }
  } catch (e) {}
  function savePrefs() { try { localStorage.setItem(UX_KEY, JSON.stringify(prefs)); } catch (e) {} }

  var DE = (document.documentElement.lang || 'de').toLowerCase().indexOf('de') === 0;
  function L(de, en) { return DE ? de : en; }

  function appVersion() {
    var m = document.querySelector('meta[name="app-version"]');
    return m && m.content ? m.content : '1.1.0';
  }

  function toast(msg) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 320); }, 2600);
  }

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function parseCell(td) {
    if (!td) return null;
    var node = td.childNodes[0];
    var txt = (node && node.nodeType === 3 ? node.textContent : td.textContent) || '';
    txt = txt.replace(',', '.').replace(/[^0-9.+\-]/g, '');
    if (!txt || txt === '-' || txt === '.') return null;
    var n = parseFloat(txt);
    return isFinite(n) ? n : null;
  }

  function fireField(input, value) {
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function findByLabel(scope, re) {
    var fields = scope.querySelectorAll('[data-field]');
    for (var i = 0; i < fields.length; i++) {
      var lab = fields[i].closest('.field');
      var txt = lab ? lab.textContent : '';
      if (re.test(txt)) return fields[i];
    }
    return null;
  }

  /* ==========================================================================
     A) WIND-KOMPASS-RING
     ======================================================================== */
  function dialSVG() {
    var s = '<svg viewBox="0 0 120 120" aria-hidden="true">';
    s += '<circle class="dial-face" cx="60" cy="60" r="57"/>';
    s += '<circle class="dial-ring-inner" cx="60" cy="60" r="44"/>';
    for (var a = 0; a < 360; a += 15) {
      var major = a % 45 === 0;
      var r1 = major ? 48 : 51, r2 = 55;
      var rad = (a - 90) * Math.PI / 180;
      s += '<line class="dial-tick' + (major ? ' major' : '') + '" x1="' + (60 + r1 * Math.cos(rad)).toFixed(2) +
           '" y1="' + (60 + r1 * Math.sin(rad)).toFixed(2) + '" x2="' + (60 + r2 * Math.cos(rad)).toFixed(2) +
           '" y2="' + (60 + r2 * Math.sin(rad)).toFixed(2) + '"/>';
    }
    [[0, '0', ' head'], [90, '90', ''], [180, '180', ''], [270, '270', '']].forEach(function (c) {
      var rad = (c[0] - 90) * Math.PI / 180;
      s += '<text class="dial-cardinal' + c[2] + '" x="' + (60 + 37 * Math.cos(rad)).toFixed(2) +
           '" y="' + (60 + 37 * Math.sin(rad)).toFixed(2) + '">' + c[1] + '</text>';
    });
    s += '<g class="dial-rotor">';
    s += '<line class="dial-tail" x1="60" y1="14" x2="60" y2="6"/>';
    s += '<line class="dial-arrow" x1="60" y1="16" x2="60" y2="40"/>';
    s += '<path class="dial-arrow-head" d="M60 46 L55.5 37 L64.5 37 Z"/>';
    s += '<circle class="dial-handle" cx="60" cy="10" r="6.5"/>';
    s += '</g>';
    s += '<circle class="dial-hub" cx="60" cy="60" r="5"/>';
    s += '</svg>';
    return s;
  }

  function mountWindDial() {
    var range = document.querySelector('input.range[data-field="env.windAngleDeg"]');
    if (!range) return;
    var field = range.closest('.field');
    if (!field || field.dataset.uxWind) return;
    field.dataset.uxWind = '1';
    field.classList.add('wind-cell');

    var cur = parseFloat(range.value) || 0;
    var layout = document.createElement('div');
    layout.className = 'wind-layout';
    layout.innerHTML =
      '<div class="wind-dial" id="ux-wind-dial" role="slider" tabindex="0" aria-label="' +
        L('Windrichtung in Grad', 'Wind direction in degrees') + '" aria-valuemin="0" aria-valuemax="360" aria-valuenow="' + cur + '">' +
        dialSVG() + '</div>' +
      '<div class="wind-side">' +
        '<input class="input" type="number" inputmode="decimal" min="0" max="360" step="1" data-field="env.windAngleDeg" value="' + cur + '">' +
        '<div class="dial-quick">' +
          [0, 90, 180, 270].map(function (a) {
            return '<button type="button" class="btn btn-small" data-quick="' + a + '">' + a + '°</button>';
          }).join('') +
        '</div>' +
        '<span class="hint">' + L('Ziehen am Ring · Pfeile = feine Schritte', 'Drag the ring · arrow keys = fine steps') + '</span>' +
      '</div>';
    range.replaceWith(layout);
    syncDial(cur);
  }

  function dialEls() {
    return {
      dial: document.getElementById('ux-wind-dial'),
      input: document.querySelector('.wind-side input[data-field="env.windAngleDeg"]'),
      val: document.getElementById('wind-angle-val')
    };
  }

  function syncDial(deg) {
    var e = dialEls();
    if (!e.dial) return;
    deg = ((Math.round(deg) % 360) + 360) % 360;
    var rotor = e.dial.querySelector('.dial-rotor');
    if (rotor) rotor.setAttribute('transform', 'rotate(' + deg + ' 60 60)');
    e.dial.setAttribute('aria-valuenow', deg);
    if (e.val) e.val.textContent = deg + '°';
    if (e.input && document.activeElement !== e.input) e.input.value = deg;
    var quick = e.dial.parentElement.querySelectorAll('[data-quick]');
    for (var i = 0; i < quick.length; i++) {
      quick[i].classList.toggle('active', parseInt(quick[i].getAttribute('data-quick'), 10) === deg);
    }
  }

  function angleFromEvent(ev, dial) {
    var r = dial.getBoundingClientRect();
    var dx = ev.clientX - (r.left + r.width / 2);
    var dy = ev.clientY - (r.top + r.height / 2);
    var deg = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    return ((Math.round(deg) % 360) + 360) % 360;
  }

  document.addEventListener('pointerdown', function (ev) {
    var dial = ev.target.closest && ev.target.closest('.wind-dial');
    if (!dial) return;
    ev.preventDefault();
    dial.classList.add('dragging');
    try { dial.setPointerCapture(ev.pointerId); } catch (e) {}
    syncDial(angleFromEvent(ev, dial));
    function move(e2) { syncDial(angleFromEvent(e2, dial)); }
    function up(e2) {
      dial.classList.remove('dragging');
      dial.removeEventListener('pointermove', move);
      dial.removeEventListener('pointerup', up);
      dial.removeEventListener('pointercancel', up);
      var deg = angleFromEvent(e2, dial);
      var inp = dialEls().input;
      if (inp) fireField(inp, deg);
    }
    dial.addEventListener('pointermove', move);
    dial.addEventListener('pointerup', up);
    dial.addEventListener('pointercancel', up);
  });

  document.addEventListener('keydown', function (ev) {
    var dial = ev.target.closest && ev.target.closest('.wind-dial');
    if (!dial) return;
    var cur = parseInt(dial.getAttribute('aria-valuenow'), 10) || 0;
    var step = ev.shiftKey ? 15 : 1;
    var next = null;
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') next = cur + step;
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') next = cur - step;
    if (ev.key === 'Home') next = 0;
    if (ev.key === 'End') next = 359;
    if (next === null) return;
    ev.preventDefault();
    next = ((next % 360) + 360) % 360;
    syncDial(next);
    var inp = dialEls().input;
    if (inp) fireField(inp, next);
  });

  document.addEventListener('click', function (ev) {
    var q = ev.target.closest && ev.target.closest('[data-quick]');
    if (!q) return;
    var inp = dialEls().input;
    if (inp) fireField(inp, parseInt(q.getAttribute('data-quick'), 10));
  });

  /* ==========================================================================
     B) DROP-KURVE (Canvas)
     ======================================================================== */
  var chartState = { maxD: 0, unit: 'cm', grid: true, zero: true, refs: true, off: {} };
  var chartCanvas = null, chartRO = null;

  function collectSeries() {
    var out = [];
    var cards = document.querySelectorAll('.result-card');
    var palette = [
      { key: 'A', color: cssVar('--amber', '#f5a524'), dash: [] },
      { key: 'B', color: cssVar('--green', '#38d39f'), dash: [7, 4] },
      { key: 'A·DB', color: cssVar('--blue', '#58a6ff'), dash: [2, 4] },
      { key: 'B·DB', color: cssVar('--magenta', '#e879f9'), dash: [10, 4, 2, 4] }
    ];
    for (var i = 0; i < cards.length && i < 2; i++) {
      var tables = cards[i].querySelectorAll('.table-block .data-table');
      var nameEl = cards[i].querySelector('.result-head h3');
      var name = nameEl ? nameEl.textContent.trim() : ('#' + (i + 1));
      if (tables[0]) {
        var pts = readTable(tables[0]);
        if (pts.length) out.push({ id: palette[i].key, label: palette[i].key + ' · ' + name, color: palette[i].color, dash: palette[i].dash, pts: pts, ref: false });
      }
      if (tables[1]) {
        var rp = readTable(tables[1]);
        if (rp.length) out.push({ id: palette[i + 2].key, label: palette[i + 2].key + ' · ' + L('Hersteller', 'Manufacturer'), color: palette[i + 2].color, dash: palette[i + 2].dash, pts: rp, ref: true });
      }
    }
    return out;
  }

  function readTable(table) {
    var pts = [];
    var rows = table.querySelectorAll('tbody tr');
    for (var i = 0; i < rows.length; i++) {
      var td = rows[i].children;
      var d = parseCell(td[0]);
      var drop = parseCell(td[3]);
      if (d !== null && drop !== null) pts.push({ d: d, y: drop });
    }
    pts.sort(function (a, b) { return a.d - b.d; });
    return pts;
  }

  function mountChart() {
    if (document.getElementById('ux-drop-chart')) return;
    var grid = document.querySelector('.results-grid');
    var host = grid ? grid.parentElement : document.querySelector('.results');
    if (!host || !document.querySelector('.result-card')) return;

    var card = document.createElement('div');
    card.className = 'card chart-card';
    card.id = 'ux-drop-chart';
    card.innerHTML =
      '<div class="chart-head"><h3>' + L('Flugbahn · Geschossfall', 'Trajectory · Bullet Drop') + '</h3>' +
      '<div class="chart-legend" id="ux-legend"></div></div>' +
      '<div class="chart-controls">' +
        '<span class="control-label">' + L('Distanz', 'Range') + '</span>' +
        '<select class="input" id="ux-maxd">' +
          '<option value="0">' + L('Auto', 'Auto') + '</option><option value="300">300 m</option><option value="500">500 m</option>' +
          '<option value="800">800 m</option><option value="1000">1000 m</option><option value="1500">1500 m</option>' +
        '</select>' +
        '<span class="control-label">' + L('Einheit', 'Unit') + '</span>' +
        '<select class="input" id="ux-unit"><option value="cm">cm</option><option value="mil">mil</option><option value="m">m</option></select>' +
        '<button type="button" class="btn btn-small" id="ux-grid">' + L('Raster', 'Grid') + '</button>' +
        '<button type="button" class="btn btn-small" id="ux-zero">' + L('Nulllinie', 'Zero line') + '</button>' +
        '<button type="button" class="btn btn-small" id="ux-refs">' + L('DB-Referenz', 'DB reference') + '</button>' +
        '<button type="button" class="btn btn-small btn-primary" id="ux-export">PNG</button>' +
      '</div>' +
      '<div class="chart-wrap"><canvas class="drop-canvas" id="ux-canvas"></canvas>' +
      '<div class="chart-tip" id="ux-tip"></div><div class="chart-empty" id="ux-empty" hidden></div></div>';
    if (grid && grid.parentElement === host) grid.insertAdjacentElement('afterend', card);
    else host.appendChild(card);

    chartCanvas = card.querySelector('#ux-canvas');
    card.querySelector('#ux-maxd').value = String(chartState.maxD);
    card.querySelector('#ux-unit').value = chartState.unit;
    syncChartButtons();

    if (chartRO) chartRO.disconnect();
    if (window.ResizeObserver) {
      chartRO = new ResizeObserver(function () { drawChart(); });
      chartRO.observe(card.querySelector('.chart-wrap'));
    }
    chartCanvas.addEventListener('pointermove', chartHover);
    chartCanvas.addEventListener('pointerleave', function () {
      var tip = document.getElementById('ux-tip');
      if (tip) tip.classList.remove('show');
      drawChart();
    });
    drawChart();
  }

  function syncChartButtons() {
    var g = document.getElementById('ux-grid'), z = document.getElementById('ux-zero'), r = document.getElementById('ux-refs');
    if (g) g.classList.toggle('btn-primary', chartState.grid);
    if (z) z.classList.toggle('btn-primary', chartState.zero);
    if (r) r.classList.toggle('btn-primary', chartState.refs);
  }

  function convertY(dropCm, distM) {
    if (chartState.unit === 'm') return dropCm / 100;
    if (chartState.unit === 'mil') return distM > 0 ? (dropCm * 10) / distM : 0;
    return dropCm;
  }

  function visibleSeries() {
    return collectSeries().filter(function (s) {
      if (s.ref && !chartState.refs) return false;
      return !chartState.off[s.id];
    });
  }

  function drawChart(hoverD) {
    var cv = chartCanvas;
    if (!cv || !cv.isConnected) return;
    var wrap = cv.parentElement;
    var W = wrap.clientWidth, H = wrap.clientHeight;
    if (!W || !H) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var series = visibleSeries();
    var empty = document.getElementById('ux-empty');
    buildLegend();
    if (!series.length) {
      ctx.clearRect(0, 0, W, H);
      if (empty) { empty.hidden = false; empty.textContent = L('Keine berechneten Werte – BC prüfen oder Laborierung wählen.', 'No computed values – check BC or select a load.'); }
      return;
    }
    if (empty) empty.hidden = true;

    var maxD = chartState.maxD;
    if (!maxD) {
      series.forEach(function (s) { s.pts.forEach(function (p) { if (p.d > maxD) maxD = p.d; }); });
      maxD = Math.max(100, Math.ceil(maxD / 100) * 100);
    }
    var yMin = 0, yMax = 0;
    series.forEach(function (s) {
      s.pts.forEach(function (p) {
        if (p.d > maxD) return;
        var y = convertY(p.y, p.d);
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      });
    });
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    var padY = (yMax - yMin) * 0.12;
    yMin -= padY; yMax += padY;

    var PL = 50, PR = 14, PT = 14, PB = 28;
    var iw = W - PL - PR, ih = H - PT - PB;
    function X(d) { return PL + (d / maxD) * iw; }
    function Y(y) { return PT + ((yMax - y) / (yMax - yMin)) * ih; }

    var cLine = cssVar('--line-soft', '#1a2636');
    var cText = cssVar('--text-faint', '#64788e');
    var cZero = cssVar('--text-dim', '#9db0c3');
    ctx.clearRect(0, 0, W, H);
    ctx.font = '10px ' + cssVar('--font-num', 'monospace');

    if (chartState.grid) {
      ctx.strokeStyle = cLine; ctx.lineWidth = 1; ctx.fillStyle = cText;
      var xStep = maxD <= 300 ? 50 : maxD <= 800 ? 100 : 200;
      for (var d = 0; d <= maxD; d += xStep) {
        ctx.beginPath(); ctx.moveTo(X(d), PT); ctx.lineTo(X(d), PT + ih); ctx.stroke();
        ctx.textAlign = 'center'; ctx.fillText(d + '', X(d), H - 10);
      }
      var yStep = niceStep((yMax - yMin) / 5);
      for (var y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
        ctx.beginPath(); ctx.moveTo(PL, Y(y)); ctx.lineTo(PL + iw, Y(y)); ctx.stroke();
        ctx.textAlign = 'right'; ctx.fillText(fmtY(y), PL - 6, Y(y) + 3);
      }
    }
    if (chartState.zero && yMin < 0 && yMax > 0) {
      ctx.strokeStyle = cZero; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(PL, Y(0)); ctx.lineTo(PL + iw, Y(0)); ctx.stroke();
      ctx.setLineDash([]);
    }

    series.forEach(function (s) {
      ctx.strokeStyle = s.color; ctx.lineWidth = 2.2; ctx.setLineDash(s.dash);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      var started = false;
      s.pts.forEach(function (p) {
        if (p.d > maxD) return;
        var x = X(p.d), y = Y(convertY(p.y, p.d));
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    });

    if (hoverD != null) {
      ctx.strokeStyle = cssVar('--amber', '#f5a524'); ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(X(hoverD), PT); ctx.lineTo(X(hoverD), PT + ih); ctx.stroke();
      ctx.setLineDash([]);
      series.forEach(function (s) {
        var p = nearestPoint(s.pts, hoverD, maxD);
        if (!p) return;
        ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.arc(X(p.d), Y(convertY(p.y, p.d)), 4, 0, Math.PI * 2); ctx.fill();
      });
    }
    ctx.textAlign = 'left'; ctx.fillStyle = cText;
    ctx.fillText(L('Distanz (m)', 'Distance (m)'), PL, H - 10 + 0);
  }

  function fmtY(y) {
    var a = Math.abs(y);
    return (a >= 100 ? y.toFixed(0) : a >= 10 ? y.toFixed(1) : y.toFixed(2)) + '';
  }
  function niceStep(raw) {
    var pow = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    var n = raw / pow;
    return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * pow;
  }
  function nearestPoint(pts, d, maxD) {
    var best = null, bd = Infinity;
    pts.forEach(function (p) {
      if (p.d > maxD) return;
      var diff = Math.abs(p.d - d);
      if (diff < bd) { bd = diff; best = p; }
    });
    return best;
  }

  function buildLegend() {
    var leg = document.getElementById('ux-legend');
    if (!leg) return;
    var all = collectSeries();
    var html = all.map(function (s) {
      var off = chartState.off[s.id] || (s.ref && !chartState.refs);
      return '<button type="button" class="legend-item' + (off ? ' off' : '') + '" data-series="' + s.id + '">' +
        '<span class="legend-dot" style="background:' + s.color + ';box-shadow:0 0 8px ' + s.color + '55"></span>' +
        s.label + '</button>';
    }).join('');
    if (leg.innerHTML !== html) leg.innerHTML = html;
  }

  function chartHover(ev) {
    var cv = chartCanvas;
    if (!cv) return;
    var r = cv.getBoundingClientRect();
    var series = visibleSeries();
    if (!series.length) return;
    var maxD = chartState.maxD;
    if (!maxD) series.forEach(function (s) { s.pts.forEach(function (p) { if (p.d > maxD) maxD = p.d; }); });
    maxD = Math.max(100, Math.ceil(maxD / 100) * 100);
    var PL = 50, PR = 14;
    var frac = (ev.clientX - r.left - PL) / (r.width - PL - PR);
    if (frac < 0 || frac > 1) { document.getElementById('ux-tip').classList.remove('show'); return; }
    var d = Math.round(frac * maxD);
    var tip = document.getElementById('ux-tip');
    var rows = series.map(function (s) {
      var p = nearestPoint(s.pts, d, maxD);
      if (!p) return '';
      return '<div class="tip-row"><span><i style="background:' + s.color + '"></i>' + s.id + '</span><b>' +
        fmtY(convertY(p.y, p.d)) + ' ' + chartState.unit + '</b></div>';
    }).join('');
    tip.innerHTML = '<div class="tip-title">' + d + ' m</div>' + rows;
    tip.style.left = Math.min(Math.max(ev.clientX - r.left, 70), r.width - 70) + 'px';
    tip.style.top = (ev.clientY - r.top) + 'px';
    tip.classList.add('show');
    drawChart(d);
  }

  document.addEventListener('change', function (ev) {
    if (ev.target.id === 'ux-maxd') { chartState.maxD = parseInt(ev.target.value, 10) || 0; drawChart(); }
    if (ev.target.id === 'ux-unit') { chartState.unit = ev.target.value; drawChart(); }
  });
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t.id === 'ux-grid') { chartState.grid = !chartState.grid; syncChartButtons(); drawChart(); }
    if (t.id === 'ux-zero') { chartState.zero = !chartState.zero; syncChartButtons(); drawChart(); }
    if (t.id === 'ux-refs') { chartState.refs = !chartState.refs; syncChartButtons(); drawChart(); }
    if (t.id === 'ux-export' && chartCanvas) {
      var a = document.createElement('a');
      a.download = 'drop-kurve.png';
      a.href = chartCanvas.toDataURL('image/png');
      a.click();
      toast(L('Kurve als PNG exportiert.', 'Chart exported as PNG.'));
    }
    var li = t.closest && t.closest('[data-series]');
    if (li) {
      var id = li.getAttribute('data-series');
      chartState.off[id] = !chartState.off[id];
      drawChart();
    }
  });

    /* ==========================================================================
     C) SENSOR-OVERLAY (Live-Kompass + Neigung, Messdauer 2–10 s) — FIXED
     ======================================================================== */
  var sensor = null;
  var orientHandler = null;

  function roseSVG() {
    var s = '<svg viewBox="0 0 120 120" aria-hidden="true">';
    s += '<circle class="rose-ring" cx="60" cy="60" r="57"/>';
    s += '<circle class="rose-ring-inner" cx="60" cy="60" r="46"/>';
    for (var a = 0; a < 360; a += 15) {
      var major = a % 90 === 0;
      var rad = (a - 90) * Math.PI / 180;
      var r1 = major ? 48 : 52;
      s += '<line class="rose-tick' + (major ? ' major' : '') + '" x1="' + (60 + r1 * Math.cos(rad)).toFixed(2) +
           '" y1="' + (60 + r1 * Math.sin(rad)).toFixed(2) + '" x2="' + (60 + 55 * Math.cos(rad)).toFixed(2) +
           '" y2="' + (60 + 55 * Math.sin(rad)).toFixed(2) + '"/>';
    }
    [['N', 0, ' n'], ['O', 90, ''], ['S', 180, ''], ['W', 270, '']].forEach(function (c) {
      var rad = (c[1] - 90) * Math.PI / 180;
      s += '<text class="rose-card' + c[2] + '" x="' + (60 + 38 * Math.cos(rad)).toFixed(2) +
           '" y="' + (60 + 38 * Math.sin(rad)).toFixed(2) + '">' + c[0] + '</text>';
    });
    s += '<g class="rose-rotor"><path class="rose-needle" d="M60 12 L65 58 L55 58 Z"/>' +
         '<path class="rose-needle-tail" d="M60 108 L64 62 L56 62 Z"/></g>';
    s += '<circle class="rose-hub" cx="60" cy="60" r="5"/></svg>';
    return s;
  }

  function openSensor() {
    closeSensor();
    
    // HTTPS Check für lokale Tests
    if (window.location.protocol !== 'https:' && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)) {
      toast(L('Sensoren benötigen HTTPS oder localhost.', 'Sensors require HTTPS or localhost.'));
      return;
    }

    var ov = document.createElement('div');
    ov.className = 'sensor-overlay';
    ov.id = 'ux-sensor';
    ov.innerHTML =
      '<div class="sensor-panel" role="dialog" aria-modal="true">' +
        '<h2>' + L('Sensor-Messung', 'Sensor Measurement') + '</h2>' +
        '<div class="segmented sensor-modes">' +
          '<button type="button" class="seg-btn active" data-mode="compass">' + L('Kompass', 'Compass') + '</button>' +
          '<button type="button" class="seg-btn" data-mode="tilt">' + L('Neigung', 'Incline') + '</button>' +
        '</div>' +
        '<div class="sensor-stage" data-stage="compass">' +
          '<div class="sensor-rose">' + roseSVG() + '</div>' +
          '<div class="sensor-heading"><b id="ux-head">—</b><span>' + L('Heading', 'Heading') + '</span></div>' +
        '</div>' +
        '<div class="tilt-stage" data-stage="tilt" hidden>' +
          '<div class="tilt-track"><div class="tilt-zero"></div><div class="tilt-bubble" id="ux-bubble"></div></div>' +
          '<div class="tilt-readout"><span id="ux-tilt">0.0°</span><small>' + L('Bergauf / Bergab', 'Uphill / Downhill') + '</small></div>' +
        '</div>' +
        '<div class="sensor-progress">' +
          '<div class="count-ring"><svg viewBox="0 0 54 54"><circle class="count-track" cx="27" cy="27" r="24"/>' +
          '<circle class="count-prog" id="ux-prog" cx="27" cy="27" r="24"/></svg><div class="count-num" id="ux-count">' + prefs.sensorSecs + '</div></div>' +
          '<div class="sensor-status"><span id="ux-status">' + L('Warte auf Sensor…', 'Waiting for sensor…') + '</span> <b id="ux-samples">0</b> ' + L('Samples', 'samples') +
            '<div class="sensor-quality" id="ux-quality">' + '<span class="qbar"></span>'.repeat(5) + '</div></div>' +
        '</div>' +
        '<div class="sensor-calib notice notice-warn" id="ux-calib" hidden><span class="calib-icon">∞</span>' +
          '<span>' + L('Kompass ungenau – Telefon einmal in einer Acht bewegen, dann neu messen.', 'Compass inaccurate – move phone in a figure-eight, then measure again.') + '</span></div>' +
        '<div class="notice notice-muted" style="margin-top:10px">' + L('Manuelle Korrektur:', 'Manual correction:') +
          ' <input class="input" type="number" id="ux-manual" step="0.1" style="min-height:38px;height:38px;margin-top:6px" placeholder="°"></div>' +
        '<div class="sensor-actions">' +
          '<button type="button" class="btn" id="ux-sensor-cancel">' + L('Abbrechen', 'Cancel') + '</button>' +
          '<button type="button" class="btn btn-primary" id="ux-sensor-apply" disabled>' + L('Übernehmen', 'Apply') + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);

    sensor = {
      mode: 'compass', heading: null, tilt: 0, samples: [], tiltSamples: [],
      accuracy: null, left: prefs.sensorSecs, done: false, timer: null, gotEvent: false
    };

    ov.addEventListener('click', function (ev) {
      if (ev.target === ov || ev.target.id === 'ux-sensor-cancel') { closeSensor(); return; }
      var mb = ev.target.closest && ev.target.closest('[data-mode]');
      if (mb) {
        sensor.mode = mb.getAttribute('data-mode');
        ov.querySelectorAll('[data-mode]').forEach(function (b) { b.classList.toggle('active', b === mb); });
        ov.querySelector('[data-stage="compass"]').hidden = sensor.mode !== 'compass';
        ov.querySelector('[data-stage="tilt"]').hidden = sensor.mode !== 'tilt';
        return;
      }
      if (ev.target.id === 'ux-sensor-apply') applySensor();
    });

    function onOrient(ev) {
      if (!sensor) return;
      sensor.gotEvent = true;
      var head = null;
      
      // iOS Safari Support
      if (typeof ev.webkitCompassHeading === 'number' && !isNaN(ev.webkitCompassHeading)) {
        head = ev.webkitCompassHeading;
        if (typeof ev.webkitCompassAccuracy === 'number') sensor.accuracy = ev.webkitCompassAccuracy;
      } 
      // Android / Standard API
      else if (ev.absolute && typeof ev.alpha === 'number') {
        head = (360 - ev.alpha) % 360;
      }

      if (head !== null) {
        sensor.heading = head;
        sensor.samples.push(head);
        var rotor = ov.querySelector('.rose-rotor');
        if (rotor) rotor.setAttribute('transform', 'rotate(' + (-head) + ' 60 60)');
        var hb = document.getElementById('ux-head');
        if (hb) hb.textContent = Math.round(head) + '°';
      }

      // Neigung berechnen
      var landscape = Math.abs(window.orientation || 0) === 90;
      var tilt = landscape ? (ev.gamma || 0) : ((ev.beta || 0) - 90);
      tilt = Math.max(-60, Math.min(60, tilt));
      sensor.tilt = tilt;
      sensor.tiltSamples.push(tilt);
      
      var bub = document.getElementById('ux-bubble');
      if (bub) bub.style.transform = 'translateX(' + (tilt / 60 * 45) + '%)';
      var tr = document.getElementById('ux-tilt');
      if (tr) tr.textContent = tilt.toFixed(1) + '°';
      
      var sb = document.getElementById('ux-samples');
      if (sb) sb.textContent = sensor.samples.length + sensor.tiltSamples.length;
      updateQuality();
    }

    function startListening() {
      orientHandler = onOrient;
      window.addEventListener('deviceorientation', orientHandler, true);
      
      // Countdown Timer
      sensor.timer = setInterval(function () {
        if (!sensor) return;
        sensor.left--;
        var cn = document.getElementById('ux-count');
        if (cn) cn.textContent = Math.max(0, sensor.left);
        var pr = document.getElementById('ux-prog');
        if (pr) pr.style.strokeDashoffset = String(150.8 * (sensor.left / prefs.sensorSecs));
        
        // Warnung wenn kein Signal kommt
        if (!sensor.gotEvent && sensor.left <= prefs.sensorSecs - 2) {
          var st = document.getElementById('ux-status');
          if (st) st.textContent = L('Kein Sensor-Signal – manuellen Wert eingeben.', 'No sensor signal – enter value manually.');
        }
        
        if (sensor.left <= 0) {
          clearInterval(sensor.timer);
          sensor.done = true;
          var st2 = document.getElementById('ux-status');
          if (st2) st2.textContent = L('Messung abgeschlossen.', 'Measurement complete.');
          var ap = document.getElementById('ux-sensor-apply');
          if (ap) ap.disabled = false;
          
          // Manuelles Feld vorausfüllen
          var man = document.getElementById('ux-manual');
          if (man && sensor.heading !== null && sensor.mode === 'compass') man.value = circularMean(sensor.samples).toFixed(1);
          if (man && sensor.mode === 'tilt') man.value = mean(sensor.tiltSamples).toFixed(1);
        }
      }, 1000);
    }

    // iOS Permission Handling
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(function (res) {
        if (res === 'granted') {
          startListening();
        } else {
          // Verweigert -> Manual Mode aktivieren
          var st = document.getElementById('ux-status');
          if (st) st.textContent = L('Zugriff verweigert. Bitte manuell eingeben.', 'Access denied. Please enter manually.');
          var ap = document.getElementById('ux-sensor-apply');
          if (ap) ap.disabled = false;
        }
      }).catch(function (err) {
        console.warn('Sensor permission error:', err);
        var ap = document.getElementById('ux-sensor-apply');
        if (ap) ap.disabled = false;
      });
    } else if ('DeviceOrientationEvent' in window) {
      // Android / Desktop Fallback
      startListening();
    } else {
      // Kein Sensor vorhanden
      var st = document.getElementById('ux-status');
      if (st) st.textContent = L('Kein Sensor verfügbar. Manuell eingeben.', 'No sensor available. Enter manually.');
      var ap = document.getElementById('ux-sensor-apply');
      if (ap) ap.disabled = false;
    }
  }

  function updateQuality() {
    var q = document.getElementById('ux-quality');
    if (!q || !sensor) return;
    var level;
    if (sensor.accuracy !== null && sensor.accuracy >= 0) {
      level = sensor.accuracy <= 15 ? 5 : sensor.accuracy <= 30 ? 3 : 1;
    } else {
      var spread = circularSpread(sensor.samples);
      level = spread < 3 ? 5 : spread < 8 ? 4 : spread < 15 ? 3 : spread < 30 ? 2 : 1;
    }
    var cls = level >= 4 ? 'g' : level >= 3 ? 'y' : 'r';
    var bars = q.children;
    for (var i = 0; i < bars.length; i++) bars[i].className = 'qbar' + (i < level ? ' on ' + cls : '');
    var cal = document.getElementById('ux-calib');
    if (cal) cal.hidden = level >= 3;
  }

  function circularMean(arr) {
    if (!arr.length) return 0;
    var sx = 0, sy = 0;
    arr.forEach(function (a) { var r = a * Math.PI / 180; sx += Math.cos(r); sy += Math.sin(r); });
    return ((Math.atan2(sy, sx) * 180 / Math.PI) + 360) % 360;
  }
  function circularSpread(arr) {
    if (arr.length < 2) return 0;
    var m = circularMean(arr), s = 0;
    arr.forEach(function (a) { var d = Math.abs(((a - m + 540) % 360) - 180); s += d * d; });
    return Math.sqrt(s / arr.length);
  }
  function mean(arr) { return arr.length ? arr.reduce(function (a, b) { return a + b; }, 0) / arr.length : 0; }

  function applySensor() {
    if (!sensor) return;
    var man = document.getElementById('ux-manual');
    var manual = man && man.value !== '' ? parseFloat(man.value) : null;
    
    if (sensor.mode === 'compass') {
      var val = manual !== null ? manual : (sensor.samples.length ? circularMean(sensor.samples) : null);
      if (val === null) { toast(L('Kein Messwert vorhanden.', 'No measurement available.')); return; }
      var target = document.querySelector('[data-field="env.azimuthDeg"]') ||
        findByLabel(document.querySelector('.shot-panel') || document, /azimut|schussrichtung/i);
      if (!target) { toast(L('Azimut-Feld nicht gefunden.', 'Azimuth field not found.')); return; }
      fireField(target, Math.round(((val % 360) + 360) % 360));
      toast(L('Schussrichtung übernommen: ', 'Azimuth applied: ') + Math.round(val) + '°');
    } else {
      var tv = manual !== null ? manual : (sensor.tiltSamples.length ? mean(sensor.tiltSamples) : sensor.tilt);
      var tf = document.querySelector('[data-field="env.shotAngleDeg"]') ||
        findByLabel(document.querySelector('.shot-panel') || document, /schusswinkel|bergauf/i);
      if (!tf) { toast(L('Winkel-Feld nicht gefunden.', 'Angle field not found.')); return; }
      fireField(tf, Math.round(Math.max(-60, Math.min(60, tv)) * 10) / 10);
      toast(L('Schusswinkel übernommen: ', 'Shot angle applied: ') + tv.toFixed(1) + '°');
    }
    closeSensor();
  }

  function closeSensor() {
    if (sensor && sensor.timer) clearInterval(sensor.timer);
     if (orientHandler) { window.removeEventListener('deviceorientation', orientHandler, true); orientHandler = null; }
    sensor = null;
    var ov = document.getElementById('ux-sensor');
    if (ov) ov.remove();
  }

  // Event Listener für den Button (Capture Phase um Konflikte zu vermeiden)
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest && ev.target.closest('[data-action="sensor"]');
    if (!btn) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    openSensor();
  }, true);

  /* ==========================================================================
     D) EINSTELLUNGEN: Messdauer + App-Version
     ======================================================================== */
  function mountSettings() {
    var sec = document.getElementById('sec-settings');
    if (!sec || !sec.innerHTML) return;

    if (!document.getElementById('ux-duration-card')) {
      var dc = document.createElement('div');
      dc.className = 'card';
      dc.id = 'ux-duration-card';
      dc.innerHTML =
        '<h3>' + L('Sensorik', 'Sensors') + '</h3>' +
        '<label class="field"><span class="field-label">' + L('Messdauer Kompass / Neigung', 'Compass / incline duration') +
        ' <b id="ux-secs-val">' + prefs.sensorSecs + ' s</b></span>' +
        '<input class="range" type="range" min="2" max="10" step="1" value="' + prefs.sensorSecs + '" data-ux="sensorSecs"></label>' +
        '<p class="hint">' + L('Längere Messung = mehr Samples = ruhigerer Mittelwert. Bereich 2–10 Sekunden.', 'Longer measurement = more samples = steadier average. Range 2–10 seconds.') + '</p>';
      sec.appendChild(dc);
    }

    if (!document.getElementById('ux-version-card')) {
      var vc = document.createElement('div');
      vc.className = 'card';
      vc.id = 'ux-version-card';
      var eng = (window.Ballistics && (window.Ballistics.version || window.Ballistics.VERSION)) || '—';
      vc.innerHTML =
        '<h3>' + L('App-Version', 'App Version') + '</h3>' +
        '<div class="version-hero"><div class="version-badge">v' + appVersion() + '</div>' +
        '<div class="version-meta"><span>' + L('Sniper Ballistik · Offline-PWA', 'Sniper Ballistik · Offline PWA') + '</span>' +
        '<span>' + L('Build', 'Build') + ' <b>2026-11-27</b></span></div></div>' +
        '<div class="version-rows">' +
          '<div class="version-row"><span>' + L('Cache-Version', 'Cache version') + '</span><b id="ux-cache-ver">…</b></div>' +
          '<div class="version-row"><span>' + L('Physik-Engine', 'Physics engine') + '</span><b>' + eng + '</b></div>' +
          '<div class="version-row"><span>' + L('DB Langwaffen', 'DB long guns') + '</span><b>' + (window.AMMO_DB_VERSION_LONG || '—') + '</b></div>' +
          '<div class="version-row"><span>' + L('DB Kurzwaffen', 'DB handguns') + '</span><b>' + (window.AMMO_DB_VERSION_SHORT || '—') + '</b></div>' +
        '</div>';
      sec.appendChild(vc);
      try {
        fetch('sw.js', { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (txt) {
          var m = txt.match(/CACHE_VERSION\s*=\s*['"]([^'"]+)['"]/);
          var el = document.getElementById('ux-cache-ver');
          if (el) el.textContent = m ? m[1] : '—';
        }).catch(function () {
          var el = document.getElementById('ux-cache-ver');
          if (el) el.textContent = '—';
        });
      } catch (e) {}
    }
  }

  document.addEventListener('input', function (ev) {
    if (ev.target.getAttribute && ev.target.getAttribute('data-ux') === 'sensorSecs') {
      prefs.sensorSecs = parseInt(ev.target.value, 10) || 5;
      savePrefs();
      var b = document.getElementById('ux-secs-val');
      if (b) b.textContent = prefs.sensorSecs + ' s';
    }
  });

  /* ==========================================================================
     RENDER-OBSERVER: mountet alles nach jedem app-Render erneut
     ======================================================================== */
  var pending = false;
  function mountAll() {
    pending = false;
    mountWindDial();
    mountChart();
    mountSettings();
    if (chartCanvas && !chartCanvas.isConnected) chartCanvas = null;
    if (chartCanvas) drawChart();
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(mountAll);
  }
  var root = document.getElementById('app') || document.body;
  new MutationObserver(schedule).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-theme', 'data-view'] });
  window.addEventListener('resize', function () { if (chartCanvas) drawChart(); });
  mountAll();

  window.SniperUX = { prefs: prefs, redraw: drawChart, openSensor: openSensor };
})();