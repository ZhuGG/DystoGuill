function nettoyerTexte(texte) {
    return texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Supprime les accents
               .replace(/[^\x00-\x7F]/g, ""); // Supprime tous les caractères non ASCII
}

function supprimerEmojis(texte) {
    return texte.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");
}

// 🔹 Stockage du token GitHub
let GITHUB_TOKEN = localStorage.getItem("GITHUB_TOKEN");

if (!GITHUB_TOKEN || GITHUB_TOKEN.length < 40) {
    GITHUB_TOKEN = prompt("Entrez votre token GitHub :").trim();
    localStorage.setItem("GITHUB_TOKEN", GITHUB_TOKEN);
}

const REPO_URL = "https://api.github.com/repos/ZhuGG/v-mach-cantina/issues";

// 🔹 Charger les commandes depuis GitHub Issues
function chargerCommandes() {
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
                <button class="delete-btn" onclick="supprimerCommande(${issue.number})">Supprimer</button>
            `;
            commandesContainer.appendChild(commandeCard);
        });
    })
    .catch(error => console.error("❌ Erreur de récupération des commandes :", error));
}


// 🔹 Ajouter une commande
function ajouterCommande() {
    console.log("🟢 Ajout d'une commande...");

    let nom = nettoyerTexte(document.getElementById("nom").value.trim());
    let entree = nettoyerTexte(document.getElementById("entree").value.trim());
    let plat = nettoyerTexte(document.getElementById("plat").value.trim());
    let accompagnement = nettoyerTexte(document.getElementById("accompagnement").value.trim());
    let boisson = nettoyerTexte(document.getElementById("boisson").value.trim());
    let autre = nettoyerTexte(document.getElementById("autre").value.trim());

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
            body: JSON.stringify({ entree, plat, accompagnement, boisson, autre })
        })
    })
    .then(response => {
        if (!response.ok) throw new Error("Erreur API GitHub : Impossible d'ajouter la commande.");
        return response.json();
    })
    .then(() => {
        console.log("✅ Commande ajoutée !");
        setTimeout(chargerCommandes, 500);
    })
    .catch(error => console.error("❌ Erreur lors de l'ajout de la commande :", error));
}

// 🔹 Supprimer une commande
function supprimerCommande(issueNumber) {
    console.log("🟠 Suppression de la commande :", issueNumber);

    fetch(`${REPO_URL}/${issueNumber}`, {
        method: "PATCH",
        headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ state: "closed" })
    })
    .then(response => {
        if (!response.ok) throw new Error("Erreur API GitHub : Impossible de supprimer la commande.");
        return response.json();
    })
    .then(() => {
        console.log("✅ Commande supprimée !");
        setTimeout(chargerCommandes, 500);
    })
    .catch(error => console.error("❌ Erreur lors de la suppression de la commande :", error));
}

// 🔹 Envoyer les commandes par mail
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

            body += `Commande ${index + 1} :\n`;
            body += `Nom : ${nettoyerTexte(c.title.replace("Commande - ", ""))}\n`;
            body += `Entrée : ${details.entree || 'Aucune'}\n`;
            body += `Plat : ${details.plat || 'Aucun'}\n`;
            body += `Accompagnement : ${details.accompagnement || 'Aucun'}\n`;
            body += `Boisson : ${details.boisson || 'Aucune'}\n`;
            body += `Autre : ${details.autre || 'Rien à signaler'}\n\n`;
        });

        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    })
    .catch(error => console.error("❌ Erreur lors de l'envoi du mail :", error));
}
// 🔹 Activation/Désactivation du mode sombre
document.getElementById("toggle-dark-mode").addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
});

// 🔹 Vérification si le mode sombre était activé au dernier chargement
if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
}

// Chargement des commandes au démarrage
document.addEventListener("DOMContentLoaded", chargerCommandes);
