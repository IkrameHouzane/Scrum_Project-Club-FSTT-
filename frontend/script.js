// Fonction pour afficher les messages (succès ou erreur)
function showMessage(elementId, text, isError = false) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = text;
    el.className = 'message ' + (isError ? 'error' : 'success');
  }
}

// ---------------------
// INSCRIPTION
// ---------------------
const registerForm = document.getElementById('registerForm');
if (registerForm) {
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
      const response = await fetch('http://localhost:5000/api/membres/register', {
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
      showMessage('message', 'Erreur serveur', true);
    }
  });
}

// ---------------------
// CONNEXION - Redirection intelligente selon rôle
// ---------------------
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      email: document.getElementById('email')?.value.trim(),
      password: document.getElementById('password')?.value
    };

    try {
      const response = await fetch('http://localhost:5000/api/membres/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('message', result.message || 'Connexion réussie !', false);
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));

        // REDIRECTION INTELLIGENTE SELON LE RÔLE
        const role = result.user.role;
        let redirectUrl = 'profile.html'; // Par défaut : profil personnel

        if (role === 'ADMIN') {
          redirectUrl = 'membres.html'; // Admin → liste des membres
        }

        setTimeout(() => window.location.href = redirectUrl, 1500);
      } else {
        showMessage('message', result.message || 'Erreur de connexion', true);
      }
    } catch (err) {
      showMessage('message', 'Erreur serveur', true);
    }
  });
}

// ---------------------
// PAGE PROFIL (tous rôles)
// ---------------------
if (window.location.pathname.includes('profile.html')) {
  (function() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
    }

    fetch('http://localhost:5000/api/membres/profile', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Erreur chargement profil');
      return res.json();
    })
    .then(data => {
      if (data.success) {
        const p = data.profile;
        document.getElementById('nom').textContent = p.nom || '-';
        document.getElementById('prenom').textContent = p.prenom || '-';
        document.getElementById('email').textContent = p.email || '-';
        document.getElementById('telephone').textContent = p.telephone || '-';
        document.getElementById('filiere').textContent = p.filiere || '-';
        document.getElementById('anneeEtude').textContent = p.anneeEtude || '-';
        document.getElementById('role').textContent = p.role;

        document.getElementById('editNom').value = p.nom || '';
        document.getElementById('editPrenom').value = p.prenom || '';
        document.getElementById('editTelephone').value = p.telephone || '';
        document.getElementById('editFiliere').value = p.filiere || '';
        document.getElementById('editAnneeEtude').value = p.anneeEtude || '';
      } else {
        showMessage('message', data.message || 'Erreur profil', true);
      }
    })
    .catch(err => showMessage('message', 'Erreur : ' + err.message, true));

    // Modification profil
    document.getElementById('editProfileForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const data = {
        nom: document.getElementById('editNom').value.trim() || null,
        prenom: document.getElementById('editPrenom').value.trim() || null,
        telephone: document.getElementById('editTelephone').value.trim() || null,
        filiere: document.getElementById('editFiliere').value.trim() || null,
        anneeEtude: document.getElementById('editAnneeEtude').value || null
      };

      const token = localStorage.getItem('token');

      fetch('http://localhost:5000/api/membres/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          showMessage('message', result.message, false);
          setTimeout(() => location.reload(), 1500);
        } else {
          showMessage('message', result.message, true);
        }
      })
      .catch(() => showMessage('message', 'Erreur serveur', true));
    });
  })();
}

