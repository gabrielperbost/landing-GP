(() => {
  'use strict';
  const form=document.querySelector('#life-form'),model=window.GPLifeCalculator;
  if(!form||!model)return;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const euro=v=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Math.abs(v)<.5?0:v);
  const number=v=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(v);
  const signed=v=>`${v>=.5?'+':''}${euro(v)}`;
  const yearsText=n=>`${n} an${n>1?'s':''}`;
  const increments={initial:500,monthly:25,years:1,rate:.1};
  const rangeDefaults={initial:100000,monthly:2000,years:40,rate:10};
  const messages={initial:'Indiquez un versement initial entre 0 et 500 000 €.',monthly:'Indiquez un versement mensuel entre 0 et 10 000 €.',years:'Choisissez un nombre entier d’années, de 1 à 40.',rate:'Choisissez un rendement hypothétique entre −5 % et +10 %.'};
  let result=null,geometry=null,hoverYear=20,announceTimer,resizeFrame;
  const setText=(s,v)=>$(s).textContent=v;
  function values(){return Object.fromEntries(Object.keys(model.LIMITS).map(key=>[key,form.elements[key].value]));}
  function coordinatePath(points,x,y,key){return points.map((p,i)=>`${i?'L':'M'}${x(p.year).toFixed(2)},${y(p[key]).toFixed(2)}`).join(' ');}
  function compact(v){return new Intl.NumberFormat('fr-FR',{notation:'compact',maximumFractionDigits:1}).format(v)+' €';}
  function updateMarker(year){
    if(!result?.valid||!geometry)return;
    hoverYear=Math.max(0,Math.min(result.years,year));
    const p=result.points[hoverYear],{x,y,top,bottom}=geometry;
    const line=$('#life-marker-line');
    line.setAttribute('x1',x(p.year));line.setAttribute('x2',x(p.year));line.setAttribute('y1',top);line.setAttribute('y2',bottom);
    for(const [id,key] of [['#life-marker-capital','capital'],['#life-marker-paid','paid']]){$(id).setAttribute('cx',x(p.year));$(id).setAttribute('cy',y(p[key]));}
    setText('#life-chart-readout',`${p.year===0?'Au départ':`À ${yearsText(p.year)}`} · Capital : ${euro(p.capital)} · Versé : ${euro(p.paid)}`);
  }
  function drawChart(){
    if(!result?.valid)return;
    const svg=$('#life-chart'),width=Math.max(250,svg.getBoundingClientRect().width),height=width<430?240:300;
    const left=58,right=16,top=20,bottom=height-35;
    const maxValue=Math.max(1,...result.points.flatMap(p=>[p.capital,p.paid]));
    const scale=Math.pow(10,Math.floor(Math.log10(maxValue))),ceiling=Math.ceil(maxValue/scale*2)/2*scale;
    const x=year=>left+year/result.years*(width-left-right),y=value=>bottom-value/ceiling*(bottom-top);
    geometry={x,y,top,bottom,left,right,width};
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    svg.setAttribute('aria-label',`Projection : ${euro(result.final.capital)} dans ${yearsText(result.years)}. Flèches gauche et droite pour explorer chaque année.`);
    const capital=coordinatePath(result.points,x,y,'capital'),paid=coordinatePath(result.points,x,y,'paid');
    const grid=[0,1,2,3,4].map(i=>{const v=ceiling*i/4;return `<line x1="${left}" x2="${width-right}" y1="${y(v)}" y2="${y(v)}" stroke="#ffffff16"/><text x="${left-10}" y="${y(v)+4}" text-anchor="end" fill="#bcc9d9" font-size="10">${compact(v)}</text>`;}).join('');
    const labels=[...new Set([0,Math.round(result.years/4),Math.round(result.years/2),Math.round(result.years*3/4),result.years])].map(n=>`<text x="${x(n)}" y="${height-10}" text-anchor="${n===0?'start':n===result.years?'end':'middle'}" fill="#bcc9d9" font-size="11">${n===0?'Départ':yearsText(n)}</text>`).join('');
    svg.innerHTML=`<defs><linearGradient id="life-capital-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e8c97a" stop-opacity=".28"/><stop offset="100%" stop-color="#e8c97a" stop-opacity=".015"/></linearGradient></defs>${grid}<path d="${capital} L${x(result.years)},${bottom} L${left},${bottom} Z" fill="url(#life-capital-fill)"/><path d="${paid}" fill="none" stroke="#afc2d9" stroke-width="2" stroke-dasharray="5 5"/><path d="${capital}" fill="none" stroke="#e8c97a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${labels}<line id="life-marker-line" stroke="#ffffff60" stroke-width="1" stroke-dasharray="3 4"/><circle id="life-marker-paid" r="3" fill="#afc2d9"/><circle id="life-marker-capital" r="5" fill="#e8c97a" stroke="#0d1f3c" stroke-width="2"/>`;
    updateMarker(Math.min(hoverYear,result.years));
    const mini=$('#life-hero-chart');
    if(mini){
      const mx=n=>8+n/result.years*424,my=v=>106-v/ceiling*94;
      const line=coordinatePath(result.points,mx,my,'capital');
      mini.innerHTML=`<path d="${line} L432,110 L8,110 Z" fill="#e8c97a12"/><path d="${coordinatePath(result.points,mx,my,'paid')}" fill="none" stroke="#9cb2ce" stroke-width="1.5" stroke-dasharray="4 4"/><path d="${line}" fill="none" stroke="#e8c97a" stroke-width="3" stroke-linecap="round"/><circle cx="432" cy="${my(result.final.capital)}" r="4" fill="#e8c97a"/>`;
      mini.setAttribute('aria-label',`Évolution simulée jusqu’à ${euro(result.final.capital)} à ${yearsText(result.years)}.`);
    }
  }
  function clearResult(){
    for(const selector of ['#life-capital','#life-mobile-capital','#life-paid','#life-fees','#life-performance','[data-life-capital]']){const el=$(selector);if(el)el.textContent='—';}
    $('#life-chart').innerHTML='';$('#life-year-rows').innerHTML='';$('#life-hero-chart').innerHTML='';
    setText('#life-chart-readout','Corrigez le champ indiqué pour recalculer votre projection.');
    setText('#life-result-subtitle','Projection en attente de données valides.');
    setText('[data-life-hero-assumptions]','Corrigez votre scénario dans le simulateur.');
  }
  // Assurance-vie : le résultat se met à jour en direct. La simulation est « faite » quand le visiteur a modifié au moins deux réglages puis s'est arrêté 6 secondes.
  let touches=0,engagedTimer,notified=false;
  function touch(){
    if(notified)return;touches++;clearTimeout(engagedTimer);
    if(touches>=2)engagedTimer=setTimeout(()=>{
      if(!result||!result.valid||notified)return;notified=true;
      window.dispatchEvent(new CustomEvent('gp:simulation-result',{detail:{type:'assurance_vie',summary:{
        versement_initial:Math.round(result.initial),versement_mensuel:Math.round(result.monthly),duree_ans:result.years,hypothese_rendement_pourcent:result.rate,capital_projete:Math.round(result.final.capital)}}}));
    },6000);
  }
  function update(announce=true){
    const input=values();result=model.project(input);
    form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
    $('#life-error').hidden=result.valid;
    if(!result.valid){
      result.errors.forEach(key=>form.elements[key].setAttribute('aria-invalid','true'));
      setText('#life-error',messages[result.errors[0]]);clearResult();return;
    }
    for(const [key,value] of Object.entries(input)){
      const range=$(`[data-life-range="${key}"]`),[min,hardMax]=model.LIMITS[key];
      const max=key==='initial'||key==='monthly'?Math.min(hardMax,Math.max(rangeDefaults[key],Math.ceil(Number(value)/rangeDefaults[key])*rangeDefaults[key])):hardMax;
      range.max=max;range.value=value;
      range.style.setProperty('--life-fill',`${(Number(value)-min)/(max-min)*100}%`);
      range.setAttribute('aria-valuetext',key==='years'?yearsText(Number(value)):key==='rate'?`${number(Number(value))} pour cent par an`:euro(Number(value)));
      if(key==='initial'||key==='monthly')$(`[data-life-control="${key}"] .life-range-ends span:last-child`).textContent=euro(max)+(key==='monthly'?'/mois':'');
      $$(`[data-life-step="${key}"]`).forEach(button=>button.disabled=Number(button.dataset.direction)<0?Number(value)<=min:Number(value)>=hardMax);
    }
    $$('[data-life-years]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.lifeYears)===result.years)));
    $$('[data-life-horizon]').forEach(el=>el.textContent=yearsText(result.years));
    const final=result.final;
    setText('#life-capital',euro(final.capital));setText('[data-life-capital]',euro(final.capital));setText('#life-mobile-capital',euro(final.capital));
    setText('#life-paid',euro(final.paid));setText('#life-fees',euro(final.fees));
    setText('#life-performance',signed(final.performance));
    $('#life-performance').classList.toggle('is-loss',final.performance<-.005);
    setText('#life-performance-label',final.performance<-.005?'Perte simulée':'Performance simulée');
    setText('#life-result-subtitle',`Hypothèse de ${number(result.rate)} %/an · Avant fiscalité et prélèvements sociaux.`);
    setText('[data-life-hero-assumptions]',`${euro(result.initial)} au départ + ${euro(result.monthly)}/mois · Hypothèse ${number(result.rate)} %/an.`);
    $('#life-year-rows').innerHTML=result.points.slice(1).map(p=>`<tr><th scope="row">${p.year}</th><td>${euro(p.paid)}</td><td>${euro(p.fees)}</td><td>${euro(p.capital)}</td></tr>`).join('');
    hoverYear=result.years;drawChart();
    if(announce)touch();
    clearTimeout(announceTimer);
    if(announce)announceTimer=setTimeout(()=>setText('#life-live-status',`Capital projeté : ${euro(final.capital)} dans ${yearsText(result.years)}, pour ${euro(final.paid)} versés, avec ${euro(final.fees)} de frais de versement.`),300);
  }
  function set(key,value){form.elements[key].value=value;update();}
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('input',event=>{
    const key=event.target.dataset.lifeRange;
    if(key)form.elements[key].value=event.target.value;
    update();
  });
  $$('[data-life-step]').forEach(button=>button.addEventListener('click',()=>{
    const key=button.dataset.lifeStep,[min,max]=model.LIMITS[key],raw=form.elements[key].value;
    const current=raw!==''&&Number.isFinite(Number(raw))?Number(raw):min;
    set(key,Math.max(min,Math.min(max,Math.round((current+increments[key]*Number(button.dataset.direction))*10)/10)));
  }));
  $$('[data-life-years]').forEach(button=>button.addEventListener('click',()=>set('years',button.dataset.lifeYears)));
  form.addEventListener('reset',()=>setTimeout(()=>update(),0));
  const chart=$('#life-chart');
  chart.addEventListener('pointermove',event=>{
    if(!geometry||!result?.valid)return;
    const box=chart.getBoundingClientRect(),px=(event.clientX-box.left)/box.width*geometry.width;
    updateMarker(Math.round((px-geometry.left)/(geometry.width-geometry.left-geometry.right)*result.years));
  });
  chart.addEventListener('pointerleave',()=>{if(result?.valid)updateMarker(result.years);});
  chart.addEventListener('keydown',event=>{
    if(!result?.valid||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();updateMarker(event.key==='Home'?0:event.key==='End'?result.years:hoverYear+(event.key==='ArrowLeft'?-1:1));
  });
  new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(drawChart);}).observe($('#life-results-card'));
  update(false);
})();
