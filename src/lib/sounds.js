let contextoAudio = null
let sonsAtivos = true
let faseMusica = null
let faseMusicaAtiva = null
let ganhoMusica = null
let timerMusica = null
let cicloMusica = 0

try {
  sonsAtivos = localStorage.getItem('rabisca-som') !== 'off'
} catch {
  // Storage may be unavailable in private browsing contexts.
}

function obterContexto() {
  if (typeof window === 'undefined') return null
  const AudioContextAtual = window.AudioContext || window.webkitAudioContext
  if (!AudioContextAtual) return null
  contextoAudio ||= new AudioContextAtual()
  return contextoAudio
}

export function ativarAudio() {
  const contexto = obterContexto()
  if (contexto?.state === 'suspended') {
    contexto.resume().then(iniciarMusica).catch(() => {})
  } else {
    iniciarMusica()
  }
}

export function sonsEstaoAtivos() {
  return sonsAtivos
}

export function definirSonsAtivos(ativo) {
  sonsAtivos = Boolean(ativo)
  try {
    localStorage.setItem('rabisca-som', sonsAtivos ? 'on' : 'off')
  } catch {
    // Audio still works for the current session when storage is unavailable.
  }
  if (sonsAtivos) iniciarMusica()
  else pararMusica()
}

function tocarNota(
  contexto,
  frequencia,
  inicio,
  duracao,
  onda = 'sine',
  volume = 0.07,
  destino = contexto.destination,
) {
  const oscilador = contexto.createOscillator()
  const ganho = contexto.createGain()
  oscilador.type = onda
  oscilador.frequency.setValueAtTime(frequencia, inicio)
  ganho.gain.setValueAtTime(0.0001, inicio)
  ganho.gain.exponentialRampToValueAtTime(volume, inicio + 0.015)
  ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao)
  oscilador.connect(ganho)
  ganho.connect(destino)
  oscilador.start(inicio)
  oscilador.stop(inicio + duracao + 0.02)
}

function pararMusica() {
  cicloMusica += 1
  if (timerMusica) clearTimeout(timerMusica)
  timerMusica = null
  faseMusicaAtiva = null
  if (!ganhoMusica || !contextoAudio) return

  const ganhoAntigo = ganhoMusica
  ganhoMusica = null
  const agora = contextoAudio.currentTime
  ganhoAntigo.gain.cancelScheduledValues(agora)
  ganhoAntigo.gain.setValueAtTime(Math.max(0.0001, ganhoAntigo.gain.value), agora)
  ganhoAntigo.gain.linearRampToValueAtTime(0.0001, agora + 0.45)
  setTimeout(() => ganhoAntigo.disconnect(), 500)
}

function iniciarMusica() {
  if (!sonsAtivos || !faseMusica || !contextoAudio) return
  if (contextoAudio.state !== 'running' || faseMusicaAtiva === faseMusica) return

  pararMusica()
  const fase = faseMusica
  const ciclo = cicloMusica
  const ganho = contextoAudio.createGain()
  const agora = contextoAudio.currentTime
  ganho.gain.setValueAtTime(0.0001, agora)
  ganho.gain.linearRampToValueAtTime(fase === 'waiting' ? 0.23 : 0.12, agora + 0.8)
  ganho.connect(contextoAudio.destination)
  ganhoMusica = ganho
  faseMusicaAtiva = fase

  const notas = fase === 'waiting'
    ? [523.25, 659.25, 783.99, 659.25, 587.33]
    : [523.25, 659.25, 783.99, 659.25, 880, 783.99, 659.25, 587.33, 659.25, 783.99, 1046.5, 783.99]
  const volumes = fase === 'waiting' ? 0.14 : 0.11

  function tocarCompasso() {
    if (ciclo !== cicloMusica || !sonsAtivos || faseMusica !== fase) return
    const inicio = contextoAudio.currentTime + 0.03
    notas.forEach((frequencia, indice) => {
      tocarNota(
        contextoAudio,
        frequencia,
        inicio + indice * (fase === 'waiting' ? 1.45 : 0.36),
        fase === 'waiting' ? 1.05 : 0.3,
        fase === 'waiting' ? 'sine' : 'triangle',
        volumes,
        ganho,
      )
    })
    timerMusica = setTimeout(tocarCompasso, fase === 'waiting' ? 7600 : 4900)
  }

  tocarCompasso()
}

export function definirMusicaAmbiente(fase) {
  const novaFase = fase === 'waiting' || fase === 'game' ? fase : null
  if (faseMusica === novaFase) return
  faseMusica = novaFase
  if (faseMusicaAtiva) pararMusica()
  iniciarMusica()
}

function tocarSequencia(contexto, notas, intervalo, duracao, onda, volume) {
  const inicio = contexto.currentTime + 0.025
  notas.forEach((frequencia, indice) => {
    tocarNota(
      contexto,
      frequencia,
      inicio + indice * intervalo,
      duracao,
      onda,
      volume,
    )
  })
}

function tocar(contexto, evento) {
  switch (evento) {
    case 'ui':
      tocarNota(contexto, 640, contexto.currentTime + 0.015, 0.045, 'sine', 0.025)
      break
    case 'focus':
      tocarNota(contexto, 480, contexto.currentTime + 0.015, 0.035, 'sine', 0.012)
      break
    case 'confirmar':
      tocarSequencia(contexto, [523, 784], 0.07, 0.11, 'triangle', 0.045)
      break
    case 'desenhar':
      tocarNota(contexto, 290, contexto.currentTime + 0.015, 0.055, 'triangle', 0.018)
      break
    case 'conectar':
    case 'jogador-entrou':
      tocarSequencia(contexto, [659, 880], 0.075, 0.14, 'sine', 0.045)
      break
    case 'sair':
    case 'jogador-saiu':
      tocarSequencia(contexto, [440, 330], 0.08, 0.14, 'triangle', 0.04)
      break
    case 'erro':
      tocarSequencia(contexto, [247, 196], 0.075, 0.12, 'triangle', 0.045)
      break
    case 'copiado':
      tocarSequencia(contexto, [784, 1047], 0.06, 0.13, 'sine', 0.045)
      break
    case 'rodada':
      tocarSequencia(contexto, [392, 523, 659, 784], 0.09, 0.16, 'triangle', 0.055)
      break
    case 'acerto':
      tocarSequencia(contexto, [659, 784, 988, 1319], 0.055, 0.24, 'sine', 0.08)
      break
    case 'contagem':
      tocarNota(contexto, 880, contexto.currentTime + 0.02, 0.09, 'square', 0.025)
      break
    case 'fim-bom':
      tocarSequencia(contexto, [523, 659, 784, 1047], 0.12, 0.32, 'triangle', 0.075)
      break
    case 'fim':
      tocarSequencia(contexto, [392, 330, 262], 0.13, 0.28, 'triangle', 0.06)
      break
    case 'vitoria':
      tocarSequencia(contexto, [523, 659, 784, 1047, 784, 1047, 1319], 0.11, 0.34, 'triangle', 0.075)
      break
    default:
      break
  }
}

export function tocarSom(evento) {
  if (!sonsAtivos) return
  const contexto = obterContexto()
  if (!contexto) return
  if (contexto.state === 'suspended') {
    contexto.resume().then(() => tocar(contexto, evento)).catch(() => {})
    return
  }
  tocar(contexto, evento)
}