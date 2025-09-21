export const KABE_GESTURES = {
  brume: { name: 'Brume d’absinthe', notes: 'Assourdit la salle et adoucit la Sourdine.', tone: '#7fb3ff', icon: '💨' },
  braise: { name: 'Braise confite', notes: 'Chaleur fumée qui tient les cœurs éveillés.', tone: '#ff8a5c', icon: '🔥' },
  givre: { name: 'Givre de menthe noire', notes: 'Froid sec qui tranche les excès.', tone: '#8cecff', icon: '❄️' },
  pulse: { name: 'Pulse magnétique', notes: 'Battement salin qui cale la ronde.', tone: '#b89cff', icon: '🎚️' },
  sève: { name: 'Sève cardée', notes: 'Épaisseur végétale qui rassure les nerfs.', tone: '#6fdd9d', icon: '🌿' },
  voile: { name: 'Voile de sureau', notes: 'Fleurs blanches qui filtrent la Sourdine.', tone: '#ffb0f7', icon: '🫧' },
  zeste: { name: 'Zeste d’orage', notes: 'Agrume électrique qui réveille le palais.', tone: '#ffd86b', icon: '⚡️' },
  sel: { name: 'Sel de darse', notes: 'Cristaux salins qui rappellent le quai.', tone: '#8ed6ff', icon: '🧂' }
};

export const KABE_RITUALS = [
  {
    id: 'velours',
    name: 'Velours de veille',
    clue: 'Kabé veut endormir les capteurs : couvre la salle, stabilise, puis scelle avec une chaleur douce.',
    sequence: ['voile', 'sève', 'braise'],
    palette: ['voile', 'pulse', 'sève', 'braise', 'zeste']
  },
  {
    id: 'orage',
    name: 'Orage contenu',
    clue: 'Il faut réveiller la ronde sans casser le silence : une pointe vive, calmer aussitôt, puis verrouiller par un souffle froid.',
    sequence: ['zeste', 'brume', 'givre'],
    palette: ['zeste', 'brume', 'givre', 'braise', 'pulse']
  },
  {
    id: 'rebond',
    name: 'Rebond des habitués',
    clue: 'Kabé réclame un rythme rebondissant : pulse la table, lie avec un voile, puis relève par une douceur végétale.',
    sequence: ['pulse', 'voile', 'sève'],
    palette: ['pulse', 'voile', 'sève', 'brume', 'givre']
  },
  {
    id: 'rade',
    name: 'Ancre des darses',
    clue: 'Les mariniers veulent oublier la vase : appelle la brume, verse le sel des quais, termine par une braise confite.',
    sequence: ['brume', 'sel', 'braise'],
    palette: ['brume', 'sel', 'braise', 'sève', 'zeste']
  },
  {
    id: 'clair',
    name: 'Clair sous la Sourdine',
    clue: 'Pour garder les idées claires : givre l’esprit, impose une pulse régulière, referme avec un voile protecteur.',
    sequence: ['givre', 'pulse', 'voile'],
    palette: ['givre', 'pulse', 'voile', 'brume', 'sève']
  }
];
