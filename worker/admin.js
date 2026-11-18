// Tableau de bord privé de Studio Atlas Rimouski : /admin
// Visites, messages du formulaire et clients. Protégé par le mot de passe ADMIN_PASSWORD (secret Cloudflare).

const TZ = "America/Toronto";
const COOKIE = "atlas_admin";
const SESSION_DAYS = 30;

// ---------- utilitaires ----------
export function jourLocal(ts = Date.now()) {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ts));
}
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n || 0);
const num = (n) => new Intl.NumberFormat("fr-CA").format(n || 0);
const dateHeure = (ts) => new Intl.DateTimeFormat("fr-CA", { timeZone: TZ, dateStyle: "medium", timeStyle: "short" }).format(new Date(ts));

async function hmac(key, data) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function sha(data) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function getCookie(request, name) {
  const c = request.headers.get("cookie") || "";
  const m = c.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? m[1] : "";
}
async function isLogged(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const v = getCookie(request, COOKIE);
  const [ts, sig] = v.split(".");
  if (!ts || !sig) return false;
  if (Date.now() - Number(ts) > SESSION_DAYS * 864e5) return false;
  return safeEqual(sig, await hmac(env.ADMIN_PASSWORD + ":session", ts));
}
const SECURITY = {
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "strict-transport-security": "max-age=31536000",
  "content-security-policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'",
};
const html = (body, status = 200, headers = {}) =>
  new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", "referrer-policy": "same-origin", ...SECURITY, ...headers } });
const redirect = (to, headers = {}) => new Response(null, { status: 303, headers: { location: to, "cache-control": "no-store", ...headers } });

// ---------- gabarit ----------
const CSS = `
*{box-sizing:border-box}body{margin:0;font-family:"Instrument Sans",system-ui,sans-serif;background:#F0F6F9;color:#0B1B33;font-size:15px;line-height:1.5}
a{color:inherit}h1,h2{font-family:Unbounded,system-ui,sans-serif;letter-spacing:-.02em;margin:0}
.top{background:#0B1B33;color:#fff;display:flex;align-items:center;gap:16px;padding:12px 20px}
.top .brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:700}
.top .right{margin-left:auto;display:flex;gap:16px;align-items:center;font-size:14px}.top .right a{color:#C2DCE8;text-decoration:none}.top .right a:hover{color:#A9D9EC}
.layout{display:grid;grid-template-columns:220px 1fr;min-height:calc(100vh - 56px)}
nav.side{background:#fff;border-right:1px solid #D2E5EE;padding:16px 10px;display:flex;flex-direction:column;gap:2px}
nav.side a{display:flex;justify-content:space-between;align-items:center;padding:9px 12px;border-radius:10px;text-decoration:none;font-weight:600}
nav.side a:hover{background:#F0F6F9}nav.side a[aria-current]{background:#E1EFF6;color:#123A6B}
.badge{background:#123A6B;color:#fff;border-radius:999px;font-size:12px;padding:1px 8px;font-weight:700}
main{padding:24px clamp(16px,3vw,40px);max-width:1180px;width:100%}
.hd{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:18px}.hd h1{font-size:24px}.hd .sub{color:#475B70}
.live{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid #D2E5EE;border-radius:999px;padding:5px 12px;font-weight:600;font-size:14px}
.live i{width:9px;height:9px;border-radius:50%;background:#1FAF5A;box-shadow:0 0 0 3px #1FAF5A33}
.card{background:#fff;border:1px solid #D2E5EE;border-radius:16px;padding:18px 20px;margin-bottom:16px}
.card h2{font-size:15px;margin-bottom:12px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:0;padding:0}
.kpi{padding:16px 20px;border-right:1px solid #E9F2F7}.kpi:last-child{border:0}
.kpi .l{color:#475B70;font-size:13px;font-weight:600}.kpi .v{font-family:Unbounded,system-ui;font-size:26px;margin-top:4px}.kpi .s{font-size:13px;color:#475B70}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.bars{display:flex;align-items:flex-end;gap:10px;height:170px;padding-top:10px}
.bar{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end}
.bar b{display:block;width:100%;max-width:46px;background:#123A6B;border-radius:8px 8px 3px 3px;min-height:3px}
.bar span{font-size:12px;color:#475B70}.bar em{font-style:normal;font-size:12px;font-weight:700}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:9px 8px;border-bottom:1px solid #E9F2F7;vertical-align:top}
th{font-size:12px;color:#475B70;font-weight:700}td.n{text-align:right;font-variant-numeric:tabular-nums}
.empty{color:#475B70;padding:8px 0}
.msg{border-bottom:1px solid #E9F2F7;padding:14px 0}.msg:last-child{border:0}.msg .who{font-weight:700}.msg .meta{color:#475B70;font-size:13px}
.msg p{white-space:pre-wrap;margin:8px 0}.msg.done{opacity:.55}
.muted{color:#475B70}.tag.ret{background:#E3F6E8;color:#14532D}.tag.new{background:#FFF1B8;color:#6B5200}.btn.sm{padding:6px 12px;font-size:13px}
.tl{list-style:none;margin:0;padding:0;border-left:3px solid #D2E5EE}.tl li{position:relative;padding:8px 0 12px 18px}.tl li::before{content:"";position:absolute;left:-8px;top:13px;width:13px;height:13px;border-radius:50%;background:#123A6B;border:3px solid #fff}.tl li.ev::before{background:#A9D9EC}.tl .h{color:#475B70;font-size:13px;font-variant-numeric:tabular-nums}
.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px 24px}.facts div span{display:block;font-size:12px;color:#475B70;font-weight:700}
@media(max-width:860px){.facts{grid-template-columns:1fr 1fr}}.tag.you{background:#0B1B33;color:#A9D9EC}.tag.vis{background:#E1EFF6;color:#123A6B}
.card{overflow-x:auto}
.tag{display:inline-block;font-size:12px;font-weight:700;border-radius:999px;padding:2px 9px;background:#FFF1B8;color:#6B5200}.tag.ok{background:#E3F6E8;color:#14532D}
button,.btn{font:inherit;font-weight:700;border:0;border-radius:999px;padding:9px 16px;cursor:pointer;background:#0B1B33;color:#fff;text-decoration:none;display:inline-block}
button.light{background:#E9F2F7;color:#0B1B33}button.danger{background:#FDE8E8;color:#7F1D1D}
form.inline{display:inline}
.fgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
label{display:flex;flex-direction:column;gap:4px;font-weight:600;font-size:13px}
input,select,textarea{font:inherit;font-weight:400;padding:9px 11px;border:1.5px solid #C2DCE8;border-radius:10px;background:#fff}
.money{font-family:Unbounded,system-ui;font-size:30px}
.login{min-height:100vh;display:grid;place-items:center;background:#123A6B}
.login form{background:#fff;border-radius:20px;padding:30px;width:min(360px,92vw);display:flex;flex-direction:column;gap:14px}
.err{background:#FDE8E8;color:#7F1D1D;border-radius:10px;padding:10px 12px;font-weight:600}
@media(max-width:860px){.layout{grid-template-columns:1fr}nav.side{flex-direction:row;overflow-x:auto;border-right:0;border-bottom:1px solid #D2E5EE}.kpis{grid-template-columns:1fr 1fr}.kpi:nth-child(2){border-right:0}.grid2,.fgrid{grid-template-columns:1fr}}
`;
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600;700&family=Instrument+Sans:wght@400;600;700&display=swap" rel="stylesheet">';
const LOGO = '<svg width="34" height="30" viewBox="0 0 46 40" aria-hidden="true"><path d="M6 6h32a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H20l-8 7v-7H6a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6z" fill="#A9D9EC"/><text x="22" y="25" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="17" fill="#0B1B33">a</text></svg>';

