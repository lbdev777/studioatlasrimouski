// Photos des sites d'exemple, générées une seule fois par Workers AI (FLUX.2 [dev])
// puis gardées dans le stockage KV « atlas-images ». Les commerces sont fictifs :
// ces photos servent seulement à illustrer les exemples.

const STYLE = " Photorealistic photograph taken by a professional photographer for a small local business website. Natural light, realistic textures and small imperfections, true-to-life colors, subtle 35mm film grain, shallow depth of field. No text, no letters, no numbers, no signage, no logos, no watermark.";
const NOPEOPLE = " No people.";
const FOOD = "Three-quarter view food photograph on a worn wooden table in a small seaside bistro, handmade stoneware plate, linen napkin, soft window light from the left: ";
const PRODUCT = "Product photograph on a warm off-white seamless paper backdrop, soft daylight from a window on the left, gentle natural shadow, centered composition: ";
const SALON = "Detail photograph in a small bright hair salon, light oak and white, soft daylight: ";

const j = (k, w, h, p, seed) => ({ k, w, h, p, seed });

export const PHOTOS = [
  // ---------- Bistro du Havre (forfait Professionnel) ----------
  j("bistro/s-salle.jpg", 1216, 896, "The dining room of a small, warm seaside bistro in Rimouski, Quebec, at sunset: a few wooden tables set with white linen napkins and wine glasses in front of a large window overlooking the wide St. Lawrence River, golden light, plaster walls, a few plants. Empty room." + STYLE + NOPEOPLE, 11),
  j("bistro/s-terrasse.jpg", 1216, 896, "The wooden outdoor terrace of a small seaside bistro on a summer evening, simple bistro tables and chairs facing the wide St. Lawrence River estuary, warm string lights, calm water, golden hour." + STYLE + NOPEOPLE, 12),
  j("bistro/s-cuisine.jpg", 1216, 896, "The pass of a small restaurant kitchen: three plated dishes of seared fish with vegetables waiting on a stainless steel counter under warm lamps, blurred kitchen in the background." + STYLE + NOPEOPLE, 13),
  j("bistro/s-comptoir.jpg", 1216, 896, "The bar counter of a cozy bistro: dark wood counter, a few wooden stools, an espresso machine, glasses hanging, softly blurred unlabeled bottles on shelves, warm evening light." + STYLE + NOPEOPLE, 14),
  j("bistro/d-soupe.jpg", 1216, 848, FOOD + "a bowl of creamy seafood chowder with clams, potatoes and fresh dill, a slice of crusty bread on the side." + STYLE + NOPEOPLE, 21),
  j("bistro/d-tartare.jpg", 1216, 848, FOOD + "salmon tartare with capers, shallots and fresh herbs, a few toasted crostini." + STYLE + NOPEOPLE, 22),
  j("bistro/d-salade.jpg", 1216, 848, FOOD + "roasted red and golden beet salad with crumbled goat cheese, toasted walnuts and young greens." + STYLE + NOPEOPLE, 23),
  j("bistro/d-poisson.jpg", 1216, 848, FOOD + "a pan-seared halibut fillet on spring vegetables with a lemon butter sauce." + STYLE + NOPEOPLE, 24),
  j("bistro/d-burger.jpg", 1216, 848, FOOD + "a juicy cheeseburger on a toasted brioche bun with crispy fries on a wooden board." + STYLE + NOPEOPLE, 25),
  j("bistro/d-risotto.jpg", 1216, 848, FOOD + "creamy mushroom risotto topped with sautéed wild mushrooms and parmesan shavings." + STYLE + NOPEOPLE, 26),
  j("bistro/d-moules.jpg", 1216, 848, FOOD + "a black cast iron pot of steamed mussels in white wine, garlic and parsley, a small paper cone of fries beside it." + STYLE + NOPEOPLE, 27),
  j("bistro/d-pouding.jpg", 1216, 848, FOOD + "pouding chomeur, the Quebec dessert: a warm sponge cake soaked in maple caramel sauce in a small ramekin, with a spoon of whipped cream." + STYLE + NOPEOPLE, 28),
  j("bistro/d-tarte.jpg", 1216, 848, FOOD + "a slice of Quebec sugar pie with a golden flaky crust and a dollop of whipped cream." + STYLE + NOPEOPLE, 29),

  // ---------- Salon Marée (forfait Rendez-vous) ----------
  j("salon/hero.jpg", 1088, 1008, "Interior of a small bright hair salon near the sea: a single styling chair in front of a large round mirror, light oak shelves with a few unlabeled hair care bottles, a green plant, soft daylight from a window showing the river. Calm, minimal, Scandinavian. Empty salon." + STYLE + NOPEOPLE, 31),
  j("salon/svc-1.jpg", 1216, 608, SALON + "professional hair cutting scissors, a fine comb and two sectioning clips laid on a folded white towel on the counter." + STYLE + NOPEOPLE, 32),
  j("salon/svc-2.jpg", 1216, 608, SALON + "barber hair clippers, a pocket comb and a soft neck brush on a dark wooden counter." + STYLE + NOPEOPLE, 33),
  j("salon/svc-3.jpg", 1216, 608, SALON + "a hair color mixing bowl with a tint brush and folded aluminum foil sheets on a small salon trolley." + STYLE + NOPEOPLE, 34),
  j("salon/svc-4.jpg", 1216, 608, "Long wavy hair with a soft blonde balayage seen from behind, falling over a white salon cape in a bright hair salon. The face is not visible." + STYLE, 35),
  j("salon/svc-5.jpg", 1216, 608, SALON + "a round brush, a professional blow dryer and a few velcro hair rollers on the counter." + STYLE + NOPEOPLE, 36),
  j("salon/svc-6.jpg", 1216, 608, SALON + "a small child's booster cushion on a salon chair with a colorful kids' cape folded on it and a small spray bottle." + STYLE + NOPEOPLE, 37),
  j("salon/gal-1.jpg", 912, 1216, "Back view of a woman's sleek chin-length brown bob haircut, freshly styled and glossy, in a bright hair salon. The face is not visible." + STYLE, 41),
  j("salon/gal-2.jpg", 912, 1216, "Back view of long straight dark brown hair, glossy and healthy, falling below the shoulders, in a bright hair salon. The face is not visible." + STYLE, 42),
  j("salon/gal-3.jpg", 912, 1216, "Back view of shoulder-length soft blonde waves, freshly styled, in a bright hair salon. The face is not visible." + STYLE, 43),
  j("salon/gal-4.jpg", 912, 1216, "Back view of a short textured copper-red pixie haircut, freshly styled, in a bright hair salon. The face is not visible." + STYLE, 44),

  // ---------- Garage Boréal (forfait Essentiel) ----------
  j("garage/hero.jpg", 1216, 848, "Interior of a clean independent auto repair garage in Quebec: a car raised on a two-post lift, an organized tool wall, stacked winter tires, daylight coming through an open bay door with snow outside." + STYLE + NOPEOPLE, 51),
  j("garage/svc-entretien.jpg", 1216, 608, "Close-up of a car engine bay in a garage with the oil filler cap open and a funnel, a bottle of fresh golden motor oil beside it." + STYLE + NOPEOPLE, 52),
  j("garage/svc-pneus.jpg", 1216, 608, "A neat row of new winter tires mounted on alloy wheels in a garage, close-up of the deep tread." + STYLE + NOPEOPLE, 53),
  j("garage/svc-freins.jpg", 1216, 608, "Close-up of a car brake disc and a red brake caliper on a vehicle raised on a lift, wheel removed, in a garage." + STYLE + NOPEOPLE, 54),
  j("garage/svc-diagnostic.jpg", 1216, 608, "An open car hood with a work light hanging over the engine in a dim garage." + STYLE + NOPEOPLE, 55),
  j("garage/gal-facade.jpg", 1216, 896, "Exterior of a small independent auto repair garage in a Quebec town in winter: a simple metal-clad building with two roll-up garage doors, snowbanks, overcast sky. The building has no sign." + STYLE + NOPEOPLE, 56),
  j("garage/gal-pneus.jpg", 1216, 768, "Tall metal storage racks filled with neatly stacked tires in the storage room of a garage." + STYLE + NOPEOPLE, 57),
  j("garage/gal-accueil.jpg", 1216, 768, "The small customer waiting area of a garage: a simple counter, two chairs, a coffee machine and a window, tidy and modest." + STYLE + NOPEOPLE, 58),

  // ---------- Atelier Fjord (forfait Boutique) ----------
  j("fjord/hero.jpg", 960, 1120, "A styled wooden shelf by a bright window with handmade candles in glass jars and stoneware ceramics, the St. Lawrence River blurred outside, calm morning light, cozy Nordic home." + STYLE + NOPEOPLE, 61),
  j("fjord/story.jpg", 1024, 1024, "A small artisan workshop table with a pouring pitcher of melted wax, cotton wicks, empty glass jars and a few raw clay pots, warm sunlight." + STYLE + NOPEOPLE, 62),
  j("fjord/p-maree.jpg", 960, 1200, PRODUCT + "a soy wax candle in a clear sea-green tinted glass jar, its wooden lid leaning beside it. No label." + STYLE + NOPEOPLE, 63),
  j("fjord/p-feu.jpg", 960, 1200, PRODUCT + "a lit soy wax candle in an amber glass jar with a small calm flame. No label." + STYLE + NOPEOPLE, 64),
  j("fjord/p-brume.jpg", 960, 1200, PRODUCT + "a soy wax candle in a frosted lavender-colored glass jar, a sprig of dried lavender and a small fir branch beside it. No label." + STYLE + NOPEOPLE, 65),
  j("fjord/p-tasse-fleuve.jpg", 960, 1200, PRODUCT + "a handmade stoneware mug with a deep blue glossy glaze dripping over the raw clay foot." + STYLE + NOPEOPLE, 66),
  j("fjord/p-tasse-sable.jpg", 960, 1200, PRODUCT + "a handmade stoneware mug with a matte cream glaze and a raw unglazed clay foot." + STYLE + NOPEOPLE, 67),
  j("fjord/p-bol-goemon.jpg", 960, 1200, PRODUCT + "a handmade stoneware bowl with a speckled seaweed-green glaze." + STYLE + NOPEOPLE, 68),
  j("fjord/p-vase-anse.jpg", 960, 1200, PRODUCT + "a small handmade white stoneware vase with one handle, holding a few dried grasses." + STYLE + NOPEOPLE, 69),
  j("fjord/p-coffret.jpg", 960, 1200, PRODUCT + "an open kraft gift box with tissue paper holding a candle in a glass jar and a blue stoneware mug." + STYLE + NOPEOPLE, 70),

  // ---------- Nordet Chauffage (forfait Entreprise) ----------
  j("nordet/hero.jpg", 1216, 1008, "A modern heat pump outdoor unit neatly installed on a wall bracket beside a renovated house in Quebec, light snow on the ground, tidy line set cover, overcast winter day." + STYLE + NOPEOPLE, 81),
  j("nordet/r1.jpg", 1216, 912, "A white ductless heat pump wall unit installed above a window in the renovated living room of a 1950s house, wood floor, bright daylight." + STYLE + NOPEOPLE, 82),
  j("nordet/r2.jpg", 1216, 912, "A modern bathroom with a curbless walk-in shower, a clear glass panel, light gray tiles and new chrome fixtures, bright and clean." + STYLE + NOPEOPLE, 83),
  j("nordet/r3.jpg", 1216, 912, "A clean basement utility room with two new electric water heaters and neatly installed copper and PEX piping." + STYLE + NOPEOPLE, 84),
];

