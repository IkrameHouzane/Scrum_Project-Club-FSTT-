// ================================================
// FICHIER : script.js - VERSION COMPLÈTE
// Authentification + Gestion Activités
// ================================================

console.log('🚀 === DEBUT CHARGEMENT script.js ===');

// Vérifier que auth.js est bien chargé
if (!window.API_BASE_URL_MEMBRES || !window.API_BASE_URL_ACTIVITES) {
  console.error('❌ ERREUR: auth.js doit être chargé AVANT script.js !');
}

console.log('📡 API Membres:', window.API_BASE_URL_MEMBRES);
console.log('📡 API Activités:', window.API_BASE_URL_ACTIVITES);


let currentActivities = [];
let currentCategories = [];

// ================================================
// FONCTIONS UTILITAIRES
// ================================================

function showMessage(elementId, text, isError = false) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = text;
    el.className = 'message ' + (isError ? 'error' : 'success');
  }
}

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

// ================================================
// AUTHENTIFICATION - INSCRIPTION
// ================================================
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  console.log('📝 Formulaire inscription détecté');
  
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      nom: document.getElementById('nom')?.value.trim(),
      prenom: document.getElementById('prenom')?.value.trim(),
      email: document.getElementById('email')?.value.trim(),
      password: document.getElementById('password')?.value,
      telephone: document.getElementById('telephone')?.value.trim() || null,
      filiere: document.getElementById('filiere')?.value.trim() || null,
      anneeEtude: document.getElementById('anneeEtude')?.value || null
    };

    try {
      const response = await fetch(`${API_BASE_URL_MEMBRES}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('message', result.message || 'Inscription réussie ! Redirection...', false);
        setTimeout(() => window.location.href = 'login.html', 2000);
      } else {
        showMessage('message', result.message || 'Erreur inscription', true);
      }
    } catch (err) {
      console.error('Erreur:', err);
      showMessage('message', 'Erreur serveur', true);
    }
  });
}

// ================================================
// AUTHENTIFICATION - CONNEXION
// ================================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  console.log('🔑 Formulaire connexion détecté');
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      email: document.getElementById('email')?.value.trim(),
      password: document.getElementById('password')?.value
    };

    console.log('📤 Tentative de connexion pour:', data.email);

    try {
      const response = await fetch(`${API_BASE_URL_MEMBRES}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      console.log('📥 Réponse:', result);

      if (response.ok) {
        showMessage('message', result.message || 'Connexion réussie !', false);
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));

        console.log('✅ Token et user sauvegardés');

        // Redirection selon rôle
        const role = result.user.role;
        let redirectUrl = 'activite_page.html';
        
        if (role === 'ADMIN') {
          redirectUrl = 'dashboard_admin.html';
        } else if (role === 'MEMBRE_BUREAU') {
          redirectUrl = 'dashboard.html';
        }

        console.log('🔄 Redirection vers:', redirectUrl);
        setTimeout(() => window.location.href = redirectUrl, 1500);
      } else {
        showMessage('message', result.message || 'Erreur de connexion', true);
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
      showMessage('message', 'Erreur serveur - Vérifiez que le backend est démarré', true);
    }
  });

  // Toggle visibilité mot de passe
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const formGroup = btn.closest('.form-group');
      if (!formGroup) return;
      const input = formGroup.querySelector('input[type="password"], input[type="text"]');
      if (!input) return;
      const icon = btn.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon?.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        input.type = 'password';
        icon?.classList.replace('fa-eye-slash', 'fa-eye');
      }
    });
  });
}

// ================================================
// PROFIL UTILISATEUR
// ================================================
// ================================================
// PROFIL UTILISATEUR
// ================================================
const isProfilePage = window.location.pathname.includes('profile.html') || 
                      document.getElementById('profileInfo');

