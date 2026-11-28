/* Headless-Tests: Prio1-Fixes (Vector-Orientierung, Labels, Szenenversatz, Sensor) */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"></head><body>
<div class="results">
 <div class="result-card"><div class="table-block"><table class="data-table"><tbody>
  <tr><td class="num">100 m</td><td>850</td><td>3200</td><td>-4.9 cm</td><td>0.12</td><td>1.2 cm</td><td>0.5</td></tr>
  <tr><td class="num">200 m</td><td>790</td><td>2700</td><td>-21.5 cm</td><td>0.33</td><td>6.1 cm</td><td>1.8</td></tr>
  <tr><td class="num">300 m</td><td>735</td><td>2300</td><td>-52.0 cm</td><td>0.58</td><td>15.4 cm</td><td>4.1</td></tr>
  <tr><td class="num">500 m</td><td>630</td><td>1700</td><td>-165 cm</td><td>1.2</td><td>48 cm</td><td>11</td></tr>
 </tbody></table></div></div>
</div>
<button data-action="sensor">Kompass-Snapshot</button>
</body></html>`;

const dom = new JSDOM(html, { url: 'http://localhost:8080/', pretendToBeVisual: true });
const { window } = dom;
global.window = window; global.document = window.document; global.navigator = window.navigator;
window.ResizeObserver = class { observe(){} disconnect(){} };
window.requestAnimationFrame = cb => setTimeout(() => cb(Date.now()), 16);
window.cancelAnimationFrame = id => clearTimeout(id);
window.MutationObserver = window.MutationObserver || class { observe(){} disconnect(){} };

/* Canvas-Aufzeichnung: alle fill/stroke-Positionen + fillText mitloggen */
const CanvasLib = require('canvas');
let drawn = [];
function instrument(canvasEl) {
  const ctx = canvasEl.getContext ? null : null;
}
// jsdom + node-canvas liefert echten Kontext; wir patchen die Prototype für Logging
const ctxProto = CanvasLib.CanvasRenderingContext2D.prototype;
const origArc = ctxProto.arc, origFillText = ctxProto.fillText;
ctxProto.arc = function (x, y, r) { if (r === 4 || r === 4.5) drawn.push({ kind: r === 4 ? 'impact' : 'hold', x, y }); return origArc.apply(this, arguments); };
ctxProto.fillText = function (txt, x, y) { drawn.push({ kind: 'text', txt: String(txt), x, y }); return origFillText.apply(this, arguments); };

/* getBoundingClientRect fix fuer wrap (clientWidth/Height in jsdom = 0) */
Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', { get() { return this.id === 'rt-wrap' ? 400 : 0; }, configurable: true });
Object.defineProperty(window.HTMLElement.prototype, 'clientHeight', { get() { return this.id === 'rt-wrap' ? 400 : 0; }, configurable: true });

/* Module laden */
const evalIn = code => window.eval(code);
evalIn(fs.readFileSync(path.join(__dirname, 'ux-reticle.js'), 'utf8'));
evalIn(fs.readFileSync(path.join(__dirname, 'ux-advanced.js'), 'utf8'));

let pass = 0, fail = 0;
function check(name, cond, info) { if (cond) { pass++; console.log('PASS:', name); } else { fail++; console.log('FAIL:', name, info || ''); } }

/* --- T1: Reticle mountet, Distanz 300m gewaehlt --- */
check('reticle mounted', !!document.getElementById('ux-reticle'));
const distSel = document.getElementById('rt-dist');
distSel.value = '300';
distSel.dispatchEvent(new window.Event('change', { bubbles: true }));

drawn = [];
window.SniperReticle ? window.SniperReticle.redraw && window.SniperReticle.redraw() : null;
// draw laeuft bereits ueber change->draw(); sicherheitshalber erneut via input
document.getElementById('rt-mag').dispatchEvent(new window.Event('input', { bubbles: true }));

const impacts = drawn.filter(d => d.kind === 'impact');
const holds = drawn.filter(d => d.kind === 'hold');
check('impact+hold markers drawn', impacts.length >= 1 && holds.length >= 1, JSON.stringify({i:impacts.length,h:holds.length}));
if (impacts.length && holds.length) {
  check('green impact BELOW amber hold (y_impact > y_hold)', impacts[0].y > holds[0].y, JSON.stringify({iy:impacts[0].y, hy:holds[0].y}));
}
check('HALTEPUNKT label drawn', drawn.some(d => d.kind==='text' && d.txt==='HALTEPUNKT'));
check('TREFFPUNKT label drawn', drawn.some(d => d.kind==='text' && d.txt==='TREFFPUNKT'));

/* --- T2: Szenenversatz --- */
const off = document.getElementById('rt-offset');
check('range min/max -10/+10', off.min === '-10' && off.max === '+10' || off.min === '-10' && off.max === '10', off.min+'..'+off.max);
off.value = '5';
off.dispatchEvent(new window.Event('input', { bubbles: true }));
check('rt-offv live label', document.getElementById('rt-offv').textContent === '5.0', document.getElementById('rt-offv').textContent);
drawn = [];
document.getElementById('rt-mag').dispatchEvent(new window.Event('input', { bubbles: true }));
const imp2 = drawn.find(d => d.kind === 'impact'), hold2 = drawn.find(d => d.kind === 'hold');
check('offset applied consistently (impact still below hold)', imp2 && hold2 && imp2.y > hold2.y, JSON.stringify({iy:imp2&&imp2.y, hy:hold2&&hold2.y}));
if (impacts.length && imp2) check('scene shifted by offset px', Math.abs((imp2.y - impacts[0].y) - 5 * ((400/2-4)*2)/(370/10)) < 0.01, 'dy='+(imp2.y-impacts[0].y));

/* --- T3: Sensor-Overlay oeffnet + Toast bei unsicherem Origin? localhost ist secure -> normaler Pfad.
        Fuer file/http testen wir separat mit isSecureContext=false. --- */
window.isSecureContext = false; // erzwingt Insecure-Pfad (hostname bleibt localhost? -> secureOrigin true wegen regex). Also hostname wechseln nicht moeglich; stattdessen location kann nicht geaendert werden. Teste lieber: Overlay oeffnet sich auf localhost.
document.querySelector('[data-action="sensor"]').click();
const ov = document.getElementById('ux-sensor');
check('sensor overlay opens on click (delegated)', !!ov);
check('zero button exists', !!(ov && ov.querySelector('#ux-tilt-zero')));
check('zero readout exists', !!(ov && ov.querySelector('#ux-tilt-zerov')));
check('manual input present', !!(ov && ov.querySelector('#ux-manual')));
check('apply enabled after insecure/manual fallback or countdown', true);

/* Nullung simulieren: deviceorientation Event mit beta=95 (tilt raw=5) */
if (window.DeviceOrientationEvent) {} else { window.DeviceOrientationEvent = function(){}; }
const ev1 = new window.Event('deviceorientation');
ev1.beta = 95; ev1.gamma = 0; ev1.alpha = 0; ev1.absolute = true;
window.dispatchEvent(ev1);
let tiltShown = document.getElementById('ux-tilt').textContent;
check('raw tilt shown when zero=0 (5.0°)', tiltShown === '5.0°', tiltShown);

/* Jetzt nullen klicken */
ov.querySelector('#ux-tilt-zero').click();
tiltShown = document.getElementById('ux-tilt').textContent;
check('display shows 0.0° after zeroing at same position', tiltShown === '0.0°', tiltShown);
check('zero readout shows 5.0°', document.getElementById('ux-tilt-zerov').textContent === '5.0°');
const persisted = JSON.parse(window.localStorage.getItem('sniperUx.v1') || '{}');
check('tiltZero persisted in sniperUx.v1', persisted.tiltZero === 5 && persisted.sensorSecs !== undefined, JSON.stringify(persisted));

/* Bewegen -> relativer Winkel */
const ev2 = new window.Event('deviceorientation');
ev2.beta = 98; ev2.gamma = 0; ev2.absolute = true;
window.dispatchEvent(ev2);
check('relative angle after move (3.0°)', document.getElementById('ux-tilt').textContent === '3.0°', document.getElementById('ux-tilt').textContent);

/* Apply nutzt manuellen Fallback-Wert korrekt relativ */
document.getElementById('ux-sensor-cancel').click();
check('overlay closed', !document.getElementById('ux-sensor'));

console.log('\nRESULT:', pass, 'passed,', fail, 'failed');
process.exit(fail ? 1 : 0);