function page(title, current, body, counts = {}) {
  const item = (href, label, key, badge) =>
    `<a href="${href}"${current === key ? ' aria-current="page"' : ""}>${label}${badge ? `<span class="badge">${badge}</span>` : ""}</a>`;
  return html(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)} · Admin Studio Atlas</title><link rel="icon" href="/favicon.svg">${FONTS}<style>${CSS}</style></head><body>
<header class="top"><a class="brand" href="/admin">${LOGO}<span>Studio Atlas · Admin</span></a>
<div class="right"><a href="/" target="_blank" rel="noopener">Voir le site</a><a href="/admin/logout">Se déconnecter</a></div></header>
<div class="layout"><nav class="side">${item("/admin", "Accueil", "home")}${item("/admin/messages", "Messages", "messages", counts.nouveaux)}${item("/admin/clients", "Clients", "clients")}</nav>
<main>${body}</main></div></body></html>`);
}

function loginPage(error = "", status) {
  return html(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Connexion · Admin Studio Atlas</title><link rel="icon" href="/favicon.svg">${FONTS}<style>${CSS}</style></head><body class="login">
<form method="post" action="/admin/login">${LOGO}<h1 style="font-size:22px">Admin Studio Atlas</h1>
${error ? `<div class="err">${esc(error)}</div>` : ""}
<label>Mot de passe<input type="password" name="password" autocomplete="current-password" required autofocus></label>
<button type="submit">Se connecter</button></form></body></html>`, status || (error ? 401 : 200));
}

// ---------- pages ----------
const PAGE_NAMES = { "/": "Accueil", "/forfaits": "Forfaits", "/a-propos": "À propos", "/contact": "Contact", "/exemples": "Exemples", "/exemples/essentiel": "Exemple Essentiel (garage)", "/exemples/rendez-vous": "Exemple Rendez-vous (salon)", "/exemples/professionnel": "Exemple Professionnel (bistro)", "/exemples/entreprise": "Exemple Entreprise", "/exemples/boutique": "Exemple Boutique" };
const pageName = (p) => PAGE_NAMES[p] || p;

async function counts(env) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM messages WHERE traite = 0").first();
  return { nouveaux: r?.n || 0 };
}

const dureeTxt = (ms) => { const m = Math.floor(ms / 60e3), sec = Math.floor((ms % 60e3) / 1e3); return m >= 60 ? Math.floor(m / 60) + " h " + (m % 60) + " min" : m ? m + " min " + String(sec).padStart(2, "0") + " s" : sec + " s"; };
const lieu = (r) => [r.ville, r.region].filter(Boolean).join(", ") + (r.pays && r.pays !== "CA" ? (r.ville || r.region ? " · " : "") + r.pays : "") || "Inconnu";
const lieuPlus = (r) => esc(lieu(r)) + (r.cp ? ` <span class="muted">(${esc(r.cp)})</span>` : "") + (r.fai ? `<br><span class="muted">${esc(r.fai)}</span>` : "");
const retour = (r) => (r.nb_visites || 1) > 1 ? `<span class="tag ret">${num(r.nb_visites)}ᵉ visite</span>` : `<span class="tag new">Nouveau</span>`;
const dureeCourte = (ms) => !ms ? "—" : ms < 60e3 ? Math.round(ms / 1e3) + " s" : Math.floor(ms / 60e3) + " min " + String(Math.round((ms % 60e3) / 1e3)).padStart(2, "0") + " s";
const qui = (r) => r.moi ? '<span class="tag you">Vous</span>' : `<span class="tag vis">Visiteur ${esc(String(r.visiteur || "").slice(0, 4).toUpperCase())}</span>`;

