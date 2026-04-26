# 🌊 AbrigosRS — Plataforma de Abrigos em Situações de Enchente

> Conectando pessoas afetadas por enchentes com abrigos disponíveis no Rio Grande do Sul, em tempo real.

🔗 **Frontend:** [https://abrigos-rs-frontend.vercel.app](https://abrigos-rs-frontend.vercel.app)  
🔗 **Backend:** [https://abrigos-rs-backend.onrender.com](https://abrigos-rs-backend.onrender.com)  
📋 **Documentação API:** [https://documenter.getpostman.com/view/47434037/2sBXqGr2Nt](https://documenter.getpostman.com/view/47434037/2sBXqGr2Nt)

---

## 1 - Apresentação da Ideia

Esse é o meu projeto. A ideia surgiu a partir do desafio sobre enchentes no Brasil. Pensando nesse cenário, decidi focar no problema de **falta de informação sobre abrigos disponíveis**.

Durante uma enchente, as pessoas precisam sair de casa rapidamente e não sabem para onde ir. A informação sobre abrigos existe, mas está espalhada em grupos de WhatsApp, redes sociais e transmissões de rádio — sem nenhuma centralização ou atualização em tempo real.

O **AbrigosRS** nasceu da necessidade de ter um único lugar onde qualquer pessoa com acesso à internet consiga encontrar rapidamente um abrigo disponível, com informações confiáveis e atualizadas.

---

## 2 - Problema Escolhido

**Caso 1 — Falta de Informação sobre Abrigos.**

Durante enchentes, famílias em situação de emergência precisam encontrar um abrigo com urgência. Os principais problemas identificados foram:

- Informações espalhadas em diferentes canais (WhatsApp, Instagram, rádio)
- Dados de vagas desatualizados — abrigos lotados continuam recebendo pessoas enquanto outros com vagas ficam vazios
- Pessoas com necessidades específicas (animais de estimação, cadeirantes) não sabem qual abrigo aceita sua situação
- Ausência de um canal centralizado e confiável para voluntários e ONGs organizarem doações

---

## 3 - Solução Proposta

O **AbrigosRS** é uma plataforma web que centraliza informações sobre abrigos em tempo real, com dois perfis de acesso:

### 👥 Acesso Público (qualquer pessoa)
- Visualizar todos os abrigos aprovados com informações de vagas, recursos e localização
- Filtrar por cidade, status, vagas disponíveis, aceite de animais e acessibilidade PCD
- Ver as necessidades de cada abrigo (itens para doação)
- Cadastrar um novo abrigo (fica pendente até aprovação do admin)

### 🔒 Acesso Administrativo (admin com login)
- Aprovar ou rejeitar abrigos cadastrados pelo público
- Editar informações dos abrigos
- Atualizar vagas disponíveis em tempo real
- Registrar e gerenciar necessidades (itens urgentes) de cada abrigo
- Painel com visão geral de todos os abrigos e estatísticas

### Diferenciais do sistema
- **Aprovação obrigatória** — nenhum abrigo aparece sem validação do admin, garantindo confiabilidade
- **Atualização de vagas em tempo real** — o status muda automaticamente para "lotado" quando vagas chegam a zero
- **Autenticação segura** — senha com bcrypt (cost 12) e tokens JWT com expiração configurável
- **Banco de dados com histórico** — triggers registram automaticamente toda alteração de vagas

---

## 4 - Estrutura do Sistema

### 🖥️ Front-end

**Tecnologia:** React 18 + CSS puro + Axios  
**Deploy:** Vercel

```
src/
├── App.jsx                  # Componente raiz com navegação e menu responsivo
├── App.css                  # Estilos globais com tema azul profundo
├── index.js                 # Entrada da aplicação
├── context/
│   └── AuthContext.jsx      # Estado global de autenticação (token JWT)
├── pages/
│   ├── Home.jsx             # Página inicial com estatísticas em tempo real
│   ├── Abrigos.jsx          # Listagem com filtros e cadastro público
│   ├── AbrigoDetalhe.jsx    # Detalhes do abrigo e necessidades (somente leitura)
│   ├── Necessidades.jsx     # Lista geral de necessidades por urgência
│   ├── Login.jsx            # Tela de login administrativo
│   └── Admin.jsx            # Painel admin com 4 abas
├── components/
│   ├── CardAbrigo.jsx       # Card reutilizável com barra de ocupação
│   └── FormAbrigo.jsx       # Formulário de cadastro de abrigo
└── services/
    └── api.js               # Integração com a API via Axios
```

**Páginas principais:**
- **Início** — estatísticas gerais (total de abrigos, vagas disponíveis, lotados, capacidade)
- **Abrigos** — listagem com filtros e formulário de cadastro público
- **Necessidades** — itens necessários ordenados por urgência (crítica → baixa)
- **Painel Admin** — aprovação de pendentes, edição, gerenciamento de necessidades e alterar senha

---

### ⚙️ Back-end

**Tecnologia:** Node.js + Express + bcrypt + jsonwebtoken  
**Deploy:** Render

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

**Endpoints da API:**

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| `POST` | `/api/auth/login` | Público | Login do admin |
| `GET` | `/api/auth/perfil` | Admin | Dados do admin logado |
| `POST` | `/api/auth/alterar-senha` | Admin | Altera senha |
| `GET` | `/api/abrigos` | Público | Lista abrigos aprovados (com filtros) |
| `GET` | `/api/abrigos/stats` | Público | Estatísticas gerais |
| `GET` | `/api/abrigos/:id` | Público | Busca abrigo por ID |
| `POST` | `/api/abrigos` | Público | Cadastra abrigo (entra como pendente) |
| `PATCH` | `/api/abrigos/:id/aprovar` | Admin | Aprova ou revoga abrigo |
| `PUT` | `/api/abrigos/:id` | Admin | Atualiza abrigo completo |
| `PATCH` | `/api/abrigos/:id/vagas` | Admin | Atualiza vagas disponíveis |
| `DELETE` | `/api/abrigos/:id` | Admin | Remove abrigo |
| `GET` | `/api/necessidades` | Público | Lista necessidades (com filtros) |
| `POST` | `/api/necessidades` | Admin | Registra necessidade |
| `DELETE` | `/api/necessidades/:id` | Admin | Marca necessidade como atendida |

**Variáveis de ambiente:**
```env
DATABASE_URL=postgresql://...   # URL do banco (Render fornece automaticamente)
JWT_SECRET=chave_secreta_longa  # Chave para assinar os tokens JWT
JWT_EXPIRES_IN=8h               # Tempo de expiração do token
NODE_ENV=production
```

---

### 🗄️ Banco de Dados

**Tecnologia:** PostgreSQL  
**Deploy:** Render (PostgreSQL gerenciado)

**Tabelas:**

#### `admins`
Administradores do sistema com senha criptografada via bcrypt.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | SERIAL PK | Identificador único |
| `nome` | VARCHAR | Nome do administrador |
| `email` | VARCHAR UNIQUE | Email de acesso |
| `senha_hash` | VARCHAR | Senha com bcrypt (cost 12) |
| `criado_em` | TIMESTAMP | Data de criação |

#### `abrigos`
Dados completos de cada abrigo com controle de aprovação e vagas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | SERIAL PK | Identificador único |
| `nome` | VARCHAR | Nome do abrigo |
| `endereco` | VARCHAR | Endereço completo |
| `cidade` | VARCHAR | Cidade |
| `estado` | VARCHAR(2) | Estado (padrão: RS) |
| `telefone` | VARCHAR | Contato |
| `responsavel` | VARCHAR | Nome do responsável |
| `capacidade_total` | INTEGER | Total de vagas |
| `vagas_disponiveis` | INTEGER | Vagas disponíveis agora |
| `aceita_animais` | BOOLEAN | Aceita animais de estimação |
| `aceita_pcd` | BOOLEAN | Acessível para PCD |
| `tem_banheiro` | BOOLEAN | Possui banheiro |
| `tem_alimentacao` | BOOLEAN | Fornece alimentação |
| `observacoes` | TEXT | Informações adicionais |
| `status` | VARCHAR | `ativo`, `lotado` ou `inativo` |
| `aprovado` | BOOLEAN | Aprovado pelo admin |
| `aprovado_em` | TIMESTAMP | Data de aprovação |
| `aprovado_por` | FK → admins | Admin que aprovou |
| `criado_em` | TIMESTAMP | Data de criação |
| `atualizado_em` | TIMESTAMP | Última atualização (trigger) |

#### `necessidades`
Itens que cada abrigo precisa receber como doação.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | SERIAL PK | Identificador único |
| `abrigo_id` | FK → abrigos | Abrigo relacionado |
| `item` | VARCHAR | Item necessário |
| `quantidade` | INTEGER | Quantidade necessária |
| `urgencia` | VARCHAR | `baixa`, `media`, `alta` ou `critica` |
| `criado_em` | TIMESTAMP | Data de criação |

#### `historico_vagas`
Registro automático de todas as alterações de vagas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | SERIAL PK | Identificador único |
| `abrigo_id` | FK → abrigos | Abrigo relacionado |
| `vagas_anteriores` | INTEGER | Vagas antes da alteração |
| `vagas_novas` | INTEGER | Vagas após a alteração |
| `alterado_em` | TIMESTAMP | Momento da alteração |

**Triggers:**
- `atualizar_timestamp` — atualiza `atualizado_em` automaticamente a cada modificação
- `registrar_historico_vagas` — registra toda alteração de vagas em `historico_vagas`

---

## 5 - Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+

### Banco de Dados
```bash
sudo -u postgres psql -c "CREATE DATABASE abrigos_db;"
sudo -u postgres psql -d abrigos_db -f src/db/schema.sql
```

### Back-end
```bash
cp .env.example .env
# Edite o .env com suas credenciais
npm install
npm run dev
# Servidor em http://localhost:3001
```

### Front-end (repositório separado)
```bash
npm install
npm start
# Aplicação em http://localhost:3000
```

---

## 6 - Documentação da API (Postman)

Acesse a documentação completa online: **[https://documenter.getpostman.com/view/47434037/2sBXqGr2Nt](https://documenter.getpostman.com/view/47434037/2sBXqGr2Nt)**

Ou importe o arquivo `AbrigosRS.postman_collection.json` localmente no Postman.

**Como importar:**
1. Abra o Postman
2. Clique em **Import**
3. Selecione o arquivo `AbrigosRS.postman_collection.json`
4. Todos os endpoints estarão prontos com exemplos de corpo e headers

**Credenciais para teste:**
```
Email: admin@abrigosrs.com
Senha: admin123
```

---

## 7 - Tecnologias Utilizadas

| Camada | Tecnologia |
|--------|-----------|
| Front-end | React 18 + CSS puro |
| HTTP Client | Axios |
| Back-end | Node.js + Express |
| Autenticação | JSON Web Token (JWT) |
| Criptografia | bcrypt (cost 12) |
| Banco de dados | PostgreSQL |
| Deploy Front-end | Vercel |
| Deploy Back-end | Render |

---

## 8 - Segurança

- Senhas criptografadas com **bcrypt** (cost factor 12)
- Autenticação via **JWT** com expiração de 8 horas
- Rotas administrativas protegidas por middleware de autenticação
- Variáveis sensíveis isoladas em `.env` (nunca sobem para o GitHub)
- SSL obrigatório na conexão com o banco em produção
- Abrigos cadastrados pelo público passam por **aprovação manual** antes de aparecer no site
