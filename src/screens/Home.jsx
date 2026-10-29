import { useState } from 'react'
import { useStore } from '../store/useStore'
import { supabaseConfigurado } from '../lib/supabase'
import {
  codigoValido,
  gerarCodigoSala,
  normalizarCodigoSala,
  atualizarUrlSala,
} from '../lib/roomCode'

export default function Home() {
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')

  function prepararEntrada(modo, valor) {
    const codigoFinal = modo === 'criar' ? gerarCodigoSala() : normalizarCodigoSala(valor)

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
    <main className="screen home-screen">
      <div className="home-decoration home-decoration-a" aria-hidden="true" />
      <div className="home-decoration home-decoration-b" aria-hidden="true" />

      <section className="card home-card">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <h1>Rabisca</h1>
        </div>
        <p className="lead">
          Desenhe, chute e descubra a palavra com os amigos. Sem cadastro, sem
          complicação.
        </p>

        {!supabaseConfigurado && (
          <div className="alert warning">
            Configure o arquivo <code>.env</code> com{' '}
            <code>VITE_SUPABASE_URL</code> e{' '}
            <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> para jogar.
          </div>
        )}

        <form className="home-form" onSubmit={entrar}>
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
            <button type="submit" className="button primary" disabled={!supabaseConfigurado}>
              Entrar
            </button>
          </div>
        </form>

        <div className="divider">
          <span>ou</span>
        </div>

        <button
          type="button"
          className="button secondary wide"
          onClick={() => prepararEntrada('criar')}
          disabled={!supabaseConfigurado}
        >
          Criar sala
        </button>

        {erro && <p className="form-error">{erro}</p>}

        <p className="muted small home-footnote">
          Até 8 jogadores por sala. Compartilhe o código com a galera.
        </p>
      </section>
    </main>
  )
}
