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
        console.log("📌 Données récupérées :", data);

        let table = document.getElementById("commandes");
        let compteur = document.getElementById("compteur");
        table.innerHTML = "";

        compteur.innerHTML = `Commandes enregistrées : ${data.length}`;

        if (data.length > 0) {
            let headerRow = "<tr><th>Nom</th><th>Entrée</th><th>Plat</th><th>Accompagnement</th><th>Boisson</th><th>Autre</th><th>Action</th></tr>";
            table.innerHTML += headerRow;

            data.forEach(issue => {
                let body;
                try {
                    body = JSON.parse(issue.body);
                } catch (e) {
                    body = {};
                }

                let row = `<tr>
                    <td>${issue.title.replace("Commande - ", "")}</td>
                    <td>${body.entree || '-'}</td>
                    <td>${body.plat || '-'}</td>
                    <td>${body.accompagnement || '-'}</td>
                    <td>${body.boisson || '-'}</td>
                    <td>${body.autre || '-'}</td>
                    <td><button class="delete-btn" onclick="supprimerCommande(${issue.number})">Supprimer</button></td>
                </tr>`;
                table.innerHTML += row;
            });
        }
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

// Chargement des commandes au démarrage
document.addEventListener("DOMContentLoaded", chargerCommandes);
