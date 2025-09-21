import { IMG } from './images.js';
import { ST, clearEndingTags, markEndingApproach, pickEnding } from './state.js';

export function createScenes({ addObj, gainItem, hasItem, log, openKabeGame }) {
  return {
 prologue:{
  img:IMG.pro,title:'Prologue — La Sourdine',text:()=>`
  <p>La pluie plaque les enseignes de la Place du Pont et étire les halos des néons. Sous <b>la Sourdine</b>, les voix deviennent feutrées, les souvenirs glissent et ton HUD vacille par à-coups.</p>
  <p>La sous-station <b>T1</b> décroche du réseau : si elle lâche, la Guill’ s’assombrit et les voies d’évacuation se referment.</p>
  <p>Il te faut un itinéraire sûr. <i>Noor</i> connaît les caves, <i>Milo</i> négocie avec les guetteurs, ou tu peux lire seul·e le courant qui serpente sous la pluie.</p>`,
  choices:[
    {label:'Retrouver Noor, la dormeuse du pont',hint:'Guide discret vers les Berges (furtivité)',go:'place_noor'},
    {label:'Marcher vers Milo, le revendeur',hint:'Passe-droit potentiel au Pont',go:'place_milo'},
    {label:'Observer la foule par toi-même',hint:'Tracer une route sans allié',go:'place_solo'}
  ]
 },
 place_noor:{
 img:IMG.place,title:'Place du Pont — Noor',text:()=>`
  <p>Noor s’abrite sous une bâche plastique, capuche rabattue, regard calme mais précis. Elle connaît les caves qui mènent aux <b>Berges</b> et repère déjà les issues derrière toi.</p>
  <p>Elle ouvrira la voie si tu récupères <b>son sac</b> oublié à <b>Mazagran</b>, celui qui contient un feuillet d’itinéraires griffonné à la main.</p>`,
  choices:[
    {label:'Accepter et récupérer son sac',hint:'Nouvel objectif : ramener le sac de Noor',immediate:s=>{s.tags.add('Noor');s.objective='Ramener le sac de Noor pour ouvrir la voie des caves.';addObj('Nouvel objectif : rapporter le sac de Noor.');},go:'maz_noor'},
    {label:'Refuser mais prendre son indice',hint:'Indice de trappe sans accompagnement',immediate:s=>{s.tags.add('Indice_Trappe');s.objective='Trouver la trappe technique indiquée par Noor.';addObj('Indice obtenu : emplacement de la trappe.');},go:'maz_common'},
    {label:'Rester sur la Place et observer',hint:'Ouvrir d’autres approches sous l’auvent',go:'place_return'}
  ]
 },
 place_milo:{
 img:IMG.place,title:'Place du Pont — Milo',text:()=>`
  <p>Milo recompte des câbles sous un parapluie troué. Son réseau alimente les guetteurs du <b>Pont</b>. Il peut obtenir un laissez-passer si tu récupères un <b>coffret</b> caché à <b>Mazagran</b>.</p>
  <p>Le deal est clair : tu rapportes le coffret, il parle aux guetteurs et partage un code de reconnaissance gravé sur le plomb.</p>`,
  choices:[
    {label:'Accepter le deal du coffret',hint:'Passe-droit à gagner si tu réussis',immediate:s=>{s.tags.add('Milo');s.objective='Ramener le coffret scellé à Milo pour obtenir le passe.';addObj('Nouvel objectif : récupérer le coffret de Milo.');},go:'maz_milo'},
    {label:'Refuser et rester indépendant·e',hint:'Route neutre vers Mazagran',immediate:s=>{s.objective='Chercher un passage neutre par Mazagran.';},go:'maz_common'},
    {label:'Explorer la Place par soi-même',hint:'Observer les assemblées abritées',go:'place_return'}
  ]
 },
 place_solo:{
 img:IMG.place,title:'Place du Pont — Lire la foule',text:()=>`
  <p>Tu te laisses porter par la foule. La pluie trace des courants sur le bitume et les rumeurs roulent d’un abri à l’autre. Tout converge vers <b>Mazagran</b> avant de glisser vers les <b>Berges</b>.</p>
  <p>Reste à décider si tu suis le courant, si tu glanes des indices sous l’auvent ou si tu forces un passage direct.</p>`,
  choices:[
    {label:'Suivre le flux jusqu’à Mazagran',hint:'Collecter des indices avant les Berges',go:'maz_common'},
    {label:'Forcer un passage vers les Berges',hint:'Contourner la friche sans aide',go:'ber_entry'},
    {label:'Se glisser sous l’auvent du Collectif',hint:'Voie sociale potentielle',go:'place_collectif'}
  ]
 },

 place_return:{
  img:IMG.place,title:'Place du Pont — Carrefour sous la Sourdine',text:()=>{
   const notes=[];
   if(ST.tags.has('Noor_Sac')&&!ST.tags.has('Noor_Trust')){notes.push('Noor surveille ton sac, prête à filer vers les caves.');}
   else if(ST.tags.has('Noor_Trust')){notes.push('Noor garde la trappe entrouverte, signe discret de confiance.');}
   if(ST.tags.has('Coffret_Milo')&&!ST.tags.has('Milo_Pass')){notes.push('Milo attend le coffret, parapluie battant.');}
   else if(ST.tags.has('Milo_Pass')){notes.push('Le laissez-passer de Milo luit brièvement sous la pluie.');}
   if(ST.tags.has('Collectif_Favor')&&!ST.tags.has('Collectif_Pret')){notes.push('Le Collectif suit chacun de tes gestes, prêt à te couvrir jusqu’au Pont.');}
   else if(ST.tags.has('Collectif_Pret')){notes.push('L’escorte du Collectif attend un signe pour t’accompagner au Pont.');}
   if(ST.inv.includes('Badge maintenance')){notes.push('Un badge de maintenance pulse dans ta poche, promesse d’un accès technique.');}
   const extra=notes.join(' ')||'Les regards glissent vers Mazagran, vers le Pont, vers ceux qui bricolent leur survie.';
   return `<p>La Place du Pont clignote sous la Sourdine, les bâches claquent au rythme des pas.</p><p>${extra}</p>`;
  },
  choices:()=>{
   const arr=[];
   if(ST.tags.has('Noor')&&ST.tags.has('Noor_Sac')&&!ST.tags.has('Noor_Trust')){
    arr.push({label:'Remettre le sac à Noor',hint:'Voie sociale vers les caves',immediate:s=>{s.tags.delete('Noor_Sac');s.tags.add('Noor_Trust');s.objective='Suivre Noor par les caves vers les Berges.';addObj('Noor récupère son sac et t’offre la trappe des caves.');},go:'place_return'});
   }
   if(ST.tags.has('Milo')&&ST.tags.has('Coffret_Milo')&&!ST.tags.has('Milo_Pass')){
    arr.push({label:'Livrer le coffret à Milo',hint:'Passe-droit vers le Pont',immediate:s=>{s.tags.delete('Coffret_Milo');s.tags.add('Milo_Pass');s.inv=s.inv.filter(it=>it!=='Coffret (Milo)'&&it!=='Coffret scellé');s.objective='Utiliser le laissez-passer de Milo pour franchir le Pont.';addObj('Milo tamponne ton laissez-passer et te fait un clin d’œil.');},go:'place_return'});
   }
   if(ST.tags.has('Collectif_Favor')&&!ST.tags.has('Collectif_Pret')){
    arr.push({label:'Prévenir le Collectif de ton départ',hint:'Prépare une escorte sociale',immediate:s=>{s.tags.add('Collectif_Pret');s.objective='Rejoindre le Pont avec l’appui du Collectif.';addObj('Le Collectif prépare une escorte pour le Pont.');},go:'place_return'});
   }
   if(hasItem('Feuillet-mica')&&!ST.tags.has('Feuillet_Map')){
    arr.push({label:'Déplier le feuillet-mica',hint:'Cartographier un conduit oublié vers T1',immediate:s=>{s.tags.add('Feuillet_Map');s.objective='Suivre les repères du feuillet vers une gaine discrète.';addObj('Les tracés UV du feuillet révèlent un détour sûr.');},go:'place_return'});
   }
    arr.push({label:'Rejoindre l’assemblée sous l’auvent',hint:'Chercher des appuis sociaux',go:'place_collectif'});
   arr.push({label:'Retourner vers Mazagran',hint:'Explorer la friche encore humide',go:'maz_common'});
   arr.push({label:'Descendre vers les Berges',hint:'Retrouver la trappe technique',go:'ber_entry'});
   arr.push({label:'S’approcher du Pont',hint:'Tester les contrôles en place',go:'pon_pass'});
   return arr;
  }
 },
 place_collectif:{
  img:IMG.place,title:'Place du Pont — Assemblée couverte',text:()=>`
  <p>Sous l’auvent, des tables pliantes croulent sous les radios démontées. Les membres du Collectif griffonnent des plans pour contourner la Sourdine.</p>
  <p>Ils peuvent fournir escortes, rumeurs ou accès techniques si tu prouves ta valeur.</p>`,
  choices:[
    {label:'Partager la note marquée de Milo',hint:'Utiliser la recommandation pour convaincre',when:()=>hasItem('Note marquée')&&!ST.tags.has('Collectif_Favor'),immediate:s=>{s.tags.add('Collectif_Favor');s.objective='Le Collectif peut préparer une escorte vers le Pont.';addObj('La note marquée circule sous l’auvent : confiance gagnée.');},go:'place_return'},
    {label:'Partager ton itinéraire',hint:'VOL/Empathie (10) — obtenir une escorte',when:()=>!ST.tags.has('Collectif_Favor'),test:{stat:'VOL',skill:'Empathie',dd:10,
      ok:s=>{s.tags.add('Collectif_Favor');s.objective='Le Collectif peut préparer une escorte vers le Pont.';addObj('Le Collectif accepte de couvrir ton passage.');},
      ko:s=>{s.stress=Math.min(5,s.stress+1);log('La discussion s’échauffe. +1 Stress.');}
    },goOK:'place_return',goKO:'place_collectif'},
    {label:'Écouter sans être vu',hint:'CIN/Furtivité (11) — récupérer le planning des guetteurs',when:()=>!ST.tags.has('Collectif_Dossier'),test:{stat:'CIN',skill:'Furtivité',dd:11,
      ok:s=>{s.tags.add('Collectif_Dossier');s.objective='Exploiter le planning des guetteurs pour traverser le Pont.';addObj('Planning des guetteurs mémorisé.');},
      ko:s=>{s.stress=Math.min(5,s.stress+1);log('Un regard te fixe. +1 Stress.');}
    },goOK:'place_return',goKO:'place_collectif'},
    {label:'Rétablir leur relais radio',hint:'NEU/Mécanique (11) — badge de maintenance',when:()=>!ST.tags.has('BadgeTech'),test:{stat:'NEU',skill:'Mécanique',dd:11,
      ok:s=>{gainItem('Badge maintenance');s.tags.add('BadgeTech');s.objective='Utiliser le badge pour contourner la surveillance du Pont.';addObj('Badge de maintenance prêt pour les contrôles.');},
      ko:s=>{s.hp=Math.max(0,s.hp-1);log('Une étincelle te mord. +1 Blessure.');}
    },goOK:'place_return',goKO:'place_collectif'},
    {label:'Revenir vers la Place principale',hint:'Faire le point avec tes contacts',go:'place_return'}
  ]
 },
 maz_common:{
 img:IMG.maz,title:'Friche Mazagran — Cour',text:()=>`
  <p>Le conteneur-atelier bourdonne. Une échelle plonge vers la cave. Sur l’établi : un <b>feuillet-mémoire</b> annoté. En bas, un <b>coffret scellé</b> attend dans l’ombre.</p>`,
  choices:()=>{
   const goKabe=ST.tags.has('Kabe_AntoOK')?'maz_apero':'maz_apero_anto';
   return [
    {label:'Lire le feuillet annoté',hint:'NEU/Mnémographie (10) — repérer la trappe',test:{stat:'NEU',skill:'Mnémographie',dd:10,
      ok:s=>{s.tags.add('Motif_R');s.objective='Atteindre la trappe technique depuis les Berges.';addObj('Indice : localisation de la trappe technique vers T1.');},ko:s=>{s.stress=Math.min(5,s.stress+1);log('Le motif te vrille. +1 Stress.');}}},
    {label:'Saisir le coffret scellé',hint:'Ajouter l’objet à ton inventaire',immediate:s=>{s.tags.add('Coffret_Milo');gainItem('Coffret (Milo)');s.objective='Apporter le coffret à Milo pour obtenir le laissez-passer.';addObj('Coffret (Milo) rangé dans ton sac.');}},
    {label:'Franchir la porte du Kabé',hint:'Respirer un instant loin de la Sourdine',when:()=>ST.stress>0&&!ST.tags.has('Kabe_Apero'),go:goKabe},
    {label:'Descendre vers les Berges',hint:'Prendre la cave jusqu’aux darses',go:'ber_entry'},
    {label:'Se faufiler vers l’atelier latéral',hint:'Rencontrer les ouvriers de la friche',go:'maz_atelier'},
    {label:'Retourner vers la Place du Pont',hint:'Faire le point avec Noor, Milo ou le Collectif',go:'place_return'}
   ];
  }
 },
 maz_apero_anto:{
  img:IMG.maz,title:'Mazagran — Seuil du Kabé',text:()=>`
  <p>Anto aka le Carné, colosse chauve au doigt cassé strié de résine, verrouille la porte blindée du Kabé. Sa carrure tamise la lanière de lumière ambrée qui fuit du refuge.</p>
  <p>On dit qu’il a mémorisé chaque visage toléré par Kabé : son doigt réparé glisse sur la poignée comme sur un registre invisible tandis qu’il écoute la Sourdine frapper la cour.</p>
  <p>Il attend un signe de reconnaissance — badge, parole ou regard complice — avant de relâcher le verrou que le Kabé lui confie.</p>`,
  choices:()=>[
    {label:'Convaincre Anto « le Carné » de te laisser passer',hint:'VOL/Empathie (10) — apaiser sa vigilance',test:{stat:'VOL',skill:'Empathie',dd:10,
      ok:s=>{if(!s.tags.has('Kabe_AntoOK')){addObj('Anto « le Carné » hoche la tête : accès assuré au Kabé.');}s.tags.add('Kabe_AntoOK');},ko:s=>{s.stress=Math.min(5,s.stress+1);log('Anto « le Carné » reste inflexible. +1 Stress.');}},goOK:'maz_apero',goKO:'maz_apero_anto'},
    {label:'Montrer patte blanche',hint:'Présenter un badge, un passe ou un appui reconnu',when:()=>ST.tags.has('Milo_Pass')||ST.tags.has('Collectif_Favor')||ST.tags.has('Noor_Trust')||ST.tags.has('Collectif_Pret')||ST.tags.has('BadgeTech')||ST.tags.has('BadgeTech_Used')||hasItem('Badge maintenance'),immediate:s=>{if(!s.tags.has('Kabe_AntoOK')){addObj('Ton signe de confiance ouvre la porte du Kabé.');}s.tags.add('Kabe_AntoOK');log('Anto « le Carné » reconnaît ton signe et entrouvre le passage.');},go:'maz_apero'},
    {label:'Reculer vers la cour',hint:'Laisser la porte scellée et observer encore',go:'maz_common'}
  ]
 },
 maz_apero:{
  img:IMG.maz,title:'Mazagran — Kabé clandestin',text:()=>{
   const first=!ST.tags.has('Kabe_Apero');
   if(first){
    ST.tags.add('Kabe_Apero');
    ST.stress=Math.max(0,ST.stress-1);
    addObj('Kabé clandestin : tu respires avec la ronde. Stress -1.');
    log('Le Kabé te délasse. -1 Stress.');
   }
  const souffle=first
   ? 'Un verre tiède passe de main en main, la rumeur couvre la Sourdine. Ton souffle ralentit.'
   : 'Les habitué·es te reconnaissent et gardent une place au chaud.';
  const defi=ST.tags.has('Kabe_RitualWon')
   ? 'Kabé t’invite à rejouer le rituel pour garder la salle accordée : la séquence est devenue votre signe discret.'
   : 'Kabé, maître des apéros clandestins, te propose un rituel d’infusion : enchaîner les gestes parfaits pour chasser la pression.';
   return `
  <p>Kabé orchestre le refuge : il dirige les apéros clandestins, rythme les souffles et surveille la Sourdine qui cogne.</p>
  <p>${souffle}</p>
  <p>${defi}</p>`;
  },
  choices:()=>[
    {label:'Composer le rituel du Kabé',hint:ST.tags.has('Kabe_RitualWon')?'Mini-jeu : rejouer pour le panache':'Mini-jeu : aligner la bonne séquence (stress -1 à la première victoire)',immediate:()=>openKabeGame()},
    {label:'Chuchoter un merci et ressortir',hint:'Retourner à la cour de Mazagran',go:'maz_common'},
    {label:'Suivre l’escalier vers les Berges',hint:'Retrouver la cave en douceur',go:'ber_entry'},
    {label:'Remonter vers la Place du Pont',hint:'Partager la chaleur du Kabé avec tes contacts',go:'place_return'}
  ]
 },
 maz_noor:{
 img:IMG.maz,title:'Mazagran — Le sac de Noor',text:()=>`
  <p>Le sac de Noor est coincé derrière un banc soudé. Les sangles collées à la rouille cèdent par à-coups tandis que l’eau goutte des bâches avec un rythme patient.</p>
  <p>Tu peux forcer le métal, t’aider de ton matériel ou descendre par la cave pour ressortir discrètement.</p>`,
  choices:[
    {label:'Forcer le banc',hint:'SOM/Mécanique (12) — libérer le sac (échec : +1 Blessure)',test:{stat:'SOM',skill:'Mécanique',dd:12,
      ok:s=>{s.tags.add('Noor_Sac');s.objective='Ramener le sac à Noor sur la Place du Pont.';addObj('Sac de Noor récupéré.');},ko:s=>{s.hp=Math.max(0,s.hp-1);log('Tu t’écorches sur le métal. +1 Blessure.')}}},
    {label:'Passer par la cave',hint:'CIN/Furtivité (10) — ressortir sans alerter',test:{stat:'CIN',skill:'Furtivité',dd:10,
      ok:s=>{s.tags.add('Sortie_Discrète');log('Personne ne t’a vu.');},ko:s=>{log('Lampe qui claque. Pas de dégâts.')}}},
    {label:'Découper les sangles au cutter',hint:'Utiliser ton outil pour libérer le sac sans bruit',when:()=>hasItem('Cutter')&&!ST.tags.has('Noor_Sac'),immediate:s=>{s.tags.add('Noor_Sac');s.objective='Ramener le sac à Noor sur la Place du Pont.';addObj('Le cutter entaille les sangles : sac de Noor libéré.');log('Le cutter grignote la rouille.');},go:'place_return'},
    {label:'Faire levier avec le tournevis isolé',hint:'Exploiter ton tournevis pour dégager le banc',when:()=>hasItem('Tournevis isolé')&&!ST.tags.has('Noor_Sac'),immediate:s=>{s.tags.add('Noor_Sac');s.tags.add('Sortie_Discrète');s.objective='Ramener le sac à Noor sur la Place du Pont.';addObj('Le tournevis isolé fait céder le banc sans déclencher d’alarme.');},go:'place_return'},
    {label:'Filer aux Berges',hint:'Rejoindre les darses sans perdre de temps',go:'ber_entry'},
    {label:'Investir l’atelier voisin',hint:'Tenter un détour social ou technique',go:'maz_atelier'},
    {label:'Retourner à la Place du Pont',hint:'Remettre le sac ou chercher du soutien',go:'place_return'}
  ]
 },
 maz_milo:{
 img:IMG.maz,title:'Mazagran — Le coffret de Milo',text:()=>`
  <p>Le coffret frappé du sceau de Milo est sanglé à un crochet. Des motifs gravés luisent sous la pluie ; le plomb est déjà ébréché et un code y est poinçonné.</p>`,
  choices:[
    {label:'Détacher le coffret pour Milo',hint:'Prépare le passe au Pont',immediate:s=>{s.tags.add('Coffret_Milo');gainItem('Coffret (Milo)');s.objective='Apporter le coffret à Milo pour obtenir le laissez-passer.';addObj('Coffret de Milo sécurisé.');}},
    {label:'Inspecter le coffret à la lampe plate',hint:'Révéler le code gravé (sans l’ouvrir)',when:()=>hasItem('Lampe plate')&&!ST.tags.has('Milo_Code'),immediate:s=>{s.tags.add('Milo_Code');s.objective='Utiliser le code de Milo pour traverser le Pont sans montrer le coffret.';addObj('Le faisceau révèle le code du coffret de Milo.');log('La lampe rase les motifs et révèle des chiffres cachés.');},go:'maz_milo'},
    {label:'Prendre la cave vers les Berges',hint:'Continuer vers la trappe technique',go:'ber_entry'},
    {label:'Se glisser vers l’atelier latéral',hint:'Approcher les ouvriers en douce',go:'maz_atelier'},
    {label:'Retourner vers la Place du Pont',hint:'Négocier le laissez-passer avec Milo',go:'place_return'}
  ]
 },

 maz_atelier:{
  img:IMG.maz,title:'Mazagran — Atelier latéral',text:()=>`
  <p>À l’intérieur, des ouvriers alignent des batteries sur des palettes et recalent une <b>nacelle</b> suspendue au-dessus de la vase.</p>
  <p>Ils cherchent des bras, des infos ou un coup de main technique.</p>`,
  choices:[
    {label:'Négocier avec la contremaîtresse',hint:'VOL/Empathie (10) — obtenir leur confiance',when:()=>!ST.tags.has('Atelier_Allie'),test:{stat:'VOL',skill:'Empathie',dd:10,
      ok:s=>{s.tags.add('Atelier_Allie');s.objective='Les ouvriers peuvent couvrir ton passage jusqu’aux Berges.';addObj('Les ouvriers de Mazagran te reconnaissent comme allié.');},
      ko:s=>{s.stress=Math.min(5,s.stress+1);log('On te jauge froidement. +1 Stress.');}
    },goOK:'maz_atelier',goKO:'maz_atelier'},
    {label:'Forcer le casier technique',hint:'CIN/Furtivité (10) — récupérer un badge',when:()=>!ST.tags.has('BadgeTech'),test:{stat:'CIN',skill:'Furtivité',dd:10,
      ok:s=>{gainItem('Badge maintenance');s.tags.add('BadgeTech');s.objective='Utiliser le badge pour traverser les contrôles du Pont.';addObj('Badge de maintenance subtilisé.');},
      ko:s=>{s.stress=Math.min(5,s.stress+1);log('Un crochet grince. +1 Stress.');}
    },goOK:'maz_atelier',goKO:'maz_atelier'},
    {label:'Calibrer leur génératrice',hint:'NEU/Mécanique (10) — stabiliser la nacelle',when:()=>!ST.tags.has('Berges_Stable'),test:{stat:'NEU',skill:'Mécanique',dd:10,
      ok:s=>{s.tags.add('Berges_Stable');s.objective='Descendre par la nacelle stabilisée vers les Berges.';addObj('La génératrice cale la nacelle : accès plus stable.');},
      ko:s=>{s.hp=Math.max(0,s.hp-1);log('Courant récalcitrant. +1 Blessure.');}
    },goOK:'maz_atelier',goKO:'maz_atelier'},
    {label:'Sangler la nacelle avec ton ruban textile',hint:'Mettre ton matériel au service de l’atelier',when:()=>hasItem('Ruban textile')&&!ST.tags.has('Berges_Stable'),immediate:s=>{s.tags.add('Berges_Stable');s.objective='Descendre par la nacelle stabilisée vers les Berges.';addObj('Ton ruban textile verrouille les attaches de la nacelle.');},go:'maz_atelier'},
    {label:'Retourner à la cour de Mazagran',hint:'Revenir vers les autres pistes',go:'maz_common'},
    {label:'Descendre vers les Berges',hint:'Suivre la voie préparée',go:'ber_entry'}
  ]
 },
 ber_entry:{
 img:IMG.ber,title:'Berges — Darses',text:()=>{
  const hints=[];
  if(ST.tags.has('Feuillet_Map')){hints.push('Les repères UV du feuillet scintillent sur un capot presque noyé.');}
  if(hasItem('Aimant-alu')){hints.push('Ton aimant-alu pulse doucement lorsque tu le rapproches du loquet.');}
  const extra=hints.length?`<p>${hints.join(' ')}</p>`:'';
  return `
  <p>La vase masque une trappe d’entretien. À chaque contact, le métal grince et vibre.</p>${extra}`;
 },
  choices:()=>{
    const arr=[
      {label:'Décrocher la trappe technique',hint:'NEU/Cryptanalyse (10) — ouvrir l’accès vers T1',test:{stat:'NEU',skill:'Cryptanalyse',dd:10,
        ok:s=>{s.tags.add('Acces_Tech');s.objective='Descendre vers T1 par la trappe technique.';addObj('Trappe vers T1 ouverte.');},ko:s=>{log('Contacts oxydés : il faudra insister.')}}},
      {label:'Remonter vers le Pont',hint:'Avec le coffret de Milo : passe-droit assuré',go:'pon_pass'}
    ];
    if(ST.tags.has('Feuillet_Map')&&!ST.tags.has('T1_Grille')){
      arr.push({label:'Suivre les repères du feuillet-mica',hint:'Utiliser la cartographie secrète de Noor',immediate:s=>{s.tags.add('Pont_Souterrain');s.tags.add('T1_Grille');s.objective='Atteindre T1 via la gaine repérée sur le feuillet.';addObj('Le feuillet révèle une gaine intacte vers T1.');log('Les repères UV scintillent : un passage s’ouvre.');},go:'pon_shadow'});
    }
    if(hasItem('Aimant-alu')&&!ST.tags.has('Acces_Tech')){
      arr.push({label:'Soulever la trappe avec ton aimant-alu',hint:'Déverrouiller en silence grâce à ton outil',immediate:s=>{s.tags.add('Acces_Tech');s.objective='Descendre vers T1 par la trappe technique.';addObj('Aimant-alu décroche les loquets de la trappe.');log('L’aimant attire les goupilles : la trappe bascule.');},go:'t1_overlook'});
    }
    if(ST.tags.has('Atelier_Allie')&&ST.tags.has('Berges_Stable')){
      arr.push({label:'Appeler la nacelle des ouvriers',hint:'Voie technique sécurisée',immediate:s=>{s.tags.add('Acces_Tech');s.tags.add('T1_Soutien');s.objective='Suivre la nacelle stabilisée jusqu’au périmètre de T1.';addObj('La nacelle de Mazagran t’abaisse vers la sous-station.');},go:'t1_overlook'});
    }
    arr.push({label:'Suivre la patrouille fluviale',hint:'Déployer un détour social ou furtif',go:'ber_patrouille'});
    if(ST.tags.has('Collectif_Dossier')){
      arr.push({label:'Rediriger les rondes grâce au planning volé',hint:'Créer une diversion sur le Pont',immediate:s=>{s.tags.delete('Collectif_Dossier');s.tags.add('Pont_Distrait');addObj('Tu détournes une patrouille loin du Pont.');},go:'ber_patrouille'});
    }
    arr.push({label:'Retourner vers la Place du Pont',hint:'Faire le point sur les alliances',go:'place_return'});
    return arr;
  }
 },

 ber_patrouille:{
  img:IMG.ber,title:'Berges — Patrouille fluviale',text:()=>`
  <p>Une barge grince contre les pieux. La patrouille fluviale tient les accès secondaires et jauge ton approche.</p>`,
  choices:[
    {label:'Négocier un couloir sûr',hint:'VOL/Empathie (10) — obtenir une escorte',test:{stat:'VOL',skill:'Empathie',dd:10,
      ok:s=>{s.tags.add('Pont_Escorte');s.objective='Traverser le Pont escorté par la patrouille.';addObj('La patrouille fluviale t’offre un passage encadré.');},ko:s=>{s.stress=Math.min(5,s.stress+1);log('On te renvoie vers la vase. +1 Stress.');}},goOK:'ber_entry',goKO:'ber_patrouille'},
    {label:'Suivre la patrouille à distance',hint:'CIN/Furtivité (11) — repérer la contre-voie',test:{stat:'CIN',skill:'Furtivité',dd:11,
      ok:s=>{s.tags.add('Pont_Souterrain');s.objective='Passer sous le pont par la contre-voie.';addObj('Itinéraire sous le tablier repéré.');},ko:s=>{s.stress=Math.min(5,s.stress+1);log('Un projecteur t’accroche. +1 Stress.');}},goOK:'pon_shadow',goKO:'ber_patrouille'},
    {label:'Allumer une flamme de détresse',hint:'Utiliser ton briquet pour détourner la patrouille',when:()=>hasItem('Briquet')&&!ST.tags.has('Pont_Distrait'),immediate:s=>{s.tags.add('Pont_Distrait');s.objective='Profiter de la confusion pour franchir le Pont.';addObj('Une flamme brève attire la patrouille vers la vase.');log('Le briquet déclenche une flamme brève : la patrouille se disperse.');},go:'ber_entry'},
    {label:'Saboter le relais de détection',hint:'NEU/Cryptanalyse (11) — détourner les capteurs',test:{stat:'NEU',skill:'Cryptanalyse',dd:11,
      ok:s=>{s.tags.add('Pont_Distrait');s.objective='Profiter de la confusion pour franchir le Pont.';addObj('Les capteurs du Pont partent en boucle.');},ko:s=>{s.stress=Math.min(5,s.stress+1);log('Les alarmes grincent. +1 Stress.');}},goOK:'ber_entry',goKO:'ber_patrouille'},
    {label:'Revenir vers les darses',hint:'Changer de stratégie',go:'ber_entry'}
  ]
 },
 pon_pass:{
 img:IMG.pon,title:'Pont de la Guill’ — Passage',text:()=>`
  <p>Deux guetteurs s’abritent sous le pont. Leurs badges grésillent et ils attendent un signe convaincant pour laisser passer quiconque vers T1.</p>`,
  choices:()=>{
    const a=[];
    if(ST.tags.has('Milo_Pass')){
      a.push({label:'Montrer le laissez-passer de Milo',hint:'Passe-droit négocié',immediate:s=>{s.objective='Traverser le Pont et atteindre T1.';log('Le laissez-passer de Milo claque, les guetteurs s’écartent.');},go:'t1_entry'});
    }else if(ST.tags.has('Coffret_Milo')){
      a.push({label:'Montrer le coffret — franchir le Pont',hint:'Passe-droit négocié avec Milo',immediate:s=>{s.objective='Traverser le Pont et atteindre T1.';log('« C’est pour Milo. » On te laisse filer.');},go:'t1_entry'});
    }
    if(ST.tags.has('Collectif_Pret')&&!ST.tags.has('Pont_Escorte')){
      a.push({label:'Appeler l’escorte du Collectif',hint:'Voie sociale préparée',immediate:s=>{s.tags.add('Pont_Escorte');s.objective='Traverser le Pont escorté par le Collectif.';addObj('Le Collectif t’encadre jusqu’au tablier.');},go:'t1_entry'});
    }
    if(ST.tags.has('Pont_Escorte')){
      a.push({label:'Suivre l’escorte jusqu’à T1',hint:'Route sociale sécurisée',immediate:s=>{s.objective='Laisser l’escorte te mener au périmètre de T1.';},go:'t1_entry'});
    }
    if(ST.tags.has('Milo_Code')&&!ST.tags.has('Milo_Pass')&&!ST.tags.has('Pont_Escorte')){
      a.push({label:'Énoncer le code gravé du coffret',hint:'Convaincre les guetteurs sans montrer de preuve',immediate:s=>{s.objective='Traverser le Pont et atteindre T1.';log('Le code de Milo ouvre la voie : les guetteurs te laissent filer.');},go:'t1_entry'});
    }
    if(ST.tags.has('Collectif_Dossier')){
      a.push({label:'Révéler le planning volé',hint:'Mettre la pression sur les guetteurs',immediate:s=>{s.tags.delete('Collectif_Dossier');s.tags.add('Pont_Distrait');addObj('Les guetteurs lâchent du lest face aux preuves.');},go:'pon_pass'});
    }
    if(ST.inv.includes('Badge maintenance')){
      a.push({label:'Badger la console de service',hint:'NEU/Mécanique (10) — accès technique',test:{stat:'NEU',skill:'Mécanique',dd:10,
        ok:s=>{s.tags.add('BadgeTech_Used');s.tags.add('Acces_Tech');s.inv=s.inv.filter(it=>it!=='Badge maintenance');s.objective='Remonter le couloir technique vers T1.';addObj('Badge de maintenance accepté sur le Pont.');},
        ko:s=>{s.stress=Math.min(5,s.stress+1);log('Le lecteur clignote rouge. +1 Stress.');}
      },goOK:'t1_entry',goKO:'pon_pass'});
    }
    if(ST.tags.has('Pont_Distrait')){
      a.push({label:'Profiter des capteurs en boucle',hint:'Glisser pendant la confusion',go:'pon_shadow'});
    }
    if(!ST.tags.has('Milo_Pass')){
      a.push({label:'Parler sec aux guetteurs',hint:'VOL/Intimidation (10) — passer par la parole',test:{stat:'VOL',skill:'Intimidation',dd:10,
        ok:s=>{s.objective='Traverser le Pont et atteindre T1.';log('Ça passe. Personne n’a envie d’histoires.');},ko:s=>{s.stress=Math.min(5,s.stress+1);log('On te balade. +1 Stress.');}
      },go:'t1_entry'});
      a.push({label:'Se glisser le long des barrières',hint:'CIN/Furtivité (12) — contour discret',test:{stat:'CIN',skill:'Furtivité',dd:12,
        ok:s=>{s.objective='Traverser le Pont et atteindre T1.';log('Tu files comme une ombre.');},ko:s=>{s.stress=Math.min(5,s.stress+1);log('Repéré·e, tu forces. +1 Stress.');}
      },go:'t1_entry'});
    }
    a.push({label:'Descendre sous le tablier',hint:'Voie d’infiltration vers la contre-voie',go:'pon_shadow'});
    a.push({label:'Revenir vers la Place',hint:'Changer d’approche',go:'place_return'});
    return a;
  }
},

 pon_shadow:{
  img:IMG.pon,title:'Pont de la Guill’ — Contre-voie',text:()=>`
  <p>Sous le tablier, l’eau gifle les piliers. Des câbles pendent et une grille d’inspection bat au vent.</p>`,
  choices:[
    {label:'Ramper jusqu’à la grille',hint:'CIN/Furtivité (10) — baliser une infiltration',when:()=>!ST.tags.has('T1_Grille'),test:{stat:'CIN',skill:'Furtivité',dd:10,
      ok:s=>{s.tags.add('Pont_Souterrain');s.tags.add('T1_Grille');s.objective='Atteindre le périmètre de T1 par la grille d’inspection.';addObj('Chemin sous le tablier balisé.');},
      ko:s=>{s.stress=Math.min(5,s.stress+1);log('Une éclaboussure bruyante trahit ta présence. +1 Stress.');}},goOK:'t1_overlook',goKO:'pon_shadow'},
    {label:'Pirater le relais de surveillance',hint:'NEU/Cryptanalyse (11) — déclencher une boucle',test:{stat:'NEU',skill:'Cryptanalyse',dd:11,
      ok:s=>{s.tags.add('Pont_Distrait');addObj('Les capteurs du pont se remettent à zéro dans un grésillement.');},
      ko:s=>{s.stress=Math.min(5,s.stress+1);log('Le relais claque et t’oblige à reculer. +1 Stress.');}},goOK:'pon_pass',goKO:'pon_shadow'},
    {label:'Allumer une flamme rassurante',hint:'Utiliser ton briquet pour faire baisser la pression (stress -1)',when:()=>hasItem('Briquet')&&!ST.tags.has('Briquet_Calm')&&ST.stress>0,immediate:s=>{s.stress=Math.max(0,s.stress-1);s.tags.add('Briquet_Calm');log('La flamme vacille mais t’apaise. Stress -1.');},go:'pon_shadow'},
    {label:'Revenir vers les Berges',hint:'Retenter depuis les darses',go:'ber_entry'},
    {label:'Remonter vers la Place',hint:'Reprendre son souffle sous l’auvent',go:'place_return'}
  ]
 },
 t1_entry:{
 img:IMG.t1,title:'Sous-station T1 — Plans froissés',text:()=>`
  <p>« La douceur est une technologie », griffonné à la craie sur le béton. La porte principale tremble ; la grille renvoie un souffle tiède.</p>`,
  choices:()=>{
    const arr=[
      {label:'Déverrouiller la porte principale',hint:'NEU/Cryptanalyse (12) — ouvrir l’accès frontal',test:{stat:'NEU',skill:'Cryptanalyse',dd:12,
        ok:s=>{s.tags.add('T1_Ouverte');s.objective='Stabiliser le cœur de T1.';addObj('Porte principale de T1 ouverte.');},ko:s=>{s.stress=Math.min(5,s.stress+1);log('Le ton faux te vrille. +1 Stress.');}}},
      {label:'Se glisser par la grille',hint:'CIN/Furtivité (10) — infiltration par le bas',test:{stat:'CIN',skill:'Furtivité',dd:10,
        ok:s=>{s.tags.add('T1_Grille');s.objective='Stabiliser le cœur de T1.';addObj('Tu t’infiltres par la grille.');},ko:s=>{log('Une vis tinte. Tu attends.');}}}
    ];
    if(hasItem('Tournevis isolé')&&!ST.tags.has('T1_Grille')){
      arr.push({label:'Démonter le panneau latéral',hint:'Utiliser ton tournevis pour créer un accès discret',immediate:s=>{s.tags.add('T1_Grille');s.tags.add('Acces_Tech');s.objective='Glisser vers le cœur de T1 par le panneau démonté.';addObj('Panneau latéral démonté grâce au tournevis isolé.');},go:'t1_overlook'});
    }
    if(ST.tags.has('Milo_Code')&&!ST.tags.has('T1_Ouverte')){
      arr.push({label:'Projeter le motif relevé sur la serrure',hint:'NEU/Déduction (9) — exploiter les codes de Milo',test:{stat:'NEU',skill:'Déduction',dd:9,
        ok:s=>{s.tags.add('T1_Ouverte');s.objective='Stabiliser le cœur de T1.';addObj('Le motif gravé synchronise la serrure de T1.');},
        ko:s=>{s.stress=Math.min(5,s.stress+1);log('Le motif rebondit sans effet. +1 Stress.');}
      },goOK:'t1_entry',goKO:'t1_entry'});
    }
    if(ST.tags.has('Noor_Trust')){
      arr.push({label:'Noor entrouvre la porte',hint:'Voie sociale depuis les caves',immediate:s=>{s.objective='Stabiliser le cœur de T1.';addObj('Noor te fait entrer par la cave.');}});
    }
    if(ST.tags.has('Pont_Escorte')&&!ST.tags.has('T1_Soutien')){
      arr.push({label:'Laisser l’escorte sécuriser l’entrée',hint:'Appui social pour tenir le périmètre',immediate:s=>{s.tags.add('T1_Soutien');s.objective='Stabiliser le cœur de T1 avec l’appui de l’escorte.';addObj('L’escorte verrouille l’entrée de T1.');},go:'t1_entry'});
    }
    if(ST.tags.has('Acces_Tech')||ST.tags.has('T1_Silence')){
      arr.push({label:'Suivre le couloir technique',hint:'Contourner par la passerelle',go:'t1_overlook'});
    }
    arr.push({label:'Contourner par la passerelle extérieure',hint:'Explorer le périmètre avant d’agir',go:'t1_overlook'});
    arr.push({label:'Revenir vers le Pont',hint:'Changer d’approche',go:'pon_pass'});
    arr.push({label:'Accéder au cœur',hint:'Disponible si une entrée est ouverte',when:()=>ST.tags.has('T1_Ouverte')||ST.tags.has('T1_Grille')||ST.tags.has('Noor_Trust')||ST.tags.has('T1_Soutien'),go:'t1_core'});
    return arr;
  }
 },

 t1_overlook:{
  img:IMG.t1,title:'Sous-station T1 — Périmètre',text:()=>`
  <p>La passerelle technique contourne le bâtiment. Des capteurs clignotent, certains arrachés par la Sourdine.</p>`,
  choices:[
    {label:'Se faufiler dans la gaine',hint:'CIN/Furtivité (10) — se positionner près du cœur',when:()=>!ST.tags.has('T1_Grille'),test:{stat:'CIN',skill:'Furtivité',dd:10,
      ok:s=>{s.tags.add('T1_Grille');s.objective='Stabiliser le cœur de T1 depuis la grille interne.';addObj('Gaine d’accès sécurisée.');},ko:s=>{s.stress=Math.min(5,s.stress+1);log('Un rivet claque. +1 Stress.');}},goOK:'t1_entry',goKO:'t1_overlook'},
    {label:'Synchroniser les capteurs',hint:'NEU/Cryptanalyse (11) — imposer un silence technique',when:()=>!ST.tags.has('T1_Silence'),test:{stat:'NEU',skill:'Cryptanalyse',dd:11,
      ok:s=>{s.tags.add('T1_Silence');s.tags.add('Acces_Tech');s.objective='Stabiliser le cœur de T1 à partir du périmètre sécurisé.';addObj('Capteurs synchronisés : la Sourdine se fait plus douce.');},
      ko:s=>{s.stress=Math.min(5,s.stress+1);log('Le réseau résiste. +1 Stress.');}},goOK:'t1_entry',goKO:'t1_overlook'},
    {label:'Coordonner l’escorte',hint:'VOL/Empathie (10) — utiliser l’appui social',when:()=>ST.tags.has('Pont_Escorte')&&!ST.tags.has('T1_Soutien'),test:{stat:'VOL',skill:'Empathie',dd:10,
      ok:s=>{s.tags.add('T1_Soutien');s.objective='Stabiliser le cœur de T1 avec un périmètre tenu par tes alliés.';addObj('L’escorte verrouille les issues autour de T1.');},
      ko:s=>{s.stress=Math.min(5,s.stress+1);log('La coordination déraille. +1 Stress.');}},goOK:'t1_entry',goKO:'t1_overlook'},
    {label:'Revenir à l’entrée principale',hint:'Retenter les accès frontaux',go:'t1_entry'},
    {label:'Rejoindre le Pont',hint:'Changer de stratégie',go:'pon_pass'}
  ]
 },
 t1_core:{
  img:IMG.t1,title:'Sous-station T1 — Cœur',text:()=>`
  <p>Le cœur de T1 vibre. Trois leviers bricolés clignotent : <b>Contournement</b>, <b>Relance</b>, <b>Trame douce</b>. Chaque option a son prix.</p>`,
  choices:()=>{
    const arr=[];
    if(hasItem('Gants usés')&&!ST.tags.has('Leviers_Prepares')){
      arr.push({label:'Enfiler tes gants sur les leviers',hint:'Préparer les commandes contre les arcs',immediate:s=>{s.tags.add('Leviers_Prepares');addObj('Les leviers sont isolés par tes gants usés.');log('Tu glisses tes gants usés sur les leviers : l’arc sera amorti.');},go:'t1_core'});
    }
    if(hasItem('Ruban textile')&&!ST.tags.has('Leviers_Prepares')){
      arr.push({label:'Enrubanner les câbles avec ton ruban',hint:'Renforcer l’isolation avant d’agir',immediate:s=>{s.tags.add('Leviers_Prepares');addObj('Le ruban textile amortit les arcs autour des leviers.');log('Tu bandes les leviers de ruban textile.');},go:'t1_core'});
    }
    arr.push({label:'Contournement — gagner du temps',hint:'SOM/Mécanique (10) — détourner les flux (+1 Flux)',test:{stat:'SOM',skill:'Mécanique',dd:10,
      ok:s=>{s.flux=Math.max(0,s.flux+1);s.objective='Quitter la zone avant la prochaine alerte.';addObj('Contournement posé : la nuit tiendra un peu plus.');clearEndingTags();markEndingApproach();s.tags.add('End_Contournement');},
      ko:s=>{
        if(s.tags.has('Leviers_Prepares')){
          s.tags.delete('Leviers_Prepares');
          log('La protection improvisée brûle mais tu restes indemne.');
        }else{
          s.hp=Math.max(0,s.hp-1);
          log('Coup de jus. +1 Blessure.');
        }
      }
    },goOK:()=>pickEnding('cont'),goKO:'ep_silent'});
    arr.push({label:'Relance — plus risqué',hint:'NEU/Déduction (12) — redémarrage bruyant',test:{stat:'NEU',skill:'Déduction',dd:12,
      ok:s=>{s.tags.add('Relance');addObj('Relance réussie : T1 repart en claquant.');clearEndingTags();markEndingApproach();s.tags.add('End_Noise');},
      ko:s=>{
        if(s.tags.has('Leviers_Prepares')){
          s.tags.delete('Leviers_Prepares');
          log('Le ruban fume mais tu restes concentré·e.');
        }else{
          s.stress=Math.min(5,s.stress+1);
          log('Tu recules. +1 Stress.');
        }
      }
    },goOK:()=>pickEnding('noise'),goKO:'ep_silent'});
    arr.push({label:'Trame douce — protéger les souvenirs',hint:'VOL/Empathie (12) + ✦ — apaiser la Sourdine',test:{stat:'VOL',skill:'Empathie',dd:12,needsFrag:true,
      ok:s=>{s.tags.add('Trame_Douce');addObj('Voile tiré : les mémoires restent en place.');clearEndingTags();markEndingApproach();s.tags.add('End_Soft');},
      ko:s=>{log('Tu n’oses pas. Rien ne casse.');}
    },goOK:()=>pickEnding('soft'),goKO:'ep_silent'});
    return arr;
  }
 },
 ep_cont:{img:IMG.t1,title:'Épilogue — Contournement',text:()=>`
  <p>Le quartier respire encore. Ce n’est pas brillant, mais tu as gagné quelques heures.</p>`,choices:[{label:'Recommencer (retour Prologue)',go:'prologue'}]},

 ep_cont_social:{img:IMG.t1,title:'Épilogue — Contournement collectif',text:()=>`
  <p>Le contournement reste discret grâce aux relais du quartier. Les escortes bloquent les curieux et entretiennent la dérivation.</p>`,choices:[{label:'Recommencer',go:'prologue'}]},
 ep_cont_shadow:{img:IMG.t1,title:'Épilogue — Contournement clandestin',text:()=>`
  <p>Sous le tablier, tu maintiens la dérivation sans qu’aucun guetteur ne comprenne comment tu as filé.</p>`,choices:[{label:'Recommencer',go:'prologue'}]},
 ep_cont_tech:{img:IMG.t1,title:'Épilogue — Contournement technique',text:()=>`
  <p>Les capteurs stabilisés guident le flux de réserve. T1 ronronne à bas bruit, mais tu sais où surveiller les prochains points chauds.</p>`,choices:[{label:'Recommencer',go:'prologue'}]},
 ep_noise:{img:IMG.t1,title:'Épilogue — Relance',text:()=>`
  <p>T1 claque comme une ampoule neuve. Certains applaudiront, d’autres t’en voudront pour le vacarme.</p>`,choices:[{label:'Recommencer',go:'prologue'}]},

 ep_noise_social:{img:IMG.t1,title:'Épilogue — Relance soutenue',text:()=>`
  <p>Le vacarme de T1 est couvert par les chants et les slogans. Les collectifs assument le bruit et revendiquent la relance.</p>`,choices:[{label:'Recommencer',go:'prologue'}]},
 ep_noise_shadow:{img:IMG.t1,title:'Épilogue — Relance fantôme',text:()=>`
  <p>La relance tonne, mais tu disparais déjà sur la contre-voie. On ne sait pas qui a rendu la lumière.</p>`,choices:[{label:'Recommencer',go:'prologue'}]},
 ep_noise_tech:{img:IMG.t1,title:'Épilogue — Relance calibrée',text:()=>`
  <p>Les transformateurs claquent en cadence. Tu laisses derrière toi des diagnostics détaillés et des alarmes maîtrisées.</p>`,choices:[{label:'Recommencer',go:'prologue'}]},
 ep_soft:{img:IMG.t1,title:'Épilogue — Trame douce',text:()=>`
  <p>La Sourdine se relâche. Des visages se souviennent mieux. Tu laisses la nuit respirer.</p>`,choices:[{label:'Recommencer',go:'prologue'}]},

 ep_soft_collectif:{img:IMG.t1,title:'Épilogue — Trame douce partagée',text:()=>`
  <p>Les souvenirs se solidarisent sur la Place. Le Collectif transmet ce qu’il a appris pour maintenir la douceur.</p>`,choices:[{label:'Recommencer',go:'prologue'}]},
 ep_soft_shadow:{img:IMG.t1,title:'Épilogue — Trame douce furtive',text:()=>`
  <p>Tu quittes T1 sans bruit. Derrière toi, la Sourdine se calme le long du passage souterrain.</p>`,choices:[{label:'Recommencer',go:'prologue'}]},
 ep_soft_tech:{img:IMG.t1,title:'Épilogue — Trame douce synchronisée',text:()=>`
  <p>Les capteurs alignés diffusent un voile stable. Les habitants respirent enfin sans craindre l’oubli immédiat.</p>`,choices:[{label:'Recommencer',go:'prologue'}]},
 ep_silent:{img:IMG.t1,title:'Épilogue — Silence',text:()=>`
  <p>T1 se tait. Tu coupes proprement et promets de revenir avec plus de temps.</p>`,choices:[{label:'Recommencer',go:'prologue'}]}
};
}

