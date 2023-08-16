const path = require('path'); //isso aqui é um path module, dá pra usar outros modules do node e npm. Pesquisar mais sobre isso
const { app, BrowserWindow, Menu } = require('electron'); //toda vez que abrir o programa a gente vai instanciar um browserWindow
const isMac = process.platform === 'darwin';
const isDev = process.env.NODE_ENV !== 'production';

function createMainWindow(){
    const mainWindow = new BrowserWindow({
        title: 'Image Resizer',
        width: isDev? 1000 : 500,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    //Opening devTools if we are in the dev enviroment
    if(isDev){
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
};

//Creating a new window
function createAboutWindow(){
    const aboutWindow = new BrowserWindow({
        title: 'About Image Resizer',
        width: 300,
        height: 300
    });

    aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
}
app.whenReady().then(() => {
    createMainWindow();

    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
});

//Menu template
const menu = [
    ...(isMac ?
        [{
            label: app.name,
            submenu: [
                {
                    label: 'About',
                    click: createAboutWindow
                }
            ]
        }]
        : []
    ),
    {
        role: 'fileMenu',
    },
    ...(!isMac ? 
        [{
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: createAboutWindow
                }
            ]
        }] 
        : []
    )
]

app.on('window-all-closed', () => {
    if (!isMac) app.quit()
})