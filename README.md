# ⚙️ AbrigosRS — Backend

> API REST para a plataforma de abrigos em situações de enchente no Rio Grande do Sul.

🔗 **API em produção:** [https://abrigos-rs-backend.onrender.com](https://abrigos-rs-backend.onrender.com)  
📋 **Documentação Postman:** [https://documenter.getpostman.com/view/47434037/2sBXqGr2Nt](https://documenter.getpostman.com/view/47434037/2sBXqGr2Nt)  
🖥️ **Repositório Frontend:** [https://github.com/SEU_USUARIO/abrigos-rs-frontend](https://github.com/SEU_USUARIO/abrigos-rs-frontend)

---

## Sobre o projeto

Este é o backend da plataforma **AbrigosRS**, desenvolvido como parte de um desafio técnico sobre enchentes no Brasil. A API é responsável por gerenciar abrigos, necessidades e autenticação administrativa.

---

## Tecnologias

| Tecnologia | Uso |
|-----------|-----|
| Node.js 18 | Runtime |
| Express 4 | Framework HTTP |
| PostgreSQL | Banco de dados |
| node-postgres (pg) | Driver do banco |
| bcrypt | Criptografia de senhas |
| jsonwebtoken (JWT) | Autenticação |
| dotenv | Variáveis de ambiente |
| cors | Liberação de origens |

---

## Estrutura do Projeto

```
src/
├── server.js                      # Servidor Express, middlewares e rotas
├── db/
│   ├── connection.js              # Pool de conexão (local ou DATABASE_URL)
│   └── schema.sql                 # Tabelas, triggers e dados iniciais
├── middleware/
│   └── auth.js                    # Verificação do token JWT
├── controllers/
│   ├── authController.js          # Login, perfil e alteração de senha
│   ├── abrigosController.js       # CRUD de abrigos + aprovação
│   └── necessidadesController.js  # CRUD de necessidades
└── routes/
    ├── authRoutes.js              # /api/auth
    ├── abrigosRoutes.js           # /api/abrigos
    └── necessidadesRoutes.js      # /api/necessidades
```

---

## Endpoints da API

### 🔐 Autenticação

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| `POST` | `/api/auth/login` | Público | Login do admin — retorna JWT |
| `GET` | `/api/auth/perfil` | Admin | Dados do admin logado |
| `POST` | `/api/auth/alterar-senha` | Admin | Altera a senha do admin |

**Exemplo de login:**
```json
POST /api/auth/login
{
  "email": "admin@abrigosrs.com",
  "senha": "admin123"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": { "id": 1, "nome": "Administrador", "email": "admin@abrigosrs.com" }
}
```

> Para rotas protegidas, envie o token no header:  
> `Authorization: Bearer SEU_TOKEN`

---

### 🏠 Abrigos

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| `GET` | `/api/abrigos` | Público | Lista abrigos aprovados |
| `GET` | `/api/abrigos/stats` | Público | Estatísticas gerais |
| `GET` | `/api/abrigos/:id` | Público | Busca abrigo por ID |
| `POST` | `/api/abrigos` | Público | Cadastra abrigo (entra como pendente) |
| `PATCH` | `/api/abrigos/:id/aprovar` | Admin | Aprova ou revoga abrigo |
| `PUT` | `/api/abrigos/:id` | Admin | Atualiza abrigo completo |
| `PATCH` | `/api/abrigos/:id/vagas` | Admin | Atualiza vagas disponíveis |
| `DELETE` | `/api/abrigos/:id` | Admin | Remove abrigo |

**Filtros disponíveis no GET `/api/abrigos`:**
```
?cidade=Porto Alegre
?status=ativo | lotado | inativo
?com_vagas=true
?aceita_animais=true
?aceita_pcd=true
?pendentes=true  (somente admin)
```

---

### 📦 Necessidades

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| `GET` | `/api/necessidades` | Público | Lista necessidades |
| `POST` | `/api/necessidades` | Admin | Registra necessidade |
| `DELETE` | `/api/necessidades/:id` | Admin | Marca como atendida |

**Filtros disponíveis no GET `/api/necessidades`:**
```
?urgencia=baixa | media | alta | critica
?abrigo_id=1
```

---

## Banco de Dados

**Tabelas:**
- `admins` — administradores com senha bcrypt
- `abrigos` — abrigos com controle de aprovação e vagas
- `necessidades` — itens necessários por abrigo com nível de urgência
- `historico_vagas` — registro automático de alterações de vagas (trigger)

**Triggers:**
- `atualizar_timestamp` — atualiza `atualizado_em` a cada modificação
- `registrar_historico_vagas` — registra toda alteração de vagas

---

## Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+

### 1. Clone o repositório
```bash
git clone https://github.com/SEU_USUARIO/abrigos-rs-backend.git
cd abrigos-rs-backend
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o banco de dados
```bash
sudo -u postgres psql -c "CREATE DATABASE abrigos_db;"
sudo -u postgres psql -d abrigos_db -f src/db/schema.sql
```

### 4. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o `.env`:
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=abrigos_db
DB_USER=postgres
DB_PASSWORD=sua_senha
JWT_SECRET=chave_secreta_longa_e_aleatoria
JWT_EXPIRES_IN=8h
```

### 5. Inicie o servidor
```bash
npm run dev       # desenvolvimento
npm start         # produção
```

Servidor rodando em `http://localhost:3001`

---

## Deploy (Render)

### Variáveis de ambiente no Render

| Key | Valor |
|-----|-------|
| `DATABASE_URL` | URL interna do PostgreSQL do Render |
| `JWT_SECRET` | Chave secreta gerada com crypto |
| `JWT_EXPIRES_IN` | `8h` |
| `NODE_ENV` | `production` |

### Configurações do Web Service

| Campo | Valor |
|-------|-------|
| Build Command | `npm install` |
| Start Command | `npm start` |
| Runtime | `Node` |

---

## Segurança

- Senhas criptografadas com **bcrypt** (cost factor 12)
- Autenticação via **JWT** com expiração de 8 horas
- Rotas administrativas protegidas por middleware
- Variáveis sensíveis isoladas em `.env`
- SSL obrigatório na conexão com banco em produção
- Abrigos passam por **aprovação manual** antes de aparecer publicamente
