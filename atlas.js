/* Studio Atlas Rimouski : interactions du site */
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function evt(k, l, c) { try { window.dispatchEvent(new CustomEvent('atlas:evt', { detail: { k: k, l: l, c: c || '' } })); } catch (e) {} }

  /* Mise à l'échelle des sites affichés dans un cadre */
  function fit() {
    $$('.frame[data-w]').forEach(function (f) {
      var s = f.clientWidth / +f.dataset.w;
      $$('iframe', f).forEach(function (i) { i.style.transform = 'scale(' + s + ')'; });
    });
  }
  addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(document.body);

  /* Apparition au chargement */
  requestAnimationFrame(function () { requestAnimationFrame(function () { doc.classList.add('loaded'); }); });

  /* En-tête : se cache quand on descend, revient quand on remonte */
  (function () {
    var hd = $('.hd'); if (!hd) return;
    var last = scrollY, ticking = false;
    function upd() {
      var y = scrollY;
      hd.classList.toggle('scrolled', y > 8);
      if (!reduce) hd.classList.toggle('hide', y > 240 && y > last && !document.body.classList.contains('sheet-open'));
      last = y; ticking = false;
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  })();

  /* Menu sur cellulaire */
  (function () {
    var btn = $('.menu-btn'), sheet = $('.sheet'); if (!btn || !sheet) return;
    var close = $('.sheet-close', sheet);
    function set(open) {
      sheet.classList.toggle('open', open);
      document.body.classList.toggle('sheet-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      sheet.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) setTimeout(function () { close.focus(); }, 50); else btn.focus();
    }
    btn.addEventListener('click', function () { set(true); });
    close.addEventListener('click', function () { set(false); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet.classList.contains('open')) set(false); });
    $$('a', sheet).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
  })();

  /* Révélations au défilement (une seule fois) */
  (function () {
    var els = $$('[data-reveal]'); if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    els.forEach(function (e) { io.observe(e); });
  })();

  /* Héros : le « site » de la phrase change de commerce */
  (function () {
    var card = $('#hero-card'); if (!card) return;
    var frames = $$('iframe', card), cap = $('#hero-cap'), cnt = $('#hero-count'), cover = $('a.cover', card);
    var data = JSON.parse(card.dataset.sites), i = 0, timer = null, scroller = null, paused = false, pret = false, suivant = null;
    // Connexion lente ou mode économie de données : un seul aperçu, pas de défilement automatique.
    var cx = navigator.connection, lent = !!(cx && (cx.saveData || /(^|-)2g|3g/.test(cx.effectiveType || '')));
    function charger(f) { if (f && !f.getAttribute('src')) f.setAttribute('src', f.dataset.src); }
    // On ne précharge que l'aperçu suivant, quelques secondes après que l'actuel est affiché.
    function prechargerSuivant() { clearTimeout(suivant); if (lent) return; suivant = setTimeout(function () { charger(frames[(i + 1) % frames.length]); }, 3500); }
    function scrollInside(f) {
      cancelAnimationFrame(scroller);
      if (reduce) return;
      var w; try { w = f.contentWindow; w.scrollTo(0, 0); } catch (e) { return; }
      var t0 = null, dur = 5200, start = 900;
      function step(ts) {
        if (!t0) t0 = ts;
        var k = (ts - t0 - start) / dur;
        if (k > 0) {
          var max; try { max = Math.max(0, w.document.documentElement.scrollHeight - w.innerHeight); } catch (e) { return; }
          var e = k >= 1 ? 1 : 1 - Math.pow(1 - k, 3);
          w.scrollTo(0, Math.min(max, 620) * e);
        }
        if (k < 1) scroller = requestAnimationFrame(step);
      }
      scroller = requestAnimationFrame(step);
    }
    function show(n, user) {
      i = (n + data.length) % data.length;
      frames.forEach(function (f, j) { f.classList.toggle('on', j === i); });
      var d = data[i];
      cap.innerHTML = '<b>' + d.n + '</b>, ' + d.k + '. Forfait ' + d.f + ', ' + d.p + ' par mois.';
      cnt.textContent = (i + 1) + ' / ' + data.length;
      cover.href = d.u; cover.setAttribute('aria-label', 'Ouvrir le site d\'exemple : ' + d.n);
      var f = frames[i];
      if (!pret) return;
      charger(f);
      if (f.contentDocument && f.contentDocument.readyState === 'complete' && f.contentWindow.location.href !== 'about:blank') { scrollInside(f); prechargerSuivant(); }
      else f.addEventListener('load', function () { if (frames[i] === f) { scrollInside(f); prechargerSuivant(); } }, { once: true });
      if (user) evt('essai', 'Héros : ' + d.n, 'hero');
    }
    function play() { if (reduce || paused || lent) return; clearInterval(timer); timer = setInterval(function () { show(i + 1); }, 7000); }
    $('#hero-prev').addEventListener('click', function () { show(i - 1, true); play(); });
    $('#hero-next').addEventListener('click', function () { show(i + 1, true); play(); });
    card.addEventListener('mouseenter', function () { paused = true; clearInterval(timer); });
    card.addEventListener('mouseleave', function () { paused = false; play(); });
    card.addEventListener('focusin', function () { paused = true; clearInterval(timer); });
    // Le premier aperçu attend que la page elle-même soit chargée.
    function demarrer() { pret = true; show(i); }
    show(0);
    if (document.readyState === 'complete') demarrer(); else window.addEventListener('load', demarrer, { once: true });
    play();
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearInterval(timer); else play(); });
  })();

  /* Échelle des prix */
  (function () {
    var g = $('#gauge'); if (!g) return;
    var items = $$('.g-item', g), panel = $('.g-panel', g), mobile = window.matchMedia('(max-width:980px)');
    function sel(n, user) {
      items.forEach(function (it, j) {
        var on = j === n;
        it.classList.toggle('on', on);
        $('.g-head', it).setAttribute('aria-expanded', on ? 'true' : 'false');
      });
      panel.innerHTML = $('.g-body', items[n]).innerHTML;
      if (user) evt('essai', 'Prix : ' + items[n].dataset.plan, 'echelle');
    }
    items.forEach(function (it, j) {
      $('.g-head', it).addEventListener('click', function () {
        if (mobile.matches && it.classList.contains('on')) { it.classList.remove('on'); return; }
        sel(j, true);
      });
    });
    sel(+(g.dataset.start || 0));
  })();

  /* Réalisations : aperçu du site survolé */
  (function () {
    var ix = $('#ix'); if (!ix) return;
    var lis = $$('.ix-list li', ix), view = $('.ix-view', ix), cap = $('.ix-cap', ix), url = $('.ix-url', ix);
    var frames = view ? $$('iframe', view) : [], vu = false, cur = 0;
    function sel(n) {
      cur = n;
      lis.forEach(function (li, j) { li.classList.toggle('on', j === n); });
      if (!view) return;
      var li = lis[n];
      frames.forEach(function (f, j) {
        if (j === n && vu && !f.getAttribute('src')) f.setAttribute('src', f.dataset.src);
        f.classList.toggle('on', j === n);
      });
      cap.textContent = li.dataset.cap; url.textContent = li.dataset.url;
    }
    lis.forEach(function (li, j) {
      li.addEventListener('mouseenter', function () { sel(j); });
      $('a', li).addEventListener('focus', function () { sel(j); });
    });
    if (view && 'IntersectionObserver' in window) {
      // Seul l'aperçu choisi se charge (au survol), et seulement quand la liste est près de l'écran.
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { vu = true; sel(cur); io.disconnect(); } }, { rootMargin: '300px' });
      io.observe(view);
    }
    sel(0);
  })();

  /* Démo : un texto change le site */
  (function () {
    var st = $('#ls-stage'); if (!st) return;
    var chat = $('.ls-chat'), page = $('.ls-page', st);
    var base = page.innerHTML;
    var tryBox = $('#ls-try');
    var chips = tryBox ? $$('[data-k]', tryBox) : [];
    var form = tryBox && $('.ls-form', tryBox);
    var timers = [], auto = true, running = false, busy = false;
    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function bubble(cls, text) {
      var d = document.createElement('div'); d.className = 'ls-msg ' + cls; d.textContent = text;
      chat.appendChild(d);
      requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add('in'); }); });
      while (chat.children.length > 5) chat.removeChild(chat.firstChild);
    }
    function typing(on) {
      var t = $('.ls-typing', chat);
      if (on && !t) { t = document.createElement('div'); t.className = 'ls-typing'; t.innerHTML = '<i></i><i></i><i></i>'; chat.appendChild(t); }
      if (!on && t) t.remove();
    }
    function q(s) { return page.querySelector(s); }
    function banner(text, gold) { var b = q('.ls-banner'); b.textContent = text; b.classList.toggle('gold', !!gold); b.classList.add('in'); }
    var S = {
      ferme: { me: "Salut! On ferme à 15 h vendredi, c'est la fête du quartier.", label: 'Fermer à 15 h vendredi',
        apply: function () { var f = q('.ls-fri'); f.classList.add('flash'); setTimeout(function () { f.classList.add('done'); }, 450); setTimeout(function () { f.classList.remove('flash'); }, 1600); banner('Vendredi : on ferme à 15 h (fête du quartier)'); } },
      plat: { me: 'Plat du jour : chaudrée de palourdes, 18 $.',
        apply: function () { var s = q('.ls-special'); s.innerHTML = '<div><small>Plat du jour</small><strong>Chaudrée de palourdes</strong></div><b>18 $</b>'; s.classList.add('on'); } },
      promo: { me: 'Ce soir, 2 pour 1 sur les desserts!',
        apply: function () { banner('Ce soir : 2 pour 1 sur les desserts', true); } },
      lundi: { me: "On sera fermés lundi, congé pour l'équipe.",
        apply: function () { var rows = q('.ls-hours'), first = rows.querySelector('div'); first.firstElementChild.textContent = 'Mardi au jeudi';
          var r = document.createElement('div'); r.className = 'ls-new-row'; r.innerHTML = '<span>Lundi</span><span style="color:#B5452B;font-weight:700">Fermé</span>'; rows.insertBefore(r, first); banner('Lundi : fermé (congé)'); } }
    };
    function lock(on) { chips.forEach(function (b) { b.disabled = on && !auto; }); if (form) $('button', form).disabled = on && !auto; }
    function run(sc, isAuto) {
      clear(); busy = true; lock(true);
      page.innerHTML = base; chat.innerHTML = '';
      at(300, function () { bubble('me', sc.me); });
      at(1300, function () { typing(true); });
      at(2500, function () { typing(false); bubble('them', "Parfait, je m'en occupe."); });
      at(3500, function () { sc.apply(); q('.ls-saved').classList.add('in'); });
      at(4400, function () { bubble('them', isAuto ? "C'est en ligne. Bon vendredi!" : "C'est en ligne!"); busy = false; lock(false); });
      if (isAuto) {
        at(5900, function () { bubble('me', 'Wow, déjà? Merci!'); });
        at(11000, function () { if (auto && running) run(S.ferme, true); });
      }
    }
    function userRun(sc, key) {
      if (busy && !auto) return;
      auto = false; running = false;
      chips.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.k === key ? 'true' : 'false'); });
      run(sc, false); evt('essai', 'Texto : ' + (sc.label || key), 'texto');
    }
    chips.forEach(function (b) { b.addEventListener('click', function () { userRun(S[b.dataset.k], b.dataset.k); }); });
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault(); var inp = $('input', form); var v = (inp.value || '').trim().slice(0, 70); if (!v) { inp.focus(); return; }
      inp.value = '';
      userRun({ me: v, label: 'personnalisé', apply: function () { banner(v); } }, 'perso');
    });
    if (reduce) { S.ferme.apply(); bubble('me', S.ferme.me); bubble('them', "Parfait, je m'en occupe."); bubble('them', "C'est en ligne. Bon vendredi!"); $$('.ls-msg', chat).forEach(function (m) { m.classList.add('in'); }); q('.ls-saved').classList.add('in'); return; }
    function start() { if (!auto || running) return; running = true; run(S.ferme, true); }
    function stop() { if (!auto) return; running = false; clear(); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? start() : stop(); }); }, { threshold: .35 }).observe(st);
    else start();
  })();

  /* Calculateur de prix */
  (function () {
    var c = $('#calc'); if (!c) return;
    var P = [
      { k: 'essentiel', n: 'Essentiel', m: 30, c: 99 },
      { k: 'rendez-vous', n: 'Rendez-vous', m: 45, c: 149 },
      { k: 'professionnel', n: 'Professionnel', m: 60, c: 199 },
      { k: 'entreprise', n: 'Entreprise', m: 75, c: 249 },
      { k: 'boutique', n: 'Boutique', m: 89, c: 349 }
    ];
    var needs = $$('[data-need]', c), opts = $$('[data-opt]', c), pbtn = $$('.calc-plans button', c), annual = $('#calc-annual', c);
    var manual = null, touched = false;
    function money(v) { return (Math.round(v * 100) / 100).toLocaleString('fr-CA', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' $'; }
    function rec() { var i = 0; needs.forEach(function (n) { if (n.checked) i = Math.max(i, +n.dataset.need); }); return i; }
    function calc() {
      var i = manual !== null ? manual : rec(), p = P[i];
      pbtn.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      var om = 0, names = [];
      opts.forEach(function (o) { if (o.checked) { om += +o.dataset.m; names.push(o.dataset.name); } });
      var monthly = p.m + om, yr = annual.checked;
      $('.co-plan', c).textContent = 'Forfait ' + p.n + (manual === null ? ', conseillé pour vous' : '');
      $('.co-price', c).innerHTML = money(monthly) + '<small>par mois</small>';
      $('.co-day', c).textContent = 'Environ ' + money(Math.round(monthly / 30 * 20) / 20) + ' par jour.';
      var dl = '<div><dt>Forfait ' + p.n + '</dt><dd>' + money(p.m) + ' / mois</dd></div>';
      opts.forEach(function (o) { if (o.checked) dl += '<div><dt>' + o.dataset.name + '</dt><dd>' + (+o.dataset.m ? '+' + money(+o.dataset.m) + ' / mois' : '') + (+o.dataset.c ? (+o.dataset.m ? '<br>' : '') + money(+o.dataset.c) + ' une fois' : '') + '</dd></div>'; });
      dl += '<div><dt>Création du site</dt><dd>' + (yr ? 'Offerte' : (p.k === 'essentiel' ? '99 $, ou 0 $ avec l\'aperçu' : money(p.c))) + '</dd></div>';
      if (yr) dl += '<div><dt>Forfait payé à l\'année</dt><dd>' + money(p.m * 10) + ' pour 12 mois</dd></div>';
      $('dl', c).innerHTML = dl;
      var qs = 'forfait=' + encodeURIComponent(p.n) + (names.length ? '&options=' + encodeURIComponent(names.join(', ')) : '') + (yr ? '&annuel=1' : '');
      $('.co-go', c).setAttribute('href', '/contact.html?' + qs + '#apercu');
    }
    function touch() { if (!touched) { touched = true; evt('essai', 'Calculateur utilisé', 'calculateur'); } calc(); }
    needs.forEach(function (n) { n.addEventListener('change', function () { manual = null; touch(); }); });
    opts.forEach(function (o) { o.addEventListener('change', touch); });
    annual.addEventListener('change', touch);
    pbtn.forEach(function (b, j) { b.addEventListener('click', function () { manual = j; touch(); }); });
    calc();
  })();

  /* Formulaires de demande d'aperçu */
  $$('form.contact-form').forEach(function (form) {
    var box = $('.status', form), btn = $('button[type=submit]', form), T0 = Date.now();
    function show(ok, msg) { box.hidden = false; box.className = 'status ' + (ok ? 'ok' : 'err'); box.textContent = msg; }
    if (window.URLSearchParams) {
      var q = new URLSearchParams(location.search);
      if (q.get('envoye')) show(true, 'Merci! Votre message est bien envoyé. On vous répond en un jour ouvrable.');
      if (q.get('erreur')) show(false, "Le message n'est pas parti. Vérifiez votre nom, votre courriel et votre message, ou écrivez à studioatlasrimouski@gmail.com.");
      var plan = q.get('forfait'), m = $('textarea[name=message]', form);
      if (plan && m && !m.value) m.value = 'Bonjour, le forfait ' + plan.slice(0, 40) + ' m\'intéresse' + (q.get('options') ? ', avec : ' + q.get('options').slice(0, 200) : '') + (q.get('annuel') ? ', payé à l\'année' : '') + '.\n\nMon commerce : ';
    }
    var started = false;
    form.addEventListener('focusin', function () { if (!started) { started = true; evt('formulaire', 'Commencé', 'apercu'); } });
    form.addEventListener('submit', function (e) {
      if (form.duree) form.duree.value = Date.now() - T0;
      if (!window.fetch) return;
      e.preventDefault();
      btn.disabled = true; var label = btn.textContent; btn.textContent = 'Envoi…';
      var BACKUP = 'https://studioatlasrimouski.louisbeaulieu33.workers.dev/api/contact';
      function post(u) { return fetch(u, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } }).then(function (r) { return r.json().then(function (d) { d.__json = true; return d; }, function () { return { ok: false, __json: false }; }); }); }
      post(form.action)
        .then(function (d) { return d.__json ? d : post(BACKUP); }, function () { return post(BACKUP); })
        .then(function (d) {
          if (d.ok) { evt('formulaire', 'Envoyé', 'apercu'); form.reset(); show(true, 'Merci! Votre message est bien envoyé. On vous répond en un jour ouvrable.'); }
          else show(false, d.error || "L'envoi n'a pas fonctionné. Écrivez à studioatlasrimouski@gmail.com.");
        })
        .catch(function () { show(false, 'Pas de connexion. Réessayez, ou écrivez à studioatlasrimouski@gmail.com.'); })
        .then(function () { btn.disabled = false; btn.textContent = label; box.scrollIntoView({ block: 'nearest' }); });
    });
  });

  /* Barre d'action sur cellulaire */
  (function () {
    var d = $('.dock'); if (!d) return;
    var stops = $$('.ask, .ft, #apercu');
    function blocked() { return stops.some(function (s) { var r = s.getBoundingClientRect(); return r.top < innerHeight - 60 && r.bottom > 0; }); }
    function upd() { d.classList.toggle('on', scrollY > 420 && !blocked()); }
    addEventListener('scroll', upd, { passive: true }); upd();
    $('a', d).addEventListener('click', function () { evt('clic', 'Barre mobile : aperçu', 'dock'); });
  })();

  fit();
})();
