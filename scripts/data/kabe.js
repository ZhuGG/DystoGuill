export const KABE_ACTIONS = [
  {
    id: 'chacha',
    name: 'Demander a Chacha de trier une rumeur',
    cost: 'Gratuit',
    notes: 'Elle separe les mythos utiles des vraies alertes.',
    when: state => !state.tags.has('Kabe_Rumeur'),
    apply: ({ state, addObj, log, setRelation }) => {
      state.tags.add('Kabe_Rumeur');
      state.tags.add('Nora_Trace');
      setRelation('chacha', 1);
      state.objective = 'Verifier la fourgonnette blanche aux berges.';
      addObj('Chacha confirme la fourgonnette de la Regie pres des berges.');
      log('Chacha baisse le son: "La fourgonnette revient toujours par le quai."');
    }
  },
  {
    id: 'mymy',
    name: 'Demander a Mymy de faire circuler un avertissement',
    cost: '1 Levier',
    notes: 'Elle protege un nom, mais Kabe garde la faveur ouverte.',
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
      state.objective = 'Utiliser le reseau de Kabe sans laisser la dette te choisir.';
      addObj('Mymy fait passer un avertissement. Stress -1, dette Kabe ouverte.');
      log('Mymy note deux prenoms sur un ticket de caisse: "Je peux les prevenir. Pas les effacer de la dette."');
    }
  },
  {
    id: 'zaza',
    name: 'Faire passer un mot a Samia',
    cost: '1 Levier',
    notes: 'Samia peut rendre la Place plus bavarde pendant dix minutes.',
    when: state => state.flux > 0 && !state.tags.has('Zaza_Couvre'),
    apply: ({ state, addObj, log, setRelation }) => {
      state.flux -= 1;
      state.tags.add('Zaza_Couvre');
      state.tags.add('Kabe_Dette');
      setRelation('zaza', 1);
      setRelation('mymy', 1);
      setRelation('pauline', 1);
      state.stress = Math.max(0, state.stress - 1);
      addObj('Samia couvre Pauline et Mymy fait circuler les noms menaces. Stress -1, dette Kabe ouverte.');
      log('La Place parle sans regarder les cameras. Mymy garde la liste dans sa manche.');
    }
  },
  {
    id: 'mika',
    name: 'Appeler Mika pour une serrure',
    cost: '1 Preuve',
    notes: 'Mika ouvre une piste technique, mais il veut une garantie.',
    when: state => state.frag > 0 && !state.tags.has('Mika_Passe'),
    apply: ({ state, addObj, gainItem, log, setRelation }) => {
      state.frag -= 1;
      state.tags.add('Mika_Passe');
      state.tags.add('Badge_Regie');
      state.tags.add('Kabe_Dette');
      setRelation('mika', 1);
      setRelation('mymy', 1);
      gainItem('Badge Regie grille');
      addObj('Mika prepare un badge Regie grille. Preuve -1, objet +1, dette Kabe ouverte.');
      log('Mika: "Je ne garantis pas la porte. Je garantis trois secondes."');
    }
  },
  {
    id: 'yugs',
    name: 'Proteger Yugs',
    cost: 'Risque',
    notes: 'Anto le fait entrer par l arriere avant que Thanos remonte sa trace.',
    when: state => (state.tags.has('Kabe_Rumeur') || state.tags.has('Yugs_Temoin')) && !state.tags.has('TemoinProtege'),
    apply: ({ state, addObj, log, setRelation, addPressure }) => {
      state.tags.add('TemoinProtege');
      state.tags.add('Kabe_Dette');
      setRelation('yugs', 1);
      setRelation('anto', 1);
      setRelation('mymy', 1);
      addPressure(1);
      addObj('Yugs est cache chez Kabe. Pression +1, temoin protege.');
      log('Anto referme le rideau metallique. Quelqu un dehors comprend trop tard.');
    }
  },
  {
    id: 'antoine',
    name: 'Confronter le nom d Antoine',
    cost: 'Pression',
    notes: 'Anto connait l organigramme officieux de la Regie.',
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
