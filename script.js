// 🔹 Chargement sécurisé du token GitHub
async function chargerToken() {
    try {
        let response = await fetch("./token.js"); // Chargement depuis un fichier JS public
        if (!response.ok) throw new Error("Impossible de charger le token sécurisé.");
        
        let tokenModule = await response.text();
        let tokenMatch = tokenModule.match(/GITHUB_TOKEN\s*=\s*['"](.+?)['"]/);
        
        if (!tokenMatch) throw new Error("Token introuvable.");
        
        return tokenMatch[1];
    } catch (error) {
        console.error("❌ Erreur de récupération du token sécurisé :", error);
        return null;
    }
}

// 🔹 Initialisation de l'application
async function init() {
    window.GITHUB_TOKEN = await chargerToken();
    
    if (!window.GITHUB_TOKEN) {
        console.error("❌ Impossible de charger l'application sans token.");
        return;
    }

    chargerCommandes();
}

// 🔹 Chargement des commandes depuis GitHub Issues
async function chargerCommandes() {
    if (!window.GITHUB_TOKEN) {
        console.error("❌ Token manquant.");
        return;
    }

    try {
        let response = await fetch("https://api.github.com/repos/ZhuGG/v-mach-cantina/issues", {
            headers: {
                "Authorization": `token ${window.GITHUB_TOKEN}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (!response.ok) throw new Error("Erreur API GitHub");

        let data = await response.json();
        afficherCommandes(data);
    } catch (error) {
        console.error("❌ Erreur de récupération des commandes :", error);
    }
}

// 🔹 Fonction d'affichage des commandes
function afficherCommandes(data) {
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
            <button class="delete-btn" onclick="supprimerCommande(${issue.number})">🗑️</button>
        `;
        commandesContainer.appendChild(commandeCard);
    });
}

// 🔹 Fonction pour ajouter une commande
async function ajouterCommande() {
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

    try {
        let response = await fetch("https://api.github.com/repos/ZhuGG/v-mach-cantina/issues", {
            method: "POST",
            headers: {
                "Authorization": `token ${window.GITHUB_TOKEN}`,
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
        });

        if (!response.ok) throw new Error("Erreur API GitHub");
        setTimeout(chargerCommandes, 500);
    } catch (error) {
        console.error("Erreur lors de l'ajout de la commande :", error);
    }
}

// 🔹 Fonction pour supprimer une commande
async function supprimerCommande(issueNumber) {
    try {
        let response = await fetch(`https://api.github.com/repos/ZhuGG/v-mach-cantina/issues/${issueNumber}`, {
            method: "PATCH",
            headers: {
                "Authorization": `token ${window.GITHUB_TOKEN}`,
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ state: "closed" })
        });

        if (!response.ok) throw new Error("Erreur API GitHub");
        setTimeout(chargerCommandes, 500);
    } catch (error) {
        console.error("Erreur lors de la suppression de la commande :", error);
    }
}

// 🔹 Fonction pour envoyer les commandes par mail
async function envoyerMail() {
    try {
        let response = await fetch("https://api.github.com/repos/ZhuGG/v-mach-cantina/issues", {
            headers: {
                "Authorization": `token ${window.GITHUB_TOKEN}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (!response.ok) throw new Error("Erreur API GitHub");

        let data = await response.json();
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
    } catch (error) {
        console.error("Erreur lors de l'envoi du mail :", error);
    }
}

// 🔹 Initialiser l'application
document.addEventListener("DOMContentLoaded", init);
