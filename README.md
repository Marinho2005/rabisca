# Rabisca

Jogo de desenho e adivinhação em tempo real, inspirado no Gartic. É 100% frontend: não há backend próprio, banco de dados nem tabelas. A sincronização usa apenas **Supabase Realtime** com **Broadcast + Presence**.

## Stack

- Vite + React (JavaScript)
- `@supabase/supabase-js`
- Zustand para o estado global
- CSS puro, responsivo
- Sem Next.js, Redux ou roteador. A sala atual fica em `?sala=CODIGO` via `URLSearchParams`.

## Como rodar

Pré-requisitos: Node.js 20+ e um projeto no Supabase.

```bash
npm install
cp .env.example .env
npm run dev
```

Abra o endereço mostrado pelo Vite. Para testar com mais jogadores, abra outras abas ou use outro dispositivo/rede.

### Variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_sua_chave_aqui
```

Use a chave **publishable** (`sb_publishable_...`) do Supabase. Nunca coloque a `secret key` ou a `service_role` no frontend: tudo que começa com `VITE_` é embutido no bundle e fica público.

O Realtime já vem habilitado por padrão no Supabase. Não é necessário criar tabelas, buckets, funções ou políticas RLS. O app usa somente canais efêmeros `room:CODIGO`.

## Scripts

```bash
npm run dev      # ambiente de desenvolvimento
npm run build    # build de produção em dist/
npm run preview  # prévia do build
npm run lint     # oxlint
```

## Como jogar

1. Crie uma sala ou entre com um código de 6 caracteres.
2. Escolha um apelido (máximo de 16 caracteres). Apelidos repetidos recebem sufixo: `Ana`, `Ana2`.
3. O host inicia a partida com pelo menos 2 jogadores.
4. Cada jogador desenha uma vez por volta. O host pode configurar de 1 a 3 voltas e 60/75/90 segundos por rodada.
5. Quem acerta mais cedo ganha mais pontos. O desenhista também pontua por cada acerto.
6. Ao final, o host pode reiniciar a partida, voltando ao lobby.

## Funcionalidades

- Código de sala gerado com `crypto.getRandomValues`, sem caracteres ambíguos.
- Link compartilhável (`?sala=CODIGO`).
- Presence em tempo real, limite de 8 jogadores, host automático pelo menor `entrouEm` e failover se o host sair.
- Sala trancada durante a partida. Reconexões de jogadores que já participavam são aceitas.
- Desenho com Pointer Events (mouse, toque e caneta), cores, espessura, borracha e limpar.
- Traços normalizados de 0 a 1 e enviados em lotes (~50 ms), não a cada pixel.
- Histórico de traços para quem reconecta no meio da rodada.
- Palpites comparados sem maiúsculas e sem acentos (`normalize('NFD')`).
- A palavra só é enviada ao desenhista por Broadcast direcionado; os demais veem apenas os traços da dica.
- Snapshot do estado enviado pelo host em mudanças importantes e a cada segundo, permitindo sincronização e failover.
- Reconexão automática do canal com aviso visual.
- Limpeza de canal e listeners ao sair.

## Arquitetura

```text
┌──────────────────────────────┐
│ Navegador do host            │
│                              │
│ Zustand  ───────────────┐    │
│ useRoom (canal, Presence,│    │
│ host, Broadcast)         │    │
│ Canvas + telas           │    │
└──────────────┬───────────┘    │
               │ Broadcast + Presence
               ▼
┌──────────────────────────────────────────┐
│ Supabase Realtime                        │
│ canal: room:ABC234                       │
│                                          │
│ Presence: { id, nome, entrouEm }         │
│ Broadcast: estado, palavra, palpite,     │
│ chat, traco, limpar, historico, config   │
│                                          │
│ Nenhuma tabela, nenhum backend próprio   │
└──────────────┬───────────────────────────┘
               │
     ┌─────────┴──────────┬───────────────┐
     ▼                    ▼               ▼