// Génère les photos qui manquent encore (quelques-unes à la fois, appelé chaque minute par le cron).
export async function generatePending(env, max = 2) {
  if (!env.AI || !env.IMAGES) return;
  const have = new Set();
  let cursor;
  do {
    const r = await env.IMAGES.list({ cursor, limit: 1000 });
    r.keys.forEach((k) => have.add(k.name));
    cursor = r.list_complete ? null : r.cursor;
  } while (cursor);
  const todo = PHOTOS.filter((p) => !have.has(p.k)).slice(0, max);
  for (const p of todo) {
    try {
      const form = new FormData();
      form.append("prompt", p.p);
      form.append("width", String(p.w));
      form.append("height", String(p.h));
      form.append("seed", String(p.seed));
      const fr = new Response(form);
      const out = await env.AI.run("@cf/black-forest-labs/flux-2-dev", { multipart: { body: fr.body, contentType: fr.headers.get("content-type") } });
      const s = atob(out.image);
      const u = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
      const type = u[0] === 0xff ? "image/jpeg" : u[0] === 0x89 ? "image/png" : u[0] === 0x52 ? "image/webp" : "application/octet-stream";
      await env.IMAGES.put(p.k, u, { metadata: { type, w: p.w, h: p.h, at: Date.now() } });
      console.log("Photo générée", p.k, u.length);
    } catch (e) {
      console.error("Photo non générée", p.k, String(e && e.message || e).slice(0, 300));
    }
  }
}

// Sert une photo depuis le stockage, avec cache.
export async function serveImage(request, env, ctx, url) {
  const key = decodeURIComponent(url.pathname.slice(5));
  if (!env.IMAGES || !/^[a-z0-9\-\/]+\.jpg$/.test(key)) return new Response("Introuvable", { status: 404 });
  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;
  const { value, metadata } = await env.IMAGES.getWithMetadata(key, { type: "stream" });
  if (!value) return new Response("Introuvable", { status: 404, headers: { "cache-control": "no-store" } });
  const res = new Response(value, { headers: { "content-type": (metadata && metadata.type) || "image/jpeg", "cache-control": "public, max-age=86400", "x-content-type-options": "nosniff" } });
  ctx.waitUntil(cache.put(request, res.clone()));
  return res;
}
