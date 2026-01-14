const Activite = require('../models/Activite');

// SA-9: Créer une nouvelle activité
exports.createActivite = async (req, res) => {
  try {
    // ← Plus besoin de check manuel : authenticateToken a déjà rempli req.user
    const userId = req.user.id;  // ← garanti par le middleware

    const activiteData = {
      titre: req.body.titre,
      description: req.body.description,
      dateDebut: req.body.dateDebut,
      dateFin: req.body.dateFin,
      lieu: req.body.lieu,
      placesMax: req.body.placesMax,
      statut: req.body.statut,
      categorie_id: req.body.categorie_id
    };

    const result = await Activite.create(activiteData, userId);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur création activité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Récupérer les catégories (ouvert à tous, pas besoin d'auth)
exports.getCategories = async (req, res) => {
  try {
    const categories = await Activite.getCategories();
    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Erreur getCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories'
    });
  }
};

// Vérifier permission (utilisé par le frontend pour afficher ou non les boutons)
exports.checkCreatePermission = async (req, res) => {
  try {
    const userId = req.user?.id; // ← req.user rempli par authenticateToken

    if (!userId) {
      return res.status(401).json({
        canCreate: false,
        message: 'Non authentifié'
      });
    }

    const result = await Activite.canCreateActivity(userId);
    
    res.json({
      canCreate: result.canCreate,
      message: result.message,
      role: result.role
    });
  } catch (error) {
    console.error('Erreur check permission:', error);
    res.status(500).json({
      canCreate: false,
      message: 'Erreur de vérification'
    });
  }
};

// SA-10: Consulter les activités DISPONIBLES
exports.getAllActivites = async (req, res) => {
  try {
    const filters = {
      categorie_id: req.query.categorie_id ? parseInt(req.query.categorie_id) : null,
      search: req.query.search,
      statut: req.query.statut,
      organisateur_id: req.query.organisateur_id,
      includePast: req.query.includePast === 'true',
      limit: req.query.limit ? parseInt(req.query.limit) : null,
      offset: req.query.offset ? parseInt(req.query.offset) : null
    };

    const activites = await Activite.getAll(filters);
    
    res.json({
      success: true,
      count: activites.length,
      data: activites,
      message: `${activites.length} activité(s) disponible(s)`
    });
  } catch (error) {
    console.error('Erreur récupération activités:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des activités'
    });
  }
};
// SA-10: Activités à venir (alias pour getAll)
exports.getActivitesAVenir = async (req, res) => {
    try {
        const activites = await Activite.getAll({
            // Pas besoin de filtres spéciaux, getAll montre déjà les activités à venir
        });
        
        res.json({
            success: true,
            count: activites.length,
            data: activites
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur récupération activités à venir'
        });
    }
};

// SA-10: Récupérer TOUTES les activités (même passées - pour admin/bureau seulement)
exports.getAllActivitesWithPast = async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin/bureau
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentification requise'
            });
        }
        
        // Vérifier les permissions
        const authCheck = await Activite.canCreateActivity(userId);
        if (!authCheck.canCreate) {
            return res.status(403).json({
                success: false,
                message: 'Accès réservé aux membres du bureau'
            });
        }
        
        const activites = await Activite.getAll({
            includePast: true  // Inclure les activités passées
        });
        
        res.json({
            success: true,
            count: activites.length,
            data: activites,
            message: `${activites.length} activité(s) (toutes)`
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur récupération de toutes les activités'
        });
    }
};
// SA-10: Récupérer les activités par catégorie
exports.getActivitesByCategorie = async (req, res) => {
    try {
        const categorieId = parseInt(req.params.categorieId);

        if (isNaN(categorieId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de catégorie invalide'
            });
        }

        const activites = await Activite.getAll({
            categorie_id: categorieId,
            includePast: true  // Inclure les activités passées pour le filtrage par catégorie
        });

        res.json({
            success: true,
            count: activites.length,
            categorie_id: categorieId,
            data: activites
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur récupération par catégorie'
        });
    }
};

// SA-10: Récupérer les activités de l'utilisateur connecté (pour gestion_activite)
exports.getMesActivites = async (req, res) => {
  try {
    const userId = req.user.id;  // ← garanti par authenticateToken

    const filters = {
      organisateur_id: userId,  // Filtrer par organisateur
      includePast: true,        // Inclure les activités passées pour gestion
      statut: req.query.statut,
      search: req.query.search,
      categorie_id: req.query.categorie_id ? parseInt(req.query.categorie_id) : null,
      limit: req.query.limit ? parseInt(req.query.limit) : null,
      offset: req.query.offset ? parseInt(req.query.offset) : null
    };

    const activites = await Activite.getAll(filters);

    res.json({
      success: true,
      count: activites.length,
      data: activites,
      message: `${activites.length} activité(s) trouvée(s)`
    });
  } catch (error) {
    console.error('Erreur récupération mes activités:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de vos activités'
    });
  }
};

// SA-10: Consulter les DÉTAILS d'une activité spécifique
exports.getActiviteById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Valider que l'ID est un nombre
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID d\'activité invalide'
            });
        }
        
        const activite = await Activite.findByIdWithDetails(id);
        
        if (activite) {
            res.json({
                success: true,
                data: activite,
                message: 'Activité trouvée'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Activité non trouvée'
            });
        }
        
    } catch (error) {
        console.error('Erreur récupération activité:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'activité',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
// SA-11: Modifier une activité
exports.updateActivite = async (req, res) => {
  try {
    const userId = req.user.id;  // ← garanti par middleware

    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const updateData = { ...req.body };
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null) delete updateData[key];
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune donnée à mettre à jour' });
    }

    const result = await Activite.update(id, updateData, userId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.data,
        modifications: result.modifications
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Erreur modification:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// SA-14: Annuler une activité
exports.cancelActivite = async (req, res) => {
  try {
    const userId = req.user.id;  // ← garanti par middleware

    if (req.body.confirm !== true) {
      return res.status(400).json({ success: false, message: 'Confirmation requise' });
    }

    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const result = await Activite.cancel(id, userId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.data,
        participantsCount: result.participantsCount,
        emailsEnvoyes: result.emailsEnvoyes,
        participants: result.participants
      });
    } else {
      res.status(400).json({ success: false, message: result.message, error: result.error });
    }
  } catch (error) {
    console.error('❌ Erreur annulation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};