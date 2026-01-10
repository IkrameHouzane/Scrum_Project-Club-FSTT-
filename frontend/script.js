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
        // Par défaut : non-admin → dashboard
        let redirectUrl = 'dashboard.html';

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

  // Toggle password visibility (login form)
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const formGroup = btn.closest('.form-group');
      if (!formGroup) return;
      const input = formGroup.querySelector('input[type="password"], input[type="text"]');
      if (!input) return;
      const icon = btn.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
      } else {
        input.type = 'password';
        if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
      }
    });
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
          <td class="editable" title="Cliquer pour modifier">${m.nom} ${m.prenom}</td>
          <td class="editable" title="Cliquer pour modifier">${m.email}</td>
          <td class="editable" title="Cliquer pour modifier">${m.telephone || '-'}</td>
          <td class="editable" title="Cliquer pour modifier">${m.filiere || '-'}</td>
          <td class="editable" title="Cliquer pour modifier">${m.anneeEtude || '-'}</td>
          <td class="editable" title="Cliquer pour modifier">${m.role}</td>
          <td class="editable" title="Cliquer pour modifier">${m.poste || '-'}</td>
          <td class="editable" title="Cliquer pour modifier">${m.estActif ? 'Oui' : 'Non'}</td>
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

  // Gestion des événements : assigner rôle ou édition inline
  let activeEditor = null;

  document.addEventListener('click', (e) => {
    const t = e.target;

    // Assigner rôle
    if (t.classList.contains('assign-role-btn')) {
      currentMemberId = t.getAttribute('data-id');
      modal.style.display = 'block';
      document.getElementById('roleSelect').value = '';
      document.getElementById('posteSelect').value = '';
      return;
    }

    // Edition directe : cliquer sur une cellule éditable
    const cell = t.closest('td.editable');
    if (cell) {
      const tr = cell.closest('tr');
      if (!tr) return;
      currentMemberId = tr.getAttribute('data-id');

      // If another cell is being edited, try to commit it first
      if (activeEditor && activeEditor.cell === cell) return;
      if (activeEditor) {
        commitEditor(activeEditor).catch(() => {});
      }

      startInlineEdit(cell, tr);
    }
  });

  // Start inline editing in a cell
  function startInlineEdit(cell, tr) {
    cell.classList.add('editing');
    const col = cell.cellIndex;
    const initialValue = cell.textContent.trim();
    let input;

    // Create appropriate input/select per column
    if (col === 1) {
      input = document.createElement('input');
      input.type = 'text';
      input.value = initialValue;
      input.className = 'inline-input';
    } else if (col === 2) {
      input = document.createElement('input');
      input.type = 'email';
      input.value = initialValue;
      input.className = 'inline-input';
    } else if ([3,4,5].includes(col)) {
      input = document.createElement('input');
      input.type = 'text';
      input.value = (initialValue === '-' ? '' : initialValue);
      input.className = 'inline-input';
    } else if (col === 6) { // role
      input = document.createElement('select');
      input.className = 'inline-select';
      ['MEMBRE','MEMBRE_BUREAU','ADMIN'].forEach(v => {
        const o = document.createElement('option'); o.value = v; o.textContent = v; input.appendChild(o);
      });
      input.value = tr.dataset.role || initialValue;
    } else if (col === 7) { // poste
      input = document.createElement('select');
      input.className = 'inline-select';
      ['','Vice-Président','Trésorier','Chef de cellule ','RH'].forEach(v => {
        const o = document.createElement('option'); o.value = v; o.textContent = v || 'Aucun poste'; input.appendChild(o);
      });
      input.value = tr.dataset.poste || (initialValue === '-' ? '' : initialValue);
    } else if (col === 8) { // estActif
      input = document.createElement('select');
      input.className = 'inline-select';
      const yes = document.createElement('option'); yes.value = '1'; yes.textContent = 'Oui';
      const no = document.createElement('option'); no.value = '0'; no.textContent = 'Non';
      input.appendChild(yes); input.appendChild(no);
      input.value = (tr.dataset.actif === 'true' || tr.dataset.actif === '1') ? '1' : '0';
    } else {
      // non-editable column (ID, date, actions)
      cell.classList.remove('editing');
      return;
    }

    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
    if (input.select) input.select();

    const onKey = (ev) => {
      if (ev.key === 'Enter') commitEditor(activeEditor).catch(() => {});
      if (ev.key === 'Escape') cancelEditor(activeEditor);
    };

    const onBlur = () => {
      // small timeout to allow click on other controls
      setTimeout(() => {
        if (document.activeElement !== input) commitEditor(activeEditor).catch(() => {});
      }, 120);
    };

    input.addEventListener('keydown', onKey);
    input.addEventListener('blur', onBlur);

    activeEditor = { cell, tr, input, col, initialValue, onKey, onBlur };
  }

  // Commit an active editor (sends request and updates row)
  async function commitEditor(editor) {
    if (!editor) return;
    const { cell, tr, input, col, initialValue } = editor;
    const memberId = tr.getAttribute('data-id');
    let newValue = (input.value ?? '').toString().trim();

    // If nothing changed, cancel
    if (newValue === initialValue || (newValue === '' && initialValue === '-')) {
      cancelEditor(editor);
      return;
    }

    // Determine backend field name and transform value where needed
    let fieldName;
    let sendValue = newValue;

    switch (col) {
      case 1: fieldName = 'nom_prenom'; break;
      case 2: fieldName = 'email'; break;
      case 3: fieldName = 'telephone'; break;
      case 4: fieldName = 'filiere'; break;
      case 5: fieldName = 'anneeEtude'; break;
      case 6: fieldName = 'role'; break;
      case 7: fieldName = 'poste'; if (sendValue === '') sendValue = null; break;
      case 8: fieldName = 'estActif'; sendValue = (newValue === '1' || newValue === 'true'); break;
      default: cancelEditor(editor); return;
    }

    try {
      await updateMemberField(memberId, fieldName, sendValue);

      // Update dataset and cell display
      if (col === 1) {
        // Split nom/prenom
        const parts = newValue.split(' ');
        tr.dataset.nom = parts.shift() || '';
        tr.dataset.prenom = parts.join(' ') || '';
        cell.textContent = newValue || '-';
      } else if (col === 8) {
        tr.dataset.actif = sendValue ? '1' : '0';
        cell.textContent = sendValue ? 'Oui' : 'Non';
      } else if (col === 5) {
        tr.dataset.annee = newValue || '';
        cell.textContent = newValue || '-';
      } else {
        // map dataset keys
        const keyMap = { 2: 'email', 3: 'telephone', 4: 'filiere', 6: 'role', 7: 'poste' };
        const k = keyMap[col];
        if (k) tr.dataset[k] = (sendValue === null ? '' : sendValue);
        cell.textContent = newValue || '-';
      }

      // cleanup
      input.removeEventListener('keydown', editor.onKey);
      input.removeEventListener('blur', editor.onBlur);
      cell.classList.remove('editing');
      activeEditor = null;

      showMessage('message', 'Membre modifié avec succès', false);
    } catch (err) {
      // On error, revert
      showMessage('message', 'Erreur lors de la modification', true);
      cancelEditor(editor);
    }
  }

  // Cancel and revert editor
  function cancelEditor(editor) {
    if (!editor) return;
    const { cell, input, initialValue } = editor;
    if (input) {
      input.removeEventListener('keydown', editor.onKey);
      input.removeEventListener('blur', editor.onBlur);
    }
    cell.textContent = initialValue;
    cell.classList.remove('editing');
    activeEditor = null;
  }



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
