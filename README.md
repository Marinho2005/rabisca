<div align="center">

# 🎨 Rabisca

**Jogo multiplayer de desenho e adivinhação em tempo real estilo Gartic / Skribbl.io**  
*100% Frontend • Zero Backend • Sem Tabelas • Supabase Realtime*

[![React 19](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand-764abc?style=for-the-badge)](https://zustand-demo.pmnd.rs/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://rabisca-three.vercel.app)
[![License MIT](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)](LICENSE)

🎮 **[JOGAR AGORA ONLINE](https://rabisca-three.vercel.app)** • [Como Rodar](#-como-rodar-localmente) • [Arquitetura](#-arquitetura) • [Deploy](#-deploy-rápido)

</div>

---

## ✨ Destaques

- 🖌️ **Canvas Sincronizado**: Suporte total a **Pointer Events** (mouse, touch no celular e caneta stylus), coordenadas normalizadas `[0..1]` para telas de qualquer tamanho, envio em lotes de ~50ms, paleta de cores, espessuras e borracha.
- ⚡ **Zero Tabelas / Sem Banco**: Funciona inteiramente sobre canais efêmeros do Supabase Realtime (**Presence** para descoberta de jogadores e **Broadcast** para sincronização de traços e palpites).
- 👑 **Host Autônomo com Failover**: O jogador mais antigo na sala (`menor entrouEm`) orquestra o sorteio da palavra, tempo e validação de palpites. Se o host desconectar, o próximo jogador assume a liderança automaticamente sem derrubar o jogo!
- 🔒 **Palavra Secreta Direcionada**: A palavra sorteada é transmitida exclusivamente ao desenhista via broadcast direcionado. Os adivinhadores recebem apenas a máscara de dicas (`_ _ _ _`).
- 💬 **Chat & Validação Inteligente**: Normalização NFD Unicode para aceitar palpites sem distinguir maiúsculas, minúsculas, acentos ou pontuações (ex: `guarda-chuva` = `guarda chuva`). Acertos corretos não revelam a palavra no chat!
- ⏱️ **Pontuação Dinâmica**: Acertos mais rápidos garantem mais pontos no placar, e o desenhista também pontua a cada acerto da sala.
- 📱 **100% Responsivo**: Interface limpa, moderna e pensada tanto para desktop quanto para celulares.
- 🔗 **Link de Convite Direto**: Salas com códigos seguros de 6 caracteres (`crypto.getRandomValues`) e links compartilháveis via URL (`?sala=CODIGO`).

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- **Node.js 20+** e **npm**
- Projeto gratuito no [Supabase](https://supabase.com) (não é necessário criar nenhuma tabela, apenas ter o projeto ativo)

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Marinho2005/rabisca.git
   cd rabisca
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```
   No `.env`, adicione suas credenciais públicas do Supabase (*Project Settings > API*):
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_sua_chave_aqui
   ```
   > ⚠️ **Atenção:** Use sempre a chave **pública/anon/publishable**. Jamais use a `service_role` ou chave secreta no frontend.

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Abra no seu navegador: [http://localhost:5173](http://localhost:5173).

---

## 🎮 Como Jogar

1. **Criar ou Entrar**: Crie uma sala nova ou digite o código de 6 caracteres compartilhado por um amigo.
2. **Escolha seu Apelido**: Escolha seu nome de jogador (máximo de 16 caracteres). Se houver nomes iguais, o jogo adiciona sufixos automáticos (ex: `Victor`, `Victor2`).
3. **Lobby**: O host aguarda os jogadores entrarem (mínimo de 2, máximo de 8) e pode ajustar a duração da rodada (60s, 75s ou 90s) e número de voltas.
4. **Partida**:
   - Cada jogador assume a vez de desenhar uma vez por rodada.
   - O desenhista usa as ferramentas de lápis, cores e borracha.
   - Os adivinhadores tentam adivinhar no chat.
   - Quem acerta primeiro ganha a pontuação máxima da rodada!
5. **Pódio & Jogar Novamente**: Ao final de todas as voltas, o ranking coroa o grande vencedor e o host pode reiniciar a sala com um clique.

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Finalidade |
| :--- | :--- |
| **React 19** | Biblioteca para construção da interface de usuário reativa |
| **Vite 6** | Bundler ultra-rápido para desenvolvimento e build de produção |
| **@supabase/supabase-js** | Conexão WebSockets em tempo real via Presence & Broadcast |
| **Zustand 5** | Gerenciamento de estado global leve e sem boilerplate |
| **Oxlint** | Linter ultrarrápido em Rust para garantia de qualidade de código |
| **Pure CSS** | Design responsivo, mobile-first e estilizado sem frameworks pesados |

---

## 🏛️ Arquitetura

O **Rabisca** funciona em uma topologia *Host-Authority sobre Mesh Efêmero*, utilizando o Supabase Realtime como relay:

```text
               ┌──────────────────────────────────────┐
               │         Supabase Realtime            │
               │        (Canal: room:CODIGO)          │
               │                                      │
               │   • Presence: { id, nome, entrouEm } │
               │   • Broadcast: traço, palpite, chat, │
               │     palavra (direcionada), snapshots │
               └──────────────────┬───────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Host (Player A)│      │ Client (Player B)│     │ Client (Player C)│
│  ────────────── │      │ ─────────────── │      │ ─────────────── │
│ • Sorteia palavra      │ • Renderiza tela│      │ • Renderiza tela│
│ • Valida palpites      │ • Envia palpites│      │ • Envia palpites│
│ • Controla timer│      │ • Envia traços  │      │ • Envia traços  │
│ • Transmite snapshot   │   (quando desenha)     │   (quando desenha)
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

---

## 📦 Deploy Rápido

O projeto compila em assets 100% estáticos (`dist/`), podendo ser hospedado gratuitamente em qualquer provedor:

### Vercel
1. Conecte seu repositório no dashboard da Vercel.
2. Preset de Framework: **Vite**.
3. Adicione as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Deploy imediato!

### Cloudflare Pages / Netlify
- **Build command:** `npm run build`
- **Output directory:** `dist`
- Configure as variáveis de ambiente no painel do serviço.

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE). Sinta-se livre para jogar, modificar e contribuir!

---

<div align="center">
  Desenvolvido com 💛 por <a href="https://github.com/Marinho2005">Victor Marinho</a>
</div>
