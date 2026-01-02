"use strict";

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    files: {
        getFolder: () => ipcRenderer.invoke('files:getFolder'),
        list: () => ipcRenderer.invoke('files:list'),
        read: (filePath) => ipcRenderer.invoke('files:read', filePath),
        write: (filePath, content) => ipcRenderer.invoke('files:write', filePath, content),
        create: (fileName) => ipcRenderer.invoke('files:create', fileName),
        delete: (filePath) => ipcRenderer.invoke('files:delete', filePath),
        rename: (oldPath, newName) => ipcRenderer.invoke('files:rename', oldPath, newName),
    },
    settings: {
        get: () => ipcRenderer.invoke('settings:get'),
        setFolder: (folderPath) => ipcRenderer.invoke('settings:setFolder', folderPath),
    },
    on: (channel, callback) => {
        const validChannels = [
            'file:added',
            'file:deleted',
            'file:changed',
            'menu:new-file',
            'menu:save',
            'menu:settings',
            'settings:folder-changed',
        ];

        if (validChannels.includes(channel)) {
            const subscription = (_event, ...args) => callback(...args);
            ipcRenderer.on(channel, subscription);

            // Return cleanup function
            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        }

        return () => { };
    },
});
