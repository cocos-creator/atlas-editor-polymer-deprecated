var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
//var globalShortcut = require('global-shortcut');

// Report crashes to our server.
//require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    app.quit();
});

// This method will be called when atom-shell has done everything
// initialization and ready for creating browser windows.
app.on('ready', function () {
    // Create the browser window.
    mainWindow = new BrowserWindow({ width: 1280, height: 900 });

    // and load the index.html of the app.
    mainWindow.loadUrl( "file://" + __dirname + "/index.html");

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    //mainWindow.openDevTools();
});

//globalShortcut.register('F12', function () {
//    var win = BrowserWindow.getFocusedWindow();
//    if (win) {
//        win.toggleDevTools();
//    }
//});

if (process.platform === 'darwin') {
    // build menu
    var Menu = require('menu');
    var template = [
        {
            label: 'Atlas Editor',
            submenu: [
                {
                    label: 'About Fireball-x',
                    selector: 'orderFrontStandardAboutPanel:'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Hide Fireball-x',
                    accelerator: 'CmdOrCtrl+H',
                    selector: 'hide:'
                },
                {
                    label: 'Hide Others',
                    accelerator: 'CmdOrCtrl+Shift+H',
                    selector: 'hideOtherApplications:'
                },
                {
                    label: 'Show All',
                    selector: 'unhideAllApplications:'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Quit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: function () { app.quit(); }
                }
            ]
        }
    ];
    menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}