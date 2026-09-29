# RioCard Planner

Aplicação atual React 19 + Vite + TanStack Start. A interface e o servidor Node/TypeScript rodam juntos; o backend implementa `/api/*` e conecta ao PostgreSQL. O navegador nunca recebe credenciais do banco.

## Requisitos

- Node.js 22.x e npm.
- PostgreSQL local em `localhost:5432`.
- Banco `riocard` e usuário `riocard_user`.

## Configurar PostgreSQL no Fedora

Verifique antes se a instância já contém o banco e o usuário. Estes comandos não removem nem sobrescrevem banco existente:

```sh
sudo -u postgres psql -c "SELECT datname FROM pg_database WHERE datname = 'riocard';"
sudo -u postgres psql -c "SELECT rolname FROM pg_roles WHERE rolname = 'riocard_user';"
```

Se não existirem, crie o usuário e o banco. Escolha a senha no prompt protegido de `\\password` (não a inclua neste repositório):

```sh
sudo -u postgres createuser --login riocard_user
sudo -u postgres psql -c "CREATE DATABASE riocard OWNER riocard_user;"
sudo -u postgres psql -c "\\password riocard_user"
```

O usuário não recebe privilégios globais como `CREATEDB`; o banco criado pertence a ele. Se o banco/role já existirem, não execute o comando de criação correspondente. Não são usados comandos destrutivos.

Se `npm run db:check` responder `autenticação do tipo Ident falhou`, a instância local está configurada para autenticação ident em TCP e não aceitará a senha do `.env`. Confira o arquivo com `SHOW hba_file;` em uma sessão administrativa do PostgreSQL; ajuste somente as regras locais `127.0.0.1/32` e `::1/128` para `scram-sha-256`, defina/redefina a senha da role com o comando protegido `\\password riocard_user` e recarregue a configuração com `SELECT pg_reload_conf();`. Não exponha o servidor em interfaces de rede públicas.

## Ambiente

Na raiz do projeto:

```sh
cp .env.example .env
```

Preencha `DB_PASSWORD` com a senha local. `.env` está ignorado pelo Git. O servidor lê `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD`. Opcionalmente, use `DATABASE_URL` em vez dessas variáveis; se definida, tem precedência. Nunca use prefixo `VITE_` para credenciais.

## Schema, roles e migração opcional

Inicialize as tabelas e as roles `client`/`admin`:

```sh
npm run db:init
npm run db:check
```

O schema é idempotente e não apaga dados: [database/schema.sql](database/schema.sql), com seed em [database/seed.sql](database/seed.sql). Para migrar contas/dados do antigo arquivo privado `.data/riocard-shared.json`, execute opcionalmente:

```sh
npm run db:import-legacy
```

A importação preserva o arquivo antigo, transforma as senhas em bcrypt e copia os dados do planejador. Como contas antigas não tinham email, recebem um identificador técnico `celular@legacy.invalid`; podem continuar autenticando com celular. Revise o resultado antes de arquivar o antigo JSON. Contas salvas somente no navegador não são enviadas automaticamente, pois não existe senha recuperável nelas.

## Instalar e iniciar

```sh
npm install
npm run dev
```

O comando inicia Vite/TanStack Start em modo desenvolvimento e serve frontend e API no mesmo host (normalmente `http://localhost:3000`; use a URL informada pelo Vite). O backend API existente é `src/server.ts`; não há `server.py` nem serviço Python separado.

Para build/preview:

```sh
npm run build
npm run preview
```

## Publicar no GitHub e Render

1. Revise `git status` e confirme que `.env`, `.env.neon`, `.neon` e `.data/` não aparecem entre os arquivos a enviar. Eles estão no `.gitignore`; nunca adicione connection strings, senhas ou hashes em commits. O arquivo [.env.example](.env.example) contém apenas nomes de variáveis.
2. Crie um repositório GitHub vazio, adicione-o como remoto e envie a branch `main`. A GitHub Action [.github/workflows/ci.yml](.github/workflows/ci.yml) executará `npm ci`, lint e build em cada push/PR. Revise `git status` antes de enviar; não inclua `.env` nem faça commit da pasta `.data`.
3. No Render, escolha **New → Blueprint** (ou **New → Web Service**) e conecte o repositório. O [render.yaml](render.yaml) define um Web Service Node na região Ohio, build `npm ci && npm run build`, start `npm start`, e health check `/api/health`.
4. No primeiro provisionamento, o Blueprint pedirá `DATABASE_URL`. Copie a URL **pooled** (`DATABASE_URL`, não `DATABASE_URL_UNPOOLED`) do Neon e cadastre-a como secret do serviço Render. Não a coloque no código, GitHub ou frontend. O serviço usa a mesma região AWS Ohio do Neon.
5. Aguarde o deploy ficar **Live**, depois abra o domínio `onrender.com` fornecido e confirme que a página carrega. `/api/health` verifica que o processo HTTP está ativo sem manter o compute gratuito do Neon acordado por sondagens periódicas. `/api/ready` verifica também a conexão PostgreSQL quando for necessário testar a prontidão do banco.

