import { useEffect, useRef, useState } from 'react'

export default function Chat({
  mensagens,
  onEnviarPalpite,
  podePalpitar,
  motivoBloqueio,
  status,
}) {
  const [texto, setTexto] = useState('')
  const listaRef = useRef(null)

  useEffect(() => {
    const lista = listaRef.current
    if (lista) lista.scrollTop = lista.scrollHeight
  }, [mensagens])

  function enviar(evento) {
    evento.preventDefault()
    const limpo = texto.trim()
    if (!limpo || !podePalpitar) return
    const enviado = onEnviarPalpite(limpo)
    if (enviado !== false) setTexto('')
  }

  return (
    <section className="panel guesses-panel">
      <div className="panel-title-row">
        <div className="panel-title">Palpites</div>
        <span className="muted small">
          {status === 'playing' ? 'vale pontos' : 'aguarde a rodada'}
        </span>
      </div>

      <div className="chat-messages" ref={listaRef} aria-live="polite">
        {mensagens.length === 0 && (
          <p className="muted small chat-empty">
            Os palpites e avisos da partida aparecem aqui.
          </p>
        )}

        {mensagens.map((mensagem) => {
          if (mensagem.tipo === 'sistema') {
            return (
              <div className="guess guess-system" key={mensagem.id}>
                {mensagem.texto}
              </div>
            )
          }

          if (mensagem.tipo === 'acerto') {
            return (
              <div className="guess ok" key={mensagem.id}>
                {mensagem.texto}
              </div>
            )
          }

          return (
            <div className="guess" key={mensagem.id}>
              <b>{mensagem.autor || 'Jogador'}:</b> {mensagem.texto}
            </div>
          )
        })}
      </div>

      <form className="guess-form" onSubmit={enviar}>
        <label className="sr-only" htmlFor="palpite">
          Seu palpite
        </label>
        <input
          id="palpite"
          type="text"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value.slice(0, 120))}
          placeholder={
            podePalpitar ? 'Seu palpite...' : motivoBloqueio || 'Aguarde...'
          }
          disabled={!podePalpitar}
          autoComplete="off"
        />
        <button
          type="submit"
          className="send-button"
          aria-label="Enviar palpite"
          disabled={!podePalpitar || textoVazio(texto)}
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12 H20 M13 5 L20 12 L13 19" />
          </svg>
        </button>
      </form>
    </section>
  )
}

function textoVazio(texto) {
  return texto.trim().length === 0
}
