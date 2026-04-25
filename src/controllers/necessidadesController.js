const pool = require('../db/connection');

// GET /necessidades - Listar todas as necessidades (com filtro de urgência)
const listarNecessidades = async (req, res) => {
  try {
    const { urgencia, abrigo_id } = req.query;

    let query = `
      SELECT n.*, a.nome AS abrigo_nome, a.cidade AS abrigo_cidade, a.status AS abrigo_status
      FROM necessidades n
      JOIN abrigos a ON a.id = n.abrigo_id
    `;
    const conditions = [];
    const values = [];
    let idx = 1;

    if (urgencia) {
      conditions.push(`n.urgencia = $${idx}`);
      values.push(urgencia);
      idx++;
    }
    if (abrigo_id) {
      conditions.push(`n.abrigo_id = $${idx}`);
      values.push(abrigo_id);
      idx++;
    }

    if (conditions.length > 0) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY CASE n.urgencia WHEN 'critica' THEN 1 WHEN 'alta' THEN 2 WHEN 'media' THEN 3 ELSE 4 END`;

    const result = await pool.query(query, values);
    res.json({ sucesso: true, dados: result.rows, total: result.rowCount });
  } catch (error) {
    console.error('Erro ao listar necessidades:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
  }
};

// POST /necessidades - Registrar necessidade de um abrigo
const criarNecessidade = async (req, res) => {
  try {
    const { abrigo_id, item, quantidade, urgencia } = req.body;

    if (!abrigo_id || !item) {
      return res.status(400).json({ sucesso: false, mensagem: 'Campos obrigatórios: abrigo_id, item' });
    }

    const abrigo = await pool.query('SELECT id FROM abrigos WHERE id = $1', [abrigo_id]);
    if (abrigo.rowCount === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Abrigo não encontrado' });
    }

    const result = await pool.query(
      `INSERT INTO necessidades (abrigo_id, item, quantidade, urgencia) VALUES ($1, $2, $3, $4) RETURNING *`,
      [abrigo_id, item, quantidade || null, urgencia || 'media']
    );

    res.status(201).json({ sucesso: true, dados: result.rows[0], mensagem: 'Necessidade registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao criar necessidade:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
  }
};

// DELETE /necessidades/:id - Remover necessidade (item atendido)
const deletarNecessidade = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM necessidades WHERE id = $1 RETURNING id, item', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Necessidade não encontrada' });
    }

    res.json({ sucesso: true, mensagem: `Necessidade "${result.rows[0].item}" marcada como atendida.` });
  } catch (error) {
    console.error('Erro ao deletar necessidade:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
  }
};

module.exports = { listarNecessidades, criarNecessidade, deletarNecessidade };
