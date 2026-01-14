document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const inscriptionsList = document.getElementById('inscriptionsList');
    const searchInput = document.getElementById('searchInput');
    const logoutBtn = document.getElementById('logout-btn');

    // Vérifier l'authentification
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Fonction pour charger toutes les inscriptions
    async function loadInscriptions() {
        try {
            const response = await fetch('http://localhost:5000/api/inscriptions/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des inscriptions');
            }

            const inscriptions = await response.json();
            displayInscriptions(inscriptions);
        } catch (error) {
            console.error('Erreur:', error);
            inscriptionsList.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Erreur: ${error.message}</td></tr>`;
        }
    }

    // Fonction pour afficher les inscriptions dans le tableau
    function displayInscriptions(inscriptions) {
        if (inscriptions.length === 0) {
            inscriptionsList.innerHTML = '<tr><td colspan="6" style="text-align: center;">Aucune inscription trouvée.</td></tr>';
            return;
        }

        inscriptionsList.innerHTML = inscriptions.map(ins => `
            <tr>
                <td>${new Date(ins.date_inscription).toLocaleDateString('fr-FR')}</td>
                <td>
                    <strong>${ins.membre_nom} ${ins.membre_prenom}</strong><br>
                    <small>${ins.membre_email}</small>
                </td>
                <td>${ins.activite_titre}</td>
                <td>${ins.lieu}</td>
                <td><span class="badge badge-inscrit">${ins.statut}</span></td>
                <td>
                    <button class="btn btn-small btn-danger" onclick="supprimerInscription(${ins.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Fonction de recherche
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = inscriptionsList.querySelectorAll('tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    });

    // Fonction pour supprimer (annuler) une inscription
    window.supprimerInscription = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir annuler cette inscription ?')) return;

        try {
            const response = await fetch(`http://localhost:5000/api/inscriptions/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Inscription annulée avec succès');
                loadInscriptions();
            } else {
                const data = await response.json();
                alert(`Erreur: ${data.error}`);
            }
        } catch (error) {
            alert('Erreur lors de la suppression');
        }
    };

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    });

    // Init
    loadInscriptions();
});
