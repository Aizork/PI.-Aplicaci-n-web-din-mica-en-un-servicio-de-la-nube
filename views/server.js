require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a PostgreSQL (Railway inyecta DATABASE_URL automáticamente)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Requerido por Railway
});

// Configuración
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// Crear tabla al iniciar (si no existe)
pool.query(`
  CREATE TABLE IF NOT EXISTS cloud_services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    description TEXT
  )
`).catch(err => console.error('⚠️ Error inicializando DB:', err.message));

// Rutas
app.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM cloud_services ORDER BY id DESC');
  res.render('index', { services: rows });
});

app.post('/add', async (req, res) => {
  const { name, url, description } = req.body;
  await pool.query(
    'INSERT INTO cloud_services (name, url, description) VALUES ($1, $2, $3)',
    [name, url, description || 'Sin descripción']
  );
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});