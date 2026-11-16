// Statistiques de Studio Atlas Rimouski (aucun témoin publicitaire, aucun texte tapé n'est envoyé).
// Envoie : la visite de la page, un signal toutes les 15 s (temps actif, défilement), le départ,
// et les actions (clics sur liens et boutons, formulaire commencé/envoyé, résultat du test).
(function () {
  try {
    var SK = "atlas_sid", sid = sessionStorage.getItem(SK), nouvelleSession = !sid;
    if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem(SK, sid); }
    var nb = 1;
    try { nb = parseInt(localStorage.getItem("atlas_n") || "0", 10) || 0; if (nouvelleSession) { nb++; localStorage.setItem("atlas_n", String(nb)); } nb = Math.max(nb, 1); } catch (e) {}
    var pv = Math.random().toString(36).slice(2, 12);
    var q = new URLSearchParams(location.search);
    var actif = 0, depuis = document.visibilityState === "visible" ? Date.now() : 0, scroll = 0;
    var tempsActif = function () { return actif + (depuis ? Date.now() - depuis : 0); };
    var mesure = function () {
      var h = document.documentElement, total = h.scrollHeight - window.innerHeight;
      var pct = total <= 0 ? 100 : Math.round(((window.scrollY || h.scrollTop) / total) * 100);
      if (pct > scroll) scroll = Math.min(100, pct);
    };
    var send = function (t, extra) {
      var d = { t: t, s: sid, pv: pv, p: location.pathname, w: window.innerWidth, a: tempsActif(), sc: scroll };
      if (t === "v") { d.r = document.referrer; d.u = q.get("utm_source") || ""; d.n = nb; }
      if (extra) for (var k in extra) d[k] = extra[k];
      var body = JSON.stringify(d);
      if (t === "x" && navigator.sendBeacon) { navigator.sendBeacon("/api/v", body); return; }
      fetch("/api/v", { method: "POST", body: body, keepalive: true }).catch(function () {});
    };
    mesure();
    send("v");
    window.addEventListener("scroll", mesure, { passive: true });
    setInterval(function () { if (document.visibilityState === "visible") send("h"); }, 15000);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") { depuis = Date.now(); send("h"); }
      else { if (depuis) { actif += Date.now() - depuis; depuis = 0; } send("x"); }
    });
    window.addEventListener("pagehide", function () { send("x"); });
    var evt = function (k, l, c) { send("e", { k: k, l: String(l || "").replace(/\s+/g, " ").trim().slice(0, 80), c: String(c || "").slice(0, 200) }); };
    document.addEventListener("click", function (e) {
      var el = e.target && e.target.closest ? e.target.closest("a,button,[role=button],summary,label[for]") : null;
      if (!el || el.closest("input,textarea,select")) return;
      var label = el.getAttribute("aria-label") || el.innerText || el.getAttribute("title") || "";
      var cible = "";
      if (el.tagName === "A") {
        var href = el.getAttribute("href") || "";
        if (/^tel:/i.test(href)) cible = "Téléphone";
        else if (/^mailto:/i.test(href)) cible = "Courriel";
        else { try { var u = new URL(href, location.href); cible = u.origin === location.origin ? u.pathname + u.hash : u.hostname; } catch (x) { cible = href; } }
      }
      evt("clic", label || cible, cible);
    }, true);
    var commence = {};
    document.addEventListener("focusin", function (e) {
      var f = e.target && e.target.form;
      if (!f) return;
      var id = f.id || f.getAttribute("action") || "formulaire";
      if (commence[id]) return;
      commence[id] = 1;
      evt("formulaire", "Commencé", id);
    });
    window.addEventListener("atlas:evt", function (e) { var d = e.detail || {}; evt(d.k || "action", d.l, d.c); });
  } catch (e) {}
})();
