import { ARCH } from './data/arch.js';
import { IMG } from './data/images.js';
import { ST, markVisited, SAVE, ITEM_META, addPressure, setRelation } from './data/state.js';
import { KABE_ACTIONS } from './data/kabe.js';
import { createScenes } from './data/scenes.js';

const VIEW_LABELS = { all: 'Tous', story: 'Histoire', profile: 'Profil', journal: 'Dossier' };
const STAT_LABELS = { DOC: 'Dossier', SOC: 'Social', TEC: 'Technique', RUE: 'Rue' };
const AUDIO_SAVE = 'bail_noir_audio_muted';
const SFX = {
  click: 'assets/bail-noir/audio/dossier-click.mp3',
  dice: 'assets/bail-noir/audio/dice-roll.mp3',
  success: 'assets/bail-noir/audio/success.mp3',
  failure: 'assets/bail-noir/audio/failure.mp3',
  kabe: 'assets/bail-noir/audio/kabe-action.mp3'
};
const $ = q => document.querySelector(q);
const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

const MAP_NODES = [
  { key: 'place', label: 'Place', x: 18, y: 34, role: 'Disparition de Nora' },
  { key: 'marseille', label: 'Marseille', x: 45, y: 22, role: 'Archives et juristes' },
  { key: 'mazagran', label: 'Mazagran', x: 30, y: 64, role: 'Technique et acces' },
  { key: 'kabe', label: 'Kabe', x: 62, y: 55, role: 'Reseau clandestin' },
  { key: 'berges', label: 'Berges', x: 78, y: 36, role: 'Fourgonnette' },
  { key: 'regie', label: 'Regie', x: 84, y: 72, role: 'Confrontation' }
];

const CONTACTS = [
  { key: 'zaza', name: 'Samia', role: 'informatrice de la Place' },
  { key: 'mika', name: 'Mika', role: 'serrurier de Mazagran' },
  { key: 'yugs', name: 'Yugs', role: 'coursier des berges' },
  { key: 'chacha', name: 'Chacha', role: 'serveuse chez Kabe' },
  { key: 'mymy', name: 'Mymy', role: 'relais des dettes Kabe' },
  { key: 'anette', name: 'Anette', role: 'memoire du quartier' },
  { key: 'laura', name: 'Laura', role: 'agente a la Regie' },
  { key: 'anto', name: 'Anto', role: 'vigile de Kabe' },
  { key: 'pauline', name: 'Pauline', role: 'habitante menacee' },
  { key: 'kabe', name: 'Kabe', role: 'hub social' }
];

let pending = null;
let pendingOutcome = null;
let selectedArch = null;
let archReturnFocus = null;
let kabeReturnFocus = null;
let diceTimer = null;
let audioMuted = localStorage.getItem(AUDIO_SAVE) === 'true';
let audioReady = false;
const audioClips = Object.fromEntries(Object.entries(SFX).map(([key, src]) => {
  const clip = new Audio(src);
  clip.preload = 'auto';
  clip.volume = key === 'dice' ? 0.42 : 0.35;
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
  Object.values(audioClips).forEach(clip => {
    clip.load();
  });
}

function playSfx(name) {
  if (audioMuted) return;
  unlockAudio();
  const clip = audioClips[name];
  if (!clip) return;
  clip.currentTime = 0;
  clip.play().catch(() => {});
}

function toggleAudio() {
  audioMuted = !audioMuted;
  localStorage.setItem(AUDIO_SAVE, String(audioMuted));
  if (audioMuted) Object.values(audioClips).forEach(clip => clip.pause());
  syncAudioToggle();
  if (!audioMuted) playSfx('click');
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
    const data = JSON.parse(localStorage.getItem(SAVE) || 'null');
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
      inv: data.i || ST.inv,
      scene: data.sc || 'retour_place',
      objective: data.o || ST.objective,
      objLog: data.ol || []
    });
    ST.tags = new Set(data.t || []);
    ST.visited = new Set(data.v || []);
  } catch {
    localStorage.removeItem(SAVE);
  }
}

