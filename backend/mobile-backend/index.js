const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/tasks', require('./src/routes/tasks'));
app.use('/api/sessions', require('./src/routes/sessions'));
app.use('/api/schedule', require('./src/routes/schedule'));
app.use('/api/notifications', require('./src/routes/notifications'));

app.get('/', (req, res) => res.json({ mensaje: 'TimeFocus API corriendo' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => 
  console.log(`Servidor corriendo en puerto ${PORT}`)
);