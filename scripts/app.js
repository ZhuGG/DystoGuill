import { ARCH } from './data/arch.js';
import { IMG } from './data/images.js';
import { ST, markVisited, SAVE, LEGACY_SAVE, ITEM_META, addPressure, setRelation } from './data/state.js';
import { KABE_ACTIONS } from './data/kabe.js';
import { createScenes } from './data/scenes.js';
import { choiceAvailable, choiceId, isResolved, resolveChoice } from './data/progression.js';

const VIEW_LABELS = { all: 'Tous', story: 'Histoire', profile: 'Profil', journal: 'Dossier' };
const STAT_LABELS = { DOC: 'Dossier', SOC: 'Social', TEC: 'Technique', RUE: 'Rue' };
const AUDIO_SAVE = 'bail_noir_audio_muted';
const SFX = {
  click: 'assets/bail-noir/audio/dossier-click.mp3',
  dice: 'assets/bail-noir/audio/dice-roll.mp3',
  success: 'assets/bail-noir/audio/success.mp3',
  failure: 'assets/bail-noir/audio/failure.mp3',
  voiceMymy: 'assets/bail-noir/audio/voice-mymy.mp3',
  voiceNora: 'assets/bail-noir/audio/voice-nora.mp3',
  voiceAntoine: 'assets/bail-noir/audio/voice-antoine.mp3'
};
const SCENE_VOICES = {
  kabe_salle: 'voiceMymy',
  regie_vautrin: 'voiceAntoine',
  final_choix: 'voiceNora'
};
const AMBIENCE = {
  place: 'assets/bail-noir/audio/amb-place.wav',
  marseille: 'assets/bail-noir/audio/amb-marseille.wav',
  mazagran: 'assets/bail-noir/audio/amb-marseille.wav',
  kabe: 'assets/bail-noir/audio/amb-kabe.wav',
  berges: 'assets/bail-noir/audio/amb-berges.wav',
  regie: 'assets/bail-noir/audio/amb-regie.wav',
  fallback: 'assets/bail-noir/audio/amb-place.wav'
};
const $ = q => document.querySelector(q);
const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

const MAP_NODES = [
  { key: 'place', label: 'Place', x: 18, y: 34, role: 'Disparition de Nora' },
  { key: 'marseille', label: 'Marseille', x: 45, y: 22, role: 'Archives et juristes' },
  { key: 'mazagran', label: 'Mazagran', x: 30, y: 64, role: 'Technique et accès' },
  { key: 'kabe', label: 'Kabé', x: 62, y: 55, role: 'Réseau clandestin' },
  { key: 'berges', label: 'Berges', x: 78, y: 36, role: 'Fourgonnette' },
  { key: 'regie', label: 'Régie', x: 84, y: 72, role: 'Confrontation' }
];

const CONTACTS = [
  { key: 'zaza', name: 'Samia', role: 'informatrice de la Place' },
  { key: 'mika', name: 'Mika', role: 'serrurier de Mazagran' },
  { key: 'yugs', name: 'Yugs', role: 'coursier des berges' },
  { key: 'chacha', name: 'Chacha', role: 'tri des rumeurs chez Kabé' },
  { key: 'mymy', name: 'Mymy', role: 'relais des dettes de Kabé', img: 'assets/bail-noir/mymy-portrait.png' },
  { key: 'anette', name: 'Anette', role: 'mémoire du quartier' },
  { key: 'laura', name: 'Laura', role: 'agente à la Régie' },
  { key: 'anto', name: 'Anto', role: 'gardien du seuil de Kabé' },
  { key: 'pauline', name: 'Pauline', role: 'habitante menacée' },
  { key: 'kabe', name: 'Kabé', role: 'refuge social' }
];

let pending = null;
let pendingOutcome = null;
let rolling = false;
let choiceLocked = false;
let selectedArch = null;
let archReturnFocus = null;
let kabeReturnFocus = null;
let dossierReturnFocus = null;
let diceTimer = null;
let diceAutoResolve = null;
let audioMuted = localStorage.getItem(AUDIO_SAVE) === 'true';
let audioReady = false;
let currentAmbience = null;
const ambienceFadeTimers = new Map();
const heardVoices = new Set();
const audioClips = Object.fromEntries(Object.entries(SFX).map(([key, src]) => {
  const clip = new Audio(src);
  clip.preload = 'auto';
  clip.volume = key.startsWith('voice') ? 0.72 : (key === 'dice' ? 0.42 : 0.35);
  return [key, clip];
}));
const ambienceClips = Object.fromEntries(Object.entries(AMBIENCE).map(([key, src]) => {
  const clip = new Audio(src);
  clip.preload = 'auto';
  clip.loop = true;
  clip.volume = 0;
  return [key, clip];
}));

