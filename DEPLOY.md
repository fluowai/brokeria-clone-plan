# Deploy — SquadIA (Docker + Portainer)

## 1. Build local
```bash
docker build -t squadia:latest .
docker run --rm -p 3000:3000 --env-file .env squadia:latest
# abra http://localhost:3000
```

## 2. Docker Compose
```bash
cp .env.example .env   # preencha os valores
docker compose up -d --build
docker compose logs -f squadia
```

## 3. Publicar imagem (GHCR / Docker Hub)
```bash
docker tag squadia:latest ghcr.io/SEU_USUARIO/squadia:latest
echo "$GHCR_TOKEN" | docker login ghcr.io -u SEU_USUARIO --password-stdin
docker push ghcr.io/SEU_USUARIO/squadia:latest
```

## 4. Portainer
1. **Registries** → adicione GHCR/Docker Hub se a imagem for privada.
2. **Stacks → Add stack → Web editor** → cole `portainer-stack.yml`.
3. Troque `ghcr.io/SEU_USUARIO/squadia:latest` pelo seu registry.
4. Aba **Environment variables** → preencha:
   - `DOMAIN` (ex.: `app.squadia.com.br`)
   - `LOVABLE_API_KEY`
   - `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`
   - `META_ADS_ACCESS_TOKEN`, `META_ADS_ACCOUNT_ID`
5. **Deploy the stack**.

### Traefik (pré-requisitos no host)
- Rede externa `traefik-public` já criada (`docker network create traefik-public`).
- Traefik com entrypoints `web` (:80) e `websecure` (:443) e certresolver `letsencrypt`.
- Aponte o DNS do domínio (`A`/`AAAA`) para o IP do servidor **antes** do deploy.

### Sem Traefik (porta direta)
Remova o bloco `labels:` e a rede `traefik-public`, e adicione:
```yaml
    ports:
      - "3000:3000"
```

## 5. Atualizar (Portainer)
- **Stacks → squadia → Editor** → `Update the stack` com `Re-pull image` ativado.
- Ou via Watchtower para auto-update por tag.

## 6. Configuração pós-deploy
- **Webhook WhatsApp Meta**: `https://SEU_DOMINIO/api/public/whatsapp/webhook` + `WHATSAPP_VERIFY_TOKEN`.
- **Feeds XML** portais: URLs geradas em `/app/feeds` (gerar e hospedar arquivo estático quando plugar backend).

## 7. Backup
Os dados atuais estão em `localStorage` do navegador (mock). Ao plugar Postgres, adicione um serviço `postgres` no compose e volume `pgdata` para backup.
