const db = require('../config/database');

class Categorie {
    // Créer une nouvelle catégorie (Admin uniquement)
    static async create(categorieData) {
        try {
            const { nom, description } = categorieData;

            // Validation
            if (!nom || nom.trim().length < 2) {
                throw new Error('Le nom de la catégorie doit contenir au moins 2 caractères');
            }

            // Vérifier si la catégorie existe déjà
            const existing = await db.query(
                'SELECT id FROM categories WHERE nom = ?',
                [nom.trim()]
            );

            if (existing.length > 0) {
                throw new Error('Une catégorie avec ce nom existe déjà');
            }

            // Insérer la catégorie
            const [result] = await db.execute(
                'INSERT INTO categories (nom, description) VALUES (?, ?)',
                [nom.trim(), description ? description.trim() : null]
            );

            // Récupérer la catégorie créée
            const nouvelleCategorie = await this.findById(result.insertId);

            return {
                success: true,
                message: 'Catégorie créée avec succès',
                data: nouvelleCategorie
            };
        } catch (error) {
            console.error('Erreur création catégorie:', error);
            return {
                success: false,
                message: error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            };
        }
    }

    // Récupérer toutes les catégories
    static async getAll() {
        try {
            const categories = await db.query(`
                SELECT 
                    c.*,
                    COUNT(a.id) as nombre_activites
                FROM categories c
                LEFT JOIN activite a ON c.id = a.categorie_id
                GROUP BY c.id
                ORDER BY c.nom ASC
            `);

            return categories;
        } catch (error) {
            throw new Error(`Erreur récupération catégories: ${error.message}`);
        }
    }

    // Récupérer une catégorie par ID
    static async findById(id) {
        try {
            const [categories] = await db.execute(`
                SELECT 
                    c.*,
                    COUNT(a.id) as nombre_activites
                FROM categories c
                LEFT JOIN activite a ON c.id = a.categorie_id
                WHERE c.id = ?
                GROUP BY c.id
            `, [id]);

            return categories[0] || null;
        } catch (error) {
            throw new Error(`Erreur récupération catégorie: ${error.message}`);
        }
    }

    // Modifier une catégorie (Admin uniquement)
    static async update(id, categorieData) {
        try {
            const { nom, description } = categorieData;

            // Vérifier que la catégorie existe
            const categorieExistante = await this.findById(id);
            if (!categorieExistante) {
                throw new Error('Catégorie non trouvée');
            }

            // Validation
            if (nom && nom.trim().length < 2) {
                throw new Error('Le nom de la catégorie doit contenir au moins 2 caractères');
            }

            // Vérifier si un autre catégorie a déjà ce nom
            if (nom) {
                const existing = await db.query(
                    'SELECT id FROM categories WHERE nom = ? AND id != ?',
                    [nom.trim(), id]
                );

                if (existing.length > 0) {
                    throw new Error('Une autre catégorie avec ce nom existe déjà');
                }
            }

            // Construire dynamiquement la requête UPDATE
            const champs = [];
            const valeurs = [];

            if (nom !== undefined) {
                champs.push('nom = ?');
                valeurs.push(nom.trim());
            }

            if (description !== undefined) {
                champs.push('description = ?');
                valeurs.push(description ? description.trim() : null);
            }

            if (champs.length === 0) {
                throw new Error('Aucune donnée à mettre à jour');
            }

            valeurs.push(id);

            const sql = `UPDATE categories SET ${champs.join(', ')} WHERE id = ?`;
            const [result] = await db.execute(sql, valeurs);

            if (result.affectedRows > 0) {
                const categorieMiseAJour = await this.findById(id);

                return {
                    success: true,
                    message: 'Catégorie modifiée avec succès',
                    data: categorieMiseAJour
                };
            } else {
                throw new Error('Aucune modification effectuée');
            }
        } catch (error) {
            console.error('Erreur modification catégorie:', error);
            return {
                success: false,
                message: error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            };
        }
    }

    // Supprimer une catégorie (Admin uniquement)
    static async delete(id) {
        try {
            // Vérifier que la catégorie existe
            const categorieExistante = await this.findById(id);
            if (!categorieExistante) {
                throw new Error('Catégorie non trouvée');
            }

            // Vérifier si des activités utilisent cette catégorie
            if (categorieExistante.nombre_activites > 0) {
                throw new Error(
                    `Impossible de supprimer cette catégorie : ${categorieExistante.nombre_activites} activité(s) l'utilisent. ` +
                    `Veuillez d'abord dissocier les activités de cette catégorie.`
                );
            }

            // Supprimer la catégorie
            const [result] = await db.execute(
                'DELETE FROM categories WHERE id = ?',
                [id]
            );

            if (result.affectedRows > 0) {
                return {
                    success: true,
                    message: 'Catégorie supprimée avec succès'
                };
            } else {
                throw new Error('Échec de la suppression');
            }
        } catch (error) {
            console.error('Erreur suppression catégorie:', error);
            return {
                success: false,
                message: error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            };
        }
    }

    // Obtenir les statistiques d'une catégorie
    static async getStats(id) {
        try {
            const stats = await db.query(`
                SELECT 
                    COUNT(a.id) as total_activites,
                    COUNT(CASE WHEN a.statut = 'Planifiee' THEN 1 END) as activites_planifiees,
                    COUNT(CASE WHEN a.statut = 'En_cours' THEN 1 END) as activites_en_cours,
                    COUNT(CASE WHEN a.statut = 'Terminee' THEN 1 END) as activites_terminees,
                    COUNT(CASE WHEN a.statut = 'Annulee' THEN 1 END) as activites_annulees,
                    COALESCE(SUM(a.placesMax), 0) as total_places,
                    COALESCE(SUM(a.placesMax - a.placesRestantes), 0) as places_reservees
                FROM activite a
                WHERE a.categorie_id = ?
            `, [id]);

            return stats[0] || null;
        } catch (error) {
            throw new Error(`Erreur récupération statistiques: ${error.message}`);
        }
    }
}

module.exports = Categorie;