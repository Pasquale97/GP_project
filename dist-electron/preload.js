let electron = require("electron");
//#region electron/preload.ts
electron.contextBridge.exposeInMainWorld("electronAPI", {
	getClients: () => electron.ipcRenderer.invoke("get-clients"),
	addClient: (client) => electron.ipcRenderer.invoke("add-client", client),
	getClientWeights: (clientId) => electron.ipcRenderer.invoke("get-client-weights", clientId),
	addWeight: (record) => electron.ipcRenderer.invoke("add-weight", record),
	updateClient: (client) => electron.ipcRenderer.invoke("update-client", client),
	deleteClient: (id) => electron.ipcRenderer.invoke("delete-client", id),
	updateWeight: (record) => electron.ipcRenderer.invoke("update-weight", record),
	deleteWeight: (id) => electron.ipcRenderer.invoke("delete-weight", id)
});
//#endregion
