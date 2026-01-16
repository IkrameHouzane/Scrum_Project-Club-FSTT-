// ================================================
// GESTION DES CATÉGORIES D'ACTIVITÉS
// ================================================

console.log('🏷️ categories.js chargé');

// Variables globales
let currentCategories = [];
let editingCategoryId = null;

// ================================================
// FONCTIONS UTILITAIRES
// ================================================

function showNotification(message, isError = false) {
    const container = document.getElementById('message-container');
    if (!container) return;
    
    container.textContent = message;
    container.className = `message-container ${isError ? 'error' : 'success'}`;
    container.style.display = 'block';
    
    setTimeout(() => {
        container.style.display = 'none';
    }, 5000);
}

function updateUserInterface() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRoleEl = document.getElementById('user-role');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (user && user.id) {
        if (userRoleEl) {
            userRoleEl.textContent = `${user.prenom || user.nom} (${user.role})`;
        }
        
        if (logoutBtn) {
            logoutBtn.onclick = () => {
                localStorage.clear();
                window.location.href = 'login.html';
            };
        }
    }
}

// ================================================
// CHARGEMENT DES CATÉGORIES
// ================================================

async function loadCategories() {
    console.log('🔄 Chargement des catégories...');
    
    const container = document.getElementById('categories-container');
    if (!container) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`Erreur HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Catégories reçues:', data);
        
        if (data.success && Array.isArray(data.data)) {
            currentCategories = data.data;
            displayCategories(data.data);
        } else {
            throw new Error('Format de réponse invalide');
        }
    } catch (error) {
        console.error('❌ Erreur chargement catégories:', error);
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erreur de chargement</h3>
                <p>${error.message}</p>
                <button onclick="loadCategories()" class="btn btn-secondary">
                    <i class="fas fa-redo"></i> Réessayer
                </button>
            </div>
        `;
    }
}

// ================================================
// AFFICHAGE DES CATÉGORIES
// ================================================

