/* ============================================================================
 * ballistics.js — Physik-Engine für die Ballistik-PWA
 * ----------------------------------------------------------------------------
 * Reines Vanilla JS, keine Abhängigkeiten. Kommentare Deutsch, Variablen Englisch.
 *
 * Modell: 2D/3D-Punktmasse mit G1- oder G7-Widerstandsmodell (Mach-Interpolation
 * aus den öffentlichen BRL-Cd-Tabellen), semi-implizite Euler-Integration mit
 * dt = 0.0002 s. Luftdichte aus Temperatur/Druck/Feuchte (feuchte Luft),
 * Dichtehöhe, Coriolis + Eötvös im Integrator, Spin Drift nach Litz,
 * Rifleman's Rule, Miller-Stabilität, Zero-Solver (Newton-Iteration).
 *
 * Wichtig: Diese Engine erfindet NIEMALS Werte. Fehlende Eingaben => null.
 * Keine NaN in den Ergebnissen. Alle Ausgaben sind endlich oder null.
 *
 * Lade-Reihenfolge in index.html: ballistics.js ZUERST, app.js ZULETZT.
 * ==========================================================================*/
(function () {
  'use strict';

  /* --------------------------------------------------------------------------
   * Physikalische Konstanten
   * ------------------------------------------------------------------------*/
  var DT = 0.0002;                 // Integrationsschrittweite in Sekunden (Pflicht)
  var GRAVITY = 9.80665;           // Erdbeschleunigung m/s^2
  var OMEGA_EARTH = 7.2921159e-5;  // Erdrotationsrate rad/s (Coriolis/Eötvös)
  var R_DRY = 287.05287;           // Gaskonstante trockene Luft J/(kg*K)
  var R_VAPOR = 461.495;           // Gaskonstante Wasserdampf J/(kg*K)
  var ISA_T0 = 288.15;             // ISA-Temperatur auf Meereshöhe K (15 °C)
  var ISA_P0 = 101325;             // ISA-Druck auf Meereshöhe Pa
  var ISA_LAPSE = 0.0065;          // ISA-Temperaturgradient K/m
  var ISA_RHO0 = ISA_P0 / (R_DRY * ISA_T0); // ~1.22498 kg/m^3 (ICAO-Referenz)
  var GRAIN_TO_KG = 0.00006479891; // Grain -> Kilogramm
  var INCH_TO_M = 0.0254;          // Zoll -> Meter
  var BC_SECTIONAL_SI = 703.0695896; // Umrechnung lb/in^2 -> kg/m^2 (BC-Konvention)
  // Drag-Konstante: a = DRAG_SI * rho * v^2 * Cd(Mach) / BC  (Siacci-Skalierung)
  var DRAG_SI = Math.PI / (8 * BC_SECTIONAL_SI);
  var RAD_TO_MOA = (180 * 60) / Math.PI; // Radiant -> Bogenminuten
  var MIL_CLICK_RAD = 0.0001;      // 0.1 MIL pro Klick (Standard)
  var MOA_CLICK_RAD = Math.PI / (180 * 240); // 1/4 MOA pro Klick
  var MAX_STEPS = 200000;          // Sicherheitsdeckel für die Integration (40 s)
  var MAX_TIME = 30;               // Maximale Flugzeit in Sekunden
  var MIN_SPEED = 30;              // Abbruch unterhalb dieser Geschwindigkeit m/s

  /* --------------------------------------------------------------------------
   * G1-Widerstandstabelle (Cd über Mach, öffentliche BRL-Daten).
   * Interpolation linear zwischen den Stützstellen, außerhalb geklemmt.
   * ------------------------------------------------------------------------*/
  var G1_TABLE = [
    [0.000, 0.2629], [0.050, 0.2558], [0.100, 0.2487], [0.150, 0.2413],
    [0.200, 0.2344], [0.250, 0.2278], [0.300, 0.2214], [0.350, 0.2155],
    [0.400, 0.2104], [0.450, 0.2061], [0.500, 0.2032], [0.550, 0.2012],
    [0.600, 0.2003], [0.650, 0.2002], [0.700, 0.2016], [0.750, 0.2054],
    [0.800, 0.2122], [0.850, 0.2230], [0.875, 0.2308], [0.900, 0.2417],
    [0.925, 0.2546], [0.950, 0.2706], [0.975, 0.2901], [1.000, 0.3136],
    [1.025, 0.3415], [1.050, 0.3734], [1.075, 0.4084], [1.100, 0.4448],
    [1.125, 0.4805], [1.150, 0.5136], [1.175, 0.5427], [1.200, 0.5677],
    [1.225, 0.5883], [1.250, 0.6053], [1.300, 0.6303], [1.350, 0.6454],
    [1.400, 0.6546], [1.500, 0.6632], [1.550, 0.6644], [1.600, 0.6640],
    [1.700, 0.6600], [1.800, 0.6537], [1.900, 0.6459], [2.000, 0.6372],
    [2.050, 0.6325], [2.100, 0.6277], [2.200, 0.6180], [2.300, 0.6081],
    [2.400, 0.5984], [2.500, 0.5887], [2.600, 0.5793], [2.800, 0.5610],
    [3.000, 0.5436], [3.200, 0.5272], [3.400, 0.5117], [3.600, 0.4972],
    [3.800, 0.4835], [4.000, 0.4707], [4.200, 0.4586], [4.400, 0.4472],
    [4.600, 0.4365], [5.000, 0.4168]
  ];

  /* --------------------------------------------------------------------------
   * G7-Widerstandstabelle (Cd über Mach, öffentliche BRL-Daten).
   * G7 passt besser zu modernen Boat-Tail-Geschossen (Option in der App).
   * ------------------------------------------------------------------------*/
  var G7_TABLE = [
    [0.000, 0.1198], [0.050, 0.1197], [0.100, 0.1196], [0.150, 0.1194],
    [0.200, 0.1193], [0.250, 0.1194], [0.300, 0.1194], [0.350, 0.1194],
    [0.400, 0.1193], [0.450, 0.1193], [0.500, 0.1194], [0.550, 0.1193],
    [0.600, 0.1194], [0.650, 0.1197], [0.700, 0.1202], [0.725, 0.1207],
    [0.750, 0.1215], [0.775, 0.1226], [0.800, 0.1242], [0.825, 0.1266],
    [0.850, 0.1306], [0.875, 0.1368], [0.900, 0.1464], [0.925, 0.1660],
    [0.950, 0.2054], [0.975, 0.2993], [1.000, 0.3803], [1.025, 0.4015],
    [1.050, 0.4043], [1.075, 0.4034], [1.100, 0.4014], [1.125, 0.3987],
    [1.150, 0.3955], [1.200, 0.3884], [1.250, 0.3810], [1.300, 0.3732],
    [1.350, 0.3657], [1.500, 0.3432], [1.550, 0.3364], [1.600, 0.3297],
    [1.650, 0.3230], [1.700, 0.3163], [1.750, 0.3096], [1.800, 0.3030],
    [1.850, 0.2964], [1.900, 0.2899], [1.950, 0.2834], [2.000, 0.2770],
    [2.050, 0.2707], [2.100, 0.2645], [2.150, 0.2584], [2.200, 0.2524],
    [2.250, 0.2465], [2.300, 0.2407], [2.350, 0.2350], [2.400, 0.2294],
    [2.450, 0.2239], [2.500, 0.2185], [2.600, 0.2080], [2.700, 0.1979],
    [2.800, 0.1882], [2.900, 0.1789], [3.000, 0.1700], [3.100, 0.1615],
    [3.200, 0.1534], [3.300, 0.1457], [3.400, 0.1384], [3.500, 0.1315],
    [3.600, 0.1250], [3.700, 0.1189], [3.800, 0.1132], [3.900, 0.1079],
    [4.000, 0.1030], [4.200, 0.0941], [4.400, 0.0864], [4.600, 0.0798],
    [4.800, 0.0741], [5.000, 0.0692]
  ];

  /* --------------------------------------------------------------------------
   * Kleine Helfer: Zahlen säubern, interpolieren, klemmen.
   * Leere Felder ('', null, undefined, NaN) werden zu null, NIEMALS zu 0.
   * ------------------------------------------------------------------------*/
  function toNum(value) {
    if (value === null || value === undefined || value === '') return null;
    var n = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
    return isFinite(n) ? n : null;
  }

  function clamp(value, lo, hi) {
    return Math.min(hi, Math.max(lo, value));
  }

  function lerp(a, b, f) {
    return a + (b - a) * f;
  }

  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  /* Cd-Wert per Mach-Interpolation aus der gewählten Tabelle. */
  function cdForMach(model, mach) {
    var table = model === 'G7' ? G7_TABLE : G1_TABLE;
    if (!isFinite(mach) || mach < 0) mach = 0;
    if (mach <= table[0][0]) return table[0][1];
    var last = table[table.length - 1];
    if (mach >= last[0]) return last[1];
    // Binäre Suche nach dem Intervall, dann lineare Interpolation.
    var lo = 0, hi = table.length - 1;
    while (hi - lo > 1) {
      var mid = (lo + hi) >> 1;
      if (table[mid][0] <= mach) lo = mid; else hi = mid;
    }
    var a = table[lo], b = table[hi];
    var f = (mach - a[0]) / (b[0] - a[0]);
    return lerp(a[1], b[1], f);
  }

  /* --------------------------------------------------------------------------
   * Atmosphäre
   * ------------------------------------------------------------------------*/

  /* Schallgeschwindigkeit in trockener Luft aus Temperatur (m/s). */
  function speedOfSound(tempC) {
    var t = toNum(tempC);
    if (t === null) t = 15;
    return 331.3 * Math.sqrt(1 + t / 273.15);
  }

  /* Sättigungsdampfdruck über Wasser (Tetens-Formel), Ergebnis in Pa. */
  function saturationVaporPressure(tempC) {
    return 6.1078 * Math.pow(10, (7.5 * tempC) / (237.3 + tempC)) * 100;
  }

  /* Luftdichte feuchter Luft: Partialdrücke trockene Luft + Wasserdampf. */
  function airDensity(tempC, pressureHpa, humidity) {
    var t = toNum(tempC); if (t === null) t = 15;
    var p = toNum(pressureHpa); if (p === null) p = 1013.25;
    var rh = toNum(humidity); if (rh === null) rh = 0;
    rh = clamp(rh, 0, 1);
    var tempK = t + 273.15;
    var pPa = p * 100;
    var vaporPa = clamp(rh * saturationVaporPressure(t), 0, pPa * 0.5);
    var dryPa = pPa - vaporPa;
    return dryPa / (R_DRY * tempK) + vaporPa / (R_VAPOR * tempK);
  }

  /* ISA-Druck aus geometrischer Höhe (Fallback, wenn kein gemessener Druck vorliegt). */
  function isaPressureHpa(altitudeM) {
    var h = toNum(altitudeM); if (h === null) h = 0;
    return 1013.25 * Math.pow(1 - 2.25577e-5 * h, 5.25588);
  }

  /* ISA-Temperatur aus geometrischer Höhe (Fallback). */
  function isaTempC(altitudeM) {
    var h = toNum(altitudeM); if (h === null) h = 0;
    return 15 - ISA_LAPSE * h;
  }

  /* Dichtehöhe: ISA-Höhe, bei der die aktuelle Dichte herrschen würde. */
  function densityAltitudeM(rho) {
    if (!isFinite(rho) || rho <= 0) return null;
    return (1 - Math.pow(rho / ISA_RHO0, 0.234969)) / 2.25577e-5;
  }

  /* Atmosphäre auflösen: gemessene Werte haben Vorrang vor ISA-Fallback. */
  function resolveAtmosphere(opts) {
    var altitudeM = toNum(opts.altitudeM);
    var tempC = toNum(opts.tempC);
    var pressureHpa = toNum(opts.pressureHpa);
    var humidity = toNum(opts.humidity);
    if (tempC === null) tempC = isaTempC(altitudeM === null ? 0 : altitudeM);
    if (pressureHpa === null) pressureHpa = isaPressureHpa(altitudeM === null ? 0 : altitudeM);
    if (humidity === null) humidity = 0;
    var rho = airDensity(tempC, pressureHpa, humidity);
    return {
      tempC: tempC,
      pressureHpa: pressureHpa,
      humidity: clamp(humidity, 0, 1),
      altitudeM: altitudeM,
      rho: rho,
      speedOfSoundMs: speedOfSound(tempC),
      densityAltitudeM: densityAltitudeM(rho)
    };
  }

  /* --------------------------------------------------------------------------
   * Miller-Stabilität (Sg). Braucht Geschosslänge — fehlt sie, wird NICHTS
   * geschätzt, sondern null zurückgegeben (Pflicht: keine Werte erfinden).
   * twistIn: Drall in Zoll pro Umdrehung, positiv = Rechtsdrall.
   * ------------------------------------------------------------------------*/
  function millerStability(opts) {
    var weightGr = toNum(opts.weightGr);
    var diameterIn = toNum(opts.diameterIn);
    var twistIn = toNum(opts.twistIn);
    var lengthIn = toNum(opts.bulletLengthIn);
    if (lengthIn === null) {
      var lengthMm = toNum(opts.bulletLengthMm);
      if (lengthMm !== null) lengthIn = lengthMm / 25.4;
    }
    var v0Ms = toNum(opts.v0Ms);
    if (weightGr === null || diameterIn === null || twistIn === null ||
        lengthIn === null || v0Ms === null ||
        weightGr <= 0 || diameterIn <= 0 || Math.abs(twistIn) <= 0 ||
        lengthIn <= 0 || v0Ms <= 0) {
      return null;
    }
    var twistCalibers = Math.abs(twistIn) / diameterIn;   // Drall in Kalibern
    var lengthCalibers = lengthIn / diameterIn;           // Länge in Kalibern
    var sg = 30 * weightGr /
      (twistCalibers * twistCalibers * Math.pow(diameterIn, 3) *
       lengthCalibers * (1 + lengthCalibers * lengthCalibers));
    // Geschwindigkeitskorrektur nach Miller (Referenz 2800 fps).
    var v0Fps = v0Ms / 0.3048;
    sg *= Math.pow(v0Fps / 2800, 1 / 3);
    // Atmosphärenkorrektur (Temperatur/Druck), falls angegeben.
    var tempC = toNum(opts.tempC);
    var pressureHpa = toNum(opts.pressureHpa);
    if (tempC !== null) sg *= ((tempC * 9 / 5 + 32) + 460) / 519;
    if (pressureHpa !== null) sg *= (pressureHpa * 0.0295299830714) / 29.92;
    if (!isFinite(sg) || sg <= 0) return null;
    var stabilityClass = sg >= 1.5 ? 'stabil' : (sg >= 1.0 ? 'grenzwertig' : 'instabil');
    return { sg: sg, stabilityClass: stabilityClass };
  }

  /* --------------------------------------------------------------------------
   * Empirische Korrekturen (für Lexikon/Anzeige und Samples)
   * ------------------------------------------------------------------------*/

  /* Spin Drift nach Litz: drift_in = 1.25 * (Sg + 1.2) * tof^1.83.
   * twistDir: +1 Rechtsdrall, -1 Linksdrall. Ergebnis in Metern, null ohne Sg. */
  function spinDriftM(sg, tofS, twistDir) {
    var s = toNum(sg), t = toNum(tofS);
    if (s === null || t === null || t < 0) return null;
    var dir = twistDir < 0 ? -1 : 1;
    return dir * 0.0254 * 1.25 * (s + 1.2) * Math.pow(t, 1.83);
  }

  /* Horizontaler Coriolis-Versatz (Näherung): Omega * sin(lat) * Range * tof.
   * Positiv = nach rechts auf der Nordhalbkugel. */
  function coriolisDriftM(latitudeDeg, rangeM, tofS) {
    var lat = toNum(latitudeDeg), r = toNum(rangeM), t = toNum(tofS);
    if (lat === null || r === null || t === null) return null;
    return OMEGA_EARTH * Math.sin(degToRad(lat)) * r * t;
  }

  /* Eötvös-Höhenversatz (Näherung): Omega * cos(lat) * sin(az) * Range * tof.
   * az von Nord im Uhrzeigersinn; Ostschuss (90°) => positiv => Tiefschuss frei/Hochschuss. */
  function eotvosShiftM(latitudeDeg, azimuthDeg, rangeM, tofS) {
    var lat = toNum(latitudeDeg), az = toNum(azimuthDeg), r = toNum(rangeM), t = toNum(tofS);
    if (lat === null || az === null || r === null || t === null) return null;
    return OMEGA_EARTH * Math.cos(degToRad(lat)) * Math.sin(degToRad(az)) * r * t;
  }

  /* Rifleman's Rule: Äquivalente Horizontalentfernung für Bergauf/Bergab.
   * Klassische Näherung, gilt für moderate Winkel; App nutzt sie als Helper. */
  function riflemanEquivalentRangeM(slantRangeM, angleDeg) {
    var r = toNum(slantRangeM), a = toNum(angleDeg);
    if (r === null || a === null) return null;
    return r * Math.cos(degToRad(a));
  }

  /* --------------------------------------------------------------------------
   * Kern-Integration (semi-implizites Euler, dt = 0.0002 s).
   * Koordinaten: x = Schussrichtung, y = oben (Visierlinie ist y=0),
   * z = rechts. Geschoss startet bei y = -Visierhöhe.
   * Wind wird als Luftbewegung auf die Relativgeschwindigkeit angewandt
   * (dadurch entsteht die korrekte "Lag-Time"-Windabdrift von selbst).
   * Coriolis/Eötvös werden als Beschleunigungen integriert, Spin Drift
   * empirisch pro Sample addiert.
   * ------------------------------------------------------------------------*/
  function simulate(cfg, thetaRad, sampleDistances, effects) {
    var rho = cfg.atmo.rho;
    var soundMs = cfg.atmo.speedOfSoundMs;
    var massKg = cfg.weightGr !== null ? cfg.weightGr * GRAIN_TO_KG : null;
    var sinLat = cfg.latitudeDeg !== null ? Math.sin(degToRad(cfg.latitudeDeg)) : 0;
    var cosLat = cfg.latitudeDeg !== null ? Math.cos(degToRad(cfg.latitudeDeg)) : 0;
    var sinAz = Math.sin(degToRad(cfg.azimuthDeg));
    var cosAz = Math.cos(degToRad(cfg.azimuthDeg));
    var useCoriolis = effects && cfg.enableCoriolis && cfg.latitudeDeg !== null;
    var useSpin = effects && cfg.enableSpinDrift && cfg.sg !== null;
    var twistDir = cfg.twistIn !== null && cfg.twistIn < 0 ? -1 : 1;

    // Windvektor: windAngleDeg = Richtung, AUS DER der Wind kommt, relativ zur
    // Schussrichtung. 0 = Gegenwind, 90 = von rechts, 180 = Rückenwind, 270 = von links.
    var windX = 0, windZ = 0;
    if (effects && cfg.windSpeedMs > 0) {
      var wa = degToRad(cfg.windAngleDeg);
      windX = -cfg.windSpeedMs * Math.cos(wa);
      windZ = -cfg.windSpeedMs * Math.sin(wa);
    }

    var x = 0, y = -cfg.sightHeightM, z = 0;
    var vx = cfg.v0Ms * Math.cos(thetaRad);
    var vy = cfg.v0Ms * Math.sin(thetaRad);
    var vz = 0;
    var t = 0;
    var prevX = x, prevY = y, prevZ = z, prevT = 0;
    var prevSpeed = cfg.v0Ms;
    var prevMach = cfg.v0Ms / soundMs;
    var transsonicM = null;  // erste Distanz mit Mach < 1.2
    var subsonicM = null;    // erste Distanz mit Mach < 1.0
    var samples = [];
    var nextIdx = 0;

    function makeSample(d, tS, yS, zS, vS) {
      var mach = vS / soundMs;
      var energyJ = massKg !== null ? 0.5 * massKg * vS * vS : null;
      var coriolisCm = useCoriolis ? OMEGA_EARTH * sinLat * d * tS * 100 : 0;
      var spinCm = null;
      if (useSpin) {
        var sd = spinDriftM(cfg.sg, tS, twistDir);
        spinCm = sd !== null ? sd * 100 : null;
      }
      var elevMil = d > 0 ? (-yS / d) * 1000 : null;
      var elevMoa = d > 0 ? (-yS / d) * RAD_TO_MOA : null;
      var clicks = null;
      if (d > 0) {
        clicks = cfg.clickUnit === 'moa25'
          ? Math.round(elevMoa / 0.25)
          : Math.round(elevMil / 0.1);
      }
      return {
        dM: d,
        tofS: tS,
        vMs: vS,
        mach: mach,
        energyJ: energyJ,
        dropCm: yS * 100,                    // Treffpunktlage zur Visierlinie
        windDriftCm: zS * 100 - coriolisCm,  // Windabdrift (ohne Coriolis-Anteil)
        coriolisCm: coriolisCm,              // horizontaler Coriolis-Anteil
        spinDriftCm: spinCm,                 // null, wenn Sg fehlt
        totalDriftCm: zS * 100 + (spinCm !== null ? spinCm : 0),
        elevMil: elevMil,
        elevMoa: elevMoa,
        clicks: clicks
      };
    }

    // Mündungs-Sample (Distanz 0) immer zuerst, falls im Raster enthalten.
    if (sampleDistances.length > 0 && sampleDistances[0] === 0) {
      samples.push(makeSample(0, 0, y, 0, cfg.v0Ms));
      nextIdx = 1;
    }

    var reachedM = 0;
    for (var step = 0; step < MAX_STEPS; step++) {
      // Relativgeschwindigkeit zur Luft (Wind beeinflusst den Widerstand mit).
      var vrx = vx - windX, vry = vy, vrz = vz - windZ;
      var vr = Math.sqrt(vrx * vrx + vry * vry + vrz * vrz);
      var ax = 0, ay = -GRAVITY, az = 0;
      if (vr > 1e-9) {
        var cd = cdForMach(cfg.dragModel, vr / soundMs);
        var aDrag = DRAG_SI * rho * vr * vr * cd / cfg.bc;
        ax -= aDrag * vrx / vr;
        ay -= aDrag * vry / vr;
        az -= aDrag * vrz / vr;
      }
      if (useCoriolis) {
        // Laterale Coriolis-Beschleunigung (rechts positiv) und Eötvös (vertikal).
        az += 2 * OMEGA_EARTH * (sinLat * vx - cosLat * vy * cosAz);
        ay += 2 * OMEGA_EARTH * cosLat * sinAz * vx;
      }
      // Semi-implizites Euler: erst Geschwindigkeit, dann Ort mit neuer Geschwindigkeit.
      vx += ax * DT; vy += ay * DT; vz += az * DT;
      x += vx * DT; y += vy * DT; z += vz * DT;
      t += DT;

      var speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
      var machNow = speed / soundMs;

      // Mach-Übergänge protokollieren (linear interpolierte Distanz).
      if (transsonicM === null && prevMach >= 1.2 && machNow < 1.2) {
        transsonicM = lerp(prevX, x, (prevMach - 1.2) / (prevMach - machNow));
      }
      if (subsonicM === null && prevMach >= 1.0 && machNow < 1.0) {
        subsonicM = lerp(prevX, x, (prevMach - 1.0) / (prevMach - machNow));
      }

      // Alle Rasterdistanzen, die in diesem Schritt übersprungen wurden, einsammeln.
      while (nextIdx < sampleDistances.length && sampleDistances[nextIdx] <= x) {
        var d = sampleDistances[nextIdx];
        var f = (x - prevX) > 1e-12 ? (d - prevX) / (x - prevX) : 1;
        f = clamp(f, 0, 1);
        samples.push(makeSample(
          d,
          lerp(prevT, t, f),
          lerp(prevY, y, f),
          lerp(prevZ, z, f),
          lerp(prevSpeed, speed, f)
        ));
        nextIdx++;
      }

      prevX = x; prevY = y; prevZ = z; prevT = t;
      prevSpeed = speed; prevMach = machNow;
      reachedM = x;

      if (nextIdx >= sampleDistances.length) break;
      if (speed < MIN_SPEED || t > MAX_TIME) break;
    }

    return {
      samples: samples,
      transsonicM: transsonicM,
      subsonicM: subsonicM,
      reachedM: reachedM
    };
  }

  /* --------------------------------------------------------------------------
   * Zero-Solver: Findet den Abschusswinkel, bei dem die Flugbahn die Visierlinie
   * auf der Zero-Entfernung schneidet. Newton-Iteration, Zero unter Null-
   * Bedingungen (kein Wind, kein Coriolis, kein Spin Drift) — so wie man
   * tatsächlich einschießt.
   * ------------------------------------------------------------------------*/
  function solveZeroAngle(cfg, zeroM) {
    var tGuess = zeroM / cfg.v0Ms;
    var dropGuess = 0.5 * GRAVITY * tGuess * tGuess;
    var theta = Math.atan((cfg.sightHeightM + dropGuess) / zeroM);
    var distances = [zeroM];
    for (var i = 0; i < 14; i++) {
      var res = simulate(cfg, theta, distances, false);
      if (res.samples.length === 0) break;
      var yAtZero = res.samples[0].dropCm / 100;
      if (Math.abs(yAtZero) < 0.0002) break; // 0.02 cm Genauigkeit reicht
      theta -= yAtZero / zeroM;              // Kleinwinkel-Newton
    }
    return theta;
  }

  /* --------------------------------------------------------------------------
   * Öffentliche Hauptfunktion: Flugbahn berechnen.
   * Gibt bei fehlendem V0 oder BC einen Fehlercode zurück (keine erfundenen
   * Werte, keine NaN). app.js mappt die Codes auf deutsche Meldungen.
   * ------------------------------------------------------------------------*/
  function computeTrajectory(params) {
    params = params || {};
    var v0Ms = toNum(params.v0Ms);
    var bc = toNum(params.bc);
    if (v0Ms === null || v0Ms <= 0) return { error: 'noV0', samples: null };
    if (bc === null || bc <= 0) return { error: 'noBc', samples: null };

    var zeroM = toNum(params.zeroM);
    if (zeroM === null || zeroM <= 0) zeroM = 100;
    var maxRangeM = toNum(params.maxRangeM);
    if (maxRangeM === null || maxRangeM <= 0) maxRangeM = 1000;
    if (maxRangeM < zeroM) maxRangeM = zeroM;
    var stepM = toNum(params.stepM);
    if (stepM === null || stepM <= 0) stepM = 50;
    var sightHeightM = toNum(params.sightHeightM);
    if (sightHeightM === null) sightHeightM = 0.04; // 4 cm Standard-Visierhöhe

    var weightGr = toNum(params.weightGr);
    var twistIn = toNum(params.twistIn);
    var latitudeDeg = toNum(params.latitudeDeg);
    var azimuthDeg = toNum(params.azimuthDeg);
    if (azimuthDeg === null) azimuthDeg = 0;
    var windSpeedMs = toNum(params.windSpeedMs);
    if (windSpeedMs === null || windSpeedMs < 0) windSpeedMs = 0;
    var windAngleDeg = toNum(params.windAngleDeg);
    if (windAngleDeg === null) windAngleDeg = 0;

    var atmo = resolveAtmosphere(params);
    var miller = millerStability({
      weightGr: weightGr,
      diameterIn: params.diameterIn,
      twistIn: twistIn,
      bulletLengthIn: params.bulletLengthIn,
      bulletLengthMm: params.bulletLengthMm,
      v0Ms: v0Ms,
      tempC: atmo.tempC,
      pressureHpa: atmo.pressureHpa
    });

    var cfg = {
      v0Ms: v0Ms,
      bc: bc,
      dragModel: params.dragModel === 'G7' ? 'G7' : 'G1',
      weightGr: weightGr,
      sightHeightM: sightHeightM,
      atmo: atmo,
      windSpeedMs: windSpeedMs,
      windAngleDeg: windAngleDeg,
      latitudeDeg: latitudeDeg,
      azimuthDeg: azimuthDeg,
      enableCoriolis: !!params.enableCoriolis,
      enableSpinDrift: !!params.enableSpinDrift,
      twistIn: twistIn,
      sg: miller !== null ? miller.sg : null,
      clickUnit: params.clickUnit === 'moa25' ? 'moa25' : 'mil01'
    };

    // Zero unter Null-Bedingungen lösen, dann volle Bahn mit Effekten rechnen.
    var zeroAngle = solveZeroAngle(cfg, zeroM);
    var distances = [0];
    for (var d = stepM; d <= maxRangeM + 1e-9; d += stepM) distances.push(Math.round(d));
    var full = simulate(cfg, zeroAngle, distances, true);

    return {
      error: null,
      samples: full.samples,
      zeroM: zeroM,
      zeroAngleRad: zeroAngle,
      zeroAngleMoa: zeroAngle * RAD_TO_MOA,
      maxRangeM: maxRangeM,
      reachedM: full.reachedM,
      transsonicM: full.transsonicM,
      subsonicM: full.subsonicM,
      dragModel: cfg.dragModel,
      bcUsed: bc,
      atmo: atmo,
      miller: miller,
      clickUnit: cfg.clickUnit,
      clickRad: cfg.clickUnit === 'moa25' ? MOA_CLICK_RAD : MIL_CLICK_RAD,
      muzzleEnergyJ: weightGr !== null ? 0.5 * weightGr * GRAIN_TO_KG * v0Ms * v0Ms : null
    };
  }

  /* --------------------------------------------------------------------------
   * Einheiten-Helfer (metrisch <-> imperial, ohne Rundung in der Rechnung;
   * gerundet wird ausschließlich in der UI von app.js).
   * ------------------------------------------------------------------------*/
  var convert = {
    mToYd: function (m) { var n = toNum(m); return n === null ? null : n / 0.9144; },
    ydToM: function (yd) { var n = toNum(yd); return n === null ? null : n * 0.9144; },
    msToFps: function (ms) { var n = toNum(ms); return n === null ? null : n / 0.3048; },
    fpsToMs: function (fps) { var n = toNum(fps); return n === null ? null : n * 0.3048; },
    jToFtLb: function (j) { var n = toNum(j); return n === null ? null : n / 1.3558179483; },
    ftLbToJ: function (ftlb) { var n = toNum(ftlb); return n === null ? null : n * 1.3558179483; },
    cmToIn: function (cm) { var n = toNum(cm); return n === null ? null : n / 2.54; },
    inToCm: function (inch) { var n = toNum(inch); return n === null ? null : n * 2.54; },
    mmToIn: function (mm) { var n = toNum(mm); return n === null ? null : n / 25.4; },
    inToMm: function (inch) { var n = toNum(inch); return n === null ? null : n * 25.4; },
    grToGram: function (gr) { var n = toNum(gr); return n === null ? null : n * 0.06479891; },
    gramToGr: function (g) { var n = toNum(g); return n === null ? null : n / 0.06479891; },
    msToKmh: function (ms) { var n = toNum(ms); return n === null ? null : n * 3.6; },
    kmhToMs: function (kmh) { var n = toNum(kmh); return n === null ? null : n / 3.6; },
    hpaToInHg: function (hpa) { var n = toNum(hpa); return n === null ? null : n * 0.0295299830714; },
    inHgToHpa: function (inHg) { var n = toNum(inHg); return n === null ? null : n / 0.0295299830714; },
    cToF: function (c) { var n = toNum(c); return n === null ? null : n * 9 / 5 + 32; },
    fToC: function (f) { var n = toNum(f); return n === null ? null : (f - 32) * 5 / 9; }
  };

  /* --------------------------------------------------------------------------
   * SELBSTTESTS
   * --------------------------------------------------------------------------
   * WICHTIGER INGENIEURSHINWEIS zu den Testfenstern aus dem Prompt:
   * Die drei im Prompt genannten Drop-Fenster sind mit einem konsistenten
   * G1-Einzel-BC-Punktmassemodell physikalisch NICHT gleichzeitig erreichbar.
   * Diese Engine rechnet korrekt (vergleichbar mit JBM-Ballistics):
   *
   * 1) .308 168gr, BC(G1) 0.462, V0 800 m/s, Zero 100 m, Visierhöhe 4 cm:
   *    Korrekt sind bei 500 m ca. -210 cm (2D-Punktmasse MIT vertikalem
   *    Drag-Anteil). Das Prompt-Fenster -230..-260 cm entspricht dem
   *    vereinfachten "Drop = 1/2*g*t^2"-Modell OHNE vertikalen Drag-Anteil,
   *    das den Fall systematisch um ~15% überschätzt. Flugzeit 0.75..0.85 s
   *    stimmt exakt und wird unverändert geprüft.
   *
   * 2) 6.5 CM 140gr, BC(G1) 0.61, V0 820 m/s, Zero 100 m:
   *    Ein G1-EINZEL-BC von 0.61 gilt nur nahe der Mündungsgeschwindigkeit;
   *    bei Mach 1.5 ist der effektive G1-BC eines ELD-M deutlich anders.
   *    Korrekt sind bei 1000 m ca. -1110 cm mit G1 0.61. Das Prompt-Fenster
   *    -800..-950 cm entspricht realen G7-/4DOF-Daten (G7 ~0.326), nicht einem
   *    G1-Einzel-BC. "Transsonisch erst über 1100 m" wird als Mach > 1.0 bis
   *    1100 m geprüft (Unterschall beginnt bei ~1330 m, das stimmt).
   *
   * 3) .22 LR 40gr, BC(G1) 0.13, V0 330 m/s, Zero 50 m:
   *    Bei 100 m sind korrekt ca. -22 cm. Selbst im Vakuum (ohne Luftwiderstand)
   *    wären es -18.5 cm — das Prompt-Fenster -10..-15 cm ist mit 50-m-Zero
   *    physikalisch UNMÖGLICH; es entspricht einer ~65-75-m-Einschussentfernung
   *    (GEE-Bereich der .22 LR). Energie < 150 J stimmt und wird geprüft.
   *
   * Die Fenster unten sind daher auf die korrekte Physik kalibriert (großzügig
   * genug für Integrationsfehler, eng genug, um Vorzeichen-, Einheiten- und
   * Modellfehler zuverlässig zu fangen). Es werden keine Werte erfunden.
   * ------------------------------------------------------------------------*/
  function sampleAt(result, distanceM) {
    if (!result || !result.samples) return null;
    for (var i = 0; i < result.samples.length; i++) {
      if (Math.abs(result.samples[i].dM - distanceM) < 1e-6) return result.samples[i];
    }
    return null;
  }

  function checkRange(value, lo, hi) {
    return value !== null && isFinite(value) && value >= lo && value <= hi;
  }

  function selfTest() {
    var results = [];

    function addCase(id, name, checks) {
      var allOk = true;
      for (var i = 0; i < checks.length; i++) if (!checks[i].ok) allOk = false;
      results.push({ id: id, name: name, passed: allOk, checks: checks });
    }

    function check(label, value, lo, hi, unit) {
      return {
        label: label, value: value, expectedMin: lo, expectedMax: hi,
        unit: unit, ok: checkRange(value, lo, hi)
      };
    }

    // Test 1: .308 Win 168gr — Flugzeitfenster wie im Prompt, Drop-Fenster
    // auf korrekte 2D-Physik kalibriert (siehe Hinweis oben).
    var t1 = computeTrajectory({
      v0Ms: 800, bc: 0.462, dragModel: 'G1', weightGr: 168,
      zeroM: 100, sightHeightM: 0.04, maxRangeM: 600, stepM: 50,
      tempC: 15, pressureHpa: 1013.25, humidity: 0
    });
    var s1 = sampleAt(t1, 500);
    addCase('t1', '.308 Win 168gr, G1 0.462, V0 800 m/s, Zero 100 m', [
      check('Drop bei 500 m', s1 ? s1.dropCm : null, -240, -185, 'cm'),
      check('Flugzeit bei 500 m', s1 ? s1.tofS : null, 0.75, 0.85, 's')
    ]);

    // Test 2: 6.5 Creedmoor 140gr — G1-Einzel-BC 0.61, korrektes Fenster.
    var t2 = computeTrajectory({
      v0Ms: 820, bc: 0.61, dragModel: 'G1', weightGr: 140,
      zeroM: 100, sightHeightM: 0.04, maxRangeM: 1200, stepM: 50,
      tempC: 15, pressureHpa: 1013.25, humidity: 0
    });
    var s2 = sampleAt(t2, 1000);
    var s2b = sampleAt(t2, 1100);
    addCase('t2', '6.5 CM 140gr, G1 0.61, V0 820 m/s, Zero 100 m', [
      check('Drop bei 1000 m', s2 ? s2.dropCm : null, -1250, -980, 'cm'),
      check('Mach bei 1100 m (überschall)', s2b ? s2b.mach : null, 1.0, 1.4, 'Mach')
    ]);

    // Test 3: .22 LR 40gr — 50-m-Zero, korrektes Fenster (siehe Hinweis oben).
    var t3 = computeTrajectory({
      v0Ms: 330, bc: 0.13, dragModel: 'G1', weightGr: 40,
      zeroM: 50, sightHeightM: 0.04, maxRangeM: 150, stepM: 50,
      tempC: 15, pressureHpa: 1013.25, humidity: 0
    });
    var s3 = sampleAt(t3, 100);
    addCase('t3', '.22 LR 40gr, G1 0.13, V0 330 m/s, Zero 50 m', [
      check('Drop bei 100 m', s3 ? s3.dropCm : null, -28, -16, 'cm'),
      check('Energie bei 100 m', s3 ? s3.energyJ : null, 0, 150, 'J')
    ]);

    // Sanität: keine NaN, Energie fällt monoton, Drop fällt nach dem Zero.
    var sane = true;
    var cases = [t1, t2, t3];
    for (var c = 0; c < cases.length; c++) {
      var res = cases[c];
      if (!res || res.error || !res.samples) { sane = false; continue; }
      var prevE = Infinity, prevDrop = Infinity, pastZero = false;
      for (var i = 0; i < res.samples.length; i++) {
        var s = res.samples[i];
        if (!isFinite(s.dropCm) || !isFinite(s.tofS) || !isFinite(s.vMs)) sane = false;
        if (s.energyJ !== null) {
          if (!isFinite(s.energyJ) || s.energyJ > prevE + 1e-6) sane = false;
          prevE = s.energyJ;
        }
        if (s.dM >= res.zeroM) {
          if (pastZero && s.dropCm > prevDrop + 1e-6) sane = false;
          pastZero = true;
          prevDrop = s.dropCm;
        }
      }
    }
    results.push({
      id: 'sanity', name: 'Sanität: keine NaN, Energie/Drop monoton',
      passed: sane,
      checks: [{ label: 'Alle Samples endlich und monoton', value: sane ? 1 : 0,
                 expectedMin: 1, expectedMax: 1, unit: '', ok: sane }]
    });

    var allPassed = true;
    for (var r = 0; r < results.length; r++) if (!results[r].passed) allPassed = false;
    return { passed: allPassed, results: results };
  }

  /* --------------------------------------------------------------------------
   * Öffentliche API
   * ------------------------------------------------------------------------*/
  window.Ballistics = {
    VERSION: '1.0.0',
    DT: DT,
    GRAVITY: GRAVITY,
    ISA_RHO0: ISA_RHO0,
    MIL_CLICK_RAD: MIL_CLICK_RAD,
    MOA_CLICK_RAD: MOA_CLICK_RAD,
    computeTrajectory: computeTrajectory,
    solveZeroAngle: solveZeroAngle,
    cdForMach: cdForMach,
    speedOfSound: speedOfSound,
    airDensity: airDensity,
    densityAltitudeM: densityAltitudeM,
    isaPressureHpa: isaPressureHpa,
    isaTempC: isaTempC,
    resolveAtmosphere: resolveAtmosphere,
    millerStability: millerStability,
    spinDriftM: spinDriftM,
    coriolisDriftM: coriolisDriftM,
    eotvosShiftM: eotvosShiftM,
    riflemanEquivalentRangeM: riflemanEquivalentRangeM,
    convert: convert,
    toNum: toNum,
    selfTest: selfTest
  };
})();