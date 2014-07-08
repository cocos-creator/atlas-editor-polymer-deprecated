var AtlasEditor = (function () {
    function AtlasEditor ( canvas ) {
        this.atlas = new FIRE.Atlas();
        this.freeMoveCanvas = new FreeMoveCanvas(canvas);

        this.sizeList = [ 
            { name: '128', value: 128 },
            { name: '256', value: 256 },
            { name: '512', value: 512 },
            { name: '1024', value: 1024 },
            { name: '2048', value: 2048 },
            { name: '4096', value: 4096 },
        ];
    }

    AtlasEditor.prototype.layout = function () {
        console.log("Do Atlas Layout");
    };

    AtlasEditor.prototype.export = function () {
        console.log("Do Atlas Export");
    };

    return AtlasEditor;
})();
