// 🔹 Stockage du token GitHub (évite de le redemander après un rafraîchissement)
let GITHUB_TOKEN = localStorage.getItem("GITHUB_TOKEN");

if (!GITHUB_TOKEN) {
    GITHUB_TOKEN = prompt("Entrez votre token GitHub :");
    localStorage.setItem("GITHUB_TOKEN", GITHUB_TOKEN);
}

const REPO_URL = "https://api.github.com/repos/ZhuGG/v-mach-cantina/issues";

// 🔹 Fonction pour charger les commandes depuis GitHub Issues
function chargerCommandes() {
    fetch(REPO_URL, {
        headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Accept": "application/vnd.github.v3+json"
        }
    })
    .then(response => {
        if (!response.ok) throw new Error("Erreur API GitHub : Impossible de récupérer les commandes.");
        return response.json();
    })
    .then(data => {
        let table = document.getElementById("commandes");
        let compteur = document.getElementById("compteur");
        table.innerHTML = "";

        compteur.innerHTML = `Commandes enregistrées : ${data.length}`;

        if (data.length > 0) {
            let headerRow = "<tr><th>Nom</th><th>Entrée</th><th>Plat</th><th>Accompagnement</th><th>Boisson</th><th>Autre</th><th>Action</th></tr>";
            table.innerHTML += headerRow;

            data.forEach(issue => {
                let body = issue.body.split("\\n");
                let row = `<tr>
                    <td>${issue.title.replace("Commande - ", "")}</td>
                    <td>${body[0] || '-'}</td>
                    <td>${body[1] || '-'}</td>
                    <td>${body[2] || '-'}</td>
                    <td>${body[3] || '-'}</td>
                    <td>${body[4] || '-'}</td>
                    <td><button class="delete-btn" onclick="supprimerCommande(${issue.number})">Supprimer</button></td>
                </tr>`;
                table.innerHTML += row;
            });
        }
    })
    .catch(error => console.error("Erreur de récupération des commandes :", error));
}

// 🔹 Fonction pour ajouter une nouvelle commande
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
            body: `${entree}\\n${plat}\\n${accompagnement}\\n${boisson}\\n${autre}`
        })
    })
    .then(response => {
        if (!response.ok) throw new Error("Erreur API GitHub : Impossible d'ajouter la commande.");
        return response.json();
    })
    .then(() => {
        setTimeout(chargerCommandes, 500); // Recharge après ajout
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
    .then(response => {
        if (!response.ok) throw new Error("Erreur API GitHub : Impossible de supprimer la commande.");
        return response.json();
    })
    .then(() => {
        setTimeout(chargerCommandes, 500); // Recharge après suppression
    })
    .catch(error => console.error("Erreur lors de la suppression de la commande :", error));
}

// 🔹 Fonction pour réinitialiser toutes les commandes
function reinitialiserCommandes() {
    fetch(REPO_URL, {
        headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Accept": "application/vnd.github.v3+json"
        }
    })
    .then(response => response.json())
    .then(data => {
        let promises = data.map(issue => {
            return fetch(`${REPO_URL}/${issue.number}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `token ${GITHUB_TOKEN}`,
                    "Accept": "application/vnd.github.v3+json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ state: "closed" })
            });
        });

        return Promise.all(promises);
    })
    .then(() => {
        setTimeout(chargerCommandes, 1000); // Recharge après suppression
    })
    .catch(error => console.error("Erreur lors de la réinitialisation :", error));
}

// 🔹 Fonction pour envoyer les commandes par mail (format amélioré)
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
            let details = c.body.split("\\n");
            body += `📍 Commande ${index + 1} :\n`;
            body += `👤 Nom : ${c.title.replace("Commande - ", "")}\n`;
            body += `🥗 Entrée : ${details[0] || 'Aucune'}\n`;
            body += `🍽 Plat : ${details[1] || 'Aucun'}\n`;
            body += `🍟 Accompagnement : ${details[2] || 'Aucun'}\n`;
            body += `🥤 Boisson : ${details[3] || 'Aucune'}\n`;
            body += `📝 Autre : ${details[4] || 'Rien à signaler'}\n\n`;
        });

        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    })
    .catch(error => console.error("Erreur lors de l'envoi du mail :", error));
}

// Chargement des commandes au démarrage
document.addEventListener("DOMContentLoaded", chargerCommandes);
