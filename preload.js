const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  navigate: (route) => {
    ipcRenderer.send('navigate', route);
  },
  onNavigate: (callback) => {
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      const route = window.location.hash.slice(1); // Remove the # symbol
      callback(null, route);
    });
  }
});