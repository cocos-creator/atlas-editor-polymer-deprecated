angular.module('atlasEditor', ['fireUI'])
.factory ( '$atlas', ['$rootScope', function ($rootScope) {
    var atlas = {};
    atlas.data = new FIRE.Atlas();
    atlas.layout = function () {
        var atlas = this.data;
        if ( atlas.autoSize ) {
            atlas.width = 128;
            atlas.height = 128;
        }
        atlas.sort();
        atlas.layout();
        $rootScope.$broadcast( 'repaint', true );
    };

    return atlas;
}])
.factory ( '$editor', function () {
    var editor = {};
    editor.elementBgColor = new FIRE.Color( 0, 0.28, 1, 0.5 );
    editor.elementSelectColor = new FIRE.Color(1,1,0,1);
    editor.backgroundColor = new FIRE.Color(0,0,0,0);
    editor.showCheckerboard = true;
    editor.smoothCanvas = true;

    return editor;
})
.run( ['$atlas', function($atlas) {
    console.log('starting atlas-editor');

    // document events
    document.ondrop = function(e) { e.preventDefault(); };
    document.ondragover = function(e) { e.preventDefault(); };

    if ( FIRE.isnw ) {
        var nwgui = require('nw.gui');
        var nativeWin = nwgui.Window.get();

        if (process.platform === 'darwin') {
            var nativeMenuBar = new nwgui.Menu({ type: "menubar" });
            nativeMenuBar.createMacBuiltin("Atlas Editor");
            nativeWin.menu = nativeMenuBar;
        }

        $(document).keydown(function (e) { 
            // F12
            if ( e.keyCode == 123 ) {
                nativeWin.showDevTools(); 
                e.stopPropagation();
            }
        });

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
}])
;
