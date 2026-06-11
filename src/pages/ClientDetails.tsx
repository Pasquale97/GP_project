import { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import jsPDF from 'jspdf'

// @ts-ignore
const api = window.electronAPI

export default function ClientDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  // pdfRef removed - PDF generated programmatically
  
  const [client, setClient] = useState<any>(null)
  const [weights, setWeights] = useState<any[]>([])

  // Date filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Add weight
  const [weightForm, setWeightForm] = useState({ weight: '', kcal: '', record_date: new Date().toISOString().split('T')[0], notes: '' })
  const [dateError, setDateError] = useState(false)

  // Edit weight
  const [isEditWeightModalOpen, setIsEditWeightModalOpen] = useState(false)
  const [editWeightForm, setEditWeightForm] = useState({ id: '', weight: '', kcal: '', record_date: '', notes: '' })

  // Edit client
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false)
  const [editClientForm, setEditClientForm] = useState({ first_name: '', last_name: '', email: '', phone: '', notes: '' })

  const loadData = async () => {
    if (api && id) {
      const clientsList = await api.getClients()
      const found = clientsList.find((c: any) => c.id === id)
      setClient(found)
      
      const records = await api.getClientWeights(id)
      setWeights(records)
      
      if (records.length > 0 && !startDate && !endDate) {
        // Init default range if needed, or leave empty for "all"
      }
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault()
    setDateError(false)
    
    const existing = weights.find(w => w.record_date.startsWith(weightForm.record_date))
    if (existing) {
      setDateError(true)
      return
    }

    if (api && id) {
      await api.addWeight({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        client_id: id,
        weight: parseFloat(weightForm.weight),
        kcal: parseInt(weightForm.kcal) || 0,
        record_date: weightForm.record_date,
        notes: weightForm.notes
      })
      setWeightForm({ weight: '', kcal: '', record_date: new Date().toISOString().split('T')[0], notes: '' })
      loadData()
    }
  }

  const openEditClient = () => {
    if (client) {
      setEditClientForm({
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email || '',
        phone: client.phone || '',
        notes: client.notes || ''
      })
      setIsEditClientModalOpen(true)
    }
  }

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (api && id) {
      await api.updateClient({
        id,
        ...editClientForm
      })
      setIsEditClientModalOpen(false)
      loadData()
    }
  }

  const handleDeleteClient = async () => {
    if (confirm('Sei sicuro di voler eliminare questo atleta? Tutte le registrazioni andranno perse.')) {
      if (api && id) {
        await api.deleteClient(id)
        navigate('/clients')
      }
    }
  }

  const openEditWeight = (w: any) => {
    setEditWeightForm({
      id: w.id,
      weight: w.weight.toString(),
      kcal: w.kcal ? w.kcal.toString() : '',
      record_date: new Date(w.record_date).toISOString().split('T')[0],
      notes: w.notes || ''
    })
    setDateError(false)
    setIsEditWeightModalOpen(true)
  }

  const handleUpdateWeight = async (e: React.FormEvent) => {
    e.preventDefault()
    setDateError(false)

    const existing = weights.find(w => w.record_date.startsWith(editWeightForm.record_date) && w.id !== editWeightForm.id)
    if (existing) {
      setDateError(true)
      return
    }

    if (api) {
      await api.updateWeight({
        id: editWeightForm.id,
        weight: parseFloat(editWeightForm.weight),
        kcal: parseInt(editWeightForm.kcal) || 0,
        record_date: editWeightForm.record_date,
        notes: editWeightForm.notes
      })
      setIsEditWeightModalOpen(false)
      loadData()
    }
  }

  const handleDeleteWeight = async (weightId: string) => {
    if (confirm('Sei sicuro di voler eliminare questa registrazione?')) {
      if (api) {
        await api.deleteWeight(weightId)
        loadData()
      }
    }
  }

  const handleExportPDF = () => {
    if (!client || chartData.length === 0) return

    try {
      const pdf = new jsPDF('l', 'mm', 'a4')
      const W = pdf.internal.pageSize.getWidth()  // 297mm
      const H = pdf.internal.pageSize.getHeight() // 210mm
      const marginL = 15
      const marginR = 15
      // const plotW = W - marginL - marginR

      // ── Header ──────────────────────────────────────────────
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Report Andamento Atleta: ${client.first_name} ${client.last_name}`, marginL, 14)

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100)
      // Always use real dates from data when filter not set
      const firstRecord = filteredWeights[0]
      const lastRecord  = filteredWeights[filteredWeights.length - 1]
      const fromDate = startDate
        ? new Date(startDate)
        : firstRecord ? new Date(firstRecord.record_date) : new Date()
      const toDate = endDate
        ? new Date(endDate)
        : lastRecord ? new Date(lastRecord.record_date) : new Date()
      const from = fromDate.toLocaleDateString('it-IT')
      const to   = toDate.toLocaleDateString('it-IT')
      pdf.text(`Periodo: Dal ${from} al ${to}`, marginL, 20)
      pdf.text(`Generato il: ${new Date().toLocaleDateString('it-IT')}`, marginL, 25)

      if (variations) {
        pdf.setTextColor(0)
        pdf.text(
          `Variazione Peso: Da ${variations.firstWeight}kg a ${variations.lastWeight}kg ( ${variations.weightDiff > 0 ? '+' : ''}${variations.weightDiff.toFixed(1)} kg )`,
          W / 2, 20, { align: 'left' }
        )
        pdf.text(
          `Variazione Kcal: Da ${variations.firstKcal} a ${variations.lastKcal} ( ${variations.kcalDiff > 0 ? '+' : ''}${variations.kcalDiff} kcal )`,
          W / 2, 25, { align: 'left' }
        )
      }

      // ── Separator ────────────────────────────────────────────
      pdf.setDrawColor(200)
      pdf.line(marginL, 29, W - marginR, 29)

      // ── Chart area ───────────────────────────────────────────
      const chartTop    = 34
      const chartBottom = H - 18
      const chartHeight = chartBottom - chartTop
      const yAxisLeft   = marginL + 18
      const xEnd        = W - marginR - 26
      const plotActualW = xEnd - yAxisLeft

      // ── INSERIMENTO WATERMARK LOGO DIETRO IL GRAFICO DEL PDF ──
      // Calcoliamo il centro esatto dell'area in cui verrà disegnato il grafico
      const chartCenterX = yAxisLeft + (plotActualW / 2);
      const chartCenterY = chartTop + (chartHeight / 2);
      const logoSize = 120; // Dimensione in millimetri dello scudo nel PDF

      // Salviamo lo stato grafico per isolare la trasparenza
      pdf.saveGraphicsState();
      
      // Impostiamo l'opacità molto bassa (0.06 = 6%) così fa da perfetto sfondo senza coprire i dati
      pdf.setGState(pdf.GState({ opacity: 0.06 })); 
      
      // Essendo in Electron, jsPDF può leggere il file direttamente dalla cartella public usando il percorso relativo
      pdf.addImage(
        '/logo-watermark.png', 
        'PNG', 
        chartCenterX - (logoSize / 2), 
        chartCenterY - (logoSize / 2), 
        logoSize, 
        logoSize
      );
      
      // Ripristiniamo lo stato grafico (riporta l'opacità al 100% per i testi e le linee successive)
      pdf.restoreGraphicsState(); 
      // ─────────────────────────────────────────────────────────

      // Compute weight domain
      const weights_vals = chartData.map(d => d.peso)
      const kcal_vals    = chartData.map(d => d.kcal).filter(v => v > 0)
      const wMin = Math.min(...weights_vals) - 1
      const wMax = Math.max(...weights_vals) + 1
      const kMin = kcal_vals.length ? Math.min(...kcal_vals) - 100 : 0
      const kMax = kcal_vals.length ? Math.max(...kcal_vals) + 100 : 2000

      const toY = (val: number, min: number, max: number) =>
        chartTop + chartHeight - ((val - min) / (max - min)) * chartHeight

      const toX = (i: number) =>
        yAxisLeft + (i / (chartData.length - 1)) * plotActualW

      // Grid lines (horizontal)
      pdf.setDrawColor(220)
      pdf.setLineWidth(0.2)
      const gridCount = 5
      for (let gi = 0; gi <= gridCount; gi++) {
        const gy = chartTop + (gi / gridCount) * chartHeight
        pdf.line(yAxisLeft, gy, xEnd, gy)
        // Left axis label (weight)
        const wVal = wMax - (gi / gridCount) * (wMax - wMin)
        pdf.setFontSize(7)
        pdf.setTextColor(120)
        pdf.text(wVal.toFixed(1), yAxisLeft - 2, gy + 1, { align: 'right' })
        // Right axis label (kcal)
        if (kcal_vals.length > 0) {
          const kVal = kMax - (gi / gridCount) * (kMax - kMin)
          pdf.text(Math.round(kVal).toString(), xEnd + 2, gy + 1)
        }
      }

      // X-axis labels
      const labelStep = Math.max(1, Math.ceil(chartData.length / 6))
      chartData.forEach((d, i) => {
        if (i % labelStep === 0 || i === chartData.length - 1) {
          const x = toX(i)
          pdf.setFontSize(7)
          pdf.setTextColor(120)
          pdf.text(d.date, x, chartBottom + 5, { align: 'center' })
        }
      })

      // Weight line (blue)
      pdf.setDrawColor(59, 130, 246)
      pdf.setLineWidth(1)
      chartData.forEach((d, i) => {
        if (i === 0) return
        const x1 = toX(i - 1), y1 = toY(chartData[i - 1].peso, wMin, wMax)
        const x2 = toX(i),     y2 = toY(d.peso, wMin, wMax)
        pdf.line(x1, y1, x2, y2)
      })
      // Weight dots
      pdf.setFillColor(59, 130, 246)
      chartData.forEach((d, i) => {
        pdf.circle(toX(i), toY(d.peso, wMin, wMax), 1.2, 'F')
      })

      // Kcal dashed line (red)
      if (kcal_vals.length > 0) {
        pdf.setDrawColor(239, 68, 68)
        pdf.setLineWidth(0.8)
        chartData.forEach((d, i) => {
          if (i === 0 || !d.kcal) return
          const x1 = toX(i - 1), y1 = toY(chartData[i - 1].kcal, kMin, kMax)
          const x2 = toX(i),     y2 = toY(d.kcal, kMin, kMax)
          // Simple dashed approximation: draw short segments
          const steps = 6
          for (let s = 0; s < steps; s += 2) {
            const t1 = s / steps, t2 = (s + 1) / steps
            pdf.line(x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1, x1 + (x2 - x1) * t2, y1 + (y2 - y1) * t2)
          }
        })
        pdf.setFillColor(239, 68, 68)
        chartData.forEach((d, i) => {
          if (d.kcal) pdf.circle(toX(i), toY(d.kcal, kMin, kMax), 1, 'F')
        })
      }

      // Axes
      pdf.setDrawColor(160)
      pdf.setLineWidth(0.4)
      pdf.line(yAxisLeft, chartTop, yAxisLeft, chartBottom)
      pdf.line(yAxisLeft, chartBottom, xEnd, chartBottom)

      // ── Axis labels (rotated) ─────────────────────────────────
      pdf.setFontSize(7)
      pdf.setTextColor(80)
      // Left axis label: "Peso (kg)" rotated 90°
      pdf.text('Peso (kg)', yAxisLeft - 13, (chartTop + chartBottom) / 2, { angle: 90, align: 'center' })
      // Right axis label: "Calorie (kcal)" rotated -90° — placed well outside the plot
      if (kcal_vals.length > 0) {
        pdf.text('Calorie (kcal)', xEnd + 22, (chartTop + chartBottom) / 2, { angle: -90, align: 'center' })
      }

      // ── Legend ───────────────────────────────────────────────
      pdf.setFillColor(59, 130, 246)
      pdf.rect(marginL, H - 12, 8, 3, 'F')
      pdf.setFontSize(8)
      pdf.setTextColor(60)
      pdf.text('Peso Corporeo (kg)', marginL + 10, H - 10)

      if (kcal_vals.length > 0) {
        pdf.setFillColor(239, 68, 68)
        pdf.rect(marginL + 55, H - 12, 8, 3, 'F')
        pdf.text('Media Kcal', marginL + 65, H - 10)
      }

      // ── Save ────────────────────────────────────────────────
      const dateStr = new Date().toLocaleDateString('it-IT').replace(/\//g, '-')
      pdf.save(`Report_${client.first_name}_${client.last_name}_${dateStr}.pdf`)
    } catch (err) {
      console.error('PDF error:', err)
      alert('Errore durante la generazione del PDF: ' + (err as any)?.message)
    }
  }

  const setPresetRange = (preset: string) => {
    const end = new Date()
    const start = new Date()
    
    if (preset === '7d') start.setDate(end.getDate() - 7)
    if (preset === '1m') start.setMonth(end.getMonth() - 1)
    if (preset === '1y') start.setFullYear(end.getFullYear() - 1)
    if (preset === 'reset') {
      setStartDate('')
      setEndDate('')
      return
    }

    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }

  const filteredWeights = useMemo(() => {
    let filtered = weights
    if (startDate) {
      filtered = filtered.filter(w => new Date(w.record_date) >= new Date(startDate))
    }
    if (endDate) {
      // Set end date to end of day
      const endObj = new Date(endDate)
      endObj.setHours(23, 59, 59)
      filtered = filtered.filter(w => new Date(w.record_date) <= endObj)
    }
    return filtered
  }, [weights, startDate, endDate])

  const variations = useMemo(() => {
    if (filteredWeights.length < 2) return null
    const first = filteredWeights[0]
    const last = filteredWeights[filteredWeights.length - 1]
    
    return {
      firstWeight: first.weight,
      lastWeight: last.weight,
      weightDiff: last.weight - first.weight,
      firstKcal: first.kcal || 0,
      lastKcal: last.kcal || 0,
      kcalDiff: (last.kcal || 0) - (first.kcal || 0)
    }
  }, [filteredWeights])

  const chartData = filteredWeights.map(w => ({
    date: new Date(w.record_date).toLocaleDateString('it-IT'),
    peso: w.weight,
    kcal: w.kcal || 0,
    notes: w.notes
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card text-card-foreground p-3 border border-border rounded-lg shadow-sm text-xs">
          <p className="font-bold mb-1">{label}</p>
          <p className="text-[hsl(var(--primary))]">Peso: {data.peso} kg</p>
          <p className="text-red-500">Media Kcal: {data.kcal || '-'}</p>
          {data.notes && <p className="text-muted-foreground mt-1 border-t border-border pt-1">Nota: {data.notes}</p>}
        </div>
      )
    }
    return null
  }

  if (!client) return <div className="p-6">Caricamento...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/clients" className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{client.first_name} {client.last_name}</h2>
            <p className="text-muted-foreground">{client.email} {client.phone && `• ${client.phone}`}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={openEditClient} className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors" title="Modifica Atleta">
            <Edit2 className="h-5 w-5" />
          </button>
          <button onClick={handleDeleteClient} className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors" title="Elimina Atleta">
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Colonna Sinistra: Form Inserimento */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl p-5 shadow-sm sticky top-6">
          <h3 className="font-bold text-lg border-b border-border pb-3 mb-4">Nuovo Inserimento</h3>
          <form onSubmit={handleAddWeight} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex justify-between">
                Data {dateError && <span className="text-red-500 text-[10px]">Esiste già</span>}
              </label>
              <input 
                required 
                type="date" 
                className={`w-full px-3 py-2 border rounded-md bg-background text-sm ${dateError ? 'border-red-500 ring-1 ring-red-500' : 'border-border'}`} 
                value={weightForm.record_date} 
                onChange={e => { setDateError(false); setWeightForm({...weightForm, record_date: e.target.value})}} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Peso (kg)</label>
              <input required type="number" step="0.1" className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" value={weightForm.weight} onChange={e => setWeightForm({...weightForm, weight: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Media Kcal</label>
              <input type="number" step="1" className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" value={weightForm.kcal} onChange={e => setWeightForm({...weightForm, kcal: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Note (Opzionale)</label>
              <textarea className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm min-h-[60px]" value={weightForm.notes} onChange={e => setWeightForm({...weightForm, notes: e.target.value})}></textarea>
            </div>
            <button type="submit" className="w-full mt-2 bg-primary text-primary-foreground py-2 rounded-md text-sm font-bold hover:bg-primary/90 transition-colors">
              Aggiungi al Grafico
            </button>
          </form>

          <div className="mt-8 border-t border-border pt-4">
             <h4 className="font-semibold text-sm mb-3">Ultime Registrazioni</h4>
             <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
              {weights.slice().reverse().slice(0, 5).map(w => (
                <div key={w.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-md text-xs group">
                  <div>
                    <span className="font-bold">{w.weight} kg</span>
                    <span className="text-muted-foreground ml-2">{new Date(w.record_date).toLocaleDateString('it-IT')}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditWeight(w)} className="text-muted-foreground hover:text-foreground"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={() => handleDeleteWeight(w.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
              {weights.length === 0 && <p className="text-xs text-muted-foreground text-center">Nessuna registrazione.</p>}
             </div>
          </div>
        </div>

        {/* Colonna Destra: Andamento */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-bold text-primary">Andamento: {client.first_name} {client.last_name}</h3>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-md border border-border text-sm">
                <input type="date" className="bg-transparent outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <span className="text-muted-foreground">a</span>
                <input type="date" className="bg-transparent outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div className="flex gap-1">
                <button onClick={() => setPresetRange('7d')} className="px-2 py-1.5 text-xs rounded border border-border hover:bg-muted">7 Giorni</button>
                <button onClick={() => setPresetRange('1m')} className="px-2 py-1.5 text-xs rounded border border-border hover:bg-muted">Mese</button>
                <button onClick={() => setPresetRange('1y')} className="px-2 py-1.5 text-xs rounded border border-border hover:bg-muted">Anno</button>
                <button onClick={() => setPresetRange('reset')} className="px-2 py-1.5 text-xs rounded border border-border bg-secondary text-secondary-foreground font-medium">Reset</button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-card p-2 rounded-lg relative">
            {/* Logo in background watermark - optional styling can be applied in CSS, we skip image to avoid missing assets */}
            
            {variations && (
              <div className="flex flex-col sm:flex-row gap-4 mb-6 w-full">
                <div className="flex-1 bg-muted/20 border border-border p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-primary mb-1">VARIAZIONE PESO</p>
                    <p className="text-sm font-medium">Da {variations.firstWeight} kg a {variations.lastWeight} kg</p>
                  </div>
                  <div className={`text-xl font-black ${variations.weightDiff > 0 ? 'text-primary' : variations.weightDiff < 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {variations.weightDiff > 0 ? '+' : ''}{variations.weightDiff.toFixed(1)} kg
                  </div>
                </div>
                <div className="flex-1 bg-muted/20 border border-border p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-red-500 mb-1">VARIAZIONE KCAL</p>
                    <p className="text-sm font-medium">Da {variations.firstKcal} a {variations.lastKcal}</p>
                  </div>
                  <div className={`text-xl font-black ${variations.kcalDiff > 0 ? 'text-red-500' : variations.kcalDiff < 0 ? 'text-blue-500' : 'text-muted-foreground'}`}>
                    {variations.kcalDiff > 0 ? '+' : ''}{variations.kcalDiff} kcal
                  </div>
                </div>
              </div>
            )}

            <div className="w-full graph-watermark" style={{ height: 360 }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.2} vertical={false} />
                    <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} dy={10} />

                    <YAxis yAxisId="left" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} domain={[(d: number) => Math.floor(d - 1), (d: number) => Math.ceil(d + 1)]} />
                    <YAxis yAxisId="right" orientation="right" stroke="#ef4444" fontSize={11} tickLine={false} axisLine={false} domain={[(d: number) => Math.floor(d - 100), (d: number) => Math.ceil(d + 100)]} />

                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} iconType="rect" wrapperStyle={{ fontSize: '12px' }} />

                    <Line yAxisId="left" name="Peso Corporeo (kg)" type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" name="Media Kcal" type="monotone" dataKey="kcal" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#ef4444', r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center text-muted-foreground text-sm" style={{ height: 360 }}>Nessun dato presente in questo periodo.</div>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
             <button 
                onClick={handleExportPDF}
                disabled={chartData.length === 0}
                className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-medium rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Esporta PDF
             </button>
          </div>
        </div>
      </div>

      {/* Modal Modifica Peso */}
      {isEditWeightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card text-card-foreground p-6 rounded-lg w-full max-w-sm shadow-lg border border-border">
            <h3 className="text-lg font-bold mb-4">Modifica Peso</h3>
            <form onSubmit={handleUpdateWeight} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Peso (kg)</label>
                <input required type="number" step="0.1" className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" value={editWeightForm.weight} onChange={e => setEditWeightForm({...editWeightForm, weight: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Media Kcal</label>
                <input type="number" step="1" className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" value={editWeightForm.kcal} onChange={e => setEditWeightForm({...editWeightForm, kcal: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex justify-between">Data {dateError && <span className="text-red-500 text-xs">Già registrato</span>}</label>
                <input required type="date" className={`w-full px-3 py-2 border rounded-md bg-background text-sm ${dateError ? 'border-red-500 ring-1 ring-red-500' : 'border-border'}`} value={editWeightForm.record_date} onChange={e => { setDateError(false); setEditWeightForm({...editWeightForm, record_date: e.target.value})}} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Note</label>
                <textarea className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm min-h-[60px]" value={editWeightForm.notes} onChange={e => setEditWeightForm({...editWeightForm, notes: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsEditWeightModalOpen(false)} className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-secondary">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">Aggiorna</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modifica Atleta */}
      {isEditClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card text-card-foreground p-6 rounded-lg w-full max-w-md shadow-lg border border-border">
            <h3 className="text-lg font-bold mb-4">Modifica Dati Atleta</h3>
            <form onSubmit={handleUpdateClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome</label>
                  <input required type="text" className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" value={editClientForm.first_name} onChange={e => setEditClientForm({...editClientForm, first_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cognome</label>
                  <input required type="text" className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" value={editClientForm.last_name} onChange={e => setEditClientForm({...editClientForm, last_name: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input type="email" className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" value={editClientForm.email} onChange={e => setEditClientForm({...editClientForm, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefono</label>
                <input type="text" className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" value={editClientForm.phone} onChange={e => setEditClientForm({...editClientForm, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Note Atleta</label>
                <textarea className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm min-h-[80px]" value={editClientForm.notes} onChange={e => setEditClientForm({...editClientForm, notes: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsEditClientModalOpen(false)} className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-secondary">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">Salva Modifiche</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
