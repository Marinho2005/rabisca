import { useStore } from '../store/useStore'
import { useRoomContext } from '../hooks/useRoom'

export default function Erro() {
  const { sairDaSala } = useRoomContext()
  const erro = useStore((state) => state.erro)
  const pendingCode = useStore((state) => state.pendingCode)
  const configuracao = erro.toLowerCase().includes('supabase')

  function tentarNovamente() {
    useStore.setState({ screen: 'nickname', erro: '', connecting: false })
  }

  return (
    <main className="screen center-screen">
      <section className="card narrow-card error-card">
        <div className="error-symbol" aria-hidden="true">
          !
        </div>
        <h1>Não foi possível entrar</h1>
        <p className="lead">{erro}</p>
        {pendingCode && (
          <p className="room-chip small-chip">Sala {pendingCode}</p>
        )}

        <div className="error-actions">
          {!configuracao && (
            <button
              type="button"
              className="button primary"
              onClick={tentarNovamente}
            >
              Tentar novamente
            </button>
          )}
          <button type="button" className="button secondary" onClick={sairDaSala}>
            Voltar ao início
          </button>
        </div>
      </section>
    </main>
  )
}
