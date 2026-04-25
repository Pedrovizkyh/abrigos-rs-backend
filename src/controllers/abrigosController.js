const pool = require('../db/connection');

// ─── Query base reutilizável ───────────────────────────────────────────────
const selectAbrigos = `
  SELECT 
    a.*,
    adm.nome AS aprovado_por_nome,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', n.id,
          'item', n.item,
          'quantidade', n.quantidade,
          'urgencia', n.urgencia
        )
      ) FILTER (WHERE n.id IS NOT NULL),
      '[]'
    ) AS necessidades
  FROM abrigos a
  LEFT JOIN necessidades n ON n.abrigo_id = a.id
  LEFT JOIN admins adm ON adm.id = a.aprovado_por
`;

// ─── GET /abrigos — público (só aprovados) / admin (todos) ────────────────
const listarAbrigos = async (req, res) => {
  try {
    const { cidade, status, aceita_animais, aceita_pcd, com_vagas, pendentes } = req.query;
    const isAdmin = !!req.admin;

    let query = selectAbrigos;
    const conditions = [];
    const values = [];
    let idx = 1;

    if (!isAdmin) {
      conditions.push(`a.aprovado = TRUE`);
    } else if (pendentes === 'true') {
      conditions.push(`a.aprovado = FALSE`);
    }

    if (cidade) {
      conditions.push(`LOWER(a.cidade) LIKE LOWER($${idx})`);
      values.push(`%${cidade}%`); idx++;
    }
    if (status) {
      conditions.push(`a.status = $${idx}`);
      values.push(status); idx++;
    }
    if (aceita_animais === 'true') conditions.push(`a.aceita_animais = TRUE`);
    if (aceita_pcd === 'true')     conditions.push(`a.aceita_pcd = TRUE`);
    if (com_vagas === 'true')      conditions.push(`a.vagas_disponiveis > 0`);

    if (conditions.length > 0) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` GROUP BY a.id, adm.nome ORDER BY a.criado_em DESC`;

    const result = await pool.query(query, values);
    res.json({ sucesso: true, dados: result.rows, total: result.rowCount });
  } catch (error) {
    console.error('Erro ao listar abrigos:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
  }
};

// ─── GET /abrigos/:id ─────────────────────────────────────────────────────
const buscarAbrigoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = !!req.admin;

    let query = selectAbrigos + ` WHERE a.id = $1`;
    if (!isAdmin) query += ` AND a.aprovado = TRUE`;
    query += ` GROUP BY a.id, adm.nome`;

    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Abrigo não encontrado.' });
    }

    res.json({ sucesso: true, dados: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar abrigo:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
  }
};

// ─── POST /abrigos — público, entra como pendente ─────────────────────────
const criarAbrigo = async (req, res) => {
  try {
    const {
      nome, endereco, cidade, estado, telefone, responsavel,
      capacidade_total, vagas_disponiveis, aceita_animais,
      aceita_pcd, tem_banheiro, tem_alimentacao, observacoes,
      status, latitude, longitude
    } = req.body;

    if (!nome || !endereco || !cidade || !capacidade_total || vagas_disponiveis === undefined) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Campos obrigatórios: nome, endereco, cidade, capacidade_total, vagas_disponiveis'
      });
    }
    if (parseInt(vagas_disponiveis) > parseInt(capacidade_total)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Vagas disponíveis não podem ser maiores que a capacidade total'
      });
    }

    const statusFinal = parseInt(vagas_disponiveis) === 0 ? 'lotado' : (status || 'ativo');

    const result = await pool.query(
      `INSERT INTO abrigos 
        (nome, endereco, cidade, estado, telefone, responsavel, capacidade_total, 
         vagas_disponiveis, aceita_animais, aceita_pcd, tem_banheiro, tem_alimentacao, 
         observacoes, status, latitude, longitude, aprovado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, FALSE)
       RETURNING *`,
      [
        nome, endereco, cidade, estado || 'RS', telefone, responsavel,
        capacidade_total, vagas_disponiveis,
        aceita_animais || false, aceita_pcd || false,
        tem_banheiro !== undefined ? tem_banheiro : true,
        tem_alimentacao || false, observacoes, statusFinal,
        latitude || null, longitude || null
      ]
    );

    res.status(201).json({
      sucesso: true,
      dados: result.rows[0],
      mensagem: 'Abrigo cadastrado! Aguardando aprovação do administrador para aparecer no site.'
    });
  } catch (error) {
    console.error('Erro ao criar abrigo:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
  }
};

