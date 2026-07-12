import { IMG } from './images.js';
import { ST, pickEnding } from './state.js';

const evidence = (state, label, count = 1) => {
  state.frag += count;
  state.tags.add(label);
};

const profileIntro = () => {
  if (ST.arch?.id === 'journaliste') return '<p>Tu connais cette honte particulière: revenir avec un carnet quand les autres ont surtout besoin de portes ouvertes.</p>';
  if (ST.arch?.id === 'maintenance') return '<p>Les serrures neuves ont des habitudes anciennes. Certaines viennent de plans que tu as signés avant de comprendre qui les utiliserait.</p>';
  if (ST.arch?.id === 'mediatrice') return '<p>Chaque visage te rappelle une permanence, une promesse repoussée, quelqu’un que tu n’as pas réussi à retenir.</p>';
  return '';
};

const profileTrace = location => {
  const lines = {
    dossier_leyla: {
      journaliste: 'Tu reconnais une source qui écrit contre sa propre disparition. Ce dossier ne te demande pas un angle; il te demande de ne pas trahir les noms.',
      maintenance: 'Les numéros de lots correspondent à l’ancien plan de maintenance. Ton travail n’a pas expulsé les gens, mais il a appris au système où couper.',
      mediatrice: 'Trois noms ont déjà appelé ta permanence. Tu avais classé leurs courriers dans la pile « à rappeler ». Cette pile te revient en pleine gueule.'
    },
    marseille_archive: {
      journaliste: 'La formule « départ volontaire confirmé » est parfaite pour un démenti officiel: propre, courte, et complètement pourrie.',
      maintenance: 'Le scellé utilise une boucle de contrôle que tu sais contourner. La Régie n’a même pas pris la peine de changer vos vieilles habitudes.',
      mediatrice: 'Juliette ne te regarde pas comme une inconnue. Elle se souvient d’une réunion où tu avais promis que personne ne resterait seul.'
    },
    mazagran_local: {
      journaliste: 'Un plan technique n’est pas une histoire, mais il peut empêcher Antoine de prétendre qu’il ne savait pas.',
      maintenance: 'Tu reconnais ta propre écriture sous une couche de peinture. Quelqu’un a transformé une voie d’entretien en circuit d’effacement.',
      mediatrice: 'Chaque gaine rejoint un immeuble habité. Pour toi, ce ne sont pas des lignes: ce sont des portes où tu as déjà frappé.'
    },
    kabe_salle: {
      journaliste: 'Chacha te prévient: ici, un nom n’est pas une citation gratuite. Tu le publies, tu assumes ce qui lui tombe dessus.',
      maintenance: 'Anto connaît les mêmes sous-sols que toi. La différence, c’est qu’il a vu ce qu’on y faisait aux gens.',
      mediatrice: 'Mymy te reconnaît. « T’as toujours voulu aider tout le monde. C’est comme ça qu’on finit par choisir trop tard. »'
    },
    regie_entree: {
      journaliste: 'Tu connais ce décor: l’endroit où le communiqué est déjà écrit avant que les faits aient lieu.',
      maintenance: 'Le lecteur de badge porte encore l’étiquette de ton ancien service. Cette porte te reconnaît mieux que les gens qui l’utilisent.',
      mediatrice: 'Derrière chaque numéro de dossier, tu entends une voix qui t’a demandé du temps. La Régie appelle ça du stock.'
    }
  };
  const line = lines[location]?.[ST.arch?.id];
  return line ? `<p class="profileTrace">${line}</p>` : '';
};

const pressurePulse = () => {
  if (ST.pressure >= 5) return '<p class="pulseText">La ville sent l’aube. Des portes restent fermées, les témoins parlent plus bas, les accès coûtent plus cher.</p>';
  if (ST.pressure >= 3) return '<p class="pulseText">La Place se contracte. Les rideaux descendent plus tôt, les patrouilles tournent plus lentement, comme si elles avaient déjà gagné.</p>';
  return '<p class="pulseText">La nuit laisse encore quelques interstices, mais chaque détour rapproche les fourgons.</p>';
};

const returnLine = place => ST.visited.has(place)
  ? '<p class="returnLine">Tu connais maintenant le bruit de cet endroit. Les regards ne sont plus les mêmes, et la nuit a avancé sans t attendre.</p>'
  : '';

const kabeDebtLine = () => ST.tags.has('Kabe_Dette')
  ? '<p>Mymy t’a prévenu: Kabé protège les noms, mais aucune protection ne reste sans mémoire. « Ici, même les bonnes actions laissent une putain d’addition. »</p>'
  : '';

const noraFinalLine = () => ST.tags.has('NoraAlive')
  ? '<p>Nora te regarde comme si survivre ne suffisait pas. Elle veut savoir ce que tu vas laisser aux autres.</p>'
  : '<p>La voix de Nora reste dans tes notes: ne sauve pas seulement mon nom, sauve la preuve.</p>';

