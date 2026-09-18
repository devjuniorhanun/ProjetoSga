# SISDEVE AGRO — Projeto completo recriado

Projeto consolidado com backend Laravel 13, infraestrutura Docker, MySQL 8.4, Redis 7.4, backup automático do MySQL, gateway Nginx HTTPS e phpMyAdmin. A pasta `front/` permanece vazia/preparada para receber o frontend React/TypeScript do Lovable.dev.

## Estrutura

- `back/` — Laravel 13 API, migrations, models, requests, resources, controllers, services, testes e documentação das fases.
- `front/` — aplicação React/TypeScript do Lovable.dev.
- `infra/nginx/` — gateway HTTPS; somente o gateway publica a porta 443.
- `infra/backup/` — backup automático do MySQL.
- `backups/mysql/` — arquivos de backup.
- `certs/` — certificado HTTPS local.
- `compose.yaml` — frontend-build, gateway, API, MySQL, Redis, phpMyAdmin e backup.

## Serviços

| Serviço | Função | Exposição |
|---|---|---|
| `gateway` | Nginx HTTPS + frontend + proxy API/phpMyAdmin | `HTTPS_BIND_IP:443` |
| `api` | Laravel 13 / PHP-FPM | somente Docker |
| `mysql` | MySQL 8.4 | `127.0.0.1:3306` para Workbench |
| `redis` | Redis 7.4 | somente rede privada |
| `phpmyadmin` | Administração do MySQL | somente via `/phpmyadmin/` |
| `mysql-backup` | Backup automático | somente rede privada |

## Redes

- `edge`: gateway, API e serviços que precisam ser alcançados pelo gateway.
- `private`: rede interna para API, MySQL, Redis, backup e phpMyAdmin.
- Somente o gateway possui exposição HTTPS externa.
- O MySQL é publicado apenas em `127.0.0.1:3306` para administração local.

## phpMyAdmin

Acesse:

```text
https://SEU_IP/phpmyadmin/
```

O serviço usa a imagem oficial `phpmyadmin:5.2.3-apache`, sem `ports:` próprio. O Nginx encaminha `/phpmyadmin/` internamente para `phpmyadmin:80`.

Credenciais: utilize `MYSQL_USER`/`MYSQL_PASSWORD` ou o usuário root definido no `.env`.

## Instalação

1. Configure o IP da máquina no `.env`:

```env
HTTPS_BIND_IP=192.168.1.100
APP_URL=https://192.168.1.100
SANCTUM_STATEFUL_DOMAINS=192.168.1.100
```

2. Execute:

```bash
cp .env.example .env
./scripts/setup.sh
```

3. Execute as migrations:

```bash
docker compose exec api php artisan migrate
```

4. Verifique:

```bash
docker compose ps
docker compose exec api php artisan route:list
docker port sisdeveagro-mysql
```

O MySQL deve aparecer como:

```text
3306/tcp -> 127.0.0.1:3306
```

## MySQL Workbench

- Host: `127.0.0.1`
- Port: `3306`
- User: valor de `MYSQL_USER`
- Password: valor de `MYSQL_PASSWORD`
- Schema: valor de `MYSQL_DATABASE`

No Laravel, a conexão continua usando `DB_HOST=mysql`.

## Frontend Lovable.dev

Coloque o projeto React/TypeScript exportado pelo Lovable em `front/`. Depois execute:

```bash
docker compose run --rm frontend-build
docker compose restart gateway
```

## Fases consolidadas

- Fase 1 — autenticação, usuários, papéis e Sanctum.
- Fase 2 — configurações e entidades agrícolas.
- Fase 3 — propriedades, fornecedores, frota, produtos e centros.
- Fase 4 — importação de dados legados CSV.
- Fase 5 — ordens de serviço de defensivos e tanques de operadores.
- Fase 6 — combustíveis, lubrificantes, postos, tanques, registradoras, régua, estoque, abastecimentos, consumo e manutenção.
- Organização atual — módulo de Defensivos em `Registrations/Agricultural/Defensive` e lançamentos em `Releases/Agricultural/Services/Defensive`.

## Fornecedores e tipos de fornecedor

`Supplier` possui relacionamento N:N com `TypeSupplier`. O formulário pode enviar:

```json
{"typeSuppliers":[1,2,3]}
```

No cadastro/edição, os vínculos são sincronizados. A importação de `armazems.csv`, `colhedors.csv` e `motoristas.csv` também associa os tipos correspondentes ao fornecedor.

## OperationDefensive / TypeOperation

O cadastro de tipos de operações de defensivos está organizado em:

```text
Registrations\\Agricultural\\Defensive\\OperationDefensive
Registrations\\Agricultural\\Defensive\\TypeOperation
```

`TypeOperation` possui `operation_defensive_id` como relacionamento com `OperationDefensive`.

## MatrixFreight

`MatrixFreightResource` expõe `price` usando o valor original persistido:

```php
'price' => $this->resource->getRawOriginal('price'),
```

## Verificação das migrations

As migrations devem manter nomes explícitos e curtos para constraints/índices quando necessário, respeitando o limite de identificadores do MySQL.
