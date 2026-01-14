// MIDDLEWARE TEMPORAIRE - À REMPLACER PAR L'AUTH DE VOTRE COLLÈGUE

const fakeAuthMiddleware = (req, res, next) => {
    // Pour tester, on simule un utilisateur connecté
    // ID 2 = salma@gmail.com (MEMBRE_BUREAU) - peut créer
    // ID 1 = admin@gmail.com (ADMIN) - peut créer
    // Autres IDs = MEMBRE - ne peuvent pas créer
    
    // Simuler un utilisateur connecté (à remplacer par le vrai auth)
    req.user = {
        id: 2, // Changez ceci pour tester différents utilisateurs
        email: 'salma@gmail.com',
        role: 'MEMBRE_BUREAU'
    };
    
    // Pour les tests API avec Postman, accepter un userId dans le header
    if (req.headers['x-test-user-id']) {
        req.user.id = parseInt(req.headers['x-test-user-id']);
        
        // Simuler le rôle selon l'ID
        if (req.user.id === 1) {
            req.user.role = 'ADMIN';
            req.user.email = 'admin@gmail.com';
        } else if (req.user.id === 2) {
            req.user.role = 'MEMBRE_BUREAU';
            req.user.email = 'salma@gmail.com';
        } else {
            req.user.role = 'MEMBRE';
            req.user.email = `membre${req.user.id}@test.com`;
        }
    }
    
    next();
};

module.exports = fakeAuthMiddleware;