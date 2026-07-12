export const ST = {
  arch: null,
  stats: { DOC: 2, SOC: 2, TEC: 2, RUE: 2 },
  skills: {},
  stress: 2,
  hp: 5,
  flux: 2,
  frag: 1,
  pressure: 1,
  relations: {
    zaza: 0,
    mika: 0,
    yugs: 0,
    chacha: 0,
    mymy: 0,
    anette: 0,
    laura: 0,
    anto: 0,
    kabe: 0,
    pauline: 0
  },
  usedItems: [],
  inv: [],
  tags: new Set(),
  scene: 'retour_place',
  objective: 'Retrouver Nora avant l evacuation de 6 h.',
  objLog: [],
  visited: new Set()
};

export const ITEM_META = {
  'Carte de presse perimee': {
    type: 'Acces',
    use: 'Met la pression sur les patrouilles et les agents frileux.',
    effect: '+Credibilite / risque de fichage',
    icon: 'PRESS'
  },
  'Dictaphone fendu': {
    type: 'Preuve',
    use: 'Fixe une deposition fragile avant qu un temoin disparaisse.',
    effect: '+Preuve audio',
    icon: 'REC'
  },
  'Carnet de mediatrice': {
    type: 'Social',
    use: 'Rattache un nom a un appartement, une dette ou une audience.',
    effect: '+Relation',
    icon: 'NOM'
  },
  'Badge Regie grille': {
    type: 'Acces',
    use: 'Ouvre une porte si personne ne regarde trop longtemps.',
    effect: '+Acces Regie',
    icon: 'BADGE'
  },
  'Ancienne etiquette Anto': {
    type: 'Seuil',
    use: 'Prouve a Anto que tu connais son ancien chantier.',
    effect: '+Acces Kabe',
    icon: 'ANTO'
  }
};

export const VISIT_KEYS = [
  { key: 'place', match: scene => scene.includes('place') || scene === 'retour_place' || scene === 'dossier_leyla' },
  { key: 'marseille', match: scene => scene.includes('marseille') },
  { key: 'mazagran', match: scene => scene.includes('mazagran') },
  { key: 'kabe', match: scene => scene.includes('kabe') },
  { key: 'berges', match: scene => scene.includes('berges') },
  { key: 'regie', match: scene => scene.includes('regie') || scene.includes('final') || scene.includes('ep_') }
];

export function markVisited(scene) {
  VISIT_KEYS.forEach(entry => {
    if (entry.match(scene)) {
      ST.visited.add(entry.key);
    }
  });
}

export function clearEndingTags() {
  ['End_Public', 'End_Leyla', 'End_Market', 'End_Lost'].forEach(tag => ST.tags.delete(tag));
}

export function pickEnding(mode) {
  clearEndingTags();
  if (mode === 'public') {
    ST.tags.add('End_Public');
    if (ST.tags.has('LeylaAlive') || ST.tags.has('TemoinProtege')) return 'ep_public_leyla';
    return 'ep_public';
  }
  if (mode === 'save') {
    ST.tags.add('End_Leyla');
    return ST.frag >= 3 ? 'ep_save_with_copy' : 'ep_save';
  }
  if (mode === 'market') {
    ST.tags.add('End_Market');
    return 'ep_market';
  }
  ST.tags.add('End_Lost');
  return 'ep_lost';
}

export function setRelation(key, delta = 1) {
  ST.relations[key] = Math.max(-2, Math.min(4, (ST.relations[key] || 0) + delta));
}

export function addPressure(delta = 1) {
  ST.pressure = Math.max(0, Math.min(6, ST.pressure + delta));
}

export const SAVE = 'bail_noir_v2';
