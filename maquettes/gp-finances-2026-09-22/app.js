(() => {
  'use strict';
  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>[...root.querySelectorAll(s)];
  const menu=$('.menu-toggle'), nav=$('#mobile-nav');
  function closeMenu(){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Ouvrir le menu');nav.hidden=true;}
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Fermer le menu':'Ouvrir le menu');nav.hidden=!open;});
  $$('#mobile-nav a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  window.addEventListener('resize',()=>{if(innerWidth>1200)closeMenu();});
  const updateScroll=()=>{$('#header').classList.toggle('scrolled',scrollY>20);$('.mobile-cta').classList.toggle('visible',scrollY>380);};
  window.addEventListener('scroll',updateScroll,{passive:true});updateScroll();
  let lastFocus;
  function openDialog(id){if(!document.activeElement.closest('dialog'))lastFocus=document.activeElement;closeMenu();$$('dialog[open]').forEach(d=>d.close());const d=$(id);d.showModal();document.body.classList.add('modal-open');}
  $$('[data-book]').forEach(b=>b.addEventListener('click',()=>openDialog('#booking-dialog')));
  $$('[data-callback]').forEach(b=>b.addEventListener('click',()=>openDialog('#callback-dialog')));
  $$('[data-project]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();openDialog('#callback-dialog');$('#callback-form').elements.projet.value=b.dataset.project;}));
  $$('[data-privacy]').forEach(b=>b.addEventListener('click',()=>openDialog('#privacy-dialog')));
  $$('dialog').forEach(d=>{
    $('.dialog-close',d).addEventListener('click',()=>d.close());
    d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
    d.addEventListener('close',()=>{if(!$('dialog[open]'))document.body.classList.remove('modal-open');if(d.id==='video-dialog'){const v=$('video',d);v.pause();v.removeAttribute('src');v.load();}if(!$('dialog[open]'))lastFocus?.focus();});
  });
  $$('[data-video]').forEach(b=>b.addEventListener('click',()=>{const d=$('#video-dialog');$('#video-title').textContent=b.dataset.videoTitle;$('video',d).src=b.dataset.video;openDialog('#video-dialog');$('video',d).play().catch(()=>{});}));
  $('#callback-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const f=e.currentTarget,out=$('#callback-result'),btn=$('button[type=submit]',f);
    const show=(t,ok)=>{out.textContent=t;out.hidden=false;out.dataset.state=ok?'ok':'error';};
    if(!f.elements.consent.checked){show('Cochez la case pour que nous puissions vous rappeler.',false);return;}
    btn.disabled=true;
    const projet=f.elements.projet.value;
    try{
      const r=await fetch('/api/callback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        name:f.elements.prenom.value.trim(),phone:f.elements.telephone.value.trim(),
        source:'channel:site|path:'+location.pathname+'|projet:'+projet+(location.search?'|query:'+location.search.slice(1,120):'')
      })});
      const d=await r.json().catch(()=>({}));
      if(r.ok&&d.ok!==false){show('Merci, votre demande est bien reçue. Je vous rappelle au plus vite.',true);f.reset();window.gpTrack&&window.gpTrack('demande_rappel_envoyee',{sujet:projet});}
      else show('Nous n’avons pas pu enregistrer votre demande. Appelez-moi directement au 06 51 22 42 13.',false);
    }catch{show('Le service est momentanément indisponible. Appelez-moi directement au 06 51 22 42 13.',false);}
    finally{btn.disabled=false;out.scrollIntoView({block:'nearest'});}
  });
  const comparisons={
    assurance:{kicker:'Cas client · Assurance emprunteur',before:'Avant',after:'Après GP FINANCES',old:'32 710 €',value:'11 510 €',width:35.19,label:'Économie sur la durée totale du prêt',saving:'21 200 €',note:'Exemple issu d’un dossier client. Garanties équivalentes. Les économies varient selon la situation et le contrat.'},
    per:{kicker:'Illustration · PER',before:'Sans déduction du versement',after:'Avec déduction du versement',old:'13 000 €',value:'9 100 €',width:70,label:'Économie fiscale potentielle à l’entrée',saving:'3 900 €',note:'Effort d’épargne net illustratif pour 13 000 € de versement et une TMI de 30 %, avec un plafond disponible suffisant. Fiscalité à la sortie à prendre en compte.'}
  };
  function renderComparison(type){const c=comparisons[type],card=$('[data-comparison-card]');if(!card)return;card.dataset.comparisonCard=type;card.innerHTML=`<div class="comparison-top"><span>${c.kicker}</span><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg></div><div class="comparison-body"><div class="comparison-row"><div><p>${c.before}</p><strong>${c.old}</strong></div><div class="comparison-track"><span style="width:100%"></span></div></div><div class="comparison-row after"><div><p>${c.after}</p><strong>${c.value}</strong></div><div class="comparison-track"><span style="width:${c.width}%"></span></div></div><div class="saving-box"><span>${c.label}</span><strong>${c.saving}</strong></div><p class="comparison-note">${c.note}</p></div>`;}
  if($('[data-comparison-card]'))renderComparison($('[data-comparison-card]').dataset.comparisonCard);
  $$('[data-comparison]').forEach((b,i,all)=>{b.addEventListener('click',()=>{all.forEach(t=>{t.setAttribute('aria-selected',String(t===b));t.tabIndex=t===b?0:-1;});renderComparison(b.dataset.comparison);});b.tabIndex=i===0?0:-1;b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?all.length-1:(i+(e.key==='ArrowRight'?1:-1)+all.length)%all.length;all[j].click();all[j].focus();});});
  // Assurance de prêt : tout bouton de rendez-vous ou d'étude ouvre directement l'agenda de Gabriel.
  const CALENDLY_LOAN='https://calendly.com/gabriel-perbost/30min';
  if(document.body.dataset.service==='assurance-emprunteur'){
    document.addEventListener('click',e=>{
      const b=e.target.closest('[data-book],[data-project="Assurance emprunteur"]');
      if(!b)return;
      e.preventDefault();e.stopPropagation();
      window.open(CALENDLY_LOAN,'_blank','noopener');
    },true);
  }
  // Vidéo verticale (format smartphone) : la fenêtre s'adapte à la forme de la vidéo.
  const dialogVideo=$('#video-dialog video');
  if(dialogVideo)dialogVideo.addEventListener('loadedmetadata',()=>$('#video-dialog').classList.toggle('is-vertical',dialogVideo.videoHeight>dialogVideo.videoWidth));
})();
