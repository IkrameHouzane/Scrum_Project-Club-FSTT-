// Marqueur visible immédiat pour vérifier l'exécution du script
(() => {
  try {
    window.__mesInscriptionsJsLoaded = true;
    const container = document.getElementById('inscriptions-container');
    if (container) {
      container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> JS chargé...</div>';
    }
    console.log('✅ mes_inscriptions.js exécuté (top-level)');
  } catch (e) {
    console.error('❌ Erreur top-level mes_inscriptions.js:', e);
  }
})();

// Afficher les erreurs JS directement dans la page (évite "Chargement..." infini)
window.addEventListener('error', (event) => {
  try {
    console.error('💥 Erreur JS globale:', event.error || event.message);
    const container = document.getElementById('inscriptions-container');
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Erreur JavaScript</h3>
          <p>${(event.error && event.error.message) || event.message || 'Erreur inconnue'}</p>
        </div>
      `;
    }
    showNotification('Erreur JavaScript: ' + ((event.error && event.error.message) || event.message || ''), true);
  } catch (_) {
    // ignore
  }
});

window.addEventListener('unhandledrejection', (event) => {
  try {
    console.error('💥 Promise rejetée:', event.reason);
    const container = document.getElementById('inscriptions-container');
    const msg = (event.reason && event.reason.message) ? event.reason.message : String(event.reason || 'Promise rejetée');
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Erreur (Promise)</h3>
          <p>${msg}</p>
        </div>
      `;
    }
    showNotification('Erreur: ' + msg, true);
  } catch (_) {
    // ignore
  }
});

function showNotification(message, isError = false) {
  const container = document.getElementById('message-container');
  if (!container) {
    console.warn('⚠️ message-container non trouvé, affichage dans la console:', message);
    // Créer un conteneur temporaire si nécessaire
    const tempContainer = document.createElement('div');
    tempContainer.id = 'message-container';
    tempContainer.className = `message-container ${isError ? 'error' : 'success'}`;
    tempContainer.style.cssText = 'padding: 15px; margin: 20px 0; border-radius: 8px; display: block;';
    tempContainer.textContent = message;
    const main = document.querySelector('main.container');
    if (main) {
      main.insertBefore(tempContainer, main.firstChild);
      setTimeout(() => {
        tempContainer.style.display = 'none';
      }, 5000);
    }
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
  const mesInscriptionsLink = document.getElementById('mes-inscriptions-link');

  // Sur la page mes_inscriptions, l'utilisateur DOIT être connecté
  // Donc on force toujours l'affichage pour utilisateur connecté
  if (user && user.id) {
    console.log('✅ Utilisateur connecté:', user);
    // Afficher les informations de l'utilisateur connecté
    if (userRoleEl) {
      userRoleEl.textContent = `${user.prenom || user.nom} (${user.role})`;
      userRoleEl.style.display = 'inline-block';
    }
    // Masquer le bouton de connexion
    if (loginBtn) {
      loginBtn.style.display = 'none';
    }
    // Afficher le bouton de déconnexion
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-block';
      logoutBtn.onclick = () => {
        localStorage.clear();
        window.location.href = 'login.html';
      };
    }
    // Afficher le lien profil
    if (profileLink) {
      profileLink.style.display = 'inline-block';
    }
    // Afficher le lien mes inscriptions
    if (mesInscriptionsLink) {
      mesInscriptionsLink.style.display = 'inline-block';
    }
    // Afficher le lien créer si autorisé
    if (createLink) {
      const canCreate = user.role === 'ADMIN' || user.role === 'MEMBRE_BUREAU';
      createLink.style.display = canCreate ? 'inline-block' : 'none';
    }
  } else {
    // Si pas d'utilisateur, tout doit être masqué (ne devrait jamais arriver ici car redirection)
    console.warn('⚠️ Pas d\'utilisateur trouvé dans updateNavbarUserUI');
    if (userRoleEl) {
      userRoleEl.style.display = 'none';
    }
    if (loginBtn) {
      loginBtn.style.display = 'none';
    }
    if (logoutBtn) {
      logoutBtn.style.display = 'none';
    }
    if (profileLink) {
      profileLink.style.display = 'none';
    }
    if (mesInscriptionsLink) {
      mesInscriptionsLink.style.display = 'none';
    }
    if (createLink) {
      createLink.style.display = 'none';
    }
  }
}

