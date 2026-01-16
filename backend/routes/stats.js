const express = require('express');
const StatsController = require('../controllers/StatsController');
const { authenticateToken } = require('./membres');
const router = express.Router();

// Middleware pour ADMIN uniquement
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Accès réservé aux administrateurs'
        });
    }
    next();
};

// US2 : Route pour récupérer les statistiques globales (ADMIN seulement)
router.get('/global', authenticateToken, requireAdmin, StatsController.getGlobalStats);

// US3 : Route pour récupérer les activités populaires (ADMIN seulement)
router.get('/activites-populaires', authenticateToken, requireAdmin, StatsController.getActivitesPopulaires);

// US4 : Route pour récupérer les membres actifs (ADMIN seulement)
router.get('/membres-actifs', authenticateToken, requireAdmin, StatsController.getMembresActifs);

module.exports = router;