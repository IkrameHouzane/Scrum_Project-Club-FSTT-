require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

const membresRouter = require('./routes/membres');
const adminRouter = require('./routes/admin');
app.use('/api/membres', membresRouter);
app.use('/api/admin', adminRouter);

// Connexion MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',  // ← accepte vide si DB_PASSWORD est vide
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Erreur connexion MySQL :', err.message);
    process.exit(1); // Arrête le serveur si BD inaccessible
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