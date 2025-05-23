// Sauvegarde l’état des checklists (localStorage)
document.addEventListener('DOMContentLoaded', function () {
  for (const id of ['collectif', 'individuel']) {
    const checklist = document.getElementById(id);
    if (!checklist) continue;
    const items = checklist.querySelectorAll('input[type=checkbox]');
    // Charger
    let saved = localStorage.getItem('bauges_checklist_' + id);
    if (saved) {
      saved = JSON.parse(saved);
      items.forEach
