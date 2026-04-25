const express = require('express');
const router = express.Router();
const { autenticar } = require('../middleware/auth');
const {
  listarAbrigos, buscarAbrigoPorId, criarAbrigo,
  aprovarAbrigo, atualizarAbrigo, atualizarVagas,
  deletarAbrigo, estatisticas
} = require('../controllers/abrigosController');

// Middleware opcional: injeta req.admin se token válido, mas não bloqueia
const autenticarOpcional = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();
  try {
    const jwt = require('jsonwebtoken');
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_) {}
  next();
};

// ── Públicas (autenticação opcional para admin ver mais dados) ──
router.get('/stats', estatisticas);
router.get('/', autenticarOpcional, listarAbrigos);
router.get('/:id', autenticarOpcional, buscarAbrigoPorId);

// ── Pública: qualquer um pode cadastrar (entra como pendente) ──
router.post('/', criarAbrigo);

// ── Privadas: somente admin autenticado ──
router.patch('/:id/aprovar', autenticar, aprovarAbrigo);
router.put('/:id', autenticar, atualizarAbrigo);
router.patch('/:id/vagas', autenticar, atualizarVagas);
router.delete('/:id', autenticar, deletarAbrigo);

module.exports = router;
