require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

// Logger global pour pister les requêtes
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Importer TOUT depuis membres.js en une seule fois
const { authenticateToken, requireAdmin, router: membresRouter } = require('./routes/membres');
const adminRouter = require('./routes/admin');
const activiteRoutes = require('./routes/activiteRoutes');
const inscriptionsRouter = require('./routes/inscriptions');

// Appliquer les routes
app.use('/api/membres', membresRouter);   // ← utilise celui déjà importé
app.use('/api/admin', adminRouter);

// Appliquer tes routes activités (déjà protégées à l'intérieur)
app.use('/api/activites', activiteRoutes);  // ← recommandé, pas besoin de middleware global

// Routes inscriptions
app.use('/api/inscriptions', inscriptionsRouter);

// Connexion MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Erreur connexion MySQL :', err.message);
    process.exit(1);
  }
  console.log('Connecté à MySQL ! Base :', process.env.DB_NAME);
});

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Serveur + MySQL OK' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});