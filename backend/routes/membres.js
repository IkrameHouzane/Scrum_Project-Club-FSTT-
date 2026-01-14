const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const router = express.Router();

// Middleware JWT - Protection des routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token d\'authentification manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token invalide ou expiré' });
    }
    req.user = decoded; // Stocke id, role, email, nom...
    next();
  });
};

// Middleware ADMIN uniquement
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
  }
  next();
};

// POST /api/membres/register - Inscription (ouvert à tous)
router.post('/register', async (req, res) => {
  const { nom, prenom, email, password, telephone, filiere, anneeEtude } = req.body;

  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' });
  }

  try {
    // db.query renvoie directement le tableau des rows
    const existing = await db.query('SELECT id FROM membres WHERE email = ?', [email]);

    console.log('Utilisateurs existants trouvés :', existing.length);

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email déjà utilisé' });
    }

    const salt = await bcrypt.genSalt(10);
    const motDePasse = await bcrypt.hash(password, salt);

    const result = await db.query(
      'INSERT INTO membres (nom, prenom, email, telephone, filiere, anneeEtude, motDePasse, role) VALUES (?, ?, ?, ?, ?, ?, ?, "MEMBRE")',
      [nom, prenom, email, telephone || null, filiere || null, anneeEtude || null, motDePasse]
    );

    res.status(201).json({
      success: true,
      message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.',
      userId: result.insertId
    });
  } catch (err) {
    console.error('Erreur inscription complète :', err.message);
    console.error('Stack :', err.stack);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/membres/login - Connexion
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email et mot de passe obligatoires' });
  }

  try {
    // db.query renvoie directement le tableau des rows
    const users = await db.query(
      'SELECT * FROM membres WHERE email = ? AND estActif = 1',
      [email]
    );

    console.log('Users trouvés pour login :', users.length);

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Compte non trouvé ou inactif' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.motDePasse);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        nom: user.nom + ' ' + user.prenom
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie ! Bienvenue.',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        filiere: user.filiere || null,
        anneeEtude: user.anneeEtude || null
      }
    });
  } catch (err) {
    console.error('Erreur login complète :', err.message);
    console.error('Stack :', err.stack);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/membres/profile - Profil de l'utilisateur connecté (tous rôles)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const users = await db.query(
      'SELECT id, nom, prenom, email, telephone, filiere, anneeEtude, role, poste FROM membres WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Profil non trouvé' });
    }

    res.json({ success: true, profile: users[0] });
  } catch (err) {
    console.error('Erreur GET profil:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/membres/profile - Modifier son propre profil (tous rôles)
router.put('/profile', authenticateToken, async (req, res) => {
  const { nom, prenom, telephone, filiere, anneeEtude } = req.body;

  try {
    await db.query(
      'UPDATE membres SET nom = IFNULL(?, nom), prenom = IFNULL(?, prenom), telephone = IFNULL(?, telephone), filiere = IFNULL(?, filiere), anneeEtude = IFNULL(?, anneeEtude) WHERE id = ?',
      [nom, prenom, telephone, filiere, anneeEtude, req.user.id]
    );

    res.json({ success: true, message: 'Profil mis à jour avec succès' });
  } catch (err) {
    console.error('Erreur PUT profil:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/membres - Liste complète des membres (ADMIN seulement)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const membres = await db.query(
      'SELECT id, nom, prenom, email, telephone, filiere, anneeEtude, role, poste, estActif, createdAt FROM membres ORDER BY nom, prenom'
    );

    res.json({ success: true, membres });
  } catch (err) {
    console.error('Erreur liste membres:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/membres/:id/role - Changer le rôle d'un membre (ADMIN seulement)
router.put('/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role, poste } = req.body;

  if (!['MEMBRE', 'MEMBRE_BUREAU', 'ADMIN'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Rôle invalide' });
  }

  try {
    await db.query(
      'UPDATE membres SET role = ?, poste = ? WHERE id = ?',
      [role, poste || null, id]
    );

    res.json({ success: true, message: 'Rôle et poste mis à jour avec succès' });
  } catch (err) {
    console.error('Erreur changement rôle:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/membres/:id - Modifier les données d'un membre (ADMIN seulement)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { nom, prenom, email, telephone, filiere, anneeEtude, role, poste, estActif } = req.body;

  if (role && !['MEMBRE', 'MEMBRE_BUREAU', 'ADMIN'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Rôle invalide' });
  }

  try {
    await db.query(
      'UPDATE membres SET nom = IFNULL(?, nom), prenom = IFNULL(?, prenom), email = IFNULL(?, email), telephone = IFNULL(?, telephone), filiere = IFNULL(?, filiere), anneeEtude = IFNULL(?, anneeEtude), role = IFNULL(?, role), poste = IFNULL(?, poste), estActif = IFNULL(?, estActif) WHERE id = ?',
      [nom, prenom, email, telephone, filiere, anneeEtude, role, poste, estActif !== undefined ? (estActif ? 1 : 0) : null, id]
    );

    res.json({ success: true, message: 'Membre mis à jour avec succès' });
  } catch (err) {
    console.error('Erreur mise à jour membre:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = {
  authenticateToken,
  requireAdmin,
  router
};