if (isProfilePage) {
  console.log('📄 Page profil détectée');
  
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('👤 Initialisation du profil...');

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Pas de token');
      window.location.href = 'login.html';
      return;
    }

    console.log('🔑 Token trouvé');

    // Mettre à jour l'interface utilisateur (boutons nav)
    updateUserInterface();

    try {
      const url = `${window.API_BASE_URL_MEMBRES}/profile`;
      console.log('📡 Appel API:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Statut HTTP:', response.status);

      if (response.status === 401) {
        console.error('❌ Token invalide - Redirection');
        localStorage.clear();
        window.location.href = 'login.html';
        return;
      }

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Données reçues:', data);

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors du chargement du profil');
      }

      const p = data.profile;
      console.log('👤 Profil utilisateur:', p);

      // ============================================
      // REMPLIR LES INFORMATIONS D'AFFICHAGE
      // ============================================
      const displayFields = {
        'nom': p.nom,
        'prenom': p.prenom,
        'email': p.email,
        'telephone': p.telephone,
        'filiere': p.filiere,
        'anneeEtude': p.anneeEtude,
        'role': p.role
      };

      console.log('📝 Remplissage des champs d\'affichage...');
      Object.entries(displayFields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
          element.textContent = value || '-';
          console.log(`  ✅ #${id} = "${value}"`);
        } else {
          console.error(`  ❌ Élément #${id} non trouvé dans le DOM`);
        }
      });

      // ============================================
      // REMPLIR LE FORMULAIRE D'ÉDITION
      // ============================================
      const editFields = {
        'editNom': p.nom,
        'editPrenom': p.prenom,
        'editTelephone': p.telephone,
        'editFiliere': p.filiere,
        'editAnneeEtude': p.anneeEtude
      };

      console.log('✏️ Remplissage du formulaire d\'édition...');
      Object.entries(editFields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
          element.value = value || '';
          console.log(`  ✅ #${id} = "${value}"`);
        } else {
          console.error(`  ❌ Élément #${id} non trouvé dans le DOM`);
        }
      });

      console.log('✅ Profil chargé avec succès !');

    } catch (error) {
      console.error('❌ Erreur chargement profil:', error);
      showMessage('message', `Erreur: ${error.message}`, true);
    }
  });

  // ============================================
  // GESTION DE LA MODIFICATION DU PROFIL
  // ============================================
  document.addEventListener('DOMContentLoaded', () => {
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
      console.log('📝 Formulaire d\'édition détecté');
      
      editProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('📝 Soumission du formulaire de modification');

        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = 'login.html';
          return;
        }

        const data = {
          nom: document.getElementById('editNom')?.value.trim(),
          prenom: document.getElementById('editPrenom')?.value.trim(),
          telephone: document.getElementById('editTelephone')?.value.trim(),
          filiere: document.getElementById('editFiliere')?.value.trim(),
          anneeEtude: document.getElementById('editAnneeEtude')?.value
        };

        console.log('📤 Données à envoyer:', data);

        try {
          const response = await fetch(`${window.API_BASE_URL_MEMBRES}/profile`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });

          const result = await response.json();
          console.log('📥 Réponse:', result);

          if (response.ok && result.success) {
            showMessage('message', result.message || 'Profil mis à jour avec succès !', false);
            
            // Mettre à jour le localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.nom = data.nom;
            user.prenom = data.prenom;
            localStorage.setItem('user', JSON.stringify(user));
            
            // Recharger la page après 1.5s
            setTimeout(() => window.location.reload(), 1500);
          } else {
            showMessage('message', result.message || 'Erreur lors de la mise à jour', true);
          }
        } catch (error) {
          console.error('❌ Erreur:', error);
          showMessage('message', 'Erreur serveur lors de la mise à jour', true);
        }
      });
    }
  });
}
// ================================================
// GESTION DES ACTIVITÉS
// ================================================

async function loadCategoriesUnified() {
  console.log('🔄 Chargement des catégories...');
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ Pas de token disponible');
      return [];
    }
    
    const response = await fetch(`${window.API_BASE_URL_ACTIVITES}/categories`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data && Array.isArray(data.data)) {
      console.log(`✅ ${data.data.length} catégories chargées`);
      return data.data;
    } else {
      console.warn('⚠️ Format de réponse inattendu');
      return [];
    }
  } catch (error) {
    console.error('❌ Erreur chargement catégories:', error);
    return [];
  }
}

async function populateCategorySelect(selectId, includeDefault = true) {
  console.log(`🔄 Remplissage du select: ${selectId}`);
  
  const select = document.getElementById(selectId);
  if (!select) {
    console.error(`❌ Select ${selectId} non trouvé!`);
    return;
  }
  
  try {
    const categories = await loadCategoriesUnified();
    
    while (select.options.length > (includeDefault ? 1 : 0)) {
      select.remove(select.options.length - 1);
    }
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.nom;
      select.appendChild(option);
    });
    
    console.log(`✅ Select ${selectId} rempli avec ${categories.length} catégories`);
    
  } catch (error) {
    console.error(`❌ Erreur remplissage select ${selectId}:`, error);
  }
}

function updateUserInterface() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRoleEl = document.getElementById('user-role');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const createLink = document.getElementById('create-link');
  const profileLink = document.getElementById('profile-link'); // Ajouté
  const mesInscriptionsLink = document.getElementById('mes-inscriptions-link');
  
  if (user && user.id) {
    if (userRoleEl) {
      userRoleEl.textContent = `${user.prenom || user.nom} (${user.role})`;
    }
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    
    // Afficher le lien profil si l'utilisateur est connecté
    if (profileLink) {
      profileLink.style.display = 'inline-block';
    }

    // Afficher "Mes inscriptions" si l'utilisateur est connecté
    if (mesInscriptionsLink) {
      mesInscriptionsLink.style.display = 'inline-block';
    }
    
    if (createLink) {
      const canCreate = user.role === 'ADMIN' || user.role === 'MEMBRE_BUREAU';
      createLink.style.display = canCreate ? 'inline-block' : 'none';
    }
    
    if (logoutBtn) {
      logoutBtn.onclick = function() {
        localStorage.clear();
        window.location.href = 'login.html';
      };
    }
  } else {
    if (userRoleEl) userRoleEl.textContent = 'Non connecté';
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (createLink) createLink.style.display = 'none';
    if (profileLink) profileLink.style.display = 'none'; // Cacher le lien profil
    if (mesInscriptionsLink) mesInscriptionsLink.style.display = 'none';
  }
}