function resetGame() {
  pending = null;
  pendingOutcome = null;
  clearInterval(diceTimer);
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
    inv: [],
    tags: new Set(),
    scene: 'retour_place',
    objective: 'Retrouver Nora avant l evacuation de 6 h.',
    objLog: [],
    visited: new Set()
  });
  $('#log').innerHTML = '';
  $('#testPanel').style.display = 'none';
  $('#diceOverlay').style.display = 'none';
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

function setupNav() {
  document.querySelectorAll('[data-viewto]').forEach(button => {
    button.addEventListener('click', () => setView(button.getAttribute('data-viewto')));
  });
  $('#audioToggle')?.addEventListener('click', toggleAudio);
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
        <strong>${item}</strong>
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
      ${CONTACTS.map(contact => `<div class="contactCard contact-${contact.key} ${ST.relations[contact.key] > 0 ? 'warm' : ''}">
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
  prompt.innerHTML = '<strong>Reseau de Kabe</strong> - Chacha trie les rumeurs, Mymy fait circuler les faveurs, Anto garde le seuil.';
  sequence.innerHTML = `<div class="kabeLedger"><span>Levier: <b>${ST.flux}</b></span><span>Preuves: <b>${ST.frag}</b></span><span>Pression: <b>${ST.pressure}/6</b></span></div>`;
  palette.innerHTML = '';
  KABE_ACTIONS.forEach(action => {
    const available = !action.when || action.when(ST);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn kabeAction';
    button.disabled = !available;
    button.innerHTML = `<span class="kabeGestureLabel"><span class="kabeGestureBadge" aria-hidden="true">${available ? '!' : '-'}</span><span class="kabeGestureName">${action.name}</span></span><small>${action.cost} - ${action.notes}</small>`;
    button.addEventListener('click', () => {
      playSfx('kabe');
      action.apply({ state: ST, addObj, gainItem, hasItem, log, addPressure, setRelation });
      save();
      renderKabeNetwork();
    });
    palette.appendChild(button);
  });
  message.textContent = 'Une action peut ouvrir une porte, creer une dette ou faire monter la pression.';
}

const SC = createScenes({ addObj, gainItem, hasItem, log, openKabeNetwork, addPressure, setRelation, markItemUsed });

function render() {
  markVisited(ST.scene);
  const scene = SC[ST.scene];
  if (!scene) return;
  document.body.classList.toggle('kabeMode', ST.scene.includes('kabe'));
  $('#storyTitle').textContent = scene.title;
  $('#sceneVal').textContent = scene.title;
  $('#storyText').innerHTML = scene.text ? scene.text() : '';
  const image = scene.img || IMG.place;
  $('#storyImg').src = image.src;
  $('#imgLegend').textContent = image.lg || '';
  const choices = typeof scene.choices === 'function' ? scene.choices() : scene.choices;
  const box = $('#choices');
  box.innerHTML = '';
  (choices || []).forEach((choice, idx) => {
    if (choice.when && !choice.when()) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    if (choice.test?.stat) button.classList.add('attr-' + choice.test.stat);
    const tags = choice.test ? `<span class="tag">${choice.test.stat}</span><span class="tag">${choice.test.skill || ''}</span><span class="tag">DD ${choice.test.dd}</span>` : '';
    button.innerHTML = `<strong>${idx + 1}. ${choice.label}</strong><small>${choice.hint || ''}</small><div class="tags">${tags}</div>${consequence(choice.effect)}`;
    button.addEventListener('click', () => handleChoice(choice));
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
}

function handleChoice(choice) {
  playSfx('click');
  if (choice.immediate) choice.immediate(ST);
  if (choice.test) {
    pending = choice;
    showTest(choice);
    return;
  }
  const target = resolveTarget(choice.go);
  if (target) moveTo(target);
  else {
    save();
    render();
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
  $('#testPanel').style.display = 'none';
  save();
  render();
}

function showTest(choice) {
  $('#testPanel').style.display = 'block';
  $('#testName').textContent = `${choice.test.stat}/${choice.test.skill || '-'}`;
  $('#testDD').textContent = choice.test.dd;
  ['#useLevier', '#usePush', '#useFrag'].forEach(sel => {
    const el = $(sel);
    if (el) el.checked = false;
  });
  $('#useLevier').disabled = ST.flux <= 0;
  $('#useFrag').disabled = ST.frag <= 0;
  $('#usePush').disabled = ST.stress >= 5;
  $('#testResult').textContent = '';
  $('#testResult').className = 'testResult';
  updateTestHint();
}

function gatherModifiers(test) {
  const result = { mod: ST.stats[test.stat] || 0, spendLevier: false, spendFrag: false, spendPush: false, parts: [`${test.stat} +${ST.stats[test.stat] || 0}`] };
  if (test.skill && ST.skills[test.skill]) {
    result.mod += 1;
    result.parts.push(`${test.skill} +1`);
  }
  if ($('#useLevier').checked && ST.flux > 0) {
    result.mod += 2;
    result.spendLevier = true;
    result.parts.push('Levier +2');
  }
  if ($('#usePush').checked && ST.stress < 5) {
    result.mod += 2;
    result.spendPush = true;
    result.parts.push('Forcer +2');
  }
  if ($('#useFrag').checked && ST.frag > 0) {
    result.mod += 2;
    result.spendFrag = true;
    result.parts.push('Preuve +2');
  }
  return result;
}

function updateTestHint() {
  if (!pending) {
    $('#testHint').textContent = '';
    return;
  }
  const mods = gatherModifiers(pending.test);
  $('#testHint').textContent = `${mods.parts.join(' + ')} = +${mods.mod} (DD ${pending.test.dd})`;
}

function setDieFace(el, value) {
  el.dataset.face = value;
  el.setAttribute('aria-label', `De ${value}`);
}

function startDice() {
  if (!pending) return;
  playSfx('dice');
  pendingOutcome = null;
  $('#diceOverlay').style.display = 'flex';
  $('#btnStopDice').disabled = false;
  $('#btnResolveDice').style.display = 'none';
  $('#diceTitle').textContent = `${pending.test.stat}/${pending.test.skill || '-'} - DD ${pending.test.dd}`;
  $('#d1').classList.add('rolling');
  $('#d2').classList.add('rolling');
  clearInterval(diceTimer);
  diceTimer = setInterval(() => {
    setDieFace($('#d1'), 1 + Math.floor(Math.random() * 6));
    setDieFace($('#d2'), 1 + Math.floor(Math.random() * 6));
  }, 70);
  $('#diceInfo').innerHTML = '<div class="diceSummary">Le dossier tourne. Fige le resultat quand tu prends le risque.</div>';
}

function stopDice() {
  if (!pending || pendingOutcome) return;
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
  $('#diceInfo').innerHTML = `
    <div class="diceSummary">${a} + ${b} = ${a + b}</div>
    <div class="diceBreakdown">${mods.parts.join(' / ')}</div>
    <div class="diceStatus ${pendingOutcome.ok ? 'success' : 'fail'}">${pendingOutcome.ok ? 'Reussite' : 'Echec'} - ${total} contre DD ${pending.test.dd}</div>`;
  $('#btnStopDice').disabled = true;
  $('#btnResolveDice').style.display = 'inline-flex';
  $('#btnResolveDice').focus();
}

function resolveRoll() {
  if (!pending || !pendingOutcome) return;
  const choice = pending;
  const outcome = pendingOutcome;
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
  $('#testResult').textContent = `${outcome.ok ? 'Reussite' : 'Echec'} - ${outcome.total} (DD ${choice.test.dd})`;
  $('#testResult').className = `testResult show ${outcome.ok ? 'success' : 'fail'}`;
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
$('#btnStopDice').addEventListener('click', stopDice);
$('#btnResolveDice').addEventListener('click', resolveRoll);
$('#rollBtn').addEventListener('click', startDice);
['#useLevier', '#usePush', '#useFrag'].forEach(sel => $(sel).addEventListener('change', updateTestHint));
$('#kabeGameClose').addEventListener('click', () => {
  playSfx('click');
  closeKabeNetwork(true);
});
$('#kabeGameRetry').addEventListener('click', () => {
  playSfx('click');
  renderKabeNetwork();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeKabeNetwork(true);
});

setupNav();
syncAudioToggle();
setView('all');
load();
render();
if (!ST.arch) openIntro();
