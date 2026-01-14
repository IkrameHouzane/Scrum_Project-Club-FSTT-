const db = require('../config/database');

class Activite {

    // SA-9: Créer une activité
    static async create(activiteData, userId) {
        try {

            // 2. Vérifier la catégorie existe
            if (activiteData.categorie_id) {
                const [categorie] = await db.execute(
                    'SELECT id FROM categories WHERE id = ?',
                    [activiteData.categorie_id]
                );
                if (categorie.length === 0) {
                    throw new Error('Catégorie non valide');
                }
            }

            // 3. Valider les données
            this.validateActiviteData(activiteData);

            // 4. Insérer l'activité
            const sql = `
                INSERT INTO activite 
                (titre, description, dateDebut, dateFin, lieu, placesMax, placesRestantes, statut, organisateur_id, categorie_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const values = [
                activiteData.titre,
                activiteData.description || null,
                activiteData.dateDebut,
                activiteData.dateFin || null,
                activiteData.lieu,
                activiteData.placesMax || 20,
                activiteData.placesMax || 20, // placesRestantes = placesMax au début
                activiteData.statut || 'Planifiee',
                userId, // organisateur_id = utilisateur connecté
                activiteData.categorie_id || null
            ];

            const [result] = await db.execute(sql, values);

            // 5. Récupérer l'activité créée avec détails
            const nouvelleActivite = await this.findById(result.insertId);
            
            return {
                success: true,
                message: 'Activité créée avec succès',
                data: nouvelleActivite
            };

        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            };
        }
    }

    // Validation des données d'activité
    static validateActiviteData(data) {
        const errors = [];

        // Vérifications obligatoires
        if (!data.titre || data.titre.trim().length < 3) {
            errors.push('Le titre doit contenir au moins 3 caractères');
        }

        if (!data.dateDebut) {
            errors.push('La date de début est obligatoire');
        } else if (new Date(data.dateDebut) < new Date()) {
            errors.push('La date de début ne peut pas être dans le passé');
        }

        if (data.dateFin && new Date(data.dateFin) <= new Date(data.dateDebut)) {
            errors.push('La date de fin doit être après la date de début');
        }

        if (!data.lieu || data.lieu.trim().length < 2) {
            errors.push('Le lieu est obligatoire');
        }

        if (data.placesMax && (data.placesMax < 1 || data.placesMax > 1000)) {
            errors.push('Le nombre de places doit être entre 1 et 1000');
        }

        if (data.statut && !['Planifiee', 'En_cours', 'Terminee', 'Annulee'].includes(data.statut)) {
            errors.push('Statut non valide');
        }

        if (errors.length > 0) {
            throw new Error(`Validation échouée: ${errors.join(', ')}`);
        }
    }

    // Récupérer une activité par ID
    static async findById(id) {
        try {
            const [rows] = await db.execute(`
                SELECT a.*, 
                       CONCAT(m.prenom, ' ', m.nom) AS organisateur_nom,
                       m.role AS organisateur_role,
                       m.poste AS organisateur_poste,
                       c.nom AS categorie_nom
                FROM activite a
                JOIN membres m ON a.organisateur_id = m.id
                LEFT JOIN categories c ON a.categorie_id = c.id
                WHERE a.id = ?
            `, [id]);
            
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Erreur récupération activité: ${error.message}`);
        }
    }

    // Récupérer toutes les catégories (pour le frontend)
    static async getCategories() {
        try {
            const [rows] = await db.execute('SELECT * FROM categories ORDER BY nom');
            return rows;
        } catch (error) {
            throw new Error(`Erreur récupération catégories: ${error.message}`);
        }
    }

   
   // SA-10: Récupérer les activités DISPONIBLES (non terminées/annulées, dates futures)
