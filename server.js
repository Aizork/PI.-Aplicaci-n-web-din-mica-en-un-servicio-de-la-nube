require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a PostgreSQL (Render inyecta DATABASE_URL automáticamente)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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
`).catch(err => console.error('⚠️ Error DB:', err.message));

// 📋 Listar servicios
app.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM cloud_services ORDER BY id DESC');
  res.render('index', { services: rows, editMode: false, currentEdit: null });
});

// ✏️ Cargar servicio para editar
app.get('/edit/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM cloud_services WHERE id = $1', [req.params.id]);
  const { rows: all } = await pool.query('SELECT * FROM cloud_services ORDER BY id DESC');
  res.render('index', { services: all, editMode: true, currentEdit: rows[0] });
});

// ➕ Agregar nuevo
app.post('/add', async (req, res) => {
  const { name, url, description } = req.body;
  await pool.query('INSERT INTO cloud_services (name, url, description) VALUES ($1, $2, $3)', [name, url, description || 'Sin descripción']);
  res.redirect('/');
});

// 💾 Guardar edición
app.post('/update/:id', async (req, res) => {
  const { name, url, description } = req.body;
  await pool.query('UPDATE cloud_services SET name=$1, url=$2, description=$3 WHERE id=$4', [name, url, description, req.params.id]);
  res.redirect('/');
});

// 🗑️ Eliminar servicio
app.post('/delete/:id', async (req, res) => {
  await pool.query('DELETE FROM cloud_services WHERE id=$1', [req.params.id]);
  res.redirect('/');
});

app.listen(PORT, () => console.log(`🚀 Cloud Hub corriendo en puerto ${PORT}`));
