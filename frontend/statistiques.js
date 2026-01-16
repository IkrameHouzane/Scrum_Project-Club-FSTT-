// ================================================
// STATISTIQUES.JS - Affichage des stats admin
// ================================================

console.log('✅ statistiques.js chargé');

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

async function loadStatistics() {
  const statsCards = document.getElementById('stats-cards');
  const chartsContainer = document.getElementById('charts-container');

  if (!statsCards || !chartsContainer) {
    console.error('❌ Conteneurs non trouvés');
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

  console.log('🔄 Chargement des statistiques...');
  statsCards.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';
  chartsContainer.innerHTML = '';

  try {
    const url = `${API_BASE_URL}/stats/global`;
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
    console.log('📦 Statistiques reçues:', data);

    if (!data.success) {
      throw new Error(data.message || 'Erreur lors du chargement');
    }

    displayStatistics(data.data);

  } catch (error) {
    console.error('❌ Erreur chargement stats:', error);
    statsCards.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erreur de chargement</h3>
        <p>${error.message}</p>
        <button onclick="loadStatistics()" class="btn btn-secondary" style="margin-top: 15px;">
          <i class="fas fa-redo"></i> Réessayer
        </button>
      </div>
    `;
  }
}

function displayStatistics(stats) {
  console.log('📊 Affichage des statistiques:', stats);

  const statsCards = document.getElementById('stats-cards');
  const chartsContainer = document.getElementById('charts-container');

  // ========================================
  // 1. CARTES PRINCIPALES
  // ========================================
  statsCards.innerHTML = `
    <!-- Membres -->
    <div class="stat-card primary">
      <div class="stat-card-header">
        <div>
          <p class="stat-card-title">Membres actifs</p>
        </div>
        <div class="stat-card-icon primary">
          <i class="fas fa-users"></i>
        </div>
      </div>
      <h2 class="stat-card-value">${stats.membres.total}</h2>
      <p class="stat-card-subtitle">
        <i class="fas fa-user-plus"></i> ${stats.membres.nouveaux30jours} nouveaux ce mois
      </p>
    </div>

    <!-- Activités totales -->
    <div class="stat-card secondary">
      <div class="stat-card-header">
        <div>
          <p class="stat-card-title">Activités totales</p>
        </div>
        <div class="stat-card-icon secondary">
          <i class="fas fa-calendar-alt"></i>
        </div>
      </div>
      <h2 class="stat-card-value">${stats.activites.total}</h2>
      <p class="stat-card-subtitle">
        <i class="fas fa-clock"></i> ${stats.activites.aVenir} à venir
      </p>
    </div>

    <!-- Inscriptions -->
    <div class="stat-card warning">
      <div class="stat-card-header">
        <div>
          <p class="stat-card-title">Inscriptions</p>
        </div>
        <div class="stat-card-icon warning">
          <i class="fas fa-ticket-alt"></i>
        </div>
      </div>
      <h2 class="stat-card-value">${stats.inscriptions.total}</h2>
      <p class="stat-card-subtitle">
        <i class="fas fa-chart-line"></i> ${stats.inscriptions.placesOccupees} / ${stats.inscriptions.placesTotal} places
      </p>
    </div>

    <!-- Taux de remplissage -->
    <div class="stat-card danger">
      <div class="stat-card-header">
        <div>
          <p class="stat-card-title">Taux de remplissage</p>
        </div>
        <div class="stat-card-icon danger">
          <i class="fas fa-percentage"></i>
        </div>
      </div>
      <h2 class="stat-card-value">${stats.inscriptions.tauxRemplissage}%</h2>
      <p class="stat-card-subtitle">
        <i class="fas fa-chart-pie"></i> Moyenne de participation
      </p>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${stats.inscriptions.tauxRemplissage}%"></div>
      </div>
    </div>
  `;

  // ========================================
  // 2. GRAPHIQUES DÉTAILLÉS
  // ========================================
  chartsContainer.innerHTML = `
    <!-- Répartition par rôle -->
    <div class="chart-container">
      <h3 class="chart-title">
        <i class="fas fa-users-cog"></i> Répartition des membres par rôle
      </h3>
      <ul class="list-stats" id="role-chart">
        ${stats.membres.parRole.map(r => `
          <li>
            <span class="list-stats-label">${r.role}</span>
            <span class="list-stats-value">${r.count}</span>
          </li>
        `).join('')}
      </ul>
    </div>

    <!-- Répartition par catégorie -->
    <div class="chart-container">
      <h3 class="chart-title">
        <i class="fas fa-tags"></i> Activités par catégorie
      </h3>
      <ul class="list-stats" id="category-chart">
        ${stats.activites.parCategorie.map(c => `
          <li>
            <span class="list-stats-label">${c.categorie}</span>
            <span class="list-stats-value">${c.count}</span>
          </li>
        `).join('')}
      </ul>
    </div>

    <!-- Répartition par statut -->
    <div class="chart-container">
      <h3 class="chart-title">
        <i class="fas fa-info-circle"></i> Activités par statut
      </h3>
      <ul class="list-stats" id="status-chart">
        ${stats.activites.parStatut.map(s => `
          <li>
            <span class="list-stats-label">${s.statut}</span>
            <span class="list-stats-value">${s.count}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;

  console.log('✅ Statistiques affichées avec succès');
}

// Initialisation
async function initStatsPage() {
  console.log('✅ statistiques.js - Initialisation');

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

  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    loadStatistics();
  });

  await loadStatistics();
}

initStatsPage().catch(err => {
  console.error('❌ Erreur init:', err);
});