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
const html = (body, status = 200, headers = {}) =>
  new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", "referrer-policy": "same-origin", ...headers } });
const redirect = (to, headers = {}) => new Response(null, { status: 303, headers: { location: to, "cache-control": "no-store", ...headers } });

// ---------- gabarit ----------
const CSS = `
*{box-sizing:border-box}body{margin:0;font-family:"Instrument Sans",system-ui,sans-serif;background:#F1F2FA;color:#10123A;font-size:15px;line-height:1.5}
a{color:inherit}h1,h2{font-family:Unbounded,system-ui,sans-serif;letter-spacing:-.02em;margin:0}
.top{background:#10123A;color:#fff;display:flex;align-items:center;gap:16px;padding:12px 20px}
.top .brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:700}
.top .right{margin-left:auto;display:flex;gap:16px;align-items:center;font-size:14px}.top .right a{color:#C8CCF0;text-decoration:none}.top .right a:hover{color:#FFD84D}
.layout{display:grid;grid-template-columns:220px 1fr;min-height:calc(100vh - 56px)}
nav.side{background:#fff;border-right:1px solid #DADDF5;padding:16px 10px;display:flex;flex-direction:column;gap:2px}
nav.side a{display:flex;justify-content:space-between;align-items:center;padding:9px 12px;border-radius:10px;text-decoration:none;font-weight:600}
nav.side a:hover{background:#F1F2FA}nav.side a[aria-current]{background:#E6E8FF;color:#2335F5}
.badge{background:#2335F5;color:#fff;border-radius:999px;font-size:12px;padding:1px 8px;font-weight:700}
main{padding:24px clamp(16px,3vw,40px);max-width:1180px;width:100%}
.hd{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:18px}.hd h1{font-size:24px}.hd .sub{color:#4A4F7A}
.live{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid #DADDF5;border-radius:999px;padding:5px 12px;font-weight:600;font-size:14px}
.live i{width:9px;height:9px;border-radius:50%;background:#1FAF5A;box-shadow:0 0 0 3px #1FAF5A33}
.card{background:#fff;border:1px solid #DADDF5;border-radius:16px;padding:18px 20px;margin-bottom:16px}
.card h2{font-size:15px;margin-bottom:12px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:0;padding:0}
.kpi{padding:16px 20px;border-right:1px solid #ECEEFA}.kpi:last-child{border:0}
.kpi .l{color:#4A4F7A;font-size:13px;font-weight:600}.kpi .v{font-family:Unbounded,system-ui;font-size:26px;margin-top:4px}.kpi .s{font-size:13px;color:#4A4F7A}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.bars{display:flex;align-items:flex-end;gap:10px;height:170px;padding-top:10px}
.bar{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end}
.bar b{display:block;width:100%;max-width:46px;background:#2335F5;border-radius:8px 8px 3px 3px;min-height:3px}
.bar span{font-size:12px;color:#4A4F7A}.bar em{font-style:normal;font-size:12px;font-weight:700}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:9px 8px;border-bottom:1px solid #ECEEFA;vertical-align:top}
th{font-size:12px;color:#4A4F7A;font-weight:700}td.n{text-align:right;font-variant-numeric:tabular-nums}
.empty{color:#4A4F7A;padding:8px 0}
.msg{border-bottom:1px solid #ECEEFA;padding:14px 0}.msg:last-child{border:0}.msg .who{font-weight:700}.msg .meta{color:#4A4F7A;font-size:13px}
.msg p{white-space:pre-wrap;margin:8px 0}.msg.done{opacity:.55}
.muted{color:#4A4F7A}.tag.you{background:#10123A;color:#FFD84D}.tag.vis{background:#E6E8FF;color:#2335F5}
.card{overflow-x:auto}
.tag{display:inline-block;font-size:12px;font-weight:700;border-radius:999px;padding:2px 9px;background:#FFF1B8;color:#6B5200}.tag.ok{background:#E3F6E8;color:#14532D}
button,.btn{font:inherit;font-weight:700;border:0;border-radius:999px;padding:9px 16px;cursor:pointer;background:#10123A;color:#fff;text-decoration:none;display:inline-block}
button.light{background:#ECEEFA;color:#10123A}button.danger{background:#FDE8E8;color:#7F1D1D}
form.inline{display:inline}
.fgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
label{display:flex;flex-direction:column;gap:4px;font-weight:600;font-size:13px}
input,select,textarea{font:inherit;font-weight:400;padding:9px 11px;border:1.5px solid #C8CCF0;border-radius:10px;background:#fff}
.money{font-family:Unbounded,system-ui;font-size:30px}
.login{min-height:100vh;display:grid;place-items:center;background:#2335F5}
.login form{background:#fff;border-radius:20px;padding:30px;width:min(360px,92vw);display:flex;flex-direction:column;gap:14px}
.err{background:#FDE8E8;color:#7F1D1D;border-radius:10px;padding:10px 12px;font-weight:600}
@media(max-width:860px){.layout{grid-template-columns:1fr}nav.side{flex-direction:row;overflow-x:auto;border-right:0;border-bottom:1px solid #DADDF5}.kpis{grid-template-columns:1fr 1fr}.kpi:nth-child(2){border-right:0}.grid2,.fgrid{grid-template-columns:1fr}}
`;
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600;700&family=Instrument+Sans:wght@400;600;700&display=swap" rel="stylesheet">';
const LOGO = '<svg width="34" height="30" viewBox="0 0 46 40" aria-hidden="true"><path d="M6 6h32a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H20l-8 7v-7H6a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6z" fill="#FFD84D"/><text x="22" y="25" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="17" fill="#10123A">a</text></svg>';

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

