import { ARCH } from './data/arch.js';
import { IMG } from './data/images.js';
import { ST, markVisited, SAVE } from './data/state.js';
import { KABE_GESTURES, KABE_RITUALS } from './data/kabe.js';
import { createScenes } from './data/scenes.js';

/* ======= HELPERS ======= */
const VIEW_LABELS={all:'Tous',story:'Histoire',profile:'Profil',journal:'Journal'};
const $=q=>document.querySelector(q);
const navWrap=document.getElementById('navWrap');
const navToggle=document.getElementById('navToggle');
const navMenu=document.getElementById('navMenu');
const header=document.querySelector('.header');
const headerCollapseBtn=document.getElementById('headerCollapseBtn');
const mobileHeaderMQ=window.matchMedia('(max-width: 900px)');
let headerCollapsed=false;
let lastScrollY=window.scrollY;
function revealHeader(){if(header)header.classList.remove('header-hidden');}
function setHeaderCollapsed(state){
  if(!header)return;
  headerCollapsed=!!state;
  header.classList.toggle('collapsed',headerCollapsed);
  header.setAttribute('data-collapsed',headerCollapsed?'true':'false');
  if(headerCollapseBtn){
    headerCollapseBtn.setAttribute('aria-expanded',headerCollapsed?'false':'true');
    headerCollapseBtn.setAttribute('aria-label',headerCollapsed?'Déployer le briefing Sourdine':'Replier le briefing Sourdine');
  }
}
function syncHeaderForViewport(){
  if(!header)return;
  if(mobileHeaderMQ.matches){
    setHeaderCollapsed(true);
    revealHeader();
  }else{
    setHeaderCollapsed(false);
    revealHeader();
  }
  lastScrollY=window.scrollY;
}
function handleHeaderScroll(){
  if(!header||!mobileHeaderMQ.matches)return;
  const currentY=window.scrollY;
  if(navWrap?.classList.contains('open')){lastScrollY=currentY;return;}
  if(currentY>lastScrollY+16&&currentY>80){
    header.classList.add('header-hidden');
  }else if(currentY<lastScrollY-12||currentY<16){
    header.classList.remove('header-hidden');
  }
  lastScrollY=currentY;
}
syncHeaderForViewport();
if(typeof mobileHeaderMQ.addEventListener==='function'){
  mobileHeaderMQ.addEventListener('change',()=>{syncHeaderForViewport();});
}else if(typeof mobileHeaderMQ.addListener==='function'){
  mobileHeaderMQ.addListener(()=>{syncHeaderForViewport();});
}
if(headerCollapseBtn){
  headerCollapseBtn.addEventListener('click',()=>{
    setHeaderCollapsed(!headerCollapsed);
    revealHeader();
  });
}
window.addEventListener('scroll',handleHeaderScroll,{passive:true});
const slotLabel=idx=>String(idx+1).padStart(2,'0');
const hasItem=name=>ST.inv.includes(name);
function gainItem(name){
  if(!ST.inv.includes(name)){
    ST.inv.push(name);
  }
}

const FOCUSABLE_SELECTOR='a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
let archReturnFocus=null;
let kabeGameReturnFocus=null;

