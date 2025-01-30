// 🔹 Stockage du token GitHub (évite de le redemander après un rafraîchissement)
let GITHUB_TOKEN = localStorage.getItem("GITHUB_TOKEN");

if (!GITHUB_TOKEN) {
    GITHUB_TOKEN = prompt("Entrez votre token GitHub :").trim();
    if (GITHUB_TOKEN) {
        localStorage.setItem("GITHUB_TOKEN", GITHUB_TOKEN);
    } else {
        alert("Vous devez entrer un token pour utiliser l'application !");
    }
}
// 🔹 Mode sombre - Activation et stockage
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("dark-mode", document.body.classList.contains("dark-mode"));
}

// Vérifie l’état stocké et applique le mode sombre si activé
if (localStorage.getItem("dark-mode") === "true") {
    document.body.classList.add("dark-mode");
}

// 🔹 Ajout du bouton dynamique
const darkModeButton = document.createElement("button");
darkModeButton.innerText = "🌙";
darkModeButton.style.position = "absolute";
darkModeButton.style.top = "10px";
darkModeButton.style.right = "10px";
darkModeButton.style.padding = "10px";
darkModeButton.style.borderRadius = "50%";
darkModeButton.style.cursor = "pointer";
darkModeButton.onclick = toggleDarkMode;
document.body.appendChild(darkModeButton);

// 🔹 URL du repo GitHub
const REPO_URL = "https://api.github.com/repos/ZhuGG/v-mach-cantina/issues";

// 🔹 Fonction pour charger les commandes
function chargerCommandes() {
    if (!GITHUB_TOKEN) {
        console.error("❌ Aucun token trouvé !");
        return;
    }

    fetch(REPO_URL, {
        headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Accept": "application/vnd.github.v3+json"
        }
    })
    .then(response => response.json())
    .then(data => {
        let commandesContainer = document.getElementById("commandes");
        commandesContainer.innerHTML = "";

        data.forEach(issue => {
            let body;
            try {
                body = JSON.parse(issue.body);
            } catch (e) {
                body = {};
            }

            let commandeCard = document.createElement("div");
            commandeCard.classList.add("command-card");
            commandeCard.innerHTML = `
                <strong>${issue.title.replace("Commande - ", "")}</strong>
                <p>Entrée : ${body.entree || '-'}</p>
                <p>Plat : ${body.plat || '-'}</p>
                <p>Accompagnement : ${body.accompagnement || '-'}</p>
                <p>Boisson : ${body.boisson || '-'}</p>
                <p>Autre : ${body.autre || '-'}</p>
                <button class="delete-btn" onclick="supprimerCommande(${issue.number})">🗑️ Supprimer</button>
            `;
            commandesContainer.appendChild(commandeCard);
        });
    })
    .catch(error => console.error("❌ Erreur de récupération des commandes :", error));
}

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

    fetch(REPO_URL, {
        method: "POST",
        headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: `Commande - ${nom}`,
            body: JSON.stringify({
                entree: entree,
                plat: plat,
                accompagnement: accompagnement,
                boisson: boisson,
                autre: autre
            })
        })
    })
    .then(() => {
        setTimeout(chargerCommandes, 500);
    })
    .catch(error => console.error("Erreur lors de l'ajout de la commande :", error));
}

// 🔹 Fonction pour supprimer une commande
function supprimerCommande(issueNumber) {
    fetch(`${REPO_URL}/${issueNumber}`, {
        method: "PATCH",
        headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ state: "closed" })
    })
    .then(() => {
        setTimeout(chargerCommandes, 500);
    })
    .catch(error => console.error("Erreur lors de la suppression de la commande :", error));
}

// 🔹 Fonction pour envoyer les commandes par mail
function envoyerMail() {
    fetch(REPO_URL, {
        headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Accept": "application/vnd.github.v3+json"
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.length === 0) {
            alert("Aucune commande à envoyer.");
            return;
        }

        let subject = "Commandes V-Mach Cantina";
        let body = "📌 Voici les commandes enregistrées :\n\n";
        
        data.forEach((c, index) => {
            let details;
            try {
                details = JSON.parse(decodeURIComponent(escape(c.body)));
            } catch (e) {
                details = {};
            }

            body += `📍 Commande ${index + 1} :\n`;
            body += `👤 Nom : ${c.title.replace("Commande - ", "")}\n`;
            body += `🥗 Entrée : ${details.entree || 'Aucune'}\n`;
            body += `🍽 Plat : ${details.plat || 'Aucun'}\n`;
            body += `🍟 Accompagnement : ${details.accompagnement || 'Aucun'}\n`;
            body += `🥤 Boisson : ${details.boisson || 'Aucune'}\n`;
            body += `📝 Autre : ${details.autre || 'Rien à signaler'}\n\n`;
        });

        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    })
    .catch(error => console.error("Erreur lors de l'envoi du mail :", error));
}

// 🔹 Fonction pour activer le mode sombre
const darkModeToggle = document.getElementById("toggle-dark-mode");

if (darkModeToggle) {
    darkModeToggle.addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("dark-mode", document.body.classList.contains("dark-mode"));
    });

    if (localStorage.getItem("dark-mode") === "true") {
        document.body.classList.add("dark-mode");
    }
}

// 🔹 Initialisation de l'application
document.addEventListener("DOMContentLoaded", chargerCommandes);
