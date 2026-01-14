const db = require('../config/database');

class Inscription {
    // US3.1 : Créer inscription
    static async creer(membre_id, activite_id) {
        // Vérifier si l'utilisateur est déjà inscrit
        const existing = await db.query(
            'SELECT id FROM inscriptions WHERE membre_id = ? AND activite_id = ?',
            [membre_id, activite_id]
        );

        if (existing.length > 0) {
            throw new Error('Vous êtes déjà inscrit à cette activité');
        }

        // Vérifier places restantes
        const activites = await db.query(
            'SELECT placesRestantes, statut FROM activite WHERE id = ?',
            [activite_id]
        );

        if (!activites[0]) {
            throw new Error('Activité inexistante');
        }

        if (activites[0].statut === 'Annulee' || activites[0].statut === 'Terminee') {
            throw new Error('Impossible de s\'inscrire à une activité annulée ou terminée');
        }

        if (activites[0].placesRestantes <= 0) {
            throw new Error('Places épuisées');
        }

        // Insérer l'inscription
        const [result] = await db.execute(
            'INSERT INTO inscriptions (membre_id, activite_id) VALUES (?, ?)',
            [membre_id, activite_id]
        );

        // Mettre à jour les places restantes
        await db.execute(
            'UPDATE activite SET placesRestantes = placesRestantes - 1 WHERE id = ?',
            [activite_id]
        );

        return result.insertId;
    }

    // US3.2 : Mes inscriptions
    static async getByMembre(membre_id) {
        try {
            console.log('🔍 Inscription.getByMembre - membre_id:', membre_id);
            const rows = await db.query(`
                SELECT i.id, i.activite_id, i.membre_id, i.date_inscription, i.statut,
                       a.titre, a.dateDebut, a.lieu, a.statut as activite_statut, 
                       a.placesMax, a.placesRestantes
                FROM inscriptions i 
                JOIN activite a ON i.activite_id = a.id
                WHERE i.membre_id = ? AND i.statut = 'inscrit'
                ORDER BY i.date_inscription DESC
            `, [membre_id]);
            console.log('✅ Inscription.getByMembre - Résultats:', rows.length, 'inscription(s)');
            return rows;
        } catch (error) {
            console.error('❌ Erreur dans Inscription.getByMembre:', error);
            throw error;
        }
    }

    // US3.4 : Inscriptions par activité (Bureau)
    static async getByActivite(activite_id) {
        const rows = await db.query(`
            SELECT i.*, m.nom, m.prenom, m.email, m.role, m.telephone, m.filiere
            FROM inscriptions i
            JOIN membres m ON i.membre_id = m.id
            WHERE i.activite_id = ? AND i.statut = 'inscrit'
            ORDER BY i.date_inscription DESC
        `, [activite_id]);
        return rows;
    }

    // Supprimer une inscription par son id et restituer une place
    static async supprimerById(inscription_id) {
        // Récupère l'activité associée
        const rows = await db.query('SELECT activite_id FROM inscriptions WHERE id = ?', [inscription_id]);
        if (!rows[0]) {
            throw new Error('Inscription non trouvée');
        }

        const activite_id = rows[0].activite_id;

        // Supprime l'inscription
        await db.execute('DELETE FROM inscriptions WHERE id = ?', [inscription_id]);

        // Restaure une place
        await db.execute('UPDATE activite SET placesRestantes = placesRestantes + 1 WHERE id = ?', [activite_id]);

        return true;
    }
    // Admin : Toutes les inscriptions
    static async getAll() {
        try {
            const rows = await db.query(`
                SELECT i.id, i.activite_id, i.membre_id, i.date_inscription, i.statut,
                       a.titre as activite_titre, a.dateDebut, a.lieu,
                       m.nom as membre_nom, m.prenom as membre_prenom, m.email as membre_email
                FROM inscriptions i
                JOIN activite a ON i.activite_id = a.id
                JOIN membres m ON i.membre_id = m.id
                ORDER BY i.date_inscription DESC
            `);
            return rows;
        } catch (error) {
            console.error('❌ Erreur Inscription.getAll:', error);
            throw error;
        }
    }
}

module.exports = Inscription;