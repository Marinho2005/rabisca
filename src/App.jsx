import { useEffect } from 'react'
import { RoomContext, useRoom } from './hooks/useRoom'
import { useStore } from './store/useStore'
import { codigoDaUrl, codigoValido } from './lib/roomCode'
import Home from './screens/Home'
import Nickname from './screens/Nickname'
import Lobby from './screens/Lobby'
import Game from './screens/Game'
import Results from './screens/Results'
import Erro from './screens/Erro'
import SoundEffects from './components/SoundEffects'

const TELAS = {
  home: Home,
  nickname: Nickname,
  lobby: Lobby,
  game: Game,
  results: Results,
  erro: Erro,
}

export default function App() {
  const room = useRoom()
  const screen = useStore((state) => state.screen)
  const connectionIssue = useStore((state) => state.connectionIssue)

  useEffect(() => {
    const codigo = codigoDaUrl()
    if (codigo && codigoValido(codigo)) {
      useStore.setState((estado) => ({
        pendingCode: codigo,
        roomCode: codigo,
        modo: 'entrar',
        screen:
          estado.screen === 'home' && !estado.connected
            ? 'nickname'
            : estado.screen,
      }))
    }
  }, [])

  const Tela = TELAS[screen] || Home

  return (
    <RoomContext.Provider value={room}>
      <SoundEffects />
      {connectionIssue && screen !== 'home' && (
        <div className="connection-banner" role="status">
          {connectionIssue}
        </div>
      )}
      <Tela />
    </RoomContext.Provider>
  )
}
