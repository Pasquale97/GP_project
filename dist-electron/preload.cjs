import { contextBridge, ipcRenderer } from "electron";
//#region electron/preload.ts
contextBridge.exposeInMainWorld("electronAPI", {
	getClients: () => ipcRenderer.invoke("get-clients"),
	addClient: (client) => ipcRenderer.invoke("add-client", client),
	getClientWeights: (clientId) => ipcRenderer.invoke("get-client-weights", clientId),
	addWeight: (record) => ipcRenderer.invoke("add-weight", record)
});
//#endregion
export {};
