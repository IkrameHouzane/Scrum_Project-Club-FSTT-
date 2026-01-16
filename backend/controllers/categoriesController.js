const Categorie = require('../models/Categorie');

class CategoriesController {
    // Créer une catégorie (Admin uniquement)
    static async create(req, res) {
        try {
            const userId = req.user.id;
            const userRole = req.user.role;

            // Vérifier que l'utilisateur est admin
            if (userRole !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Seuls les administrateurs peuvent créer des catégories'
                });
            }

            const categorieData = {
                nom: req.body.nom,
                description: req.body.description
            };

            const result = await Categorie.create(categorieData);

            if (result.success) {
                res.status(201).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Erreur création catégorie:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Récupérer toutes les catégories (accessible à tous les membres authentifiés)
    static async getAll(req, res) {
        try {
            const categories = await Categorie.getAll();

            res.json({
                success: true,
                count: categories.length,
                data: categories,
                message: `${categories.length} catégorie(s) trouvée(s)`
            });
        } catch (error) {
            console.error('Erreur récupération catégories:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des catégories',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Récupérer une catégorie par ID
    static async getById(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de catégorie invalide'
                });
            }

            const categorie = await Categorie.findById(id);

            if (categorie) {
                res.json({
                    success: true,
                    data: categorie,
                    message: 'Catégorie trouvée'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Catégorie non trouvée'
                });
            }
        } catch (error) {
            console.error('Erreur récupération catégorie:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de la catégorie',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Modifier une catégorie (Admin uniquement)
    static async update(req, res) {
        try {
            const userId = req.user.id;
            const userRole = req.user.role;

            // Vérifier que l'utilisateur est admin
            if (userRole !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Seuls les administrateurs peuvent modifier des catégories'
                });
            }

            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de catégorie invalide'
                });
            }

            const updateData = { ...req.body };

            // Nettoyer les données
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined || updateData[key] === null || updateData[key] === '') {
                    delete updateData[key];
                }
            });

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucune donnée à mettre à jour'
                });
            }

            const result = await Categorie.update(id, updateData);

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Erreur modification catégorie:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Supprimer une catégorie (Admin uniquement)
    static async delete(req, res) {
        try {
            const userId = req.user.id;
            const userRole = req.user.role;

            // Vérifier que l'utilisateur est admin
            if (userRole !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Seuls les administrateurs peuvent supprimer des catégories'
                });
            }

            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de catégorie invalide'
                });
            }

            const result = await Categorie.delete(id);

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Erreur suppression catégorie:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtenir les statistiques d'une catégorie
    static async getStats(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de catégorie invalide'
                });
            }

            const stats = await Categorie.getStats(id);

            if (stats) {
                res.json({
                    success: true,
                    data: stats,
                    message: 'Statistiques récupérées'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Catégorie non trouvée'
                });
            }
        } catch (error) {
            console.error('Erreur récupération statistiques:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = CategoriesController;