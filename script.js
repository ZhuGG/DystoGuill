let GITHUB_TOKEN = localStorage.getItem("GITHUB_TOKEN") || prompt("Entrez votre token GitHub :");
localStorage.setItem("GITHUB_TOKEN", GITHUB_TOKEN);
const GITHUB_TOKEN = prompt("Entrez votre token GitHub :");
const REPO_URL = "https://api.github.com/repos/ZhuGG/v-mach-cantina/issues";

function chargerCommandes() {
    fetch(REPO_URL, {
        headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Accept": "application/vnd.github.v3+json"
        }
    })
    .then(response => response.json())
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

function ajouterCommande() {
    let nom = document.getElementById("nom").value;
    let entree = document.getElementById("entree").value;
    let plat = document.getElementById("plat").value;
    let accompagnement = document.getElementById("accompagnement").value;
    let boisson = document.getElementById("boisson").value;
    let autre = document.getElementById("autre").value;

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
    }).then(() => chargerCommandes());
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
        if (response.ok) {
            setTimeout(() => { location.reload(); }, 500); // Recharge après suppression
        } else {
            console.error("Erreur lors de la suppression :", response);
        }
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
        data.forEach(issue => {
            fetch(`${REPO_URL}/${issue.number}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `token ${GITHUB_TOKEN}`,
                    "Accept": "application/vnd.github.v3+json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ state: "closed" })
            });
        });
        setTimeout(chargerCommandes, 1000); // Recharge après suppression
    })
    .catch(error => console.error("Erreur lors de la réinitialisation :", error));
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
        let body = "Voici les commandes enregistrées :\n\n";
        
        data.forEach((c, index) => {
            let details = c.body.split("\\n");
            body += `Commande ${index + 1} :\n`;
            body += `Nom : ${c.title.replace("Commande - ", "")}\n`;
            body += `Entrée : ${details[0] || 'Aucune'}\n`;
            body += `Plat : ${details[1] || 'Aucun'}\n`;
            body += `Accompagnement : ${details[2] || 'Aucun'}\n`;
            body += `Boisson : ${details[3] || 'Aucune'}\n`;
            body += `Autre : ${details[4] || 'Rien à signaler'}\n\n`;
        });

        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    })
    .catch(error => console.error("Erreur lors de l'envoi du mail :", error));
}

// Chargement des commandes au démarrage
document.addEventListener("DOMContentLoaded", chargerCommandes);
