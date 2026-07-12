import assert from 'node:assert/strict';
import { choiceId, choiceAvailable, resolveChoice } from '../scripts/data/progression.js';

const state = { resolvedChoices: new Set() };
const id = choiceId('place', 'ask-neighbours');
assert.equal(resolveChoice(state, id), true);
assert.equal(resolveChoice(state, id), false);
assert.equal(choiceAvailable(state, { id, once: true }, 'place'), false);
assert.equal(choiceAvailable(state, { id: 'place:move', repeatable: true }, 'place'), true);
console.log('progression logic: ok');
