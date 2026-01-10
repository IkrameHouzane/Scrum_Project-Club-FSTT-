const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const router = express.Router();

// Middleware JWT - Protection des routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token d\'authentification manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token invalide ou expiré' });
    }
    req.user = decoded; // Stocke id, role, email, nom...
    next();
  });
};

// Middleware ADMIN uniquement
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
  }
  next();
};

// GET /api/admin/membres/export - Export Excel de la liste des membres (ADMIN seulement)
router.get('/membres/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [membres] = await db.promise().query(
      `SELECT id, nom, prenom, email, telephone, filiere, anneeEtude, role, poste, estActif, createdAt
       FROM membres
       ORDER BY nom, prenom`
    );

    if (membres.length === 0) {
      return res.status(404).json({ success: false, message: 'Aucun membre à exporter' });
    }

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Membres Club FSTT');

    // Colonnes + en-têtes stylés
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nom', key: 'nom', width: 15 },
      { header: 'Prénom', key: 'prenom', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Téléphone', key: 'telephone', width: 15 },
      { header: 'Filière', key: 'filiere', width: 25 },
      { header: 'Année d\'études', key: 'anneeEtude', width: 12 },
      { header: 'Rôle', key: 'role', width: 15 },
      { header: 'Poste (Bureau)', key: 'poste', width: 20 },
      { header: 'Actif', key: 'estActif', width: 8 },
      { header: 'Date d\'inscription', key: 'createdAt', width: 18 }
    ];

    // Style en-têtes (bleu FSTT)
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Ajout des données
    membres.forEach(m => {
      worksheet.addRow({
        id: m.id,
        nom: m.nom,
        prenom: m.prenom,
        email: m.email,
        telephone: m.telephone || '-',
        filiere: m.filiere || '-',
        anneeEtude: m.anneeEtude || '-',
        role: m.role,
        poste: m.poste || '-',
        estActif: m.estActif ? 'Oui' : 'Non',
        createdAt: m.createdAt ? new Date(m.createdAt).toLocaleDateString('fr-FR') : '-'
      });
    });

    // Envoi du fichier
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Liste_Membres_Club_FSTT.xlsx"');

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Erreur export Excel:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la génération du fichier Excel' });
  }
});

module.exports = router;