function isElementVisible(el){
  return !!(el && (el.offsetWidth||el.offsetHeight||el.getClientRects().length));
}
function getFocusableElements(container){
  if(!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(el=>{
    if(el.hasAttribute('disabled')) return false;
    if(el.getAttribute('aria-hidden')==='true') return false;
    return isElementVisible(el);
  });
}
function focusFirstFocusable(container){
  const focusables=getFocusableElements(container);
  if(focusables.length){
    try{
      focusables[0].focus({preventScroll:true});
    }catch(e){
      focusables[0].focus();
    }
  }
}
function restoreFocus(el){
  if(!el||typeof el.focus!=='function') return;
  if(!document.contains(el)) return;
  try{
    el.focus({preventScroll:true});
  }catch(e){
    el.focus();
  }
}
function setupFocusTrap(modalBox){
  if(!modalBox) return;
  modalBox.addEventListener('keydown',event=>{
    if(event.key!=='Tab') return;
    const modalScreen=modalBox.closest('.modalScreen');
    if(!modalScreen) return;
    const style=window.getComputedStyle(modalScreen);
    if(style.display==='none'||style.visibility==='hidden'||modalScreen.getAttribute('aria-hidden')==='true') return;
    const focusables=getFocusableElements(modalBox);
    if(!focusables.length) return;
    const first=focusables[0];
    const last=focusables[focusables.length-1];
    const active=document.activeElement;
    if(event.shiftKey){
      if(active===first||!modalBox.contains(active)){
        event.preventDefault();
        last.focus();
      }
    }else{
      if(active===last||!modalBox.contains(active)){
        event.preventDefault();
        first.focus();
      }
    }
  });
}
document.querySelectorAll('.modalBox').forEach(setupFocusTrap);

function updateViewIndicator(v){const badge=$('#viewIndicator'); if(badge){badge.textContent='Vue : '+(VIEW_LABELS[v]||'Tous');}}
function openNavMenu(){
  if(!navWrap)return;
  revealHeader();
  navWrap.classList.add('open');
  if(navToggle)navToggle.setAttribute('aria-expanded','true');
  if(navMenu)navMenu.setAttribute('aria-hidden','false');
}
function closeNavMenu(){
  if(!navWrap)return;
  navWrap.classList.remove('open');
  if(navToggle)navToggle.setAttribute('aria-expanded','false');
  if(navMenu)navMenu.setAttribute('aria-hidden','true');
}
function toggleNavMenu(){if(navWrap?.classList.contains('open')){closeNavMenu();}else{openNavMenu();}}
updateViewIndicator(document.body.getAttribute('data-view')||'all');
if(navToggle){navToggle.addEventListener('click',e=>{e.stopPropagation();toggleNavMenu();});}
document.addEventListener('click',e=>{if(navWrap&&!navWrap.contains(e.target)){closeNavMenu();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeNavMenu();closeKabeGame();}});
function log(t){const L=$('#log');const d=document.createElement('div');d.className='line';d.textContent=t;L.prepend(d)}
function addObj(t){ST.objLog.push({t:Date.now(),text:t}); renderTimeline() }
function setView(v){
  document.body.setAttribute('data-view',v);
  document.querySelectorAll('[data-viewto]').forEach(b=>b.setAttribute('aria-pressed', b.getAttribute('data-viewto')===v ? 'true' : 'false'));
  updateViewIndicator(v);
}
function setupNav(){
  document.querySelectorAll('[data-viewto]').forEach(b=>{
    b.addEventListener('click', e=>{ setView(b.getAttribute('data-viewto')); closeNavMenu(); });
  });
}
$('#asciiBtn').addEventListener('click',()=>{ST.ascii=!ST.ascii;renderAscii();$('#asciiBtn').textContent='HUD ASCII '+(ST.ascii?'✓':'✗')});
function bars(){ $('#stressVal').textContent=ST.stress; $('#hpVal').textContent=ST.hp; $('#fluxVal').textContent=ST.flux; $('#fragVal').textContent=ST.frag;
  $('#stressFill').style.width=(ST.stress/5*100)+'%'; $('#hpFill').style.width=(ST.hp/5*100)+'%'; }
function renderStats(){const r=$('#statsRow');r.innerHTML='';const s=ST.stats;
  const mk=(cls,nm,v)=>`<div class="stat ${cls}"><div class="dot"></div><div class="name">${nm}</div><div class="val">${v}</div></div>`;
  r.insertAdjacentHTML('beforeend',mk('neu','Neuro',s.NEU)); r.insertAdjacentHTML('beforeend',mk('vol','Volonté',s.VOL));
  r.insertAdjacentHTML('beforeend',mk('som','Somatique',s.SOM)); r.insertAdjacentHTML('beforeend',mk('cin','Cinétique',s.CIN));
}
function renderInventory(){
  const list=$('#inventoryList');
  if(!list) return;
  list.innerHTML='';
  if(!ST.inv.length){
    const empty=document.createElement('li');
    empty.className='inventory-empty';
    empty.textContent='Aucun objet.';
    list.appendChild(empty);
    return;
  }
  ST.inv.forEach((item,idx)=>{
    const li=document.createElement('li');
    li.innerHTML=`<span class="inventory-slot">${slotLabel(idx)}</span><span class="inventory-item">${item}</span>`;
    list.appendChild(li);
  });
}
function renderAscii(){ if(!ST.ascii){$('#asciiHud').textContent='(désactivé)'; $('#miniMap').textContent='(désactivé)'; return;}
  const asciiLines=[
    '╔══[ ATH ]══════════════════════════════════════╗',
    `║ ${ST.arch?ST.arch.name:'—'}`,
    `║ NEU ${ST.stats.NEU} VOL ${ST.stats.VOL} SOM ${ST.stats.SOM} CIN ${ST.stats.CIN}`,
    `║ Stress ${'█'.repeat(ST.stress)}${'░'.repeat(5-ST.stress)}  Bless ${'█'.repeat(ST.hp)}${'░'.repeat(5-ST.hp)}`,
    `║ Flux ◆${ST.flux}  Frag ✦${ST.frag}`,
    '║ Inventaire:'
  ];
  if(ST.inv.length){ ST.inv.forEach((item,idx)=>{ asciiLines.push(`║   ${slotLabel(idx)} ▸ ${item}`); }); }
  else { asciiLines.push('║   (vide)'); }
  asciiLines.push(`║ Scène: ${ST.scene}`);
  asciiLines.push(`║ Tags: ${[...ST.tags].join(', ')||'—'}`);
  asciiLines.push('╚════════════════════════════════════════════════╝');
  $('#asciiHud').textContent=asciiLines.join('\n'); renderMiniMap(); }
function renderMiniMap(){const v=s=>ST.visited.has(s)?'●':'○';
 $('#miniMap').textContent=`[Guillotière]
  ${v('prologue')} Prologue
  ├─ ${v('place')} Place du Pont
  │   └─ ${v('collectif')} Assemblée couverte
  ├─ ${v('maz')} Mazagran
  │   ├─ ${v('kabe')} Kabé — apéros clandestins
  │   └─ ${v('atelier')} Atelier de fortune
  ├─ ${v('ber')} Berges
  │   └─ ${v('patrouille')} Patrouille fluviale
  ├─ ${v('pon')} Pont de la Guill’
  │   └─ ${v('ombre')} Contre-voie
  └─ ${v('t1')} T1
      └─ ${v('perimetre')} Périmètre interne
`; }
function renderTimeline(){const T=$('#timeline');T.innerHTML='';ST.objLog.slice().reverse().forEach(o=>{const d=document.createElement('div');d.className='item';d.innerHTML=`<div>${o.text}</div><div class="when">${new Date(o.t).toLocaleTimeString()}</div>`;T.appendChild(d)})}
function save(){localStorage.setItem(SAVE,JSON.stringify({a:ST.arch?.id,s:ST.stats,k:ST.skills,st:ST.stress,h:ST.hp,f:ST.flux,g:ST.frag,i:ST.inv,t:[...ST.tags],sc:ST.scene,o:ST.objective,ol:ST.objLog,v:[...ST.visited],as:ST.ascii}))}
function load(){try{const d=JSON.parse(localStorage.getItem(SAVE)||'null');if(!d)return;ST.arch=ARCH.find(x=>x.id===d.a)||null; if(ST.arch){ST.stats={...ST.arch.stats};ST.skills={...ST.arch.skills};ST.inv=[...ST.arch.start]}
  Object.assign(ST,{stress:d.st??2,hp:d.h??5,flux:d.f??2,frag:d.g??2});ST.inv=d.i||ST.inv;ST.tags=new Set(d.t||[]);
  if(ST.tags.has('Kabe_GameWon')){ST.tags.delete('Kabe_GameWon');ST.tags.add('Kabe_RitualWon');}
  ST.scene=d.sc||'prologue';ST.objective=d.o||ST.objective;ST.objLog=d.ol||[];ST.visited=new Set(d.v||[]);ST.ascii=d.as!==false}catch(e){}}
function resetGame(){
  const diceOverlay=$('#diceOverlay');
  if(diceOverlay){
    diceOverlay.style.display='none';
  }
  const dieOne=$('#d1');
  if(dieOne){
    dieOne.classList.remove('anim');
    dieOne.textContent='•';
  }
  const dieTwo=$('#d2');
  if(dieTwo){
    dieTwo.classList.remove('anim');
    dieTwo.textContent='•';
  }
  const stopBtn=$('#btnStopDice');
  if(stopBtn){
    stopBtn.disabled=false;
  }
  const resolveBtn=$('#btnResolveDice');
  if(resolveBtn){
    resolveBtn.style.display='none';
  }
  const diceInfo=$('#diceInfo');
  if(diceInfo){
    diceInfo.innerHTML='';
  }
  const testPanel=$('#testPanel');
  if(testPanel){
    testPanel.style.display='none';
  }
  const testHint=$('#testHint');
  if(testHint){
    testHint.textContent='';
  }
  const resultBox=$('#testResult');
  if(resultBox){
    resultBox.textContent='';
    resultBox.classList.remove('show','success','fail');
  }
  pending=null;
  roll=null;
  pendingOutcome=null;
  const kabeModal=document.getElementById('kabeGameModal');
  if(kabeModal){
    kabeModal.style.display='none';
    kabeModal.setAttribute('aria-hidden','true');
  }
  kabeGameState=null;
  renderKabeGame();
  kabeGameReturnFocus=null;
  archReturnFocus=null;
  const introModal=document.getElementById('introModal');
  const archModal=document.getElementById('archModal');
  if(archModal){
    archModal.style.display='none';
  }
  ST.arch=null;
  ST.stats={NEU:2,VOL:2,SOM:2,CIN:2};
  ST.skills={};
  ST.stress=2;
  ST.hp=5;
  ST.flux=2;
  ST.frag=2;
  ST.inv=[];
  ST.tags=new Set();
  ST.scene='prologue';
  ST.objective='Tracer une voie sûre vers T1.';
  ST.objLog=[];
  ST.visited=new Set();
  ST.ascii=true;
  localStorage.removeItem(SAVE);
  const logBox=$('#log');
  if(logBox){
    logBox.innerHTML='';
  }
  renderStats();
  renderInventory();
  renderAscii();
  renderTimeline();
  bars();
  render();
  if(introModal){
    introModal.style.display='flex';
    introModal.setAttribute('aria-hidden','false');
  }
  if(typeof openArch==='function'){
    openArch();
  }
}
/* exporter/importer */
$('#btnExport').addEventListener('click',()=>{const blob=new Blob([localStorage.getItem(SAVE)||'{}'],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='trame_douce_v6_4_sauvegarde.json';a.click();URL.revokeObjectURL(u)});
$('#btnImport').addEventListener('click',()=>{const i=document.createElement('input');i.type='file';i.accept='application/json';i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{localStorage.setItem(SAVE,r.result);load();render()};r.readAsText(f)};i.click()});
$('#btnReset').addEventListener('click', resetGame);

let kabeGameState=null;

function openKabeGame(){
  kabeGameReturnFocus=document.activeElement instanceof HTMLElement ? document.activeElement : null;
  startKabeRitual();
  const modal=document.getElementById('kabeGameModal');
  if(modal){
    modal.style.display='flex';
    modal.setAttribute('aria-hidden','false');
    focusFirstFocusable(modal.querySelector('.modalBox'));
  }
}

function closeKabeGame(){
  const modal=document.getElementById('kabeGameModal');
  const wasOpen=modal && modal.style.display!=='none';
  if(modal){
    modal.style.display='none';
    modal.setAttribute('aria-hidden','true');
  }
  kabeGameState=null;
  renderKabeGame();
  if(wasOpen){
    render();
    restoreFocus(kabeGameReturnFocus);
  }
  kabeGameReturnFocus=null;
}

function startKabeRitual(){
  const ritual=KABE_RITUALS[Math.floor(Math.random()*KABE_RITUALS.length)];
  kabeGameState={ritual,selected:[],locked:false,feedback:null,firstWin:false};
  renderKabeGame();
}

function handleKabeGesture(id){
  if(!kabeGameState||kabeGameState.locked) return;
  if(!KABE_GESTURES[id]) return;
  if(kabeGameState.selected.includes(id)) return;
  const len=kabeGameState.ritual.sequence.length;
  if(kabeGameState.selected.length>=len) return;
  kabeGameState.selected.push(id);
  kabeGameState.feedback=null;
  renderKabeGame();
}

function undoKabeGesture(){
  if(!kabeGameState||kabeGameState.locked) return;
  if(kabeGameState.selected.length===0) return;
  kabeGameState.selected.pop();
  kabeGameState.feedback=null;
  renderKabeGame();
}

function resetKabeGesture(){
  if(!kabeGameState||kabeGameState.locked) return;
  kabeGameState.selected=[];
  kabeGameState.feedback=null;
  renderKabeGame();
}

function serveKabeRitual(){
  if(!kabeGameState||kabeGameState.locked) return;
  const {ritual,selected}=kabeGameState;
  const needed=ritual.sequence.length;
  if(selected.length<needed){
    kabeGameState.feedback='incomplete';
    renderKabeGame();
    return;
  }
  const success=ritual.sequence.every((step,idx)=>selected[idx]===step);
  if(success){
    const firstWin=!ST.tags.has('Kabe_RitualWon');
    kabeGameState.locked=true;
    kabeGameState.feedback='success';
    kabeGameState.firstWin=firstWin;
    if(firstWin){
      if(ST.stress>0){
        ST.stress=Math.max(0,ST.stress-1);
      }
      ST.tags.add('Kabe_RitualWon');
      addObj('Rituel de Kabé maîtrisé : stress allégé.');
      log('Kabé approuve le rituel parfait. Stress -1.');
    }else{
      log('Kabé sourit : la séquence est impeccable.');
    }
    bars();
    renderAscii();
    save();
  }else{
    kabeGameState.feedback='fail';
  }
  renderKabeGame();
}

function renderKabeGame(){
  const palette=document.getElementById('kabeGamePalette');
  const prompt=document.getElementById('kabeGamePrompt');
  const sequenceBox=document.getElementById('kabeGameSequence');
  const message=document.getElementById('kabeGameMessage');
  if(!palette||!prompt||!sequenceBox||!message){
    return;
  }
  if(!kabeGameState){
    palette.innerHTML='';
    prompt.textContent='';
    sequenceBox.innerHTML='';
    message.textContent='';
    const undo=document.getElementById('kabeGameUndo');
    const reset=document.getElementById('kabeGameReset');
    const serve=document.getElementById('kabeGameServe');
    if(undo) undo.disabled=true;
    if(reset) reset.disabled=true;
    if(serve) serve.disabled=true;
    return;
  }
  const {ritual,selected,locked,feedback}=kabeGameState;
  prompt.innerHTML=`<strong>${ritual.name}</strong> — ${ritual.clue}`;
  palette.innerHTML='';
  const badgeFor=info=>{
    if(!info) return '';
    const icon=info.icon||info.name?.charAt(0)||'•';
    const tone=info.tone?` style="--kabe-tone:${info.tone}"`:'';
    return `<span class="kabeGestureBadge"${tone} aria-hidden="true">${icon}</span>`;
  };
  ritual.palette.forEach(id=>{
    const info=KABE_GESTURES[id];
    if(!info) return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='btn';
    if(locked) btn.classList.add('locked');
    if(selected.includes(id)) btn.classList.add('selected');
    btn.disabled=locked||selected.includes(id);
    const gestureLabel=`<span class="kabeGestureLabel">${badgeFor(info)}<span class="kabeGestureName">${info.name}</span></span>`;
    btn.innerHTML=`${gestureLabel}<small>${info.notes}</small>`;
    btn.addEventListener('click',()=>handleKabeGesture(id));
    palette.appendChild(btn);
  });

  const seqLen=ritual.sequence.length;
  const steps=document.createElement('div');
  steps.className='steps';
  for(let i=0;i<seqLen;i++){
    const wrap=document.createElement('div');
    wrap.className='step';
    const chosen=selected[i];
    if(!chosen){
      wrap.classList.add('pending');
      wrap.innerHTML=`<div class="kabeStepHeading"><strong>${i+1}.</strong><span class="kabeStepGesture">En attente</span></div>`;
    }else{
      const info=KABE_GESTURES[chosen];
      const label=info
        ? `${badgeFor(info)}<span class="kabeGestureName">${info.name}</span>`
        : `<span class="kabeGestureName">${chosen}</span>`;
      wrap.innerHTML=`<div class="kabeStepHeading"><strong>${i+1}.</strong><span class="kabeStepGesture">${label}</span></div>`;
      if((locked||feedback==='fail') && ritual.sequence[i]===chosen){
        wrap.classList.add('success');
      }else if((locked||feedback==='fail') && ritual.sequence[i]!==chosen){
        wrap.classList.add('fail');
      }
    }
    steps.appendChild(wrap);
  }
  sequenceBox.innerHTML='';
  sequenceBox.appendChild(steps);

  let msg='';
  if(locked && feedback==='success'){
    msg=kabeGameState.firstWin
      ? 'Kabé approuve : le rituel parfait calme la salle. Stress -1.'
      : 'Kabé acquiesce. Tu maîtrises encore la séquence.';
  }else if(feedback==='fail'){
    const missIndex=ritual.sequence.findIndex((step,idx)=>selected[idx]!==step);
    if(missIndex>=0){
      const expected=KABE_GESTURES[ritual.sequence[missIndex]];
      const expName=expected?expected.name:'un autre geste';
      msg=`La coupe manque d’équilibre. Kabé attendait ${expName} en ${missIndex+1}ᵉ geste.`;
    }else{
      msg='La coupe manque d’équilibre. Annule un geste ou recommence la séquence.';
    }
  }else if(feedback==='incomplete'){
    msg='La coupe n’est pas prête : complète la séquence avant de servir.';
  }else if(selected.length===0){
    msg=`Choisis ${seqLen} gestes dans l’ordre. Kabé observe chaque mouvement.`;
  }else if(selected.length<seqLen){
    msg=`Geste ${selected.length+1} sur ${seqLen} : écoute la salle avant de poursuivre.`;
  }else{
    msg='Quand tu es prêt·e, sers la coupe pour que Kabé juge la ronde.';
  }
  message.textContent=msg;

  const undo=document.getElementById('kabeGameUndo');
  const reset=document.getElementById('kabeGameReset');
  const serve=document.getElementById('kabeGameServe');
  if(undo) undo.disabled=locked||selected.length===0;
  if(reset) reset.disabled=locked||selected.length===0;
  if(serve) serve.disabled=locked||selected.length<seqLen;
}

const kabeRetry=document.getElementById('kabeGameRetry');
if(kabeRetry){
  kabeRetry.addEventListener('click',()=>{
    startKabeRitual();
  });
}
const kabeClose=document.getElementById('kabeGameClose');
if(kabeClose){
  kabeClose.addEventListener('click',()=>{
    closeKabeGame();
  });
}
const kabeUndo=document.getElementById('kabeGameUndo');
if(kabeUndo){
  kabeUndo.addEventListener('click',()=>{
    undoKabeGesture();
  });
}
const kabeReset=document.getElementById('kabeGameReset');
if(kabeReset){
  kabeReset.addEventListener('click',()=>{
    resetKabeGesture();
  });
}
const kabeServe=document.getElementById('kabeGameServe');
if(kabeServe){
  kabeServe.addEventListener('click',()=>{
    serveKabeRitual();
  });
}

/* ======= SCENES ======= */
const SC = createScenes({ addObj, gainItem, hasItem, log, openKabeGame });

/* ======= RENDER ENGINE ======= */
function render(){
  markVisited(ST.scene);
  const sc=SC[ST.scene]; if(!sc) return;
  if(ST.scene==='prologue'){ST.objective='Tracer une voie sûre vers T1.';}
  $('#storyTitle').textContent=sc.title;
  $('#storyText').innerHTML=sc.text?sc.text():'';
  const i=sc.img||IMG.place; $('#storyImg').src=i.src; $('#imgLegend').textContent=i.lg||'';
  const box=$('#choices'); box.innerHTML='';
  const arr=typeof sc.choices==='function'?sc.choices():sc.choices;
  (arr||[]).forEach((c,idx)=>{
    if(c.when && !c.when()) return;
    const div=document.createElement('div'); div.className='choice';
    if(c.test && c.test.stat) div.classList.add('attr-'+c.test.stat);
    const testTags=c.test?`<span class="tag">${c.test.stat}</span><span class="tag">${c.test.skill||''}</span><span class="tag">DD ${c.test.dd}</span>`:'';
    div.innerHTML=`<strong>${idx+1}. ${c.label}</strong><small>${c.hint||''}</small><div class="tags">${testTags}</div>`;
    div.addEventListener('click',()=>handleChoice(c));
    box.appendChild(div);
  });
  bars(); renderStats(); renderInventory(); renderAscii(); $('#objectiveText').textContent=ST.objective;
}
let pending=null, roll=null, pendingOutcome=null;
function resolveSceneTarget(target,outcome){
  if(typeof target==='function'){
    return target(ST,outcome)||null;
  }
  return target||null;
}
function handleChoice(c){
  const immediateOnly = !!c.immediate && !c.go && !c.test;
  if(c.immediate) c.immediate(ST);
  if(c.go && !c.test){
    const target=resolveSceneTarget(c.go);
    if(target){
      ST.scene=target;
      const nextSc=SC[ST.scene];
      addObj('Déplacement: '+(nextSc?nextSc.title:ST.scene));
      save(); render();
      return;
    }
  }
  if(c.test){ pending=c; showTest(c); return; }
  if(immediateOnly){ save(); render(); return; }
  if(c.immediate){ save(); render(); }
}
function showTest(c){
  $('#testPanel').style.display='block';
  $('#testName').textContent=`${c.test.stat}/${c.test.skill||'-'}`;
  $('#testDD').textContent=c.test.dd;
  const fluxBox=$('#useFlux');
  const pushBox=$('#usePush');
  const fragBox=$('#useFrag');
  if(fluxBox){fluxBox.checked=false; fluxBox.disabled=ST.flux<=0;}
  if(pushBox){
    pushBox.checked=false;
    pushBox.disabled=ST.stress>=5;
  }
  if(fragBox){
    const needsFrag=!!c.test.needsFrag;
    fragBox.checked=needsFrag && ST.frag>0;
    fragBox.disabled=ST.frag<=0;
  }
  const rollBtn=$('#rollBtn');
  if(rollBtn){rollBtn.disabled=false; rollBtn.onclick=()=>startDice();}
  const resultBox=$('#testResult');
  if(resultBox){resultBox.textContent='';resultBox.classList.remove('show','success','fail');}
  updateTestHint();
}

function gatherModifiers(test){
  const result={mod:0,breakdown:[],previewParts:[],spendFlux:false,spendPush:false,spendFrag:false};
  if(!test) return result;
  if(test.stat){
    const base=ST.stats[test.stat]||0;
    result.mod+=base;
    result.breakdown.push(`Attribut ${test.stat} +${base}`);
    result.previewParts.push(`Base ${test.stat} ${base}`);
  }
  const skillName=test.skill||null;
  if(skillName){
    if(ST.skills[skillName]>0){
      result.mod+=1;
      result.breakdown.push(`Compétence ${skillName} +1`);
      result.previewParts.push(`Compétence ${skillName} +1`);
    }
    if(skillName==='Furtivité'&&ST.arch?.id==='noor'){
      result.mod+=1;
      result.breakdown.push('Noor +1 Furtivité');
      result.previewParts.push('Noor +1 Furtivité');
    }
    if(skillName==='Intimidation'&&ST.arch?.id==='milo'){
      result.mod+=1;
      result.breakdown.push('Milo +1 Intimidation');
      result.previewParts.push('Milo +1 Intimidation');
    }
    if(skillName==='Mécanique'&&ST.arch?.id==='rayan'){
      result.mod+=1;
      result.breakdown.push('Rayan +1 Mécanique');
      result.previewParts.push('Rayan +1 Mécanique');
    }
  }
  const fluxEl=$('#useFlux');
  if(fluxEl && fluxEl.checked && ST.flux>0){
    result.mod+=2;
    result.breakdown.push('Flux +2');
    result.previewParts.push('Flux +2');
    result.spendFlux=true;
  }
  const pushEl=$('#usePush');
  if(pushEl && pushEl.checked){
    if(ST.stress<5){
      result.mod+=2;
      result.breakdown.push('Chance +2 (+1 Stress)');
      result.previewParts.push('Chance +2 (+1 Stress)');
      result.spendPush=true;
    }else{
      pushEl.checked=false;
    }
  }
  const fragEl=$('#useFrag');
  if(fragEl && fragEl.checked && ST.frag>0){
    result.mod+=2;
    result.breakdown.push('Fragment +2 (stress +1)');
    result.previewParts.push('Fragment +2 (+1 Stress)');
    result.spendFrag=true;
  }
  return result;
}

function previewOutcome(test=pending?.test){
  if(!test) return null;
  const mods=gatherModifiers(test);
  return {
    mod:mods.mod,
    dd:test.dd||0,
    parts:mods.previewParts,
    spendFlux:mods.spendFlux,
    spendPush:mods.spendPush,
    spendFrag:mods.spendFrag
  };
}

function updateTestHint(){
  const hint=$('#testHint');
  if(!hint) return;
  const test=pending?.test;
  const rollBtn=$('#rollBtn');
  const pushEl=$('#usePush');
  const fragEl=$('#useFrag');
  let pushWarning='';
  if(pushEl){
    if(ST.stress<5){
      pushEl.disabled=false;
    }else{
      if(pushEl.checked){ pushEl.checked=false; }
      pushEl.disabled=true;
      pushWarning='Stress max atteint : impossible de pousser sa chance (+1 Stress).';
    }
  }
  if(!test){
    hint.textContent='';
    if(rollBtn) rollBtn.disabled=false;
    return;
  }
  const needsFrag=!!test.needsFrag;
  const fragAvailable=ST.frag>0;
  if(fragEl){
    if(needsFrag){
      if(fragAvailable && !fragEl.checked){ fragEl.checked=true; }
      if(!fragAvailable){ fragEl.checked=false; }
      fragEl.disabled=!fragAvailable;
    }else{
      fragEl.disabled=ST.frag<=0;
    }
  }
  if(needsFrag && !fragAvailable){
    if(rollBtn) rollBtn.disabled=true;
    const messages=[];
    if(pushWarning) messages.push(pushWarning);
    messages.push('Fragment requis (+1 Stress) indisponible.');
    hint.textContent=messages.join(' ');
    return;
  }
  if(rollBtn) rollBtn.disabled=false;
  const preview=previewOutcome(test);
  if(!preview){
    hint.textContent='';
    return;
  }
  const parts=preview.parts.length?preview.parts:['Aucun modificateur'];
  const modSign=preview.mod>=0?`+${preview.mod}`:`${preview.mod}`;
  const baseText=`${parts.join(' + ')} = ${modSign} (Total cible ${preview.dd})`;
  hint.textContent=pushWarning?`${pushWarning} ${baseText}`:baseText;
}
function startDice(){
  if(!pending) return;
  roll=null; pendingOutcome=null;
  $('#diceOverlay').style.display='flex';
  $('#d1').classList.add('anim'); $('#d2').classList.add('anim');
  $('#d1').textContent='•'; $('#d2').textContent='•';
  $('#diceInfo').innerHTML='<div class="diceSummary">Les dés roulent…</div><div class="diceBreakdown">Appuie sur « Figer le résultat » quand tu es prêt·e.</div>';
  const stop=$('#btnStopDice'), cont=$('#btnResolveDice');
  if(stop){stop.disabled=false;}
  if(cont){cont.style.display='none';}
}
function computeOutcome(){
  if(!pending||!roll) return null;
  const mods=gatherModifiers(pending.test);
  const total=roll.sum+mods.mod;
  const dd=pending.test.dd;
  const ok=total>=dd;
  return {
    mod:mods.mod,
    total,
    dd,
    ok,
    spendFlux:mods.spendFlux,
    spendFrag:mods.spendFrag,
    spendPush:mods.spendPush,
    breakdown:mods.breakdown
  };
}
function stopDice(){
  if(!pending||pendingOutcome) return;
  $('#d1').classList.remove('anim'); $('#d2').classList.remove('anim');
  const a=1+Math.floor(Math.random()*6), b=1+Math.floor(Math.random()*6);
  $('#d1').textContent=a; $('#d2').textContent=b;
  roll={a,b,sum:a+b};
  pendingOutcome=computeOutcome();
  let html=`<div class="diceSummary">Résultat : ${a} + ${b} = ${roll.sum}</div>`;
  if(pendingOutcome){
    const mods=pendingOutcome.breakdown.length?pendingOutcome.breakdown.join(' · '):'Aucun modificateur';
    html+=`<div class="diceBreakdown">Modificateurs : ${mods}</div>`;
    html+=`<div class="diceBreakdown">Total : ${roll.sum} + ${pendingOutcome.mod} = ${pendingOutcome.total}</div>`;
    html+=`<div class="diceStatus ${pendingOutcome.ok?'success':'fail'}">${pendingOutcome.ok?'Réussite':'Échec'} — ${pendingOutcome.total} (DD ${pendingOutcome.dd})</div>`;
    html+=`<div class="diceBreakdown">Clique sur « Continuer » pour résoudre ce lancer.</div>`;
  }
  $('#diceInfo').innerHTML=html;
  const stop=$('#btnStopDice'), cont=$('#btnResolveDice');
  if(stop){stop.disabled=true;}
  if(cont){cont.style.display='inline-flex';cont.focus();}
}
$('#btnStopDice').addEventListener('click', stopDice);
$('#btnResolveDice').addEventListener('click', resolveRoll);
['#useFlux','#usePush','#useFrag'].forEach(sel=>{
  const el=$(sel);
  if(el){ el.addEventListener('change', updateTestHint); }
});
function resolveRoll(){
  if(!pending||!roll||!pendingOutcome) return;
  const c=pending, outcome=pendingOutcome;
  if(outcome.spendFlux){ST.flux--;}
  if(outcome.spendFrag){ST.frag--;ST.stress=Math.min(5,ST.stress+1);log('Le fragment te mord. +1 Stress.');}
  if(outcome.spendPush){ST.stress=Math.min(5,ST.stress+1);log('Tu forces ta chance. +1 Stress.');}
  log(`${c.test.stat}/${c.test.skill||'-'} DD${outcome.dd} — ${roll.a}+${roll.b}=${roll.sum} + ${outcome.mod} = ${outcome.total} → ${outcome.ok?'Réussite':'Échec'}`);
  let next=null;
  if(outcome.ok){
    if(c.test.ok) c.test.ok(ST);
    next=resolveSceneTarget(c.goOK||c.go,outcome);
  }else{
    if(c.test.ko) c.test.ko(ST);
    next=resolveSceneTarget(c.goKO||c.go,outcome);
  }
  const resultBox=$('#testResult');
  if(resultBox){
    resultBox.textContent=`${outcome.ok?'Réussite':'Échec'} — ${outcome.total} (DD ${outcome.dd})`;
    resultBox.classList.remove('show','success','fail');
    resultBox.classList.add('show', outcome.ok?'success':'fail');
  }
  pending=null; roll=null; pendingOutcome=null;
  updateTestHint();
  const stop=$('#btnStopDice'), cont=$('#btnResolveDice');
  if(stop){stop.disabled=false;}
  if(cont){cont.style.display='none';}
  $('#diceOverlay').style.display='none';
  if(next){
    ST.scene=next;
    const nextSc=SC[next];
    addObj('Déplacement: '+(nextSc?nextSc.title:next));
    $('#testPanel').style.display='none';
  }
  else { $('#testPanel').style.display='block'; }
  save(); render();
}

/* ======= ARCHETYPES ======= */
$('#btnChooseArch').addEventListener('click',()=>{ $('#introModal').style.display='none'; openArch(); });
let sel=null;
function openArch(){
  archReturnFocus=document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const list=$('#archList'); list.innerHTML='';
  sel=ST.arch||null;
  $('#btnConfirm').disabled=!sel;
  ARCH.forEach(a=>{ const card=document.createElement('div'); card.className='arch'; card.innerHTML=`
    <img src="${a.img}" alt="${a.name}"><div class="pad"><h3>${a.name}</h3><p>${a.back}</p>
    <div class="statrow"><span class="b">NEU ${a.stats.NEU}</span><span class="b">VOL ${a.stats.VOL}</span><span class="b">SOM ${a.stats.SOM}</span><span class="b">CIN ${a.stats.CIN}</span></div></div>`;
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.setAttribute('aria-selected','false');
    card.addEventListener('click',()=>selectArch(a,card));
    card.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '||e.key==='Spacebar'){e.preventDefault();selectArch(a,card);} });
    if(ST.arch && ST.arch.id===a.id){ sel=a; card.setAttribute('aria-selected','true'); $('#btnConfirm').disabled=false; }
    list.appendChild(card); });
  const modal=document.getElementById('archModal');
  if(modal){
    modal.style.display='flex';
    focusFirstFocusable(modal.querySelector('.modalBox'));
  }
}
function selectArch(a,card){ sel=a; document.querySelectorAll('.arch').forEach(x=>x.setAttribute('aria-selected','false')); card.setAttribute('aria-selected','true'); $('#btnConfirm').disabled=false; }
$('#btnRandom').addEventListener('click',()=>{const i=Math.floor(Math.random()*ARCH.length);selectArch(ARCH[i], document.querySelectorAll('.arch')[i])});
$('#btnConfirm').addEventListener('click',()=>{ ST.arch=sel; ST.stats={...sel.stats}; ST.skills={...sel.skills}; ST.inv=[...sel.start];
  bars(); renderStats(); renderAscii();
  addObj('Archétype: '+sel.name); const modal=document.getElementById('archModal'); if(modal){modal.style.display='none';}
  const intro=document.getElementById('introModal'); if(intro){intro.style.display='none';intro.setAttribute('aria-hidden','true');}
  save(); render(); restoreFocus(archReturnFocus); archReturnFocus=null; });

/* ======= INIT ======= */
setupNav(); // header + mobile bar
const mobileMq=window.matchMedia ? window.matchMedia('(max-width: 900px)') : null;
const syncView=e=>{
  if(!e.matches && document.body.getAttribute('data-view')!=='all'){
    setView('all');
  }
};
if(mobileMq){
  syncView(mobileMq);
  if(mobileMq.addEventListener){ mobileMq.addEventListener('change',syncView); }
  else if(mobileMq.addListener){ mobileMq.addListener(syncView); }
}
setView(document.body.getAttribute('data-view')||'all');
load();
renderStats(); renderInventory(); renderAscii(); renderTimeline(); bars(); render();
if(!ST.arch){ $('#introModal').style.display='flex'; }

