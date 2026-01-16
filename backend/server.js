require('dotenv').config();

const express = require('express');
const cors = require('cors');
const statsRouter = require('./routes/stats');
require('./config/database'); // ✅ connexion MySQL unique

const app = express();

app.use(express.json());
app.use(cors());

// Logger global
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
const { router: membresRouter } = require('./routes/membres');
const adminRouter = require('./routes/admin');
const activiteRoutes = require('./routes/activiteRoutes');
const inscriptionsRouter = require('./routes/inscriptions');
const categoriesRouter = require('./routes/categories');

app.use('/api/membres', membresRouter);
app.use('/api/admin', adminRouter);
app.use('/api/activites', activiteRoutes);
app.use('/api/inscriptions', inscriptionsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/categories', categoriesRouter);
// Route test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Serveur + MySQL OK' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
