const express = require('express');
const router = express.Router();
const { login, perfil, alterarSenha } = require('../controllers/authController');
const { autenticar } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Login do admin — retorna JWT
 * @access  Público
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/perfil
 * @desc    Retorna dados do admin logado
 * @access  Privado (JWT)
 */
router.get('/perfil', autenticar, perfil);

/**
 * @route   POST /api/auth/alterar-senha
 * @desc    Altera a senha do admin logado
 * @access  Privado (JWT)
 */
router.post('/alterar-senha', autenticar, alterarSenha);

module.exports = router;
