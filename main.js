const path = require('path'); //isso aqui é um path module, dá pra usar outros modules do node e npm. Pesquisar mais sobre isso
const os = require('os');
const fs = require('fs');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron'); //toda vez que abrir o programa a gente vai instanciar um browserWindow
const ResizeImg = require('resize-img');
const isMac = process.platform === 'darwin';
const isDev = process.env.NODE_ENV !== 'production';

let mainWindow;

function createMainWindow(){
    mainWindow = new BrowserWindow({
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
};

app.whenReady().then(() => {
    createMainWindow();

    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    //Remove mainWindow from memory when closed
    mainWindow.on('closed', () => (mainWindow = null));

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
];

//Respond to ipcRenderer resize
ipcMain.on('image:resize', (e, options) => {
    options.dest = path.join(os.homedir(), 'imageresizer');
    resizeImage(options);
});

//Resize image
async function resizeImage({ imgPath, width, height, dest }) {
    try {
        const newPath = await ResizeImg(fs.readFileSync(imgPath), {
            width: +width,
            height: +height
        });

        //Create filename
        const filename = path.basename(imgPath);

        //Create destination folder if it doesn't already exists
        if(!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        };

        //Write file to destination folder
        fs.writeFileSync(path.join(dest, filename), newPath);

        //Send success message to the renderer
        mainWindow.webContents.send('image:done');

        //Open destiantion folder
        shell.openPath(dest);

    } catch (error) {
        console.log(error)
    }
}

app.on('window-all-closed', () => {
    if (!isMac) app.quit()
})