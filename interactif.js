/* Studio Atlas : sections interactives */
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function evt(l, c){ try{ window.dispatchEvent(new CustomEvent('atlas:evt',{detail:{k:'essai',l:l,c:c||''}})); }catch(e){} }
  function fitScaled(){
    document.querySelectorAll('[data-w]').forEach(function(f){
      var s = f.clientWidth / +f.dataset.w;
      var t = f.querySelector('iframe');
      if (t) t.style.transform = 'scale(' + s + ')';
    });
  }
  window.addEventListener('resize', fitScaled);
  if (window.ResizeObserver) new ResizeObserver(fitScaled).observe(document.body);

  /* 1. Ligne texto à essayer */
  (function(){
    var st = document.getElementById('ls-stage'); if (!st) return;
    var chat = st.querySelector('.ls-chat'), page = st.querySelector('.ls-page');
    var base = page.innerHTML;
    var steps = [].slice.call(document.querySelectorAll('.ls-steps li'));
    var tryBox = document.getElementById('ls-try');
    var chips = tryBox ? [].slice.call(tryBox.querySelectorAll('[data-k]')) : [];
    var form = tryBox && tryBox.querySelector('.ls-form');
    var timers = [], auto = true, running = false, busy = false;
    function step(n){ steps.forEach(function(li){ li.classList.toggle('on', +li.dataset.k === n); }); }
    function at(ms, fn){ timers.push(setTimeout(fn, ms)); }
    function clear(){ timers.forEach(clearTimeout); timers = []; }
    function bubble(cls, text){
      var d = document.createElement('div'); d.className = 'ls-msg ' + cls + ' show'; d.textContent = text;
      chat.appendChild(d); requestAnimationFrame(function(){ requestAnimationFrame(function(){ d.classList.add('in'); }); });
      while (chat.children.length > 5) chat.removeChild(chat.firstChild);
      return d;
    }
    function typing(on){
      var t = chat.querySelector('.ls-typing');
      if (on && !t){ t = document.createElement('div'); t.className = 'ls-typing show'; t.innerHTML = '<i></i><i></i><i></i>'; chat.appendChild(t); }
      if (!on && t) t.remove();
    }
    function q(s){ return page.querySelector(s); }
    function banner(text, gold){ var b = q('.ls-banner'); b.textContent = text; b.classList.toggle('gold', !!gold); b.classList.add('in'); }
    var S = {
      ferme: { me:"Salut! On ferme à 15 h vendredi, c'est la fête du quartier.", label:'Fermer à 15 h vendredi',
        apply:function(){ var f=q('.ls-fri'); f.classList.add('flash'); setTimeout(function(){ f.classList.add('done'); },500); setTimeout(function(){ f.classList.remove('flash'); },1600); banner('Vendredi : on ferme à 15 h (fête du quartier)'); } },
      plat: { me:'Plat du jour : chaudrée de palourdes, 18 $.',
        apply:function(){ var s=q('.ls-special'); s.innerHTML='<div><small>Plat du jour</small><strong>Chaudrée de palourdes</strong></div><b>18 $</b>'; s.classList.add('on'); } },
      promo: { me:'Ce soir, 2 pour 1 sur les desserts!',
        apply:function(){ banner('Ce soir : 2 pour 1 sur les desserts', true); } },
      lundi: { me:"On sera fermés lundi, congé pour l'équipe.",
        apply:function(){ var rows=q('.ls-hours'); var first=rows.querySelector('div'); first.firstElementChild.textContent='Mardi au jeudi';
          var r=document.createElement('div'); r.className='ls-new-row'; r.innerHTML='<span>Lundi</span><span style="color:#B5452B;font-weight:700">Fermé</span>'; rows.insertBefore(r, first); banner('Lundi : fermé (congé)'); } }
    };
    function run(sc, isAuto){
      clear(); busy = true; lock(true);
      page.innerHTML = base; chat.innerHTML = ''; step(1);
      at(300, function(){ bubble('me', sc.me); });
      at(1300, function(){ typing(true); step(2); });
      at(2500, function(){ typing(false); bubble('them', "Parfait, je m'en occupe."); });
      at(3500, function(){ step(3); sc.apply(); q('.ls-saved').classList.add('in'); });
      at(4400, function(){ bubble('them', isAuto ? "C'est en ligne. Bon vendredi!" : "C'est en ligne!"); busy = false; lock(false); });
      if (isAuto){
        at(5900, function(){ bubble('me', 'Wow, déjà? Merci!'); });
        at(10500, function(){ if (auto && running) run(S.ferme, true); });
      }
    }
    function lock(on){ chips.forEach(function(b){ b.disabled = on && !auto; }); if (form) form.querySelector('button').disabled = on && !auto; }
    function userRun(sc, label){
      if (busy && !auto) return;
      auto = false; running = false;
      chips.forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.k === label ? 'true' : 'false'); });
      run(sc, false); evt('Texto : ' + (sc.label || label), 'texto');
    }
    chips.forEach(function(b){ b.addEventListener('click', function(){ userRun(S[b.dataset.k], b.dataset.k); }); });
    if (form) form.addEventListener('submit', function(e){
      e.preventDefault(); var inp = form.querySelector('input'); var v = (inp.value || '').trim().slice(0, 70); if (!v) { inp.focus(); return; }
      inp.value = '';
      userRun({ me:v, label:'personnalisé', apply:function(){ banner(v); } }, 'perso');
    });
    if (reduce){ S.ferme.apply(); bubble('me', S.ferme.me); bubble('them', "Parfait, je m'en occupe."); bubble('them', "C'est en ligne. Bon vendredi!"); q('.ls-saved').classList.add('in'); step(3); return; }
    function start(){ if (!auto || running) return; running = true; run(S.ferme, true); }
    function stop(){ if (!auto) return; running = false; clear(); }
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(es){ es.forEach(function(e){ e.isIntersecting ? start() : stop(); }); }, {threshold:.35}).observe(st);
    } else start();
  })();

  /* 3. Choisissez votre commerce */
  (function(){
    var box = document.getElementById('pick'); if (!box) return;
    var D = {
      resto:{f:'professionnel',n:'Bistro du Havre',t:'Professionnel',p:'60 $ par mois',d:'2 $ par jour',x:"Un site qu'on explore, pensé pour donner faim avant même d'arriver.",l:['Menu cliquable avec photos','Galerie et horaire toujours à jour','Jusqu\'à 5 pages']},
      salon:{f:'rendez-vous',n:'Salon Marée',t:'Rendez-vous',p:'45 $ par mois',d:'1,50 $ par jour',x:'Vos clients demandent un rendez-vous en ligne, vous rappelez pour confirmer.',l:['Demande de rendez-vous en 3 étapes','Les vraies dates disponibles','Vos services et vos prix']},
      garage:{f:'essentiel',n:'Garage Boréal',t:'Essentiel',p:'30 $ par mois',d:'1 $ par jour',x:"Tout ce qu'un client cherche en 5 secondes, sur une belle page.",l:['Horaire en direct (ouvert ou fermé)','Bouton pour appeler','Itinéraire en un geste']},
      boutique:{f:'boutique',n:'Atelier Fjord',t:'Boutique',p:'89 $ par mois',d:'moins de 3 $ par jour',x:'Vendez vos produits en ligne, avec un panier et un paiement sécurisé.',l:['Jusqu\'à 25 produits','Panier et paiement sécurisé','Cueillette ou livraison']},
      services:{f:'entreprise',n:'Nordet Chauffage & Plomberie',t:'Entreprise',p:'75 $ par mois',d:'2,50 $ par jour',x:'Un site complet pour une entreprise de services qui veut inspirer confiance.',l:['Jusqu\'à 10 pages','Français et anglais','Nouvelles et promotions']}
    };
    var tabs = [].slice.call(box.querySelectorAll('[data-ex]')), fr = document.getElementById('pick-frame'), ph = box.querySelector('.pick-phone');
    var info = box.querySelector('.pick-info');
    fr.addEventListener('load', function(){ ph.classList.remove('loading'); });
    function show(k, user){
      var d = D[k]; if (!d) return;
      tabs.forEach(function(b){ b.setAttribute('aria-selected', b.dataset.ex === k ? 'true' : 'false'); b.tabIndex = b.dataset.ex === k ? 0 : -1; });
      var src = 'exemples/' + d.f + '.html';
      if (fr.getAttribute('src') !== src){ ph.classList.add('loading'); fr.setAttribute('src', src); }
      info.querySelector('.pick-tag').textContent = d.t + ' : ' + d.p;
      info.querySelector('h3').textContent = d.n;
      info.querySelector('.pick-desc').textContent = d.x;
      info.querySelector('ul').innerHTML = d.l.map(function(x){ return '<li>' + x + '</li>'; }).join('');
      info.querySelector('.pick-go').setAttribute('href', src);
      info.querySelector('.pick-dayv').textContent = 'Environ ' + d.d + '.';
      if (user) evt('Commerce : ' + k, 'selecteur');
    }
    tabs.forEach(function(b, i){
      b.addEventListener('click', function(){ show(b.dataset.ex, true); });
      b.addEventListener('keydown', function(e){
        var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null; if (j === null) return;
        e.preventDefault(); var n = tabs[(j + tabs.length) % tabs.length]; n.focus(); show(n.dataset.ex, true);
      });
    });
    show('resto', false);
  })();

  /* 5. Le site se construit, étape par étape */
  (function(){
    var ph = document.getElementById('st-phone'); if (!ph) return;
    var lis = [].slice.call(document.querySelectorAll('.st-grid li[data-st]'));
    var cap = document.getElementById('st-cap');
    var caps = {1:'On apprend à connaître votre commerce.',2:'Votre site prend forme, avec vos couleurs.',3:'Il est en ligne, sécurisé.',4:'Un texto, et votre horaire est à jour.'};
    function set(n){ ph.dataset.st = n; lis.forEach(function(li){ li.classList.toggle('on', +li.dataset.st === n); }); if (cap) cap.textContent = caps[n]; }
    lis.forEach(function(li){ li.addEventListener('click', function(){ set(+li.dataset.st); stopCycle(); }); });
    set(1);
    if (reduce){ set(4); return; }
    var mobile = window.matchMedia('(max-width:900px)'), cyc = null, k = 1, visible = false;
    function startCycle(){ if (cyc) return; cyc = setInterval(function(){ k = k % 4 + 1; set(k); }, 2600); }
    function stopCycle(){ clearInterval(cyc); cyc = null; }
    if ('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (!mobile.matches && e.isIntersecting) set(+e.target.dataset.st); }); }, {rootMargin:'-45% 0px -45% 0px'});
      lis.forEach(function(li){ io.observe(li); });
      new IntersectionObserver(function(es){ es.forEach(function(e){ visible = e.isIntersecting; if (mobile.matches && visible) startCycle(); else stopCycle(); }); }, {threshold:.3}).observe(ph);
    }
  })();

  /* 6. Calculateur de prix */
  (function(){
    var c = document.getElementById('calc'); if (!c) return;
    var P = [
      {k:'essentiel',n:'Essentiel',m:30,c:99},
      {k:'rendez-vous',n:'Rendez-vous',m:45,c:149},
      {k:'professionnel',n:'Professionnel',m:60,c:199},
      {k:'entreprise',n:'Entreprise',m:75,c:249},
      {k:'boutique',n:'Boutique',m:89,c:349}
    ];
    var needs = [].slice.call(c.querySelectorAll('[data-need]')), opts = [].slice.call(c.querySelectorAll('[data-opt]'));
    var pbtn = [].slice.call(c.querySelectorAll('.calc-plans button')), annual = c.querySelector('#calc-annual');
    var manual = null, touched = false;
    function money(v){ return (Math.round(v * 100) / 100).toLocaleString('fr-CA', {minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2}) + ' $'; }
    function rec(){ var i = 0; needs.forEach(function(n){ if (n.checked) i = Math.max(i, +n.dataset.need); }); return i; }
    function calc(){
      var i = manual !== null ? manual : rec(), p = P[i];
      pbtn.forEach(function(b, j){ b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      var om = 0, oc = 0, names = [];
      opts.forEach(function(o){ if (o.checked){ om += +o.dataset.m; oc += +o.dataset.c; names.push(o.dataset.name); } });
      var monthly = p.m + om, yr = annual.checked;
      c.querySelector('.co-plan').textContent = 'Forfait ' + p.n + (manual === null ? ' (conseillé)' : '');
      c.querySelector('.co-price').innerHTML = money(monthly) + '<small>par mois</small>';
      var day = monthly / 30;
      c.querySelector('.co-day').textContent = 'Environ ' + money(Math.round(day * 20) / 20) + ' par jour';
      var dl = '';
      dl += '<div><dt>Forfait ' + p.n + '</dt><dd>' + money(p.m) + ' / mois</dd></div>';
      opts.forEach(function(o){ if (o.checked) dl += '<div><dt>' + o.dataset.name + '</dt><dd>' + (+o.dataset.m ? '+' + money(+o.dataset.m) + ' / mois' : '') + (+o.dataset.c ? (+o.dataset.m ? '<br>' : '') + money(+o.dataset.c) + ' une fois' : '') + '</dd></div>'; });
      var crea = yr ? 'Offerte' : (p.k === 'essentiel' ? '99 $, ou 0 $ avec l\'aperçu gratuit' : money(p.c));
      dl += '<div><dt>Création du site</dt><dd>' + crea + '</dd></div>';
      if (yr) dl += '<div><dt>Forfait payé à l\'année</dt><dd>' + money(p.m * 10) + ' pour 12 mois</dd></div>';
      c.querySelector('dl').innerHTML = dl;
      var q = 'forfait=' + encodeURIComponent(p.n) + (names.length ? '&options=' + encodeURIComponent(names.join(', ')) : '') + (yr ? '&annuel=1' : '');
      c.querySelector('.co-go').setAttribute('href', 'contact.html?' + q + '#contact');
    }
    function touch(){ if (!touched){ touched = true; evt('Calculateur utilisé', 'calculateur'); } calc(); }
    needs.forEach(function(n){ n.addEventListener('change', function(){ manual = null; touch(); }); });
    opts.forEach(function(o){ o.addEventListener('change', touch); });
    annual.addEventListener('change', touch);
    pbtn.forEach(function(b, j){ b.addEventListener('click', function(){ manual = j; touch(); }); });
    calc();
  })();

  /* Formulaire de contact prérempli depuis le calculateur */
  (function(){
    var f = document.getElementById('contact-form'); if (!f || !window.URLSearchParams) return;
    var u = new URLSearchParams(location.search), plan = u.get('forfait'); if (!plan) return;
    var m = f.querySelector('textarea[name=message]'); if (!m || m.value) return;
    m.value = 'Bonjour, le forfait ' + plan.slice(0, 40) + ' m\'intéresse' + (u.get('options') ? ', avec : ' + u.get('options').slice(0, 200) : '') + (u.get('annuel') ? ', payé à l\'année' : '') + '.\n\nMon commerce : ';
  })();

  /* 7. Barre collante sur cellulaire */
  (function(){
    if (/contact\.html/.test(location.pathname)) return;
    var b = document.createElement('div'); b.className = 'sa-sticky'; b.setAttribute('role', 'complementary'); b.setAttribute('aria-label', 'Aperçu gratuit');
    b.innerHTML = '<p><b>Votre site, avant de payer</b><span>Aperçu gratuit, dès 30 $/mois</span></p><a href="' + (location.pathname.indexOf('/exemples/') > -1 ? '../' : '') + 'contact.html#contact">Mon aperçu</a>';
    document.body.appendChild(b);
    b.querySelector('a').addEventListener('click', function(){ evt('Barre mobile : aperçu', 'barre'); });
    var stop = [].slice.call(document.querySelectorAll('.cta, footer, .sa-foot, #contact'));
    function blocked(){ return stop.some(function(s){ var r = s.getBoundingClientRect(); return r.top < innerHeight - 40 && r.bottom > 0; }); }
    function upd(){ b.classList.toggle('on', scrollY > 500 && !blocked()); }
    addEventListener('scroll', upd, {passive:true}); upd();
  })();

  fitScaled();
})();
