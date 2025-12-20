const {app, BrowserWindow} = require('electron');
const path=require('path');

const CreateWindow = () => 
    {
    const win = new BrowserWindow
    ({
        width:900,
        height:700, 
        resizable:false,
        webPreferences:
        {
            nodeIntegration:true,
            contextIsolation:false,
        } 
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => 
{
    CreateWindow();

    app.on('activate', () => 
    {
        if(BrowserWindow.getAllWindows().length === 0){
            CreateWindow();
        }
    });
});

app.on('window-all-closed', () => 
    {
    if(process.platform !== 'darwin')
        {
        app.quit();
    }
});
