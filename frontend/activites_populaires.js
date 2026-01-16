// ================================================
// ACTIVITES_POPULAIRES.JS
// ================================================

console.log('✅ activites_populaires.js chargé');

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

function updateNavbarUserUI() {
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

async function loadActivitesPopulaires(limit = 10) {
  const rankingList = document.getElementById('ranking-list');

  if (!rankingList) {
    console.error('❌ Conteneur non trouvé');
    return;
  }

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Vérifier que l'utilisateur est ADMIN
  if (!token || user.role !== 'ADMIN') {
    console.error('❌ Accès non autorisé');
    showNotification('Accès réservé aux administrateurs', true);
    setTimeout(() => (window.location.href = 'dashboard_admin.html'), 2000);
    return;
  }

  console.log('🔄 Chargement des activités populaires (top', limit, ')...');
  rankingList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';

  try {
    const url = `${API_BASE_URL}/stats/activites-populaires?limit=${limit}`;
    console.log('📡 Appel API:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Réponse HTTP:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 Activités populaires reçues:', data);

    if (!data.success) {
      throw new Error(data.message || 'Erreur lors du chargement');
    }

    displayRanking(data.data);

  } catch (error) {
    console.error('❌ Erreur chargement:', error);
    rankingList.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erreur de chargement</h3>
        <p>${error.message}</p>
        <button onclick="loadActivitesPopulaires(${limit})" class="btn btn-secondary" style="margin-top: 15px;">
          <i class="fas fa-redo"></i> Réessayer
        </button>
      </div>
    `;
  }
}

function displayRanking(activites) {
  console.log('🏆 Affichage du classement:', activites.length, 'activités');

  const rankingList = document.getElementById('ranking-list');

  if (activites.length === 0) {
    rankingList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-trophy"></i>
        <h3>Aucune activité disponible</h3>
        <p>Le classement sera disponible dès que des inscriptions seront enregistrées.</p>
      </div>
    `;
    return;
  }

  rankingList.innerHTML = activites.map((activite, index) => {
    const rank = index + 1;
    
    // Badge de rang
    let rankClass = '';
    let rankBadgeClass = '';
    if (rank === 1) {
      rankClass = 'rank-1';
      rankBadgeClass = 'gold';
    } else if (rank === 2) {
      rankClass = 'rank-2';
      rankBadgeClass = 'silver';
    } else if (rank === 3) {
      rankClass = 'rank-3';
      rankBadgeClass = 'bronze';
    }

    // Badge de statut
    let statusBadge = '';
    if (activite.statut === 'Planifiee') {
      statusBadge = '<span class="badge-status badge-planifiee">Planifiée</span>';
    } else if (activite.statut === 'En_cours') {
      statusBadge = '<span class="badge-status badge-en-cours">En cours</span>';
    } else if (activite.statut === 'Terminee') {
      statusBadge = '<span class="badge-status badge-terminee">Terminée</span>';
    }

    // Formatage de la date
    const dateDebut = new Date(activite.dateDebut).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    return `
      <li class="ranking-item ${rankClass}">
        <div class="rank-badge ${rankBadgeClass}">
          ${rank <= 3 ? '<i class="fas fa-trophy"></i>' : rank}
        </div>

        <div class="activity-info">
          <div class="activity-title">${activite.titre}</div>
          <div class="activity-meta">
            <span><i class="fas fa-calendar"></i> ${dateDebut}</span>
            <span><i class="fas fa-map-marker-alt"></i> ${activite.lieu}</span>
            <span><i class="fas fa-tag"></i> ${activite.categorie_nom || 'Non catégorisé'}</span>
            ${statusBadge}
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${activite.tauxRemplissage}%"></div>
          </div>
        </div>

        <div class="stat-box">
          <div class="stat-value">${activite.nombreInscriptions}</div>
          <div class="stat-label">Inscrits</div>
        </div>

        <div class="stat-box">
          <div class="stat-value">${activite.placesMax}</div>
          <div class="stat-label">Places</div>
        </div>

        <div class="stat-box">
          <div class="stat-value">${activite.tauxRemplissage}%</div>
          <div class="stat-label">Taux</div>
        </div>
      </li>
    `;
  }).join('');

  console.log('✅ Classement affiché avec succès');
}

// Initialisation
async function initPopulairesPage() {
  console.log('✅ activites_populaires.js - Initialisation');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || user.role !== 'ADMIN') {
    console.log('❌ Non admin - Redirection');
    showNotification('Accès réservé aux administrateurs', true);
    setTimeout(() => {
      window.location.href = 'dashboard_admin.html';
    }, 1500);
    return;
  }

  updateNavbarUserUI();

  // Bouton actualiser
  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    const limit = parseInt(document.getElementById('limit-select').value);
    loadActivitesPopulaires(limit);
  });

  // Changement de limite
  document.getElementById('limit-select')?.addEventListener('change', (e) => {
    const limit = parseInt(e.target.value);
    loadActivitesPopulaires(limit);
  });

  await loadActivitesPopulaires(10);
}

initPopulairesPage().catch(err => {
  console.error('❌ Erreur init:', err);
});