// ─── PATCH /abrigos/:id/aprovar — somente admin ───────────────────────────
const aprovarAbrigo = async (req, res) => {
  try {
    const { id } = req.params;
    const { aprovar } = req.body;

    const existe = await pool.query('SELECT id, nome FROM abrigos WHERE id = $1', [id]);
    if (existe.rowCount === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Abrigo não encontrado.' });
    }

    if (aprovar) {
      await pool.query(
        `UPDATE abrigos SET aprovado = TRUE, aprovado_em = NOW(), aprovado_por = $1 WHERE id = $2`,
        [req.admin.id, id]
      );
      res.json({ sucesso: true, mensagem: `Abrigo "${existe.rows[0].nome}" aprovado e visível ao público.` });
    } else {
      await pool.query(
        `UPDATE abrigos SET aprovado = FALSE, aprovado_em = NULL, aprovado_por = NULL WHERE id = $1`,
        [id]
      );
      res.json({ sucesso: true, mensagem: `Abrigo "${existe.rows[0].nome}" removido da listagem pública.` });
    }
  } catch (error) {
    console.error('Erro ao aprovar abrigo:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
  }
};

// ─── PUT /abrigos/:id — somente admin ─────────────────────────────────────
const atualizarAbrigo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome, endereco, cidade, estado, telefone, responsavel,
      capacidade_total, vagas_disponiveis, aceita_animais,
      aceita_pcd, tem_banheiro, tem_alimentacao, observacoes,
      status, latitude, longitude
    } = req.body;

    const existe = await pool.query('SELECT id FROM abrigos WHERE id = $1', [id]);
    if (existe.rowCount === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Abrigo não encontrado.' });
    }

    let statusFinal = status;
    if (vagas_disponiveis !== undefined && parseInt(vagas_disponiveis) === 0) statusFinal = 'lotado';

    const result = await pool.query(
      `UPDATE abrigos SET
        nome = COALESCE($1, nome), endereco = COALESCE($2, endereco),
        cidade = COALESCE($3, cidade), estado = COALESCE($4, estado),
        telefone = COALESCE($5, telefone), responsavel = COALESCE($6, responsavel),
        capacidade_total = COALESCE($7, capacidade_total),
        vagas_disponiveis = COALESCE($8, vagas_disponiveis),
        aceita_animais = COALESCE($9, aceita_animais), aceita_pcd = COALESCE($10, aceita_pcd),
        tem_banheiro = COALESCE($11, tem_banheiro), tem_alimentacao = COALESCE($12, tem_alimentacao),
        observacoes = COALESCE($13, observacoes), status = COALESCE($14, status),
        latitude = COALESCE($15, latitude), longitude = COALESCE($16, longitude)
      WHERE id = $17 RETURNING *`,
      [nome, endereco, cidade, estado, telefone, responsavel,
       capacidade_total, vagas_disponiveis, aceita_animais, aceita_pcd,
       tem_banheiro, tem_alimentacao, observacoes, statusFinal, latitude, longitude, id]
    );

    res.json({ sucesso: true, dados: result.rows[0], mensagem: 'Abrigo atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar abrigo:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
  }
};

// ─── PATCH /abrigos/:id/vagas — somente admin ─────────────────────────────
const atualizarVagas = async (req, res) => {
  try {
    const { id } = req.params;
    const { vagas_disponiveis } = req.body;

    if (vagas_disponiveis === undefined || vagas_disponiveis < 0) {
      return res.status(400).json({ sucesso: false, mensagem: 'Informe um valor válido (>= 0).' });
    }

    const abrigo = await pool.query('SELECT * FROM abrigos WHERE id = $1', [id]);
    if (abrigo.rowCount === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Abrigo não encontrado.' });
    }
    if (vagas_disponiveis > abrigo.rows[0].capacidade_total) {
      return res.status(400).json({
        sucesso: false,
        mensagem: `Vagas não podem ultrapassar a capacidade total (${abrigo.rows[0].capacidade_total}).`
      });
    }

    const novoStatus = vagas_disponiveis === 0 ? 'lotado' : 'ativo';
    const result = await pool.query(
      `UPDATE abrigos SET vagas_disponiveis = $1, status = $2 WHERE id = $3 RETURNING *`,
      [vagas_disponiveis, novoStatus, id]
    );

    res.json({ sucesso: true, dados: result.rows[0], mensagem: `Vagas atualizadas para ${vagas_disponiveis}.` });
  } catch (error) {
    console.error('Erro ao atualizar vagas:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
  }
};

// ─── DELETE /abrigos/:id — somente admin ──────────────────────────────────
const deletarAbrigo = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM abrigos WHERE id = $1 RETURNING id, nome', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Abrigo não encontrado.' });
    }

    res.json({ sucesso: true, mensagem: `Abrigo "${result.rows[0].nome}" removido com sucesso.` });
  } catch (error) {
    console.error('Erro ao deletar abrigo:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
  }
};

// ─── GET /abrigos/stats ────────────────────────────────────────────────────
const estatisticas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total_abrigos,
        COUNT(*) FILTER (WHERE aprovado = TRUE) AS total_aprovados,
        COUNT(*) FILTER (WHERE aprovado = FALSE) AS total_pendentes,
        SUM(CASE WHEN aprovado = TRUE THEN capacidade_total ELSE 0 END) AS capacidade_total,
        SUM(CASE WHEN aprovado = TRUE THEN vagas_disponiveis ELSE 0 END) AS total_vagas_disponiveis,
        COUNT(*) FILTER (WHERE status = 'ativo' AND aprovado = TRUE) AS abrigos_ativos,
        COUNT(*) FILTER (WHERE status = 'lotado' AND aprovado = TRUE) AS abrigos_lotados,
        COUNT(*) FILTER (WHERE aceita_animais = TRUE AND aprovado = TRUE) AS aceita_animais,
        COUNT(*) FILTER (WHERE aceita_pcd = TRUE AND aprovado = TRUE) AS aceita_pcd
      FROM abrigos
    `);

    res.json({ sucesso: true, dados: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
  }
};

module.exports = {
  listarAbrigos, buscarAbrigoPorId, criarAbrigo,
  aprovarAbrigo, atualizarAbrigo, atualizarVagas,
  deletarAbrigo, estatisticas
};
