/* ============================================================================
 * ammo-db-long.js — STUB, NUR ZUM TESTEN
 * ----------------------------------------------------------------------------
 * Mini-Stub-Datenbank für Langwaffen: genau 1 Kaliber, genau 1 Laborierung.
 * Diese Datei wird später durch die ECHTE, extern generierte DB überschrieben
 * (einfaches Ersetzen der Datei, kein Code-Change in app.js nötig).
 *
 * VERTRAG FÜR DIE ECHTE DB — exakt dasselbe Schema, sonst lädt die App sie nicht:
 *   window.AMMO_DB_VERSION_LONG  (String)
 *   window.CALIBER_META_LONG     (Objekt: Kaliber -> { diameterInch, standardWeight, category })
 *   window.AMMO_DB_LONG          (Objekt: Kaliber -> Array von Laborierungen)
 *
 * Felder je Laborierung:
 *   n, g, bcG1, bcG7, v0, barrelMm, mrd, generic, sourceUrl, sourceNote,
 *   verified, ref { distances, v, e }, dropCm { distances, values, zero }
 *
 * Fehlende Werte sind null und werden als Strich angezeigt — niemals 0,
 * niemals NaN, niemals interpoliert oder erfunden.
 *
 * NACH DEM AUSTAUSCH DER DB: Cache-Version in sw.js erhöhen
 * (z. B. sniper-v15 -> sniper-v16), sonst lädt die App weiter die alte DB
 * aus dem Cache.
 * ==========================================================================*/

window.AMMO_DB_VERSION_LONG = "stub-v1";

window.CALIBER_META_LONG = {
  ".308 Win": { diameterInch: 0.308, standardWeight: 168, category: "lang" }
};

window.AMMO_DB_LONG = {
  ".308 Win": [
    {
      n: "Stub 168gr Test",
      g: 168,
      bcG1: 0.462,
      bcG7: null,
      v0: 800,
      barrelMm: 600,
      mrd: 170,
      generic: false,
      sourceUrl: null,
      sourceNote: "Stub, nur zum Testen",
      verified: false,
      ref: {
        distances: [0, 50, 100, 150, 200, 250, 300],
        v: [800, null, null, null, null, null, null],
        e: [null, null, null, null, null, null, null]
      },
      dropCm: {
        distances: [50, 100, 150, 200, 250, 300],
        values: [null, null, null, null, null, null],
        zero: null
      }
    }
  ]
};