// SA-10: Récupérer les activités DISPONIBLES (version finale)
static async getAll(filters = {}) {
    try {
        let sql = `
            SELECT
                a.*,
                CONCAT(m.prenom, ' ', m.nom) AS organisateur_nom,
                m.role AS organisateur_role,
                m.poste AS organisateur_poste,
                c.nom AS categorie_nom,
                CASE
                    WHEN a.placesRestantes = 0 THEN 'COMPLET'
                    ELSE 'DISPONIBLE'
                END AS disponibilite,
                CASE
                    WHEN DATEDIFF(a.dateDebut, NOW()) <= 7 THEN 'PROCHE'
                    ELSE 'NORMALE'
                END AS proximite
            FROM activite a
            JOIN membres m ON a.organisateur_id = m.id
            LEFT JOIN categories c ON a.categorie_id = c.id
            WHERE a.statut != 'Annulee'
        `;

        const values = [];

        // Filtre de date par défaut (activités futures seulement, sauf si includePast=true)
        if (filters.includePast !== true) {
            sql += ' AND a.dateDebut >= NOW()';
        }

        // Filtres
        if (filters.categorie_id) {
            sql += ' AND a.categorie_id = ?';
            values.push(filters.categorie_id);
        }

        if (filters.search) {
            sql += ' AND (a.titre LIKE ? OR a.description LIKE ?)';
            values.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        if (filters.statut) {
            sql += ' AND a.statut = ?';
            values.push(filters.statut);
        }

        if (filters.organisateur_id) {
            sql += ' AND a.organisateur_id = ?';
            values.push(filters.organisateur_id);
        }
        
        // Tri
        sql += ' ORDER BY a.dateDebut ASC';
        
        // Pagination
        if (filters.limit) {
            sql += ' LIMIT ?';
            values.push(filters.limit);
            
            if (filters.offset) {
                sql += ' OFFSET ?';
                values.push(filters.offset);
            }
        }
       // Debug essentiel
        console.log('SQL EXACTE :', sql.trim());
        console.log('PARAMETRES :', values);

        // Exécution protégée
        let result;
        try {
            result = await db.execute(sql, values);
        } catch (sqlError) {
            console.error('ERREUR SQL DIRECTE :', sqlError.message);
            console.error('SQL qui a planté :', sql.trim());
            console.error('Valeurs envoyées :', values);
            throw sqlError; // relance pour que le catch externe la voie
        }

        // Vérification finale
        if (!Array.isArray(result) || result.length < 1) {
            throw new Error('db.execute n\'a pas renvoyé [rows, fields]');
        }

        const [rows, fields] = result;

        console.log('Succès ! Nombre de lignes :', rows.length);
        if (rows.length > 0) {
            console.log('Exemple première activité :', rows[0]);
        }

        return rows;

    } catch (error) {
        console.error('ERREUR TOTALE dans getAll :', error.message);
        console.error('Stack complète :', error.stack);
        throw error; // pour que le controller affiche le détail
    }
}

    // SA-10: Compter le total d'activités (pour pagination) - SIMPLIFIÉ
    static async count(filters = {}) {
        try {
            let sql = `
                SELECT COUNT(*) as total
                FROM activite a
                WHERE a.statut != 'Annulee'
            `;
            
            const values = [];
            
            // Mêmes filtres que getAll
            if (filters.categorie_id) {
                sql += ' AND a.categorie_id = ?';
                values.push(filters.categorie_id);
            }
            
            if (filters.search) {
                sql += ' AND (a.titre LIKE ? OR a.description LIKE ?)';
                values.push(`%${filters.search}%`, `%${filters.search}%`);
            }
            
            if (filters.futuresOnly !== false) {
                sql += ' AND a.dateDebut >= NOW()';
            }
            
            const [rows] = await db.execute(sql, values);
            return rows[0].total;
            
        } catch (error) {
            throw new Error(`Erreur comptage activités: ${error.message}`);
        }
    }

 // Récupérer une activité par ID avec TOUS les détails (incluant le nombre réel de participants)
static async findByIdWithDetails(id) {
    try {
        const [rows] = await db.execute(`
            SELECT 
                a.*,
                CONCAT(m.prenom, ' ', m.nom) AS organisateur_nom,
                m.role AS organisateur_role,
                m.poste AS organisateur_poste,
                m.email AS organisateur_email,
                c.nom AS categorie_nom,
                c.description AS categorie_description,
                -- Calcul dynamique des places restantes (déjà présent)
                CASE 
                    WHEN a.placesRestantes = 0 THEN 'COMPLET'
                    ELSE 'DISPONIBLE'
                END AS disponibilite,
                CASE 
                    WHEN DATEDIFF(a.dateDebut, NOW()) <= 7 THEN 'PROCHE'
                    ELSE 'NORMALE'
                END AS proximite,
                -- AJOUT IMPORTANT : Nombre réel de participants inscrits
                (SELECT COUNT(*) 
                 FROM inscriptions i 
                 WHERE i.activite_id = a.id 
                 AND i.statut = 'inscrit') AS participantsCount
            FROM activite a
            JOIN membres m ON a.organisateur_id = m.id
            LEFT JOIN categories c ON a.categorie_id = c.id
            WHERE a.id = ?
        `, [id]);
        
        return rows[0] || null;
        
    } catch (error) {
        throw new Error(`Erreur récupération détails activité: ${error.message}`);
    }
}
// SA-11: Modifier une activité
static async update(id, activiteData, userId) {
    try {
        console.log('📝 Modification activité ID:', id, 'par utilisateur:', userId);

        // 1. Vérifier que l'activité existe
        const activiteExistante = await this.findByIdWithDetails(id);
        if (!activiteExistante) {
            throw new Error('Activité non trouvée');
        }

        // 2. Vérifier que l'utilisateur est l'organisateur ou admin
        // Pour l'instant, on permet seulement à l'organisateur de modifier (à étendre avec authCheck plus tard)
        if (activiteExistante.organisateur_id !== userId) {
            throw new Error('Vous ne pouvez modifier que vos propres activités');
        }

        // 3. Validation des données (si présentes)
        if (Object.keys(activiteData).length > 0) {
            // Fusionner données existantes avec nouvelles pour validation
            const donneesPourValidation = { ...activiteExistante, ...activiteData };
            this.validateActiviteData(donneesPourValidation);
        }

        // 4. Ne pas permettre de modifier placesRestantes directement
        if (activiteData.placesRestantes !== undefined) {
            throw new Error('Les places restantes sont gérées automatiquement');
        }

        // 5. Ne pas permettre de modifier organisateur_id
        if (activiteData.organisateur_id !== undefined) {
            throw new Error('Impossible de changer l\'organisateur d\'une activité');
        }

        // 6. Construire dynamiquement la requête UPDATE
        const champsAutorises = [
            'titre', 'description', 'dateDebut', 'dateFin', 
            'lieu', 'placesMax', 'statut', 'categorie_id'
        ];
        
        const champs = [];
        const valeurs = [];
        
        champsAutorises.forEach(champ => {
            if (activiteData[champ] !== undefined && activiteData[champ] !== null) {
                champs.push(`${champ} = ?`);
                valeurs.push(activiteData[champ]);
            }
        });
        
        // Vérifier s'il y a des modifications
        if (champs.length === 0) {
            throw new Error('Aucune donnée valide à mettre à jour');
        }
        
        valeurs.push(id);
        
        const sql = `UPDATE activite SET ${champs.join(', ')} WHERE id = ?`;
        console.log('📝 SQL Update:', sql, 'Valeurs:', valeurs);
        
        const [result] = await db.execute(sql, valeurs);
        
        if (result.affectedRows > 0) {
            // Récupérer l'activité mise à jour
            const activiteMiseAJour = await this.findByIdWithDetails(id);
            
            return {
                success: true,
                message: 'Activité modifiée avec succès',
                data: activiteMiseAJour,
                modifications: champs.length
            };
        } else {
            throw new Error('Aucune modification effectuée');
        }
        
    } catch (error) {
        console.error('❌ Erreur modification activité:', error.message);
        return {
            success: false,
            message: error.message,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
    }
}

// ==================== SA-14: ANNULER UNE ACTIVITÉ (VERSION COMPLÈTE) ====================

static async cancel(id, userId) {
    try {
        console.log('❌ Annulation activité ID:', id, 'par utilisateur:', userId);
        // 1. Vérifier que l'activité existe
        const activite = await this.findByIdWithDetails(id);
        if (!activite) {
            throw new Error('Activité non trouvée');
        }
        
        if (activite.statut === 'Annulee') {
            throw new Error('Cette activité est déjà annulée');
        }

        // 2. Vérifier propriété
        // Pour l'instant, on permet seulement à l'organisateur d'annuler (à étendre avec authCheck plus tard)
        if (activite.organisateur_id !== userId) {
            throw new Error('Vous ne pouvez annuler que vos propres activités');
        }

        // 3. Récupérer les VRAIS participants depuis la table inscriptions
        const [participants] = await db.execute(`
            SELECT 
                m.id,
                m.email, 
                m.prenom, 
                m.nom,
                m.telephone
            FROM inscriptions i
            JOIN membres m ON i.membre_id = m.id
            WHERE i.activite_id = ? AND i.statut = 'inscrit'
            ORDER BY m.nom, m.prenom
        `, [id]);
        
        console.log(`✅ ${participants.length} participant(s) trouvé(s) dans la table inscriptions`);

        // 4. Marquer l'activité comme annulée
        const [result] = await db.execute(
            "UPDATE activite SET statut = 'Annulee', updatedAt = NOW() WHERE id = ?",
            [id]
        );
        
        if (result.affectedRows > 0) {
            // 5. Envoyer les emails de notification (VRAIS EMAILS)
            const emailsEnvoyes = await this.envoyerEmailsAnnulation(activite, participants, userId);
            
            // 6. Récupérer l'activité mise à jour
            const activiteAnnulee = await this.findByIdWithDetails(id);
            
            return {
                success: true,
                message: `Activité annulée. ${emailsEnvoyes} email(s) envoyé(s) à ${participants.length} participant(s).`,
                data: activiteAnnulee,
                participants: participants,
                participantsCount: participants.length,
                emailsEnvoyes: emailsEnvoyes
            };
        } else {
            throw new Error('Échec de l\'annulation');
        }
        
    } catch (error) {
        console.error('❌ Erreur annulation activité:', error.message);
        return {
            success: false,
            message: error.message,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
    }
}

// ==================== MÉTHODE D'ENVOI D'EMAILS ====================

static async envoyerEmailsAnnulation(activite, participants, annuleParId) {
    try {
        // 1. Récupérer l'info de la personne qui annule
        const [organisateurRows] = await db.execute(
            'SELECT prenom, nom, email FROM membres WHERE id = ?',
            [annuleParId]
        );
        const organisateur = organisateurRows[0];
        
        // 2. Formater la date
        const dateDebut = new Date(activite.dateDebut);
        const dateFormatee = dateDebut.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // 3. Envoyer un email à chaque participant
        const results = await Promise.allSettled(
            participants.map(async (participant) => {
                try {
                    // Créer le contenu personnalisé
                    const emailContent = this.genererTemplateEmailAnnulation(
                        activite,
                        participant,
                        organisateur,
                        dateFormatee
                    );
                    
                    // Envoyer l'email (vous devez configurer votre service d'email)
                    const emailResult = await this.envoyerEmail({
                        to: participant.email,
                        subject: `[Club FSTT] Annulation : ${activite.titre}`,
                        html: emailContent.html,
                        text: emailContent.text
                    });
                    
                    console.log(`📧 Email envoyé à ${participant.email}: ${emailResult.success ? 'OK' : 'ÉCHEC'}`);
                    return { success: true, email: participant.email };
                    
                } catch (error) {
                    console.error(`❌ Erreur envoi email à ${participant.email}:`, error.message);
                    return { success: false, email: participant.email, error: error.message };
                }
            })
        );
        
        // 4. Compter les emails envoyés avec succès
        const emailsReussis = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        
        // 5. Logger les résultats
        console.log('\n📊 ===== RÉCAPITULATIF EMAILS =====');
        console.log(`Total participants: ${participants.length}`);
        console.log(`Emails envoyés avec succès: ${emailsReussis}`);
        console.log(`Échecs d'envoi: ${participants.length - emailsReussis}`);
        console.log('===================================\n');
        
        return emailsReussis;
        
    } catch (error) {
        console.error('❌ Erreur dans envoyerEmailsAnnulation:', error);
        return 0;
    }
}

// ==================== GÉNÉRER TEMPLATE EMAIL ====================

static genererTemplateEmailAnnulation(activite, participant, organisateur, dateFormatee) {
    const prenom = participant.prenom || 'Cher/Chère';
    const nom = participant.nom || 'membre';
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Annulation : ${activite.titre}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                .content { padding: 30px; background-color: #f9f9f9; border-radius: 0 0 5px 5px; border: 1px solid #ddd; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
                .activity-info { background-color: #fff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
                .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Club FSTT - Annulation d'activité</h1>
            </div>
            
            <div class="content">
                <h2>Cher(e) ${prenom} ${nom},</h2>
                
                <p>Nous vous informons que l'activité du Club FSTT à laquelle vous étiez inscrit(e) a été annulée.</p>
                
                <div class="activity-info">
                    <h3>${activite.titre}</h3>
                    <p><strong>Date prévue :</strong> ${dateFormatee}</p>
                    <p><strong>Lieu :</strong> ${activite.lieu}</p>
                    <p><strong>Description :</strong> ${activite.description || 'Non spécifiée'}</p>
                    <p><strong>Annulée par :</strong> ${organisateur.prenom} ${organisateur.nom}</p>
                </div>
                
                <p>Nous nous excusons pour ce contretemps et vous remercions de votre compréhension.</p>
                
                <p>Nous vous tiendrons informé(e) des prochaines activités du club.</p>
                
                <p>Pour toute question, n'hésitez pas à nous contacter.</p>
                
                <p>Cordialement,<br>
                <strong>L'équipe du Bureau - Club FSTT</strong></p>
            </div>
            
            <div class="footer">
                <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
                <p>Club FSTT</p>
            </div>
        </body>
        </html>
    `;
    
    const text = `
    Cher(e) ${prenom} ${nom},
    
    Annulation d'activité : ${activite.titre}
    
    Nous vous informons que l'activité à laquelle vous étiez inscrit(e) a été annulée :
    
    Activité : ${activite.titre}
    Date prévue : ${dateFormatee}
    Lieu : ${activite.lieu}
    Annulée par : ${organisateur.prenom} ${organisateur.nom}
    
    Nous nous excusons pour ce contretemps et vous remercions de votre compréhension.
    Nous vous tiendrons informé(e) des prochaines activités du club.
    
    Cordialement,
    L'équipe du Bureau - Club FSTT
    `;
    
    return { html, text };
}

// ==================== SERVICE D'ENVOI D'EMAILS ====================

static async envoyerEmail(emailData) {

    // Utiliser Nodemailer (si vous avez un SMTP)
     const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const info = await transporter.sendMail({
        from: `"Club FSTT" <${process.env.SMTP_FROM}>`,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html
    });

return { success: true, messageId: info.messageId };
}

}

module.exports = Activite;