async function liveData(env) {
  const now = Date.now();
  const rows = (await env.DB.prepare("SELECT * FROM presence WHERE dernier > ? ORDER BY moi ASC, debut ASC").bind(now - LIVE_MS).all()).results || [];
  const others = rows.filter((r) => !r.moi).length, mine = rows.length - others;
  const today = jourLocal(now);
  const t = await env.DB.prepare("SELECT COUNT(DISTINCT CASE WHEN moi = 0 THEN visiteur END) AS v, SUM(CASE WHEN moi = 0 THEN 1 ELSE 0 END) AS p, SUM(CASE WHEN moi = 1 THEN 1 ELSE 0 END) AS mp FROM visites WHERE jour = ?").bind(today).first();
  const recent = (await env.DB.prepare("SELECT * FROM visites ORDER BY ts DESC LIMIT 15").all()).results || [];
  const liveHtml = rows.length
    ? `<table><tr><th>Qui</th><th>Page en ce moment</th><th>Sur le site</th><th style="text-align:right">Pages</th><th style="text-align:right">Défilé</th><th>Provenance</th><th>Appareil</th><th>Lieu</th><th></th></tr>${rows.map((r) => `<tr>
<td>${qui(r)}<br>${retour(r)}</td><td><strong>${esc(pageName(r.page))}</strong></td><td>${dureeTxt(now - r.debut)}<br><span class="muted">actif ${dureeCourte(r.actif_ms)}</span></td><td class="n">${num(r.pages)}</td><td class="n">${num(r.scroll)} %</td>
<td>${esc(r.source || "Accès direct")}</td><td>${esc(r.appareil || "")}<br><span class="muted">${esc([r.navigateur, r.os].filter(Boolean).join(" · "))}</span></td><td>${lieuPlus(r)}</td>
<td><a class="btn sm" href="/admin/visite/${esc(r.session)}">Parcours</a></td></tr>`).join("")}</table>`
    : `<p class="empty">Personne sur le site en ce moment. Cette liste se met à jour toute seule.</p>`;
  const recentHtml = recent.length
    ? `<table><tr><th>Heure</th><th>Qui</th><th>Page</th><th style="text-align:right">Temps</th><th style="text-align:right">Défilé</th><th>Provenance</th><th>Appareil</th><th>Lieu</th></tr>${recent.map((r) => `<tr>
<td>${r.session ? `<a href="/admin/visite/${esc(r.session)}">` : ""}${esc(new Intl.DateTimeFormat("fr-CA", { timeZone: TZ, hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(r.ts)))}${r.session ? "</a>" : ""}</td><td>${qui(r)}</td>
<td>${esc(pageName(r.page))}</td><td class="n">${dureeCourte(r.duree_ms)}</td><td class="n">${r.scroll != null ? num(r.scroll) + " %" : "—"}</td><td>${esc(r.source || "Accès direct")}</td><td>${esc([r.appareil, r.navigateur].filter(Boolean).join(" · "))}</td><td>${lieuPlus(r)}</td></tr>`).join("")}</table>`
    : `<p class="empty">Aucune visite enregistrée pour l'instant.</p>`;
  const label = `${num(others)} visiteur${others > 1 ? "s" : ""} en ce moment` + (mine ? ` · ${mine === 1 ? "vous êtes" : "vous avez " + mine + " onglets"} sur le site` : "");
  return { others, mine, label, todayV: t?.v || 0, todayP: t?.p || 0, todayMine: t?.mp || 0, liveHtml, recentHtml, at: now };
}

async function home(env) {
  const now = Date.now();
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(jourLocal(now - i * 864e5));
  const since7 = days[0];
  const DB = env.DB;
  const [live, perDay, topPages, sources, devices, villes, clientsRow, msgs, v7row, actions, moy] = await Promise.all([
    liveData(env),
    DB.prepare("SELECT jour, COUNT(DISTINCT visiteur) AS v, COUNT(*) AS p FROM visites WHERE jour >= ? AND moi = 0 GROUP BY jour").bind(since7).all(),
    DB.prepare("SELECT page, COUNT(*) AS p, COUNT(DISTINCT visiteur) AS v FROM visites WHERE jour >= ? AND moi = 0 GROUP BY page ORDER BY p DESC LIMIT 8").bind(since7).all(),
    DB.prepare("SELECT source, COUNT(DISTINCT visiteur) AS v FROM visites WHERE jour >= ? AND moi = 0 GROUP BY source ORDER BY v DESC LIMIT 8").bind(since7).all(),
    DB.prepare("SELECT appareil, COUNT(DISTINCT visiteur) AS v FROM visites WHERE jour >= ? AND moi = 0 GROUP BY appareil ORDER BY v DESC").bind(since7).all(),
    DB.prepare("SELECT ville, region, pays, COUNT(DISTINCT visiteur) AS v FROM visites WHERE jour >= ? AND moi = 0 GROUP BY ville, region, pays ORDER BY v DESC LIMIT 8").bind(since7).all(),
    DB.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(prix_mois),0) AS mrr FROM clients WHERE actif = 1").first(),
    DB.prepare("SELECT * FROM messages ORDER BY ts DESC LIMIT 4").all(),
    DB.prepare("SELECT COUNT(DISTINCT visiteur) AS v FROM visites WHERE jour >= ? AND moi = 0").bind(since7).first(),
    DB.prepare("SELECT type, label, COUNT(*) AS n, COUNT(DISTINCT visiteur) AS v FROM evenements WHERE jour >= ? AND moi = 0 GROUP BY type, label ORDER BY n DESC LIMIT 12").bind(since7).all(),
    DB.prepare("SELECT AVG(duree_ms) AS d, AVG(scroll) AS sc FROM visites WHERE jour >= ? AND moi = 0 AND duree_ms > 0").bind(since7).first(),
  ]);
  const map = Object.fromEntries((perDay.results || []).map((r) => [r.jour, r]));
  const week = days.map((d) => ({ d, v: map[d]?.v || 0, p: map[d]?.p || 0 }));
  const max = Math.max(1, ...week.map((w) => w.v));
  const dayLabel = (d) => new Intl.DateTimeFormat("fr-CA", { weekday: "short", timeZone: "UTC" }).format(new Date(d + "T12:00:00Z")).replace(".", "");
  const c = await counts(env);
  const list = (rows, label, fmt) => rows.length
    ? `<table><tr><th>${label}</th><th style="text-align:right">Visiteurs</th></tr>${rows.map((r) => `<tr><td>${esc(fmt(r))}</td><td class="n">${num(r.v)}</td></tr>`).join("")}</table>`
    : `<p class="empty">Pas encore de données.</p>`;

  const body = `
<div class="hd"><h1>Accueil</h1><span class="live"><i></i><span id="live-label">${esc(live.label)}</span></span><span class="sub" id="live-upd">Mis à jour en direct</span></div>
<section class="card kpis">
  <div class="kpi"><div class="l">Visiteurs aujourd'hui</div><div class="v" id="k-today">${num(live.todayV)}</div><div class="s" id="k-today-s">${num(live.todayP)} pages vues${live.todayMine ? ` · sans vos ${num(live.todayMine)}` : ""}</div></div>
  <div class="kpi"><div class="l">Visiteurs (7 jours)</div><div class="v">${num(v7row?.v)}</div><div class="s">personnes différentes</div></div>
  <div class="kpi"><div class="l">Messages à traiter</div><div class="v">${num(c.nouveaux)}</div><div class="s"><a href="/admin/messages">Voir les messages</a></div></div>
  <div class="kpi"><div class="l">Revenu mensuel</div><div class="v">${money(clientsRow?.mrr)}</div><div class="s">${num(clientsRow?.n)} client${(clientsRow?.n || 0) > 1 ? "s" : ""} actif${(clientsRow?.n || 0) > 1 ? "s" : ""}</div></div>
</section>
<section class="card"><h2>En direct sur le site</h2><div id="live-table">${live.liveHtml}</div></section>
<section class="card"><h2>Ce que les visiteurs font (7 jours)</h2>
<p class="muted" style="margin:-4px 0 10px">Temps moyen par page : <strong>${dureeCourte(moy?.d)}</strong> · défilement moyen : <strong>${moy?.sc != null ? Math.round(moy.sc) + " %" : "—"}</strong></p>
${(actions.results || []).length ? `<table><tr><th>Action</th><th>Type</th><th style="text-align:right">Fois</th><th style="text-align:right">Visiteurs</th></tr>${actions.results.map((a) => `<tr><td>${esc(a.label || "(sans nom)")}</td><td>${esc({ clic: "Clic", formulaire: "Formulaire", test: "Test des forfaits" }[a.type] || a.type)}</td><td class="n">${num(a.n)}</td><td class="n">${num(a.v)}</td></tr>`).join("")}</table>` : `<p class="empty">Aucune action pour l'instant. Les clics sur les boutons et les liens, les formulaires et les résultats du test apparaîtront ici.</p>`}</section>
<section class="card"><h2>Visiteurs, 7 derniers jours</h2>
<div class="bars">${week.map((w) => `<div class="bar" title="${w.v} visiteurs, ${w.p} pages vues"><em>${w.v}</em><b style="height:${Math.round((w.v / max) * 120)}px"></b><span>${dayLabel(w.d)}</span></div>`).join("")}</div></section>
<section class="card"><h2>Dernières visites</h2><div id="recent-table">${live.recentHtml}</div></section>
<div class="grid2">
<section class="card"><h2>Pages les plus vues (7 jours)</h2>${topPages.results?.length ? `<table><tr><th>Page</th><th style="text-align:right">Vues</th></tr>${topPages.results.map((r) => `<tr><td>${esc(pageName(r.page))}</td><td class="n">${num(r.p)}</td></tr>`).join("")}</table>` : `<p class="empty">Pas encore de données.</p>`}</section>
<section class="card"><h2>D'où viennent les visiteurs (7 jours)</h2>${list(sources.results || [], "Source", (r) => r.source || "Accès direct")}</section>
<section class="card"><h2>Villes (7 jours)</h2>${list(villes.results || [], "Lieu", (r) => lieu(r))}</section>
<section class="card"><h2>Appareils (7 jours)</h2>${list(devices.results || [], "Appareil", (r) => r.appareil || "Inconnu")}</section>
<section class="card" style="grid-column:1/-1"><h2>Derniers messages</h2>${(msgs.results || []).length ? (msgs.results || []).map((m) => `<div class="msg${m.traite ? " done" : ""}"><span class="who">${esc(m.nom)}</span>${m.entreprise ? ` · ${esc(m.entreprise)}` : ""} ${m.traite ? '<span class="tag ok">Traité</span>' : '<span class="tag">Nouveau</span>'}<div class="meta">${esc(dateHeure(m.ts))}</div></div>`).join("") + `<p><a href="/admin/messages">Tous les messages</a></p>` : `<p class="empty">Aucun message pour l'instant.</p>`}</section>
</div>
<section class="card"><h2>Nettoyer les statistiques</h2>
<p class="muted" style="margin:-4px 0 12px">Efface les visites, les parcours et les actions. Les messages et les clients ne sont jamais touchés. Impossible d'annuler.</p>
<div style="display:flex;flex-wrap:wrap;gap:8px">
<form class="inline" method="post" action="/admin/nettoyer/moi" onsubmit="return confirm('Effacer toutes vos visites (marquées « Vous »)?')"><button class="light" type="submit">Effacer mes visites (« Vous »)</button></form>
<form class="inline guard" method="post" action="/admin/nettoyer/aujourdhui" data-n="2" data-title="Effacer les visites d’aujourd’hui"><input type="hidden" name="ok" value=""><button class="light" type="submit">Effacer aujourd'hui</button></form>
<form class="inline guard" method="post" action="/admin/nettoyer/7jours" data-n="3" data-title="Effacer les 7 derniers jours"><input type="hidden" name="ok" value=""><button class="light" type="submit">Effacer les 7 derniers jours</button></form>
<form class="inline guard" method="post" action="/admin/nettoyer/tout" data-n="5" data-title="Tout effacer, depuis le début"><input type="hidden" name="ok" value=""><button class="danger" type="submit">Tout effacer</button></form>
</div></section>
<div id="guard" hidden style="position:fixed;inset:0;z-index:50;background:rgba(16,18,58,.82)">
  <div id="guard-box" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;border-radius:18px;padding:20px 22px;width:min(380px,90vw);text-align:center;z-index:2">
    <h2 id="guard-title" style="font-size:17px;margin-bottom:6px"></h2>
    <p class="muted" id="guard-help" style="margin:0 0 14px"></p>
    <button id="guard-ok" class="danger" type="button" disabled style="opacity:.45">Confirmer</button>
    <button id="guard-cancel" class="light" type="button">Annuler</button>
  </div>
</div>
<script>
(function(){
  var ov=document.getElementById('guard'), box=document.getElementById('guard-box'), ok=document.getElementById('guard-ok'), help=document.getElementById('guard-help'), current=null, boxes=[];
  function close(){ ov.hidden=true; boxes.forEach(function(b){b.remove()}); boxes=[]; current=null; }
  function update(){ var left=boxes.filter(function(b){return !b.firstChild.checked}).length; ok.disabled=left>0; ok.style.opacity=left?'.45':'1'; help.textContent= left ? 'Cochez les '+boxes.length+' cases jaunes dispersées sur l’écran pour confirmer. Encore '+left+'.' : 'Toutes les cases sont cochées. Vous pouvez confirmer.'; }
  function overlaps(x,y){ var r=box.getBoundingClientRect(); return x>r.left-60&&x<r.right+20&&y>r.top-60&&y<r.bottom+20; }
  document.querySelectorAll('form.guard').forEach(function(f){
    f.addEventListener('submit',function(e){
      if(f.dataset.passed==='1') return;
      e.preventDefault(); current=f; ov.hidden=false;
      document.getElementById('guard-title').textContent=f.dataset.title+' ?';
      var n=+f.dataset.n, W=window.innerWidth, H=window.innerHeight, placed=[];
      for(var i=0;i<n;i++){
        var x,y,tries=0;
        do { x=20+Math.random()*(W-80); y=20+Math.random()*(H-80); tries++; }
        while(tries<300 && (overlaps(x,y) || placed.some(function(p){return Math.abs(p[0]-x)<90&&Math.abs(p[1]-y)<70;})));
        placed.push([x,y]);
        var l=document.createElement('label');
        l.style.cssText='position:absolute;left:'+x+'px;top:'+y+'px;background:#A9D9EC;border-radius:12px;padding:10px;cursor:pointer;display:flex;box-shadow:0 4px 14px rgba(0,0,0,.3)';
        l.innerHTML='<input type="checkbox" style="width:24px;height:24px;margin:0;cursor:pointer" aria-label="Case de confirmation '+(i+1)+'">';
        l.firstChild.addEventListener('change',update);
        ov.appendChild(l); boxes.push(l);
      }
      update();
    });
  });
  ok.addEventListener('click',function(){ if(!current||ok.disabled) return; var f=current; f.querySelector('input[name=ok]').value=f.dataset.n; f.dataset.passed='1'; close(); f.submit(); });
  document.getElementById('guard-cancel').addEventListener('click',close);
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&!ov.hidden) close(); });
})();
</script>

