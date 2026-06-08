export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Impostazioni</h2>
        <p className="text-muted-foreground">Gestisci le preferenze dell'applicazione.</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Esportazione Dati</h3>
          <p className="text-sm text-muted-foreground mb-4">
            L'esportazione dei dati in PDF e CSV è in arrivo nei prossimi aggiornamenti.
          </p>
          <button disabled className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground opacity-50 cursor-not-allowed">
            Esporta Database (Presto Disponibile)
          </button>
        </div>
      </div>
    </div>
  )
}
