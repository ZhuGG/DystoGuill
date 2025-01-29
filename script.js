const GITHUB_TOKEN = "TON_TOKEN_ICI";  // ⚠️ À remplacer par ton token GitHub

function chargerCommandes() {
    fetch("https://api.github.com/repos/ZhuGG/v-mach-cantina/issues", {
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

        data.forEach(issue => {
            let body = issue.body.split("\n");
            let row = `<tr>
                <td>${issue.title}</td>
                <td>${body[0] || '-'}</td>
                <td>${body[1] || '-'}</td>
                <td>${body[2] || '-'}</td>
                <td>${body[3] || '-'}</td>
                <td>${body[4] || '-'}</td>
                <td><button onclick="supprimerCommande(${issue.number})">Supprimer</button></td>
            </tr>`;
            table.innerHTML += row;
        });
    })
    .catch(error => console.error("Erreur lors du chargement des commandes :", error));
}

function ajouterCommande() {
    let nom = document.getElementById("nom").value;
    let entree = document.getElementById("entree").value;
    let plat = document.getElementById("plat").value;
    let accompagnement = document.getElementById("accompagnement").value;
    let boisson = document.getElementById("boisson").value;
    let autre = document.getElementById("autre").value;

    if (nom.trim() === "") {
        alert("Veuillez entrer votre nom !");
        return;
    }

    let body = `${entree || 'Aucune'}\n${plat || 'Aucun'}\n${accompagnement || 'Aucun'}\n${boisson || 'Aucune'}\n${autre || 'Rien à signaler'}`;

    fetch("https://api.github.com/repos/ZhuGG/v-mach-cantina/issues", {
        method: "POST",
        headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: `Commande - ${nom}`,
            body: body,
            labels: ["commande"]
        })
    })
    .then(response => response.json())
    .then(() => {
        chargerCommandes();
    })
    .catch(error => console.error("Erreur lors de l'ajout de la commande :", error));
}

function supprimerCommande(issueNumber) {
    fetch("https://api.github.com/repos/ZhuGG/v-mach-cantina/issues/" + issueNumber, {
        method: "PATCH",
        headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ state: "closed" })
    })
    .then(() => {
        chargerCommandes();
    })
    .catch(error => console.error("Erreur lors de la suppression de la commande :", error));
}

document.addEventListener("DOMContentLoaded", chargerCommandes);