async function loadActivities() {
  console.log('🔄 === loadActivities() appelée ===');

  const container = document.getElementById('activities-container');
  if (!container) {
    console.error('❌ activities-container non trouvé!');
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    container.innerHTML = `
      <div class="error-state">
        <h3>Non connecté</h3>
        <p>Veuillez vous connecter pour voir les activités.</p>
        <button onclick="window.location.href='login.html'" class="btn btn-primary">
          Se connecter
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement des activités...</div>';

  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const search = document.getElementById('search-input')?.value || '';
    const categoryId = document.getElementById('category-filter')?.value || '';
    const statusFilter = document.getElementById('status-filter')?.value || '';

    let url = API_BASE_URL_ACTIVITES;
    const isGestionPage = window.location.pathname.includes('gestion_activite.html');

    console.log('📌 Page gestion:', isGestionPage);
    console.log('👤 Utilisateur ID:', user.id);

    const params = new URLSearchParams();

    if (search) params.append('search', search);
    if (categoryId) params.append('categorie_id', categoryId);
    if (statusFilter) params.append('statut', statusFilter);

    if (isGestionPage && user.id) {
      params.append('organisateur_id', user.id);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log('📡 URL finale:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Status:', response.status);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 Données:', data);

    if (data.success && Array.isArray(data.data)) {
      currentActivities = data.data;
      console.log(`✅ ${data.data.length} activités chargées`);
      
      displayActivities(data.data);

      if (data.data.length === 0) {
        const emptyMessage = isGestionPage
          ? 'Vous n\'avez créé aucune activité pour le moment.'
          : 'Il n\'y a pas d\'activités disponibles pour le moment.';

        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-calendar-times"></i>
            <h3>Aucune activité trouvée</h3>
            <p>${emptyMessage}</p>
            ${isGestionPage ? '<a href="create.html" class="btn btn-primary"><i class="fas fa-plus"></i> Créer votre première activité</a>' : ''}
          </div>
        `;
      }
    } else {
      console.error('❌ Format de réponse inattendu:', data);
      throw new Error('Format de réponse inattendu');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    container.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erreur de chargement</h3>
        <p>${error.message}</p>
        <button onclick="loadActivities()" class="btn btn-secondary">
          <i class="fas fa-redo"></i> Réessayer
        </button>
      </div>
    `;
  }
}

function displayActivities(activities) {
  const container = document.getElementById('activities-container');
  if (!container) return;
  
  console.log('🎨 Affichage de', activities.length, 'activités');
  
  container.innerHTML = '';
  
  if (activities.length === 0) {
    return;
  }
  
  activities.forEach(activity => {
    const activityCard = createActivityCard(activity);
    container.appendChild(activityCard);
  });
}

function createActivityCard(activity) {
  const card = document.createElement('div');
  card.className = 'activity-card';
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const dateDebut = new Date(activity.dateDebut).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const dateFin = activity.dateFin 
    ? new Date(activity.dateFin).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
    : '';
  
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
  
  const canManage = user.role === 'ADMIN' || user.role === 'MEMBRE_BUREAU';
  const canCancel = (user.role === 'ADMIN' || user.role === 'MEMBRE_BUREAU') || 
                    (user.id === activity.organisateur_id);
  
  // RÉPARATION : Ne pas essayer de deviner le nombre de participants
  // On ne connaît pas encore le vrai nombre ici, donc on passe null
  // Le vrai nombre sera récupéré dans showCancelModal()
  
  card.innerHTML = `
    <div class="activity-header">
      <div class="activity-title">
        <h3>${activity.titre || 'Sans titre'}</h3>
        ${statusBadge}
      </div>
      <div class="category-badge">
        <i class="fas fa-tag"></i> ${activity.categorie_nom || 'Non catégorisé'}
      </div>
    </div>
    
    <div class="activity-info">
      <div class="info-row">
        <i class="far fa-calendar-alt"></i>
        <strong>Date :</strong> ${dateDebut}
        ${dateFin ? ` - ${dateFin}` : ''}
      </div>
      
      <div class="info-row">
        <i class="fas fa-map-marker-alt"></i>
        <strong>Lieu :</strong> ${activity.lieu || 'Non spécifié'}
      </div>
      
      ${activity.description ? `
        <div class="info-row">
          <i class="fas fa-info-circle"></i>
          <span>${activity.description.substring(0, 100)}${activity.description.length > 100 ? '...' : ''}</span>
        </div>
      ` : ''}
      
      ${activity.organisateur_nom ? `
        <div class="organisateur">
          <i class="fas fa-user-tie"></i>
          <strong>Organisateur :</strong> ${activity.organisateur_nom}
          ${activity.organisateur_poste ? ` (${activity.organisateur_poste})` : ''}
        </div>
      ` : ''}
    </div>
    
    <div class="activity-footer">
      <div class="places-info">
        <i class="fas fa-users"></i>
        Places : 
        <span class="places-count">${activity.placesRestantes || 0}</span> / ${activity.placesMax || 0}
      </div>
      
      <div class="action-buttons">
        ${activity.statut !== 'Annulee' && (activity.placesRestantes || 0) > 0 ? `
          <button onclick="showInscriptionModal(${activity.id})" class="btn btn-small btn-success">
            <i class="fas fa-user-plus"></i> S'inscrire
          </button>
        ` : ''}

        <a href="details?id=${activity.id}" class="btn btn-small btn-secondary">
          <i class="fas fa-eye"></i> Détails
        </a>

        ${canManage && activity.organisateur_id === user.id ? `
          <a href="edit.html?id=${activity.id}" class="btn btn-small btn-primary">
            <i class="fas fa-edit"></i> Modifier
          </a>
        ` : ''}

    ${canCancel && activity.statut !== 'Annulee' ? `
      <button onclick="showCancelModal(${activity.id}, '${activity.titre?.replace(/'/g, "\\'") || ''}')"
              class="btn btn-small btn-danger">
        <i class="fas fa-ban"></i> Annuler
      </button>
    ` : ''}
      </div>
    </div>
  `;
  
  return card;
}

function setupEventListeners() {
  console.log('⚙️ Configuration des événements...');
  
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        console.log('🔍 Recherche:', this.value);
        loadActivities();
      }, 500);
    });
  }
  
  const categoryFilter = document.getElementById('category-filter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      console.log('🏷️ Filtre catégorie:', categoryFilter.value);
      loadActivities();
    });
  }

  const statusFilter = document.getElementById('status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      console.log('📊 Filtre statut:', statusFilter.value);
      loadActivities();
    });
  }
  
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      console.log('🔄 Actualisation');
      loadActivities();
    });
  }
  
  const modal = document.getElementById('cancel-modal');
  if (modal) {
    const closeBtns = modal.querySelectorAll('.close-modal');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  // Configuration du modal d'inscription
  const inscriptionModal = document.getElementById('inscription-modal');
  if (inscriptionModal) {
    const closeBtns = inscriptionModal.querySelectorAll('.close-modal-inscription');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        inscriptionModal.style.display = 'none';
      });
    });
    
    inscriptionModal.addEventListener('click', (e) => {
      if (e.target === inscriptionModal) {
        inscriptionModal.style.display = 'none';
      }
    });

    // Bouton de confirmation d'inscription
    const confirmBtn = document.getElementById('confirm-inscription-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        const activityId = confirmBtn.dataset.activityId;
        if (activityId) {
          await confirmerInscriptionDepuisModal(activityId);
        }
      });
    }
  }
}

// Ouvre le modal avec le vrai nombre de participants (récupéré via API)
async function showCancelModal(activityId, activityTitle) {
  console.log('🚫 Ouverture modal annulation - ID:', activityId);

  const modal = document.getElementById('cancel-modal');
  const message = document.getElementById('cancel-message');
  const countSpan = document.getElementById('participants-count');
  const confirmBtn = document.getElementById('cancel-confirm-btn');

  if (!modal || !message || !countSpan || !confirmBtn) {
    console.error('❌ Modal ou éléments manquants');
    return;
  }

  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';

  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Pas de token');

    // Appel API GET pour récupérer l'activité avec participantsCount
    const response = await fetch(`${API_BASE_URL_ACTIVITES}/${activityId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('GET /activites/' + activityId + ' → Statut:', response.status);

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('Réponse complète GET:', result);  // ← Debug important !

    if (!result.success || !result.data) {
      throw new Error('Activité non trouvée');
    }

    const activite = result.data;

    // Le champ ajouté dans le backend doit apparaître ici !
    const participantsCount = Number(activite.participantsCount) || 0;

    console.log('Nombre réel récupéré :', participantsCount);

    // Affichage avec le VRAI nombre
    message.innerHTML = `
      Êtes-vous sûr de vouloir annuler l'activité <strong>"${activityTitle}"</strong> ?<br><br>
      <span style="color:#d32f2f; font-weight:bold;">Cette action est irréversible !</span><br><br>
      ${participantsCount > 0 
        ? `Un email sera envoyé à <strong>${participantsCount} participant(s) inscrit(s)</strong>.` 
        : `Aucun participant inscrit pour le moment.`}
    `;

    countSpan.textContent = participantsCount;

    confirmBtn.disabled = false;
    confirmBtn.innerHTML = '<i class="fas fa-ban"></i> Oui, annuler l\'activité';

    confirmBtn.onclick = async () => {
      await cancelActivity(activityId);
    };

    modal.style.display = 'flex';

  } catch (error) {
    console.error('Erreur chargement détails:', error);
    message.innerHTML = `Erreur : ${error.message}<br>Réessayez.`;
    countSpan.textContent = '?';
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = '<i class="fas fa-ban"></i> Réessayer';
    modal.style.display = 'flex';
  }
}

