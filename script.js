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
    });
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

document.addEventListener("DOMContentLoaded", chargerCommandes);
