//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let electron = require("electron");
let node_path = require("node:path");
node_path = __toESM(node_path);
let better_sqlite3 = require("better-sqlite3");
better_sqlite3 = __toESM(better_sqlite3);
//#region electron/main.ts
var ICON_PATH = electron.app.isPackaged ? void 0 : node_path.default.join(__dirname, "../assets/icon.icns");
var db = new better_sqlite3.default(node_path.default.join(electron.app.getPath("userData"), "trainer_database.sqlite"));
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
`);
try {
	if (!db.pragma("table_info(weight_records)").some((col) => col.name === "kcal")) db.exec("ALTER TABLE weight_records ADD COLUMN kcal INTEGER DEFAULT 0;");
} catch (e) {
	console.error("Migration error:", e);
}
electron.ipcMain.handle("get-clients", () => {
	return db.prepare("SELECT * FROM clients ORDER BY created_at DESC").all();
});
electron.ipcMain.handle("add-client", (_, client) => {
	db.prepare("INSERT INTO clients (id, first_name, last_name, email, phone, notes) VALUES (@id, @first_name, @last_name, @email, @phone, @notes)").run(client);
	return client;
});
electron.ipcMain.handle("get-client-weights", (_, clientId) => {
	return db.prepare("SELECT * FROM weight_records WHERE client_id = ? ORDER BY record_date ASC").all(clientId);
});
electron.ipcMain.handle("add-weight", (_, record) => {
	db.prepare("INSERT INTO weight_records (id, client_id, weight, record_date, kcal, notes) VALUES (@id, @client_id, @weight, @record_date, @kcal, @notes)").run({
		...record,
		kcal: record.kcal || 0
	});
	return record;
});
electron.ipcMain.handle("update-client", (_, client) => {
	db.prepare("UPDATE clients SET first_name = @first_name, last_name = @last_name, email = @email, phone = @phone, notes = @notes WHERE id = @id").run(client);
	return client;
});
electron.ipcMain.handle("delete-client", (_, id) => {
	db.prepare("DELETE FROM clients WHERE id = ?").run(id);
	return id;
});
electron.ipcMain.handle("update-weight", (_, record) => {
	db.prepare("UPDATE weight_records SET weight = @weight, record_date = @record_date, kcal = @kcal, notes = @notes WHERE id = @id").run({
		...record,
		kcal: record.kcal || 0
	});
	return record;
});
electron.ipcMain.handle("delete-weight", (_, id) => {
	db.prepare("DELETE FROM weight_records WHERE id = ?").run(id);
	return id;
});
var win;
function createWindow() {
	win = new electron.BrowserWindow({
		width: 1200,
		height: 800,
		icon: ICON_PATH,
		webPreferences: { preload: node_path.default.join(__dirname, "preload.js") }
	});
	win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
	});
	if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL);
	else win.loadFile("dist/index.html");
}
electron.app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		electron.app.quit();
		win = null;
	}
});
electron.app.whenReady().then(createWindow);
//#endregion
