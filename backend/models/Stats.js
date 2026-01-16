const db = require('../config/database');

class Stats {
    
    // US2 : Statistiques globales du club
    static async getGlobalStats() {
        try {
            console.log('📊 Récupération des statistiques globales...');

            // 1. Nombre total de membres
            const [membresCount] = await db.execute(
                'SELECT COUNT(*) as total FROM membres WHERE estActif = 1'
            );

            // 2. Répartition des membres par rôle
            const [membresParRole] = await db.execute(`
                SELECT role, COUNT(*) as count 
                FROM membres 
                WHERE estActif = 1 
                GROUP BY role
            `);

            // 3. Nombre total d'activités
            const [activitesCount] = await db.execute(
                'SELECT COUNT(*) as total FROM activite'
            );

            // 4. Répartition des activités par statut
            const [activitesParStatut] = await db.execute(`
                SELECT statut, COUNT(*) as count 
                FROM activite 
                GROUP BY statut
            `);

            // 5. Répartition des activités par catégorie
            const [activitesParCategorie] = await db.execute(`
                SELECT c.nom as categorie, COUNT(a.id) as count 
                FROM categories c
                LEFT JOIN activite a ON c.id = a.categorie_id
                GROUP BY c.id, c.nom
                ORDER BY count DESC
            `);

            // 6. Nombre total d'inscriptions
            const [inscriptionsCount] = await db.execute(
                'SELECT COUNT(*) as total FROM inscriptions WHERE statut = "inscrit"'
            );

            // 7. Taux de participation moyen (inscriptions / places disponibles)
            const [tauxParticipation] = await db.execute(`
                SELECT 
                    SUM(placesMax - placesRestantes) as placesOccupees,
                    SUM(placesMax) as placesTotal,
                    ROUND((SUM(placesMax - placesRestantes) / SUM(placesMax)) * 100, 2) as tauxRemplissage
                FROM activite
                WHERE statut IN ('Planifiee', 'En_cours', 'Terminee')
            `);

            // 8. Activités à venir vs passées
            const [activitesTemporalite] = await db.execute(`
                SELECT 
                    SUM(CASE WHEN dateDebut >= NOW() THEN 1 ELSE 0 END) as aVenir,
                    SUM(CASE WHEN dateDebut < NOW() THEN 1 ELSE 0 END) as passees
                FROM activite
                WHERE statut != 'Annulee'
            `);

            // 9. Nouveaux membres (inscrits dans les 30 derniers jours)
            const [nouveauxMembres] = await db.execute(`
                SELECT COUNT(*) as total 
                FROM membres 
                WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                  AND estActif = 1
            `);

            // Construction de la réponse
            const stats = {
                membres: {
                    total: membresCount[0].total,
                    nouveaux30jours: nouveauxMembres[0].total,
                    parRole: membresParRole
                },
                activites: {
                    total: activitesCount[0].total,
                    aVenir: activitesTemporalite[0]?.aVenir || 0,
                    passees: activitesTemporalite[0]?.passees || 0,
                    parStatut: activitesParStatut,
                    parCategorie: activitesParCategorie
                },
                inscriptions: {
                    total: inscriptionsCount[0].total,
                    tauxRemplissage: tauxParticipation[0]?.tauxRemplissage || 0,
                    placesOccupees: tauxParticipation[0]?.placesOccupees || 0,
                    placesTotal: tauxParticipation[0]?.placesTotal || 0
                }
            };

            console.log('✅ Statistiques récupérées avec succès');
            return stats;

        } catch (error) {
            console.error('❌ Erreur récupération stats:', error);
            throw error;
        }
    }





    // US3 : Activités les plus populaires (classement par inscriptions)
static async getActivitesPopulaires(limit = 10) {
    try {
        console.log('🏆 Récupération des activités populaires (top', limit, ')');

        const [activites] = await db.execute(`
            SELECT 
                a.id,
                a.titre,
                a.description,
                a.dateDebut,
                a.dateFin,
                a.lieu,
                a.placesMax,
                a.placesRestantes,
                a.statut,
                c.nom AS categorie_nom,
                CONCAT(m.prenom, ' ', m.nom) AS organisateur_nom,
                COUNT(i.id) AS nombreInscriptions,
                ROUND((COUNT(i.id) / a.placesMax) * 100, 2) AS tauxRemplissage,
                CASE 
                    WHEN COUNT(i.id) = 0 THEN 0
                    ELSE COUNT(i.id)
                END AS popularite
            FROM activite a
            LEFT JOIN inscriptions i ON a.id = i.activite_id AND i.statut = 'inscrit'
            LEFT JOIN categories c ON a.categorie_id = c.id
            LEFT JOIN membres m ON a.organisateur_id = m.id
            WHERE a.statut != 'Annulee'
            GROUP BY a.id, a.titre, a.description, a.dateDebut, a.dateFin, 
                     a.lieu, a.placesMax, a.placesRestantes, a.statut, 
                     c.nom, m.prenom, m.nom
            ORDER BY nombreInscriptions DESC, tauxRemplissage DESC
            LIMIT ?
        `, [limit]);

        console.log('✅ Top', activites.length, 'activités populaires récupérées');
        return activites;

    } catch (error) {
        console.error('❌ Erreur récupération activités populaires:', error);
        throw error;
    }
}


// US4 : Membres les plus actifs (classement par participations)
static async getMembresActifs(limit = 10) {
    try {
        console.log('🌟 Récupération des membres actifs (top', limit, ')');

        const [membres] = await db.execute(`
            SELECT 
                m.id,
                m.nom,
                m.prenom,
                m.email,
                m.telephone,
                m.filiere,
                m.anneeEtude,
                m.role,
                m.poste,
                m.createdAt,
                COUNT(DISTINCT i.id) AS nombreParticipations,
                COUNT(DISTINCT CASE 
                    WHEN a.statut = 'Terminee' THEN i.id 
                END) AS participationsTerminees,
                COUNT(DISTINCT CASE 
                    WHEN a.statut = 'Planifiee' OR a.statut = 'En_cours' THEN i.id 
                END) AS participationsEnCours,
                GROUP_CONCAT(DISTINCT c.nom SEPARATOR ', ') AS categoriesPreferees,
                MAX(i.date_inscription) AS derniereInscription
            FROM membres m
            LEFT JOIN inscriptions i ON m.id = i.membre_id AND i.statut = 'inscrit'
            LEFT JOIN activite a ON i.activite_id = a.id
            LEFT JOIN categories c ON a.categorie_id = c.id
            WHERE m.estActif = 1
            GROUP BY m.id, m.nom, m.prenom, m.email, m.telephone, 
                     m.filiere, m.anneeEtude, m.role, m.poste, m.createdAt
            HAVING nombreParticipations > 0
            ORDER BY nombreParticipations DESC, participationsTerminees DESC
            LIMIT ?
        `, [limit]);

        console.log('✅ Top', membres.length, 'membres actifs récupérés');
        return membres;

    } catch (error) {
        console.error('❌ Erreur récupération membres actifs:', error);
        throw error;
    }
}
}

module.exports = Stats;