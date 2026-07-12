# Bail Noir - Guillotière

**Bail Noir** est une courte enquête noire et dystopique située dans le quartier lyonnais de la Guillotière.

Nora, ancienne organisatrice de locataires, disparaît quelques heures avant une évacuation. La Régie des Quartiers Calmes transforme des habitants bien réels en « départs volontaires ». Le joueur doit choisir entre sauver Nora, publier le dossier ou protéger le quartier au prix d’un compromis sale.

## Lancer le jeu

Ouvrez `index.html` dans un navigateur ou servez le dossier localement:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Puis ouvrez `http://127.0.0.1:4173`.

## Piliers du jeu

- **Un retour personnel:** chaque profil porte une dette différente envers la Guillotière.
- **Preuves ou protection:** le joueur arbitre entre publication, témoins, sécurité de Nora et pression.
- **Le réseau de Kabé:** Chacha trie les rumeurs, Anto garde le seuil et Mymy fait circuler les alertes, les faveurs et les dettes.
- **Un coût moral:** Kabé protège, mais aucune protection n’est gratuite.
- **Plusieurs fins:** publication, sauvetage de Nora, marché avec Antoine ou échec sous couvre-feu.
- **Une ambiance incarnée:** scènes illustrées, effets sonores et doublages courts ponctuent les moments clés.

## Structure

- `index.html`: structure de l’application et fenêtres de dialogue.
- `styles/main.css`: interface responsive, animations, dossier et dés.
- `scripts/app.js`: affichage, sauvegarde, dés, inventaire, contacts, sons et réseau de Kabé.
- `scripts/data/scenes.js`: scènes, choix, variations de profil et fins.
- `scripts/data/kabe.js`: actions sociales de Kabé, dont celles de Mymy.
- `scripts/data/arch.js`: profils des protagonistes.
- `scripts/data/state.js`: état du jeu, objets, relations et sélection des fins.
- `assets/bail-noir/`: images et fichiers audio.

## Vérification manuelle

Il n’existe pas encore de tests automatisés. Après une modification:

- choisir chacun des trois profils;
- atteindre Kabé et utiliser au moins une action du réseau;
- déclencher puis résoudre un test de dés;
- entrer dans la Régie par au moins un chemin;
- vérifier une fin de publication, une fin centrée sur Nora et le marché avec Antoine;
- contrôler les doublages de Mymy, Nora et Antoine;
- tester les largeurs ordinateur et mobile sans débordement de texte.

La progression est enregistrée dans le stockage local du navigateur sous la clé `bail_noir_v2`.
