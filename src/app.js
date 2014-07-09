console.log('starting atlas-editor');

//
AtlasCanvasSettings = (function () {
    var _super = FIRE.Asset;

    // constructor
    function AtlasCanvasSettings () {
        _super.call(this);

        this.elementBgColor = new FIRE.Color( 0, 0.28, 1, 0.5 );
        this.elementSelectColor = new FIRE.Color(1,1,0,1);
        this.backgroundColor = new FIRE.Color(0,0,0,0);
        this.showCheckerboard = true;
        this.smoothCanvas = true;
    }
    FIRE.extend(AtlasCanvasSettings, _super);
    AtlasCanvasSettings.prototype.__classname__ = "FIRE.AtlasCanvasSettings";

    return AtlasCanvasSettings;
})();

// document events
document.addEventListener( "drop", function (e) {
    e.preventDefault(); 
} );
document.addEventListener( "dragover", function (e) {
    e.preventDefault(); 
} );

if ( FIRE.isnw ) {
    var nwgui = require('nw.gui');
    var nativeWin = nwgui.Window.get();

    if (process.platform === 'darwin') {
        var nativeMenuBar = new nwgui.Menu({ type: "menubar" });
        nativeMenuBar.createMacBuiltin("Atlas Editor");
        nativeWin.menu = nativeMenuBar;
    }

    document.onkeydown = function (e) { 
        switch ( e.keyCode ) {
            // F12
            case 123:
                nativeWin.showDevTools(); 
            e.stopPropagation();
            break;

            // F5
            case 116:
                nativeWin.reload();
            break;
        }
    };

    // TODO: node-webkit custom contextmenu
    // function Menu(cutLabel, copyLabel, pasteLabel) {
    //     var gui = require('nw.gui');
    //     var menu = new gui.Menu();

    //     var cut = new gui.MenuItem({
    //         label: cutLabel || "Cut", 
    //         click: function() {
    //           document.execCommand("cut");
    //           console.log('Menu:', 'cutted to clipboard');
    //         }
    //     });

    //     var copy = new gui.MenuItem({
    //         label: copyLabel || "Copy",
    //         click: function() {
    //           document.execCommand("copy");
    //           console.log('Menu:', 'copied to clipboard');
    //         }
    //     });

    //     var paste = new gui.MenuItem({
    //         label: pasteLabel || "Paste",
    //         click: function() {
    //           document.execCommand("paste");
    //           console.log('Menu:', 'pasted to textarea');
    //         }
    //     });

    //     menu.append(cut);
    //     menu.append(copy);
    //     menu.append(paste);

    //     return menu;
    // }

    // var menu = new Menu([> pass cut, copy, paste labels if you need i18n<]);
    // $(document).on("contextmenu", function(e) {
    //     e.preventDefault();
    //     menu.popup(e.originalEvent.x, e.originalEvent.y);
    // });
}
