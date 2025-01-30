document.addEventListener("DOMContentLoaded", function () {
    const darkModeToggle = document.getElementById("toggle-dark-mode");

    if (darkModeToggle) {
        darkModeToggle.addEventListener("click", function () {
            document.body.classList.toggle("dark-mode");
            localStorage.setItem("dark-mode", document.body.classList.contains("dark-mode"));
        });

        // Appliquer le mode sombre au chargement si activé
        if (localStorage.getItem("dark-mode") === "true") {
            document.body.classList.add("dark-mode");
        }
    }
});

// 🔹 Fonction pour ajouter une commande
function ajouterCommande() {
    let nom = document.getElementById("nom").value.trim();
    let entree = document.getElementById("entree").value.trim();
    let plat = document.getElementById("plat").value.trim();
    let accompagnement = document.getElementById("accompagnement").value.trim();
    let boisson = document.getElementById("boisson").value.trim();
    let autre = document.getElementById("autre").value.trim();

    if (!nom) {
        alert("Le champ Nom est obligatoire !");
        return;
    }

    let commandesContainer = document.getElementById("commandes");

    let commandeCard = document.createElement("div");
    commandeCard.classList.add("command-card");
    commandeCard.innerHTML = `
        <strong>${nom}</strong>
        <p>Entrée : ${entree || '-'}</p>
        <p>Plat : ${plat || '-'}</p>
        <p>Accompagnement : ${accompagnement || '-'}</p>
        <p>Boisson : ${boisson || '-'}</p>
        <p>Autre : ${autre || '-'}</p>
        <button class="delete-btn" onclick="this.parentElement.remove()">🗑️</button>
    `;

    commandesContainer.appendChild(commandeCard);
}

// 🔹 Fonction pour réinitialiser la liste des commandes
function reinitialiserCommandes() {
    document.getElementById("commandes").innerHTML = "";
}

// 🔹 Fonction pour envoyer les commandes par mail
function envoyerMail() {
    let commandes = document.querySelectorAll(".command-card");
    if (commandes.length === 0) {
        alert("Aucune commande à envoyer.");
        return;
    }

    let subject = "Commandes V-Mach Cantina";
    let body = "📌 Voici les commandes enregistrées :\n\n";

    commandes.forEach((commande, index) => {
        let details = commande.innerText.split("\n");
        body += `📍 Commande ${index + 1} :\n${details.join("\n")}\n\n`;
    });

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
