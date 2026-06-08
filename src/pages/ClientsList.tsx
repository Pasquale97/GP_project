import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'

// @ts-ignore
const api = window.electronAPI

export default function ClientsList() {
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('add') === 'true')
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '', notes: '' })

  const loadClients = async () => {
    if (api) {
      const data = await api.getClients()
      setClients(data)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setIsModalOpen(true)
      setSearchParams({}) // Clean URL
    }
  }, [searchParams, setSearchParams])

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!api) {
        alert("API non definita. Assicurati che Electron stia caricando il preload.")
        return
      }
      
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
      
      await api.addClient({
        id: newId,
        first_name: formData.first_name || '',
        last_name: formData.last_name || '',
        email: formData.email || '',
        phone: formData.phone || '',
        notes: formData.notes || ''
      })
      
      setIsModalOpen(false)
      setFormData({ first_name: '', last_name: '', email: '', phone: '', notes: '' })
      loadClients()
    } catch (err: any) {
      console.error(err)
      alert("Errore durante il salvataggio: " + (err.message || JSON.stringify(err)))
    }
  }

  const filtered = clients.filter(c => 
    (c.first_name + ' ' + c.last_name).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Atleti</h2>
          <p className="text-muted-foreground">Gestisci i tuoi atleti e le loro schede.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Nuovo Atleta
        </button>
      </div>

      <div className="flex items-center px-3 py-2 border border-border rounded-md bg-background w-full max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground mr-2" />
        <input 
          type="text" 
          placeholder="Cerca atleta..." 
          className="bg-transparent outline-none w-full text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border border-border">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary text-secondary-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Telefono</th>
              <th className="px-4 py-3 font-medium text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nessun atleta trovato.</td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr key={client.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{client.first_name} {client.last_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.email || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.phone || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/clients/${client.id}`} className="text-primary hover:underline font-medium">Dettagli</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card text-card-foreground p-6 rounded-lg w-full max-w-md shadow-lg border border-border">
            <h3 className="text-lg font-bold mb-4">Aggiungi Atleta</h3>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome</label>
                  <input required type="text" className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cognome</label>
                  <input required type="text" className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input type="email" className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefono</label>
                <input type="text" className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Note</label>
                <textarea className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm min-h-[80px]" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-secondary">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">Salva</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
