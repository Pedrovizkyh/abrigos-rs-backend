require('dotenv').config();
const express = require('express');
const cors = require('cors');

const abrigosRoutes = require('./routes/abrigosRoutes');
const necessidadesRoutes = require('./routes/necessidadesRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    mensagem: '🌊 API Abrigos RS',
    versao: '2.0.0',
    rotas: {
      auth: '/api/auth/login',
      abrigos: '/api/abrigos',
      necessidades: '/api/necessidades',
      stats: '/api/abrigos/stats'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/abrigos', abrigosRoutes);
app.use('/api/necessidades', necessidadesRoutes);

app.use((req, res) => res.status(404).json({ sucesso: false, mensagem: 'Rota não encontrada' }));
app.use((err, req, res, next) => {
  console.error('Erro inesperado:', err);
  res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}\n`);
});

module.exports = app;