const hasItem = name => ST.inv.includes(name);
const gainItem = name => {
  if (!ST.inv.includes(name)) ST.inv.push(name);
};
const slotLabel = idx => String(idx + 1).padStart(2, '0');

function visible(el) {
  return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
}

function focusables(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(el => !el.disabled && visible(el));
}

function focusFirst(container) {
  const list = focusables(container);
  if (list[0]) list[0].focus({ preventScroll: true });
}

function restoreFocus(el) {
  if (el && document.contains(el) && typeof el.focus === 'function') el.focus({ preventScroll: true });
}

function syncAudioToggle() {
  const button = $('#audioToggle');
  if (!button) return;
  button.setAttribute('aria-pressed', audioMuted ? 'true' : 'false');
  button.setAttribute('aria-label', audioMuted ? 'Activer les sons' : 'Couper les sons');
  button.textContent = audioMuted ? 'SFX off' : 'SFX';
}

function unlockAudio() {
  if (audioReady || audioMuted) return;
  audioReady = true;
  [...Object.values(audioClips), ...Object.values(ambienceClips)].forEach(clip => {
    clip.load();
  });
  setAmbience(ST.scene);
}

function ambienceKey(sceneId) {
  if (sceneId.includes('marseille')) return 'marseille';
  if (sceneId.includes('mazagran')) return 'mazagran';
  if (sceneId.includes('kabe')) return 'kabe';
  if (sceneId.includes('berges')) return 'berges';
  if (sceneId.includes('regie') || sceneId.includes('final') || sceneId.includes('ep_')) return 'regie';
  return 'place';
}

function fadeAmbience(clip, target, done) {
  window.clearInterval(ambienceFadeTimers.get(clip));
  const timer = window.setInterval(() => {
    const next = Math.max(0, Math.min(target, clip.volume + (target > clip.volume ? 0.018 : -0.024)));
    clip.volume = next;
    if (next === target) {
      window.clearInterval(timer);
      ambienceFadeTimers.delete(clip);
      if (done) done();
    }
  }, 60);
  ambienceFadeTimers.set(clip, timer);
}

function setAmbience(sceneId) {
  if (audioMuted || !audioReady) return;
  const next = ambienceClips[ambienceKey(sceneId)] || ambienceClips.fallback;
  if (next === currentAmbience) return;
  const previous = currentAmbience;
  currentAmbience = next;
  if (previous) fadeAmbience(previous, 0, () => previous.pause());
  next.currentTime = 0;
  next.play().catch(() => {});
  fadeAmbience(next, 0.14);
}

function stopAmbience() {
  ambienceFadeTimers.forEach(timer => window.clearInterval(timer));
  ambienceFadeTimers.clear();
  Object.values(ambienceClips).forEach(clip => {
    clip.pause();
    clip.volume = 0;
  });
  currentAmbience = null;
}

function playSfx(name) {
  if (audioMuted) return;
  unlockAudio();
  const clip = audioClips[name];
  if (!clip) return;
  Object.values(audioClips).forEach(other => { if (other !== clip) other.pause(); });
  clip.currentTime = 0;
  clip.play().catch(() => {});
}

function toggleAudio() {
  audioMuted = !audioMuted;
  localStorage.setItem(AUDIO_SAVE, String(audioMuted));
  if (audioMuted) Object.values(audioClips).forEach(clip => clip.pause());
  if (audioMuted) Object.values(ambienceClips).forEach(clip => clip.pause());
  syncAudioToggle();
  if (!audioMuted) {
    playSfx('click');
    setAmbience(ST.scene);
  }
}

function trapFocus(modalBox) {
  modalBox.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const screen = modalBox.closest('.modalScreen');
    if (!screen || screen.style.display === 'none' || screen.getAttribute('aria-hidden') === 'true') return;
    const list = focusables(modalBox);
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (event.shiftKey && (document.activeElement === first || !modalBox.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !modalBox.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  });
}

document.querySelectorAll('.modalBox').forEach(trapFocus);

function log(text) {
  const line = document.createElement('div');
  line.className = 'line';
  line.textContent = text;
  $('#log')?.prepend(line);
}

function addObj(text) {
  ST.objLog.push({ t: Date.now(), text });
  renderTimeline();
}

