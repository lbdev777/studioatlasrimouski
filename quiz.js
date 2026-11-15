// Test « Trouvez votre forfait » — Studio Atlas Rimouski
(function () {
  var app = document.getElementById('quiz-app');
  if (!app) return;

  var css = document.createElement('style');
  css.textContent =
    '.qz{background:#10123A;color:#F4F5FF;border-radius:22px;padding:32px;display:flex;flex-direction:column;gap:20px}' +
    '.qz-step{font-size:13px;font-weight:700;letter-spacing:.2em;color:#A9B4FF}' +
    '.qz h3{margin:0;font-size:clamp(22px,3vw,30px);font-weight:900;line-height:1.15}' +
    '.qz-opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}' +
    '.qz-opt{font:inherit;font-size:17px;text-align:left;background:#F4F5FF;color:#10123A;border:2px solid #F4F5FF;border-radius:14px;padding:16px 18px;cursor:pointer;min-height:56px}' +
    '.qz-opt:hover,.qz-opt:focus-visible{background:#FFD84D;border-color:#FFD84D;outline:none}' +
    '.qz-bar{height:6px;background:#2A2E66;border-radius:999px;overflow:hidden}' +
    '.qz-bar span{display:block;height:100%;background:#FFD84D}' +
    '.qz-back{font:inherit;font-size:15px;background:none;border:none;color:#C8CCF0;text-decoration:underline;cursor:pointer;align-self:flex-start;padding:8px 0}' +
    '.qz-res{display:flex;flex-direction:column;gap:14px}' +
    '.qz-price{font-size:clamp(44px,7vw,64px);font-weight:900;line-height:1}' +
    '.qz-price small{font-size:20px;font-weight:500;color:#C8CCF0}' +
    '.qz ul{margin:0;padding-left:20px;font-size:17px;line-height:1.6;color:#C8CCF0}' +
    '.qz-note{font-size:14px;color:#9EA3D6}' +
    '.qz-ctas{display:flex;flex-wrap:wrap;gap:12px}' +
    '.qz-cta{background:#FFD84D;color:#10123A;padding:15px 24px;border-radius:999px;font-weight:700;text-decoration:none}' +
    '.qz-cta2{border:2px solid #F4F5FF;color:#F4F5FF;padding:13px 22px;border-radius:999px;font-weight:700;text-decoration:none}';
  css.textContent += '.qz-day{display:inline-block;background:#A9B4FF;color:#10123A;font-weight:700;padding:6px 12px;border-radius:999px;margin:8px 0 0}';
  document.head.appendChild(css);

  var PLANS = {
    E: { name: 'Essentiel', price: 30, setup: 99, why: 'Une page claire avec vos photos, votre horaire et un bouton pour appeler. C’est tout ce qu’il vous faut pour que vos clients vous trouvent.' },
    R: { name: 'Rendez-vous', price: 45, setup: 149, why: 'Vos clients remplissent une demande de rendez-vous (ou de candidature), vous la recevez par courriel et vous les rappelez pour confirmer.' },
    P: { name: 'Professionnel', price: 60, setup: 199, why: 'Un site qu’on explore : plusieurs pages, un menu ou un catalogue cliquable, une galerie et un formulaire de contact.' },
    N: { name: 'Entreprise', price: 75, setup: 249, why: 'Jusqu’à 10 pages, la version anglaise incluse et une section nouvelles et promos pour un contenu qui bouge.' },
    B: { name: 'Boutique', price: 89, setup: 349, why: 'Vos produits en ligne avec les tailles, un panier et le paiement sécurisé.' }
  };

  var QUESTIONS = [
    { key: 'goal', q: 'Sur votre site, vos clients doivent surtout…', opts: [
      ['E', 'Voir qui vous êtes, votre horaire et vous appeler'],
      ['R', 'Demander un rendez-vous, postuler ou demander une soumission'],
      ['P', 'Parcourir un menu, une galerie ou vos services en détail'],
      ['B', 'Acheter vos produits en ligne']] },
    { key: 'pages', q: 'Combien de pages imaginez-vous ?', opts: [
      ['1', 'Une seule, simple et claire'],
      ['5', 'De 2 à 5 pages'],
      ['10', 'De 6 à 10 pages']] },
    { key: 'en', q: 'Avez-vous besoin d’une version anglaise ?', opts: [
      ['non', 'Non, en français seulement'],
      ['oui', 'Oui, en français et en anglais']] },
    { key: 'change', q: 'À quelle fréquence votre horaire, votre menu ou vos prix changent-ils ?', opts: [
      ['rare', 'Rarement'],
      ['mois', 'Environ une fois par mois'],
      ['semaine', 'Chaque semaine']] },
    { key: 'domain', q: 'Avez-vous déjà un nom de domaine (ex. : votrecommerce.ca) ?', opts: [
      ['oui', 'Oui, j’en ai un'],
      ['non', 'Non, ou je ne sais pas ce que c’est']] }
  ];

  var answers = {};
  var step = 0;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function recommend(a) {
    var plan = a.goal;
    var extras = [];
    var notes = [];
    if (plan !== 'B') {
      if (a.pages === '10') plan = 'N';
      else if (a.pages === '5' && (plan === 'E' || plan === 'R')) {
        if (a.goal === 'R') extras.push({ label: 'Formulaire de rendez-vous supplémentaire', month: 3, setup: 29 });
        plan = 'P';
      }
    }
    if (a.en === 'oui' && (plan === 'E' || plan === 'R' || plan === 'P')) {
      extras.push({ label: 'Version anglaise', month: PLANS[plan].price / 2, setup: PLANS[plan].setup / 2 });
    }
    if (a.change === 'semaine') {
      if (plan === 'P' || plan === 'N' || plan === 'B') extras.push({ label: 'Menu ou horaire que vous modifiez vous-même', month: 10, setup: 99 });
      else notes.push('Vos mises à jour par texto sont gratuites, mais avec des changements chaque semaine, vous pourriez dépasser celles de votre forfait. On en parlera ensemble.');
    }
    if (a.domain === 'non') extras.push({ label: 'Domaine clé en main : on s’en occupe pour vous', month: 4, setup: 0 });
    var p = PLANS[plan];
    var month = p.price, setup = p.setup;
    extras.forEach(function (x) { month += x.month; setup += x.setup; });
    return { plan: p, extras: extras, notes: notes, month: month, setup: setup };
  }

  function money(n) { var r = Math.round(n * 100) / 100; return (r % 1 === 0 ? String(r) : r.toFixed(2)).replace('.', ',') + ' $'; }

  function render() {
    app.innerHTML = '';
    var box = el('div', 'qz');
    box.setAttribute('role', 'group');
    box.setAttribute('aria-live', 'polite');

    if (step < QUESTIONS.length) {
      var Q = QUESTIONS[step];
      box.appendChild(el('span', 'qz-step', 'QUESTION ' + (step + 1) + ' SUR ' + QUESTIONS.length));
      var bar = el('div', 'qz-bar'); var fill = el('span'); fill.style.width = ((step) / QUESTIONS.length * 100) + '%'; bar.appendChild(fill); box.appendChild(bar);
      box.appendChild(el('h3', null, Q.q));
      var opts = el('div', 'qz-opts');
      Q.opts.forEach(function (o) {
        var b = el('button', 'qz-opt', o[1]);
        b.type = 'button';
        b.addEventListener('click', function () { answers[Q.key] = o[0]; step++; render(); });
        opts.appendChild(b);
      });
      box.appendChild(opts);
      if (step > 0) {
        var back = el('button', 'qz-back', '← Question précédente');
        back.type = 'button';
        back.addEventListener('click', function () { step--; render(); });
        box.appendChild(back);
      }
    } else {
      var r = recommend(answers);
      var res = el('div', 'qz-res');
      res.appendChild(el('span', 'qz-step', 'NOTRE RECOMMANDATION'));
      res.appendChild(el('h3', null, 'Le forfait ' + r.plan.name));
      res.appendChild(el('p', null, r.plan.why));
      var price = el('div', 'qz-price', 'environ ' + money(r.month));
      var sm = el('small', null, ' / mois'); price.appendChild(sm);
      res.appendChild(price);
      if (r.plan.name === 'Essentiel' && r.month <= 31) { res.appendChild(el('p', 'qz-day', 'Oui : environ 1 $ par jour pour avoir votre site.')); }
      if (r.extras.length) {
        res.appendChild(el('span', null, 'Ce qu’on ajouterait :'));
        var ul = el('ul');
        ul.appendChild(el('li', null, 'Forfait ' + r.plan.name + ' : ' + money(r.plan.price) + ' / mois'));
        r.extras.forEach(function (x) { ul.appendChild(el('li', null, x.label + ' : +' + money(x.month) + ' / mois')); });
        res.appendChild(ul);
      }
      r.notes.forEach(function (n) { res.appendChild(el('p', null, n)); });
      res.appendChild(el('p', 'qz-note', 'Au départ : environ ' + money(r.setup) + ' de création (ceux du forfait sont offerts si vous payez l’année). Prix avant taxes, sans engagement. C’est une estimation : on confirme tout par écrit après un appel de 30 minutes.'));
      var ctas = el('div', 'qz-ctas');
      var c1 = el('a', 'qz-cta', 'Demander ma soumission'); c1.href = 'contact.html#contact';
      var c2 = el('a', 'qz-cta2', 'Refaire le test'); c2.href = '#quiz';
      c2.addEventListener('click', function (e) { e.preventDefault(); answers = {}; step = 0; render(); });
      ctas.appendChild(c1); ctas.appendChild(c2);
      res.appendChild(ctas);
      box.appendChild(res);
    }
    app.appendChild(box);
  }

  render();
})();
