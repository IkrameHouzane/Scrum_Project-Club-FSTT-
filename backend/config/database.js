// config/database.js - Version PROMISE (obligatoire pour async/await)
const mysql = require('mysql2/promise');  // ← IMPORTANT : utilise /promise !

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,          // limite de connexions simultanées
  queueLimit: 0
});

// Test connexion au démarrage (optionnel mais très utile)
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connecté à MySQL ! Base :', process.env.DB_NAME);
    connection.release(); // libère la connexion
  } catch (err) {
    console.error('Erreur connexion MySQL :', err.message);
    process.exit(1);
  }
})();

// Exporte le pool promisifié
module.exports = {
  query: async (sql, params) => {
    const [rows] = await pool.execute(sql, params);
    return rows; // renvoie directement les lignes (plus simple)
  },
  execute: async (sql, params) => {
    return await pool.execute(sql, params); // garde execute si tu préfères
  },
  pool // pour debug si besoin
};