<p class="muted" style="font-size:13px">Vos visites sont marquées « Vous » (reconnues par ce navigateur ou votre adresse IP) et ne sont pas comptées dans les chiffres. Les adresses IP ne sont jamais conservées, seulement une empreinte chiffrée. La ville est estimée par Cloudflare.</p>
<script>
(function(){
  var last=Date.now();
  function tick(){
    fetch('/admin/api/live',{headers:{'Accept':'application/json'},cache:'no-store'}).then(function(r){ if(r.status===401){location.reload();return null;} return r.json(); }).then(function(d){
      if(!d) return; last=Date.now();
      document.getElementById('live-label').textContent=d.label;
      document.getElementById('live-table').innerHTML=d.liveHtml;
      document.getElementById('recent-table').innerHTML=d.recentHtml;
      document.getElementById('k-today').textContent=new Intl.NumberFormat('fr-CA').format(d.todayV);
      document.getElementById('k-today-s').textContent=new Intl.NumberFormat('fr-CA').format(d.todayP)+' pages vues'+(d.todayMine?' · sans vos '+d.todayMine:'');
    }).catch(function(){});
  }
  setInterval(function(){ if(document.visibilityState==='visible') tick(); },5000);
  setInterval(function(){ var s=Math.round((Date.now()-last)/1000); document.getElementById('live-upd').textContent= s<3 ? 'Mis à jour à l’instant' : 'Mis à jour il y a '+s+' s'; },1000);
  document.addEventListener('visibilitychange',function(){ if(document.visibilityState==='visible') tick(); });
})();
</script>`;
  return page("Accueil", "home", body, c);
}

async function messagesPage(env) {
  const rows = (await env.DB.prepare("SELECT * FROM messages ORDER BY traite ASC, ts DESC LIMIT 200").all()).results || [];
  const c = await counts(env);
  const body = `<div class="hd"><h1>Messages</h1><span class="sub">${num(c.nouveaux)} à traiter · reçus par le formulaire de contact</span></div>
