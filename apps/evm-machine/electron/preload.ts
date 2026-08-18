import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('evmHardware', {
  scanFingerprint: () => ipcRenderer.invoke('scan-fingerprint'),
  printVoterSlip: (voteData: any) => ipcRenderer.invoke('print-voter-slip', voteData),
});
