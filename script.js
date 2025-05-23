// Checklist : sauvegarde/restaure l'état (localStorage)
// Fonctionne pour tous les ul.checklist ayant un id
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('ul.checklist').forEach(function(ul) {
    const key = 'bauges_checklist_' + ul.id;
    const items = ul.querySelectorAll('input[type=checkbox]');
    // Restore state
    let saved = localStorage.getItem(key);
    if (saved) {
      try {
        JSON.parse(saved).forEach((checked, i) => {
          if (items[i]) items[i].checked = !!checked;
        });
      } catch (e) {}
    }
    // Save on change
    items.forEach(function(box, idx) {
      box.addEventListener('change', function() {
        let state = Array.from(items).map(x => x.checked);
        localStorage.setItem(key, JSON.stringify(state));
        // Optionnel : petit flash visuel quand on coche
        if (box.checked) {
          box.parentElement.classList.add('checked-flash');
          setTimeout(() => box.parentElement.classList.remove('checked-flash'), 200);
        }
      });
    });
  });
});

// (Facultatif) : style pour flash visuel (à ajouter dans ton CSS)
/*
.checked-flash {
  background: #d9fadd !important;
  transition: background 0.2s;
}
*/