O projeto fixa Node 22 em [.node-version](.node-version) e declara a faixa suportada no `package.json`. O Render configura `HOST=0.0.0.0` e injeta `PORT`; cookies de login recebem `Secure` no HTTPS atrás do proxy do Render.

O Blueprint está configurado no plano gratuito para facilitar uma primeira publicação. O plano grátis do Render pode suspender o serviço após 15 minutos sem tráfego, demora para despertar e é destinado a testes/hobby; o próprio Render também alerta sobre suspensão em caso de tráfego externo intenso. O plano gratuito Neon também tem limites de uso. Para disponibilidade contínua, mude o serviço Render para um plano pago no painel. O banco permanece no Neon e não é recriado pelo Blueprint.

## Autenticação, dados e roles

- `POST /api/auth/register`: nome, email, celular e senha; cadastro público sempre recebe `client`.
- `POST /api/auth/login`: email ou celular e senha.
- `POST /api/auth/logout` e `GET /api/auth/me`.
- `GET /api/auth/check-email` e `/api/auth/check-phone` para feedback de duplicidade.
- `GET/POST /api/user-data`: somente o usuário autenticado, associado no backend ao seu próprio `users.id`.
- `GET /api/admin/users`, `GET/PUT/DELETE /api/admin/users/:id`: autenticação e role admin verificadas no backend em cada chamada.

As sessões usam token aleatório em cookie `HttpOnly`, `SameSite=Strict`, com hash do token persistido na tabela `sessions`; o token não fica em `localStorage`. Senhas são hasheadas com bcrypt. A primeira role admin deve ser concedida a uma conta cadastrada por comando local do operador:

```sh
npm run db:promote-admin -- admin@exemplo.com
```

O painel administrativo aparece no menu de uma conta admin. Ocultar a interface não é considerado autorização: o servidor valida a role.

## Testes manuais

1. `npm run db:check` confirma usuário, banco, tabelas e roles.
2. Com `npm run dev`, cadastre nome, email, celular de 11 dígitos e senha com ao menos 8 caracteres; os registros aparecem nas tabelas `users`, `sessions` e `user_data`.
3. Saia e teste login com credenciais corretas; senha incorreta/email inexistente devem retornar 401. `GET /api/auth/me` deve retornar o usuário quando o cookie está válido.
4. Ao salvar cartões/configurações, confira `user_data` no PostgreSQL. Os dados são carregados após recarregar o navegador; a sessão sobrevive conforme o prazo do cookie.
5. Para testar client sem interface, uma chamada a `/api/admin/users` sem sessão deve retornar 401; com sessão client deve retornar 403.
6. Cadastre a conta destinada ao administrador, execute `db:promote-admin` com o email cadastrado, entre novamente e abra Administração. A listagem deve funcionar só para essa role. Um client não vê o menu e não pode usar a API administrativa.
7. Reinicie o servidor e confirme que usuários, dados e sessões válidas permanecem no PostgreSQL.

Para conferência SQL:

```sh
psql -h localhost -U riocard_user -d riocard -c "SELECT id, name, email, celular, role_id, created_at FROM users;"
psql -h localhost -U riocard_user -d riocard -c "SELECT name, description FROM roles ORDER BY id;"
psql -h localhost -U riocard_user -d riocard -c "SELECT user_id, updated_at FROM user_data;"
```

Também é possível rodar o smoke test HTTP contra o backend já iniciado (`npm start`):

```sh
TEST_PASSWORD='escolha-uma-senha-temporaria-forte' npm run test:api
```

O teste cria `teste@example.com` se ainda não existir, grava dados de exemplo e deixa essa conta como `client`; os cookies/sessões temporários são removidos ao fim. Se esse email já existir, o script para sem modificar a conta. Guarde a senha escolhida apenas para testes locais e troque-a antes de qualquer uso real.

Não use uma senha real em comandos salvos no histórico do shell. As verificações automatizadas do workspace cobrem build/lint; testes de integração dependem do PostgreSQL local estar iniciado e configurado.
