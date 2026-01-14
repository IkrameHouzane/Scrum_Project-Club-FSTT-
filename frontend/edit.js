// Script spécifique à la page de modification
document.addEventListener('DOMContentLoaded', async function() {
    // Vérifier l'authentification
    auth.protectPage();
    
    // Récupérer l'ID depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const activityId = urlParams.get('id');
    
    if (!activityId) {
        window.location.href = 'index.html';
        return;
    }
    
    // Charger l'activité à modifier
    await loadActivityForEdit(activityId);
});

// Charger l'activité pour modification
async function loadActivityForEdit(id) {
    const form = document.getElementById('edit-form');
    if (!form) return;

    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        const response = await fetch(`${window.API_BASE_URL_ACTIVITES}/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        const activity = data.data ?? data;

        if (!activity || !activity.id) {
            throw new Error('Activité non trouvée');
        }

        if (activity.organisateur_id !== user.id && user.role !== 'ADMIN' && user.role !== 'MEMBRE_BUREAU') {
            auth.showMessage('Vous ne pouvez modifier que vos propres activités', true );
            setTimeout(() => window.location.href = `details?id=${id}`, 2000);
            return;
        }

        // Charger les catégories avant d'afficher le formulaire
        await loadCategoriesForEdit();

        // Afficher le formulaire et configurer le submit
        displayEditForm(activity);
        setupEditForm(id, activity);

    } catch (error) {
        form.innerHTML = `
            <div class="empty-state">
                <h3>Erreur de chargement</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}


// Charger les catégories pour le formulaire
async function loadCategoriesForEdit() {
    try {
        const response = await fetch(`${window.API_BASE_URL_ACTIVITES}/categories`);
        const data = await response.json();
        
        if (data.success) {
            window.categories = data.data;
        }
    } catch (error) {
        console.error('Erreur chargement catégories:', error);
    }
}

// Afficher le formulaire de modification
function displayEditForm(activity) {
    const form = document.getElementById('edit-form');
    if (!form) return;
    
    // Formater les dates pour l'input datetime-local
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
    };
    
    form.innerHTML = `
        <div class="form-group">
            <label for="titre"><i class="fas fa-heading"></i> Titre de l'activité *</label>
            <input type="text" id="titre" name="titre" required 
                   value="${activity.titre.replace(/"/g, '&quot;')}">
        </div>
        
        <div class="form-group">
            <label for="description"><i class="fas fa-align-left"></i> Description</label>
            <textarea id="description" name="description">${activity.description || ''}</textarea>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label for="dateDebut"><i class="fas fa-calendar-plus"></i> Date de début *</label>
                <input type="datetime-local" id="dateDebut" name="dateDebut" required
                       value="${formatDateForInput(activity.dateDebut)}">
            </div>
            
            <div class="form-group">
                <label for="dateFin"><i class="fas fa-calendar-minus"></i> Date de fin</label>
                <input type="datetime-local" id="dateFin" name="dateFin"
                       value="${formatDateForInput(activity.dateFin)}">
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label for="lieu"><i class="fas fa-map-marker-alt"></i> Lieu *</label>
                <input type="text" id="lieu" name="lieu" required 
                       value="${activity.lieu.replace(/"/g, '&quot;')}">
            </div>
            
            <div class="form-group">
                <label for="placesMax"><i class="fas fa-users"></i> Nombre de places max</label>
                <input type="number" id="placesMax" name="placesMax" 
                       min="1" max="1000" value="${activity.placesMax}">
            </div>
        </div>
        
        <div class="form-group">
            <label for="statut"><i class="fas fa-info-circle"></i> Statut</label>
            <select id="statut" name="statut">
                <option value="Planifiee" ${activity.statut === 'Planifiee' ? 'selected' : ''}>Planifiée</option>
                <option value="En_cours" ${activity.statut === 'En_cours' ? 'selected' : ''}>En cours</option>
                <option value="Terminee" ${activity.statut === 'Terminee' ? 'selected' : ''}>Terminée</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="categorie_id"><i class="fas fa-tag"></i> Catégorie</label>
            <select id="categorie_id" name="categorie_id">
                <option value="">Sélectionnez une catégorie</option>
                ${window.categories ? window.categories.map(cat => `
                    <option value="${cat.id}" ${activity.categorie_id == cat.id ? 'selected' : ''}>
                        ${cat.nom}
                    </option>
                `).join('') : ''}
            </select>
        </div>
        
        <div class="form-actions">
            <a href="details.html?id=${activity.id}" class="btn btn-secondary">
                <i class="fas fa-times"></i> Annuler
            </a>
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-check"></i> Enregistrer les modifications
            </button>
        </div>
        
        <div class="form-info">
            <p><i class="fas fa-info-circle"></i> Vous ne pouvez pas modifier les places restantes directement.</p>
            <p>Les places restantes sont automatiquement calculées en fonction des inscriptions.</p>
        </div>
    `;
}

// Configurer le formulaire de modification
function setupEditForm(activityId, originalActivity) {
    const form = document.getElementById('edit-form');
    if (!form) return;
    
    // Définir la date min à aujourd'hui
    const now = new Date();
    const today = now.toISOString().slice(0, 16);
    document.getElementById('dateDebut').min = today;
    document.getElementById('dateFin').min = today;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Récupérer les données du formulaire
        const formData = {
            titre: document.getElementById('titre').value,
            description: document.getElementById('description').value,
            dateDebut: document.getElementById('dateDebut').value,
            dateFin: document.getElementById('dateFin').value || null,
            lieu: document.getElementById('lieu').value,
            placesMax: parseInt(document.getElementById('placesMax').value) || 20,
            statut: document.getElementById('statut').value,
            categorie_id: document.getElementById('categorie_id').value || null
        };
        
        // Valider les dates
        if (formData.dateFin && new Date(formData.dateFin) <= new Date(formData.dateDebut)) {
            auth.showMessage('La date de fin doit être après la date de début', true );
            return;
        }
        
        // Vérifier si des modifications ont été apportées
        const hasChanges = Object.keys(formData).some(key => {
            if (key === 'dateFin' && !formData[key] && !originalActivity[key]) return false;
            return formData[key] !== originalActivity[key];
        });
        
        if (!hasChanges) {
            auth.showMessage('Aucune modification détectée', true);
            return;
        }
        
        // Envoyer la requête
        await updateActivity(activityId, formData);
    });
}

// Mettre à jour l'activité
async function updateActivity(activityId, activityData) {
    const submitBtn = document.querySelector('#edit-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Afficher l'indicateur de chargement
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Modification en cours...';
        
        const response = await fetch(`${window.API_BASE_URL_ACTIVITES}/${activityId}`, {
            method: 'PUT',
            headers: auth.getAuthHeaders(),
            body: JSON.stringify(activityData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            auth.showMessage('Activité modifiée avec succès !', false);
            
            // Rediriger vers la page des détails après 2 secondes
            setTimeout(() => {
                window.location.href = `details?id=${activityId}`;
            }, 2000);
        } else {
            throw new Error(data.message || 'Erreur lors de la modification');
        }
    } catch (error) {
        auth.showMessage(`Erreur: ${error.message}`, true);
        console.error('Erreur modification:', error);
    } finally {
        // Réactiver le bouton
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}