const profileEndingLine = () => {
  if (ST.arch?.id === 'journaliste') return 'Tu comprends trop bien la frontière entre publier et prendre.';
  if (ST.arch?.id === 'maintenance') return 'Tu reconnais chaque porte que tu forces: réparer commence parfois par saboter proprement.';
  if (ST.arch?.id === 'mediatrice') return 'Tu sais que protéger quelqu’un ne vaut rien si personne ne peut encore faire confiance demain.';
  return 'Tu restes avec une dette simple: ne pas laisser le quartier devenir une annexe de dossier.';
};

export function createScenes({ addObj, gainItem, hasItem, log, openKabeNetwork, addPressure, setRelation, markItemUsed }) {
  return {
    retour_place: {
      img: IMG.place,
      title: 'Place du Pont - Retour',
      text: () => `
        <p>La Guillotiere n a pas disparu: elle a ete renumerotee. Les avis d evacuation recouvrent les menus des snacks. A 02 h 17, Nora t a appele: <i>"Ils effacent les baux vivants."</i> Depuis, silence.</p>
        ${profileIntro()}
        <p>A 06 h, la Regie des Quartiers Calmes vide trois immeubles. Sous les arcades, <b>Samia</b> vend de faux briquets, <b>Anette</b> compte les fourgons, et <b>Pauline</b> serre un courrier qu elle n ose pas ouvrir.</p>
        ${returnLine('place')}
        ${pressurePulse()}`,
      choices: [
        { label: 'Ouvrir le dossier que Nora a laisse', hint: 'Comprendre l affaire avant de bouger', effect: '+Dossier', go: 'dossier_leyla' },
        { label: 'Interroger Samia et Anette', hint: 'SOC/Mediation (10)', effect: '+Relation Samia | +Piste Marseille | echec: +Pression', test: { stat: 'SOC', skill: 'Mediation', dd: 10, ok: s => { s.tags.add('Voisins_OK'); setRelation('zaza', 1); setRelation('anette', 1); s.objective = 'Suivre la piste de la Rue de Marseille.'; addObj('Samia et Anette parlent d une archive sortie Rue de Marseille.'); }, ko: s => { s.stress = Math.min(5, s.stress + 1); addPressure(1); log('Les portes se ferment. Stress +1, Pression +1.'); } }, goOK: 'marseille_archive', goKO: 'dossier_leyla' },
        { label: 'Descendre vers Kabe', hint: 'Anto garde le seuil', effect: '+Seuil Anto', go: 'kabe_seuil' }
      ]
    },

    dossier_leyla: {
      img: IMG.leyla,
      title: 'Dossier Nora - Bail rature',
      text: () => `
        <p>Dans l enveloppe: le bail de Nora, puis le meme bail au nom d une societe vide. Les signatures sont identiques, les dates impossibles. En marge, Nora a ecrit: Rue de Marseille, Mazagran, Berges.</p>
        <p>Une note glissee sous le bail dit: <i>"Si je disparais, ne me cherche pas seule. Cherche qui a accepte que je disparaisse."</i></p>
        <p>Au verso, une phrase plus intime: <i>« Je t’ai appelé parce que je ne sais plus si tu reviens pour nous ou pour une bonne histoire. Prouve-moi que j’ai eu raison. »</i></p>
        <p>Un nom revient sur les scans: <b>Antoine</b>, cadre intermédiaire de la Régie. Un autre, rayé trois fois: <b>Laura</b>, agente de nuit.</p>
        ${profileTrace('dossier_leyla')}`,
      choices: [
        { label: 'Classer les pieces du dossier', hint: 'DOC/Archives (9)', effect: '+Preuve | +Trace Nora', test: { stat: 'DOC', skill: 'Archives', dd: 9, ok: s => { evidence(s, 'Preuve_Bail'); s.tags.add('Nora_Trace'); s.objective = 'Remonter la chaine du bail falsifie.'; addObj('Preuve obtenue: bail falsifie de Nora.'); }, ko: s => { s.stress = Math.min(5, s.stress + 1); log('Les dates se contredisent. Stress +1.'); } }, goOK: 'place_pistes', goKO: 'place_pistes' },
        { label: 'Aller Rue de Marseille', hint: 'Juliette connait peut-etre le scelle', effect: '+Piste juridique', go: 'marseille_archive' },
        { label: 'Aller a Mazagran', hint: 'Mika sait ouvrir ce qui coince', effect: '+Piste technique', go: 'mazagran_entree' }
      ]
    },

    place_pistes: {
      img: IMG.place,
      title: 'Place du Pont - Trois pistes',
      text: () => `
        <p>Samia confirme que <b>Thanos</b>, vigile prive de la Regie, photographie les plaques. Pauline a recu une dette inventee. Anette a note une fourgonnette blanche qui revient toujours par les berges.</p>
        <p>Il te faut une archive, un temoin et un acces a la Regie. La pression monte a chaque detour.</p>
        ${pressurePulse()}`,
      choices: [
        { label: 'Fouiller la permanence Rue de Marseille', hint: 'Archive et Juliette', effect: '+Preuve possible', go: 'marseille_archive' },
        { label: 'Passer par Mazagran', hint: 'Mika, badges, traces de fourgon', effect: '+Objet possible', go: 'mazagran_entree' },
        { label: 'Chercher Kabe', hint: 'Chacha, Anto, rumeurs et dettes', effect: '+Reseau Kabe', go: 'kabe_seuil' },
        { label: 'Longer les berges', hint: 'Yugs et la fourgonnette blanche', effect: '+Temoin possible', go: 'berges_quai' }
      ]
    },

    marseille_archive: {
      img: IMG.marseille,
      title: 'Rue de Marseille - Permanence fermee',
      text: () => `
        <p>La permanence est fermee par un scelle prive. <b>Juliette</b>, juriste stagiaire, attend sous un store eteint. Elle a peur de Laura, d Antoine, de tout ce qui ressemble a une badgeuse.</p>
        ${returnLine('marseille')}
        <p>À l’intérieur, l’armoire à dossiers a été forcée puis rangée trop proprement. Nora a laissé une phrase au crayon sur un coin de formulaire: <i>« Laura sait que les dates sont fausses. »</i></p>
        ${profileTrace('marseille_archive')}`,
      choices: [
        { label: 'Convaincre Juliette de parler', hint: 'SOC/Persuasion (10)', effect: '+Laura hesite | +Acces permanence', test: { stat: 'SOC', skill: 'Persuasion', dd: 10, ok: s => { s.tags.add('Juliette_Source'); s.tags.add('Laura_Hesite'); setRelation('laura', 1); addObj('Juliette donne le nom de Laura a la Regie.'); }, ko: s => { addPressure(1); log('Juliette recule. Pression +1.'); } }, goOK: 'marseille_dossiers', goKO: 'marseille_dossiers' },
        { label: 'Crocheter le scelle', hint: 'RUE/Discretion (10)', effect: '+Acces | echec: +Stress', test: { stat: 'RUE', skill: 'Discretion', dd: 10, ok: s => { s.tags.add('Acces_Permanence'); log('Le scelle se decolle en silence.'); }, ko: s => { s.stress = Math.min(5, s.stress + 1); addPressure(1); log('Une diode passe au rouge. Stress +1, Pression +1.'); } }, goOK: 'marseille_dossiers', goKO: 'marseille_dossiers' },
        { label: 'Revenir a la Place', hint: 'Changer de piste', effect: '+Temps perdu', go: 'place_pistes' }
      ]
    },

    marseille_dossiers: {
      img: IMG.marseille,
      title: 'Rue de Marseille - Dossiers blancs',
      text: () => `
        <p>Les chemises restantes portent la mention <b>depart volontaire confirme</b>. Plusieurs noms sont encore dans les boites aux lettres: Pauline, Anette, Yugs.</p>
        <p>Dans la photocopieuse, une feuille coincee garde un export signe par Antoine et valide par la direction: <i>risque social transfere, audience sans objet</i>.</p>`,
      choices: [
        { label: 'Extraire la matrice de la photocopieuse', hint: 'TEC/Maintenance (9)', effect: '+Preuve | echec: -Etat', test: { stat: 'TEC', skill: 'Maintenance', dd: 9, ok: s => { evidence(s, 'Preuve_Matrice'); addObj('Preuve obtenue: matrice des departs volontaires.'); }, ko: s => { s.hp = Math.max(0, s.hp - 1); log('Le toner te brule la main. Etat -1.'); } }, goOK: 'place_pistes', goKO: 'place_pistes' },
        { label: 'Comparer les noms au carnet', hint: 'DOC/Archives (10)', effect: '+Liste habitants', test: { stat: 'DOC', skill: 'Archives', dd: 10, ok: s => { s.tags.add('Liste_Habitants'); setRelation('pauline', 1); addObj('Liste des habitants menaces reconstituee.'); }, ko: s => { s.stress = Math.min(5, s.stress + 1); log('Trop de noms connus. Stress +1.'); } }, goOK: 'kabe_seuil', goKO: 'place_pistes' }
      ]
    },

    mazagran_entree: {
      img: IMG.mazagran,
      title: 'Mazagran - Friche sous bail',
      text: () => `
        <p>Mazagran ressemble a un chantier abandonne par des gens qui comptaient revenir. <b>Mika</b>, serrurier et reparateur de badgeuses, te reconnait avant de l admettre.</p>
        <p>Une trace de pneu descend vers les berges. Un boitier de badge clignote sur la porte d un local technique. Sur le capot ouvert, une etiquette Regie porte la mention: <i>continuite de service avant relogement</i>.</p>`,
      choices: [
        { label: 'Demander a Mika d ouvrir le local', hint: 'SOC/Reseau (9)', effect: '+Relation Mika | +Objet', test: { stat: 'SOC', skill: 'Reseau', dd: 9, ok: s => { gainItem('Badge Regie grille'); setRelation('mika', 1); s.tags.add('Badge_Regie'); addObj('Mika te confie un badge Regie grille.'); }, ko: s => { addPressure(1); log('Mika exige une garantie. Pression +1.'); } }, goOK: 'mazagran_local', goKO: 'mazagran_local' },
        { label: 'Forcer le boitier toi-meme', hint: 'TEC/Maintenance (10)', effect: '+Objet | echec: -Etat', test: { stat: 'TEC', skill: 'Maintenance', dd: 10, ok: s => { gainItem('Badge Regie grille'); s.tags.add('Badge_Regie'); addObj('Badge Regie grille recupere.'); }, ko: s => { s.hp = Math.max(0, s.hp - 1); log('Le boitier te pince les doigts. Etat -1.'); } }, goOK: 'mazagran_local', goKO: 'mazagran_local' },
        { label: 'Suivre la trace vers les berges', hint: 'Piste Yugs', effect: '+Berges', go: 'berges_quai' }
      ]
    },

    mazagran_local: {
      img: IMG.mazagran,
      title: 'Mazagran - Local technique',
      text: () => `
        <p>Un plan mural relie Mazagran a l antenne de la Regie. Quelqu un a marque un chemin en vert: court, dangereux, hors cameras.</p>
        <p>Une étiquette froissée porte le nom d’Anto. Mika dit qu’Anto travaillait avec Thanos avant de choisir Kabé, quand les expulsions s’appelaient encore accompagnements.</p>
        ${profileTrace('mazagran_local')}`,
      choices: [
        { id: 'mazagran:photographier-gaines', once: true, label: 'Photographier le plan des gaines', hint: 'Preuve et acces Regie', effect: '+Preuve | +Acces', immediate: s => { evidence(s, 'Preuve_Gaines'); s.tags.add('Acces_Gaines'); s.tags.add('Regie_Localisee'); addObj('Preuve obtenue: plan des gaines vers la Regie.'); }, go: 'place_pistes' },
        { id: 'mazagran:garder-etiquette-anto', once: true, label: 'Garder l etiquette d Anto', hint: 'Signe credible pour Kabe', effect: '+Objet | +Acces Kabe', immediate: s => { gainItem('Ancienne etiquette Anto'); setRelation('anto', 1); s.tags.add('Signe_Anto'); addObj('Tu as de quoi parler a Anto sans jouer au dur.'); }, go: 'kabe_seuil' },
        { label: 'Rejoindre les berges', hint: 'Suivre la trace de pneu', effect: '+Yugs', go: 'berges_quai' }
      ]
    },

    kabe_seuil: {
      img: IMG.kabe,
      title: 'Kabe - Le seuil d Anto',
      text: () => `
        <p>Le bar n a pas d enseigne. Anto bloque l entree, calme comme une menace fatiguee. Derriere lui, <b>Chacha</b> observe qui ment par besoin et qui ment par metier.</p>
        ${returnLine('kabe')}
        <p><b>Mymy</b> passe entre les tables avec un carnet sans couverture. Elle connait les dettes, les seuils de confiance, les gens qu il faut prevenir sans les nommer.</p>
        <p>"Kabe ne fait pas bureau des pleurs", dit Anto. Mais son regard s arrete sur ton sac, puis sur les avis colles dehors.</p>`,
      choices: () => {
        const arr = [];
        if (ST.tags.has('Signe_Anto') || hasItem('Ancienne etiquette Anto')) {
          arr.push({ label: 'Montrer l ancienne etiquette d Anto', hint: 'Entree sans test', effect: '+Acces Kabe | +Relation Anto', immediate: s => { markItemUsed('Ancienne etiquette Anto'); s.tags.add('Kabe_Entree'); setRelation('anto', 1); log('Anto reconnait l etiquette et s ecarte.'); }, go: 'kabe_salle' });
        }
        if (ST.tags.has('Voisins_OK') || ST.tags.has('Juliette_Source') || ST.tags.has('Liste_Habitants')) {
          arr.push({ label: 'Donner un nom qui compte encore', hint: 'Une alliance ouvre la porte', effect: '+Acces Kabe', immediate: s => { s.tags.add('Kabe_Entree'); setRelation('kabe', 1); log('Chacha verifie ton nom dans la salle, puis Anto te laisse entrer.'); }, go: 'kabe_salle' });
        }
        arr.push({ label: 'Convaincre Anto que Nora est en danger', hint: 'SOC/Persuasion (11)', effect: '+Acces | echec: +Pression', test: { stat: 'SOC', skill: 'Persuasion', dd: 11, ok: s => { s.tags.add('Kabe_Entree'); s.tags.add('Anto_Respect'); setRelation('anto', 1); addObj('Anto te laisse entrer chez Kabe.'); }, ko: s => { s.stress = Math.min(5, s.stress + 1); addPressure(1); log('Anto ne bouge pas. Stress +1, Pression +1.'); } }, goOK: 'kabe_salle', goKO: 'place_pistes' });
        return arr;
      }
    },

    kabe_salle: {
      img: IMG.kabe,
      title: 'Kabe - Bar d infos',
      text: () => `
        <p>Kabe trie les versions, cache les gens, garde les dettes dans une boite a biscuits. Chacha connait les rumeurs qui mentent. Mymy fait circuler les faveurs. Anto reste pres de la porte.</p>
        <p>Ici, parler trop fort peut sauver quelqu’un ou le livrer. Mymy pose le cadre: « On protège les gens. Les belles intentions, on s’en fout un peu. »</p>
        <p>Dans le carnet de Nora, une ligne barre deux noms: <i>Yugs a vu le transfert. Mymy connaît la sortie. Je leur ai demandé avant d’être sûre de pouvoir les couvrir.</i></p>
        ${profileTrace('kabe_salle')}
        ${kabeDebtLine()}`,
      choices: [
        { id: 'kabe:ouvrir-reseau', label: 'Ouvrir le reseau de Kabe', hint: 'Chacha, Mymy, Samia, Mika, Yugs, Antoine', effect: '+Actions sociales', immediate: () => openKabeNetwork() },
        { label: 'Demander ce que Nora a laisse ici', hint: 'DOC/Archives (10)', effect: '+Preuve | +Nora vivante possible', test: { stat: 'DOC', skill: 'Archives', dd: 10, ok: s => { evidence(s, 'Preuve_NoraKabe'); s.tags.add('NoraAlive'); s.tags.add('Nora_Trace'); addObj('Chacha remet une cle USB de Nora.'); }, ko: s => { s.stress = Math.min(5, s.stress + 1); log('Kabe te regarde comme si tu arrivais trop tard. Stress +1.'); } }, goOK: 'place_pistes', goKO: 'kabe_salle' },
        { label: 'Sortir par l arriere vers les berges', hint: 'Anto connait le passage', effect: '+Berges', when: () => ST.tags.has('Anto_Allie') || ST.tags.has('Kabe_Tournee'), go: 'berges_quai' },
        { label: 'Revenir a la Place', hint: 'Continuer l enquete', effect: '+Carte', go: 'place_pistes' }
      ]
    },

    berges_quai: {
      img: IMG.berges,
      title: 'Berges du Rhone - Fourgonnette blanche',
      text: () => `
        <p>Les berges sont vides sauf pour les joggeurs tres riches et les patrouilles tres pauvres. <b>Yugs</b>, coursier de nuit, attend sous le pont avec une sacoche trempee.</p>
        <p>Il a vu la fourgonnette blanche. Il connait aussi Thanos, et il prefere ne plus jamais le croiser.${ST.tags.has('Mymy_Avertit') ? ' Mymy lui a deja envoye un avertissement, ce qui veut dire que Kabe sait que son nom brule.' : ''}</p>`,
      choices: [
        { label: 'Faire parler Yugs', hint: 'SOC/Reseau (9)', effect: '+Relation Yugs | +Temoin', test: { stat: 'SOC', skill: 'Reseau', dd: 9, ok: s => { s.tags.add('Yugs_Temoin'); setRelation('yugs', 1); addObj('Yugs decrit le transfert de Nora vers la Regie.'); }, ko: s => { addPressure(1); log('Yugs disparait dans le brouillard. Pression +1.'); } }, goOK: 'berges_temoin', goKO: 'berges_patrouille' },
        { label: 'Ouvrir la fourgonnette', hint: 'RUE/Discretion (11)', effect: '+Preuve | echec: +Stress', test: { stat: 'RUE', skill: 'Discretion', dd: 11, ok: s => { evidence(s, 'Preuve_Fourgonnette'); s.tags.add('Regie_Localisee'); addObj('Preuve obtenue: bordereau de transfert de Nora.'); }, ko: s => { s.stress = Math.min(5, s.stress + 1); addPressure(1); log('Un gyrophare discret s allume. Stress +1, Pression +1.'); } }, goOK: 'berges_temoin', goKO: 'berges_patrouille' },
        { label: 'Retourner chez Kabe', hint: 'Faire confirmer l indice', effect: '+Chacha', go: 'kabe_salle' }
      ]
    },

    berges_temoin: {
      img: IMG.berges,
      title: 'Berges - Temoin sous le pont',
      text: () => `
        <p>Yugs parle enfin: Nora n etait pas inconsciente, elle refusait de monter. Anto est arrive, pas pour la prendre. Pour empecher Thanos de faire pire.</p>
        <p>Yugs veut une chose simple: ne pas finir dans le même fichier que les autres. Il ajoute que Nora l’a poussé à témoigner avant d’être sûre de pouvoir le protéger. « Elle avait raison sur le fond. Sur le reste, elle nous a foutus dans la lumière. »</p>`,
      choices: [
        { label: 'Le conduire chez Kabe', hint: 'SOC/Reseau (9)', effect: '+Temoin protege | +Dette Kabe', test: { stat: 'SOC', skill: 'Reseau', dd: 9, ok: s => { s.tags.add('TemoinProtege'); s.tags.add('Kabe_Dette'); setRelation('kabe', 1); setRelation('mymy', 1); addObj('Yugs est protege chez Kabe. Dette Kabe ouverte.'); }, ko: s => { s.stress = Math.min(5, s.stress + 1); log('Yugs disparait avant le pont. Stress +1.'); } }, goOK: 'kabe_salle', goKO: 'place_pistes' },
        { id: 'berges:deposition-yugs', once: true, label: 'Noter sa deposition sur dictaphone', hint: 'Preuve si tu as le dictaphone', effect: '+Preuve audio', when: () => hasItem('Dictaphone fendu') && !ST.usedItems.includes('Dictaphone fendu'), immediate: s => { markItemUsed('Dictaphone fendu'); evidence(s, 'Preuve_Deposition'); addObj('Preuve obtenue: deposition audio de Yugs.'); }, go: 'regie_entree' },
        { label: 'Aller directement a la Regie', hint: 'Il est tard', effect: '+Regie', go: 'regie_entree' }
      ]
    },

    berges_patrouille: {
      img: IMG.berges,
      title: 'Berges - Controle municipal',
      text: () => `
        <p>Deux agents te bloquent sous le pont. Leur oreillette crache le nom de Thanos. Ils veulent ton nom, puis ton telephone.</p>`,
      choices: [
        { label: 'Donner une vieille carte de presse', hint: 'DOC/Persuasion (10)', effect: '+Acces | objet utilise', when: () => hasItem('Carte de presse perimee'), test: { stat: 'DOC', skill: 'Persuasion', dd: 10, ok: s => { markItemUsed('Carte de presse perimee'); s.tags.add('Regie_Localisee'); log('Ils ne veulent pas d article. Ils te laissent passer.'); }, ko: s => { s.stress = Math.min(5, s.stress + 1); log('Ils photographient ta carte. Stress +1.'); } }, goOK: 'regie_entree', goKO: 'place_pistes' },
        { label: 'Passer par les escaliers de service', hint: 'TEC/Maintenance (10)', effect: '+Acces Regie', test: { stat: 'TEC', skill: 'Maintenance', dd: 10, ok: s => { s.tags.add('Acces_Regie_Service'); s.tags.add('Regie_Localisee'); addObj('Acces service repere.'); }, ko: s => { s.hp = Math.max(0, s.hp - 1); log('Tu glisses sur la marche. Etat -1.'); } }, goOK: 'regie_entree', goKO: 'place_pistes' }
      ]
    },

    regie_entree: {
      img: IMG.regie,
      title: 'Antenne de la Regie - Entree de nuit',
      text: () => `
        <p>L antenne occupe un ancien bureau de bailleur social. A l accueil, <b>Laura</b> evite les cameras. Dans le couloir, <b>Antoine</b> signe des deplacements qu il appelle arbitrages.</p>
        <p>Tu peux entrer par badge, par les gaines, ou avec assez de preuves pour faire hésiter Laura. Sur le mur, une affiche promet une <i>évacuation apaisée des situations non coopératives</i>.</p>
        ${profileTrace('regie_entree')}`,
      choices: () => {
        const arr = [];
        if (ST.tags.has('Badge_Regie') || hasItem('Badge Regie grille')) arr.push({ label: 'Badger comme un prestataire', hint: 'Acces direct', effect: '+Acces archives', immediate: () => markItemUsed('Badge Regie grille'), go: 'regie_archives' });
        if (ST.tags.has('Acces_Gaines') || ST.tags.has('Acces_Regie_Service')) arr.push({ label: 'Passer par l acces service', hint: 'TEC/Maintenance (9)', effect: '+Archives | echec: +Stress', test: { stat: 'TEC', skill: 'Maintenance', dd: 9, ok: () => log('La gaine donne sur les archives.'), ko: s => { s.stress = Math.min(5, s.stress + 1); addPressure(1); log('Tu restes coince trop longtemps. Stress +1, Pression +1.'); } }, goOK: 'regie_archives', goKO: 'regie_accueil' });
        arr.push({ label: 'Mettre les preuves sur le comptoir de Laura', hint: 'DOC/Archives (12), DD 9 avec 3 Preuves', effect: '+Laura hesite | +Archives', test: { stat: 'DOC', skill: 'Archives', dd: ST.frag >= 3 ? 9 : 12, ok: s => { s.tags.add('Regie_Hesite'); s.tags.add('Laura_Hesite'); setRelation('laura', 1); log('Laura comprend que tu n es pas seul.'); }, ko: s => { s.stress = Math.min(5, s.stress + 1); addPressure(1); log('On te demande de sortir. Stress +1, Pression +1.'); } }, goOK: 'regie_archives', goKO: 'regie_accueil' });
        return arr;
      }
    },

    regie_accueil: {
      img: IMG.regie,
      title: 'Regie - Accueil froid',
      text: () => `
        <p>Laura ne leve pas les yeux. Elle connait ton nom avant que tu parles. Sur son ecran: retour suspect, dette inconnue, lien avec Nora.</p>
        <p>Antoine passe derriere elle et fait semblant de ne pas t avoir vu. Il corrige seulement un mot dans un dossier: <i>expulsion</i> devient <i>depart confirme</i>.</p>`,
      choices: [
        { label: 'Tenir la ligne et citer Antoine', hint: 'SOC/Persuasion (11)', effect: '+Acces | echec: fin fragile', test: { stat: 'SOC', skill: 'Persuasion', dd: 11, ok: s => { s.tags.add('Regie_Hesite'); s.tags.add('Antoine_Alerte'); setRelation('laura', 1); log('Le nom d Antoine ouvre une porte invisible.'); }, ko: s => { s.stress = Math.min(5, s.stress + 1); addPressure(1); log('La securite est appelee. Stress +1, Pression +1.'); } }, goOK: 'regie_archives', goKO: 'final_choix' },
        { label: 'Fuir avec ce que tu as', hint: 'Aller aux fins avec un dossier fragile', effect: '+Final', go: 'final_choix' }
      ]
    },

    regie_archives: {
      img: IMG.regie,
      title: 'Regie - Archives des vivants',
      text: () => `
        <p>Les archives ne sont pas des cartons: ce sont des profils prets a etre deplaces. Chaque personne devient un risque, chaque risque une ligne de cout.</p>
        <p>Laura te montre le dossier de Nora: <b>retenue pour entretien</b>. Sous-sol B. Salle Antoine. Elle murmure qu elle a valide une ligne sans savoir que la ligne etait une personne.</p>`,
      choices: [
        { label: 'Copier l export complet', hint: 'TEC/Maintenance (11)', effect: '+2 Preuves | Antoine alerte', test: { stat: 'TEC', skill: 'Maintenance', dd: 11, ok: s => { evidence(s, 'Preuve_Export', 2); s.tags.add('Antoine_Alerte'); addObj('Export complet copie. Preuves +2.'); }, ko: s => { s.stress = Math.min(5, s.stress + 1); log('La copie s interrompt a 63 %. Stress +1.'); } }, goOK: 'regie_vautrin', goKO: 'regie_vautrin' },
        { label: 'Chercher d abord Nora', hint: 'Sauvetage avant publication', effect: '+Nora', go: 'regie_vautrin' },
        { id: 'regie:preparer-publication', once: true, label: 'Appeler Kabe depuis les archives', hint: 'Si Kabe ou Mymy te couvre', effect: '+Publication preparee', when: () => (ST.tags.has('TemoinProtege') || ST.tags.has('Kabe_Couvre_Regie') || ST.tags.has('Mymy_Confiance')) && !ST.tags.has('Publication_Preparee'), immediate: s => { s.tags.add('Publication_Preparee'); addObj('Kabe prepare la sortie publique.'); }, go: 'regie_vautrin' }
      ]
    },

    regie_vautrin: {
      img: IMG.regie,
      title: 'Sous-sol B - Nora',
      text: () => `
        <p>Nora est vivante. Fatiguee, lucide, furieuse de te voir seul. Antoine attend pres d une table sans ordinateur, seulement un dossier papier et deux stylos.</p>
        <p>« Vous pouvez sauver une personne », dit-il. « Ou publier assez mal pour en perdre cent. » Nora serre les dents: « Arrêtez votre merde de gestionnaire. Vous appelez prudence la méthode qui vous permet de recommencer demain avec des fichiers plus propres. »</p>
        <p>Elle se tourne vers toi. « Et toi, ne viens pas me sauver pour te débarrasser du reste. Si tu prends son marché, regarde au moins les gens que tu lui laisses. »</p>`,
      choices: [
        { label: 'Sortir Nora par les gaines', hint: 'RUE/Discretion (11)', effect: '+Nora vivante', test: { stat: 'RUE', skill: 'Discretion', dd: 11, ok: s => { s.tags.add('NoraAlive'); addObj('Nora sort de la Regie avec toi.'); }, ko: s => { s.hp = Math.max(0, s.hp - 1); log('La fuite tourne court. Etat -1.'); } }, goOK: 'final_choix', goKO: 'final_choix' },
        { label: 'Faire parler Antoine en enregistrant', hint: 'DOC/Persuasion (12)', effect: '+Preuve aveu', test: { stat: 'DOC', skill: 'Persuasion', dd: 12, ok: s => { evidence(s, 'Preuve_Aveu'); addObj('Aveu d Antoine enregistre.'); }, ko: s => { s.stress = Math.min(5, s.stress + 1); log('Antoine sourit: il sait que tu enregistres. Stress +1.'); } }, goOK: 'final_choix', goKO: 'final_choix' },
        { label: 'Accepter d ecouter son marche', hint: 'Ouvrir la fin transaction', effect: '+Fin marche | Nora conteste', immediate: s => { s.tags.add('Vautrin_Marche'); s.tags.add('Antoine_Alerte'); addObj('Antoine propose Nora contre le silence.'); }, go: 'final_choix' }
      ]
    },

    final_choix: {
      img: IMG.leyla,
      title: 'Avant 6 h - Que faire du dossier',
      text: () => `
        <p>Le jour commence sans lumiere. Sur la Place, les premieres portes claquent. Tu as ${ST.frag} preuve${ST.frag > 1 ? 's' : ''}, ${ST.flux} levier${ST.flux > 1 ? 's' : ''}, et une pression a ${ST.pressure}/6.</p>
        <p>Le dossier peut sortir, Nora peut sortir, ou la Regie peut acheter encore une nuit de silence.</p>
        ${noraFinalLine()}
        ${kabeDebtLine()}`,
      choices: () => [
        { label: 'Publier le dossier maintenant', hint: ST.pressure >= 5 && !ST.tags.has('Publication_Preparee') && !ST.tags.has('Mymy_Confiance') ? 'La pression peut briser la sortie' : (ST.frag >= 3 ? 'Dossier solide' : 'Dossier fragile'), effect: '+Fin publique', go: () => (ST.pressure >= 5 && !ST.tags.has('Publication_Preparee') && !ST.tags.has('Mymy_Confiance')) ? pickEnding('lost') : (ST.frag >= 2 || ST.tags.has('Publication_Preparee') ? pickEnding('public') : pickEnding('lost')) },
        { label: 'Sauver Nora et garder une copie', hint: 'Priorite humaine', effect: '+Fin Nora', when: () => ST.tags.has('NoraAlive') || ST.tags.has('TemoinProtege'), go: () => pickEnding('save') },
        { label: 'Accepter le marche d Antoine', hint: 'Silence contre protection immediate', effect: '+Fin marche', when: () => ST.tags.has('Vautrin_Marche'), go: () => pickEnding('market') },
        { label: 'Partir avec un dossier incomplet', hint: 'Personne ne gagne vraiment', effect: '+Fin perdue', go: () => pickEnding('lost') }
      ]
    },

    ep_public: { img: IMG.place, title: 'Epilogue - Publication', text: () => `<p>Le dossier sort a 06 h 03. La Regie nie, puis suspend l evacuation. Tu ne sais pas ou est Nora, mais son travail survit dans les copies que le quartier imprime deja.</p><p>${profileEndingLine()}</p>`, choices: [{ label: 'Recommencer', go: 'retour_place' }] },
    ep_public_leyla: { img: IMG.kabe, title: 'Epilogue - Dossier vivant', text: () => `<p>Nora apparait dans l arriere-salle de Kabe pendant que Laura fuit par une porte de service. Les habitants ne sont pas sauves, pas encore. Mais ils ont des noms, des preuves, et une salle pleine de temoins.</p><p>${ST.tags.has('Mymy_Confiance') ? 'Mymy fait circuler les copies avant meme que la Regie comprenne qui a parle; elle te rappelle seulement que Kabe saura te retrouver.' : profileEndingLine()}</p>`, choices: [{ label: 'Recommencer', go: 'retour_place' }] },
    ep_save: { img: IMG.berges, title: 'Epilogue - Nora d abord', text: () => `<p>Tu fais sortir Nora avant l aube. La Place perd une bataille, peut-etre plus. Nora garde assez de memoire pour recommencer, et toi assez de honte pour rester.</p><p>${profileEndingLine()}</p>`, choices: [{ label: 'Recommencer', go: 'retour_place' }] },
    ep_save_with_copy: { img: IMG.leyla, title: 'Epilogue - Copie cachee', text: () => `<p>Nora sort, et une copie du dossier reste chez Kabe. Pas une victoire propre: une braise sous la cendre. Anto promet de tenir la porte tant que la ville fera semblant de dormir.</p><p>${ST.tags.has('Kabe_Dette') ? 'Mymy inscrit la copie dans son carnet sans couverture. La dette reste ouverte, mais le quartier respire encore.' : profileEndingLine()}</p>`, choices: [{ label: 'Recommencer', go: 'retour_place' }] },
    ep_market: { img: IMG.regie, title: 'Epilogue - Marche', text: () => `<p>Antoine tient parole sur Nora et ment sur le reste. L evacuation est repoussee, pas annulee; la Regie apprend surtout a mieux cacher la prochaine.</p><p>Nora ne te remercie pas tout de suite. ${profileEndingLine()}</p>`, choices: [{ label: 'Recommencer', go: 'retour_place' }] },
    ep_lost: { img: IMG.place, title: 'Epilogue - Couvre-feu', text: () => `<p>A 06 h, la Place se vide par cages d escalier. Ton dossier ne suffit pas. Dans la foule, quelqu un murmure le nom de Nora, et c est tout ce que la Regie n a pas encore su effacer.</p><p>${profileEndingLine()}</p>`, choices: [{ label: 'Recommencer', go: 'retour_place' }] }
  };
}
