const express = require('express');
const InscriptionsController = require('../controllers/InscriptionsController');
const { authenticateToken } = require('./membres');

const router = express.Router();

// Middleware pour MEMBRE_BUREAU + ADMIN
const requireBureauOrAdmin = (req, res, next) => {
    if (!['MEMBRE_BUREAU', 'ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Accès réservé aux membres du bureau et administrateurs'
        });
    }
    next();
};

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Admin/Bureau : Toutes les inscriptions (Placer AVANT /mes/:membre_id pour éviter conflit)
router.get('/all', requireBureauOrAdmin, InscriptionsController.getAllInscriptions);

// US3.2 : Mes inscriptions
router.get('/mes/:membre_id', InscriptionsController.getMesInscriptions);

// US1 : Historique des participations
router.get('/historique/:membre_id', InscriptionsController.getHistorique);

// US3.4 : Bureau - inscriptions par activité
router.get('/activite/:activite_id', requireBureauOrAdmin, InscriptionsController.getInscriptionsActivite);

// US3.1 : Créer inscription
router.post('/', InscriptionsController.creer);

// Annuler inscription (par id)
router.delete('/:id', InscriptionsController.supprimer);

module.exports = router;