<section class="card">${rows.length ? rows.map((m) => `
<div class="msg${m.traite ? " done" : ""}">
  <div><span class="who">${esc(m.nom)}</span>${m.entreprise ? ` · ${esc(m.entreprise)}` : ""} ${m.traite ? '<span class="tag ok">Traité</span>' : '<span class="tag">Nouveau</span>'}</div>
  <div class="meta">${esc(dateHeure(m.ts))} · ${esc(m.courriel)}${m.telephone ? ` · ${esc(m.telephone)}` : ""}${m.infolettre ? " · veut l'infolettre" : ""}</div>
  <p>${esc(m.message)}</p>
  <form class="inline" method="post" action="/admin/messages/${m.id}/${m.traite ? "rouvrir" : "traite"}"><button class="light" type="submit">${m.traite ? "Remettre à traiter" : "Marquer traité"}</button></form>
  <form class="inline" method="post" action="/admin/messages/${m.id}/supprimer" onsubmit="return confirm('Supprimer ce message?')"><button class="danger" type="submit">Supprimer</button></form>
</div>`).join("") : `<p class="empty">Aucun message pour l'instant. Ceux envoyés par le formulaire apparaîtront ici (et dans votre Gmail).</p>`}</section>`;
  return page("Messages", "messages", body, c);
}


async function parcoursPage(env, session) {
  const DB = env.DB;
  const pages = (await DB.prepare("SELECT * FROM visites WHERE session = ? ORDER BY ts").bind(session).all()).results || [];
  const evs = (await DB.prepare("SELECT * FROM evenements WHERE session = ? ORDER BY ts").bind(session).all()).results || [];
  const pres = await DB.prepare("SELECT * FROM presence WHERE session = ?").bind(session).first();
  const c = await counts(env);
  if (!pages.length && !pres) return page("Parcours", "home", `<div class="hd"><h1>Parcours introuvable</h1></div><p><a href="/admin">Retour à l'accueil</a></p>`, c);
  const f = pres || pages[0];
  const first = pages[0] || f;
  const enDirect = pres && pres.dernier > Date.now() - LIVE_MS;
  const items = [
    ...pages.map((p) => ({ ts: p.ts, html: `<li><span class="h">${esc(new Intl.DateTimeFormat("fr-CA", { timeZone: TZ, timeStyle: "medium" }).format(new Date(p.ts)))}</span><br><strong>A ouvert : ${esc(pageName(p.page))}</strong><br><span class="muted">${dureeCourte(p.duree_ms)} d'attention · défilé jusqu'à ${num(p.scroll)} % de la page</span></li>` })),
    ...evs.map((e) => ({ ts: e.ts, html: `<li class="ev"><span class="h">${esc(new Intl.DateTimeFormat("fr-CA", { timeZone: TZ, timeStyle: "medium" }).format(new Date(e.ts)))}</span><br>${esc({ clic: "A cliqué sur", formulaire: "Formulaire :", test: "" }[e.type] ?? e.type)} <strong>${esc(e.label || "(sans nom)")}</strong>${e.cible && e.type === "clic" && e.cible !== e.label ? ` <span class="muted">→ ${esc(e.cible)}</span>` : ""}<br><span class="muted">sur ${esc(pageName(e.page))}</span></li>` })),
  ].sort((a, b) => a.ts - b.ts);
  const map = f.lat && f.lon ? ` · <a href="https://www.openstreetmap.org/?mlat=${f.lat}&mlon=${f.lon}#map=11/${f.lat}/${f.lon}" target="_blank" rel="noopener">Voir la zone sur la carte</a>` : "";
  const body = `<p><a href="/admin">← Accueil</a></p>
<div class="hd"><h1>Parcours du ${f.moi ? "vôtre" : "visiteur " + esc(String(f.visiteur || "").slice(0, 4).toUpperCase())}</h1>${enDirect ? '<span class="live"><i></i>Sur le site en ce moment</span>' : ""}${qui(f)} ${retour(f)}</div>
<section class="card"><div class="facts">
<div><span>Arrivé</span>${esc(dateHeure(first.ts))}</div>
<div><span>Provenance</span>${esc(first.source || "Accès direct")}</div>
<div><span>Pages vues</span>${num(pages.length)} · ${dureeCourte(pages.reduce((s, p) => s + (p.duree_ms || 0), 0))} au total</div>
<div><span>Appareil</span>${esc([f.appareil, f.navigateur, f.os].filter(Boolean).join(" · "))}</div>
<div><span>Lieu (approximatif)</span>${esc(lieu(f))}${f.cp ? " · région postale " + esc(f.cp) : ""}${map}</div>
<div><span>Fournisseur Internet</span>${esc(f.fai || "Inconnu")}</div>
</div></section>
<section class="card"><h2>Ce qu'il a fait, dans l'ordre</h2>${items.length ? `<ul class="tl">${items.map((i) => i.html).join("")}</ul>` : `<p class="empty">Rien d'enregistré.</p>`}</section>
<form method="post" action="/admin/visite/${esc(session)}/supprimer" onsubmit="return confirm('Supprimer ce visiteur et tout son parcours?')" style="margin-bottom:10px"><button class="danger" type="submit">Supprimer ce visiteur</button></form>
${f.moi ? "" : `<form method="post" action="/admin/visite/${esc(session)}/moi"><button class="light" type="submit">C'est moi : marquer ce visiteur comme « Vous »</button></form>
<p class="muted" style="font-size:13px">Marque cet appareil et sa connexion Internet comme les vôtres. Ses visites ne compteront plus dans vos chiffres.</p>`}
<p class="muted" style="font-size:13px">La position vient de l'adresse du réseau, pas du GPS : elle indique la ville ou le quartier du fournisseur, parfois à quelques kilomètres près.</p>`;
  return page("Parcours", "home", body, c);
}

