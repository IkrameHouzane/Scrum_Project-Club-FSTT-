const express = require('express');
const router = express.Router();
const activiteController = require('../controllers/activiteController');

// ────────────────────────────────────────────────────────────────
//  IMPÉRATIF : Importer les vrais middlewares d'auth de ta collègue
// ────────────────────────────────────────────────────────────────
const { authenticateToken } = require('../routes/membres'); // ← CHEMIN À ADAPTER

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

/// Routes publiques (lecture seule)
router.get('/', activiteController.getAllActivites);
router.get('/a-venir', activiteController.getActivitesAVenir);
router.get('/categories', activiteController.getCategories);
router.get('/categorie/:categorieId', activiteController.getActivitesByCategorie);
router.get('/:id', activiteController.getActiviteById);

// Route pour récupérer les activités de l'utilisateur connecté (pour gestion_activite)
router.get('/mes-activites', authenticateToken, activiteController.getMesActivites);

// Routes protégées (écriture)
router.get('/check-permission', authenticateToken, activiteController.checkCreatePermission);

router.post('/', authenticateToken, requireBureauOrAdmin, activiteController.createActivite);

router.put('/:id', authenticateToken, requireBureauOrAdmin, activiteController.updateActivite);

router.put('/:id/cancel', authenticateToken, requireBureauOrAdmin, activiteController.cancelActivite);


module.exports = router;