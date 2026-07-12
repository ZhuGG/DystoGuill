export const choiceId = (sceneId, key) => `${sceneId}:${key}`;

export function isResolved(state, id) {
  return state.resolvedChoices.has(id);
}

export function resolveChoice(state, id) {
  if (!id || isResolved(state, id)) return false;
  state.resolvedChoices.add(id);
  return true;
}

export function choiceAvailable(state, choice, sceneId) {
  const id = choice.id || choiceId(sceneId, choice.key || choice.label);
  return (!choice.when || choice.when()) && (!choice.once || !isResolved(state, id));
}
