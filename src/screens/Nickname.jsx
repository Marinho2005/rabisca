import { useState } from 'react'
import { useStore } from '../store/useStore'
import { useRoomContext } from '../hooks/useRoom'

const CHAVE_APELIDO = 'rabisca:apelido'

export default function Nickname() {
  const { entrar, sairDaSala } = useRoomContext()
  const pendingCode = useStore((state) => state.pendingCode)
  const modo = useStore((state) => state.modo)
  const connecting = useStore((state) => state.connecting)
  const [nome, setNome] = useState(
    () => localStorage.getItem(CHAVE_APELIDO) || '',
  )
  const [erro, setErro] = useState('')

  function enviar(evento) {
    evento.preventDefault()
    const limpo = nome.trim().slice(0, 16)
    if (!limpo) {
      setErro('Escolha um apelido para continuar.')
      return
    }
    localStorage.setItem(CHAVE_APELIDO, limpo)
    setErro('')
    entrar({ codigo: pendingCode, nome: limpo, modo })
  }

  return (
    <main className="screen center-screen">
      <section className="card narrow-card">
        <button
          type="button"
          className="text-button back-button"
          onClick={sairDaSala}
          disabled={connecting}
        >
          Voltar
        </button>

        <div className="screen-heading">
          <p className="eyebrow">
            {modo === 'criar' ? 'Nova sala' : 'Entrando na sala'}
          </p>
          <div className="room-chip" title="Código da sala">
            {pendingCode}
          </div>
          <h1>Qual é o seu apelido?</h1>
          <p className="muted">
            Seu nome aparece para os outros jogadores. Máximo de 16 caracteres.
          </p>
        </div>

        <form onSubmit={enviar} className="stack">
          <label htmlFor="apelido">Apelido</label>
          <input
            id="apelido"
            type="text"
            value={nome}
            onChange={(evento) => {
              setNome(evento.target.value.slice(0, 16))
              setErro('')
            }}
            maxLength={16}
            placeholder="Ex.: Ana"
            autoComplete="nickname"
            autoFocus
            disabled={connecting}
          />
          <div className="input-hint">
            <span>{nome.length}/16</span>
          </div>

          {erro && <p className="form-error">{erro}</p>}

          <button
            type="submit"
            className="button primary wide"
            disabled={connecting}
          >
            {connecting ? 'Entrando...' : modo === 'criar' ? 'Criar sala' : 'Entrar na sala'}
          </button>
        </form>

        <p className="muted small">
          Apelidos repetidos recebem um número automaticamente.
        </p>
      </section>
    </main>
  )
}