// Annulation avec feedback détaillé
async function cancelActivity(activityId, knownParticipantsCount = 0) {
  const token = localStorage.getItem('token');
  if (!token) {
    showNotification('Session expirée. Veuillez vous reconnecter.', true);
    return;
  }

  const modal = document.getElementById('cancel-modal');
  const confirmBtn = document.getElementById('cancel-confirm-btn');

  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Annulation...';

  try {
    const response = await fetch(`${API_BASE_URL_ACTIVITES}/${activityId}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ confirm: true })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || `Erreur ${response.status}`);
    }

    // Succès !
    let successMsg = 'Activité annulée avec succès !';

    if (data.participantsCount !== undefined) {
      successMsg += `\n${data.emailsEnvoyes || 0} email(s) envoyé(s) sur ${data.participantsCount} participant(s).`;
    } else if (knownParticipantsCount > 0) {
      successMsg += `\nNotification envoyée à ${knownParticipantsCount} participant(s).`;
    }

    showNotification(successMsg, false);

    // Fermeture modal + refresh liste
    if (modal) modal.style.display = 'none';
    setTimeout(() => loadActivities(), 800);

  } catch (error) {
    console.error('❌ Échec annulation:', error);
    let errMsg = error.message;

    if (errMsg.includes('permission')) {
      errMsg = "Vous n'avez pas le droit d'annuler cette activité.";
    } else if (errMsg.includes('non trouvée')) {
      errMsg = "L'activité n'existe plus ou a déjà été supprimée.";
    }

    showNotification(`Échec : ${errMsg}`, true);
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fas fa-ban"></i> Oui, annuler l\'activité';
    }
  }
}

async function cancelActivity(activityId) {
  try {
    console.log('🚫 Annulation activité ID:', activityId);
    
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Veuillez vous reconnecter', true);
      return;
    }
    
    const modal = document.getElementById('cancel-modal');
    const confirmBtn = document.getElementById('cancel-confirm-btn');
    
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Annulation et envoi d\'emails...';
    }
    
    // ✅ URL CORRECTE avec /cancel
    const response = await fetch(`${API_BASE_URL_ACTIVITES}/${activityId}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        confirm: true,
        sendEmails: true  // Indiquer qu'on veut envoyer des emails
      })
    });
    
    console.log('📥 Réponse HTTP:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('📦 Données réponse:', data);
    
    if (response.ok && data.success) {
      // Message détaillé
      let message = '✅ ' + (data.message || 'Activité annulée avec succès');
      
      if (data.participantsCount > 0) {
        message += `\n📧 ${data.emailsEnvoyes || 0}/${data.participantsCount} email(s) envoyé(s) aux participants`;
      } else {
        message += '\n👤 Aucun participant à notifier';
      }
      
      showNotification(message, false);
      
      // Afficher un message dans la console pour le débogage
      if (data.participants && data.participants.length > 0) {
        console.log('👥 Participants notifiés:', data.participants.map(p => ({
          nom: p.nom,
          prenom: p.prenom,
          email: p.email
        })));
      }
      
      // Fermer la modal
      if (modal) {
        modal.style.display = 'none';
      }
      
      // Recharger les activités après un délai
      setTimeout(() => {
        loadActivities();
      }, 1000);
      
    } else {
      // Gestion des erreurs spécifiques
      if (response.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      } else if (response.status === 403) {
        throw new Error('Vous n\'avez pas la permission d\'annuler cette activité.');
      } else if (response.status === 404) {
        throw new Error('Activité non trouvée.');
      } else {
        throw new Error(data.message || `Erreur ${response.status}: ${response.statusText}`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur annulation:', error);
    
    // Message d'erreur convivial
    let errorMessage = error.message;
    
    if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
      errorMessage = 'Erreur de connexion au serveur. Vérifiez votre internet et que le serveur est démarré.';
    }
    
    showNotification(`❌ ${errorMessage}`, true);
    
    // Si session expirée, rediriger vers login
    if (error.message.includes('Session expirée') || error.message.includes('401')) {
      localStorage.clear();
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    }
  } finally {
    const confirmBtn = document.getElementById('cancel-confirm-btn');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fas fa-ban"></i> Oui, annuler l\'activité';
    }
  }
}

