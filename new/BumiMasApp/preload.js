const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    on: (channel, callback) => {
        ipcRenderer.on(channel, (event, ...args) => callback(...args));
    },
    send: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    invoke: (channel, ...args) => {
        return ipcRenderer.invoke(channel, ...args);
    }
});