function loginPage(error = "") {
  return html(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Connexion · Admin Studio Atlas</title><link rel="icon" href="/favicon.svg">${FONTS}<style>${CSS}</style></head><body class="login">
<form method="post" action="/admin/login">${LOGO}<h1 style="font-size:22px">Admin Studio Atlas</h1>
${error ? `<div class="err">${esc(error)}</div>` : ""}
<label>Mot de passe<input type="password" name="password" autocomplete="current-password" required autofocus></label>
<button type="submit">Se connecter</button></form></body></html>`, error ? 401 : 200);
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
const qui = (r) => r.moi ? '<span class="tag you">Vous</span>' : `<span class="tag vis">Visiteur ${esc(String(r.visiteur || "").slice(0, 4).toUpperCase())}</span>`;

async function liveData(env) {
  const now = Date.now();
  const rows = (await env.DB.prepare("SELECT * FROM presence WHERE dernier > ? ORDER BY moi ASC, debut ASC").bind(now - LIVE_MS).all()).results || [];
  const others = rows.filter((r) => !r.moi).length, mine = rows.length - others;
  const today = jourLocal(now);
  const t = await env.DB.prepare("SELECT COUNT(DISTINCT CASE WHEN moi = 0 THEN visiteur END) AS v, SUM(CASE WHEN moi = 0 THEN 1 ELSE 0 END) AS p, SUM(CASE WHEN moi = 1 THEN 1 ELSE 0 END) AS mp FROM visites WHERE jour = ?").bind(today).first();
  const recent = (await env.DB.prepare("SELECT * FROM visites ORDER BY ts DESC LIMIT 15").all()).results || [];
  const liveHtml = rows.length
    ? `<table><tr><th>Qui</th><th>Page en ce moment</th><th>Sur le site depuis</th><th style="text-align:right">Pages</th><th>Provenance</th><th>Appareil</th><th>Lieu</th></tr>${rows.map((r) => `<tr>
<td>${qui(r)}</td><td><strong>${esc(pageName(r.page))}</strong></td><td>${dureeTxt(now - r.debut)}</td><td class="n">${num(r.pages)}</td>
<td>${esc(r.source || "Accès direct")}</td><td>${esc(r.appareil || "")}<br><span class="muted">${esc([r.navigateur, r.os].filter(Boolean).join(" · "))}</span></td><td>${esc(lieu(r))}</td></tr>`).join("")}</table>`
    : `<p class="empty">Personne sur le site en ce moment. Cette liste se met à jour toute seule.</p>`;
  const recentHtml = recent.length
    ? `<table><tr><th>Heure</th><th>Qui</th><th>Page</th><th>Provenance</th><th>Appareil</th><th>Lieu</th></tr>${recent.map((r) => `<tr>
<td>${esc(new Intl.DateTimeFormat("fr-CA", { timeZone: TZ, hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(r.ts)))}</td><td>${qui(r)}</td>
<td>${esc(pageName(r.page))}</td><td>${esc(r.source || "Accès direct")}</td><td>${esc([r.appareil, r.navigateur].filter(Boolean).join(" · "))}</td><td>${esc(lieu(r))}</td></tr>`).join("")}</table>`
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
  const [live, perDay, topPages, sources, devices, villes, clientsRow, msgs, v7row] = await Promise.all([
    liveData(env),
    DB.prepare("SELECT jour, COUNT(DISTINCT visiteur) AS v, COUNT(*) AS p FROM visites WHERE jour >= ? AND moi = 0 GROUP BY jour").bind(since7).all(),
    DB.prepare("SELECT page, COUNT(*) AS p, COUNT(DISTINCT visiteur) AS v FROM visites WHERE jour >= ? AND moi = 0 GROUP BY page ORDER BY p DESC LIMIT 8").bind(since7).all(),
    DB.prepare("SELECT source, COUNT(DISTINCT visiteur) AS v FROM visites WHERE jour >= ? AND moi = 0 GROUP BY source ORDER BY v DESC LIMIT 8").bind(since7).all(),
    DB.prepare("SELECT appareil, COUNT(DISTINCT visiteur) AS v FROM visites WHERE jour >= ? AND moi = 0 GROUP BY appareil ORDER BY v DESC").bind(since7).all(),
    DB.prepare("SELECT ville, region, pays, COUNT(DISTINCT visiteur) AS v FROM visites WHERE jour >= ? AND moi = 0 GROUP BY ville, region, pays ORDER BY v DESC LIMIT 8").bind(since7).all(),
    DB.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(prix_mois),0) AS mrr FROM clients WHERE actif = 1").first(),
    DB.prepare("SELECT * FROM messages ORDER BY ts DESC LIMIT 4").all(),
    DB.prepare("SELECT COUNT(DISTINCT visiteur) AS v FROM visites WHERE jour >= ? AND moi = 0").bind(since7).first(),
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
<td><strong>${esc(r.nom)}</strong>${r.site ? `<br><a href="${esc(/^https?:\/\//.test(r.site) ? r.site : "https://" + r.site)}" target="_blank" rel="noopener">${esc(r.site)}</a>` : ""}${r.telephone ? `<br>${esc(r.telephone)}` : ""}${r.notes ? `<br><span style="color:#4A4F7A">${esc(r.notes)}</span>` : ""}</td>
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
    const fd = await request.formData();
    const pw = String(fd.get("password") || "");
    if (!env.ADMIN_PASSWORD || !safeEqual(await sha(pw), await sha(env.ADMIN_PASSWORD))) {
      await new Promise((r) => setTimeout(r, 800));
      return loginPage("Mot de passe incorrect.");
    }
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
    return redirect("/admin");
  }

  if (p === "/admin") return home(env);
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

export async function recordVisit(request, env) {
  const ok = () => new Response(null, { status: 204 });
  if (!env.DB) return ok();
  const ua = request.headers.get("user-agent") || "";
  if (BOT.test(ua)) return ok();
  let d = {};
  try { d = JSON.parse(await request.text()); } catch {}
  const page = cleanPage(d.p);
  if (page.startsWith("/admin") || page.startsWith("/api")) return ok();
  const t = d.t === "h" || d.t === "x" ? d.t : "v";
  const session = String(d.s || "").replace(/[^a-z0-9]/gi, "").slice(0, 40) || null;
  const now = Date.now();
  const DB = env.DB;

  if (t === "x") {
    if (session) await DB.prepare("UPDATE presence SET dernier = ? WHERE session = ?").bind(now - LIVE_MS - 1000, session).run();
    return ok();
  }
  const jour = jourLocal(now);
  const ip_h = await ipHash(request, env);
  const visiteur = (await sha(ip_h + "|" + ua + "|" + jour)).slice(0, 16);
  const admin = await DB.prepare("SELECT 1 AS x FROM admin_ips WHERE ip_h = ? AND dernier > ?").bind(ip_h, now - 30 * 864e5).first();
  const moi = getCookie(request, "atlas_moi") || admin ? 1 : 0;
  const { nav, os } = parseUA(ua);
  const w = Number(d.w) || 0;
  const appareil = w ? (w < 768 ? "Cellulaire" : w < 1100 ? "Tablette" : "Ordinateur") : "Inconnu";
  const cf = request.cf || {};
  const ville = cf.city || null, region = cf.region === "Quebec" ? "Québec" : cf.region || null, pays = cf.country || null;
  const source = sourceOf(d);

  if (t === "h") {
    const r = session ? await DB.prepare("UPDATE presence SET dernier = ?, page = ? WHERE session = ?").bind(now, page, session).run() : null;
    if (r && r.meta && r.meta.changes > 0) return ok();
    // pas de session connue (ex. page restée ouverte avant la mise à jour) : on la crée
  }
  if (t === "v") {
    await DB.prepare("INSERT INTO visites (ts, jour, page, source, visiteur, appareil, session, ip_h, moi, navigateur, os, ville, region, pays) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(now, jour, page, source, visiteur, appareil, session, ip_h, moi, nav, os, ville, region, pays).run();
  }
  if (session) {
    await DB.prepare(`INSERT INTO presence (session, visiteur, ip_h, moi, page, debut, dernier, pages, source, appareil, navigateur, os, ville, region, pays)
      VALUES (?,?,?,?,?,?,?,1,?,?,?,?,?,?,?)
      ON CONFLICT(session) DO UPDATE SET page = excluded.page, dernier = excluded.dernier, moi = excluded.moi,
        pages = presence.pages + (CASE WHEN ? = 'v' THEN 1 ELSE 0 END)`)
      .bind(session, visiteur, ip_h, moi, page, now, now, source, appareil, nav, os, ville, region, pays, t).run();
  }
  if (Math.random() < 0.03) await DB.prepare("DELETE FROM presence WHERE dernier < ?").bind(now - 864e5).run();
  return ok();
}
