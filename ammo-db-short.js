/* ============================================================================
 * ammo-db-short.js — STUB, NUR ZUM TESTEN
 * ----------------------------------------------------------------------------
 * Mini-Stub-Datenbank für Kurzwaffen: genau 1 Kaliber, genau 1 Laborierung.
 * Diese Datei wird später durch die ECHTE, extern generierte DB überschrieben
 * (einfaches Ersetzen der Datei, kein Code-Change in app.js nötig).
 *
 * VERTRAG FÜR DIE ECHTE DB — exakt dasselbe Schema, sonst lädt die App sie nicht:
 *   window.AMMO_DB_VERSION_SHORT  (String)
 *   window.CALIBER_META_SHORT     (Objekt: Kaliber -> { diameterInch, standardWeight, category })
 *   window.AMMO_DB_SHORT          (Objekt: Kaliber -> Array von Laborierungen)
 *
 * Felder je Laborierung:
 *   n, g, bcG1, bcG7, v0, barrelMm, mrd, generic, sourceUrl, sourceNote,
 *   verified, ref { distances, v, e }, dropCm { distances, values, zero }
 *
 * Kurzwaffen: mrd ist null, GEE wird in der App für Kurzwaffen immer null
 * angezeigt. Fehlende Werte sind null und werden als Strich angezeigt —
 * niemals 0, niemals NaN, niemals interpoliert oder erfunden.
 *
 * NACH DEM AUSTAUSCH DER DB: Cache-Version in sw.js erhöhen
 * (z. B. sniper-v15 -> sniper-v16), sonst lädt die App weiter die alte DB
 * aus dem Cache.
 * ==========================================================================*/

window.AMMO_DB_VERSION_SHORT = "stub-v1";

window.CALIBER_META_SHORT = {
  "9mm Luger": { diameterInch: 0.355, standardWeight: 124, category: "kurz" }
};

window.AMMO_DB_SHORT = {
  "9mm Luger": [
    {
      n: "Stub 124gr Test",
      g: 124,
      bcG1: 0.14,
      bcG7: null,
      v0: 360,
      barrelMm: 102,
      mrd: null,
      generic: false,
      sourceUrl: null,
      sourceNote: "Stub, nur zum Testen",
      verified: false,
      ref: {
        distances: [0, 50, 100],
        v: [360, null, null],
        e: [null, null, null]
      },
      dropCm: {
        distances: [50, 100],
        values: [null, null],
        zero: null
      }
    }
  ]
};