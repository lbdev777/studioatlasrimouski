// Compteur de visites de Studio Atlas Rimouski (aucun témoin publicitaire).
// Envoie une visite à l'ouverture, un signal toutes les 20 s tant que la page est affichée, et un départ à la fermeture.
(function () {
  try {
    var KEY = "atlas_sid", sid = sessionStorage.getItem(KEY);
    if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem(KEY, sid); }
    var q = new URLSearchParams(location.search);
    var send = function (t) {
      var body = JSON.stringify({ t: t, s: sid, p: location.pathname, r: document.referrer, w: window.innerWidth, u: q.get("utm_source") || "" });
      if (t === "x" && navigator.sendBeacon) { navigator.sendBeacon("/api/v", body); return; }
      fetch("/api/v", { method: "POST", body: body, keepalive: true }).catch(function () {});
    };
    send("v");
    setInterval(function () { if (document.visibilityState === "visible") send("h"); }, 20000);
    document.addEventListener("visibilitychange", function () { send(document.visibilityState === "visible" ? "h" : "x"); });
    window.addEventListener("pagehide", function () { send("x"); });
  } catch (e) {}
})();
