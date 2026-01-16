// Dashboard Admin - Données Dynamiques

document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        // Récupérer les statistiques
        const [membresData, activitesData, inscriptionsData, categoriesData] = await Promise.all([
            fetch('/api/membres').then(res => res.json()),
            fetch('/api/activites').then(res => res.json()),
            fetch('/api/inscriptions').then(res => res.json()),
            fetch('/api/categories').then(res => res.json())
        ]);

        // Mettre à jour les nombres affichés
        updateDashboardStats(membresData, activitesData, inscriptionsData, categoriesData);
    } catch (error) {
        console.error('Erreur lors du chargement des données du dashboard:', error);
        // Afficher les valeurs par défaut en cas d'erreur
        setDefaultStats();
    }
}

function updateDashboardStats(membresData, activitesData, inscriptionsData, categoriesData) {
    // Compter les membres
    const totalMembres = membresData.length || 0;
    const membresActifs = membresData.filter(m => m.estActif === 1).length || 0;

    // Compter les activités
    const totalActivites = activitesData.length || 0;

    // Compter les inscriptions
    const totalInscriptions = inscriptionsData.length || 0;

    // Compter les catégories
    const totalCategories = categoriesData.length || 0;

    // Mettre à jour le DOM
    document.getElementById('stat-members').textContent = membresActifs;
    document.getElementById('stat-activities').textContent = totalActivites;
    document.getElementById('stat-inscriptions').textContent = totalInscriptions;
    document.getElementById('stat-categories').textContent = totalCategories;
}

function setDefaultStats() {
    document.getElementById('stat-members').textContent = '0';
    document.getElementById('stat-activities').textContent = '0';
    document.getElementById('stat-inscriptions').textContent = '0';
    document.getElementById('stat-categories').textContent = '0';
}

// Charger le rôle de l'utilisateur
function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role) {
        document.getElementById('user-role').textContent = user.role;
    }
}

// Appeler au chargement
loadUserInfo();