// ---------------------
// PAGE MEMBRES (ADMIN seulement)
// ---------------------
if (window.location.pathname.includes('membres.html')) {
  (function() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'ADMIN') {
      window.location.href = 'profile.html';
    }

  fetch('http://localhost:5000/api/membres', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => {
    if (!res.ok) throw new Error('Erreur chargement membres');
    return res.json();
  })
  .then(data => {
    if (data.success) {
      const tbody = document.getElementById('membresBody');
      tbody.innerHTML = '';
      data.membres.forEach(m => {
        const row = `<tr data-id="${m.id}" data-nom="${m.nom}" data-prenom="${m.prenom}" data-email="${m.email}" data-telephone="${m.telephone || ''}" data-filiere="${m.filiere || ''}" data-annee="${m.anneeEtude || ''}" data-role="${m.role}" data-poste="${m.poste || ''}" data-actif="${m.estActif}">
          <td>${m.id}</td>
          <td class="editable">${m.nom} ${m.prenom}</td>
          <td class="editable">${m.email}</td>
          <td class="editable">${m.telephone || '-'}</td>
          <td class="editable">${m.filiere || '-'}</td>
          <td class="editable">${m.anneeEtude || '-'}</td>
          <td class="editable">${m.role}</td>
          <td class="editable">${m.poste || '-'}</td>
          <td class="editable">${m.estActif ? 'Oui' : 'Non'}</td>
          <td>${new Date(m.createdAt).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-secondary assign-role-btn" data-id="${m.id}">Assigner Rôle</button>
          </td>
        </tr>`;
        tbody.innerHTML += row;
      });
    } else {
      showMessage('message', data.message || 'Erreur chargement membres', true);
    }
  })
  .catch(err => showMessage('message', 'Erreur : ' + err.message, true));

  // Bouton export Excel (ajouté ici)
  document.getElementById('exportExcelBtn')?.addEventListener('click', () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showMessage('message', 'Veuillez vous reconnecter', true);
      return;
    }

    // Téléchargement du fichier Excel avec authentification
    fetch('http://localhost:5000/api/admin/membres/export', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Liste_Membres_Club_FSTT.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => {
      showMessage('message', 'Erreur : ' + err.message, true);
    });
  });

  // Gestion du modal pour assigner les rôles
  let currentMemberId = null;
  const modal = document.getElementById('roleModal');
  const editModal = document.getElementById('editModal');
  const closeBtn = document.querySelectorAll('.close');
  const roleForm = document.getElementById('roleForm');
  const editForm = document.getElementById('editForm');

  // Gestion des événements
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('assign-role-btn')) {
      currentMemberId = e.target.getAttribute('data-id');
      modal.style.display = 'block';
      document.getElementById('roleSelect').value = '';
      document.getElementById('posteSelect').value = '';
    }
  });



  // Function to update a single field
  async function updateMemberField(memberId, fieldName, value) {
    const token = localStorage.getItem('token');
    let data = {};

  // Handle special cases
    if (fieldName === 'nom_prenom') {
      const [nom, ...prenomParts] = value.split(' ');
      data.nom = nom;
      data.prenom = prenomParts.join(' ');
    } else if (fieldName === 'estActif') {
      data[fieldName] = value;
    } else {
      data[fieldName] = value || null;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/membres/${memberId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('message', result.message || 'Membre modifié avec succès', false);
      } else {
        showMessage('message', result.message || 'Erreur lors de la modification', true);
        throw new Error(result.message);
      }
    } catch (err) {
      showMessage('message', 'Erreur serveur', true);
      throw err;
    }
  }

  // Fermer le modal
  closeBtn.forEach(btn => {
    btn.onclick = () => {
      modal.style.display = 'none';
      editModal.style.display = 'none';
    };
  });

  window.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
    if (e.target === editModal) {
      editModal.style.display = 'none';
    }
  };

  // Soumettre le formulaire
  roleForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const role = document.getElementById('roleSelect').value;
    const poste = document.getElementById('posteSelect').value || null;

    if (!role) {
      showMessage('message', 'Veuillez sélectionner un rôle', true);
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:5000/api/membres/${currentMemberId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role, poste })
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('message', result.message || 'Rôle assigné avec succès', false);
        modal.style.display = 'none';
        setTimeout(() => location.reload(), 1500);
      } else {
        showMessage('message', result.message || 'Erreur lors de l\'assignation du rôle', true);
      }
    } catch (err) {
      showMessage('message', 'Erreur serveur', true);
    }
  });

  // Soumettre le formulaire d'édition
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

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

    if (!data.nom || !data.prenom || !data.email) {
      showMessage('message', 'Nom, prénom et email sont obligatoires', true);
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:5000/api/membres/${currentMemberId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('message', result.message || 'Membre modifié avec succès', false);
        editModal.style.display = 'none';
        setTimeout(() => location.reload(), 1500);
      } else {
        showMessage('message', result.message || 'Erreur lors de la modification', true);
      }
    } catch (err) {
      showMessage('message', 'Erreur serveur', true);
    }
  });
  })();
}
