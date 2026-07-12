# Bail Noir - Guillotiere

**Bail Noir** is a short dystopian noir investigation set in Lyon's Guillotiere district.

You return after Nora, a former tenant organizer, disappears before a 6:00 evacuation. The Regie des Quartiers Calmes is reclassifying living tenants as "voluntary departures"; your choices decide whether Nora is saved, the dossier is published, or the neighborhood survives one more night under a dirty compromise.

## Play

Open `index.html` in a browser, or serve the folder locally:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then visit:

```text
http://127.0.0.1:4173
```

## Current Game Pillars

- **Personal return:** each protagonist profile has a different debt to the Guillotiere.
- **Evidence vs protection:** the player balances public proof, witnesses, Nora's safety, and pressure.
- **Kabe network:** Chacha filters rumors, Anto guards the threshold, and Mymy circulates warnings and favors.
- **Moral cost:** Kabe can protect people, but every protection leaves a trace or a debt.
- **Multiple endings:** publication, Nora-first rescue, Antoine's market, or failure under curfew.

## Project Structure

- `index.html` - static app shell and modals.
- `styles/main.css` - responsive interface, case board, cards, and dice overlay.
- `scripts/app.js` - UI rendering, save/load, dice flow, inventory, contacts, and Kabe modal.
- `scripts/data/scenes.js` - story scenes, choices, endings, and narrative conditions.
- `scripts/data/kabe.js` - Kabe network actions, including Mymy.
- `scripts/data/arch.js` - protagonist profiles.
- `scripts/data/state.js` - game state, items, relations, and ending selection.
- `assets/bail-noir/` - images and audio assets.

## Manual Verification

There are no automated tests yet. When changing the game, manually verify:

- choose each protagonist profile;
- reach Kabe and use at least one network action;
- trigger a dice test and resolve it;
- reach the Regie through at least one access path;
- check publication, Nora-first, market, and lost endings when practical;
- test desktop and mobile widths for text overflow.

## Notes

The game stores progress in browser local storage under `bail_noir_v2`. If behavior looks stale during development, reset the game from the UI or clear local storage.
