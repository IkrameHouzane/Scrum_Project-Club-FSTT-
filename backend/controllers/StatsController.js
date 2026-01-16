const Stats = require('../models/Stats');

class StatsController {
    
    // US2 : Récupérer les statistiques globales (ADMIN uniquement)
    static async getGlobalStats(req, res) {
        try {
            console.log('📊 Admin demande les stats - User:', req.user.email);

            // Vérifier que l'utilisateur est bien ADMIN
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Accès réservé aux administrateurs uniquement'
                });
            }

            const stats = await Stats.getGlobalStats();

            res.json({
                success: true,
                data: stats,
                message: 'Statistiques récupérées avec succès'
            });

        } catch (error) {
            console.error('❌ Erreur récupération stats:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }


    // US3 : Récupérer les activités les plus populaires (ADMIN uniquement)
static async getActivitesPopulaires(req, res) {
    try {
        console.log('🏆 Admin demande les activités populaires - User:', req.user.email);

        // Vérifier que l'utilisateur est bien ADMIN
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Accès réservé aux administrateurs uniquement'
            });
        }

        // Récupérer le paramètre limit (par défaut 10)
        const limit = parseInt(req.query.limit) || 10;

        if (limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: 'Le paramètre limit doit être entre 1 et 100'
            });
        }

        const activites = await Stats.getActivitesPopulaires(limit);

        res.json({
            success: true,
            data: activites,
            count: activites.length,
            message: `Top ${activites.length} activités populaires récupérées`
        });

    } catch (error) {
        console.error('❌ Erreur récupération activités populaires:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des activités populaires',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}




// US4 : Récupérer les membres les plus actifs (ADMIN uniquement)
static async getMembresActifs(req, res) {
    try {
        console.log('🌟 Admin demande les membres actifs - User:', req.user.email);

        // Vérifier que l'utilisateur est bien ADMIN
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Accès réservé aux administrateurs uniquement'
            });
        }

        // Récupérer le paramètre limit (par défaut 10)
        const limit = parseInt(req.query.limit) || 10;

        if (limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: 'Le paramètre limit doit être entre 1 et 100'
            });
        }

        const membres = await Stats.getMembresActifs(limit);

        res.json({
            success: true,
            data: membres,
            count: membres.length,
            message: `Top ${membres.length} membres actifs récupérés`
        });

    } catch (error) {
        console.error('❌ Erreur récupération membres actifs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des membres actifs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

}

module.exports = StatsController;