function markItemUsed(name) {
  if (name && !ST.usedItems.includes(name)) ST.usedItems.push(name);
}

function consequence(text) {
  if (!text) return '';
  return `<div class="choiceEffects">${text.split('|').map(part => `<span>${part.trim()}</span>`).join('')}</div>`;
}

function save() {
  localStorage.setItem(SAVE, JSON.stringify({
    a: ST.arch?.id,
    s: ST.stats,
    k: ST.skills,
    st: ST.stress,
    h: ST.hp,
    f: ST.flux,
    g: ST.frag,
    p: ST.pressure,
    r: ST.relations,
    u: ST.usedItems,
    rc: [...ST.resolvedChoices],
    i: ST.inv,
    t: [...ST.tags],
    sc: ST.scene,
    o: ST.objective,
    ol: ST.objLog,
    v: [...ST.visited]
  }));
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE) || localStorage.getItem(LEGACY_SAVE) || 'null');
    if (!data) return;
    ST.arch = ARCH.find(arch => arch.id === data.a) || null;
    if (ST.arch) {
      ST.stats = { ...ST.arch.stats };
      ST.skills = { ...ST.arch.skills };
    }
    Object.assign(ST, {
      stress: data.st ?? 2,
      hp: data.h ?? 5,
      flux: data.f ?? 2,
      frag: data.g ?? 1,
      pressure: data.p ?? 1,
      relations: { ...ST.relations, ...(data.r || {}) },
      usedItems: data.u || [],
      resolvedChoices: new Set(data.rc || []),
      inv: data.i || ST.inv,
      scene: data.sc || 'retour_place',
      objective: data.o || ST.objective,
      objLog: data.ol || []
    });
    ST.tags = new Set(data.t || []);
    if (ST.tags.delete('LeylaAlive')) ST.tags.add('NoraAlive');
    ST.visited = new Set(data.v || []);
    if (!localStorage.getItem(SAVE)) save();
  } catch {
    localStorage.removeItem(SAVE);
  }
}

function resetGame() {
  pending = null;
  pendingOutcome = null;
  rolling = false;
  choiceLocked = false;
  clearInterval(diceTimer);
  clearTimeout(diceAutoResolve);
  stopAmbience();
  localStorage.removeItem(SAVE);
  Object.assign(ST, {
    arch: null,
    stats: { DOC: 2, SOC: 2, TEC: 2, RUE: 2 },
    skills: {},
    stress: 2,
    hp: 5,
    flux: 2,
    frag: 1,
    pressure: 1,
    relations: { zaza: 0, mika: 0, yugs: 0, chacha: 0, mymy: 0, anette: 0, laura: 0, anto: 0, kabe: 0, pauline: 0 },
    usedItems: [],
    resolvedChoices: new Set(),
    inv: [],
    tags: new Set(),
    scene: 'retour_place',
    objective: 'Retrouver Nora avant l evacuation de 6 h.',
    objLog: [],
    visited: new Set()
  });
  $('#log').innerHTML = '';
  $('#diceOverlay').style.display = 'none';
  closeDossier();
  closeKabeNetwork(false);
  render();
  openIntro();
}

function setView(view) {
  document.body.setAttribute('data-view', view);
  document.querySelectorAll('[data-viewto]').forEach(button => {
    button.setAttribute('aria-pressed', button.getAttribute('data-viewto') === view ? 'true' : 'false');
  });
  const badge = $('#viewIndicator');
  if (badge) badge.textContent = 'Vue : ' + (VIEW_LABELS[view] || 'Tous');
}

