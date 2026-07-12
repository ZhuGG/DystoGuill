export const ARCH = [
  {
    id: 'journaliste',
    name: 'Ancien journaliste local',
    img: 'assets/bail-noir/arch-journaliste.jpg',
    back: 'Tu as quitte la Guillotiere quand ton journal a ferme. Nora t a laisse un message avant de disparaitre. Tu sais lire les dossiers, recouper les dates et faire parler les silences.',
    stats: { DOC: 3, SOC: 2, TEC: 1, RUE: 2 },
    skills: { Archives: 1, Persuasion: 1 },
    start: ['Carte de presse perimee', 'Carnet a spirale', 'Dictaphone fendu']
  },
  {
    id: 'maintenance',
    name: 'Ex-agent de maintenance',
    img: 'assets/bail-noir/arch-maintenance.jpg',
    back: 'Tu connais les sous-sols, les boitiers et les portes qui ferment mal. La Regie a privatise ton ancien service et efface ton badge, mais pas tes habitudes.',
    stats: { DOC: 1, SOC: 2, TEC: 3, RUE: 2 },
    skills: { Maintenance: 1, Discretion: 1 },
    start: ['Badge grille', 'Cle triangulaire', 'Lampe frontale']
  },
  {
    id: 'mediatrice',
    name: 'Médiatrice de quartier',
    img: 'assets/bail-noir/arch-mediatrice.jpg',
    back: 'Tu as tenu des permanences dans les cages d escalier et les salles prêtées. Tu connais les colères, les dettes, les familles qui n appellent plus la police.',
    stats: { DOC: 2, SOC: 3, TEC: 1, RUE: 2 },
    skills: { Mediation: 1, Reseau: 1 },
    start: ['Repertoire papier', 'Trousse de secours', 'Cle du local commun']
  }
];
