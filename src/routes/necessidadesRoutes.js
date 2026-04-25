const express = require('express');
const router = express.Router();
const { autenticar } = require('../middleware/auth');
const { listarNecessidades, criarNecessidade, deletarNecessidade } = require('../controllers/necessidadesController');

// Pública: qualquer um pode ver as necessidades
router.get('/', listarNecessidades);

// Privadas: somente admin
router.post('/', autenticar, criarNecessidade);
router.delete('/:id', autenticar, deletarNecessidade);

module.exports = router;
