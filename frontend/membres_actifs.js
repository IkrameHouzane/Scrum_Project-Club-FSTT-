// ================================================
// MEMBRES_ACTIFS.JS
// ================================================

console.log('✅ membres_actifs.js chargé');

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

async function loadMembresActifs(limit = 10) {
  const leaderboardList = document.getElementById('leaderboard-list');

  if (!leaderboardList) {
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

  console.log('🔄 Chargement des membres actifs (top', limit, ')...');
  leaderboardList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';

  try {
    const url = `${API_BASE_URL}/stats/membres-actifs?limit=${limit}`;
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
    console.log('📦 Membres actifs reçus:', data);

    if (!data.success) {
      throw new Error(data.message || 'Erreur lors du chargement');
    }

    displayLeaderboard(data.data);

  } catch (error) {
    console.error('❌ Erreur chargement:', error);
    leaderboardList.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erreur de chargement</h3>
        <p>${error.message}</p>
        <button onclick="loadMembresActifs(${limit})" class="btn btn-secondary" style="margin-top: 15px;">
          <i class="fas fa-redo"></i> Réessayer
        </button>
      </div>
    `;
  }
}

function displayLeaderboard(membres) {
  console.log('🌟 Affichage du classement:', membres.length, 'membres');

  const leaderboardList = document.getElementById('leaderboard-list');

  if (membres.length === 0) {
    leaderboardList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-user-friends"></i>
        <h3>Aucun membre actif</h3>
        <p>Le classement sera disponible dès que des membres s'inscriront à des activités.</p>
      </div>
    `;
    return;
  }

  leaderboardList.innerHTML = membres.map((membre, index) => {
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

    // Badge de rôle
    let roleBadge = '';
    if (membre.role === 'ADMIN') {
      roleBadge = '<span class="role-badge role-admin">Admin</span>';
    } else if (membre.role === 'MEMBRE_BUREAU') {
      roleBadge = '<span class="role-badge role-bureau">Bureau</span>';
    } else {
      roleBadge = '<span class="role-badge role-membre">Membre</span>';
    }

    // Formatage de la dernière inscription
    const derniereInscription = membre.derniereInscription 
      ? new Date(membre.derniereInscription).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : 'N/A';

    // Membre depuis
    const membreDepuis = membre.createdAt 
      ? new Date(membre.createdAt).toLocaleDateString('fr-FR', {
          month: 'short',
          year: 'numeric'
        })
      : 'N/A';

    return `
      <li class="member-card ${rankClass}">
        <div class="rank-badge ${rankBadgeClass}">
          ${rank <= 3 ? '<i class="fas fa-medal"></i>' : rank}
        </div>

        <div class="member-info">
          <div class="member-name">${membre.prenom} ${membre.nom}</div>
          <div class="member-meta">
            <span><i class="fas fa-envelope"></i> ${membre.email}</span>
            ${membre.filiere ? `<span><i class="fas fa-graduation-cap"></i> ${membre.filiere}</span>` : ''}
            ${membre.anneeEtude ? `<span><i class="fas fa-calendar"></i> Année ${membre.anneeEtude}</span>` : ''}
            ${roleBadge}
            ${membre.poste ? `<span><i class="fas fa-briefcase"></i> ${membre.poste}</span>` : ''}
          </div>
          ${membre.categoriesPreferees ? `
            <div class="member-categories">
              <i class="fas fa-heart"></i> Catégories préférées : ${membre.categoriesPreferees}
            </div>
          ` : ''}
          <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #999;">
            <i class="fas fa-user-clock"></i> Membre depuis ${membreDepuis} • Dernière inscription : ${derniereInscription}
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">${membre.nombreParticipations}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" style="color: #2196F3;">${membre.participationsTerminees}</span>
            <span class="stat-label">Terminées</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" style="color: #ff9800;">${membre.participationsEnCours}</span>
            <span class="stat-label">En cours</span>
          </div>
        </div>
      </li>
    `;
  }).join('');

  console.log('✅ Classement affiché avec succès');
}

// Initialisation
async function initMembresActifsPage() {
  console.log('✅ membres_actifs.js - Initialisation');

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
    loadMembresActifs(limit);
  });

  // Changement de limite
  document.getElementById('limit-select')?.addEventListener('change', (e) => {
    const limit = parseInt(e.target.value);
    loadMembresActifs(limit);
  });

  await loadMembresActifs(10);
}

initMembresActifsPage().catch(err => {
  console.error('❌ Erreur init:', err);
});