async function loadMyInscriptions() {
  const container = document.getElementById('inscriptions-container');
  if (!container) {
    console.error('❌ Container inscriptions-container non trouvé');
    return;
  }

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || !user?.id) {
    console.error('❌ Token ou utilisateur manquant');
    showNotification('Veuillez vous connecter pour voir vos inscriptions.', true);
    setTimeout(() => (window.location.href = 'login.html'), 1500);
    return;
  }

  console.log('🔄 Chargement des inscriptions pour utilisateur ID:', user.id);
  container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';

  try {
    const url = `${API_BASE_URL}/inscriptions/mes/${user.id}`;
    console.log('📡 Appel API:', url);
    console.log('🔑 Token:', token ? token.substring(0, 20) + '...' : 'MANQUANT');
    console.log('👤 User ID:', user.id);

  // Timeout pour éviter "Chargement..." infini (on met court pour debug)
    const controller = new AbortController();
  const timeoutMs = 2500;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    console.log('📥 Réponse HTTP:', response.status, response.statusText);

    if (response.status === 401 || response.status === 403) {
      // Token invalide ou expiré
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Erreur d\'authentification:', errorData);
      localStorage.clear();
      showNotification('Session expirée. Veuillez vous reconnecter.', true);
      setTimeout(() => (window.location.href = 'login.html'), 2000);
      return;
    }

    // Lire le contenu de la réponse
    const responseText = await response.text();
    console.log('📄 Contenu brut de la réponse:', responseText);

    if (!response.ok) {
      let err;
      try {
        err = JSON.parse(responseText);
      } catch (e) {
        err = { error: `Erreur HTTP ${response.status}: ${response.statusText}` };
      }
      console.error('❌ Erreur de réponse:', err);
      throw new Error(err.error || err.message || `Erreur HTTP ${response.status}`);
    }

    let inscriptions;
    try {
      inscriptions = JSON.parse(responseText);
      console.log('✅ Inscriptions reçues:', inscriptions);
    } catch (parseError) {
      console.error('❌ Erreur lors du parsing JSON:', parseError);
      console.error('📄 Contenu brut:', responseText);
      throw new Error('Erreur lors de la lecture de la réponse du serveur');
    }

    if (!Array.isArray(inscriptions)) {
      console.error('❌ Format de réponse invalide (pas un tableau):', typeof inscriptions, inscriptions);
      throw new Error('Format de réponse invalide du serveur - attendu un tableau');
    }

    if (inscriptions.length === 0) {
      console.log('ℹ️ Aucune inscription trouvée');
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-ticket-alt"></i>
          <h3>Aucune inscription</h3>
          <p>Vous n'êtes inscrit à aucune activité pour le moment.</p>
          <a href="activite_page.html" class="btn btn-primary" style="margin-top: 10px; display:inline-block;">
            <i class="fas fa-calendar-alt"></i> Voir les activités
          </a>
        </div>
      `;
      return;
    }

    console.log(`✅ Affichage de ${inscriptions.length} inscription(s)`);

    container.innerHTML = '';

    inscriptions.forEach((insc) => {
      const dateDebut = new Date(insc.dateDebut).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const card = document.createElement('div');
      card.className = 'activity-card';
      card.innerHTML = `
        <div class="activity-header">
          <div class="activity-title">
            <h3>${insc.titre || 'Sans titre'}</h3>
            <span class="badge badge-disponible">INSCRIT</span>
          </div>
        </div>

        <div class="activity-info">
          <div class="info-row">
            <i class="far fa-calendar-alt"></i>
            <strong>Date :</strong> ${dateDebut}
          </div>
          <div class="info-row">
            <i class="fas fa-map-marker-alt"></i>
            <strong>Lieu :</strong> ${insc.lieu || 'Non spécifié'}
          </div>
          <div class="info-row">
            <i class="fas fa-users"></i>
            <strong>Places :</strong> ${insc.placesRestantes ?? '-'} / ${insc.placesMax ?? '-'}
          </div>
        </div>

        <div class="activity-footer">
          <div class="action-buttons">
            <a href="details.html?id=${insc.activite_id}" class="btn btn-small btn-secondary">
              <i class="fas fa-eye"></i> Détails
            </a>
            <button class="btn btn-small btn-danger" onclick="cancelInscription(${insc.id})">
              <i class="fas fa-times"></i> Annuler
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('❌ Erreur lors du chargement des inscriptions:', error);
    
    let errorMessage = error.message || 'Erreur lors du chargement des inscriptions';
    
    // Messages d'erreur plus conviviaux
    if (error.name === 'AbortError') {
      errorMessage = 'Le serveur met trop de temps à répondre (timeout). Réessayez.';
    } else if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
      errorMessage = 'Erreur de connexion au serveur. Vérifiez que le backend est démarré.';
    } else if (error.message.includes('401') || error.message.includes('403')) {
      errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      setTimeout(() => {
        localStorage.clear();
        window.location.href = 'login.html';
      }, 2000);
    }
    
    container.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erreur de chargement</h3>
        <p>${errorMessage}</p>
        <button onclick="loadMyInscriptions()" class="btn btn-secondary" style="margin-top: 15px;">
          <i class="fas fa-redo"></i> Réessayer
        </button>
        <a href="activite_page.html" class="btn btn-primary" style="margin-top: 10px; margin-left: 10px;">
          <i class="fas fa-arrow-left"></i> Retour aux activités
        </a>
      </div>
    `;
  }
}

async function cancelInscription(inscriptionId) {
  const token = localStorage.getItem('token');
  if (!token) {
    showNotification('Session expirée. Veuillez vous reconnecter.', true);
    setTimeout(() => (window.location.href = 'login.html'), 1500);
    return;
  }

  const ok = confirm('Annuler cette inscription ? Une place sera libérée.');
  if (!ok) return;

  try {
    const response = await fetch(`${API_BASE_URL}/inscriptions/${inscriptionId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || `Erreur HTTP ${response.status}`);
    }

    showNotification(data.message || 'Inscription annulée.', false);
    await loadMyInscriptions();
  } catch (error) {
    console.error(error);
    showNotification(error.message || 'Erreur lors de l’annulation.', true);
  }
}

