import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { gerarIdAleatorio } from '../lib/id'

function limitar(valor) {
  return Math.min(1, Math.max(0, valor))
}

function prepararContexto(ctx, traco) {
  ctx.globalCompositeOperation = traco.borracha ? 'destination-out' : 'source-over'
  ctx.strokeStyle = traco.borracha ? '#000' : traco.cor || '#1f2937'
  ctx.fillStyle = traco.borracha ? '#000' : traco.cor || '#1f2937'
  ctx.lineWidth = Math.max(1, Number(traco.espessura) || 4)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

export default function Canvas({
  ativo = false,
  cor = '#1f2937',
  espessura = 4,
  borracha = false,
  onLote,
  onLimpar,
}) {
  const canvasRef = useRef(null)
  const tamanhoRef = useRef({ largura: 1, altura: 1, dpr: 1 })
  const ultimosPontosRef = useRef(new Map())
  const desenhoRef = useRef({
    desenhando: false,
    pointerId: null,
    id: null,
    estilo: null,
    ultimoPonto: null,
    pendentes: [],
    timer: null,
    enviouInicio: false,
  })
  const filaRef = useRef([])
  const drenandoRef = useRef(false)
  const retryRef = useRef(null)
  const tentativasRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const pai = canvas.parentElement

    function aplicarEstilo(ctxAtual, traco) {
      prepararContexto(ctxAtual, traco)
    }

    function desenharCirculo(ctxAtual, ponto, traco) {
      const { largura, altura } = tamanhoRef.current
      aplicarEstilo(ctxAtual, traco)
      ctxAtual.beginPath()
      ctxAtual.arc(
        ponto[0] * largura,
        ponto[1] * altura,
        Math.max(1, (Number(traco.espessura) || 4) / 2),
        0,
        Math.PI * 2,
      )
      ctxAtual.fill()
    }

    function desenharTracoCompleto(ctxAtual, traco) {
      if (!traco.pontos || traco.pontos.length === 0) return
      const { largura, altura } = tamanhoRef.current

      if (traco.pontos.length === 1) {
        desenharCirculo(ctxAtual, traco.pontos[0], traco)
        return
      }

      aplicarEstilo(ctxAtual, traco)
      ctxAtual.beginPath()
      const [primeiro, ...resto] = traco.pontos
      ctxAtual.moveTo(primeiro[0] * largura, primeiro[1] * altura)
      resto.forEach((ponto) => {
        ctxAtual.lineTo(ponto[0] * largura, ponto[1] * altura)
      })
      ctxAtual.stroke()
    }

    function redesenharTudo() {
      const { largura, altura, dpr } = tamanhoRef.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, largura, altura)
      ultimosPontosRef.current.clear()

      const tracos = useStore.getState().tracos
      tracos.forEach((traco) => {
        desenharTracoCompleto(ctx, traco)
        const ultimo = traco.pontos[traco.pontos.length - 1]
        if (ultimo) ultimosPontosRef.current.set(traco.id, ultimo)
      })
    }

    function desenharLote(chunk) {
      if (!chunk || !Array.isArray(chunk.pontos) || chunk.pontos.length === 0) {
        return
      }
      const { largura, altura } = tamanhoRef.current
      const anterior = chunk.novo
        ? null
        : ultimosPontosRef.current.get(chunk.id)
      const pontos = chunk.pontos

      if (!anterior && pontos.length === 1) {
        desenharCirculo(ctx, pontos[0], chunk)
      } else {
        aplicarEstilo(ctx, chunk)
        ctx.beginPath()
        let partida = anterior
        if (!partida) {
          partida = pontos[0]
          ctx.moveTo(partida[0] * largura, partida[1] * altura)
        } else {
          ctx.moveTo(partida[0] * largura, partida[1] * altura)
        }

        const inicio = anterior ? 0 : 1
        for (let i = inicio; i < pontos.length; i += 1) {
          const ponto = pontos[i]
          ctx.lineTo(ponto[0] * largura, ponto[1] * altura)
        }
        ctx.stroke()
      }

      ultimosPontosRef.current.set(chunk.id, pontos[pontos.length - 1])
    }

    function ajustarTamanho() {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const largura = Math.max(1, rect.width)
      const altura = Math.max(1, rect.height)
      canvas.width = Math.round(largura * dpr)
      canvas.height = Math.round(altura * dpr)
      tamanhoRef.current = { largura, altura, dpr }
      redesenharTudo()
    }

    const observer = new ResizeObserver(ajustarTamanho)
    if (pai) observer.observe(pai)
    ajustarTamanho()

    const cancelarInscricao = useStore.subscribe((estado, anterior) => {
      if (
        estado.limpezaSeq !== anterior.limpezaSeq &&
        estado.historicoSeq === anterior.historicoSeq
      ) {
        const { largura, altura, dpr } = tamanhoRef.current
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, largura, altura)
        ultimosPontosRef.current.clear()
        filaRef.current = []
        tentativasRef.current = 0
        if (retryRef.current) {
          clearTimeout(retryRef.current)
          retryRef.current = null
        }
        return
      }

      if (estado.historicoSeq !== anterior.historicoSeq) {
        redesenharTudo()
        return
      }

      if (
        estado.ultimoLote &&
        estado.ultimoLote.seq !== anterior.ultimoLote?.seq &&
        estado.ultimoLote.autor !== estado.selfId
      ) {
        desenharLote(estado.ultimoLote)
      }
    })

    return () => {
      observer.disconnect()
      cancelarInscricao()
      const desenho = desenhoRef.current
      if (desenho.timer) clearTimeout(desenho.timer)
      if (retryRef.current) clearTimeout(retryRef.current)
    }
  }, [])

  function pontoDoEvento(evento) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return null
    return [
      limitar((evento.clientX - rect.left) / rect.width),
      limitar((evento.clientY - rect.top) / rect.height),
    ]
  }

  function pontoIgual(a, b) {
    return a && b && Math.abs(a[0] - b[0]) < 0.0005 && Math.abs(a[1] - b[1]) < 0.0005
  }

  function desenharSegmentoLocal(anterior, ponto, estilo) {
    const canvas = canvasRef.current
    if (!canvas || !anterior || !ponto) return
    const ctx = canvas.getContext('2d')
    const { largura, altura } = tamanhoRef.current
    prepararContexto(ctx, estilo)
    ctx.beginPath()
    ctx.moveTo(anterior[0] * largura, anterior[1] * altura)
    ctx.lineTo(ponto[0] * largura, ponto[1] * altura)
    ctx.stroke()
  }

  function desenharPontoLocal(ponto, estilo) {
    const canvas = canvasRef.current
    if (!canvas || !ponto) return
    const ctx = canvas.getContext('2d')
    const { largura, altura } = tamanhoRef.current
    prepararContexto(ctx, estilo)
    ctx.beginPath()
    ctx.arc(
      ponto[0] * largura,
      ponto[1] * altura,
      Math.max(1, (Number(estilo.espessura) || 4) / 2),
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  function drenarFila() {
    if (drenandoRef.current) return
    const lote = filaRef.current[0]
    if (!lote) return

    drenandoRef.current = true
    const enviado = onLote?.(lote)
    drenandoRef.current = false

    if (enviado === false) {
      tentativasRef.current += 1
      if (tentativasRef.current >= 5) {
        filaRef.current.shift()
        tentativasRef.current = 0
      }
      if (!retryRef.current) {
        retryRef.current = setTimeout(() => {
          retryRef.current = null
          drenarFila()
        }, 30)
      }
      return
    }

    tentativasRef.current = 0
    filaRef.current.shift()
    if (filaRef.current.length > 0) {
      setTimeout(drenarFila, 0)
    }
  }

  function fazerFlush() {
    const desenho = desenhoRef.current
    if (!desenho.id || desenho.pendentes.length === 0) return

    filaRef.current.push({
      id: desenho.id,
      cor: desenho.estilo.cor,
      espessura: desenho.estilo.espessura,
      borracha: desenho.estilo.borracha,
      pontos: desenho.pendentes,
      novo: !desenho.enviouInicio,
    })
    desenho.pendentes = []
    desenho.enviouInicio = true
    drenarFila()
  }

  function agendarFlush() {
    const desenho = desenhoRef.current
    if (desenho.timer) return
    desenho.timer = setTimeout(() => {
      desenho.timer = null
      fazerFlush()
    }, 50)
  }

  function iniciar(evento) {
    if (!ativo) return
    if (evento.pointerType === 'mouse' && evento.button !== 0) return
    if (evento.isPrimary === false) return
    const ponto = pontoDoEvento(evento)
    if (!ponto) return

    evento.preventDefault()
    const desenho = desenhoRef.current
    if (desenho.timer) {
      clearTimeout(desenho.timer)
      desenho.timer = null
    }

    const estilo = { cor, espessura, borracha }
    desenhoRef.current = {
      desenhando: true,
      pointerId: evento.pointerId,
      id: gerarIdAleatorio(),
      estilo,
      ultimoPonto: ponto,
      pendentes: [ponto],
      timer: null,
      enviouInicio: false,
    }

    if (evento.currentTarget.setPointerCapture) {
      evento.currentTarget.setPointerCapture(evento.pointerId)
    }
    desenharPontoLocal(ponto, estilo)
    agendarFlush()
  }

  function mover(evento) {
    const desenho = desenhoRef.current
    if (!desenho.desenhando || desenho.pointerId !== evento.pointerId) return
    evento.preventDefault()

    const nativos =
      evento.nativeEvent.getCoalescedEvents?.() || [evento.nativeEvent]
    nativos.forEach((nativo) => {
      const ponto = pontoDoEvento(nativo)
      if (!ponto || pontoIgual(desenho.ultimoPonto, ponto)) return
      desenharSegmentoLocal(desenho.ultimoPonto, ponto, desenho.estilo)
      desenho.ultimoPonto = ponto
      desenho.pendentes.push(ponto)
    })
    agendarFlush()
  }

  function finalizar(evento) {
    const desenho = desenhoRef.current
    if (!desenho.desenhando || desenho.pointerId !== evento.pointerId) return
    evento.preventDefault()

    const ponto = pontoDoEvento(evento)
    if (ponto && !pontoIgual(desenho.ultimoPonto, ponto)) {
      desenharSegmentoLocal(desenho.ultimoPonto, ponto, desenho.estilo)
      desenho.ultimoPonto = ponto
      desenho.pendentes.push(ponto)
    }

    if (desenho.timer) {
      clearTimeout(desenho.timer)
      desenho.timer = null
    }
    desenho.desenhando = false
    fazerFlush()
    if (evento.currentTarget.releasePointerCapture) {
      try {
        evento.currentTarget.releasePointerCapture(evento.pointerId)
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className={`canvas-shell ${ativo ? 'is-active' : ''}`}>
      <canvas
        ref={canvasRef}
        className={`drawing-canvas ${borracha && ativo ? 'eraser-cursor' : ''}`}
        onPointerDown={iniciar}
        onPointerMove={mover}
        onPointerUp={finalizar}
        onPointerCancel={finalizar}
        role="img"
        aria-label={
          ativo
            ? 'Área de desenho. Você está desenhando.'
            : 'Desenho da rodada.'
        }
      />
      {!ativo && (
        <div className="canvas-waiting" aria-hidden="true">
          Aguardando o desenho...
        </div>
      )}
      {ativo && (
        <div className="canvas-active-hint">Você está desenhando</div>
      )}
      <button
        type="button"
        className="canvas-clear"
        onClick={onLimpar}
        disabled={!ativo}
        title="Limpar desenho"
      >
        Limpar
      </button>
    </div>
  )
}
