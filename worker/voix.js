// Page « Voix » de l'admin : transforme un court texte en fichier MP3.
// Deux moteurs : ElevenLabs (voix naturelle, payée avec les crédits AI Gateway de Cloudflare)
// et MeloTTS (Workers AI, moins naturel, presque gratuit). Réservé à l'admin connecté.

const MAX = 400; // caractères par génération : garde le coût prévisible

export const VOIX = [
  ["JBFqnCBsd6RMkjVDRZzb", "George (homme, posé)"],
  ["onwK4e9ZLuTAKqWW03F9", "Daniel (homme, annonceur)"],
  ["nPczCjzI2devNBz1zQrb", "Brian (homme, grave)"],
  ["XB0fDUnXU5powFXDhCwa", "Charlotte (femme, chaleureuse)"],
  ["EXAVITQu4vr4xnZM5gnZ", "Sarah (femme, douce)"],
  ["Xb7hH8MSUJpSbSDYk0k2", "Alice (femme, claire)"],
];

export function voixBody(esc) {
  const opts = VOIX.map(([id, n]) => `<option value="${id}">${esc(n)}</option>`).join("");
  return `<h1>Voix</h1>
<section class="card" style="max-width:720px">
<p>Écrivez le texte, choisissez une voix, puis cliquez sur <b>Générer</b>. Vous pourrez l'écouter et télécharger le MP3.</p>
<form id="vx" style="display:grid;gap:12px">
<label>Texte (${MAX} caractères au plus)<textarea name="texte" rows="4" maxlength="${MAX}" required style="width:100%">Un site web pro, dès trente dollars par mois. Studio Atlas, Rimouski.</textarea></label>
<p class="meta" id="vx-n"></p>
<label>Qualité<select name="moteur"><option value="eleven">Naturelle (ElevenLabs, environ 1 cent par 100 caractères)</option><option value="melo">Rapide (MeloTTS, moins naturelle)</option></select></label>
<label id="vx-voix">Voix<select name="voix">${opts}</select></label>
<p class="meta">Astuce : écrivez les nombres en lettres (« trente dollars ») pour qu'ils soient bien lus.</p>
<button class="btn" type="submit">Générer</button>
</form>
<div id="vx-out" style="margin-top:16px"></div>
</section>
<script>
(function(){
  var f=document.getElementById('vx'),out=document.getElementById('vx-out'),n=document.getElementById('vx-n'),t=f.texte,vv=document.getElementById('vx-voix');
  function cpt(){var s=t.value.trim().split(/\\s+/).filter(Boolean).length;n.textContent=t.value.length+' caractères, environ '+Math.max(1,Math.round(s/2.6))+' s à voix haute';}
  t.addEventListener('input',cpt);cpt();
  f.moteur.addEventListener('change',function(){vv.style.display=f.moteur.value==='eleven'?'':'none';});
  f.addEventListener('submit',function(e){
    e.preventDefault();var b=f.querySelector('button');b.disabled=true;out.textContent='Génération en cours…';
    fetch('/admin/voix/generer',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({texte:t.value,voix:f.voix.value,moteur:f.moteur.value})})
    .then(function(r){if(r.ok)return r.blob();return r.json().then(function(j){throw new Error(j.erreur||('Erreur '+r.status));});})
    .then(function(bl){var u=URL.createObjectURL(bl);out.innerHTML='<audio controls autoplay src="'+u+'" style="width:100%"></audio><p><a class="btn" download="studio-atlas-voix.mp3" href="'+u+'">Télécharger le MP3</a></p>';})
    .catch(function(err){out.innerHTML='';var p=document.createElement('p');p.style.color='#B42318';p.textContent=err.message;out.appendChild(p);})
    .finally(function(){b.disabled=false;});
  });
})();
</script>`;
}

function b64ToBytes(s) { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }

async function versAudio(r) {
  if (r instanceof ReadableStream || r instanceof ArrayBuffer || r instanceof Uint8Array) return r;
  if (r instanceof Response) return r.body;
  const a = r && (r.audio || (r.result && r.result.audio));
  if (typeof a === "string") {
    if (/^https?:\/\//.test(a)) { const res = await fetch(a); if (!res.ok) throw new Error("Audio introuvable (" + res.status + ")"); return res.body; }
    return b64ToBytes(a);
  }
  throw new Error("Réponse inattendue du service de voix.");
}

export async function genererVoix(request, env) {
  const json = (o, s) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  if (!env.AI) return json({ erreur: "Le service d'IA n'est pas branché sur le site." }, 500);
  let d; try { d = await request.json(); } catch { return json({ erreur: "Requête invalide." }, 400); }
  const texte = String(d.texte || "").trim().slice(0, MAX);
  if (!texte) return json({ erreur: "Écrivez un texte." }, 400);
  try {
    let r;
    if (d.moteur === "melo") {
      r = await env.AI.run("@cf/myshell-ai/melotts", { prompt: texte, lang: "fr" });
    } else {
      const voix = VOIX.some(([id]) => id === d.voix) ? d.voix : VOIX[0][0];
      r = await env.AI.run("elevenlabs/eleven-multilingual-v2",
        { text: texte, voice_id: voix, language_code: "fr", output_format: "mp3_44100_128" },
        { gateway: { id: "default" } });
    }
    const audio = await versAudio(r);
    return new Response(audio, { headers: { "content-type": "audio/mpeg", "content-disposition": 'inline; filename="studio-atlas-voix.mp3"', "cache-control": "no-store" } });
  } catch (e) {
    const m = String(e && e.message || e);
    console.error("Voix", m.slice(0, 300));
    if (/credit|crédit|balance|402|billing|insufficient/i.test(m))
      return json({ erreur: "Pas assez de crédits Cloudflare pour ElevenLabs. Dans Cloudflare : AI > AI Gateway > Crédits, ajoutez un petit montant, puis réessayez. En attendant, essayez la qualité « Rapide »." }, 402);
    return json({ erreur: "La voix n'a pas pu être générée : " + m.slice(0, 200) }, 500);
  }
}