// ================================================
// INITIALISATION
// ================================================

const isActivitiesPage = window.location.pathname.includes('activite_page.html') || 
                         window.location.pathname.includes('gestion_activite.html') ||
                         document.getElementById('activities-container');

if (isActivitiesPage) {
  console.log('📋 Page activités détectée');
  
  document.addEventListener('DOMContentLoaded', async function() {
    console.log('✅ DOM chargé');
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ Non authentifié');
      window.location.href = 'login.html';
      return;
    }
    
    updateUserInterface();
    
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      await populateCategorySelect('category-filter');
    }
    
    await loadActivities();
    setupEventListeners();
    
    console.log('✅ Initialisation terminée');
  });
}


// ================================================
// PAGE CRÉATION D'ACTIVITÉ
// ================================================
const isCreatePage = window.location.pathname.includes('create.html') || 
                     document.getElementById('create-form');

if (isCreatePage) {
  console.log('➕ Page création d\'activité détectée');
  
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ Initialisation page création');
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Non authentifié');
      window.location.href = 'login.html';
      return;
    }
    
    // Vérifier les permissions
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.role || !['ADMIN', 'MEMBRE_BUREAU'].includes(user.role)) {
      alert('Vous n\'avez pas les permissions pour créer une activité');
      window.location.href = 'activite_page.html';
      return;
    }
    
    // Mettre à jour l'interface
    updateUserInterface();
    
    // Charger les catégories dans le select
    await populateCategorySelect('categorie_id', false);
    
    // Gérer la soumission du formulaire
    const createForm = document.getElementById('create-form');
    if (createForm) {
      console.log('📝 Formulaire création détecté');
      
      createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('📤 Soumission du formulaire de création');
        
        const formData = {
          titre: document.getElementById('titre')?.value.trim(),
          description: document.getElementById('description')?.value.trim() || null,
          dateDebut: document.getElementById('dateDebut')?.value,
          dateFin: document.getElementById('dateFin')?.value || null,
          lieu: document.getElementById('lieu')?.value.trim(),
          placesMax: parseInt(document.getElementById('placesMax')?.value) || 20,
          categorie_id: document.getElementById('categorie_id')?.value || null
        };
        
        console.log('📦 Données à envoyer:', formData);
        
        // Validation
        if (!formData.titre) {
          showNotification('Le titre est obligatoire', true);
          return;
        }
        
        if (!formData.dateDebut) {
          showNotification('La date de début est obligatoire', true);
          return;
        }
        
        if (!formData.lieu) {
          showNotification('Le lieu est obligatoire', true);
          return;
        }
        
        // Vérifier que la date de début est dans le futur
        const dateDebut = new Date(formData.dateDebut);
        const now = new Date();
        if (dateDebut < now) {
          showNotification('La date de début doit être dans le futur', true);
          return;
        }
        
        // Vérifier que la date de fin est après la date de début
        if (formData.dateFin) {
          const dateFin = new Date(formData.dateFin);
          if (dateFin < dateDebut) {
            showNotification('La date de fin doit être après la date de début', true);
            return;
          }
        }
        
        try {
          // Désactiver le bouton de soumission
          const submitBtn = createForm.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création en cours...';
          }
          
          const response = await fetch(`${window.API_BASE_URL_ACTIVITES}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
          });
          
          const result = await response.json();
          console.log('📥 Réponse:', result);
          
          if (response.ok && result.success) {
            showNotification('Activité créée avec succès !', false);
            
            // Rediriger vers la page de gestion après 1.5s
            setTimeout(() => {
              window.location.href = 'gestion_activite.html';
            }, 1500);
          } else {
            showNotification(result.message || 'Erreur lors de la création', true);
            
            // Réactiver le bouton
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '<i class="fas fa-check"></i> Créer l\'activité';
            }
          }
        } catch (error) {
          console.error('❌ Erreur:', error);
          showNotification('Erreur serveur lors de la création', true);
          
          // Réactiver le bouton
          const submitBtn = createForm.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Créer l\'activité';
          }
        }
      });
    }
    
    console.log('✅ Page création initialisée');
  });
}
// ================================================
// PAGE ADMIN - LISTE DES MEMBRES (détection robuste)
// ================================================

// Détection fiable : on regarde si le tableau existe sur la page
const isMembersPage = document.getElementById('membresTable') !== null;

if (isMembersPage) {
  console.log('👑 Page gestion membres détectée');

  // PROTECTION IMMÉDIATE : on vérifie le token dès le chargement
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ Pas de token sur page membres → redirection login');
    window.location.href = 'login.html';
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role !== 'ADMIN') {
    alert('Accès réservé aux administrateurs uniquement');
    window.location.href = 'activite_page.html';
  }

  // Si tout est OK, on continue
  console.log('Admin + token OK → chargement membres...');

  // Exécution du chargement
  (async () => {
    await loadMembersList();
  })();

  // Bouton export avec token
 // Bouton export - VERSION QUI MARCHE (envoie le token dans les headers)
document.getElementById('exportExcelBtn')?.addEventListener('click', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Veuillez vous reconnecter pour exporter');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/membres/export`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`   // ← TOKEN ENVOYÉ ICI !
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert('Session expirée ou accès refusé. Veuillez vous reconnecter.');
        localStorage.clear();
        window.location.href = 'login.html';
        return;
      }
      throw new Error('Erreur lors de l\'export');
    }

    // Téléchargement du fichier Excel
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Liste_Membres_Club_FSTT.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    console.log('Export téléchargé avec succès !');
  } catch (err) {
    console.error('Échec export:', err);
    alert('Impossible d\'exporter : ' + err.message);
  }
});
}

// Fonction de chargement (simplifiée)
async function loadMembersList() {
  const tbody = document.getElementById('membresBody');
  if (!tbody) {
    console.error('❌ #membresBody introuvable');
    return;
  }

  tbody.innerHTML = '<tr><td colspan="11">Chargement en cours...</td></tr>';

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Pas de token trouvé → redirection login');
      window.location.href = 'login.html';
      return;
    }

    const response = await fetch(`${API_BASE_URL_MEMBRES}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,  // ← ICI : on envoie le token !
        'Content-Type': 'application/json'
      }
    });

    console.log('GET /membres - Statut:', response.status);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert('Session expirée ou accès refusé. Veuillez vous reconnecter.');
        localStorage.clear();
        window.location.href = 'login.html';
        return;
      }
      throw new Error(`Erreur ${response.status}`);
    }

    const result = await response.json();
    console.log('Réponse API complète :', result);

    if (!result.success) {
      throw new Error(result.message || 'Erreur serveur');
    }

    tbody.innerHTML = '';

    // Attention : ta route renvoie result.membres (pas result.data)
    (result.membres || []).forEach(m => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${m.id}</td>
        <td>${m.prenom || ''} ${m.nom || ''}</td>
        <td>${m.email || '-'}</td>
        <td>${m.telephone || '-'}</td>
        <td>${m.filiere || '-'}</td>
        <td>${m.anneeEtude || '-'}</td>
        <td>${m.role || '-'}</td>
        <td>${m.poste || '-'}</td>
        <td>${m.estActif ? 'Oui' : 'Non'}</td>
        <td>${m.createdAt ? new Date(m.createdAt).toLocaleDateString('fr-FR') : '-'}</td>
        <td>
          <button class="btn btn-small btn-primary" onclick="openEditModal(${m.id}, '${m.nom.replace(/'/g, "\\'")}', '${m.prenom.replace(/'/g, "\\'")}', '${m.email.replace(/'/g, "\\'")}', '${m.telephone || ''}', '${m.filiere || ''}', '${m.anneeEtude || ''}', '${m.role}', '${m.poste || ''}', ${m.estActif})">
            <i class="fas fa-edit"></i> Modifier
          </button>
          <button class="btn btn-small btn-secondary" onclick="openRoleModal(${m.id}, '${m.nom.replace(/'/g, "\\'")}', '${m.prenom.replace(/'/g, "\\'")}', '${m.role}', '${m.poste || ''}')">
            <i class="fas fa-user-cog"></i> Rôle
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    if (result.membres.length === 0) {
      tbody.innerHTML = '<tr><td colspan="11">Aucun membre trouvé</td></tr>';
    }

  } catch (error) {
    console.error('Erreur chargement membres:', error);
    tbody.innerHTML = `<tr><td colspan="11" style="color:red">Erreur: ${error.message}</td></tr>`;
  }
}