window.loadMyInscriptions = loadMyInscriptions;
window.cancelInscription = cancelInscription;

// Initialisation immédiate (le script est chargé en bas du body, DOM déjà prêt)
async function initMesInscriptionsPage() {
  // Indication visible que le JS s'exécute bien
  const container = document.getElementById('inscriptions-container');
  if (container) {
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Initialisation...</div>';
  }
  console.log('✅ mes_inscriptions.js chargé (DOMContentLoaded)');

  // Vérifier l'authentification dès le chargement AVANT d'afficher quoi que ce soit
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Debug visible (aide à comprendre pourquoi ça reste bloqué)
  if (container) {
    const tokenPreview = token ? (token.slice(0, 16) + '...') : 'AUCUN';
    const userPreview = user && user.id ? `id=${user.id}, role=${user.role || '?'}` : 'AUCUN';
    container.innerHTML = `
      <div class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        Initialisation...<br/>
        <small>token: ${tokenPreview} | user: ${userPreview}</small>
      </div>
    `;
  }

  if (!token || !user || !user.id) {
    console.log('❌ Non authentifié - Redirection vers login');
    // Masquer immédiatement les éléments de connexion
    const loginBtn = document.getElementById('login-btn');
    const userRoleEl = document.getElementById('user-role');
    if (loginBtn) loginBtn.style.display = 'none';
    if (userRoleEl) userRoleEl.textContent = 'Redirection...';
    
    showNotification('Veuillez vous connecter pour accéder à vos inscriptions', true);
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }

  // Mettre à jour la navbar IMMÉDIATEMENT pour masquer "Non connecté" et "Se connecter"
  updateNavbarUserUI();

  // Configurer le bouton d'actualisation
  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    loadMyInscriptions();
  });

  // Charger les inscriptions
  await loadMyInscriptions();
}

// Lance l'initialisation
initMesInscriptionsPage().catch(err => {
  console.error('❌ Erreur lors de initMesInscriptionsPage:', err);
});
