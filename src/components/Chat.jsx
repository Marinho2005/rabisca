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
    <section className="chat-panel">
      <div className="section-title chat-title">
        <h2>Chat</h2>
        <span className="muted small">
          {status === 'playing' ? 'Palpites valem pontos' : 'Aguarde a rodada'}
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
              <div className="chat-message system" key={mensagem.id}>
                {mensagem.texto}
              </div>
            )
          }

          if (mensagem.tipo === 'acerto') {
            return (
              <div className="chat-message correct" key={mensagem.id}>
                <strong>{mensagem.texto}</strong>
              </div>
            )
          }

          return (
            <div className="chat-message guess" key={mensagem.id}>
              <span className="chat-author">{mensagem.autor || 'Jogador'}:</span>{' '}
              {mensagem.texto}
            </div>
          )
        })}
      </div>

      <form className="chat-form" onSubmit={enviar}>
        <input
          type="text"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value.slice(0, 120))}
          placeholder={
            podePalpitar ? 'Digite seu palpite...' : motivoBloqueio || 'Aguarde...'
          }
          aria-label="Seu palpite"
          disabled={!podePalpitar}
          autoComplete="off"
        />
        <button
          type="submit"
          className="button primary"
          disabled={!podePalpitar || textoVazio(texto)}
        >
          Enviar
        </button>
      </form>
    </section>
  )
}

function textoVazio(texto) {
  return texto.trim().length === 0
}
