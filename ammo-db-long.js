// ammo-db-long.js — repariert & vervollstaendigt (Charge 1)
// Fixes: 'distance s' -> distances, Keys/Namen getrimmt, Quotes escaped, URL-Spaces entfernt.
// BCs: Herstellerwerte ohne Modellangabe als G1 uebernommen (bcModelUnknown:true);
// fehlende BCs per G1-Fit aus dem v-Verlauf geschaetzt (bcEstimated:true, ggf. plausibilisiert).
// Referenztabellen (ref/dropCm) unveraendert aus den Herstellerquellen.
window.AMMO_DB_VERSION_LONG = "long-2026-11-27-r2";
window.CALIBER_META_LONG = {
  ".308 Win": { diameterInch: 0.308, standardWeight: 168, category: "lang" },
  "6.5 Creedmoor": { diameterInch: 0.264, standardWeight: 140, category: "lang" },
  ".223 Rem": { diameterInch: 0.224, standardWeight: 55, category: "lang" },
  ".30-06": { diameterInch: 0.308, standardWeight: 180, category: "lang" },
  "8x57 IS": { diameterInch: 0.323, standardWeight: 180, category: "lang" }
};
window.AMMO_DB_LONG = {
  ".308 Win": [
    {
      n: "RWS UNI Classic 180gr", g: 180, bcG1: 0.426, bcG7: null, bcEstimated: true,
      v0: 780, barrelMm: null, mrd: 160, generic: false, verified: true,
      sourceUrl: "https://www.krale.shop/media/blfa_files/RWS_.308_Win_UNI_180_grain-min.pdf",
      sourceNote: "RWS-Datenblatt (Art.-Nr. 2119196, 11,7 g), gehostet bei krale.shop. Datenblatt ohne BC- und Lauflaengenangabe. bcG1 aus dem Hersteller-Geschwindigkeitsverlauf geschaetzt (G1-Fit, RMSE < 1 m/s).",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [780, 739, 699, 660, 622, 586, 551], e: [3559, 3195, 2858, 2548, 2263, 2009, 1776] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [1.0, 4.0, 1.0, -7.0, -21.0, -43.0], zero: "GEE" }
    },
    {
      n: "Geco Express 165gr", g: 165, bcG1: 0.404, bcG7: null, bcModelUnknown: true,
      v0: 825, barrelMm: 600, mrd: 171, generic: false, verified: true,
      sourceUrl: "https://www.alfatactical.cz/images_obsah/datasheet/geco308document.pdf",
      sourceNote: "Geco-Datenblatt (Art.-Nr. 2317804, 10,7 g), gehostet bei alfatactical.cz. BC 0.404 laut Hersteller ohne Modellangabe; als G1 angenommen (konservativ).",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [825, 788, 752, 717, 683, 649, 617], e: [3641, 3322, 3025, 2750, 2496, 2253, 2037] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [1.5, 4.0, 2.2, -4.4, -16.2, -33.9], zero: "GEE" }
    },
    {
      n: "Generisch 146gr (Hirtenberger 2002)", g: 146, bcG1: 0.45, bcG7: null, bcEstimated: true,
      v0: 860, barrelMm: null, mrd: 178, generic: true, verified: false,
      sourceUrl: "https://www.hoferwaffen.com/images/ballistics/hirtenberger.pdf",
      sourceNote: "Historisch, Stand 2002. Kein BC, keine Lauflaenge in Quelle. PDF-Zeile \".308 Win VM-SP\", 9,5 g. bcG1 geschaetzt, auf 0.45 plausibilisiert.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [860, null, 785, 750, 715, 680, 650], e: [3513, null, 2927, 2672, 2428, 2196, 2007] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [1.3, 3.9, 2.7, -3.2, -13.8, -29.7], zero: "GEE" }
    },
    {
      n: "Generisch 150gr (Hirtenberger 2002)", g: 150, bcG1: 0.414, bcG7: null, bcEstimated: true,
      v0: 890, barrelMm: null, mrd: 180, generic: true, verified: false,
      sourceUrl: "https://www.hoferwaffen.com/images/ballistics/hirtenberger.pdf",
      sourceNote: "Historisch, Stand 2002. Kein BC, keine Lauflaenge in Quelle. bcG1 aus Geschwindigkeitsverlauf geschaetzt.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [890, null, 800, 757, 716, 676, 637], e: [3842, null, 3104, 2779, 2486, 2216, 1968] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [1.0, 4.0, 2.5, -3.0, -13.0, -29.0], zero: "GEE" }
    },
    {
      n: "Generisch 165gr (Hirtenberger 2002)", g: 165, bcG1: 0.492, bcG7: null, bcEstimated: true,
      v0: 780, barrelMm: null, mrd: 159, generic: true, verified: false,
      sourceUrl: "https://www.hoferwaffen.com/images/ballistics/hirtenberger.pdf",
      sourceNote: "Historisch, Stand 2002. Kein BC, keine Lauflaenge in Quelle. bcG1 aus Geschwindigkeitsverlauf geschaetzt.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [780, null, 708, 674, 642, 611, 582], e: [3255, null, 2678, 2429, 2203, 1998, 1812] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [1.5, 4.0, 1.0, -7.0, -21.0, -42.0], zero: "GEE" }
    },
    {
      n: "Generisch 180gr (Hirtenberger 2002)", g: 180, bcG1: 0.5, bcG7: null, bcEstimated: true,
      v0: 770, barrelMm: null, mrd: 160, generic: true, verified: false,
      sourceUrl: "https://www.hoferwaffen.com/images/ballistics/hirtenberger.pdf",
      sourceNote: "Historisch, Stand 2002. Kein BC, keine Lauflaenge in Quelle. bcG1 geschaetzt, auf 0.50 plausibilisiert.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [770, null, 706, 675, 645, 616, 588], e: [3439, null, 2891, 2643, 2413, 2201, 2005] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [1.5, 4.0, 1.0, -7.5, -21.5, -42.0], zero: "GEE" }
    },
    {
      n: "Generisch 190gr (Hirtenberger 2002)", g: 190, bcG1: 0.632, bcG7: null, bcEstimated: true,
      v0: 730, barrelMm: null, mrd: 160, generic: true, verified: false,
      sourceUrl: "https://www.hoferwaffen.com/images/ballistics/hirtenberger.pdf",
      sourceNote: "Historisch, Stand 2002. Kein BC, keine Lauflaenge in Quelle. PDF-Zeile \".308 Win. Match\", 12,3 g. Treffpunkt 250 m in PDF unleserlich (\"-2405\"), daher null. bcG1 geschaetzt.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [730, null, 677, 651, 626, 601, 577], e: [3277, null, 2819, 2606, 2410, 2221, 2048] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [2.0, 4.0, 1.5, -8.0, null, -46.0], zero: "GEE" }
    }
  ],
  "6.5 Creedmoor": [
    {
      n: "Geco Express 140gr", g: 140, bcG1: 0.406, bcG7: null, bcModelUnknown: true,
      v0: 807, barrelMm: 600, mrd: 168, generic: false, verified: true,
      sourceUrl: "https://geco-ammunition.com/en/ammunition/products-overview/centrefire-rifle-cartridges/geco-express/geco-65-creedmoor-express-91g",
      sourceNote: "Geco Art.-Nr. 2419637, 9,1 g. BC 0.406 laut Hersteller ohne Modellangabe; als G1 angenommen.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [807, 771, 735, 701, 668, 636, 604], e: [2963, 2705, 2458, 2236, 2030, 1840, 1660] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [1.6, 4.0, 1.9, -5.1, -17.7, -36.4], zero: "GEE" }
    },
    {
      n: "Geco Target HP 130gr", g: 130, bcG1: 0.548, bcG7: null, bcModelUnknown: true,
      v0: 859, barrelMm: 600, mrd: 183, generic: false, verified: true,
      sourceUrl: "https://geco-ammunition.com/en/ammunition/products-overview/centrefire-rifle-cartridges/geco-target-hp/geco-65-creedmoor-target-hp-84g",
      sourceNote: "Geco Art.-Nr. 2420105, 8,4 g. BC 0.548 laut Hersteller ohne Modellangabe; als G1 angenommen.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [859, 831, 803, 776, 750, 724, 699], e: [3108, 2909, 2716, 2537, 2370, 2208, 2058] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [1.3, 4.0, 2.9, -2.2, -11.8, -26.0], zero: "GEE" }
    }
  ],
  ".223 Rem": [
    {
      n: "Geco Express 56gr", g: 56, bcG1: 0.202, bcG7: null, bcModelUnknown: true,
      v0: 1010, barrelMm: 600, mrd: 192, generic: false, verified: true,
      sourceUrl: "https://geco-ammunition.com/en/ammunition/products-overview/centrefire-rifle-cartridges/geco-express/geco-223-rem-express-36g",
      sourceNote: "Geco Art.-Nr. 2317833, 3,6 g. BC 0.202 laut Hersteller ohne Modellangabe; als G1 angenommen.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [1010, 926, 848, 773, 703, 636, 574], e: [1836, 1543, 1294, 1076, 890, 728, 593] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [0.9, 4.0, 3.6, -0.9, -10.4, -26.0], zero: "GEE" }
    },
    {
      n: "Geco Target HP 52gr", g: 52, bcG1: 0.195, bcG7: null, bcModelUnknown: true,
      v0: 960, barrelMm: 600, mrd: 179, generic: false, verified: true,
      sourceUrl: "https://geco-ammunition.com/en/ammunition/products-overview/centrefire-rifle-cartridges/geco-target-hp/geco-223-rem-target-hp-34g",
      sourceNote: "Geco Art.-Nr. 2429344, 3,4 g. BC 0.195 laut Hersteller ohne Modellangabe; als G1 angenommen.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [960, 876, 793, 714, 640, 572, 513], e: [1567, 1305, 1069, 867, 696, 556, 447] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [1.1, 4.0, 3.0, -2.9, -14.8, -34.4], zero: "GEE" }
    },
    {
      n: "Geco DTX 55gr", g: 55, bcG1: 0.302, bcG7: null, bcModelUnknown: true,
      v0: 963, barrelMm: 600, mrd: 194, generic: false, verified: true,
      sourceUrl: "https://geco-ammunition.com/en/ammunition/products-overview/centrefire-rifle-cartridges/geco-dtx/geco-223-rem-dtx-36g",
      sourceNote: "Geco Art.-Nr. 2423805, 3,6 g, FMJ. BC 0.302 laut Hersteller ohne Modellangabe; als G1 angenommen.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [963, 908, 856, 808, 761, 713, 668], e: [1651, 1468, 1304, 1162, 1031, 905, 794] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [1.0, 4.0, 3.7, -0.4, -8.7, -21.9], zero: "GEE" }
    },
    {
      n: "Generisch 55gr (Hirtenberger 2002)", g: 55, bcG1: 0.284, bcG7: null, bcEstimated: true,
      v0: 1000, barrelMm: null, mrd: 195, generic: true, verified: false,
      sourceUrl: "https://www.hoferwaffen.com/images/ballistics/hirtenberger.pdf",
      sourceNote: "Historisch, Stand 2002. Kein BC, keine Lauflaenge in Quelle. PDF enthaelt vier Zeilen mit 55gr (V0 1000, 1000, 955, 1010 m/s); nur die erste Zeile uebernommen. bcG1 geschaetzt.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [1000, null, 860, 795, 734, 675, 618], e: [1800, null, 1331, 1138, 970, 820, 687] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [1.0, 4.0, 3.5, -0.5, -9.5, -24.0], zero: "GEE" }
    }
  ],
  ".30-06": [
    {
      n: "Geco Express 165gr", g: 165, bcG1: 0.404, bcG7: null, bcModelUnknown: true,
      v0: 864, barrelMm: 600, mrd: 179, generic: false, verified: true,
      sourceUrl: "https://geco-ammunition.com/en/ammunition/products-overview/centrefire-rifle-cartridges/geco-express/geco-30-06-express-107g",
      sourceNote: "Geco Art.-Nr. 2317806, 10,7 g. BC 0.404 laut Hersteller ohne Modellangabe; als G1 angenommen.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [864, 826, 789, 753, 718, 683, 650], e: [3994, 3650, 3330, 3033, 2758, 2496, 2260] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [1.3, 4.0, 2.7, -2.8, -13.2, -28.8], zero: "GEE" }
    },
    {
      n: "Generisch 150gr (Hirtenberger 2002)", g: 150, bcG1: 0.5, bcG7: null, bcEstimated: true,
      v0: 895, barrelMm: null, mrd: 185, generic: true, verified: false,
      sourceUrl: "https://www.hoferwaffen.com/images/ballistics/hirtenberger.pdf",
      sourceNote: "Historisch, Stand 2002. Kein BC, keine Lauflaenge in Quelle. bcG1 geschaetzt, auf 0.50 plausibilisiert.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [895, null, 820, 784, 749, 715, 682], e: [3885, null, 3261, 2981, 2721, 2479, 2256] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [1.0, 4.0, 3.0, -2.0, -11.5, -25.5], zero: "GEE" }
    },
    {
      n: "Generisch 165gr (Hirtenberger 2002)", g: 165, bcG1: 0.492, bcG7: null, bcEstimated: true,
      v0: 785, barrelMm: null, mrd: 160, generic: true, verified: false,
      sourceUrl: "https://www.hoferwaffen.com/images/ballistics/hirtenberger.pdf",
      sourceNote: "Historisch, Stand 2002. Kein BC, keine Lauflaenge in Quelle. PDF enthaelt zwei Zeilen mit 165gr (V0 785 und 820 m/s); nur die erste Zeile uebernommen. bcG1 geschaetzt.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [785, null, 712, 678, 646, 615, 586], e: [3297, null, 2713, 2461, 2233, 2025, 1837] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [1.5, 4.0, 1.0, -7.0, -20.5, -41.0], zero: "GEE" }
    },
    {
      n: "Generisch 180gr (Hirtenberger 2002)", g: 180, bcG1: 0.546, bcG7: null, bcEstimated: true,
      v0: 810, barrelMm: null, mrd: 170, generic: true, verified: false,
      sourceUrl: "https://www.hoferwaffen.com/images/ballistics/hirtenberger.pdf",
      sourceNote: "Historisch, Stand 2002. Kein BC, keine Lauflaenge in Quelle. bcG1 aus Geschwindigkeitsverlauf geschaetzt.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [810, null, 745, 714, 683, 653, 624], e: [3805, null, 3219, 2957, 2706, 2473, 2258] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [1.0, 4.0, 2.0, -5.0, -17.5, -35.0], zero: "GEE" }
    }
  ],
  "8x57 IS": [
    {
      n: "Geco Express 180gr", g: 180, bcG1: 0.373, bcG7: null, bcModelUnknown: true,
      v0: 798, barrelMm: 600, mrd: 164, generic: false, verified: true,
      sourceUrl: "https://geco-ammunition.com/en/ammunition/products-overview/centrefire-rifle-cartridges/geco-express/geco-8x57-is-express-117g",
      sourceNote: "Geco Art.-Nr. 2421108, 11,7 g. BC 0.373 laut Hersteller ohne Modellangabe; als G1 angenommen. V100 laut Seite 739 m/s passt nicht zu E100 3041 J (ca. 721 m/s); der inkonsistente Wert bleibt null.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [798, 759, null, 684, 648, 613, 580], e: [3725, 3370, 3041, 2737, 2456, 2198, 1968] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [1.6, 4.0, 1.6, -6.0, -19.5, -39.5], zero: "GEE" }
    },
    {
      n: "Generisch 175gr (Hirtenberger 2002)", g: 175, bcG1: 0.55, bcG7: null, bcEstimated: true,
      v0: 780, barrelMm: null, mrd: 161, generic: true, verified: false,
      sourceUrl: "https://www.hoferwaffen.com/images/ballistics/hirtenberger.pdf",
      sourceNote: "Historisch, Stand 2002. Kein BC, keine Lauflaenge in Quelle. bcG1 geschaetzt, auf 0.55 plausibilisiert.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [780, null, 718, 688, 660, 633, 607], e: [3437, null, 2908, 2675, 2461, 2263, 2082] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [1.5, 4.0, 1.0, -6.5, -20.0, -39.5], zero: "GEE" }
    },
    {
      n: "Generisch 200gr (Hirtenberger 2002)", g: 200, bcG1: 0.486, bcG7: null, bcEstimated: true,
      v0: 750, barrelMm: null, mrd: 155, generic: true, verified: false,
      sourceUrl: "https://www.hoferwaffen.com/images/ballistics/hirtenberger.pdf",
      sourceNote: "Historisch, Stand 2002. Kein BC, keine Lauflaenge in Quelle. bcG1 aus Geschwindigkeitsverlauf geschaetzt.",
      ref: { distances: [0, 50, 100, 150, 200, 250, 300], v: [750, null, 680, 646, 614, 582, 551], e: [3656, null, 3006, 2713, 2450, 2202, 1973] },
      dropCm: { distances: [50, 100, 150, 200, 250, 300], values: [2.0, 4.0, 0.5, -8.5, -24.5, -48.0], zero: "GEE" }
    }
  ]
};