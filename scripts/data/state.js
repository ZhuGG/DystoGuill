export const ST = {
  arch: null,
  stats: { NEU: 2, VOL: 2, SOM: 2, CIN: 2 },
  skills: {},
  stress: 2,
  hp: 5,
  flux: 2,
  frag: 2,
  inv: [],
  tags: new Set(),
  scene: 'prologue',
  objective: 'Tracer une voie sûre vers T1.',
  objLog: [],
  visited: new Set(),
  ascii: true
};

export const VISIT_KEYS = [
  { key: 'prologue', match: scene => scene === 'prologue' },
  { key: 'place', match: scene => scene.startsWith('place_') },
  { key: 'collectif', match: scene => scene === 'place_collectif' },
  { key: 'maz', match: scene => scene.startsWith('maz_') },
  { key: 'kabe', match: scene => scene === 'maz_apero' || scene === 'maz_apero_anto' },
  { key: 'atelier', match: scene => scene === 'maz_atelier' },
  { key: 'ber', match: scene => scene.startsWith('ber_') },
  { key: 'patrouille', match: scene => scene === 'ber_patrouille' },
  { key: 'pon', match: scene => scene.startsWith('pon_') },
  { key: 'ombre', match: scene => scene === 'pon_shadow' },
  { key: 't1', match: scene => scene.startsWith('t1_') },
  { key: 'perimetre', match: scene => scene === 't1_overlook' }
];

export function markVisited(scene) {
  VISIT_KEYS.forEach(entry => {
    if (entry.match(scene)) {
      ST.visited.add(entry.key);
    }
  });
}

export function clearEndingTags() {
  ['End_Social', 'End_Infil', 'End_Tech', 'End_Contournement', 'End_Noise', 'End_Soft'].forEach(tag => {
    ST.tags.delete(tag);
  });
}

export function markEndingApproach() {
  if (ST.tags.has('Pont_Escorte') || ST.tags.has('Collectif_Favor') || ST.tags.has('T1_Soutien')) {
    ST.tags.add('End_Social');
  }
  if (ST.tags.has('Pont_Souterrain') || ST.tags.has('T1_Grille')) {
    ST.tags.add('End_Infil');
  }
  if (ST.tags.has('BadgeTech') || ST.tags.has('BadgeTech_Used') || ST.tags.has('Acces_Tech') || ST.tags.has('T1_Silence')) {
    ST.tags.add('End_Tech');
  }
}

export function pickEnding(mode) {
  const social = ST.tags.has('End_Social');
  const infiltr = ST.tags.has('End_Infil');
  const tech = ST.tags.has('End_Tech');
  if (mode === 'cont') {
    if (tech) return 'ep_cont_tech';
    if (social) return 'ep_cont_social';
    if (infiltr) return 'ep_cont_shadow';
    return 'ep_cont';
  }
  if (mode === 'noise') {
    if (tech) return 'ep_noise_tech';
    if (infiltr) return 'ep_noise_shadow';
    if (social) return 'ep_noise_social';
    return 'ep_noise';
  }
  if (mode === 'soft') {
    if (social) return 'ep_soft_collectif';
    if (infiltr) return 'ep_soft_shadow';
    if (tech) return 'ep_soft_tech';
    return 'ep_soft';
  }
  return 'ep_silent';
}

export const SAVE = 'td_v6_4';
