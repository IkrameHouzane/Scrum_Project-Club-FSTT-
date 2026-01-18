// Dashboard Admin - Données Dynamiques

document.addEventListener('DOMContentLoaded', function() {
    // Vérifier que l'utilisateur est authentifié
    if (window.auth && !window.auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        console.log('🔄 Chargement des données du dashboard...');
        
        // Récupérer les statistiques avec authentification
        const [membresResponse, activitesResponse, inscriptionsResponse, categoriesResponse] = await Promise.all([
            fetch('http://localhost:5000/api/membres', { headers: window.auth?.getAuthHeaders() || {} }),
            fetch('http://localhost:5000/api/activites'),
            fetch('http://localhost:5000/api/inscriptions/all', { headers: window.auth?.getAuthHeaders() || {} }),
            fetch('http://localhost:5000/api/categories', { headers: window.auth?.getAuthHeaders() || {} })
        ]);

        console.log('📊 Réponses API:', {
            membres: membresResponse.status,
            activites: activitesResponse.status,
            inscriptions: inscriptionsResponse.status,
            categories: categoriesResponse.status
        });

        // Vérifier les réponses et extraire les données
        const membresResult = membresResponse.ok ? await membresResponse.json() : { membres: [] };
        const activitesResult = activitesResponse.ok ? await activitesResponse.json() : { data: [] };
        const inscriptionsResult = inscriptionsResponse.ok ? await inscriptionsResponse.json() : [];
        const categoriesResult = categoriesResponse.ok ? await categoriesResponse.json() : { data: [] };

        console.log('📋 Données brutes:', {
            membres: membresResult,
            activites: activitesResult,
            inscriptions: inscriptionsResult,
            categories: categoriesResult
        });

        const membresData = membresResult.membres || [];
        const activitesData = activitesResult.data || [];
        // Inscriptions API returns array directly, not wrapped in data object
        const inscriptionsData = Array.isArray(inscriptionsResult) ? inscriptionsResult : [];
        const categoriesData = categoriesResult.data || [];

        console.log('📈 Données extraites:', {
            membresCount: membresData.length,
            activitesCount: activitesData.length,
            inscriptionsCount: inscriptionsData.length,
            categoriesCount: categoriesData.length
        });

        // Mettre à jour les nombres affichés
        updateDashboardStats(membresData, activitesData, inscriptionsData, categoriesData);
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données du dashboard:', error);
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
