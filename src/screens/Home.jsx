import { useState } from 'react'
import { useStore } from '../store/useStore'
import { supabaseConfigurado } from '../lib/supabase'
import { Brand } from '../components/Brand'
import { DottedCircleDeco, SquiggleDeco, StarDeco } from '../components/Decor'
import {
  codigoValido,
  gerarCodigoSala,
  normalizarCodigoSala,
  atualizarUrlSala,
} from '../lib/roomCode'

function CasaExemplo() {
  return (
    <svg
      width="100%"
      viewBox="0 0 386 270"
      role="img"
      aria-label="Desenho de uma casa com sol feito à mão"
      className="sketch-drawing"
    >
      <circle
        cx="316"
        cy="56"
        r="26"
        fill="none"
        stroke="#E7A800"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M316 12 V2 M316 100 V110 M272 56 H262 M360 56 H370"
        stroke="#E7A800"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M70 128 L150 66 L230 128"
        fill="none"
        stroke="#D4432B"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M88 118 V218 H212 V118"
        fill="none"
        stroke="#2F5FD0"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M134 218 V170 H166 V218"
        fill="none"
        stroke="#1F8A5B"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30 236 C 100 226, 200 246, 356 232"
        fill="none"
        stroke="#1F8A5B"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Home() {
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')

  function prepararEntrada(modo, valor) {
    const codigoFinal =
      modo === 'criar' ? gerarCodigoSala() : normalizarCodigoSala(valor)

    if (!codigoValido(codigoFinal)) {
      setErro('Digite um código de sala válido com 6 caracteres.')
      return
    }

    atualizarUrlSala(codigoFinal)
    useStore.setState({
      pendingCode: codigoFinal,
      roomCode: codigoFinal,
      modo,
      screen: 'nickname',
      erro: '',
    })
  }

  function entrar(evento) {
    evento.preventDefault()
    prepararEntrada('entrar', codigo)
  }

  return (
    <main className="screen home">
      <StarDeco className="home-star" />
      <SquiggleDeco className="home-squiggle" />
      <DottedCircleDeco className="home-circle" />

      <div className="home-left">
        <div className="home-brand">
          <Brand />
          <svg
            aria-hidden="true"
            width="260"
            height="14"
            viewBox="0 0 260 14"
            className="brand-underline"
          >
            <path
              d="M3 8 C 20 0, 30 14, 48 7 S 78 0, 96 7 S 126 14, 144 7 S 174 0, 192 7 S 222 14, 257 5"
              fill="none"
              stroke="#D4432B"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <p className="tagline">
          Desenhe, chute e descubra a palavra com a galera. Sem cadastro, sem
          complicação.
        </p>

        {!supabaseConfigurado && (
          <div className="alert warning">
            Configure o arquivo <code>.env</code> com{' '}
            <code>VITE_SUPABASE_URL</code> e{' '}
            <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> para jogar.
          </div>
        )}

        <form className="card home-form" onSubmit={entrar}>
          <label htmlFor="codigo-sala">Código da sala</label>
          <div className="join-row">
            <input
              id="codigo-sala"
              className="code-input"
              value={codigo}
              onChange={(evento) => {
                setCodigo(normalizarCodigoSala(evento.target.value))
                setErro('')
              }}
              placeholder="ABC234"
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              autoFocus
            />
            <button
              type="submit"
              className="button primary"
              disabled={!supabaseConfigurado}
            >
              Entrar
            </button>
          </div>

          <div className="or">
            <i aria-hidden="true" />
            ou
            <i aria-hidden="true" />
          </div>

          <button
            type="button"
            className="button secondary wide"
            onClick={() => prepararEntrada('criar')}
            disabled={!supabaseConfigurado}
          >
            Criar sala nova
          </button>

          {erro && <p className="form-error">{erro}</p>}

          <p className="hint">
            Até 8 jogadores por sala. Compartilhe o código.
          </p>
        </form>
      </div>

      <div className="sketch" aria-hidden="true">
        <div className="card sketch-card">
          <div className="sketch-top">
            <span className="pill pill-ink">Rodada 2/6</span>
            <span className="sketch-timer">0:42</span>
          </div>
          <CasaExemplo />
          <div className="sketch-word">_ _ _ _</div>
        </div>

        <div className="chip chip-guess">
          <span className="chip-avatar">B</span>
          é uma casa!
        </div>
        <div className="chip chip-win">Ana acertou! +120</div>
      </div>
    </main>
  )
}
