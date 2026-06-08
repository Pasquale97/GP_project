import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getClients: () => ipcRenderer.invoke('get-clients'),
  addClient: (client: any) => ipcRenderer.invoke('add-client', client),
  getClientWeights: (clientId: string) => ipcRenderer.invoke('get-client-weights', clientId),
  addWeight: (record: any) => ipcRenderer.invoke('add-weight', record),
  updateClient: (client: any) => ipcRenderer.invoke('update-client', client),
  deleteClient: (id: string) => ipcRenderer.invoke('delete-client', id),
  updateWeight: (record: any) => ipcRenderer.invoke('update-weight', record),
  deleteWeight: (id: string) => ipcRenderer.invoke('delete-weight', id),
})
