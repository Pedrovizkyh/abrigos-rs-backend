const jwt = require('jsonwebtoken');

const autenticar = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ sucesso: false, mensagem: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = payload; // { id, nome, email }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ sucesso: false, mensagem: 'Sessão expirada. Faça login novamente.' });
    }
    return res.status(403).json({ sucesso: false, mensagem: 'Token inválido.' });
  }
};

module.exports = { autenticar };
