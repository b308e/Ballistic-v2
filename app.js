/* ============================================================================
 * app.js — Anwendungslogik der Ballistik-PWA
 * ----------------------------------------------------------------------------
 * Vanilla JS, kein Framework. Kommentare Deutsch, Variablen Englisch.
 * Diese Datei enthält KEINE Munitionsdaten. Sie nutzt ausschließlich die
 * extern geladenen Dateien ammo-db-long.js und ammo-db-short.js.
 * Die Basis-DB wird nie verändert; Nutzer-Overrides liegen in LocalStorage.
 * Fehlende Werte sind null und werden als Strich angezeigt, niemals als 0.
 * ==========================================================================*/
(function () {
  'use strict';

  var B = window.Ballistics;
  var STORAGE_VERSION = 2;
  var APP_ID = 'sniper-ballistik';

  /* --------------------------------------------------------------------------
   * i18n — Wörterbuch Deutsch/Englisch. Format: key: [de, en]
   * ------------------------------------------------------------------------*/
  var I18N = {
    appTitle: ['Sniper Ballistik', 'Sniper Ballistics'],
    tagline: ['Offline-Flugbahnrechner', 'Offline trajectory calculator'],
    navCalc: ['Rechner', 'Calculator'],
    navProfiles: ['Profile', 'Profiles'],
    navLog: ['Logbuch', 'Logbook'],
    navSettings: ['Einstellungen', 'Settings'],
    lexicon: ['Lexikon', 'Lexicon'],
    theme: ['Design', 'Theme'],
    dark: ['Dunkel', 'Dark'],
    light: ['Hell', 'Light'],
    language: ['Sprache', 'Language'],
    units: ['Einheiten', 'Units'],
    metric: ['Metrisch', 'Metric'],
    imperial: ['Imperial', 'Imperial'],
    view: ['Ansicht', 'View'],
    viewFull: ['PC / Tablet', 'PC / Tablet'],
    viewCompact: ['Smartphone kompakt', 'Phone compact'],
    tabLong: ['Langwaffen', 'Long guns'],
    tabShort: ['Kurzwaffen', 'Handguns'],
    caliber: ['Kaliber', 'Caliber'],
    loading: ['Laborierung', 'Load'],
    genericBadge: ['Generisch, historisch, Hirtenberger 2002', 'Generic, historical, Hirtenberger 2002'],
    compare: ['Vergleichsmodus', 'Compare mode'],
    compareWith: ['Vergleich mit', 'Compare with'],
    weaponType: ['Waffentyp', 'Weapon type'],
    env: ['Umgebung & Wetter', 'Environment & weather'],
    temperature: ['Temperatur (°C)', 'Temperature (°C)'],
    pressure: ['Luftdruck (hPa)', 'Pressure (hPa)'],
    humidity: ['Luftfeuchte (%)', 'Humidity (%)'],
    altitude: ['Höhe ü. NN (m)', 'Altitude ASL (m)'],
    windSpeed: ['Windgeschwindigkeit', 'Wind speed'],
    windUnit: ['Windeinheit', 'Wind unit'],
    windDir: ['Windrichtung (° relativ)', 'Wind direction (° relative)'],
    windDirHint: ['0 = Gegenwind, 90 = von rechts, 180 = Rückenwind, 270 = von links', '0 = headwind, 90 = from right, 180 = tailwind, 270 = from left'],
    latitude: ['Breitengrad (°)', 'Latitude (°)'],
    azimuth: ['Schussrichtung / Azimut (°)', 'Shot direction / azimuth (°)'],
    shotAngle: ['Schusswinkel bergauf/-ab (°)', 'Shot angle up/down (°)'],
    coriolis: ['Coriolis & Eötvös', 'Coriolis & Eötvös'],
    spinDrift: ['Spin Drift', 'Spin drift'],
    shotSetup: ['Schuss-Setup', 'Shot setup'],
    zero: ['Zero-Entfernung', 'Zero distance'],
    sightHeight: ['Visierhöhe über Lauf (cm)', 'Sight height over bore (cm)'],
    clickUnit: ['Klickwert', 'Click value'],
    dragModel: ['Drag-Modell', 'Drag model'],
    extendedRange: ['Berechnung bis 1000 m', 'Compute up to 1000 m'],
    show25: ['25-m-Zeile aus refExtra', '25 m row from refExtra'],
    results: ['Ergebnisse', 'Results'],
    computedTable: ['Berechnet (Physik-Engine)', 'Computed (physics engine)'],
    refTable: ['Hersteller-Referenz (DB)', 'Manufacturer reference (DB)'],
    distance: ['Distanz', 'Distance'],
    velocity: ['Geschwindigkeit', 'Velocity'],
    energy: ['Energie', 'Energy'],
    drop: ['Treffpunkt', 'Drop'],
    time: ['Flugzeit', 'Time'],
    drift: ['Abdrift', 'Drift'],
    correction: ['Korrektur', 'Correction'],
    clicks: ['Klicks', 'Clicks'],
    muzzle: ['Mündung (V0 / E0)', 'Muzzle (V0 / E0)'],
    mrd: ['MRD', 'MRD'],
    gee: ['GEE', 'GEE'],
    diff: ['Differenz', 'Difference'],
    refOnlyNotice: ['Für diese Laborierung ist kein BC angegeben, daher keine Berechnung, nur Referenzwerte.', 'No BC is given for this load, therefore no computation, reference values only.'],
    noV0Notice: ['Kein Mündungswert, keine Berechnung möglich.', 'No muzzle velocity, computation not possible.'],
    unverified: ['Unverifiziert', 'Unverified'],
    verified: ['Verifiziert', 'Verified'],
    overrideActive: ['Override aktiv', 'Override active'],
    editLoading: ['Laborierung editieren', 'Edit load'],
    resetOverride: ['Override löschen', 'Reset override'],
    saveOverride: ['Override speichern', 'Save override'],
    overrideSaved: ['Override gespeichert. Basis-DB bleibt unverändert.', 'Override saved. Base DB remains untouched.'],
    overrideReset: ['Override gelöscht.', 'Override deleted.'],
    loadingEditor: ['Laborierungs-Editor', 'Load editor'],
    editorHint: ['Leere Felder werden als null gespeichert und als Strich angezeigt. Die Basis-DB bleibt unverändert.', 'Empty fields are stored as null and shown as a dash. The base DB stays untouched.'],
    weight: ['Geschossgewicht (gr)', 'Bullet weight (gr)'],
    prefillWeight: ['Vorbelegung: Standardgewicht des Kalibers', 'Prefilled with caliber standard weight'],
    bcG1: ['BC G1', 'BC G1'],
    bcG7: ['BC G7', 'BC G7'],
    v0: ['V0 (m/s)', 'V0 (m/s)'],
    barrel: ['Lauflänge', 'Barrel length'],
    barrelDb: ['DB-Lauflänge (mm)', 'DB barrel (mm)'],
    refValues: ['Referenzwerte (50er-Raster)', 'Reference values (50 m grid)'],
    dropValues: ['Treffpunkt aus DB (cm)', 'Point of impact from DB (cm)'],
    zeroOfRef: ['Zero der Treffpunkt-Tabelle', 'Zero of the drop table'],
    sourceNote: ['Quelle', 'Source'],
    profiles: ['Waffenprofile', 'Weapon profiles'],
    newProfile: ['Neues Profil', 'New profile'],
    profileName: ['Profilname', 'Profile name'],
    barrelIn: ['Lauflänge (Zoll)', 'Barrel length (inch)'],
    barrelMmHint: ['Intern in mm: ', 'Internally in mm: '],
    twist: ['Drall (Zoll/Umdrehung, negativ = links)', 'Twist (inch/turn, negative = left)'],
    applyProfile: ['Anwenden', 'Apply'],
    saveProfile: ['Profil speichern', 'Save profile'],
    deleteProfile: ['Profil löschen', 'Delete profile'],
    profileSaved: ['Profil gespeichert.', 'Profile saved.'],
    profileDeleted: ['Profil gelöscht.', 'Profile deleted.'],
    profileApplied: ['Profil angewendet.', 'Profile applied.'],
    activeProfile: ['Aktives Profil', 'Active profile'],
    noProfiles: ['Noch keine Waffenprofile. Lege eines an.', 'No weapon profiles yet. Create one.'],
    undo: ['Rückgängig', 'Undo'],
    restored: ['Wiederhergestellt.', 'Restored.'],
    logbook: ['Schusslogbuch', 'Shot logbook'],
    newEntry: ['Neuer Eintrag', 'New entry'],
    date: ['Datum', 'Date'],
    weapon: ['Waffe', 'Weapon'],
    ammo: ['Munition', 'Ammunition'],
    groupSize: ['Streukreis', 'Group size'],
    weather: ['Wetter', 'Weather'],
    note: ['Notiz', 'Note'],
    saveEntry: ['Eintrag speichern', 'Save entry'],
    entrySaved: ['Eintrag gespeichert.', 'Entry saved.'],
    entryDeleted: ['Eintrag gelöscht.', 'Entry deleted.'],
    noEntries: ['Noch keine Einträge.', 'No entries yet.'],
    useWeather: ['Wetter übernehmen', 'Use current weather'],
    fetchWeather: ['Wetter holen', 'Fetch weather'],
    weatherLoaded: ['Wetter geladen und übernommen.', 'Weather loaded and applied.'],
    weatherError: ['Wetter nicht verfügbar. Manuelle Eingabe nutzen.', 'Weather unavailable. Use manual input.'],
    weatherAt: ['Wetter von', 'Weather from'],
    gps: ['GPS', 'GPS'],
    gpsOk: ['Position übernommen.', 'Position applied.'],
    gpsError: ['GPS nicht verfügbar. Stadt aus der Liste wählen.', 'GPS unavailable. Pick a city from the list.'],
    cityFallback: ['Geo-Fallback: Stadt wählen', 'Geo fallback: pick a city'],
    chooseCity: ['— Stadt wählen —', '— Pick a city —'],
    sensorSnapshot: ['Kompass-Snapshot', 'Compass snapshot'],
    sensorRunning: ['Messe… 5 Werte in 2 s', 'Measuring… 5 samples in 2 s'],
    sensorNone: ['Kein Kompass-Sensor verfügbar.', 'No compass sensor available.'],
    sensorPermission: ['Sensor-Zugriff verweigert.', 'Sensor permission denied.'],
    sensorSpread: ['Streuung', 'Spread'],
    sensorHeading: ['Mittelwert', 'Circular mean'],
    applyAzimuth: ['Als Azimut übernehmen', 'Apply as azimuth'],
    settings: ['Einstellungen', 'Settings'],
    dbVersions: ['Datenbank-Versionen', 'Database versions'],
    dbLong: ['DB Lang', 'DB long'],
    dbShort: ['DB Kurz', 'DB short'],
    stubWarning: ['Stub-DB aktiv — echte DB-Dateien einspielen und Cache-Version in sw.js erhöhen.', 'Stub DB active — deploy real DB files and bump cache version in sw.js.'],
    selfTest: ['Physik-Selbsttest', 'Physics self-test'],
    testPassed: ['Bestanden', 'Passed'],
    testFailed: ['Fehlgeschlagen', 'Failed'],
    dataManagement: ['Daten: Export / Import', 'Data: export / import'],
    exportProfiles: ['Profile exportieren', 'Export profiles'],
    exportOverrides: ['Overrides exportieren', 'Export overrides'],
    exportLogbook: ['Logbuch exportieren', 'Export logbook'],
    exportAll: ['Alles exportieren', 'Export everything'],
    importData: ['JSON importieren', 'Import JSON'],
    importOk: ['Import erfolgreich.', 'Import successful.'],
    importError: ['Import fehlgeschlagen: ungültiges Format.', 'Import failed: invalid format.'],
    resetAll: ['Alle lokalen Daten löschen', 'Delete all local data'],
    resetConfirm: ['Wirklich alle Profile, Overrides, Logbuch und Einstellungen löschen?', 'Really delete all profiles, overrides, logbook and settings?'],
    resetDone: ['Lokale Daten gelöscht.', 'Local data deleted.'],
    disclaimer: ['DB-Werte sind Herstellerangaben und Richtwerte. Sie variieren je nach Waffe, Lauflänge, Temperatur, Los und Ladung. Alle berechneten Werte sind Näherungen. Verifiziere mit echten Schussdaten.', 'DB values are manufacturer data and approximations. They vary with weapon, barrel length, temperature, lot and charge. All computed values are approximations. Verify with real shot data.'],
    dbError: ['ammo-db-long.js oder ammo-db-short.js nicht gefunden oder falsches Format. Bitte echte DB-Datei einspielen.', 'ammo-db-long.js or ammo-db-short.js not found or wrong format. Please deploy the real DB file.'],
    miller: ['Miller-Sg', 'Miller Sg'],
    stabil: ['stabil', 'stable'],
    grenzwertig: ['grenzwertig', 'marginal'],
    instabil: ['instabil', 'unstable'],
    densityAlt: ['Dichtehöhe', 'Density altitude'],
    airDensity: ['Luftdichte', 'Air density'],
    soundSpeed: ['Schallgeschwindigkeit', 'Speed of sound'],
    transsonic: ['Transsonisch ab', 'Transsonic from'],
    subsonic: ['Unterschall ab', 'Subsonic from'],
    rifleman: ["Rifleman's Rule", "Rifleman's rule"],
    riflemanHint: ['Bergauf/Bergab: Halte dich an die horizontale Äquivalenzdistanz in der Tabelle.', 'Uphill/downhill: hold for the horizontal equivalent distance in the table.'],
    slant: ['Schräg', 'Slant'],
    horizontal: ['Horizontal', 'Horizontal'],
    close: ['Schließen', 'Close'],
    cancel: ['Abbrechen', 'Cancel'],
    save: ['Speichern', 'Save'],
    delete: ['Löschen', 'Delete'],
    edit: ['Editieren', 'Edit'],
    actions: ['Aktionen', 'Actions'],
    noDb: ['Keine gültige DB geladen.', 'No valid DB loaded.'],
    g7Fallback: ['G7 gewählt, aber kein bcG7 vorhanden — Rechne mit G1.', 'G7 selected but no bcG7 present — computing with G1.'],
    refZeroUnknown: ['Zero unbekannt', 'Zero unknown'],
    windFrom: ['Wind von', 'Wind from'],
    exportDone: ['Export erstellt.', 'Export created.'],
    seedNote: ['Erstinitialisierung: Beispiel-Einträge angelegt.', 'First run: example entries created.']
  };

  function t(key) {
    var row = I18N[key];
    if (!row) return key;
    return row[state.lang === 'en' ? 1 : 0];
  }

  /* --------------------------------------------------------------------------
   * Lexikon-Einträge mit Wikipedia-Link (Pflichtthemen)
   * ------------------------------------------------------------------------*/
  var LEXICON = {
    bc: {
      title: ['Ballistischer Koeffizient (BC)', 'Ballistic coefficient (BC)'],
      body: [
        'Der BC beschreibt, wie gut ein Geschoss den Luftwiderstand überwindet. Höherer BC = weniger Geschwindigkeitsverlust. G1 bezieht sich auf ein flachbodiges Standardgeschoss, G7 auf ein Boat-Tail-Standardgeschoss. G7 passt für moderne Langgeschosse meist besser; ein G1-BC ist streng genommen geschwindigkeitsabhängig.',
        'The BC describes how well a bullet overcomes air drag. Higher BC = less velocity loss. G1 references a flat-base standard projectile, G7 a boat-tail standard. G7 usually fits modern long bullets better; a G1 BC is strictly velocity-dependent.'
      ],
      wiki: ['https://de.wikipedia.org/wiki/Ballistischer_Koeffizient', 'https://en.wikipedia.org/wiki/Ballistic_coefficient']
    },
    coriolis: {
      title: ['Coriolis-Effekt', 'Coriolis effect'],
      body: [
        'Durch die Erdrotation erfährt ein Geschoss eine scheinbare Ablenkung: auf der Nordhalbkugel nach rechts, auf der Südhalbkugel nach links. Die horizontale Ablenkung wächst mit Flugzeit und Breitengrad (sin φ) und wird erst ab ca. 600–800 m relevant.',
        'Earth rotation causes an apparent deflection: right in the northern hemisphere, left in the southern. Horizontal drift grows with time of flight and latitude (sin φ) and matters beyond roughly 600–800 m.'
      ],
      wiki: ['https://de.wikipedia.org/wiki/Corioliskraft', 'https://en.wikipedia.org/wiki/Coriolis_force']
    },
    eotvos: {
      title: ['Eötvös-Effekt', 'Eötvös effect'],
      body: [
        'Ostschüsse treffen tendenziell hoch, Westschüsse tief: Die Bewegung relativ zur Erdrotation verändert die effektive Fallbeschleunigung. Der Effekt hängt vom Kosinus des Breitengrads und dem Sinus des Azimuts ab und ist eine vertikale Komponente der Coriolis-Beschleunigung.',
        'Shots to the east tend to hit high, shots to the west low: motion relative to Earth rotation changes effective gravity. The effect depends on cos(latitude) and sin(azimuth) and is the vertical component of the Coriolis acceleration.'
      ],
      wiki: ['https://de.wikipedia.org/wiki/E%C3%B6tv%C3%B6s-Effekt', 'https://en.wikipedia.org/wiki/E%C3%B6tv%C3%B6s_effect']
    },
    spindrift: {
      title: ['Spin Drift', 'Spin drift'],
      body: [
        'Ein drallstabilisiertes Geschoss driftet durch die Kreiselwirkung in Drallrichtung (Rechtsdrall → rechts). Empirische Näherung nach Litz: Drift in Zoll ≈ 1.25 · (Sg + 1.2) · Flugzeit^1.83. Ohne bekannte Geschosslänge kann Sg nicht berechnet werden und der Wert bleibt null.',
        'A spin-stabilized bullet drifts toward the twist direction (right twist → right). Litz approximation: drift in inches ≈ 1.25 · (Sg + 1.2) · time^1.83. Without a known bullet length Sg cannot be computed and the value stays null.'
      ],
      wiki: ['https://en.wikipedia.org/wiki/Spin_drift', 'https://en.wikipedia.org/wiki/Spin_drift']
    },
    densityalt: {
      title: ['Dichtehöhe', 'Density altitude'],
      body: [
        'Die Dichtehöhe ist die ISA-Höhe, bei der die aktuelle Luftdichte herrschen würde. Warme, feuchte Luft und geringer Druck erhöhen die Dichtehöhe: Das Geschoss verliert langsamer Geschwindigkeit, der Treffpunkt wandert. Die Engine nutzt die tatsächliche Luftdichte aus Temperatur, Druck und Feuchte.',
        'Density altitude is the ISA altitude matching current air density. Warm, humid air and low pressure raise it: the bullet loses velocity more slowly and impact shifts. The engine uses actual air density from temperature, pressure and humidity.'
      ],
      wiki: ['https://de.wikipedia.org/wiki/Dichteh%C3%B6he', 'https://en.wikipedia.org/wiki/Density_altitude']
    },
    zero: {
      title: ['Zero-Bedingungen', 'Zero conditions'],
      body: [
        'Der Zero-Solver bestimmt den Abschusswinkel so, dass die Flugbahn die Visierlinie auf der Zero-Entfernung schneidet — unter Null-Bedingungen: kein Wind, kein Coriolis, kein Spin Drift, Visierhöhe berücksichtigt. Standard: 100 m (Langwaffen), 25 m (Kurzwaffen). MRD und GEE sind DB-Richtwerte, keine berechneten Zusagen.',
        'The zero solver finds the launch angle where the trajectory crosses the line of sight at the zero distance — under null conditions: no wind, no Coriolis, no spin drift, sight height included. Defaults: 100 m (long guns), 25 m (handguns). MRD and GEE are DB reference values, not computed promises.'
      ],
      wiki: ['https://de.wikipedia.org/wiki/Einschie%C3%9Fen', 'https://en.wikipedia.org/wiki/Sighting_in']
    }
  };

  /* --------------------------------------------------------------------------
   * Geo-Fallback-Liste (~25 Städte in DE, AT, CH, USA) mit Breitengrad
   * ------------------------------------------------------------------------*/
  var CITIES = [
    // Deutschland
    { n: 'Berlin', c: 'DE', lat: 52.52, lon: 13.405, alt: 34 },
    { n: 'Hamburg', c: 'DE', lat: 53.55, lon: 9.99, alt: 6 },
    { n: 'München', c: 'DE', lat: 48.14, lon: 11.58, alt: 520 },
    { n: 'Köln', c: 'DE', lat: 50.94, lon: 6.96, alt: 53 },
    { n: 'Frankfurt', c: 'DE', lat: 50.11, lon: 8.68, alt: 112 },
    { n: 'Stuttgart', c: 'DE', lat: 48.78, lon: 9.18, alt: 245 },
    { n: 'Dresden', c: 'DE', lat: 51.05, lon: 13.74, alt: 113 },
    { n: 'Hannover', c: 'DE', lat: 52.37, lon: 9.73, alt: 55 },
    { n: 'Nürnberg', c: 'DE', lat: 49.45, lon: 11.08, alt: 302 },
    { n: 'Freiburg', c: 'DE', lat: 47.99, lon: 7.84, alt: 278 },
    // Österreich
    { n: 'Wien', c: 'AT', lat: 48.21, lon: 16.37, alt: 171 },
    { n: 'Graz', c: 'AT', lat: 47.07, lon: 15.44, alt: 353 },
    { n: 'Salzburg', c: 'AT', lat: 47.80, lon: 13.04, alt: 424 },
    { n: 'Innsbruck', c: 'AT', lat: 47.27, lon: 11.40, alt: 574 },
    { n: 'Klagenfurt', c: 'AT', lat: 46.62, lon: 14.31, alt: 446 },
    // Schweiz
    { n: 'Zürich', c: 'CH', lat: 47.38, lon: 8.54, alt: 408 },
    { n: 'Bern', c: 'CH', lat: 46.95, lon: 7.45, alt: 540 },
    { n: 'Basel', c: 'CH', lat: 47.56, lon: 7.59, alt: 260 },
    { n: 'Genf', c: 'CH', lat: 46.20, lon: 6.14, alt: 375 },
    { n: 'Chur', c: 'CH', lat: 46.85, lon: 9.53, alt: 593 },
    // Polen (Neu)
    { n: 'Warschau', c: 'PL', lat: 52.23, lon: 21.01, alt: 100 },
    { n: 'Krakau', c: 'PL', lat: 50.06, lon: 19.94, alt: 220 },
    { n: 'Breslau', c: 'PL', lat: 51.11, lon: 17.04, alt: 110 },
    { n: 'Posen', c: 'PL', lat: 52.41, lon: 16.92, alt: 70 },
    { n: 'Danzig', c: 'PL', lat: 54.35, lon: 18.65, alt: 15 },
    { n: 'Lodz', c: 'PL', lat: 51.76, lon: 19.46, alt: 180 },
    { n: 'Rzeszów', c: 'PL', lat: 50.04, lon: 21.99, alt: 200 },
    // Ukraine (Neu)
    { n: 'Kiew', c: 'UA', lat: 50.45, lon: 30.52, alt: 170 },
    { n: 'Charkiw', c: 'UA', lat: 49.99, lon: 36.23, alt: 150 },
    { n: 'Odessa', c: 'UA', lat: 46.48, lon: 30.73, alt: 40 },
    { n: 'Dnipro', c: 'UA', lat: 48.46, lon: 35.04, alt: 80 },
    { n: 'Donezk', c: 'UA', lat: 48.02, lon: 37.80, alt: 200 },
    { n: 'Lwiw', c: 'UA', lat: 49.84, lon: 24.02, alt: 290 },
    { n: 'Saporischschja', c: 'UA', lat: 47.84, lon: 35.12, alt: 110 },
    // Russland (Neu - Europäische Teile & Ural)
    { n: 'Moskau', c: 'RU', lat: 55.75, lon: 37.62, alt: 150 },
    { n: 'St. Petersburg', c: 'RU', lat: 59.93, lon: 30.33, alt: 10 },
    { n: 'Nowosibirsk', c: 'RU', lat: 55.00, lon: 82.93, alt: 160 },
    { n: 'Jekaterinburg', c: 'RU', lat: 56.84, lon: 60.61, alt: 250 },
    { n: 'Kasan', c: 'RU', lat: 55.79, lon: 49.10, alt: 60 },
    { n: 'Nischni Nowgorod', c: 'RU', lat: 56.30, lon: 44.00, alt: 140 },
    { n: 'Tscheljabinsk', c: 'RU', lat: 55.15, lon: 61.43, alt: 220 },
    { n: 'Samara', c: 'RU', lat: 53.20, lon: 50.15, alt: 120 },
    { n: 'Omsk', c: 'RU', lat: 54.98, lon: 73.37, alt: 100 },
    { n: 'Rostow am Don', c: 'RU', lat: 47.23, lon: 39.72, alt: 70 },
    { n: 'Ufa', c: 'RU', lat: 54.73, lon: 55.97, alt: 140 },
    { n: 'Krasnojarsk', c: 'RU', lat: 56.02, lon: 92.87, alt: 140 },
    { n: 'Perm', c: 'RU', lat: 58.01, lon: 56.25, alt: 170 },
    { n: 'Woronesch', c: 'RU', lat: 51.67, lon: 39.20, alt: 150 },
    { n: 'Wolgograd', c: 'RU', lat: 48.71, lon: 44.50, alt: 80 },
    // USA (Bestehend)
    { n: 'New York', c: 'US', lat: 40.71, lon: -74.01, alt: 10 },
    { n: 'Los Angeles', c: 'US', lat: 34.05, lon: -118.24, alt: 93 },
    { n: 'Chicago', c: 'US', lat: 41.88, lon: -87.63, alt: 181 },
    { n: 'Houston', c: 'US', lat: 29.76, lon: -95.37, alt: 15 },
    { n: 'Denver', c: 'US', lat: 39.74, lon: -104.99, alt: 1609 },
    { n: 'Phoenix', c: 'US', lat: 33.45, lon: -112.07, alt: 331 },
    { n: 'Seattle', c: 'US', lat: 47.61, lon: -122.33, alt: 40 }
  ];

  /* --------------------------------------------------------------------------
   * LocalStorage mit Version + Migration
   * ------------------------------------------------------------------------*/
  function loadEnvelope(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && 'version' in parsed && 'data' in parsed) {
        return migrateEnvelope(key, parsed);
      }
      // Legacy ohne Version: als Version 1 behandeln und migrieren.
      return migrateEnvelope(key, { version: 1, data: parsed });
    } catch (e) { return null; }
  }

  function migrateEnvelope(key, env) {
    var v = env.version || 1;
    var data = env.data;
    if (v < 2 && key === APP_ID + '.profiles' && Array.isArray(data)) {
      // Migration v1 -> v2: v1 speicherte barrelMm, v2 speichert barrelIn (Zoll).
      data = data.map(function (p) {
        var q = Object.assign({}, p);
        if (q.barrelIn == null && q.barrelMm != null) q.barrelIn = q.barrelMm / 25.4;
        if (q.twistIn == null) q.twistIn = null;
        if (q.sightHeightCm == null) q.sightHeightCm = null;
        return q;
      });
    }
    return { version: STORAGE_VERSION, data: data };
  }

  function saveEnvelope(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, data: data }));
    } catch (e) { /* Speicher voll oder gesperrt: App läuft weiter, nur ohne Persistenz. */ }
  }

  /* --------------------------------------------------------------------------
   * Zustand
   * ------------------------------------------------------------------------*/
  var state = {
    lang: 'de', units: 'metric', theme: 'dark', view: 'auto',
    section: 'calc',
    weaponType: 'long',
    sel: { long: { caliber: null, name: null }, short: { caliber: null, name: null } },
    compareOn: false,
    cmp: { type: 'long', caliber: null, name: null },
    env: {
      tempC: 15, pressureHpa: 1013.25, humidityPct: 50, altitudeM: null,
      windSpeedMs: 0, windUnit: 'ms', windAngleDeg: 0,
      latitudeDeg: null, azimuthDeg: 0, shotAngleDeg: 0,
      enableCoriolis: false, enableSpinDrift: false,
      locationName: null
    },
    shot: { zeroM: null, sightHeightCm: null, clickUnit: 'mil01', dragModel: 'G1', extended: false, show25: false },
    profiles: [], activeProfileId: null,
    overrides: {},
    logbook: [],
    lastWeather: null,
    sensor: null, sensorRunning: false,
    selfTest: null,
    dbOk: false, dbIssues: []
  };

  var saveTimer = null;
  function persistSettings() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      saveEnvelope(APP_ID + '.settings', {
        lang: state.lang, units: state.units, theme: state.theme, view: state.view,
        weaponType: state.weaponType, sel: state.sel, compareOn: state.compareOn, cmp: state.cmp,
        env: state.env, shot: state.shot, activeProfileId: state.activeProfileId
      });
    }, 250);
  }

  function restoreState() {
    var s = loadEnvelope(APP_ID + '.settings');
    if (s && s.data) {
      var d = s.data;
      ['lang', 'units', 'theme', 'view', 'weaponType', 'compareOn', 'activeProfileId'].forEach(function (k) {
        if (d[k] != null) state[k] = d[k];
      });
      if (d.sel) state.sel = Object.assign(state.sel, d.sel);
      if (d.cmp) state.cmp = Object.assign(state.cmp, d.cmp);
      if (d.env) state.env = Object.assign(state.env, d.env);
      if (d.shot) state.shot = Object.assign(state.shot, d.shot);
    }
    var p = loadEnvelope(APP_ID + '.profiles');
    state.profiles = p && Array.isArray(p.data) ? p.data : [];
    var o = loadEnvelope(APP_ID + '.overrides');
    state.overrides = o && o.data && typeof o.data === 'object' ? o.data : {};
    var l = loadEnvelope(APP_ID + '.logbook');
    state.logbook = l && Array.isArray(l.data) ? l.data : [];
    if (!l) seedLogbook();
    if (state.view === 'auto') {
      state.view = window.matchMedia && window.matchMedia('(max-width: 760px)').matches ? 'compact' : 'full';
    }
  }

  /* Beispiel-Einträge beim allerersten Start (editierbar/löschbar). */
  function seedLogbook() {
    state.logbook = [
      { id: uid(), date: '2026-11-21', weapon: '.308 Win, 24" Lauf', ammo: '168gr Match', distanceM: 100, groupCm: 2.4, weather: '8 °C, 1016 hPa, Wind 2 m/s von links', note: 'Zero kontrolliert, 5 Schuss liegend aufgelegt.' },
      { id: uid(), date: '2026-11-14', weapon: '.308 Win, 24" Lauf', ammo: '168gr Match', distanceM: 200, groupCm: 3.8, weather: '11 °C, 1012 hPa, windstill', note: 'Gruppe sitzt 1 cm tief, Optik 2 Klicks hoch.' },
      { id: uid(), date: '2026-11-02', weapon: '9 mm Luger, 4" Lauf', ammo: '124gr FMJ', distanceM: 25, groupCm: 4.5, weather: 'Halle, 18 °C', note: 'Neue Griffschalen, Funktionstest.' }
    ];
    saveEnvelope(APP_ID + '.logbook', state.logbook);
  }

  function uid() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  /* --------------------------------------------------------------------------
   * DB-Validierung und Zugriff (Basis-DB bleibt unverändert)
   * ------------------------------------------------------------------------*/
  function validateDatabases() {
    var issues = [];
    function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }
    if (!isObj(window.AMMO_DB_LONG)) issues.push('AMMO_DB_LONG');
    if (!isObj(window.AMMO_DB_SHORT)) issues.push('AMMO_DB_SHORT');
    if (!isObj(window.CALIBER_META_LONG)) issues.push('CALIBER_META_LONG');
    if (!isObj(window.CALIBER_META_SHORT)) issues.push('CALIBER_META_SHORT');
    if (typeof window.AMMO_DB_VERSION_LONG !== 'string') issues.push('AMMO_DB_VERSION_LONG');
    if (typeof window.AMMO_DB_VERSION_SHORT !== 'string') issues.push('AMMO_DB_VERSION_SHORT');
    if (issues.length === 0) {
      // Stichprobenartige Schema-Prüfung: Kaliber -> Array von Einträgen mit n und ref.
      [['long', window.AMMO_DB_LONG], ['short', window.AMMO_DB_SHORT]].forEach(function (pair) {
        var db = pair[1];
        Object.keys(db).forEach(function (cal) {
          var arr = db[cal];
          if (!Array.isArray(arr)) { issues.push(pair[0] + ':' + cal); return; }
          arr.forEach(function (e) {
            if (!e || typeof e.n !== 'string' || !e.ref || !Array.isArray(e.ref.distances)) {
              issues.push(pair[0] + ':' + cal + ':ref');
            }
          });
        });
      });
    }
    state.dbOk = issues.length === 0;
    state.dbIssues = issues;
  }

  function dbOf(type) { return type === 'short' ? window.AMMO_DB_SHORT : window.AMMO_DB_LONG; }
  function metaOf(type) { return type === 'short' ? window.CALIBER_META_SHORT : window.CALIBER_META_LONG; }

  function calibersOf(type) {
    if (!state.dbOk) return [];
    return Object.keys(dbOf(type) || {});
  }

  function overrideKey(type, caliber, name) { return type + '::' + caliber + '::' + name; }

  /* Laborierungen mit Overrides, Generisch immer zuerst, Basis bleibt unberührt. */
  function loadingsOf(type, caliber) {
    if (!state.dbOk) return [];
    var base = (dbOf(type) || {})[caliber];
    if (!Array.isArray(base)) return [];
    var list = base.map(function (e, i) {
      var merged = JSON.parse(JSON.stringify(e));
      var ov = state.overrides[overrideKey(type, caliber, e.n)];
      var overridden = false;
      if (ov && ov.fields) {
        overridden = true;
        ['bcG1', 'bcG7', 'v0', 'barrelMm', 'g'].forEach(function (k) {
          if (k in ov.fields) merged[k] = ov.fields[k];
        });
        if (ov.refV && merged.ref && Array.isArray(merged.ref.v)) {
          ov.refV.forEach(function (v, idx) { if (idx < merged.ref.v.length) merged.ref.v[idx] = v; });
        }
        if (ov.refE && merged.ref && Array.isArray(merged.ref.e)) {
          ov.refE.forEach(function (v, idx) { if (idx < merged.ref.e.length) merged.ref.e[idx] = v; });
        }
        if (ov.drop && merged.dropCm && Array.isArray(merged.dropCm.values)) {
          ov.drop.forEach(function (v, idx) { if (idx < merged.dropCm.values.length) merged.dropCm.values[idx] = v; });
        }
      }
      return { entry: merged, overridden: overridden, baseIndex: i };
    });
    list.sort(function (a, b) {
      var ga = a.entry.generic === true ? 0 : 1;
      var gb = b.entry.generic === true ? 0 : 1;
      return ga - gb || a.baseIndex - b.baseIndex;
    });
    return list;
  }

  function resolveSelection(type, selObj) {
    var cals = calibersOf(type);
    if (cals.length === 0) return null;
    var caliber = cals.indexOf(selObj.caliber) >= 0 ? selObj.caliber : cals[0];
    var list = loadingsOf(type, caliber);
    if (list.length === 0) return null;
    var idx = 0;
    for (var i = 0; i < list.length; i++) if (list[i].entry.n === selObj.name) { idx = i; break; }
    selObj.caliber = caliber;
    selObj.name = list[idx].entry.n;
    return { type: type, caliber: caliber, index: idx, entry: list[idx].entry, overridden: list[idx].overridden, list: list };
  }

  function activeProfile() {
    for (var i = 0; i < state.profiles.length; i++) if (state.profiles[i].id === state.activeProfileId) return state.profiles[i];
    return null;
  }

  /* --------------------------------------------------------------------------
   * Formatierung: null/NaN => Strich, niemals 0 oder NaN.
   * ------------------------------------------------------------------------*/
  function fmt(n, dec) {
    if (n === null || n === undefined || typeof n !== 'number' || !isFinite(n)) return '–';
    return n.toFixed(dec == null ? 0 : dec);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isImp() { return state.units === 'imperial'; }
  function dispDist(m, dec) { return isImp() ? fmt(B.convert.mToYd(m), dec == null ? 0 : dec) : fmt(m, dec == null ? 0 : dec); }
  function distUnit() { return isImp() ? 'yd' : 'm'; }
  function dispVel(ms, dec) { return isImp() ? fmt(B.convert.msToFps(ms), dec == null ? 0 : dec) : fmt(ms, dec == null ? 0 : dec); }
  function velUnit() { return isImp() ? 'fps' : 'm/s'; }
  function dispEn(j, dec) { return isImp() ? fmt(B.convert.jToFtLb(j), dec == null ? 0 : dec) : fmt(j, dec == null ? 0 : dec); }
  function enUnit() { return isImp() ? 'ft·lb' : 'J'; }
  function dispLen(cm, dec) { return isImp() ? fmt(B.convert.cmToIn(cm), dec == null ? 1 : dec) : fmt(cm, dec == null ? 1 : dec); }
  function lenUnit() { return isImp() ? 'in' : 'cm'; }
  function num(v) { return B.toNum(v); }
  function inputValue(v) { return v === null || v === undefined ? '' : String(v); }

  /* --------------------------------------------------------------------------
   * Berechnung
   * ------------------------------------------------------------------------*/
  function defaultZero(type) { return type === 'short' ? 25 : 100; }
  function defaultSight(type) { return type === 'short' ? 2.5 : 4; }

  function calcFor(sel) {
    var e = sel.entry;
    var meta = (metaOf(sel.type) || {})[sel.caliber] || {};
    var profile = activeProfile();
    var refOnly = e.generic === true || e.bcG1 == null;
    var out = { sel: sel, refOnly: refOnly, noV0: e.v0 == null, result: null, g7Fallback: false };
    if (refOnly || e.v0 == null) return out;
    var model = state.shot.dragModel;
    var bc = e.bcG1;
    if (model === 'G7') {
      if (e.bcG7 != null) bc = e.bcG7;
      else { model = 'G1'; out.g7Fallback = true; }
    }
    var maxRange = sel.type === 'short' ? 100 : (state.shot.extended ? 1000 : 300);
    out.result = B.computeTrajectory({
      v0Ms: e.v0, bc: bc, dragModel: model, weightGr: e.g,
      diameterIn: meta.diameterInch != null ? meta.diameterInch : null,
      twistIn: profile && profile.twistIn != null ? profile.twistIn : null,
      zeroM: state.shot.zeroM != null ? state.shot.zeroM : defaultZero(sel.type),
      sightHeightM: (state.shot.sightHeightCm != null ? state.shot.sightHeightCm : defaultSight(sel.type)) / 100,
      maxRangeM: maxRange, stepM: 50,
      tempC: num(state.env.tempC), pressureHpa: num(state.env.pressureHpa),
      humidity: num(state.env.humidityPct) != null ? num(state.env.humidityPct) / 100 : null,
      altitudeM: num(state.env.altitudeM),
      windSpeedMs: num(state.env.windSpeedMs) || 0, windAngleDeg: num(state.env.windAngleDeg) || 0,
      latitudeDeg: num(state.env.latitudeDeg), azimuthDeg: num(state.env.azimuthDeg) || 0,
      enableCoriolis: state.env.enableCoriolis, enableSpinDrift: state.env.enableSpinDrift,
      clickUnit: state.shot.clickUnit
    });
    return out;
  }

  /* Referenzwerte als Map: Distanz -> {v, e}. Fehlende Werte bleiben null. */
  function refMap(entry, includeExtra) {
    var map = {};
    if (entry.ref && Array.isArray(entry.ref.distances)) {
      entry.ref.distances.forEach(function (d, i) {
        map[d] = { v: entry.ref.v && entry.ref.v[i] != null ? entry.ref.v[i] : null,
                   e: entry.ref.e && entry.ref.e[i] != null ? entry.ref.e[i] : null };
      });
    }
    if (includeExtra && entry.refExtra && Array.isArray(entry.refExtra.distances)) {
      entry.refExtra.distances.forEach(function (d, i) {
        map[d] = { v: entry.refExtra.v && entry.refExtra.v[i] != null ? entry.refExtra.v[i] : null,
                   e: entry.refExtra.e && entry.refExtra.e[i] != null ? entry.refExtra.e[i] : null };
      });
    }
    return map;
  }

  function dropMap(entry) {
    var map = {};
    if (entry.dropCm && Array.isArray(entry.dropCm.distances)) {
      entry.dropCm.distances.forEach(function (d, i) {
        map[d] = entry.dropCm.values && entry.dropCm.values[i] != null ? entry.dropCm.values[i] : null;
      });
    }
    return map;
  }

  function diffBadge(calc, ref) {
    if (calc == null || ref == null || !isFinite(calc) || !isFinite(ref) || ref === 0) return '';
    var pct = (calc - ref) / ref * 100;
    var cls = Math.abs(pct) < 5 ? 'diff-ok' : (Math.abs(pct) < 15 ? 'diff-warn' : 'diff-bad');
    return '<span class="diff ' + cls + '">' + (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%</span>';
  }

  /* Eine Ergebniskarte (berechnet + Referenz nebeneinander, gleiches Raster). */
  function resultCard(calcOut, label) {
    if (!calcOut) return '';
    var sel = calcOut.sel, e = sel.entry, res = calcOut.result;
    var meta = (metaOf(sel.type) || {})[sel.caliber] || {};
    var maxRange = sel.type === 'short' ? 100 : (state.shot.extended ? 1000 : 300);
    var includeExtra = sel.type === 'short' && state.shot.show25;
    var refs = refMap(e, includeExtra);
    var drops = dropMap(e);
    var samples = {};
    if (res && res.samples) res.samples.forEach(function (s) { samples[s.dM] = s; });

    // Gemeinsames Raster: 50er-Schritte plus optional 25 m (nur Referenz).
    var grid = [];
    for (var d = 50; d <= maxRange; d += 50) grid.push(d);
    Object.keys(refs).map(Number).forEach(function (d) {
      if (d > 0 && d <= maxRange && grid.indexOf(d) < 0) grid.push(d);
    });
    Object.keys(drops).map(Number).forEach(function (d) {
      if (d > 0 && d <= maxRange && grid.indexOf(d) < 0) grid.push(d);
    });
    grid.sort(function (a, b) { return a - b; });

    var badges = '';
    if (e.generic === true) badges += '<span class="badge badge-generic">' + esc(t('genericBadge')) + '</span>';
    if (e.verified !== true) badges += '<span class="badge badge-warn">' + esc(t('unverified')) + '</span>';
    else badges += '<span class="badge badge-ok">' + esc(t('verified')) + '</span>';
    if (calcOut.overridden || sel.overridden) badges += '<span class="badge badge-accent">' + esc(t('overrideActive')) + '</span>';

    var notices = '';
    if (calcOut.noV0) notices += '<div class="notice notice-warn">' + esc(t('noV0Notice')) + '</div>';
    if (calcOut.refOnly) notices += '<div class="notice notice-info">' + esc(t('refOnlyNotice')) + '</div>';
    if (calcOut.g7Fallback) notices += '<div class="notice notice-warn">' + esc(t('g7Fallback')) + '</div>';

    // Mündungszeile: V0/E0 aus Eingabe bzw. Rechnung, Referenz aus DB (null => –).
    var ref0 = refs[0] || { v: null, e: null };
    var muzzleCalcV = e.v0, muzzleCalcE = res ? res.muzzleEnergyJ : null;

    var calcRows = '', refRows = '';
    grid.forEach(function (d) {
      var s = samples[d] || null;
      var r = refs[d] || { v: null, e: null };
      var dropRef = drops[d] != null ? drops[d] : null;
      if (res && !calcOut.refOnly && !calcOut.noV0) {
        calcRows += '<tr><td class="num">' + dispDist(d) + '</td>' +
          '<td class="num">' + dispVel(s ? s.vMs : null) + diffBadge(s ? s.vMs : null, r.v) + '</td>' +
          '<td class="num">' + dispEn(s ? s.energyJ : null) + diffBadge(s ? s.energyJ : null, r.e) + '</td>' +
          '<td class="num strong">' + dispLen(s ? s.dropCm : null) + '</td>' +
          '<td class="num">' + fmt(s ? s.tofS : null, 3) + '</td>' +
          '<td class="num">' + dispLen(s ? s.totalDriftCm : null) + '</td>' +
          '<td class="num">' + (s && s.clicks != null ? s.clicks : '–') +
            '<span class="sub">' + (s ? fmt(state.shot.clickUnit === 'moa25' ? s.elevMoa : s.elevMil, 2) : '–') +
            (state.shot.clickUnit === 'moa25' ? ' MOA' : ' MIL') + '</span></td></tr>';
      }
      refRows += '<tr><td class="num">' + dispDist(d) + '</td>' +
        '<td class="num">' + dispVel(r.v) + '</td>' +
        '<td class="num">' + dispEn(r.e) + '</td>' +
        '<td class="num">' + dispLen(dropRef) + '</td></tr>';
    });

    var clickLabel = state.shot.clickUnit === 'moa25' ? '¼ MOA' : '0.1 MIL';
    var computedHtml;
    if (res && !calcOut.refOnly && !calcOut.noV0) {
      computedHtml =
        '<div class="table-block"><h4>' + esc(t('computedTable')) + '</h4>' +
        '<div class="table-scroll"><table class="data-table"><thead><tr>' +
        '<th>' + esc(t('distance')) + ' (' + distUnit() + ')</th><th>' + esc(t('velocity')) + ' (' + velUnit() + ')</th>' +
        '<th>' + esc(t('energy')) + ' (' + enUnit() + ')</th><th>' + esc(t('drop')) + ' (' + lenUnit() + ')</th>' +
        '<th>' + esc(t('time')) + ' (s)</th><th>' + esc(t('drift')) + ' (' + lenUnit() + ')</th>' +
        '<th>' + esc(t('clicks')) + ' (' + clickLabel + ')</th></tr></thead><tbody>' +
        '<tr class="muzzle-row"><td class="num">0</td><td class="num">' + dispVel(muzzleCalcV) + '</td>' +
        '<td class="num">' + dispEn(muzzleCalcE) + '</td><td class="num">' + dispLen(-(state.shot.sightHeightCm != null ? state.shot.sightHeightCm : defaultSight(sel.type))) + '</td>' +
        '<td class="num">0.000</td><td class="num">' + dispLen(0) + '</td><td class="num">–</td></tr>' +
        calcRows + '</tbody></table></div></div>';
    } else {
      computedHtml = '<div class="table-block"><h4>' + esc(t('computedTable')) + '</h4>' +
        '<div class="notice notice-muted">' + esc(calcOut.noV0 ? t('noV0Notice') : t('refOnlyNotice')) + '</div></div>';
    }

    var refZero = e.dropCm && e.dropCm.zero != null ? dispDist(e.dropCm.zero) + ' ' + distUnit() : t('refZeroUnknown');
    var referenceHtml =
      '<div class="table-block"><h4>' + esc(t('refTable')) + '</h4>' +
      '<div class="table-scroll"><table class="data-table"><thead><tr>' +
      '<th>' + esc(t('distance')) + ' (' + distUnit() + ')</th><th>' + esc(t('velocity')) + ' (' + velUnit() + ')</th>' +
      '<th>' + esc(t('energy')) + ' (' + enUnit() + ')</th><th>' + esc(t('drop')) + ' (' + lenUnit() + ')</th>' +
      '</tr></thead><tbody>' +
      '<tr class="muzzle-row"><td class="num">0</td><td class="num">' + dispVel(ref0.v) + '</td>' +
      '<td class="num">' + dispEn(ref0.e) + '</td><td class="num">–</td></tr>' +
      refRows + '</tbody></table></div>' +
      '<p class="hint">' + esc(t('zeroOfRef')) + ': ' + esc(refZero) + '</p></div>';

    // Meta-Chips: BC, Gewicht, MRD, GEE (Kurzwaffe immer null), Miller, Atmosphäre.
    var gee = sel.type === 'short' ? null : (e.gee != null ? e.gee : null);
    var chips =
      chip('BC ' + (res ? res.dragModel : 'G1'), res ? fmt(res.bcUsed, 3) : fmt(e.bcG1, 3)) +
      chip(t('weight'), fmt(e.g, 0) + ' gr') +
      chip('V0', dispVel(e.v0) + ' ' + velUnit()) +
      chip(t('barrelDb'), e.barrelMm != null ? fmt(e.barrelMm, 0) + ' mm' : '–') +
      chip(t('mrd'), e.mrd != null ? dispDist(e.mrd) + ' ' + distUnit() : '–') +
      chip(t('gee'), gee != null ? dispDist(gee) + ' ' + distUnit() : '–') +
      chip(t('miller'), res && res.miller ? fmt(res.miller.sg, 2) + ' · ' + t(res.miller.stabilityClass) : '–');

    var atmoHtml = '';
    if (res && res.atmo) {
      atmoHtml = '<div class="atmo-strip">' +
        chip(t('airDensity'), fmt(res.atmo.rho, 3) + ' kg/m³') +
        chip(t('densityAlt'), dispDist(res.atmo.densityAltitudeM) + ' ' + distUnit()) +
        chip(t('soundSpeed'), dispVel(res.atmo.speedOfSoundMs) + ' ' + velUnit()) +
        (res.transsonicM != null ? chip(t('transsonic'), dispDist(res.transsonicM) + ' ' + distUnit()) : '') +
        (res.subsonicM != null ? chip(t('subsonic'), dispDist(res.subsonicM) + ' ' + distUnit()) : '') +
        '</div>';
    }

    var riflemanHtml = '';
    var angle = num(state.env.shotAngleDeg);
    if (angle != null && Math.abs(angle) > 0.5) {
      var rows = '';
      grid.forEach(function (d) {
        if (d % 50 !== 0) return;
        var eq = B.riflemanEquivalentRangeM(d, angle);
        rows += '<tr><td class="num">' + dispDist(d) + '</td><td class="num">' + dispDist(eq, 0) + '</td></tr>';
      });
      riflemanHtml = '<div class="table-block"><h4>' + esc(t('rifleman')) + ' · ' + fmt(angle, 0) + '°</h4>' +
        '<p class="hint">' + esc(t('riflemanHint')) + '</p>' +
        '<div class="table-scroll"><table class="data-table"><thead><tr><th>' + esc(t('slant')) + ' (' + distUnit() + ')</th>' +
        '<th>' + esc(t('horizontal')) + ' (' + distUnit() + ')</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    }

    var sourceHtml = '';
    if (e.sourceNote || e.sourceUrl) {
      sourceHtml = '<p class="hint">' + esc(t('sourceNote')) + ': ' + esc(e.sourceNote || '') +
        (e.sourceUrl ? ' · <a href="' + esc(e.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Link</a>' : '') + '</p>';
    }

    return '<article class="card result-card">' +
      '<header class="result-head"><div><span class="result-label">' + esc(label) + '</span>' +
      '<h3>' + esc(sel.caliber) + ' · ' + esc(e.n) + '</h3><div class="badges">' + badges + '</div></div>' +
      '<button class="btn btn-ghost" data-action="edit-loading" data-type="' + sel.type + '" data-caliber="' + esc(sel.caliber) + '" data-name="' + esc(e.n) + '">' + esc(t('editLoading')) + '</button></header>' +
      notices + '<div class="chips">' + chips + '</div>' + atmoHtml +
      '<div class="tables-duo">' + computedHtml + referenceHtml + '</div>' +
      riflemanHtml + sourceHtml + '</article>';
  }

  function chip(label, value) {
    return '<span class="chip"><span class="chip-label">' + esc(label) + '</span><span class="chip-value">' + esc(value) + '</span></span>';
  }

  /* --------------------------------------------------------------------------
   * Shell und Rendering
   * ------------------------------------------------------------------------*/
  var root = null;

  function buildShell() {
   root.innerHTML =
    '<header class="topbar">' +
      '<div class="brand"><span class="brand-mark">◎</span><div><h1>' + esc(t('appTitle')) + '</h1><span class="tagline">' + esc(t('tagline')) + '</span></div></div>' +
      // Quick-Toggles wurden entfernt und in die Einstellungen integriert
    '</header>' +
    (state.dbOk ? '' : '<div class="db-error" role="alert">' + esc(t('dbError')) + '</div>') +
    '<main class="main">' +
      '<section class="section" id="sec-calc"></section>' +
      '<section class="section" id="sec-profiles"></section>' +
      '<section class="section" id="sec-log"></section>' +
      '<section class="section" id="sec-settings"></section>' +
    '</main>' +
    '<div class="disclaimer-bar"><span>' + esc(t('disclaimer')) + '</span></div>' +
    '<nav class="bottomnav">' +
      navBtn('calc', '⌖', t('navCalc')) + navBtn('profiles', '🗂', t('navProfiles')) +
      navBtn('log', '✎', t('navLog')) + navBtn('settings', '⚙', t('navSettings')) +
    '</nav>' +
    '<div id="modal-root"></div><div id="toast-root" aria-live="polite"></div>' +
    '<input type="file" id="import-file" accept="application/json,.json" hidden>';
  renderCalcSection();
  renderProfiles();
  renderLogbook();
  renderSettings();
  showSection(state.section);
}

  function navBtn(sec, icon, label) {
    return '<button class="nav-btn' + (state.section === sec ? ' active' : '') + '" data-action="nav" data-section="' + sec + '">' +
      '<span class="nav-icon">' + icon + '</span><span>' + esc(label) + '</span></button>';
  }

  function showSection(sec) {
    state.section = sec;
    ['calc', 'profiles', 'log', 'settings'].forEach(function (s) {
      var el = document.getElementById('sec-' + s);
      if (el) el.classList.toggle('visible', s === sec);
    });
    root.querySelectorAll('.nav-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-section') === sec);
    });
    window.scrollTo(0, 0);
  }

  function selectHtml(field, options, selected, extra) {
    var h = '<select class="input" data-field="' + field + '"' + (extra || '') + '>';
    options.forEach(function (o) {
      h += '<option value="' + esc(o.value) + '"' + (String(o.value) === String(selected) ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    });
    return h + '</select>';
  }

  function fieldHtml(label, field, value, opts) {
    opts = opts || {};
    var info = opts.topic ? '<button class="info-btn" data-action="lexicon" data-topic="' + opts.topic + '" title="Info">ⓘ</button>' : '';
    return '<label class="field"><span class="field-label">' + esc(label) + info + '</span>' +
      '<input class="input" type="number" inputmode="decimal" step="' + (opts.step || 'any') + '"' +
      (opts.min != null ? ' min="' + opts.min + '"' : '') + (opts.max != null ? ' max="' + opts.max + '"' : '') +
      ' data-field="' + field + '" value="' + inputValue(value) + '" placeholder="' + (opts.placeholder || '–') + '"></label>';
  }

  function toggleHtml(label, field, checked, topic) {
    var info = topic ? '<button class="info-btn" data-action="lexicon" data-topic="' + topic + '" title="Info">ⓘ</button>' : '';
    return '<label class="toggle-row"><span class="field-label">' + esc(label) + info + '</span>' +
      '<span class="switch"><input type="checkbox" data-field="' + field + '"' + (checked ? ' checked' : '') + '><span class="slider"></span></span></label>';
  }

  /* Rechner-Sektion: Munitionswahl, Umgebung, Setup, Ergebnisse. */
  function renderCalcSection() {
    var sec = document.getElementById('sec-calc');
    if (!sec) return;
    if (!state.dbOk) {
      sec.innerHTML = '<div class="card"><div class="notice notice-warn">' + esc(t('dbError')) + '</div>' +
        '<p class="hint">' + esc(t('noDb')) + '</p></div>';
      return;
    }
    sec.innerHTML =
      '<div class="card ammo-panel">' +
        '<div class="segmented" role="tablist">' +
          '<button class="seg-btn' + (state.weaponType === 'long' ? ' active' : '') + '" data-action="weapon-type" data-type="long">' + esc(t('tabLong')) + '</button>' +
          '<button class="seg-btn' + (state.weaponType === 'short' ? ' active' : '') + '" data-action="weapon-type" data-type="short">' + esc(t('tabShort')) + '</button>' +
        '</div>' +
        '<div class="ammo-selects" id="ammo-selects"></div>' +
        '<div class="compare-row">' + toggleHtml(t('compare'), 'compareOn', state.compareOn) + '</div>' +
        '<div id="compare-selects"></div>' +
      '</div>' +
      '<div class="card env-panel"><h3>' + esc(t('env')) + '</h3>' +
        '<div class="field-grid">' +
          fieldHtml(t('temperature'), 'env.tempC', state.env.tempC, { step: '0.5' }) +
          fieldHtml(t('pressure'), 'env.pressureHpa', state.env.pressureHpa, { step: '0.5', topic: 'densityalt' }) +
          fieldHtml(t('humidity'), 'env.humidityPct', state.env.humidityPct, { step: '1', min: 0, max: 100 }) +
          fieldHtml(t('altitude'), 'env.altitudeM', state.env.altitudeM, { step: '10' }) +
          '<label class="field"><span class="field-label">' + esc(t('windSpeed')) + '</span>' +
            '<div class="input-pair"><input class="input" type="number" inputmode="decimal" step="0.5" min="0" data-field="env.windSpeed" value="' + inputValue(windDisplay()) + '">' +
            selectHtml('env.windUnit', [{ value: 'ms', label: 'm/s' }, { value: 'kmh', label: 'km/h' }], state.env.windUnit) + '</div></label>' +
          '<label class="field"><span class="field-label">' + esc(t('windDir')) + ' <b id="wind-angle-val">' + fmt(num(state.env.windAngleDeg) || 0, 0) + '°</b></span>' +
            '<input class="range" type="range" min="0" max="360" step="5" data-field="env.windAngleDeg" value="' + (num(state.env.windAngleDeg) || 0) + '">' +
            '<span class="hint">' + esc(t('windDirHint')) + '</span></label>' +
          fieldHtml(t('shotAngle'), 'env.shotAngleDeg', state.env.shotAngleDeg, { step: '1', min: -60, max: 60, topic: 'zero' }) +
        '</div>' +
         '<span class="grid-note">' + esc(t('windDirHint')) + '</span>' +
         '<div class="geo-row">' +
          '<button class="btn" data-action="gps">📍 ' + esc(t('gps')) + '</button>' +
          selectHtml('city', [{ value: '', label: t('chooseCity') }].concat(CITIES.map(function (c, i) {
            return { value: i, label: c.n + ' (' + c.c + ')' };
          })), '', ' id="city-select"') +
          '<button class="btn" data-action="weather">☁ ' + esc(t('fetchWeather')) + '</button>' +
          '<button class="btn" data-action="sensor"' + (state.sensorRunning ? ' disabled' : '') + '>🧭 ' + esc(state.sensorRunning ? t('sensorRunning') : t('sensorSnapshot')) + '</button>' +
        '</div>' +
        '<div id="weather-card"></div><div id="sensor-card"></div>' +
      '</div>' +
      '<div class="card shot-panel"><h3>' + esc(t('shotSetup')) + '</h3>' +
        '<div class="field-grid">' +
          fieldHtml(t('zero') + ' (' + distUnit() + ')', 'shot.zeroDisplay', zeroDisplay(), { step: '5', min: 5, topic: 'zero', placeholder: String(defaultZero(state.weaponType)) }) +
          fieldHtml(t('sightHeight'), 'shot.sightHeightCm', state.shot.sightHeightCm, { step: '0.5', min: 0, placeholder: String(defaultSight(state.weaponType)) }) +
          '<label class="field"><span class="field-label">' + esc(t('clickUnit')) + '</span>' +
            selectHtml('shot.clickUnit', [{ value: 'mil01', label: '0.1 MIL' }, { value: 'moa25', label: '¼ MOA' }], state.shot.clickUnit) + '</label>' +
          '<label class="field"><span class="field-label">' + esc(t('dragModel')) + '<button class="info-btn" data-action="lexicon" data-topic="bc" title="Info">ⓘ</button></span>' +
            selectHtml('shot.dragModel', [{ value: 'G1', label: 'G1' }, { value: 'G7', label: 'G7' }], state.shot.dragModel) + '</label>' +
          fieldHtml(t('latitude'), 'env.latitudeDeg', state.env.latitudeDeg, { step: '0.1', min: -90, max: 90, topic: 'coriolis' }) +
          fieldHtml(t('azimuth'), 'env.azimuthDeg', state.env.azimuthDeg, { step: '5', min: 0, max: 360, topic: 'eotvos' }) +
        '</div>' +
        '<div class="toggle-grid">' +
          toggleHtml(t('coriolis'), 'env.enableCoriolis', state.env.enableCoriolis, 'coriolis') +
          toggleHtml(t('spinDrift'), 'env.enableSpinDrift', state.env.enableSpinDrift, 'spindrift') +
          (state.weaponType === 'long' ? toggleHtml(t('extendedRange'), 'shot.extended', state.shot.extended) : '') +
          (state.weaponType === 'short' ? toggleHtml(t('show25'), 'shot.show25', state.shot.show25) : '') +
        '</div>' +
      '</div>' +
      '<div id="results" class="results"></div>';
    renderAmmoSelects();
    renderCompareSelects();
    renderWeatherCard();
    renderSensorCard();
    renderResults();
  }

  function windDisplay() {
    var ms = num(state.env.windSpeedMs);
    if (ms === null) return null;
    return state.env.windUnit === 'kmh' ? Math.round(ms * 3.6 * 100) / 100 : ms;
  }
  function zeroDisplay() {
    var z = state.shot.zeroM;
    if (z === null) return null;
    return isImp() ? Math.round(B.convert.mToYd(z) * 10) / 10 : z;
  }

  function renderAmmoSelects() {
    var box = document.getElementById('ammo-selects');
    if (!box || !state.dbOk) return;
    var type = state.weaponType;
    var sel = resolveSelection(type, state.sel[type]);
    var cals = calibersOf(type);
    var loadings = sel ? sel.list : [];
    box.innerHTML =
      '<label class="field"><span class="field-label">' + esc(t('caliber')) + '</span>' +
      selectHtml('ammo.caliber', cals.map(function (c) { return { value: c, label: c }; }), sel ? sel.caliber : '') + '</label>' +
      '<label class="field"><span class="field-label">' + esc(t('loading')) + '</span>' +
      selectHtml('ammo.loading', loadings.map(function (l, i) {
        var label = l.entry.n + (l.entry.generic === true ? ' · ' + t('genericBadge') : '') + (l.overridden ? ' · ' + t('overrideActive') : '');
        return { value: i, label: label };
      }), sel ? sel.index : 0) + '</label>';
  }

  function renderCompareSelects() {
    var box = document.getElementById('compare-selects');
    if (!box || !state.dbOk) return;
    if (!state.compareOn) { box.innerHTML = ''; return; }
    var sel = resolveSelection(state.cmp.type, state.cmp);
    var cals = calibersOf(state.cmp.type);
    box.innerHTML = '<div class="compare-box"><span class="field-label">' + esc(t('compareWith')) + '</span>' +
      selectHtml('cmp.type', [{ value: 'long', label: t('tabLong') }, { value: 'short', label: t('tabShort') }], state.cmp.type) +
      selectHtml('cmp.caliber', cals.map(function (c) { return { value: c, label: c }; }), sel ? sel.caliber : '') +
      selectHtml('cmp.loading', (sel ? sel.list : []).map(function (l, i) {
        return { value: i, label: l.entry.n + (l.entry.generic === true ? ' · ' + t('genericBadge') : '') };
      }), sel ? sel.index : 0) + '</div>';
  }

  function renderResults() {
    var box = document.getElementById('results');
    if (!box) return;
    if (!state.dbOk) { box.innerHTML = ''; return; }
    var selA = resolveSelection(state.weaponType, state.sel[state.weaponType]);
    var html = resultCard(calcFor(selA), 'A');
    if (state.compareOn) {
      var selB = resolveSelection(state.cmp.type, state.cmp);
      html += resultCard(calcFor(selB), 'B');
    }
    box.innerHTML = '<div class="results-grid' + (state.compareOn ? ' two' : '') + '">' + html + '</div>';
  }

  function renderWeatherCard() {
    var box = document.getElementById('weather-card');
    if (!box) return;
    var w = state.lastWeather;
    if (!w) { box.innerHTML = state.env.locationName ? '<p class="hint">📍 ' + esc(state.env.locationName) + '</p>' : ''; return; }
    box.innerHTML = '<div class="mini-card"><strong>' + esc(t('weatherAt')) + ' ' + esc(w.location || '') + ' · ' + esc(w.time || '') + '</strong>' +
      '<div class="chips">' + chip('°C', fmt(w.tempC, 1)) + chip('hPa', fmt(w.pressureHpa, 1)) +
      chip('%', fmt(w.humidityPct, 0)) + chip(t('windFrom'), fmt(w.windDirDeg, 0) + '° · ' + fmt(w.windSpeedMs, 1) + ' m/s') + '</div></div>';
  }

  function renderSensorCard() {
    var box = document.getElementById('sensor-card');
    if (!box) return;
    var s = state.sensor;
    if (!s) { box.innerHTML = ''; return; }
    var cls = s.spreadDeg < 3 ? 'green' : (s.spreadDeg < 8 ? 'yellow' : 'red');
    box.innerHTML = '<div class="mini-card sensor-card"><span class="sensor-dot ' + cls + '"></span>' +
      '<span>' + esc(t('sensorHeading')) + ': <b>' + fmt(s.headingDeg, 1) + '°</b> · ' + esc(t('sensorSpread')) + ': <b>' + fmt(s.spreadDeg, 1) + '°</b></span>' +
      '<button class="btn btn-small" data-action="apply-azimuth">' + esc(t('applyAzimuth')) + '</button></div>';
  }

  /* Profile */
  function renderProfiles() {
    var sec = document.getElementById('sec-profiles');
    if (!sec) return;
    var cards = state.profiles.map(function (p) {
      var mm = p.barrelIn != null ? p.barrelIn * 25.4 : null;
      return '<article class="card profile-card' + (p.id === state.activeProfileId ? ' active-profile' : '') + '">' +
        '<header><h3>' + esc(p.name) + '</h3>' + (p.id === state.activeProfileId ? '<span class="badge badge-accent">' + esc(t('activeProfile')) + '</span>' : '') + '</header>' +
        '<div class="chips">' + chip(t('weaponType'), p.type === 'short' ? t('tabShort') : t('tabLong')) +
        chip(t('caliber'), p.caliber || '–') + chip(t('barrelIn'), fmt(p.barrelIn, 1) + ' in · ' + fmt(mm, 0) + ' mm') +
        chip(t('twist'), p.twistIn != null ? fmt(p.twistIn, 1) : '–') +
        chip(t('zero'), p.zeroM != null ? dispDist(p.zeroM) + ' ' + distUnit() : '–') + '</div>' +
        '<div class="btn-row">' +
        '<button class="btn" data-action="apply-profile" data-id="' + p.id + '">' + esc(t('applyProfile')) + '</button>' +
        '<button class="btn btn-ghost" data-action="edit-profile" data-id="' + p.id + '">' + esc(t('edit')) + '</button>' +
        '<button class="btn btn-danger" data-action="delete-profile" data-id="' + p.id + '">' + esc(t('delete')) + '</button>' +
        '</div></article>';
    }).join('');
    sec.innerHTML = '<div class="section-head"><h2>' + esc(t('profiles')) + '</h2>' +
      '<button class="btn btn-primary" data-action="new-profile">＋ ' + esc(t('newProfile')) + '</button></div>' +
      (cards || '<div class="card"><p class="hint">' + esc(t('noProfiles')) + '</p></div>');
  }

  /* Logbuch */
  function renderLogbook() {
    var sec = document.getElementById('sec-log');
    if (!sec) return;
    var rows = state.logbook.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); })
      .map(function (e) {
        return '<article class="card log-card"><header><h3>' + esc(e.date || '–') + ' · ' + esc(e.weapon || '–') + '</h3>' +
          '<div class="btn-row">' +
          '<button class="btn btn-ghost btn-small" data-action="edit-log" data-id="' + e.id + '">' + esc(t('edit')) + '</button>' +
          '<button class="btn btn-danger btn-small" data-action="delete-log" data-id="' + e.id + '">' + esc(t('delete')) + '</button></div></header>' +
          '<div class="chips">' + chip(t('ammo'), e.ammo || '–') +
          chip(t('distance'), e.distanceM != null ? dispDist(e.distanceM) + ' ' + distUnit() : '–') +
          chip(t('groupSize'), e.groupCm != null ? dispLen(e.groupCm) + ' ' + lenUnit() : '–') + '</div>' +
          (e.weather ? '<p class="hint">☁ ' + esc(e.weather) + '</p>' : '') +
          (e.note ? '<p class="log-note">' + esc(e.note) + '</p>' : '') + '</article>';
      }).join('');
    sec.innerHTML = '<div class="section-head"><h2>' + esc(t('logbook')) + '</h2>' +
      '<button class="btn btn-primary" data-action="new-log">＋ ' + esc(t('newEntry')) + '</button></div>' +
      (rows || '<div class="card"><p class="hint">' + esc(t('noEntries')) + '</p></div>');
  }

  /* Einstellungen */
  function renderSettings() {
    var sec = document.getElementById('sec-settings');
    if (!sec) return;
    var vl = typeof window.AMMO_DB_VERSION_LONG === 'string' ? window.AMMO_DB_VERSION_LONG : '–';
    var vs = typeof window.AMMO_DB_VERSION_SHORT === 'string' ? window.AMMO_DB_VERSION_SHORT : '–';
    var stub = vl.indexOf('stub') === 0 || vs.indexOf('stub') === 0;
    var testHtml = '';
    if (state.selfTest) {
      testHtml = state.selfTest.results.map(function (r) {
        var checks = r.checks.map(function (c) {
          return '<li class="' + (c.ok ? 'ok' : 'fail') + '">' + esc(c.label) + ': <b>' + fmt(c.value, 3) + ' ' + esc(c.unit) + '</b>' +
            ' <span class="hint">[' + fmt(c.expectedMin, 2) + ' … ' + fmt(c.expectedMax, 2) + ']</span></li>';
        }).join('');
        return '<div class="test-case"><span class="badge ' + (r.passed ? 'badge-ok' : 'badge-warn') + '">' +
          esc(r.passed ? t('testPassed') : t('testFailed')) + '</span> <b>' + esc(r.name) + '</b><ul>' + checks + '</ul></div>';
      }).join('');
    }
    sec.innerHTML =
        '<div class="card"><h3>' + esc(t('language')) + ' · ' + esc(t('units')) + ' · ' + esc(t('theme')) + ' · ' + esc(t('view')) + '</h3>' +
        '<div class="field-grid">' +
        '<label class="field"><span class="field-label">' + esc(t('language')) + '</span>' +
          selectHtml('set.lang', [{ value: 'de', label: 'Deutsch' }, { value: 'en', label: 'English' }], state.lang) + '</label>' +
        '<label class="field"><span class="field-label">' + esc(t('units')) + '</span>' +
          selectHtml('set.units', [{ value: 'metric', label: t('metric') }, { value: 'imperial', label: t('imperial') }], state.units) + '</label>' +
        '<label class="field"><span class="field-label">' + esc(t('theme')) + '</span>' +
          selectHtml('set.theme', [{ value: 'dark', label: t('dark') }, { value: 'light', label: t('light') }], state.theme) + '</label>' +
        '<label class="field"><span class="field-label">' + esc(t('view')) + '</span>' +
          selectHtml('set.view', [{ value: 'full', label: t('viewFull') }, { value: 'compact', label: t('viewCompact') }], state.view) + '</label>' +
        '</div></div>' +
      '<div class="card"><h3>' + esc(t('dbVersions')) + '</h3>' +
        '<div class="chips">' + chip(t('dbLong'), vl) + chip(t('dbShort'), vs) + '</div>' +
        (stub ? '<div class="notice notice-warn">' + esc(t('stubWarning')) + '</div>' : '') +
        (!state.dbOk ? '<div class="notice notice-warn">' + esc(t('dbError')) + '</div>' : '') + '</div>' +
      '<div class="card"><h3>' + esc(t('selfTest')) + '</h3>' + (testHtml || '<p class="hint">…</p>') + '</div>' +
      '<div class="card"><h3>' + esc(t('dataManagement')) + '</h3><div class="btn-row wrap">' +
        '<button class="btn" data-action="export" data-what="profiles">⬇ ' + esc(t('exportProfiles')) + '</button>' +
        '<button class="btn" data-action="export" data-what="overrides">⬇ ' + esc(t('exportOverrides')) + '</button>' +
        '<button class="btn" data-action="export" data-what="logbook">⬇ ' + esc(t('exportLogbook')) + '</button>' +
        '<button class="btn" data-action="export" data-what="all">⬇ ' + esc(t('exportAll')) + '</button>' +
        '<button class="btn btn-primary" data-action="import">⬆ ' + esc(t('importData')) + '</button>' +
        '<button class="btn btn-danger" data-action="reset-all">🗑 ' + esc(t('resetAll')) + '</button>' +
      '</div></div>' +
      '<div class="card"><p class="hint">' + esc(t('disclaimer')) + '</p></div>';
  }

  /* --------------------------------------------------------------------------
   * Modals: Lexikon, Laborierungs-Editor, Profil, Logbuch
   * ------------------------------------------------------------------------*/
  function openModal(html) {
    var mr = document.getElementById('modal-root');
    mr.innerHTML = '<div class="modal-overlay" data-action="modal-close"><div class="modal" role="dialog" aria-modal="true">' +
      '<button class="modal-x" data-action="modal-close" aria-label="' + esc(t('close')) + '">✕</button>' + html + '</div></div>';
  }
  function closeModal() {
    var mr = document.getElementById('modal-root');
    if (mr) mr.innerHTML = '';
  }

  function openLexicon(topic) {
    var keys = Object.keys(LEXICON);
    var tabs = keys.map(function (k) {
      return '<button class="seg-btn' + (k === topic ? ' active' : '') + '" data-action="lexicon" data-topic="' + k + '">' + esc(LEXICON[k].title[state.lang === 'en' ? 1 : 0]) + '</button>';
    }).join('');
    var e = LEXICON[topic] || LEXICON.bc;
    var li = state.lang === 'en' ? 1 : 0;
    openModal('<h2>' + esc(t('lexicon')) + '</h2><div class="segmented lex-tabs">' + tabs + '</div>' +
      '<h3>' + esc(e.title[li]) + '</h3><p>' + esc(e.body[li]) + '</p>' +
      '<p><a class="wiki-link" href="' + esc(e.wiki[li]) + '" target="_blank" rel="noopener noreferrer">Wikipedia ↗</a></p>');
  }

  /* Laborierungs-Editor: Overrides über der Basis-DB, Standardgewicht als Vorbelegung. */
  function openLoadingEditor(type, caliber, name) {
    var list = loadingsOf(type, caliber);
    var item = null;
    for (var i = 0; i < list.length; i++) if (list[i].entry.n === name) item = list[i];
    if (!item) return;
    var e = item.entry;
    var base = dbOf(type)[caliber][item.baseIndex];
    var meta = (metaOf(type) || {})[caliber] || {};
    var weightPrefill = e.g != null ? e.g : (meta.standardWeight != null ? meta.standardWeight : null);
    var refRows = '';
    if (base.ref && Array.isArray(base.ref.distances)) {
      base.ref.distances.forEach(function (d, idx) {
        refRows += '<tr><td class="num">' + d + ' m</td>' +
          '<td><input class="input" type="number" step="any" data-field="ov.refV.' + idx + '" value="' + inputValue(e.ref.v ? e.ref.v[idx] : null) + '"></td>' +
          '<td><input class="input" type="number" step="any" data-field="ov.refE.' + idx + '" value="' + inputValue(e.ref.e ? e.ref.e[idx] : null) + '"></td></tr>';
      });
    }
    var dropRows = '';
    if (base.dropCm && Array.isArray(base.dropCm.distances)) {
      base.dropCm.distances.forEach(function (d, idx) {
        dropRows += '<tr><td class="num">' + d + ' m</td>' +
          '<td><input class="input" type="number" step="any" data-field="ov.drop.' + idx + '" value="' + inputValue(e.dropCm.values ? e.dropCm.values[idx] : null) + '"></td></tr>';
      });
    }
    openModal('<h2>' + esc(t('loadingEditor')) + '</h2>' +
      '<h3>' + esc(caliber) + ' · ' + esc(name) + '</h3>' +
      '<p class="hint">' + esc(t('editorHint')) + '</p>' +
      '<div class="field-grid">' +
        fieldHtml(t('bcG1'), 'ov.bcG1', e.bcG1, { step: '0.001', topic: 'bc' }) +
        fieldHtml(t('bcG7'), 'ov.bcG7', e.bcG7, { step: '0.001' }) +
        fieldHtml(t('v0'), 'ov.v0', e.v0, { step: '1' }) +
        fieldHtml(t('barrelDb'), 'ov.barrelMm', e.barrelMm, { step: '1' }) +
        fieldHtml(t('weight') + (e.g == null && meta.standardWeight != null ? ' · ' + t('prefillWeight') : ''), 'ov.g', weightPrefill, { step: '1' }) +
      '</div>' +
      (refRows ? '<h4>' + esc(t('refValues')) + '</h4><div class="table-scroll"><table class="data-table"><thead><tr><th>m</th><th>' + esc(t('velocity')) + ' (m/s)</th><th>' + esc(t('energy')) + ' (J)</th></tr></thead><tbody>' + refRows + '</tbody></table></div>' : '') +
      (dropRows ? '<h4>' + esc(t('dropValues')) + '</h4><div class="table-scroll"><table class="data-table"><thead><tr><th>m</th><th>cm</th></tr></thead><tbody>' + dropRows + '</tbody></table></div>' : '') +
      '<div class="btn-row"><button class="btn btn-primary" data-action="save-override" data-type="' + type + '" data-caliber="' + esc(caliber) + '" data-name="' + esc(name) + '">' + esc(t('saveOverride')) + '</button>' +
      (item.overridden ? '<button class="btn btn-danger" data-action="reset-override" data-type="' + type + '" data-caliber="' + esc(caliber) + '" data-name="' + esc(name) + '">' + esc(t('resetOverride')) + '</button>' : '') +
      '<button class="btn btn-ghost" data-action="modal-close">' + esc(t('cancel')) + '</button></div>');
  }

  function collectModalFields(prefix) {
    var out = {};
    document.querySelectorAll('#modal-root [data-field^="' + prefix + '"]').forEach(function (el) {
      out[el.getAttribute('data-field').slice(prefix.length)] = el.value;
    });
    return out;
  }

  function saveOverride(type, caliber, name) {
    var raw = collectModalFields('ov.');
    var fields = { bcG1: num(raw.bcG1), bcG7: num(raw.bcG7), v0: num(raw.v0), barrelMm: num(raw.barrelMm), g: num(raw.g) };
    var refV = [], refE = [], drop = [];
    Object.keys(raw).forEach(function (k) {
      var m = k.match(/^refV\.(\d+)$/); if (m) refV[+m[1]] = num(raw[k]);
      m = k.match(/^refE\.(\d+)$/); if (m) refE[+m[1]] = num(raw[k]);
      m = k.match(/^drop\.(\d+)$/); if (m) drop[+m[1]] = num(raw[k]);
    });
    state.overrides[overrideKey(type, caliber, name)] = { fields: fields, refV: refV, refE: refE, drop: drop };
    saveEnvelope(APP_ID + '.overrides', state.overrides);
    closeModal();
    renderAmmoSelects(); renderCompareSelects(); renderResults();
    toast(t('overrideSaved'));
  }

  /* Profil-Modal */
  function openProfileModal(id) {
    var p = null;
    if (id) for (var i = 0; i < state.profiles.length; i++) if (state.profiles[i].id === id) p = state.profiles[i];
    var isNew = !p;
    if (isNew) p = { id: uid(), name: '', type: state.weaponType, caliber: state.sel[state.weaponType].caliber, barrelIn: null, twistIn: null, zeroM: null, sightHeightCm: null };
    var cals = calibersOf(p.type);
    openModal('<h2>' + esc(isNew ? t('newProfile') : t('edit')) + '</h2>' +
      '<div class="field-grid">' +
      '<label class="field"><span class="field-label">' + esc(t('profileName')) + '</span><input class="input" type="text" data-field="pf.name" value="' + esc(p.name) + '"></label>' +
      '<label class="field"><span class="field-label">' + esc(t('weaponType')) + '</span>' +
        selectHtml('pf.type', [{ value: 'long', label: t('tabLong') }, { value: 'short', label: t('tabShort') }], p.type) + '</label>' +
      '<label class="field"><span class="field-label">' + esc(t('caliber')) + '</span>' +
        selectHtml('pf.caliber', cals.map(function (c) { return { value: c, label: c }; }), p.caliber) + '</label>' +
      fieldHtml(t('barrelIn'), 'pf.barrelIn', p.barrelIn, { step: '0.5', min: 0 }) +
      fieldHtml(t('twist'), 'pf.twistIn', p.twistIn, { step: '0.5' }) +
      fieldHtml(t('zero') + ' (m)', 'pf.zeroM', p.zeroM, { step: '5', min: 5, placeholder: String(defaultZero(p.type)) }) +
      fieldHtml(t('sightHeight'), 'pf.sightHeightCm', p.sightHeightCm, { step: '0.5', min: 0 }) +
      '</div><p class="hint">' + esc(t('barrelMmHint')) + (p.barrelIn != null ? fmt(p.barrelIn * 25.4, 0) + ' mm' : '–') + '</p>' +
      '<div class="btn-row"><button class="btn btn-primary" data-action="save-profile" data-id="' + p.id + '" data-new="' + (isNew ? '1' : '0') + '">' + esc(t('saveProfile')) + '</button>' +
      '<button class="btn btn-ghost" data-action="modal-close">' + esc(t('cancel')) + '</button></div>');
  }

  function saveProfile(id, isNew) {
    var raw = collectModalFields('pf.');
    var p = {
      id: id, name: (raw.name || '').trim() || t('newProfile'),
      type: raw.type === 'short' ? 'short' : 'long',
      caliber: raw.caliber || null,
      barrelIn: num(raw.barrelIn), twistIn: num(raw.twistIn),
      zeroM: num(raw.zeroM), sightHeightCm: num(raw.sightHeightCm)
    };
    if (isNew === '1') state.profiles.push(p);
    else state.profiles = state.profiles.map(function (q) { return q.id === id ? p : q; });
    saveEnvelope(APP_ID + '.profiles', state.profiles);
    closeModal(); renderProfiles(); renderResults();
    toast(t('profileSaved'));
  }

  /* Logbuch-Modal */
  function openLogModal(id) {
    var e = null;
    if (id) for (var i = 0; i < state.logbook.length; i++) if (state.logbook[i].id === id) e = state.logbook[i];
    var isNew = !e;
    var profile = activeProfile();
    var selA = state.dbOk ? resolveSelection(state.weaponType, state.sel[state.weaponType]) : null;
    if (isNew) e = {
      id: uid(), date: new Date().toISOString().slice(0, 10),
      weapon: profile ? profile.name : '', ammo: selA ? selA.caliber + ' · ' + selA.entry.n : '',
      distanceM: null, groupCm: null, weather: '', note: ''
    };
    openModal('<h2>' + esc(isNew ? t('newEntry') : t('edit')) + '</h2>' +
      '<div class="field-grid">' +
      '<label class="field"><span class="field-label">' + esc(t('date')) + '</span><input class="input" type="date" data-field="lb.date" value="' + esc(e.date) + '"></label>' +
      '<label class="field"><span class="field-label">' + esc(t('weapon')) + '</span><input class="input" type="text" data-field="lb.weapon" value="' + esc(e.weapon) + '"></label>' +
      '<label class="field"><span class="field-label">' + esc(t('ammo')) + '</span><input class="input" type="text" data-field="lb.ammo" value="' + esc(e.ammo) + '"></label>' +
      fieldHtml(t('distance') + ' (m)', 'lb.distanceM', e.distanceM, { step: '5', min: 0 }) +
      fieldHtml(t('groupSize') + ' (cm)', 'lb.groupCm', e.groupCm, { step: '0.1', min: 0 }) +
      '<label class="field wide"><span class="field-label">' + esc(t('weather')) + '</span><input class="input" type="text" data-field="lb.weather" value="' + esc(e.weather) + '">' +
      '<button class="btn btn-small" data-action="log-use-weather">☁ ' + esc(t('useWeather')) + '</button></label>' +
      '<label class="field wide"><span class="field-label">' + esc(t('note')) + '</span><textarea class="input" rows="3" data-field="lb.note">' + esc(e.note) + '</textarea></label>' +
      '</div>' +
      '<div class="btn-row"><button class="btn btn-primary" data-action="save-log" data-id="' + e.id + '" data-new="' + (isNew ? '1' : '0') + '">' + esc(t('saveEntry')) + '</button>' +
      '<button class="btn btn-ghost" data-action="modal-close">' + esc(t('cancel')) + '</button></div>');
  }

  function saveLog(id, isNew) {
    var raw = collectModalFields('lb.');
    var e = {
      id: id, date: raw.date || null, weapon: raw.weapon || '', ammo: raw.ammo || '',
      distanceM: num(raw.distanceM), groupCm: num(raw.groupCm),
      weather: raw.weather || '', note: raw.note || ''
    };
    if (isNew === '1') state.logbook.unshift(e);
    else state.logbook = state.logbook.map(function (q) { return q.id === id ? e : q; });
    saveEnvelope(APP_ID + '.logbook', state.logbook);
    closeModal(); renderLogbook();
    toast(t('entrySaved'));
  }

  /* --------------------------------------------------------------------------
   * Toasts mit Undo-Aktion
   * ------------------------------------------------------------------------*/
  var toastActions = {};
  function toast(msg, actionLabel, onAction) {
    var id = uid();
    var tr = document.getElementById('toast-root');
    if (!tr) return;
    var div = document.createElement('div');
    div.className = 'toast';
    div.setAttribute('data-toast', id);
    div.innerHTML = '<span>' + esc(msg) + '</span>' +
      (actionLabel ? '<button class="btn btn-small" data-action="toast-action" data-id="' + id + '">' + esc(actionLabel) + '</button>' : '');
    tr.appendChild(div);
    if (onAction) toastActions[id] = onAction;
    setTimeout(function () {
      div.classList.add('out');
      setTimeout(function () { div.remove(); delete toastActions[id]; }, 350);
    }, actionLabel ? 8000 : 3500);
  }

  /* --------------------------------------------------------------------------
   * GPS, Wetter (Open-Meteo, nie gecacht), Kompass-Snapshot
   * ------------------------------------------------------------------------*/
  function requestGps() {
    if (!navigator.geolocation) { toast(t('gpsError')); return; }
    try {
      navigator.geolocation.getCurrentPosition(function (pos) {
        state.env.latitudeDeg = Math.round(pos.coords.latitude * 1000) / 1000;
        state.env.altitudeM = pos.coords.altitude != null ? Math.round(pos.coords.altitude) : state.env.altitudeM;
        state.env.locationName = 'GPS ' + pos.coords.latitude.toFixed(3) + ', ' + pos.coords.longitude.toFixed(3);
        var gpsLocationEl = document.getElementById('gps-location');
        if (gpsLocationEl) {
       gpsLocationEl.textContent = state.env.locationName;
       }
      
        
        state.lastWeather = state.lastWeather || null;
        state.gpsLon = pos.coords.longitude;
        persistSettings(); renderCalcSection();
        toast(t('gpsOk'));
      }, function () { toast(t('gpsError')); }, { timeout: 8000, maximumAge: 60000 });
    } catch (e) { toast(t('gpsError')); }
  }

  function applyCity(idx) {
    var c = CITIES[idx];
    if (!c) return;
    state.env.latitudeDeg = c.lat;
    state.env.altitudeM = c.alt;
    state.env.locationName = c.n + ' (' + c.c + ')';
    state.gpsLon = c.lon;
    persistSettings(); renderCalcSection();
  }

  function fetchWeather() {
    var lat = num(state.env.latitudeDeg);
    var lon = num(state.gpsLon);
    if (lat === null || lon === null) { toast(t('gpsError')); return; }
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
      '&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m&wind_speed_unit=ms';
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 10000) : null;
    // Wetter-API wird NIE gecacht: cache 'no-store', Service Worker umgeht sie ebenfalls.
    fetch(url, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
      .then(function (j) {
        if (timer) clearTimeout(timer);
        var c = j && j.current;
        if (!c) throw new Error('data');
        state.env.tempC = num(c.temperature_2m);
        state.env.humidityPct = num(c.relative_humidity_2m);
        state.env.pressureHpa = num(c.surface_pressure);
        state.env.windSpeedMs = num(c.wind_speed_10m) || 0;
        var absDir = num(c.wind_direction_10m);
        if (absDir !== null) {
          state.env.windAngleDeg = Math.round((absDir - (num(state.env.azimuthDeg) || 0) + 360) % 360);
        }
        state.lastWeather = {
          tempC: num(c.temperature_2m), humidityPct: num(c.relative_humidity_2m),
          pressureHpa: num(c.surface_pressure), windSpeedMs: num(c.wind_speed_10m),
          windDirDeg: absDir, location: state.env.locationName || (lat + ',' + lon),
          time: new Date().toLocaleTimeString(state.lang === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' })
        };
        persistSettings(); renderCalcSection();
        toast(t('weatherLoaded'));
      })
      .catch(function () { if (timer) clearTimeout(timer); toast(t('weatherError')); });
  }

  /* Kompass: 5 Messungen in 2 Sekunden, Kreismittelwert, Ampel 3°/8°. */
  var sensorHandler = null, sensorTimer = null;
  function sensorSnapshot() {
    if (state.sensorRunning) return;
    if (typeof DeviceOrientationEvent === 'undefined') { toast(t('sensorNone')); return; }
    function start() {
      state.sensorRunning = true;
      renderCalcSection();
      var latest = null;
      var samples = [];
      sensorHandler = function (ev) {
        var h = null;
        if (typeof ev.webkitCompassHeading === 'number' && isFinite(ev.webkitCompassHeading)) h = ev.webkitCompassHeading;
        else if (ev.alpha != null && isFinite(ev.alpha)) h = (360 - ev.alpha) % 360;
        if (h !== null) latest = h;
      };
      window.addEventListener('deviceorientation', sensorHandler, true);
      var ticks = 0;
      sensorTimer = setInterval(function () {
        ticks++;
        if (latest !== null) samples.push(latest);
        if (ticks >= 5) {
          clearInterval(sensorTimer); sensorTimer = null;
          window.removeEventListener('deviceorientation', sensorHandler, true);
          sensorHandler = null;
          state.sensorRunning = false;
          if (samples.length < 3) { toast(t('sensorNone')); renderCalcSection(); return; }
          var sinSum = 0, cosSum = 0;
          samples.forEach(function (h) { sinSum += Math.sin(h * Math.PI / 180); cosSum += Math.cos(h * Math.PI / 180); });
          var mean = (Math.atan2(sinSum, cosSum) * 180 / Math.PI + 360) % 360;
          var r = Math.sqrt(sinSum * sinSum + cosSum * cosSum) / samples.length;
          var spread = r > 0.999999 ? 0 : Math.sqrt(Math.max(0, -2 * Math.log(Math.max(r, 1e-9)))) * 180 / Math.PI;
          state.sensor = { headingDeg: mean, spreadDeg: spread, at: Date.now() };
          renderCalcSection();
        }
      }, 400);
    }
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(function (res) {
        if (res === 'granted') start(); else toast(t('sensorPermission'));
      }).catch(function () { toast(t('sensorPermission')); });
    } else start();
  }

  /* --------------------------------------------------------------------------
   * Export / Import (Profile, Overrides, Logbuch)
   * ------------------------------------------------------------------------*/
  function exportData(what) {
    var payload = { app: APP_ID, version: STORAGE_VERSION, type: what, exportedAt: new Date().toISOString(), data: null };
    if (what === 'profiles') payload.data = state.profiles;
    else if (what === 'overrides') payload.data = state.overrides;
    else if (what === 'logbook') payload.data = state.logbook;
    else payload.data = { profiles: state.profiles, overrides: state.overrides, logbook: state.logbook };
    try {
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = APP_ID + '-' + what + '-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      toast(t('exportDone'));
    } catch (e) { toast(t('importError')); }
  }

  function importFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var j = JSON.parse(String(reader.result));
        if (!j || j.app !== APP_ID || !j.type) throw new Error('format');
        if (j.type === 'profiles' && Array.isArray(j.data)) {
          state.profiles = j.data.filter(function (p) { return p && p.id && p.name; });
          saveEnvelope(APP_ID + '.profiles', state.profiles);
        } else if (j.type === 'overrides' && j.data && typeof j.data === 'object') {
          state.overrides = j.data;
          saveEnvelope(APP_ID + '.overrides', state.overrides);
        } else if (j.type === 'logbook' && Array.isArray(j.data)) {
          state.logbook = j.data.filter(function (e) { return e && e.id; });
          saveEnvelope(APP_ID + '.logbook', state.logbook);
        } else if (j.type === 'all' && j.data) {
          if (Array.isArray(j.data.profiles)) { state.profiles = j.data.profiles; saveEnvelope(APP_ID + '.profiles', state.profiles); }
          if (j.data.overrides && typeof j.data.overrides === 'object') { state.overrides = j.data.overrides; saveEnvelope(APP_ID + '.overrides', state.overrides); }
          if (Array.isArray(j.data.logbook)) { state.logbook = j.data.logbook; saveEnvelope(APP_ID + '.logbook', state.logbook); }
        } else throw new Error('format');
        renderProfiles(); renderLogbook(); renderAmmoSelects(); renderResults();
        toast(t('importOk'));
      } catch (e) { toast(t('importError')); }
    };
    reader.onerror = function () { toast(t('importError')); };
    reader.readAsText(file);
  }

  /* --------------------------------------------------------------------------
   * Ereignisse (Delegation, keine Listener-Leaks bei Re-Renders)
   * ------------------------------------------------------------------------*/
  function onClick(ev) {
    var el = ev.target.closest('[data-action]');
    if (!el) return;
    var action = el.getAttribute('data-action');
    if (action === 'modal-close' && el.classList.contains('modal-overlay') && ev.target !== el) return;
    switch (action) {
      case 'nav': showSection(el.getAttribute('data-section')); break;
      case 'toggle-theme': state.theme = state.theme === 'dark' ? 'light' : 'dark'; persistSettings(); buildShell(); break;
      case 'toggle-lang': state.lang = state.lang === 'de' ? 'en' : 'de'; persistSettings(); buildShell(); break;
      case 'toggle-units': state.units = isImp() ? 'metric' : 'imperial'; persistSettings(); buildShell(); break;
      case 'toggle-view': state.view = state.view === 'compact' ? 'full' : 'compact'; persistSettings(); buildShell(); break;
      case 'weapon-type': {
        var type = el.getAttribute('data-type');
        if (type !== state.weaponType) {
          state.weaponType = type;
          state.shot.zeroM = null; // Zero-Standard je Typ: 100 m lang, 25 m kurz.
          state.shot.sightHeightCm = null;
          persistSettings(); renderCalcSection();
        }
        break;
      }
      case 'lexicon': openLexicon(el.getAttribute('data-topic') || 'bc'); break;
      case 'modal-close': closeModal(); break;
      case 'edit-loading': openLoadingEditor(el.getAttribute('data-type'), el.getAttribute('data-caliber'), el.getAttribute('data-name')); break;
      case 'save-override': saveOverride(el.getAttribute('data-type'), el.getAttribute('data-caliber'), el.getAttribute('data-name')); break;
      case 'reset-override': {
        delete state.overrides[overrideKey(el.getAttribute('data-type'), el.getAttribute('data-caliber'), el.getAttribute('data-name'))];
        saveEnvelope(APP_ID + '.overrides', state.overrides);
        closeModal(); renderAmmoSelects(); renderCompareSelects(); renderResults();
        toast(t('overrideReset'));
        break;
      }
      case 'new-profile': openProfileModal(null); break;
      case 'edit-profile': openProfileModal(el.getAttribute('data-id')); break;
      case 'save-profile': saveProfile(el.getAttribute('data-id'), el.getAttribute('data-new')); break;
      case 'apply-profile': {
        var p = null;
        state.profiles.forEach(function (q) { if (q.id === el.getAttribute('data-id')) p = q; });
        if (p) {
          state.activeProfileId = p.id;
          state.weaponType = p.type || 'long';
          if (p.caliber) state.sel[state.weaponType].caliber = p.caliber;
          state.shot.zeroM = p.zeroM != null ? p.zeroM : null;
          state.shot.sightHeightCm = p.sightHeightCm != null ? p.sightHeightCm : null;
          persistSettings(); renderCalcSection(); renderProfiles();
          toast(t('profileApplied'));
        }
        break;
      }
      case 'delete-profile': {
        var id = el.getAttribute('data-id');
        var removed = null;
        state.profiles = state.profiles.filter(function (q) { if (q.id === id) { removed = q; return false; } return true; });
        if (state.activeProfileId === id) state.activeProfileId = null;
        saveEnvelope(APP_ID + '.profiles', state.profiles);
        renderProfiles(); renderResults();
        toast(t('profileDeleted'), t('undo'), function () {
          if (removed) { state.profiles.push(removed); saveEnvelope(APP_ID + '.profiles', state.profiles); renderProfiles(); toast(t('restored')); }
        });
        break;
      }
      case 'new-log': openLogModal(null); break;
      case 'edit-log': openLogModal(el.getAttribute('data-id')); break;
      case 'save-log': saveLog(el.getAttribute('data-id'), el.getAttribute('data-new')); break;
      case 'log-use-weather': {
        var w = state.lastWeather;
        var input = document.querySelector('#modal-root [data-field="lb.weather"]');
        if (input && w) input.value = fmt(w.tempC, 1) + ' °C, ' + fmt(w.pressureHpa, 0) + ' hPa, ' + fmt(w.humidityPct, 0) + ' %, ' + t('windFrom') + ' ' + fmt(w.windDirDeg, 0) + '° ' + fmt(w.windSpeedMs, 1) + ' m/s';
        else if (!w) toast(t('weatherError'));
        break;
      }
      case 'delete-log': {
        var lid = el.getAttribute('data-id');
        var gone = null;
        state.logbook = state.logbook.filter(function (q) { if (q.id === lid) { gone = q; return false; } return true; });
        saveEnvelope(APP_ID + '.logbook', state.logbook);
        renderLogbook();
        toast(t('entryDeleted'), t('undo'), function () {
          if (gone) { state.logbook.unshift(gone); saveEnvelope(APP_ID + '.logbook', state.logbook); renderLogbook(); toast(t('restored')); }
        });
        break;
      }
      case 'gps': requestGps(); break;
      case 'weather': fetchWeather(); break;
      case 'sensor': sensorSnapshot(); break;
      case 'apply-azimuth': {
        if (state.sensor) {
          state.env.azimuthDeg = Math.round(state.sensor.headingDeg);
          persistSettings(); renderCalcSection();
        }
        break;
      }
      case 'export': exportData(el.getAttribute('data-what')); break;
      case 'import': document.getElementById('import-file').click(); break;
      case 'reset-all': {
        if (window.confirm(t('resetConfirm'))) {
          ['settings', 'profiles', 'overrides', 'logbook'].forEach(function (k) {
            try { localStorage.removeItem(APP_ID + '.' + k); } catch (e) {}
          });
          toast(t('resetDone'));
          setTimeout(function () { location.reload(); }, 600);
        }
        break;
      }
      case 'toast-action': {
        var fn = toastActions[el.getAttribute('data-id')];
        if (fn) { fn(); delete toastActions[el.getAttribute('data-id')]; }
        var toastEl = el.closest('.toast');
        if (toastEl) toastEl.remove();
        break;
      }
    }
  }

  function onChange(ev) {
    var el = ev.target.closest('[data-field]');
    if (!el) return;
    var field = el.getAttribute('data-field');
    var value = el.type === 'checkbox' ? el.checked : el.value;
    if (field === 'import-file') return;
    if (el.id === 'import-file') return;
    switch (field) {
      case 'ammo.caliber':
        state.sel[state.weaponType].caliber = value;
        state.sel[state.weaponType].name = null;
        persistSettings(); renderAmmoSelects(); renderResults(); break;
      case 'ammo.loading': {
        var sel = resolveSelection(state.weaponType, state.sel[state.weaponType]);
        if (sel && sel.list[+value]) state.sel[state.weaponType].name = sel.list[+value].entry.n;
        persistSettings(); renderResults(); break;
      }
      case 'compareOn':
        state.compareOn = !!value; persistSettings(); renderCompareSelects(); renderResults(); break;
      case 'cmp.type':
        state.cmp.type = value; state.cmp.caliber = null; state.cmp.name = null;
        persistSettings(); renderCompareSelects(); renderResults(); break;
      case 'cmp.caliber':
        state.cmp.caliber = value; state.cmp.name = null;
        persistSettings(); renderCompareSelects(); renderResults(); break;
      case 'cmp.loading': {
        var cs = resolveSelection(state.cmp.type, state.cmp);
        if (cs && cs.list[+value]) state.cmp.name = cs.list[+value].entry.n;
        persistSettings(); renderResults(); break;
      }
      case 'city': if (value !== '') applyCity(+value); break;
      case 'env.windUnit': state.env.windUnit = value; persistSettings(); renderCalcSection(); break;
      case 'env.windSpeed': {
        var v = num(value);
        state.env.windSpeedMs = v === null ? 0 : (state.env.windUnit === 'kmh' ? v / 3.6 : v);
        persistSettings(); renderResults(); break;
      }
      case 'env.tempC': state.env.tempC = num(value); persistSettings(); renderResults(); break;
      case 'env.pressureHpa': state.env.pressureHpa = num(value); persistSettings(); renderResults(); break;
      case 'env.humidityPct': state.env.humidityPct = num(value); persistSettings(); renderResults(); break;
      case 'env.altitudeM': state.env.altitudeM = num(value); persistSettings(); renderResults(); break;
      case 'env.latitudeDeg': state.env.latitudeDeg = num(value); persistSettings(); renderResults(); break;
      case 'env.azimuthDeg': state.env.azimuthDeg = num(value); persistSettings(); renderResults(); break;
      case 'env.shotAngleDeg': state.env.shotAngleDeg = num(value); persistSettings(); renderResults(); break;
      case 'env.enableCoriolis': state.env.enableCoriolis = !!value; persistSettings(); renderResults(); break;
      case 'env.enableSpinDrift': state.env.enableSpinDrift = !!value; persistSettings(); renderResults(); break;
      case 'shot.zeroDisplay': {
        var z = num(value);
        state.shot.zeroM = z === null ? null : (isImp() ? B.convert.ydToM(z) : z);
        persistSettings(); renderResults(); break;
      }
      case 'shot.sightHeightCm': state.shot.sightHeightCm = num(value); persistSettings(); renderResults(); break;
      case 'shot.clickUnit': state.shot.clickUnit = value; persistSettings(); renderResults(); break;
      case 'shot.dragModel': state.shot.dragModel = value; persistSettings(); renderResults(); break;
      case 'shot.extended': state.shot.extended = !!value; persistSettings(); renderResults(); break;
      case 'shot.show25': state.shot.show25 = !!value; persistSettings(); renderResults(); break;
      case 'set.lang': state.lang = value; persistSettings(); buildShell(); break;
      case 'set.units': state.units = value; persistSettings(); buildShell(); break;
      case 'set.theme': state.theme = value; persistSettings(); buildShell(); break;
      case 'set.view': state.view = value; persistSettings(); buildShell(); break;
      case 'pf.type': {
        // Kaliberliste im Profil-Modal passend zum Typ neu aufbauen.
        var calSel = document.querySelector('#modal-root [data-field="pf.caliber"]');
        if (calSel) {
          calSel.innerHTML = calibersOf(value).map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');
        }
        break;
      }
      default: break; // Modal-Felder (ov.*, pf.*, lb.*) werden erst beim Speichern gelesen.
    }
  }

  function onInput(ev) {
    var el = ev.target.closest('[data-field]');
    if (!el) return;
    var field = el.getAttribute('data-field');
    if (field === 'env.windAngleDeg') {
      state.env.windAngleDeg = num(el.value) || 0;
      var lbl = document.getElementById('wind-angle-val');
      if (lbl) lbl.textContent = fmt(state.env.windAngleDeg, 0) + '°';
      persistSettings(); renderResults();
    } else if (field === 'pf.barrelIn') {
      // Live-Hinweis Zoll -> mm im Profil-Modal.
      var hint = document.querySelector('#modal-root .hint');
      var mm = num(el.value);
      if (hint) hint.textContent = t('barrelMmHint') + (mm != null ? fmt(mm * 25.4, 0) + ' mm' : '–');
    }
  }

  /* --------------------------------------------------------------------------
   * Boot
   * ------------------------------------------------------------------------*/
  function boot() {
    root = document.getElementById('app');
    if (!root || !B) {
      // Ohne Engine kein Betrieb: sichtbare Fehlermeldung statt Absturz.
      if (root) root.innerHTML = '<div class="db-error" role="alert">ballistics.js nicht geladen.</div>';
      return;
    }
    restoreState();
    validateDatabases();
    buildShell();
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('input', onInput);
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeModal(); });
    document.getElementById('import-file').addEventListener('change', function (ev) {
      if (ev.target.files && ev.target.files[0]) importFile(ev.target.files[0]);
      ev.target.value = '';
    });
    // Physik-Selbsttest asynchron nach dem ersten Rendern.
    setTimeout(function () {
      try { state.selfTest = B.selfTest(); } catch (e) { state.selfTest = null; }
      renderSettings();
    }, 60);
    // Service Worker registrieren (offline-Fähigkeit), nie auf file://.
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js').catch(function () { /* offline-Cache optional */ });
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();