┌──────────────┐   ┌──────────────┐  ┌──────────────┐
│ Navegador B  │   │ Navegador C  │  │ Navegador D  │
│ cliente normal│  │ cliente normal│  │ cliente normal│
└──────────────┘   └──────────────┘  └──────────────┘
```

### Autoridade do host

O host é o cliente com o menor `entrouEm` na Presence. Ele é a autoridade da partida:

- sorteia a palavra;
- envia a palavra apenas ao desenhista;
- controla a ordem dos desenhistas, o temporizador e a transição de rodadas;
- recebe palpites, compara as respostas, calcula pontos e distribui o resultado;
- publica snapshots com rodada, desenhista, placar, tempo restante e status.

Os demais clientes apenas renderizam o estado recebido e enviam palpites/traços. Se o host sair, o próximo jogador assume automaticamente e continua a partir do último snapshot. O novo host tenta recuperar a palavra atual diretamente com o desenhista.

### Estrutura

```text
src/
  screens/      Home, Nickname, Lobby, Game, Results, Erro
  components/   Canvas, PlayerList, Chat, Timer
  hooks/        useRoom (canal, presence, host, broadcast)
  lib/          supabase, roomCode, words, normalize, game, playerId
  store/        useStore (Zustand)
  App.jsx
  main.jsx
```

## Deploy

O build é estático. Configure as duas variáveis de ambiente no painel do provedor antes do build, pois o Vite as incorpora ao bundle.

### Vercel

1. Importe o repositório.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em Environment Variables.

### Netlify

1. Importe o repositório.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Adicione as duas variáveis em Site settings → Environment variables.

### Cloudflare Pages

1. Conecte o repositório.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Build output directory: `dist`.
5. Adicione as variáveis em Settings → Environment variables.

Não há rotas de servidor: a sala é um query parameter (`/?sala=ABC234`), então não é necessário configurar rewrites de SPA.

## Limitações conhecidas

Este projeto foi feito para jogar com amigos, não para ser à prova de trapaça.

- **Canais públicos:** qualquer pessoa com o código da sala pode entrar se houver vaga. Não há autenticação, senha ou moderação.
- **Host como autoridade:** o host roda a lógica no navegador. Um cliente malicioso pode enviar mensagens falsas de estado, palpite ou traço; a integridade depende de os clientes seguirem o protocolo.
- **A palavra trafega no canal:** ela é enviada apenas ao desenhista via Broadcast direcionado, mas o payload pode ser lido no DevTools por um jogador avançado. Broadcast não é criptografia nem controle de acesso.
- **Sem persistência:** não existem tabelas. Se todos saírem, a sala deixa de existir; chat, desenho e placar não são recuperados depois que o host encerra.
- **Failover limitado:** o novo host usa o último snapshot. Se a palavra atual não puder ser recuperada do desenhista (por exemplo, os dois caíram), a rodada pode ser encerrada sem a palavra correta.
- **Histórico em memória:** o histórico de traços fica no host. Um host que recarrega a página pode não recuperar o desenho em andamento.
- **Timers no navegador:** o temporizador roda no host. Suspender a aba ou perder a conexão no meio da rodada pode atrasar o relógio até a reconexão.
- **Rate limits no cliente:** os limites de envio de palpites e traços reduzem spam, mas podem ser burlados por quem controla o cliente.
- **Remoção de jogador:** o host envia uma mensagem de expulsão; o cliente removido obedece. Não há banimento no servidor.
- **Sem antifraude/antiplágio:** respostas iguais, colas por chamada de voz e inspeção do tráfego não são detectadas.

## Segurança

- O frontend usa somente a chave publishable, que é feita para ser pública.
- Jamais use `service_role` ou secret key no `.env` do Vite.
- O `.env` está no `.gitignore`; apenas `.env.example` deve ser versionado.
