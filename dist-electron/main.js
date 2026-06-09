var e=Object.create,t=Object.defineProperty,n=Object.getOwnPropertyDescriptor,r=Object.getOwnPropertyNames,i=Object.getPrototypeOf,a=Object.prototype.hasOwnProperty,o=(e,i,o,s)=>{if(i&&typeof i==`object`||typeof i==`function`)for(var c=r(i),l=0,u=c.length,d;l<u;l++)d=c[l],!a.call(e,d)&&d!==o&&t(e,d,{get:(e=>i[e]).bind(null,d),enumerable:!(s=n(i,d))||s.enumerable});return e},s=(n,r,a)=>(a=n==null?{}:e(i(n)),o(r||!n||!n.__esModule?t(a,`default`,{value:n,enumerable:!0}):a,n));let c=require("electron"),l=require("node:path");l=s(l);let u=require("better-sqlite3");u=s(u),c.app.isPackaged?l.default.join(process.resourcesPath,`app.asar`,`dist`):l.default.join(__dirname,`../dist`);var d=new u.default(l.default.join(c.app.getPath(`userData`),`trainer_database.sqlite`));d.exec(`
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
`);try{d.pragma(`table_info(weight_records)`).some(e=>e.name===`kcal`)||d.exec(`ALTER TABLE weight_records ADD COLUMN kcal INTEGER DEFAULT 0;`)}catch(e){console.error(`Migration error:`,e)}c.ipcMain.handle(`get-clients`,()=>d.prepare(`SELECT * FROM clients ORDER BY created_at DESC`).all()),c.ipcMain.handle(`add-client`,(e,t)=>(d.prepare(`INSERT INTO clients (id, first_name, last_name, email, phone, notes) VALUES (@id, @first_name, @last_name, @email, @phone, @notes)`).run(t),t)),c.ipcMain.handle(`get-client-weights`,(e,t)=>d.prepare(`SELECT * FROM weight_records WHERE client_id = ? ORDER BY record_date ASC`).all(t)),c.ipcMain.handle(`add-weight`,(e,t)=>(d.prepare(`INSERT INTO weight_records (id, client_id, weight, record_date, kcal, notes) VALUES (@id, @client_id, @weight, @record_date, @kcal, @notes)`).run({...t,kcal:t.kcal||0}),t)),c.ipcMain.handle(`update-client`,(e,t)=>(d.prepare(`UPDATE clients SET first_name = @first_name, last_name = @last_name, email = @email, phone = @phone, notes = @notes WHERE id = @id`).run(t),t)),c.ipcMain.handle(`delete-client`,(e,t)=>(d.prepare(`DELETE FROM clients WHERE id = ?`).run(t),t)),c.ipcMain.handle(`update-weight`,(e,t)=>(d.prepare(`UPDATE weight_records SET weight = @weight, record_date = @record_date, kcal = @kcal, notes = @notes WHERE id = @id`).run({...t,kcal:t.kcal||0}),t)),c.ipcMain.handle(`delete-weight`,(e,t)=>(d.prepare(`DELETE FROM weight_records WHERE id = ?`).run(t),t));var f;function p(){f=new c.BrowserWindow({width:1200,height:800,webPreferences:{preload:l.default.join(__dirname,`preload.js`)}}),f.webContents.on(`did-finish-load`,()=>{f?.webContents.send(`main-process-message`,new Date().toLocaleString())}),process.env.VITE_DEV_SERVER_URL?f.loadURL(process.env.VITE_DEV_SERVER_URL):f.loadFile(`dist/index.html`)}c.app.on(`window-all-closed`,()=>{process.platform!==`darwin`&&(c.app.quit(),f=null)}),c.app.whenReady().then(p);