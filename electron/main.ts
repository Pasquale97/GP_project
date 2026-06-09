import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import Database from 'better-sqlite3'
import fs from 'node:fs'

const isPackaged = app.isPackaged;
const DIST = isPackaged 
  ? path.join(process.resourcesPath, 'app.asar', 'dist')
  : path.join(__dirname, '../dist');
// Set up SQLite database in user data folder
const dbPath = path.join(app.getPath('userData'), 'trainer_database.sqlite')
const db = new Database(dbPath)

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS weight_records (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    weight REAL NOT NULL,
    record_date DATETIME NOT NULL,
    kcal INTEGER DEFAULT 0,
    notes TEXT,
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
  );
`)

// Migration for existing databases
try {
  const columns = db.pragma('table_info(weight_records)') as any[]
  if (!columns.some(col => col.name === 'kcal')) {
    db.exec('ALTER TABLE weight_records ADD COLUMN kcal INTEGER DEFAULT 0;')
  }
} catch (e) {
  console.error('Migration error:', e)
}

// IPC Handlers
ipcMain.handle('get-clients', () => {
  return db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all()
})

ipcMain.handle('add-client', (_, client) => {
  const stmt = db.prepare('INSERT INTO clients (id, first_name, last_name, email, phone, notes) VALUES (@id, @first_name, @last_name, @email, @phone, @notes)')
  stmt.run(client)
  return client
})

ipcMain.handle('get-client-weights', (_, clientId) => {
  return db.prepare('SELECT * FROM weight_records WHERE client_id = ? ORDER BY record_date ASC').all(clientId)
})

ipcMain.handle('add-weight', (_, record) => {
  const stmt = db.prepare('INSERT INTO weight_records (id, client_id, weight, record_date, kcal, notes) VALUES (@id, @client_id, @weight, @record_date, @kcal, @notes)')
  stmt.run({ ...record, kcal: record.kcal || 0 })
  return record
})

ipcMain.handle('update-client', (_, client) => {
  const stmt = db.prepare('UPDATE clients SET first_name = @first_name, last_name = @last_name, email = @email, phone = @phone, notes = @notes WHERE id = @id')
  stmt.run(client)
  return client
})

ipcMain.handle('delete-client', (_, id) => {
  const stmt = db.prepare('DELETE FROM clients WHERE id = ?')
  stmt.run(id)
  return id
})

ipcMain.handle('update-weight', (_, record) => {
  const stmt = db.prepare('UPDATE weight_records SET weight = @weight, record_date = @record_date, kcal = @kcal, notes = @notes WHERE id = @id')
  stmt.run({ ...record, kcal: record.kcal || 0 })
  return record
})

ipcMain.handle('delete-weight', (_, id) => {
  const stmt = db.prepare('DELETE FROM weight_records WHERE id = ?')
  stmt.run(id)
  return id
})

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Questo va bene assoluto perché serve a Electron prima di lanciare il browser
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    // LA SVOLTA: Nessun __dirname, nessun file://. 
    // Solo il percorso relativo pulito. Electron gestirà l'ASAR in totale sicurezza.
    win.loadFile('dist/index.html')
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.whenReady().then(createWindow)
