// ================================================
// HISTORIQUE.JS - Affichage de l'historique des participations
// ================================================

console.log('✅ historique.js chargé');

function showNotification(message, isError = false) {
  const container = document.getElementById('message-container');
  if (!container) {
    console.warn('⚠️ message-container non trouvé');
    return;
  }

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
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const createLink = document.getElementById('create-link');
  const profileLink = document.getElementById('profile-link');

  if (user && user.id) {
    if (userRoleEl) {
      userRoleEl.textContent = `${user.prenom || user.nom} (${user.role})`;
      userRoleEl.style.display = 'inline-block';
    }
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-block';
      logoutBtn.onclick = () => {
        localStorage.clear();
        window.location.href = 'login.html';
      };
    }
    if (profileLink) profileLink.style.display = 'inline-block';
    if (createLink) {
      const canCreate = user.role === 'ADMIN' || user.role === 'MEMBRE_BUREAU';
      createLink.style.display = canCreate ? 'inline-block' : 'none';
    }
  }
}

async function loadHistorique() {
  const container = document.getElementById('historique-container');
  if (!container) {
    console.error('❌ Container historique-container non trouvé');
    return;
  }

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || !user?.id) {
    console.error('❌ Token ou utilisateur manquant');
    showNotification('Veuillez vous connecter pour voir votre historique.', true);
    setTimeout(() => (window.location.href = 'login.html'), 1500);
    return;
  }

  console.log('🔄 Chargement historique pour utilisateur ID:', user.id);
  container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';

  try {
    const url = `${API_BASE_URL}/inscriptions/historique/${user.id}`;
    console.log('📡 Appel API:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Réponse HTTP:', response.status);

    if (response.status === 401 || response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Erreur d\'authentification:', errorData);
      localStorage.clear();
      showNotification('Session expirée. Veuillez vous reconnecter.', true);
      setTimeout(() => (window.location.href = 'login.html'), 2000);
      return;
    }

    const responseText = await response.text();
    console.log('📄 Contenu brut:', responseText);

    if (!response.ok) {
      let err;
      try {
        err = JSON.parse(responseText);
      } catch (e) {
        err = { error: `Erreur HTTP ${response.status}` };
      }
      throw new Error(err.error || err.message || `Erreur HTTP ${response.status}`);
    }

    let historique;
    try {
      historique = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Erreur parsing JSON:', parseError);
      throw new Error('Erreur lors de la lecture de la réponse du serveur');
    }

    if (!Array.isArray(historique)) {
      console.error('❌ Format invalide:', typeof historique, historique);
      throw new Error('Format de réponse invalide - attendu un tableau');
    }

    if (historique.length === 0) {
      console.log('ℹ️ Aucune participation passée');
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-history"></i>
          <h3>Aucune participation passée</h3>
          <p>Vous n'avez pas encore participé à des activités terminées.</p>
          <a href="activite_page.html" class="btn btn-primary" style="margin-top: 10px; display:inline-block;">
            <i class="fas fa-calendar-alt"></i> Voir les activités à venir
          </a>
        </div>
      `;
      return;
    }

    console.log(`✅ Affichage de ${historique.length} participation(s) passée(s)`);

    container.innerHTML = '';

    historique.forEach((insc) => {
      const dateDebut = new Date(insc.dateDebut).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const dateFin = insc.dateFin ? new Date(insc.dateFin).toLocaleDateString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      }) : '';

      const dateInscription = new Date(insc.date_inscription).toLocaleDateString('fr-FR');

      // Badge selon le statut
      let badge = '';
      if (insc.activite_statut === 'Terminee') {
        badge = '<span class="badge badge-disponible">TERMINÉE</span>';
      } else if (insc.activite_statut === 'Annulee') {
        badge = '<span class="badge badge-annulee">ANNULÉE</span>';
      } else {
        badge = '<span class="badge badge-planifiee">PASSÉE</span>';
      }

      const card = document.createElement('div');
      card.className = 'activity-card';
      card.innerHTML = `
        <div class="activity-header">
          <div class="activity-title">
            <h3>${insc.titre || 'Sans titre'}</h3>
            ${badge}
          </div>
          ${insc.categorie_nom ? `<div class="category-badge"><i class="fas fa-tag"></i> ${insc.categorie_nom}</div>` : ''}
        </div>

        <div class="activity-info">
          <div class="info-row">
            <i class="far fa-calendar-alt"></i>
            <strong>Date :</strong> ${dateDebut} ${dateFin ? `- ${dateFin}` : ''}
          </div>
          <div class="info-row">
            <i class="fas fa-map-marker-alt"></i>
            <strong>Lieu :</strong> ${insc.lieu || 'Non spécifié'}
          </div>
          ${insc.description ? `
          <div class="info-row">
            <i class="fas fa-info-circle"></i>
            <span>${insc.description.substring(0, 100)}${insc.description.length > 100 ? '...' : ''}</span>
          </div>
          ` : ''}
          <div class="info-row" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;">
            <i class="fas fa-check-circle" style="color: #4CAF50;"></i>
            <strong>Inscrit le :</strong> ${dateInscription}
          </div>
        </div>

        <div class="activity-footer">
          <div class="action-buttons">
            <a href="details.html?id=${insc.activite_id}" class="btn btn-small btn-secondary">
              <i class="fas fa-eye"></i> Voir les détails
            </a>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

  } catch (error) {
    console.error('❌ Erreur chargement historique:', error);
    container.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erreur de chargement</h3>
        <p>${error.message || 'Erreur inconnue'}</p>
        <button onclick="loadHistorique()" class="btn btn-secondary" style="margin-top: 15px;">
          <i class="fas fa-redo"></i> Réessayer
        </button>
      </div>
    `;
  }
}

// Initialisation
async function initHistoriquePage() {
  console.log('✅ historique.js - Initialisation');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || !user || !user.id) {
    console.log('❌ Non authentifié - Redirection');
    showNotification('Veuillez vous connecter', true);
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }

  updateNavbarUserUI();

  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    loadHistorique();
  });

  await loadHistorique();
}

initHistoriquePage().catch(err => {
  console.error('❌ Erreur init:', err);
});