function selectDossierTab(tabName = 'status') {
  const requested = document.querySelector(`[data-dossier-tab="${tabName}"]`) ? tabName : 'status';
  document.querySelectorAll('[data-dossier-tab]').forEach(button => {
    const selected = button.dataset.dossierTab === requested;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  document.querySelectorAll('[data-dossier-pane]').forEach(pane => {
    pane.hidden = pane.dataset.dossierPane !== requested;
  });
}

function openDossier(tabName = 'status') {
  const drawer = $('#dossierDrawer');
  if (!drawer) return;
  dossierReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  selectDossierTab(tabName);
  document.body.classList.add('dossierOpen');
  drawer.setAttribute('aria-hidden', 'false');
  $('#dossierToggle')?.setAttribute('aria-expanded', 'true');
  const activeTab = drawer.querySelector('[role="tab"][aria-selected="true"]');
  activeTab?.focus({ preventScroll: true });
}

function closeDossier() {
  const drawer = $('#dossierDrawer');
  if (!drawer || !document.body.classList.contains('dossierOpen')) return;
  document.body.classList.remove('dossierOpen');
  drawer.setAttribute('aria-hidden', 'true');
  $('#dossierToggle')?.setAttribute('aria-expanded', 'false');
  restoreFocus(dossierReturnFocus);
}

function setupNav() {
  document.querySelectorAll('[data-viewto]').forEach(button => {
    button.addEventListener('click', () => setView(button.getAttribute('data-viewto')));
  });
  $('#audioToggle')?.addEventListener('click', toggleAudio);
  $('#dossierToggle')?.addEventListener('click', () => openDossier('status'));
  $('#dossierClose')?.addEventListener('click', closeDossier);
  document.querySelectorAll('[data-dossier-tab]').forEach(button => {
    button.addEventListener('click', () => selectDossierTab(button.dataset.dossierTab));
  });
  document.querySelectorAll('[data-open-dossier]').forEach(button => {
    button.addEventListener('click', () => openDossier(button.dataset.openDossier));
  });
  document.querySelectorAll('[data-close-dossier]').forEach(button => button.addEventListener('click', closeDossier));
  const navWrap = $('#navWrap');
  const navToggle = $('#navToggle');
  const navMenu = $('#navMenu');
  navToggle?.addEventListener('click', event => {
    event.stopPropagation();
    const open = navWrap.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
  });
  document.addEventListener('click', event => {
    if (!navWrap?.contains(event.target)) {
      navWrap?.classList.remove('open');
      navToggle?.setAttribute('aria-expanded', 'false');
      navMenu?.setAttribute('aria-hidden', 'true');
    }
  });
}

function bars() {
  $('#stressVal').textContent = ST.stress;
  $('#hpVal').textContent = ST.hp;
  $('#levierVal').textContent = ST.flux;
  $('#preuveVal').textContent = ST.frag;
  $('#deckLevierVal').textContent = ST.flux;
  $('#deckPreuveVal').textContent = ST.frag;
  $('#stressFill').style.width = `${ST.stress / 5 * 100}%`;
  $('#hpFill').style.width = `${ST.hp / 5 * 100}%`;
}

function renderStats() {
  const row = $('#statsRow');
  row.innerHTML = '';
  Object.entries(ST.stats).forEach(([key, value]) => {
    row.insertAdjacentHTML('beforeend', `<div class="stat ${key.toLowerCase()}"><div class="dot"></div><div class="name">${STAT_LABELS[key] || key}</div><div class="val">${value}</div></div>`);
  });
}

function renderInventoryCards() {
  const list = $('#inventoryGrid');
  list.innerHTML = '';
  if (!ST.inv.length) {
    list.insertAdjacentHTML('beforeend', '<div class="inventoryEmpty">Aucun objet classe pour l instant.</div>');
    return;
  }
  ST.inv.forEach((item, idx) => {
    const meta = ITEM_META[item] || { type: 'Indice', use: 'A utiliser quand une scene le reclame.', effect: '+Option', icon: slotLabel(idx) };
    const used = ST.usedItems.includes(item);
    list.insertAdjacentHTML('beforeend', `
      <article class="inventoryCard ${used ? 'used' : ''}">
        <div class="inventoryTop">
          <span class="inventoryStamp">${meta.icon || slotLabel(idx)}</span>
          <span class="inventoryType">${meta.type}</span>
        </div>
        <strong>${meta.label || item}</strong>
        <p>${meta.use}</p>
        <div class="inventoryEffect">${used ? 'Utilise' : meta.effect}</div>
      </article>`);
  });
}

function renderPressureClock() {
  const pct = Math.min(100, (ST.pressure / 6) * 100);
  const minutes = Math.min(223, Math.round(ST.pressure * 37));
  const hour = String(2 + Math.floor((17 + minutes) / 60)).padStart(2, '0');
  const minute = String((17 + minutes) % 60).padStart(2, '0');
  const label = ST.pressure >= 5 ? 'Aube imminente' : ST.pressure >= 3 ? 'Quartier sous tension' : 'Nuit encore ouverte';
  $('#pressureClock').innerHTML = `
    <div class="clockFace">
      <div class="clockNeedle" style="--pressure:${pct}"></div>
      <div class="clockTime">${hour}:${minute}</div>
      <div class="clockLimit">06:00</div>
    </div>
    <div class="pressureMeta">
      <strong>${label}</strong>
      <span>${ST.pressure}/6 Pression</span>
      <div class="pressureBar"><i style="width:${pct}%"></i></div>
    </div>`;
}

function renderCaseMap() {
  $('#caseMap').innerHTML = `
    <div class="mapBoard">
      <svg class="mapLines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M18 34 L45 22 L62 55 L78 36 L84 72 L30 64 L18 34" />
      </svg>
      ${MAP_NODES.map(node => {
        const active = ST.scene.includes(node.key) || (node.key === 'place' && ST.scene === 'retour_place');
        const visited = ST.visited.has(node.key);
        return `<button class="mapPin ${visited ? 'visited' : ''} ${active ? 'active' : ''}" style="left:${node.x}%;top:${node.y}%" type="button" title="${node.role}" aria-label="${node.label}: ${node.role}">
          <span></span><b>${node.label}</b><small>${node.role}</small>
        </button>`;
      }).join('')}
    </div>`;
}

function renderTimeline() {
  const timeline = $('#timeline');
  timeline.innerHTML = '';
  ST.objLog.slice().reverse().forEach(item => {
    timeline.insertAdjacentHTML('beforeend', `<div class="item"><div>${item.text}</div><div class="when">${new Date(item.t).toLocaleTimeString()}</div></div>`);
  });
}

function renderCasePanel() {
  const tags = [...ST.tags].filter(tag => tag.startsWith('Preuve_') || tag.startsWith('Acces_') || tag.includes('Allie') || tag.includes('Dette') || tag.includes('Mymy') || tag.includes('Laura') || tag.includes('Antoine') || tag.includes('Nora')).slice(-6);
  $('#casePanel').innerHTML = `
    <div class="caseSummary">
      <div><span>Profil</span><strong>${ST.arch ? ST.arch.name : 'Non choisi'}</strong></div>
      <div><span>Preuves</span><strong>${ST.frag}</strong></div>
      <div><span>Levier</span><strong>${ST.flux}</strong></div>
    </div>
    <div class="contactGrid">
      ${CONTACTS.map(contact => `<div class="contactCard contact-${contact.key} ${contact.img ? 'hasPortrait' : ''} ${ST.relations[contact.key] > 0 ? 'warm' : ''}" ${contact.img ? `style="--contact-portrait:url('${contact.img}')"` : ''}>
        <strong>${contact.name}</strong>
        <span>${contact.role}</span>
        <i>${ST.relations[contact.key] || 0}</i>
      </div>`).join('')}
    </div>
    <div class="evidenceStrip">
      ${tags.length ? tags.map(tag => `<span>${tag.replaceAll('_', ' ')}</span>`).join('') : '<span>Aucune preuve classee visible.</span>'}
    </div>`;
}

function openIntro() {
  const intro = $('#introModal');
  intro.style.display = 'flex';
  intro.setAttribute('aria-hidden', 'false');
  focusFirst(intro.querySelector('.modalBox'));
}

function closeIntro() {
  const intro = $('#introModal');
  intro.style.display = 'none';
  intro.setAttribute('aria-hidden', 'true');
}

function openArch() {
  archReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const list = $('#archList');
  list.innerHTML = '';
  selectedArch = ST.arch || null;
  $('#btnConfirm').disabled = !selectedArch;
  ARCH.forEach(arch => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'arch';
    card.setAttribute('aria-selected', selectedArch?.id === arch.id ? 'true' : 'false');
    card.innerHTML = `<img src="${arch.img}" alt=""><div class="pad"><h3>${arch.name}</h3><p>${arch.back}</p><div class="statrow">${Object.entries(arch.stats).map(([k, v]) => `<span class="b">${k} ${v}</span>`).join('')}</div></div>`;
    card.addEventListener('click', () => selectArch(arch, card));
    list.appendChild(card);
  });
  const modal = $('#archModal');
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  focusFirst(modal.querySelector('.modalBox'));
}

function selectArch(arch, card) {
  selectedArch = arch;
  document.querySelectorAll('.arch').forEach(el => el.setAttribute('aria-selected', 'false'));
  if (card) card.setAttribute('aria-selected', 'true');
  $('#btnConfirm').disabled = false;
}

function confirmArch() {
  if (!selectedArch) return;
  ST.arch = selectedArch;
  ST.stats = { ...selectedArch.stats };
  ST.skills = { ...selectedArch.skills };
  ST.inv = [...selectedArch.start];
  addObj('Profil choisi: ' + selectedArch.name);
  $('#archModal').style.display = 'none';
  $('#archModal').setAttribute('aria-hidden', 'true');
  closeIntro();
  save();
  render();
  restoreFocus(archReturnFocus);
}

function openKabeNetwork() {
  kabeReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const modal = $('#kabeGameModal');
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  renderKabeNetwork();
  focusFirst(modal.querySelector('.modalBox'));
}

function closeKabeNetwork(shouldRender = true) {
  const modal = $('#kabeGameModal');
  if (!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  if (shouldRender) {
    save();
    render();
    restoreFocus(kabeReturnFocus);
  }
}

function renderKabeNetwork() {
  const palette = $('#kabeGamePalette');
  const prompt = $('#kabeGamePrompt');
  const sequence = $('#kabeGameSequence');
  const message = $('#kabeGameMessage');
  prompt.innerHTML = '<strong>Choisis une intervention, pas un pouvoir.</strong><span>Chaque carte indique ce que Kabé fait, ce que tu paies, et ce qui reste en dette.</span>';
  sequence.innerHTML = `<div class="kabeLedger"><span><b>${ST.flux}</b> leviers</span><span><b>${ST.frag}</b> preuves</span><span><b>${ST.pressure}/6</b> pression</span></div>`;
  palette.innerHTML = '';
  ['Écouter', 'Protéger', 'Ouvrir'].forEach(lane => {
    const actions = KABE_ACTIONS.filter(action => action.lane === lane);
    if (!actions.length) return;
    const group = document.createElement('section');
    group.className = 'kabeLane';
    group.innerHTML = `<h3>${lane}</h3>`;
    actions.forEach(action => {
      const available = !action.when || action.when(ST);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn kabeAction';
      button.disabled = !available;
      button.innerHTML = `<span class="kabeGestureLabel"><span class="kabeGestureBadge" aria-hidden="true">${available ? '→' : '×'}</span><span class="kabeGestureName">${action.name}</span></span><span class="kabeOutcome"><b>Effet</b> ${action.outcome}</span><span class="kabeCost"><b>Coût</b> ${action.cost}</span><small><b>Conséquence</b> ${action.risk}</small>`;
      button.addEventListener('click', () => {
        action.apply({ state: ST, addObj, gainItem, hasItem, log, addPressure, setRelation });
        document.querySelector('.kabeGameBox')?.classList.add('is-updated');
        window.setTimeout(() => document.querySelector('.kabeGameBox')?.classList.remove('is-updated'), 400);
        save();
        renderKabeNetwork();
      });
      group.appendChild(button);
    });
    palette.appendChild(group);
  });
  message.textContent = 'Les cartes grisées demandent une ressource ou une information que tu n’as pas encore obtenue.';
}

const SC = createScenes({ addObj, gainItem, hasItem, log, openKabeNetwork, addPressure, setRelation, markItemUsed });

function render() {
  const scene = SC[ST.scene];
  if (!scene) return;
  document.body.classList.toggle('kabeMode', ST.scene.includes('kabe'));
  $('#storyTitle').textContent = scene.title;
  $('#sceneVal').textContent = scene.title;
  $('#storyText').innerHTML = scene.text ? scene.text() : '';
  $('#storyText').querySelectorAll('p').forEach(paragraph => {
    if (/«|"/.test(paragraph.textContent)) paragraph.classList.add('storyVoice');
    if (paragraph.querySelector('.profileTrace')) paragraph.classList.add('storyTrace');
  });
  const image = scene.img || IMG.place;
  $('#storyImg').src = image.src;
  $('#imgLegend').textContent = image.lg || '';
  const choices = typeof scene.choices === 'function' ? scene.choices() : scene.choices;
  const box = $('#choices');
  box.innerHTML = '';
  (choices || []).forEach((choice, idx) => {
    const id = choice.id || choiceId(ST.scene, choice.key || String(idx + 1));
    const normalizedChoice = { ...choice, id, once: choice.once ?? Boolean(choice.test) };
    if (!choiceAvailable(ST, normalizedChoice, ST.scene)) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    if (choice.test?.stat) button.classList.add('attr-' + choice.test.stat);
    const tags = choice.test ? `<span class="tag">${choice.test.stat}</span><span class="tag">${choice.test.skill || ''}</span><span class="tag">DD ${choice.test.dd}</span>` : '';
    button.innerHTML = `<strong>${idx + 1}. ${choice.label}</strong><small>${choice.hint || ''}</small><div class="tags">${tags}</div>${consequence(choice.effect)}`;
    button.addEventListener('click', () => handleChoice(normalizedChoice));
    box.appendChild(button);
  });
  bars();
  renderStats();
  renderInventoryCards();
  renderPressureClock();
  renderCaseMap();
  renderTimeline();
  renderCasePanel();
  $('#objectiveText').textContent = ST.objective;
  markVisited(ST.scene);
}

function handleChoice(choice) {
  if (choiceLocked || (choice.once && isResolved(ST, choice.id))) return;
  choiceLocked = true;
  playSfx('click');
  if (choice.test) {
    pending = choice;
    openDice(choice);
    return;
  }
  if (choice.once && !resolveChoice(ST, choice.id)) {
    choiceLocked = false;
    return;
  }
  if (choice.immediate) choice.immediate(ST);
  const target = resolveTarget(choice.go);
  if (target) moveTo(target);
  else {
    save();
    render();
    choiceLocked = false;
  }
}

function resolveTarget(target) {
  if (typeof target === 'function') return target(ST);
  return target || null;
}

function moveTo(sceneId) {
  ST.scene = sceneId;
  const scene = SC[sceneId];
  addObj('Deplacement: ' + (scene ? scene.title : sceneId));
  choiceLocked = false;
  document.querySelector('.mid')?.classList.remove('sceneEntering');
  requestAnimationFrame(() => document.querySelector('.mid')?.classList.add('sceneEntering'));
  save();
  render();
  setAmbience(sceneId);
  const voice = SCENE_VOICES[sceneId];
  if (voice && !heardVoices.has(sceneId)) {
    heardVoices.add(sceneId);
    window.setTimeout(() => playSfx(voice), 280);
  }
}

function gatherModifiers(test) {
  const result = { mod: ST.stats[test.stat] || 0, spendLevier: false, spendFrag: false, spendPush: false, parts: [`${test.stat} +${ST.stats[test.stat] || 0}`] };
  if (test.skill && ST.skills[test.skill]) {
    result.mod += 1;
    result.parts.push(`${test.skill} +1`);
  }
  if ($('#useLevier')?.checked && ST.flux > 0) {
    result.mod += 2;
    result.spendLevier = true;
    result.parts.push('Levier +2');
  }
  if ($('#usePush')?.checked && ST.stress < 5) {
    result.mod += 2;
    result.spendPush = true;
    result.parts.push('Forcer +2');
  }
  if ($('#useFrag')?.checked && ST.frag > 0) {
    result.mod += 2;
    result.spendFrag = true;
    result.parts.push('Preuve +2');
  }
  return result;
}

function openDice(choice) {
  const overlay = $('#diceOverlay');
  pendingOutcome = null;
  rolling = false;
  overlay.style.display = 'flex';
  $('#diceTitle').textContent = choice.label;
  $('#diceInfo').textContent = `${choice.test.stat}/${choice.test.skill || '—'} · DD ${choice.test.dd}. Ajoute une ressource, puis lance une seule fois.`;
  $('#btnRollDice').disabled = false;
  $('#btnRollDice').style.display = 'inline-flex';
  $('#btnResolveDice').style.display = 'none';
  $('#diceModifiers').innerHTML = `
    <label class="badge"><input type="checkbox" id="useLevier" ${ST.flux <= 0 ? 'disabled' : ''}> +2 Levier (${ST.flux})</label>
    <label class="badge"><input type="checkbox" id="usePush" ${ST.stress >= 5 ? 'disabled' : ''}> +2 Forcer (+1 stress)</label>
    <label class="badge"><input type="checkbox" id="useFrag" ${ST.frag <= 0 ? 'disabled' : ''}> +2 Preuve (${ST.frag})</label>`;
  focusFirst(overlay.querySelector('.diceWrap'));
}

function setDieFace(el, value) {
  el.dataset.face = value;
  el.setAttribute('aria-label', `De ${value}`);
}

function startDice() {
  if (!pending || rolling || pendingOutcome) return;
  rolling = true;
  playSfx('dice');
  $('#btnRollDice').disabled = true;
  document.querySelectorAll('#diceModifiers input').forEach(input => { input.disabled = true; });
  $('#d1').classList.add('rolling');
  $('#d2').classList.add('rolling');
  clearInterval(diceTimer);
  diceTimer = setInterval(() => {
    setDieFace($('#d1'), 1 + Math.floor(Math.random() * 6));
    setDieFace($('#d2'), 1 + Math.floor(Math.random() * 6));
  }, 70);
  $('#diceInfo').innerHTML = '<div class="diceSummary">Le dossier tourne.</div>';
  clearTimeout(diceAutoResolve);
  diceAutoResolve = window.setTimeout(stopDice, 720);
}

function stopDice() {
  if (!pending || pendingOutcome || !rolling) return;
  rolling = false;
  clearInterval(diceTimer);
  const a = 1 + Math.floor(Math.random() * 6);
  const b = 1 + Math.floor(Math.random() * 6);
  setDieFace($('#d1'), a);
  setDieFace($('#d2'), b);
  $('#d1').classList.remove('rolling');
  $('#d2').classList.remove('rolling');
  $('#d1').classList.add('settle');
  $('#d2').classList.add('settle');
  setTimeout(() => {
    $('#d1').classList.remove('settle');
    $('#d2').classList.remove('settle');
  }, 520);
  const mods = gatherModifiers(pending.test);
  const total = a + b + mods.mod;
  pendingOutcome = { ...mods, a, b, sum: a + b, total, ok: total >= pending.test.dd };
  $('#diceOverlay').classList.remove('is-success', 'is-failure');
  $('#diceOverlay').classList.add(pendingOutcome.ok ? 'is-success' : 'is-failure');
  $('#diceInfo').innerHTML = `
    <div class="diceSummary">${a} + ${b} = ${a + b}</div>
    <div class="diceBreakdown">${mods.parts.join(' / ')}</div>
    <div class="diceStatus ${pendingOutcome.ok ? 'success' : 'fail'}">${pendingOutcome.ok ? 'Reussite' : 'Echec'} - ${total} contre DD ${pending.test.dd}</div>`;
  $('#btnRollDice').style.display = 'none';
  $('#btnResolveDice').style.display = 'inline-flex';
  $('#btnResolveDice').focus();
}

function resolveRoll() {
  if (!pending || !pendingOutcome) return;
  const choice = pending;
  const outcome = pendingOutcome;
  if (choice.once && !resolveChoice(ST, choice.id)) return;
  if (outcome.spendLevier) ST.flux -= 1;
  if (outcome.spendFrag) ST.frag -= 1;
  if (outcome.spendPush) {
    ST.stress = Math.min(5, ST.stress + 1);
    addPressure(1);
  }
  log(`${choice.test.stat}/${choice.test.skill || '-'} - ${outcome.ok ? 'Reussite' : 'Echec'} (${outcome.total})`);
  playSfx(outcome.ok ? 'success' : 'failure');
  if (outcome.ok && choice.test.ok) choice.test.ok(ST);
  if (!outcome.ok && choice.test.ko) choice.test.ko(ST);
  const target = resolveTarget(outcome.ok ? (choice.goOK || choice.go) : (choice.goKO || choice.go));
  $('#diceOverlay').style.display = 'none';
  $('#diceOverlay').classList.remove('is-success', 'is-failure');
  pending = null;
  pendingOutcome = null;
  if (target) moveTo(target);
  else {
    save();
    render();
  }
}

$('#btnExport').addEventListener('click', () => {
  playSfx('click');
  const blob = new Blob([localStorage.getItem(SAVE) || '{}'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bail_noir_v2_sauvegarde.json';
  a.click();
  URL.revokeObjectURL(url);
});
$('#btnImport').addEventListener('click', () => {
  playSfx('click');
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem(SAVE, reader.result);
      load();
      render();
    };
    reader.readAsText(file);
  };
  input.click();
});
$('#btnReset').addEventListener('click', () => {
  playSfx('click');
  resetGame();
});
$('#btnChooseArch').addEventListener('click', () => {
  playSfx('click');
  closeIntro();
  openArch();
});
$('#btnRandom').addEventListener('click', () => {
  playSfx('click');
  const arch = ARCH[Math.floor(Math.random() * ARCH.length)];
  const card = Array.from(document.querySelectorAll('.arch')).find(el => el.textContent.includes(arch.name));
  selectArch(arch, card);
});
$('#btnConfirm').addEventListener('click', () => {
  playSfx('click');
  confirmArch();
});
$('#btnRollDice').addEventListener('click', startDice);
$('#btnResolveDice').addEventListener('click', resolveRoll);
$('#kabeGameClose').addEventListener('click', () => {
  playSfx('click');
  closeKabeNetwork(true);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Tab' && document.body.classList.contains('dossierOpen')) {
    const drawer = $('#dossierDrawer');
    const list = focusables(drawer);
    if (list.length) {
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && (document.activeElement === first || !drawer.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !drawer.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }
  }
  if (event.key === 'Escape') {
    closeDossier();
    closeKabeNetwork(true);
  }
});

setupNav();
syncAudioToggle();
setView('all');
load();
render();
if (!ST.arch) openIntro();
