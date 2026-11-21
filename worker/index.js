// Studio Atlas Rimouski : sert le site statique et reçoit le formulaire de contact.
// Les messages sont envoyés au Gmail de l'entreprise (adresse vérifiée dans Cloudflare Email Routing).

import { handleAdmin, recordVisit } from "./admin.js";
import { serveImage } from "./photos.js";

const MAX = { nom: 120, entreprise: 160, courriel: 200, telephone: 40, message: 5000 };

// Pendant la transition DNS, la copie GitHub du site envoie aussi ici.
const ALLOWED_ORIGINS = ["https://studioatlasrimouski.ca", "https://www.studioatlasrimouski.ca", "https://lbdev777.github.io"];
let currentOrigin = "";

function json(data, status = 200) {
  const headers = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
  if (ALLOWED_ORIGINS.includes(currentOrigin)) { headers["access-control-allow-origin"] = currentOrigin; headers["vary"] = "Origin"; }
  return new Response(JSON.stringify(data), { status, headers });
}

async function readForm(request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) return await request.json();
  const fd = await request.formData();
  const o = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") o[k] = v;
  return o;
}

async function sendContact(env, f) {
  const lines = [
    "Nouveau message envoyé depuis studioatlasrimouski.ca/contact",
    "",
    "Nom : " + f.nom,
    "Entreprise : " + (f.entreprise || "(non précisée)"),
    "Courriel : " + f.courriel,
    "Téléphone : " + (f.telephone || "(non précisé)"),
    "Infolettre : " + (f.infolettre ? "oui" : "non"),
    "",
    "Message :",
    f.message,
    "",
    "Pour répondre, utilisez simplement « Répondre » : la réponse ira à " + f.courriel + ".",
  ];
  await env.EMAIL.send({
    to: "studioatlasrimouski@gmail.com",
    from: { email: "site@studioatlasrimouski.ca", name: "Site Studio Atlas" },
    replyTo: { email: f.courriel, name: f.nom },
    subject: "Nouveau message du site : " + f.nom + (f.entreprise ? " (" + f.entreprise + ")" : ""),
    text: lines.join("\n"),
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/img/")) return serveImage(request, env, ctx, url);

    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) return handleAdmin(request, env, url);
    if (url.pathname === "/api/v" && request.method === "POST") {
      try { return await recordVisit(request, env); } catch (e) { console.error("Visite non comptée", e); return new Response(null, { status: 204 }); }
    }
    currentOrigin = request.headers.get("origin") || "";
    if (url.pathname === "/api/contact" && request.method === "OPTIONS") {
      const h = { "access-control-allow-methods": "POST", "access-control-allow-headers": "Accept, Content-Type", "access-control-max-age": "86400" };
      if (ALLOWED_ORIGINS.includes(currentOrigin)) h["access-control-allow-origin"] = currentOrigin;
      return new Response(null, { status: 204, headers: h });
    }
    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") return json({ ok: false, error: "Méthode non permise." }, 405);
      const wantsJson = (request.headers.get("accept") || "").includes("application/json");
      let f;
      try { f = await readForm(request); } catch { return json({ ok: false, error: "Formulaire illisible." }, 400); }
      const clean = {};
      for (const k of Object.keys(MAX)) clean[k] = String(f[k] || "").trim().slice(0, MAX[k]);
      clean.infolettre = !!f.infolettre;
      // Champ piège invisible : rempli seulement par les robots.
      if (String(f.site_web || "").trim()) return wantsJson ? json({ ok: true }) : Response.redirect(url.origin + "/contact.html?envoye=1#contact", 303);
      const courrielOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.courriel);
      if (!clean.nom || !clean.message || !courrielOk) {
        const why = !courrielOk ? "Votre adresse courriel semble incomplète (exemple : nom@domaine.com)." : "Il manque votre nom ou votre message.";
        return wantsJson ? json({ ok: false, error: why }, 400)
                         : Response.redirect(url.origin + "/contact.html?erreur=1#contact", 303);
      }
      // Filtre à pourriel : le message est gardé dans /admin (section Pourriel), mais aucun courriel n'est envoyé.
      const raison = spamReason(clean, f);
      // Garde une copie dans le tableau de bord (/admin), même si le courriel échoue.
      try {
        if (env.DB) await env.DB.prepare("INSERT INTO messages (ts, nom, entreprise, courriel, telephone, message, infolettre, spam, raison) VALUES (?,?,?,?,?,?,?,?,?)")
          .bind(Date.now(), clean.nom, clean.entreprise, clean.courriel, clean.telephone, clean.message, clean.infolettre ? 1 : 0, raison ? 1 : 0, raison || null).run();
      } catch (e) { console.error("Enregistrement du message impossible", e); }
      // Le robot reçoit la même réponse qu'une vraie personne, pour ne pas lui apprendre à contourner le filtre.
      if (raison) return wantsJson ? json({ ok: true }) : Response.redirect(url.origin + "/contact.html?envoye=1#contact", 303);
      try { await sendContact(env, clean); }
      catch (e) {
        console.error("Envoi impossible", e);
        return wantsJson ? json({ ok: false, error: "L'envoi n'a pas fonctionné. Écrivez-nous directement à studioatlasrimouski@gmail.com." }, 502)
                         : Response.redirect(url.origin + "/contact.html?erreur=2#contact", 303);
      }
      return wantsJson ? json({ ok: true }) : Response.redirect(url.origin + "/contact.html?envoye=1#contact", 303);
    }

    return env.ASSETS.fetch(request);
  },
};

// Reconnaît les messages publicitaires envoyés en masse par des robots.
function spamReason(c, f) {
  const duree = parseInt(f.duree, 10);
  if (duree > 0 && duree < 3000) return "Formulaire rempli en moins de 3 secondes";
  const t = [c.nom, c.entreprise, c.message].join(" ").toLowerCase();
  if (/t\.me\/|telegram|wa\.me\/|whatsapp/.test(t)) return "Lien Telegram ou WhatsApp";
  if ((t.match(/https?:\/\/|www\./g) || []).length >= 2) return "Plusieurs liens dans le message";
  if (/[\u0400-\u04ff]{4,}/.test(t)) return "Texte en alphabet cyrillique";
  if (/offres commerciales|via (un|les) formulaires? de contact|formulaires? de contact pour|millions? de messages|backlinks?|\bseo\b|crypto|bitcoin|casino|forex|viagra/.test(t)) return "Publicité envoyée en masse";
  return "";
}
