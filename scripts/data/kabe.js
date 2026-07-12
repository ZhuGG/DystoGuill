export const KABE_ACTIONS = [
  {
    id: 'chacha',
    lane: 'Écouter',
    name: 'Demander à Chacha de trier une rumeur',
    cost: 'Gratuit',
    outcome: 'Débloque la piste des berges et la trace de Nora.',
    risk: 'Aucune dette, mais la piste devient publique chez Kabé.',
    when: state => !state.tags.has('Kabe_Rumeur'),
    apply: ({ state, addObj, log, setRelation }) => {
      state.tags.add('Kabe_Rumeur');
      state.tags.add('Nora_Trace');
      setRelation('chacha', 1);
      state.objective = 'Vérifier la fourgonnette blanche aux berges.';
      addObj('Chacha confirme la fourgonnette de la Régie près des berges.');
      log('Chacha baisse le son: "La fourgonnette revient toujours par le quai."');
    }
  },
  {
    id: 'mymy',
    lane: 'Protéger',
    name: 'Demander à Mymy de faire circuler un avertissement',
    cost: '1 Levier',
    outcome: 'Stress -1 et une couverture pour la Régie.',
    risk: 'Dette Kabé : le réseau te demandera de rendre ce geste.',
    when: state => state.flux > 0 && !state.tags.has('Mymy_Avertit'),
    apply: ({ state, addObj, log, setRelation }) => {
      state.flux -= 1;
      state.tags.add('Mymy_Avertit');
      state.tags.add('Mymy_Confiance');
      state.tags.add('Kabe_Dette');
      state.tags.add('Kabe_Couvre_Regie');
      setRelation('mymy', 2);
      setRelation('kabe', 1);
      state.stress = Math.max(0, state.stress - 1);
      state.objective = 'Utiliser le réseau de Kabé sans laisser la dette te choisir.';
      addObj('Mymy fait passer un avertissement. Stress -1, dette Kabé ouverte.');
      log('Mymy note deux prénoms sur un ticket de caisse: « Je peux les prévenir. Pas effacer cette putain de dette. »');
    }
  },
  {
    id: 'zaza',
    lane: 'Protéger',
    name: 'Faire passer un mot à Samia',
    cost: '1 Levier',
    outcome: 'La Place protège Pauline et devient plus bavarde.',
    risk: 'Dette Kabé : Mymy inscrit la faveur.',
    when: state => state.flux > 0 && !state.tags.has('Zaza_Couvre'),
    apply: ({ state, addObj, log, setRelation }) => {
      state.flux -= 1;
      state.tags.add('Zaza_Couvre');
      state.tags.add('Kabe_Dette');
      setRelation('zaza', 1);
      setRelation('mymy', 1);
      setRelation('pauline', 1);
      state.stress = Math.max(0, state.stress - 1);
      addObj('Samia couvre Pauline et Mymy fait circuler les noms menacés. Stress -1, dette Kabé ouverte.');
      log('La Place parle sans regarder les caméras. Mymy garde la liste dans sa manche.');
    }
  },
  {
    id: 'mika',
    lane: 'Ouvrir',
    name: 'Appeler Mika pour une serrure',
    cost: '1 Preuve',
    outcome: 'Reçoit un badge grillé pour approcher la Régie.',
    risk: 'Dépense 1 preuve et ouvre une dette Kabé.',
    when: state => state.frag > 0 && !state.tags.has('Mika_Passe'),
    apply: ({ state, addObj, gainItem, log, setRelation }) => {
      state.frag -= 1;
      state.tags.add('Mika_Passe');
      state.tags.add('Badge_Regie');
      state.tags.add('Kabe_Dette');
      setRelation('mika', 1);
      setRelation('mymy', 1);
      gainItem('Badge Regie grille');
      addObj('Mika prépare un badge Régie grillé. Preuve -1, objet +1, dette Kabé ouverte.');
      log('Mika: "Je ne garantis pas la porte. Je garantis trois secondes."');
    }
  },
  {
    id: 'yugs',
    lane: 'Protéger',
    name: 'Protéger Yugs',
    cost: 'Risque',
    outcome: 'Yugs est protégé : son témoignage reste exploitable.',
    risk: 'Pression +1 : la Régie comprend que Kabé bouge.',
    when: state => (state.tags.has('Kabe_Rumeur') || state.tags.has('Yugs_Temoin')) && !state.tags.has('TemoinProtege'),
    apply: ({ state, addObj, log, setRelation, addPressure }) => {
      state.tags.add('TemoinProtege');
      state.tags.add('Kabe_Dette');
      setRelation('yugs', 1);
      setRelation('anto', 1);
      setRelation('mymy', 1);
      addPressure(1);
      addObj('Yugs est caché chez Kabé. Pression +1, témoin protégé.');
      log('Anto referme le rideau métallique. « Maintenant, on ferme notre gueule et on tient la porte. »');
    }
  },
  {
    id: 'antoine',
    lane: 'Ouvrir',
    name: 'Confronter le nom d Antoine',
    cost: 'Pression',
    outcome: 'Donne le nom d’Antoine et une preuve supplémentaire.',
    risk: 'Pression +1 : Antoine est alerté.',
    when: state => state.tags.has('Kabe_Rumeur') && !state.tags.has('Anto_Allie'),
    apply: ({ state, addObj, log, setRelation, addPressure }) => {
      state.tags.add('Anto_Allie');
      state.tags.add('Regie_Localisee');
      state.tags.add('Antoine_Alerte');
      setRelation('anto', 1);
      setRelation('kabe', 1);
      state.frag += 1;
      addPressure(1);
      addObj('Anto donne un nom: Antoine, cadre de la Regie. Preuve +1, Pression +1.');
      log('Anto parle bas: "Antoine signe les departs avant les audiences."');
    }
  }
];
