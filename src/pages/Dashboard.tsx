import { Users, Plus, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [clients, setClients] = useState<any[]>([])
  const [greeting, setGreeting] = useState('Benvenuto')
  const navigate = useNavigate()

  useEffect(() => {
    // @ts-ignore
    const api = window.electronAPI
    if (api) {
      api.getClients().then((data: any[]) => {
        setClients(data)
      }).catch(console.error)
    }

    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) setGreeting('Buongiorno')
    else if (hour >= 12 && hour < 18) setGreeting('Buon pomeriggio')
    else setGreeting('Buonasera')
  }, [])

  const recentClients = clients.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{greeting}, Gennaro!</h2>
          <p className="text-muted-foreground">
            Ecco una panoramica dei tuoi atleti e delle loro schede.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Totale Atleti</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              Atleti registrati nel database locale
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/clients?add=true')}
          className="rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:border-primary/50 hover:bg-muted/50 transition-colors text-left flex flex-col justify-between h-full"
        >
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2 w-full">
            <h3 className="tracking-tight text-sm font-medium text-primary">Azione Rapida</h3>
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-xl font-bold text-primary">Nuovo Atleta</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aggiungi subito una nuova scheda
            </p>
          </div>
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm max-w-3xl">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
          <h3 className="tracking-tight text-lg font-semibold">Atleti Recenti</h3>
          <Link to="/clients" className="text-sm text-primary flex items-center hover:underline">
            Vedi tutti <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="p-0">
          <table className="w-full text-sm text-left">
            <tbody>
              {recentClients.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">Nessun cliente registrato.</td>
                </tr>
              ) : (
                recentClients.map(c => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/50">
                    <td className="px-6 py-4 font-medium">{c.first_name} {c.last_name}</td>
                    <td className="px-6 py-4 text-muted-foreground hidden sm:table-cell">{c.email || c.phone || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/clients/${c.id}`} className="text-primary hover:underline font-medium">Apri Scheda</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
