const express = require('express');
const router = express.Router();
const CategoriesController = require('../controllers/categoriesController');
const { authenticateToken } = require('./membres');

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

// Routes publiques (accessibles à tous les membres authentifiés)
router.get('/', authenticateToken, CategoriesController.getAll);
router.get('/:id', authenticateToken, CategoriesController.getById);
router.get('/:id/stats', authenticateToken, CategoriesController.getStats);

// Routes protégées (Admin uniquement)
router.post('/', authenticateToken, requireAdmin, CategoriesController.create);
router.put('/:id', authenticateToken, requireAdmin, CategoriesController.update);
router.delete('/:id', authenticateToken, requireAdmin, CategoriesController.delete);

module.exports = router;