// ================================================
// MODAL D'INSCRIPTION
// ================================================

// Afficher le modal d'inscription avec les détails de l'activité
async function showInscriptionModal(activityId) {
  console.log('📝 Ouverture modal d\'inscription - ID:', activityId);

  const modal = document.getElementById('inscription-modal');
  const modalBody = document.getElementById('inscription-modal-body');
  const confirmBtn = document.getElementById('confirm-inscription-btn');

  if (!modal || !modalBody || !confirmBtn) {
    console.error('❌ Modal ou éléments manquants');
    return;
  }

  // Désactiver le bouton pendant le chargement
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
  modalBody.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement des détails...</div>';

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Non authentifié');
    }

    // Récupérer les détails complets de l'activité
    const response = await fetch(`${API_BASE_URL_ACTIVITES}/${activityId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('Réponse activité:', result);

    if (!result.success || !result.data) {
      throw new Error('Activité non trouvée');
    }

    const activity = result.data;

    // Vérifier que l'activité est disponible
    if (activity.statut === 'Annulee' || activity.statut === 'Terminee') {
      modalBody.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Cette activité n'est plus disponible pour les inscriptions.</p>
        </div>
      `;
      confirmBtn.style.display = 'none';
      modal.style.display = 'flex';
      return;
    }

    if (activity.placesRestantes <= 0) {
      modalBody.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Cette activité est complète. Aucune place disponible.</p>
        </div>
      `;
      confirmBtn.style.display = 'none';
      modal.style.display = 'flex';
      return;
    }

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
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '';

    // Afficher les détails de l'activité
    modalBody.innerHTML = `
      <div class="inscription-activity-details">
        <div class="detail-row">
          <span class="detail-label"><i class="far fa-calendar-alt"></i> Date de début</span>
          <span class="detail-value">${dateDebut}</span>
        </div>
        
        ${dateFin ? `
        <div class="detail-row">
          <span class="detail-label"><i class="far fa-clock"></i> Date de fin</span>
          <span class="detail-value">${dateFin}</span>
        </div>
        ` : ''}
        
        <div class="detail-row">
          <span class="detail-label"><i class="fas fa-map-marker-alt"></i> Lieu</span>
          <span class="detail-value">${activity.lieu || 'Non spécifié'}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label"><i class="fas fa-users"></i> Places disponibles</span>
          <span class="detail-value ${activity.placesRestantes < 5 ? 'places-warning' : ''}">
            ${activity.placesRestantes} / ${activity.placesMax}
          </span>
        </div>
        
        ${activity.description ? `
        <div class="detail-row description-row">
          <span class="detail-label"><i class="fas fa-align-left"></i> Description</span>
          <div class="detail-description">${activity.description.replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}
        
        ${activity.organisateur_nom ? `
        <div class="detail-row">
          <span class="detail-label"><i class="fas fa-user-tie"></i> Organisateur</span>
          <span class="detail-value">${activity.organisateur_nom}</span>
        </div>
        ` : ''}
        
        <div class="info-message" style="margin-top: 20px; padding: 15px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #27ae60;">
          <i class="fas fa-info-circle"></i>
          <p style="margin: 0; color: #2e7d32;">Vous êtes sur le point de vous inscrire à cette activité.</p>
        </div>
      </div>
    `;

    // Réactiver le bouton et stocker l'ID de l'activité
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirmer l\'inscription';
    confirmBtn.dataset.activityId = activityId;
    confirmBtn.style.display = 'inline-block';

    // Afficher le modal
    modal.style.display = 'flex';

  } catch (error) {
    console.error('Erreur chargement activité:', error);
    modalBody.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Erreur lors du chargement des détails de l'activité.</p>
        <p><small>${error.message}</small></p>
      </div>
    `;
    confirmBtn.style.display = 'none';
    modal.style.display = 'flex';
  }
}

// Confirmer l'inscription depuis le modal
async function confirmerInscriptionDepuisModal(activityId) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user || !user.id) {
    showNotification('Erreur: Utilisateur non connecté', true);
    return;
  }

  const confirmBtn = document.getElementById('confirm-inscription-btn');
  const modal = document.getElementById('inscription-modal');

  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription en cours...';
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/inscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        membre_id: user.id,
        activite_id: activityId
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showNotification('✅ Inscription réussie !', false);
      
      // Fermer le modal
      if (modal) {
        modal.style.display = 'none';
      }
      
      // Recharger les activités pour mettre à jour les places disponibles
      setTimeout(() => {
        loadActivities();
      }, 500);
    } else {
      showNotification(`❌ ${data.error || data.message || 'Erreur lors de l\'inscription'}`, true);
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirmer l\'inscription';
      }
    }
  } catch (error) {
    console.error('Erreur inscription:', error);
    showNotification(`❌ Erreur: ${error.message}`, true);
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirmer l\'inscription';
    }
  }
}

// ================================================
// FONCTIONS POUR LA GESTION DES MEMBRES (ADMIN)
// ================================================

// Ouvrir le modal d'édition d'un membre
function openEditModal(id, nom, prenom, email, telephone, filiere, anneeEtude, role, poste, estActif) {
  console.log('📝 Ouverture modal édition - ID:', id);

  // Remplir le formulaire
  document.getElementById('editNom').value = nom || '';
  document.getElementById('editPrenom').value = prenom || '';
  document.getElementById('editEmail').value = email || '';
  document.getElementById('editTelephone').value = telephone || '';
  document.getElementById('editFiliere').value = filiere || '';
  document.getElementById('editAnneeEtude').value = anneeEtude || '';
  document.getElementById('editRole').value = role || 'MEMBRE';
  document.getElementById('editPoste').value = poste || '';
  document.getElementById('editEstActif').value = estActif ? '1' : '0';

  // Stocker l'ID du membre
  document.getElementById('editForm').dataset.memberId = id;

  // Afficher le modal
  document.getElementById('editModal').style.display = 'flex';
}

// Ouvrir le modal d'assignation de rôle
function openRoleModal(id, nom, prenom, role, poste) {
  console.log('👤 Ouverture modal rôle - ID:', id);

  // Afficher le nom du membre
  document.querySelector('#roleModal h3').textContent = `Assigner un rôle à ${prenom} ${nom}`;

  // Remplir le formulaire
  document.getElementById('roleSelect').value = role || 'MEMBRE';
  document.getElementById('posteSelect').value = poste || '';

  // Stocker l'ID du membre
  document.getElementById('roleForm').dataset.memberId = id;

  // Afficher le modal
  document.getElementById('roleModal').style.display = 'flex';
}

// Gestionnaire de soumission du formulaire d'édition
document.addEventListener('DOMContentLoaded', () => {
  const editForm = document.getElementById('editForm');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('📝 Soumission formulaire édition');

      const memberId = editForm.dataset.memberId;
      if (!memberId) {
        showNotification('Erreur: ID du membre manquant', true);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = 'login.html';
        return;
      }

      const data = {
        nom: document.getElementById('editNom').value.trim(),
        prenom: document.getElementById('editPrenom').value.trim(),
        email: document.getElementById('editEmail').value.trim(),
        telephone: document.getElementById('editTelephone').value.trim() || null,
        filiere: document.getElementById('editFiliere').value.trim() || null,
        anneeEtude: document.getElementById('editAnneeEtude').value || null,
        role: document.getElementById('editRole').value,
        poste: document.getElementById('editPoste').value || null,
        estActif: document.getElementById('editEstActif').value === '1'
      };

      console.log('📤 Données à envoyer:', data);

      try {
        const response = await fetch(`${API_BASE_URL_MEMBRES}/${memberId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log('📥 Réponse:', result);

        if (response.ok && result.success) {
          showNotification('Membre modifié avec succès !', false);

          // Fermer le modal
          document.getElementById('editModal').style.display = 'none';

          // Recharger la liste des membres
          setTimeout(() => loadMembersList(), 1000);
        } else {
          showNotification(result.message || 'Erreur lors de la modification', true);
        }
      } catch (error) {
        console.error('❌ Erreur:', error);
        showNotification('Erreur serveur lors de la modification', true);
      }
    });
  }

  // Gestionnaire de soumission du formulaire de rôle
  const roleForm = document.getElementById('roleForm');
  if (roleForm) {
    roleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('👤 Soumission formulaire rôle');

      const memberId = roleForm.dataset.memberId;
      if (!memberId) {
        showNotification('Erreur: ID du membre manquant', true);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = 'login.html';
        return;
      }

      const data = {
        role: document.getElementById('roleSelect').value,
        poste: document.getElementById('posteSelect').value || null
      };

      console.log('📤 Données à envoyer:', data);

      try {
        const response = await fetch(`${API_BASE_URL_MEMBRES}/${memberId}/role`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log('📥 Réponse:', result);

        if (response.ok && result.success) {
          showNotification('Rôle assigné avec succès !', false);

          // Fermer le modal
          document.getElementById('roleModal').style.display = 'none';

          // Recharger la liste des membres
          setTimeout(() => loadMembersList(), 1000);
        } else {
          showNotification(result.message || 'Erreur lors de l\'assignation du rôle', true);
        }
      } catch (error) {
        console.error('❌ Erreur:', error);
        showNotification('Erreur serveur lors de l\'assignation du rôle', true);
      }
    });
  }

  // Gestionnaire de fermeture des modals
  document.querySelectorAll('.modal .close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      closeBtn.closest('.modal').style.display = 'none';
    });
  });

  // Fermer les modals en cliquant en dehors
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
});

// ================================================
// EXPOSER LES FONCTIONS
// ================================================
window.loadActivities = loadActivities;
window.showCancelModal = showCancelModal;
window.cancelActivity = cancelActivity;
window.populateCategorySelect = populateCategorySelect;
window.updateUserInterface = updateUserInterface;
window.showInscriptionModal = showInscriptionModal;
window.openEditModal = openEditModal;
window.openRoleModal = openRoleModal;

console.log('✅ === script.js CHARGE AVEC SUCCES ===');

