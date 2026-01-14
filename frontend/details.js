// ================================================
// CONSTANTES API
// ================================================
console.log('🔄 details.js en cours de chargement...');

// Vérifier que auth.js est chargé
if (!window.API_BASE_URL_ACTIVITES || !window.API_BASE_URL_MEMBRES) {
    console.error('❌ ERREUR: auth.js doit être chargé AVANT details.js !');
}

console.log('✅ details.js chargé avec API:', window.API_BASE_URL_ACTIVITES);

// ================================================
// FONCTIONS UTILITAIRES
// ================================================

// Afficher les messages
function showNotification(message, isError = false) {
    const container = document.getElementById('message-container');
    if (!container) return;
    
    container.textContent = message;
    container.className = `message ${isError ? 'error' : 'success'}`;
    container.style.display = 'block';
    
    setTimeout(() => {
        container.style.display = 'none';
    }, 5000);
}

// Mettre à jour l'interface utilisateur
function updateUserInterface() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRoleEl = document.getElementById('user-role');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (user && user.id) {
        // Utilisateur connecté
        if (userRoleEl) {
            userRoleEl.textContent = `${user.prenom || user.nom} (${user.role})`;
        }
        if (loginBtn) {
            loginBtn.style.display = 'none';
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'inline-block';
            logoutBtn.onclick = () => {
                localStorage.clear();
                window.location.href = 'login.html';
            };
        }
    } else {
        // Utilisateur non connecté
        if (userRoleEl) {
            userRoleEl.textContent = 'Non connecté';
        }
        if (loginBtn) {
            loginBtn.style.display = 'inline-block';
            loginBtn.onclick = () => {
                window.location.href = 'login.html';
            };
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
    }
}

// Vérifier les permissions
function canManageActivities() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user && ['MEMBRE_BUREAU', 'ADMIN'].includes(user.role);
}

function canCancelActivity(organisateurId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.id) return false;
    return ['MEMBRE_BUREAU', 'ADMIN'].includes(user.role) || user.id === organisateurId;
}

// ================================================
// INITIALISATION
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== PAGE DÉTAILS DÉMARRÉE ===');
    console.log('URL complète:', window.location.href);
    
    // Vérifier l'authentification
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
        console.log('Non authentifié, redirection vers login');
        showNotification('Veuillez vous connecter pour voir les détails', true);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    // Mettre à jour l'interface
    updateUserInterface();
    
    // Récupérer l'ID depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    let activityId = urlParams.get('id');
    
    console.log('ID depuis URL params:', activityId);
    
    // Si pas dans les params, essayer d'extraire de l'URL
    if (!activityId) {
        const url = window.location.href;
        const match = url.match(/[?&]id=(\d+)/);
        if (match) {
            activityId = match[1];
            console.log('ID extrait de l\'URL:', activityId);
        }
    }
    
    console.log('ID final trouvé:', activityId);
    
    if (!activityId) {
        showErrorPage('Aucun ID d\'activité trouvé dans l\'URL');
        return;
    }
    
    // Charger les détails de l'activité
    loadActivityDetails(activityId);
});

// ================================================
// FONCTIONS DE GESTION
// ================================================

