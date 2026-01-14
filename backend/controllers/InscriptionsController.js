const Inscription = require('../models/Inscription');

class InscriptionsController {
    // US3.1 POST /inscriptions
    static async creer(req, res) {
        try {
            const { membre_id, activite_id } = req.body;

            // Vérifier que l'utilisateur s'inscrit pour lui-même (ou est bureau/admin)
            const isBureauOrAdmin = ['MEMBRE_BUREAU', 'ADMIN'].includes(req.user.role);
            if (!isBureauOrAdmin && req.user.id !== parseInt(membre_id)) {
                return res.status(403).json({
                    error: 'Vous ne pouvez vous inscrire que pour vous-même'
                });
            }

            const idInscription = await Inscription.creer(membre_id, activite_id);
            res.json({
                success: true,
                idInscription,
                message: 'Inscription créée avec succès'
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getMesInscriptions(req, res) {
        try {
            const membre_id = parseInt(req.params.membre_id);

            if (isNaN(membre_id)) {
                return res.status(400).json({ error: 'ID de membre invalide' });
            }

            console.log('📋 Récupération inscriptions pour membre:', membre_id);
            console.log('👤 Utilisateur authentifié:', req.user.id, req.user.role);

            // Vérifier que l'utilisateur demande ses propres inscriptions (ou est bureau/admin)
            const isBureauOrAdmin = ['MEMBRE_BUREAU', 'ADMIN'].includes(req.user.role);
            if (!isBureauOrAdmin && req.user.id !== membre_id) {
                return res.status(403).json({
                    error: 'Vous ne pouvez voir que vos propres inscriptions'
                });
            }

            const inscriptions = await Inscription.getByMembre(membre_id);

            console.log('✅ Inscriptions trouvées:', inscriptions.length);

            // IMPORTANT : Retourner directement le tableau, pas un objet
            res.json(inscriptions);
        } catch (error) {
            console.error('❌ Erreur récupération inscriptions:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async getInscriptionsActivite(req, res) {
        try {
            const activite_id = parseInt(req.params.activite_id);
            const inscriptions = await Inscription.getByActivite(activite_id);
            res.json(inscriptions);
        } catch (error) {
            console.error('❌ Erreur récupération inscriptions activité:', error);
            res.status(500).json({ error: error.message });
        }
    }


    // DELETE /inscriptions/:id - Annuler une inscription
    static async supprimer(req, res) {
        try {
            const id = req.params.id;

            // Vérifier que l'inscription existe et appartient à l'utilisateur (ou est bureau/admin)
            const db = require('../config/database');
            const inscription = await db.query(
                'SELECT membre_id FROM inscriptions WHERE id = ?',
                [id]
            );

            if (!inscription || inscription.length === 0) {
                return res.status(404).json({ error: 'Inscription non trouvée' });
            }

            const isBureauOrAdmin = ['MEMBRE_BUREAU', 'ADMIN'].includes(req.user.role);
            if (!isBureauOrAdmin && req.user.id !== inscription[0].membre_id) {
                return res.status(403).json({
                    error: 'Vous ne pouvez annuler que vos propres inscriptions'
                });
            }

            await Inscription.supprimerById(id);
            res.json({ success: true, message: 'Inscription annulée et place restituée' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }



// Admin : Toutes les inscriptions
static async getAllInscriptions(req, res) {
    try {
        console.log('📋 Admin - Récupération de toutes les inscriptions');
        
        const inscriptions = await Inscription.getAll();
        
        console.log('✅ Total inscriptions:', inscriptions.length);
        
        res.json(inscriptions);
    } catch (error) {
        console.error('❌ Erreur récupération inscriptions:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}
}
   


module.exports = InscriptionsController;
