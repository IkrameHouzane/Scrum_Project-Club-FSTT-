// auth.js – Version corrigée avec toutes les URLs

// ================================================
// CONSTANTES API GLOBALES
// ================================================
const API_BASE_URL         = 'http://localhost:5000/api';
const API_BASE_URL_MEMBRES = `${API_BASE_URL}/membres`;
const API_BASE_URL_ACTIVITES = `${API_BASE_URL}/activites`;

// ================================================
// FONCTIONS D'AUTHENTIFICATION
// ================================================

function getToken() {
    return localStorage.getItem('token');
}

function isAuthenticated() {
    return !!getToken();
}

function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function canManageActivities() {
    const user = getCurrentUser();
    return user && ['MEMBRE_BUREAU', 'ADMIN'].includes(user.role);
}

function canCancelActivity(organisateurId) {
    const user = getCurrentUser();
    if (!user) return false;
    // Can cancel if user is admin/bureau or is the organizer
    return ['MEMBRE_BUREAU', 'ADMIN'].includes(user.role) || user.id === organisateurId;
}

function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

// Vérification au chargement de chaque page protégée
function protectPage() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}
function showMessage(message, isError = false) {
    console.log(isError ? '❌ ' + message : '✅ ' + message);
    // Vous pouvez ajouter une logique d'affichage UI ici
}

// ================================================
// EXPORTER LES FONCTIONS ET CONSTANTES
// ================================================
window.auth = {
    getToken,
    isAuthenticated,
    getCurrentUser,
    canManageActivities,
    canCancelActivity,
    getAuthHeaders,
    protectPage,
    showMessage
};

// Rendre les URLs accessibles globalement
window.API_BASE_URL_MEMBRES   = API_BASE_URL_MEMBRES;
window.API_BASE_URL_ACTIVITES = API_BASE_URL_ACTIVITES;

console.log('✅ auth.js chargé - URLs configurées');

