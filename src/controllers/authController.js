const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    console.log('LOGIN TENTATIVA:', { email, senha }); // adiciona essa linha
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'ok' : 'VAZIO'); // e essa

    if (!email || !senha) {
      return res.status(400).json({ sucesso: false, mensagem: 'Informe email e senha.' });
    }

    const result = await pool.query(
      'SELECT * FROM admins WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    console.log('ADMIN ENCONTRADO:', result.rowCount);
    console.log('HASH NO BANCO:', result.rows[0]?.senha_hash);

    if (result.rowCount === 0) {
      return res.status(401).json({ sucesso: false, mensagem: 'Email ou senha incorretos.' });
    }

    const admin = result.rows[0];
    const senhaCorreta = await bcrypt.compare(senha, admin.senha_hash);
    console.log('SENHA CORRETA:', senhaCorreta);

    if (!senhaCorreta) {
      return res.status(401).json({ sucesso: false, mensagem: 'Email ou senha incorretos.' });
    }

    const token = jwt.sign(
      { id: admin.id, nome: admin.nome, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      sucesso: true,
      mensagem: `Bem-vindo, ${admin.nome}!`,
      token,
      admin: { id: admin.id, nome: admin.nome, email: admin.email }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

// GET /api/auth/perfil (rota protegida — verifica token)
const perfil = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, email, criado_em FROM admins WHERE id = $1',
      [req.admin.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Admin não encontrado.' });
    }

    res.json({ sucesso: true, dados: result.rows[0] });
  } catch (error) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

// POST /api/auth/alterar-senha (rota protegida)
const alterarSenha = async (req, res) => {
  try {
    const { senha_atual, nova_senha } = req.body;

    if (!senha_atual || !nova_senha) {
      return res.status(400).json({ sucesso: false, mensagem: 'Informe a senha atual e a nova senha.' });
    }
    if (nova_senha.length < 6) {
      return res.status(400).json({ sucesso: false, mensagem: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    const result = await pool.query('SELECT * FROM admins WHERE id = $1', [req.admin.id]);
    const admin = result.rows[0];

    const senhaCorreta = await bcrypt.compare(senha_atual, admin.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ sucesso: false, mensagem: 'Senha atual incorreta.' });
    }

    const novoHash = await bcrypt.hash(nova_senha, 12);
    await pool.query('UPDATE admins SET senha_hash = $1 WHERE id = $2', [novoHash, req.admin.id]);

    res.json({ sucesso: true, mensagem: 'Senha alterada com sucesso!' });
  } catch (error) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

module.exports = { login, perfil, alterarSenha };