function displayCategories(categories) {
    const container = document.getElementById('categories-container');
    if (!container) return;
    
    if (categories.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tags"></i>
                <h3>Aucune catégorie</h3>
                <p>Créez votre première catégorie pour organiser vos activités.</p>
                <button onclick="openCategoryModal()" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Créer une catégorie
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    categories.forEach(category => {
        const card = createCategoryCard(category);
        container.appendChild(card);
    });
}

function createCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'category-card';
    
    const activitiesCount = category.nombre_activites || 0;
    const activitiesText = activitiesCount === 0 
        ? 'Aucune activité' 
        : activitiesCount === 1 
            ? '1 activité' 
            : `${activitiesCount} activités`;
    
    card.innerHTML = `
        <div class="category-header">
            <div class="category-icon">
                <i class="fas fa-tag"></i>
            </div>
            <div class="category-title">
                <h3>${category.nom}</h3>
                <span class="activity-count">${activitiesText}</span>
            </div>
        </div>
        
        ${category.description ? `
            <div class="category-description">
                <p>${category.description}</p>
            </div>
        ` : ''}
        
        <div class="category-footer">
            <button onclick="showStats(${category.id}, '${category.nom.replace(/'/g, "\\'")}', ${activitiesCount})" 
                    class="btn btn-small btn-secondary"
                    ${activitiesCount === 0 ? 'disabled' : ''}>
                <i class="fas fa-chart-bar"></i> Statistiques
            </button>
            <div class="action-buttons">
                <button onclick="openEditModal(${category.id})" class="btn btn-small btn-primary">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button onclick="openDeleteModal(${category.id}, '${category.nom.replace(/'/g, "\\'")}', ${activitiesCount})" 
                        class="btn btn-small btn-danger">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// ================================================
// MODAL CRÉATION/MODIFICATION
// ================================================

function openCategoryModal(categoryId = null) {
    const modal = document.getElementById('category-modal');
    const form = document.getElementById('category-form');
    const modalTitle = document.querySelector('#modal-title span');
    
    if (!modal || !form) return;
    
    // Réinitialiser le formulaire
    form.reset();
    editingCategoryId = categoryId;
    
    if (categoryId) {
        // Mode édition
        modalTitle.textContent = 'Modifier la catégorie';
        const category = currentCategories.find(c => c.id === categoryId);
        
        if (category) {
            document.getElementById('category-nom').value = category.nom;
            document.getElementById('category-description').value = category.description || '';
        }
    } else {
        // Mode création
        modalTitle.textContent = 'Créer une catégorie';
    }
    
    modal.style.display = 'flex';
}

function openEditModal(categoryId) {
    openCategoryModal(categoryId);
}

// ================================================
// SOUMISSION DU FORMULAIRE
// ================================================

async function handleCategorySubmit(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';
        
        const formData = {
            nom: document.getElementById('category-nom').value.trim(),
            description: document.getElementById('category-description').value.trim() || null
        };
        
        const url = editingCategoryId 
            ? `${API_BASE_URL}/categories/${editingCategoryId}`
            : `${API_BASE_URL}/categories`;
        
        const method = editingCategoryId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showNotification(data.message || 'Catégorie enregistrée avec succès', false);
            
            // Fermer le modal
            document.getElementById('category-modal').style.display = 'none';
            
            // Recharger les catégories
            await loadCategories();
        } else {
            throw new Error(data.message || 'Erreur lors de l\'enregistrement');
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
        showNotification(error.message, true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ================================================
// SUPPRESSION
// ================================================

function openDeleteModal(categoryId, categoryName, activitiesCount) {
    const modal = document.getElementById('delete-modal');
    const message = document.getElementById('delete-message');
    const confirmBtn = document.getElementById('confirm-delete-btn');
    
    if (!modal || !message || !confirmBtn) return;
    
    if (activitiesCount > 0) {
        message.innerHTML = `
            <strong>Impossible de supprimer la catégorie "${categoryName}"</strong><br><br>
            Cette catégorie est utilisée par <strong>${activitiesCount} activité(s)</strong>.<br>
            Veuillez d'abord dissocier les activités de cette catégorie.
        `;
        confirmBtn.style.display = 'none';
    } else {
        message.innerHTML = `
            Êtes-vous sûr de vouloir supprimer la catégorie <strong>"${categoryName}"</strong> ?
        `;
        confirmBtn.style.display = 'inline-block';
        confirmBtn.onclick = () => deleteCategory(categoryId);
    }
    
    modal.style.display = 'flex';
}

async function deleteCategory(categoryId) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const originalText = confirmBtn.innerHTML;
    
    try {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Suppression...';
        
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showNotification(data.message || 'Catégorie supprimée avec succès', false);
            
            // Fermer le modal
            document.getElementById('delete-modal').style.display = 'none';
            
            // Recharger les catégories
            await loadCategories();
        } else {
            throw new Error(data.message || 'Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
        showNotification(error.message, true);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalText;
    }
}

// ================================================
// STATISTIQUES
// ================================================

async function showStats(categoryId, categoryName, activitiesCount) {
    if (activitiesCount === 0) {
        showNotification('Cette catégorie n\'a pas encore d\'activités', true);
        return;
    }
    
    const modal = document.getElementById('stats-modal');
    const nameSpan = document.getElementById('stats-category-name');
    const content = document.getElementById('stats-content');
    
    if (!modal || !nameSpan || !content) return;
    
    nameSpan.textContent = categoryName;
    content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';
    modal.style.display = 'flex';
    
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
            const stats = data.data;
            
            content.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-list"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.total_activites || 0}</div>
                        <div class="stat-label">Activités totales</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon stat-planifiee">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.activites_planifiees || 0}</div>
                        <div class="stat-label">Planifiées</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon stat-en-cours">
                        <i class="fas fa-spinner"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.activites_en_cours || 0}</div>
                        <div class="stat-label">En cours</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon stat-terminee">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.activites_terminees || 0}</div>
                        <div class="stat-label">Terminées</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon stat-annulee">
                        <i class="fas fa-ban"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.activites_annulees || 0}</div>
                        <div class="stat-label">Annulées</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon stat-places">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.total_places || 0}</div>
                        <div class="stat-label">Places totales</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon stat-reservees">
                        <i class="fas fa-user-check"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.places_reservees || 0}</div>
                        <div class="stat-label">Places réservées</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon stat-taux">
                        <i class="fas fa-percentage"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">
                            ${stats.total_places > 0 
                                ? Math.round((stats.places_reservees / stats.total_places) * 100) 
                                : 0}%
                        </div>
                        <div class="stat-label">Taux de réservation</div>
                    </div>
                </div>
            `;
        } else {
            throw new Error('Données de statistiques invalides');
        }
    } catch (error) {
        console.error('❌ Erreur chargement stats:', error);
        content.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erreur lors du chargement des statistiques</p>
            </div>
        `;
    }
}

// ================================================
// GESTION DES MODALS
// ================================================

function setupModalHandlers() {
    // Modal catégorie
    const categoryModal = document.getElementById('category-modal');
    const closeCategoryBtns = document.querySelectorAll('.close-modal');
    
    closeCategoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryModal.style.display = 'none';
        });
    });
    
    categoryModal.addEventListener('click', (e) => {
        if (e.target === categoryModal) {
            categoryModal.style.display = 'none';
        }
    });
    
    // Modal suppression
    const deleteModal = document.getElementById('delete-modal');
    const closeDeleteBtns = document.querySelectorAll('.close-delete-modal');
    
    closeDeleteBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });
    });
    
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
    
    // Modal stats
    const statsModal = document.getElementById('stats-modal');
    const closeStatsBtns = document.querySelectorAll('.close-stats-modal');
    
    closeStatsBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            statsModal.style.display = 'none';
        });
    });
    
    statsModal.addEventListener('click', (e) => {
        if (e.target === statsModal) {
            statsModal.style.display = 'none';
        }
    });
}

// ================================================
// INITIALISATION
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Initialisation de la gestion des catégories');
    
    // Vérifier l'authentification
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'ADMIN') {
        alert('Accès réservé aux administrateurs');
        window.location.href = 'dashboard_admin.html';
        return;
    }
    
    // Mettre à jour l'interface
    updateUserInterface();
    
    // Configurer les modals
    setupModalHandlers();
    
    // Bouton créer catégorie
    const createBtn = document.getElementById('create-category-btn');
    if (createBtn) {
        createBtn.addEventListener('click', () => openCategoryModal());
    }
    
    // Formulaire catégorie
    const categoryForm = document.getElementById('category-form');
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategorySubmit);
    }
    
    // Charger les catégories
    loadCategories();
});

// Exposer les fonctions globalement
window.openCategoryModal = openCategoryModal;
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
window.showStats = showStats;
window.loadCategories = loadCategories;

console.log('✅ categories.js initialisé');