function showErrorPage(message) {
    const container = document.getElementById('details-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>${message}</h3>
            <p>Impossible de trouver l'ID de l'activité dans l'URL.</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4>Informations de débogage :</h4>
                <p><strong>URL complète :</strong> ${window.location.href}</p>
                <p><strong>Pathname :</strong> ${window.location.pathname}</p>
                <p><strong>Search :</strong> ${window.location.search}</p>
                <p><strong>Hash :</strong> ${window.location.hash}</p>
            </div>
            
            <div style="margin-top: 20px;">
                <p>Pour tester manuellement, entrez un ID :</p>
                <input type="number" id="manual-id-input" placeholder="ID de l'activité" 
                       style="padding: 8px; margin-right: 10px;">
                <button onclick="testWithManualId()" class="btn btn-primary">
                    <i class="fas fa-search"></i> Tester cet ID
                </button>
                <a href="activite_page.html" class="btn btn-secondary" style="margin-left: 10px;">
                    <i class="fas fa-arrow-left"></i> Retour à l'accueil
                </a>
            </div>
        </div>
    `;
}

window.testWithManualId = function() {
    const manualId = document.getElementById('manual-id-input').value;
    if (manualId) {
        window.location.href = `details.html?id=${manualId}`;
    } else {
        alert('Veuillez entrer un ID valide');
    }
};

async function loadActivityDetails(id) {
    const container = document.getElementById('details-container');
    if (!container) {
        console.error('Conteneur de détails non trouvé');
        return;
    }
    
    console.log('Chargement des détails pour l\'activité ID:', id);
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Non authentifié');
        }
        
        // Afficher le chargement
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement des détails...</div>';
        
        const response = await fetch(`${window.API_BASE_URL_ACTIVITES}/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
                
        console.log('Status réponse:', response.status);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Activité #${id} non trouvée`);
            }
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Données reçues:', data);
        
        if (data.success) {
            displayActivityDetails(data.data);
        } else {
            throw new Error(data.message || 'Erreur de chargement des données');
        }
    } catch (error) {
        console.error('Erreur chargement détails:', error);
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erreur de chargement</h3>
                <p>${error.message}</p>
                <p><small>ID essayé : ${id}</small></p>
                
                <div style="margin-top: 20px;">
                    <button onclick="loadActivityDetails(${id})" class="btn btn-primary">
                        <i class="fas fa-redo"></i> Réessayer
                    </button>
                    <a href="index.html" class="btn btn-secondary" style="margin-left: 10px;">
                        <i class="fas fa-arrow-left"></i> Retour à l'accueil
                    </a>
                </div>
            </div>
        `;
    }
}

function displayActivityDetails(activity) {
    const container = document.getElementById('details-container');
    if (!container) return;
    
    console.log('Affichage des détails:', activity);
    
    // Formatage des dates
    const dateDebut = new Date(activity.dateDebut).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const dateFin = activity.dateFin 
        ? new Date(activity.dateFin).toLocaleDateString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        })
        : '';
    
    // Badge de statut
    let statusBadge = '';
    if (activity.statut === 'Annulee') {
        statusBadge = '<span class="badge badge-annulee">ANNULÉE</span>';
    } else if (activity.placesRestantes === 0) {
        statusBadge = '<span class="badge badge-complet">COMPLET</span>';
    } else if (activity.statut === 'Planifiee') {
        statusBadge = '<span class="badge badge-planifiee">PLANIFIÉE</span>';
    } else {
        statusBadge = '<span class="badge badge-disponible">DISPONIBLE</span>';
    }
        
    // Récupérer l'utilisateur courant
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        // Déterminer la page de retour selon le rôle
    let retourHref = 'activite_page.html'; // valeur par défaut
    if (['ADMIN', 'MEMBRE_BUREAU'].includes(currentUser.role)) {
        retourHref = 'gestion_activite.html';
    }
    
    container.innerHTML = `
        <div class="details-card">
            <div class="details-header">
                <div class="details-title">
                    <h1>${activity.titre || 'Sans titre'}</h1>
                    ${statusBadge}
                </div>
                
                <div class="details-meta">
                    <span class="category-badge">
                        <i class="fas fa-tag"></i> ${activity.categorie_nom || 'Non catégorisé'}
                    </span>
                    <span class="activity-id">ID: ${activity.id}</span>
                </div>
            </div>
            
            <div class="details-content">
                <div class="details-section">
                    <h3><i class="far fa-calendar-alt"></i> Date et heure</h3>
                    <p><strong>Début :</strong> ${dateDebut}</p>
                    ${dateFin ? `<p><strong>Fin :</strong> ${dateFin}</p>` : ''}
                </div>
                
                <div class="details-section">
                    <h3><i class="fas fa-map-marker-alt"></i> Lieu</h3>
                    <p>${activity.lieu || 'Non spécifié'}</p>
                </div>
                
                <div class="details-section">
                    <h3><i class="fas fa-users"></i> Places disponibles</h3>
                    <p><strong>Disponibles :</strong> ${activity.placesRestantes || 0} / ${activity.placesMax || 0} places</p>
                    ${activity.placesRestantes > 0 ? `
                        <div style="margin-top: 10px;">
                            <a href="inscrire.html?id=${activity.id}" class="btn btn-success btn-small">
                                <i class="fas fa-user-plus"></i> S'inscrire
                            </a>
                        </div>
                    ` : ''}
                </div>
                
                ${activity.description ? `
                <div class="details-section">
                    <h3><i class="fas fa-align-left"></i> Description</h3>
                    <div class="description-content">
                        ${activity.description.replace(/\n/g, '<br>')}
                    </div>
                </div>
                ` : ''}
                
                ${activity.organisateur_nom ? `
                <div class="details-section">
                    <h3><i class="fas fa-user-tie"></i> Organisateur</h3>
                    <p>${activity.organisateur_nom}</p>
                    ${activity.organisateur_poste ? `<p><small>${activity.organisateur_poste}</small></p>` : ''}
                </div>
                ` : ''}
            </div>
            
            <div class="details-footer">
                <div class="action-buttons">
                    ${activity.statut !== 'Annulee' && canManageActivities() ? `
                        <a href="edit.html?id=${activity.id}" class="btn btn-primary">
                            <i class="fas fa-edit"></i> Modifier
                        </a>
                    ` : ''}
                    
                    ${activity.statut !== 'Annulee' && canCancelActivity(activity.organisateur_id) ? `
                        <button onclick="showCancelModal(${activity.id}, '${activity.titre?.replace(/'/g, "\\'") || ''}', ${(activity.placesMax || 0) - (activity.placesRestantes || 0)})"
                                class="btn btn-danger">
                            <i class="fas fa-ban"></i> Annuler
                        </button>
                    ` : ''}
                    
                    <a href="${retourHref}" class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i> Retour aux activités
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Modal d'annulation -->
        <div id="cancel-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> Confirmer l'annulation</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <p id="cancel-message"></p>
                    <p><strong>⚠️ Attention :</strong> Tous les participants seront notifiés.</p>
                    <div id="participants-preview" class="participants-preview">
                        <p><i class="fas fa-users"></i> <span id="participants-count">0</span> participant(s) seront notifié(s)</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="cancel-confirm-btn" class="btn btn-danger">
                        <i class="fas fa-ban"></i> Confirmer l'annulation
                    </button>
                    <button class="btn btn-secondary close-modal">Annuler</button>
                </div>
            </div>
        </div>
    `;
    
    // Configurer le modal d'annulation
    setupCancelModal();
    
    // Ajouter le CSS si nécessaire
    addDetailsCSS();
}

function addDetailsCSS() {
    // Vérifier si le CSS est déjà ajouté
    if (document.getElementById('details-css')) return;
    
    const style = document.createElement('style');
    style.id = 'details-css';
    style.textContent = `
        .details-card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.1);
            margin: 20px auto;
            max-width: 900px;
        }
        .details-header {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #f0f7ff;
        }
        .details-title {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        .details-title h1 {
            margin: 0;
            color: #2c3e50;
            font-size: 2.2rem;
            line-height: 1.3;
            flex: 1;
        }
        .details-meta {
            display: flex;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        .category-badge {
            background: linear-gradient(135deg, #6a89cc, #4a69bd);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .activity-id {
            background: #f8f9fa;
            color: #6c757d;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.85rem;
            border: 1px solid #dee2e6;
        }
        .details-content {
            margin: 30px 0;
        }
        .details-section {
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
        .details-section:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        .details-section h3 {
            margin: 0 0 15px 0;
            color: #34495e;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .details-section h3 i {
            color: #3498db;
            width: 24px;
        }
        .details-section p {
            margin: 8px 0;
            color: #555;
            line-height: 1.6;
            font-size: 1.05rem;
        }
        .details-section strong {
            color: #2c3e50;
            min-width: 100px;
            display: inline-block;
        }
        .description-content {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            line-height: 1.7;
            color: #444;
            border-left: 4px solid #3498db;
        }
        .details-footer {
            padding-top: 25px;
            border-top: 1px solid #eee;
            margin-top: 30px;
        }
        .action-buttons {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            justify-content: center;
            align-items: center;
        }
        .modal-content {
            background: white;
            padding: 25px;
            border-radius: 10px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .modal-header h3 {
            margin: 0;
            color: #2c3e50;
        }
        .close-modal {
            font-size: 28px;
            cursor: pointer;
            color: #999;
        }
        .close-modal:hover {
            color: #333;
        }
        .modal-footer {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 25px;
        }
        .participants-preview {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 4px solid #ffc107;
        }
        .error-state {
            text-align: center;
            padding: 40px;
            background: #fff5f5;
            border-radius: 12px;
            border: 1px solid #fc8181;
            color: #c53030;
            max-width: 800px;
            margin: 40px auto;
        }
        .error-state h3 {
            margin: 0 0 20px 0;
            color: #c53030;
            font-size: 1.5rem;
        }
        .loading {
            text-align: center;
            padding: 80px 30px;
            color: #6c757d;
            font-size: 1.2rem;
        }
        .loading i {
            margin-right: 12px;
            font-size: 1.4rem;
            color: #3498db;
        }
        @media (max-width: 768px) {
            .details-card {
                padding: 20px;
            }
            .details-title {
                flex-direction: column;
                align-items: flex-start;
            }
            .details-title h1 {
                margin-bottom: 15px;
                font-size: 1.8rem;
            }
            .action-buttons {
                flex-direction: column;
            }
            .action-buttons .btn {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
}

function setupCancelModal() {
    const modal = document.getElementById('cancel-modal');
    if (!modal) return;
    
    // Boutons de fermeture
    const closeBtns = modal.querySelectorAll('.close-modal');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    });
    
    // Fermer en cliquant en dehors
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Exposer la fonction showCancelModal globalement
    window.showCancelModal = function(activityId, activityTitle, participantsCount) {
        const message = document.getElementById('cancel-message');
        const countSpan = document.getElementById('participants-count');
        const confirmBtn = document.getElementById('cancel-confirm-btn');
        
        if (!message || !countSpan || !confirmBtn) return;
        
        message.textContent = `Êtes-vous sûr de vouloir annuler l'activité "${activityTitle}" ?`;
        countSpan.textContent = participantsCount || 0;
        
        confirmBtn.onclick = async function() {
            await cancelActivity(activityId);
        };
        
        modal.style.display = 'flex';
    };
}

async function cancelActivity(activityId) {
    try {
        const modal = document.getElementById('cancel-modal');
        const confirmBtn = document.getElementById('cancel-confirm-btn');
        
        // Désactiver le bouton
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Annulation en cours...';
        }
        
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Non authentifié');
        
        const response = await fetch(`${window.API_BASE_URL_ACTIVITES}/${activityId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ confirm: true })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showNotification('Activité annulée avec succès', false);
            
            if (modal) modal.style.display = 'none';
            
            // Recharger les détails
            await loadActivityDetails(activityId);
        } else {
            throw new Error(data.message || 'Erreur lors de l\'annulation');
        }
    } catch (error) {
        console.error('Erreur d\'annulation:', error);
        showNotification(`Erreur: ${error.message}`, true);
    } finally {
        const confirmBtn = document.getElementById('cancel-confirm-btn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-ban"></i> Confirmer l\'annulation';
        }
    }
}