const FORFAITS = [["Essentiel", 30], ["Rendez-vous", 45], ["Professionnel", 60], ["Entreprise", 75], ["Boutique", 89], ["Autre", 0]];

async function clientsPage(env) {
  const rows = (await env.DB.prepare("SELECT * FROM clients ORDER BY actif DESC, nom COLLATE NOCASE").all()).results || [];
  const actifs = rows.filter((r) => r.actif);
  const mrr = actifs.reduce((s, r) => s + (r.prix_mois || 0), 0);
  const c = await counts(env);
  const body = `<div class="hd"><h1>Clients</h1><span class="sub">${num(actifs.length)} actif${actifs.length > 1 ? "s" : ""}</span></div>
<section class="card kpis" style="grid-template-columns:repeat(3,1fr)">
 <div class="kpi"><div class="l">Revenu mensuel récurrent</div><div class="v">${money(mrr)}</div></div>
 <div class="kpi"><div class="l">Sur 12 mois</div><div class="v">${money(mrr * 12)}</div></div>
 <div class="kpi"><div class="l">Clients actifs</div><div class="v">${num(actifs.length)}</div></div>
</section>
<section class="card"><h2>Liste</h2>${rows.length ? `<table><tr><th>Client</th><th>Forfait</th><th style="text-align:right">Par mois</th><th>Depuis</th><th>Statut</th><th></th></tr>${rows.map((r) => `<tr>
<td><strong>${esc(r.nom)}</strong>${r.site ? `<br><a href="${esc(/^https?:\/\//.test(r.site) ? r.site : "https://" + r.site)}" target="_blank" rel="noopener">${esc(r.site)}</a>` : ""}${r.telephone ? `<br>${esc(r.telephone)}` : ""}${r.notes ? `<br><span style="color:#475B70">${esc(r.notes)}</span>` : ""}</td>
<td>${esc(r.forfait)}</td><td class="n">${money(r.prix_mois)}</td><td>${esc(r.debut)}</td>
<td>${r.actif ? '<span class="tag ok">Actif</span>' : '<span class="tag">Annulé</span>'}</td>
<td style="white-space:nowrap"><form class="inline" method="post" action="/admin/clients/${r.id}/${r.actif ? "annuler" : "reactiver"}"><button class="light" type="submit">${r.actif ? "Annuler" : "Réactiver"}</button></form>
<form class="inline" method="post" action="/admin/clients/${r.id}/supprimer" onsubmit="return confirm('Supprimer ce client de la liste?')"><button class="danger" type="submit">Supprimer</button></form></td></tr>`).join("")}</table>` : `<p class="empty">Aucun client pour l'instant. Ajoutez votre premier client ci-dessous.</p>`}</section>
<section class="card"><h2>Ajouter un client</h2>
<form method="post" action="/admin/clients" class="fgrid">
<label>Nom du commerce<input name="nom" required maxlength="120"></label>
<label>Forfait<select name="forfait" onchange="var p=this.selectedOptions[0].dataset.prix;if(p)this.form.prix_mois.value=p">${FORFAITS.map(([n, p]) => `<option data-prix="${p || ""}">${n}</option>`).join("")}</select></label>
<label>Prix par mois ($)<input name="prix_mois" type="number" step="0.01" min="0" value="30" required></label>
<label>Client depuis<input name="debut" type="date" value="${jourLocal()}"></label>
<label>Site web<input name="site" placeholder="exemple.ca" maxlength="200"></label>
<label>Téléphone<input name="telephone" maxlength="40"></label>
<label style="grid-column:1/-1">Notes (options, domaine clé en main, etc.)<textarea name="notes" rows="2" maxlength="1000"></textarea></label>
<div><button type="submit">Ajouter le client</button></div></form></section>`;
  return page("Clients", "clients", body, c);
}

// ---------- routeur ----------
export async function handleAdmin(request, env, url) {
  const p = url.pathname.replace(/\/+$/, "") || "/admin";
  if (!env.DB) return html("Base de données non branchée.", 500);

  if (p === "/admin/login" && request.method === "POST") {
    const ip_h = await ipHash(request, env);
    const now = Date.now();
    // Blocage : 5 essais ratés en 15 minutes = 15 minutes d'attente pour cette connexion.
    const fails = await env.DB.prepare("SELECT COUNT(*) AS n FROM login_echecs WHERE ip_h = ? AND ts > ?").bind(ip_h, now - 15 * 60e3).first();
    if ((fails?.n || 0) >= 5) return loginPage("Trop d'essais ratés. Réessayez dans 15 minutes.", 429);
    const fd = await request.formData();
    const pw = String(fd.get("password") || "").slice(0, 200);
    if (!env.ADMIN_PASSWORD || !safeEqual(await sha(pw), await sha(env.ADMIN_PASSWORD))) {
      await env.DB.prepare("INSERT INTO login_echecs (ip_h, ts) VALUES (?, ?)").bind(ip_h, now).run();
      if (Math.random() < 0.1) await env.DB.prepare("DELETE FROM login_echecs WHERE ts < ?").bind(now - 864e5).run();
      await new Promise((r) => setTimeout(r, 800));
      const left = 4 - (fails?.n || 0);
      return loginPage(left > 0 ? `Mot de passe incorrect. Encore ${left} essai${left > 1 ? "s" : ""} avant un blocage de 15 minutes.` : "Trop d'essais ratés. Réessayez dans 15 minutes.", left > 0 ? 401 : 429);
    }
    await env.DB.prepare("DELETE FROM login_echecs WHERE ip_h = ?").bind(ip_h).run();
    const ts = String(Date.now());
    const val = ts + "." + (await hmac(env.ADMIN_PASSWORD + ":session", ts));
    const h = new Headers({ location: "/admin", "cache-control": "no-store" });
    h.append("set-cookie", `${COOKIE}=${val}; Path=/admin; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; Secure; SameSite=Strict`);
    h.append("set-cookie", `atlas_moi=1; Path=/; Max-Age=${365 * 86400}; Secure; SameSite=Lax`);
    return new Response(null, { status: 303, headers: h });
  }
  if (p === "/admin/logout") {
    return redirect("/admin", { "set-cookie": `${COOKIE}=; Path=/admin; Max-Age=0; HttpOnly; Secure; SameSite=Strict` });
  }
  if (!(await isLogged(request, env))) return p === "/admin/api/live" ? new Response("{}", { status: 401 }) : loginPage();
  try { await env.DB.prepare("INSERT INTO admin_ips (ip_h, dernier) VALUES (?, ?) ON CONFLICT(ip_h) DO UPDATE SET dernier = excluded.dernier").bind(await ipHash(request, env), Date.now()).run(); } catch {}
  if (p === "/admin/api/live") {
    return new Response(JSON.stringify(await liveData(env)), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  }

  if (request.method === "POST") {
    let m;
    if ((m = p.match(/^\/admin\/messages\/(\d+)\/(traite|rouvrir|supprimer)$/))) {
      const id = Number(m[1]);
      if (m[2] === "supprimer") await env.DB.prepare("DELETE FROM messages WHERE id = ?").bind(id).run();
      else await env.DB.prepare("UPDATE messages SET traite = ? WHERE id = ?").bind(m[2] === "traite" ? 1 : 0, id).run();
      return redirect("/admin/messages");
    }
    if (p === "/admin/clients") {
      const fd = await request.formData();
      const g = (k, n) => String(fd.get(k) || "").trim().slice(0, n);
      const nom = g("nom", 120);
      if (nom) {
        await env.DB.prepare("INSERT INTO clients (nom, forfait, prix_mois, debut, site, telephone, notes, actif, cree) VALUES (?,?,?,?,?,?,?,1,?)")
          .bind(nom, g("forfait", 40), Math.max(0, Number(fd.get("prix_mois")) || 0), g("debut", 10), g("site", 200), g("telephone", 40), g("notes", 1000), Date.now()).run();
      }
      return redirect("/admin/clients");
    }
    if ((m = p.match(/^\/admin\/clients\/(\d+)\/(annuler|reactiver|supprimer)$/))) {
      const id = Number(m[1]);
      if (m[2] === "supprimer") await env.DB.prepare("DELETE FROM clients WHERE id = ?").bind(id).run();
      else await env.DB.prepare("UPDATE clients SET actif = ? WHERE id = ?").bind(m[2] === "reactiver" ? 1 : 0, id).run();
      return redirect("/admin/clients");
    }
    if ((m = p.match(/^\/admin\/nettoyer\/(moi|aujourdhui|7jours|tout)$/))) {
      const need = { aujourdhui: "2", "7jours": "3", tout: "5" }[m[1]];
      if (need) { const fd = await request.formData(); if (String(fd.get("ok") || "") !== need) return redirect("/admin"); }
      const now = Date.now();
      const since = m[1] === "aujourdhui" ? jourLocal(now) : jourLocal(now - 6 * 864e5);
      const run = (sql, ...a) => env.DB.prepare(sql).bind(...a).run();
      if (m[1] === "moi") {
        await run("DELETE FROM visites WHERE moi = 1"); await run("DELETE FROM evenements WHERE moi = 1"); await run("DELETE FROM presence WHERE moi = 1");
      } else if (m[1] === "tout") {
        await run("DELETE FROM visites"); await run("DELETE FROM evenements"); await run("DELETE FROM presence");
      } else {
        await run("DELETE FROM presence WHERE session IN (SELECT session FROM visites WHERE jour >= ?)", since);
        await run("DELETE FROM visites WHERE jour >= ?", since); await run("DELETE FROM evenements WHERE jour >= ?", since);
      }
      return redirect("/admin");
    }
    if ((m = p.match(/^\/admin\/visite\/([a-z0-9]{1,40})\/supprimer$/i))) {
      for (const t of ["visites", "evenements", "presence"]) await env.DB.prepare(`DELETE FROM ${t} WHERE session = ?`).bind(m[1]).run();
      return redirect("/admin");
    }
    if ((m = p.match(/^\/admin\/visite\/([a-z0-9]{1,40})\/moi$/i))) {
      const row = await env.DB.prepare("SELECT ip_h, visiteur FROM presence WHERE session = ? UNION SELECT ip_h, visiteur FROM visites WHERE session = ? LIMIT 1").bind(m[1], m[1]).first();
      if (row) {
        const now = Date.now();
        if (row.ip_h) await env.DB.prepare("INSERT INTO admin_ips (ip_h, dernier) VALUES (?, ?) ON CONFLICT(ip_h) DO UPDATE SET dernier = excluded.dernier").bind(row.ip_h, now).run();
        for (const t of ["visites", "presence", "evenements"]) {
          await env.DB.prepare(`UPDATE ${t} SET moi = 1 WHERE session = ? OR (ip_h IS NOT NULL AND ip_h = ?) OR visiteur = ?`).bind(m[1], row.ip_h || "", row.visiteur || "").run();
        }
      }
      return redirect("/admin/visite/" + m[1]);
    }
    return redirect("/admin");
  }

  if (p === "/admin") return home(env);
  { const mv = p.match(/^\/admin\/visite\/([a-z0-9]{1,40})$/i); if (mv) return parcoursPage(env, mv[1]); }
  if (p === "/admin/messages") return messagesPage(env);
  if (p === "/admin/clients") return clientsPage(env);
  return redirect("/admin");
}

// ---------- comptage des visites (appelé par /api/v, depuis /stats.js) ----------
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptime|curl|wget|python|monitor/i;
const LIVE_MS = 45e3; // une page est « en direct » si elle a donné signe de vie dans les 45 dernières secondes

function parseUA(ua) {
  const nav = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Firefox\//.test(ua) ? "Firefox" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Autre";
  const os = /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X|Macintosh/.test(ua) ? "macOS" : /CrOS/.test(ua) ? "ChromeOS" : /Linux/.test(ua) ? "Linux" : "Autre";
  return { nav, os };
}
function cleanPage(p) {
  return String(p || "/").slice(0, 200).replace(/\.html$/, "").replace(/\/index$/, "/").replace(/\/+$/, "") || "/";
}
function sourceOf(d) {
  let source = "";
  try {
    const host = new URL(String(d.r || "")).hostname.replace(/^www\./, "");
    if (host && !host.endsWith("studioatlasrimouski.ca") && !host.endsWith("workers.dev") && host !== "lbdev777.github.io") {
      source = /google\./.test(host) ? "Google" : /facebook\.com|fb\.me|messenger/.test(host) ? "Facebook" : /instagram/.test(host) ? "Instagram" : /bing\./.test(host) ? "Bing" : host;
    }
  } catch {}
  if (!source && d.u) source = String(d.u).slice(0, 60);
  return source || null;
}
export async function ipHash(request, env) {
  return (await sha("ip|" + (request.headers.get("cf-connecting-ip") || "") + "|" + (env.ADMIN_PASSWORD || "atlas"))).slice(0, 16);
}

async function isMe(request, env, ip_h, now) {
  if (getCookie(request, "atlas_moi")) return 1;
  const admin = await env.DB.prepare("SELECT 1 AS x FROM admin_ips WHERE ip_h = ? AND dernier > ?").bind(ip_h, now - 60 * 864e5).first();
  return admin ? 1 : 0;
}

export async function recordVisit(request, env) {
  const ok = () => new Response(null, { status: 204 });
  if (!env.DB) return ok();
  const ua = request.headers.get("user-agent") || "";
  if (BOT.test(ua)) return ok();
  const raw = await request.text();
  if (raw.length > 4000) return ok();
  let d = {};
  try { d = JSON.parse(raw); } catch {}
  const page = cleanPage(d.p);
  if (page.startsWith("/admin") || page.startsWith("/api")) return ok();
  const t = ["v", "h", "x", "e"].includes(d.t) ? d.t : "v";
  const id = (v, n) => String(v || "").replace(/[^a-z0-9]/gi, "").slice(0, n) || null;
  const session = id(d.s, 40), pv = id(d.pv, 16);
  const actif = Math.max(0, Math.min(Number(d.a) || 0, 6 * 3600e3));
  const sc = Math.max(0, Math.min(Number(d.sc) || 0, 100));
  const now = Date.now();
  const DB = env.DB;

  if (t === "h" || t === "x") {
    if (pv) await DB.prepare("UPDATE visites SET duree_ms = MAX(duree_ms, ?), scroll = MAX(scroll, ?) WHERE pv = ?").bind(actif, sc, pv).run();
    if (session) {
      const r = await DB.prepare("UPDATE presence SET dernier = ?, page = ?, scroll = ?, actif_ms = ? WHERE session = ?")
        .bind(t === "x" ? now - LIVE_MS - 1000 : now, page, sc, actif, session).run();
      if (t === "x" || (r.meta && r.meta.changes > 0)) return ok();
    } else return ok();
  }

  const jour = jourLocal(now);
  const ip_h = await ipHash(request, env);
  const visiteur = (await sha(ip_h + "|" + ua + "|" + jour)).slice(0, 16);
  const moi = await isMe(request, env, ip_h, now);

  if (t === "e") {
    const type = String(d.k || "action").slice(0, 20);
    await DB.prepare("INSERT INTO evenements (ts, jour, session, visiteur, ip_h, moi, page, type, label, cible) VALUES (?,?,?,?,?,?,?,?,?,?)")
      .bind(now, jour, session, visiteur, ip_h, moi, page, type, String(d.l || "").slice(0, 80), String(d.c || "").slice(0, 200)).run();
    return ok();
  }

  const { nav, os } = parseUA(ua);
  const w = Number(d.w) || 0;
  const appareil = w ? (w < 768 ? "Cellulaire" : w < 1100 ? "Tablette" : "Ordinateur") : "Inconnu";
  const cf = request.cf || {};
  const ville = cf.city || null, region = cf.region === "Quebec" ? "Québec" : cf.region || null, pays = cf.country || null;
  const cp = cf.postalCode ? String(cf.postalCode).slice(0, 3).toUpperCase() : null; // seulement la région postale (ex. G5L)
  const fai = cf.asOrganization ? String(cf.asOrganization).slice(0, 80) : null;
  const lat = cf.latitude ? Math.round(Number(cf.latitude) * 100) / 100 : null; // ~1 km, position approximative du réseau
  const lon = cf.longitude ? Math.round(Number(cf.longitude) * 100) / 100 : null;
  const nb = Math.max(1, Math.min(Number(d.n) || 1, 9999));
  const source = sourceOf(d);

  if (t === "v") {
    await DB.prepare("INSERT INTO visites (ts, jour, page, source, visiteur, appareil, session, ip_h, moi, navigateur, os, ville, region, pays, pv, duree_ms, scroll, cp, fai, lat, lon, nb_visites) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(now, jour, page, source, visiteur, appareil, session, ip_h, moi, nav, os, ville, region, pays, pv, 0, sc, cp, fai, lat, lon, nb).run();
  }
  if (session) {
    await DB.prepare(`INSERT INTO presence (session, visiteur, ip_h, moi, page, debut, dernier, pages, source, appareil, navigateur, os, ville, region, pays, cp, fai, lat, lon, scroll, actif_ms, nb_visites)
      VALUES (?,?,?,?,?,?,?,1,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(session) DO UPDATE SET page = excluded.page, dernier = excluded.dernier, moi = MAX(presence.moi, excluded.moi), scroll = excluded.scroll, actif_ms = excluded.actif_ms,
        pages = presence.pages + (CASE WHEN ? = 'v' THEN 1 ELSE 0 END)`)
      .bind(session, visiteur, ip_h, moi, page, now, now, source, appareil, nav, os, ville, region, pays, cp, fai, lat, lon, sc, actif, nb, t).run();
  }
  if (Math.random() < 0.03) await DB.prepare("DELETE FROM presence WHERE dernier < ?").bind(now - 864e5).run();
  return ok();
}
