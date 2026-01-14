const express = require('express');
const InscriptionsController = require('../controllers/InscriptionsController');
const { authenticateToken } = require('./membres');

const router = express.Router();

// Route de test pour vérifier si le routeur est chargé
router.get('/test', (req, res) => {
    console.log('📢 Test route hit');
    res.json({ message: 'Inscriptions router is working' });
});

// Middleware pour MEMBRE_BUREAU + ADMIN
const requireBureauOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    if (!['MEMBRE_BUREAU', 'ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Accès réservé aux membres du bureau et administrateurs'
        });
    }
    next();
};

// Routes publiques (si besoin)

// Authentification requise pour tout ce qui suit
router.use(authenticateToken);

// Admin : Toutes les inscriptions (Placer AVANT /mes/:membre_id pour éviter conflit)
router.get('/all', requireBureauOrAdmin, (req, res, next) => {
    console.log('📢 Route /api/inscriptions/all hit');
    next();
}, InscriptionsController.getAllInscriptions);

// US3.2 : Mes inscriptions
router.get('/mes/:membre_id', InscriptionsController.getMesInscriptions);

// US3.4 : Bureau - inscriptions par activité (Placer AVANT le reste)
router.get('/activite/:activite_id', requireBureauOrAdmin, InscriptionsController.getInscriptionsActivite);

// US3.1 : Créer inscription
router.post('/', InscriptionsController.creer);

// Annuler inscription (par id)
router.delete('/:id', InscriptionsController.supprimer);

module.exports = router;