(function () {
    Polymer('atlas-editor', {
        observe: {
            'atlas.autoSize': 'atlasLayoutChanged', 
            'atlas.width': 'atlasSizeChanged', 
            'atlas.height': 'atlasSizeChanged', 

            'atlas.customPadding': 'atlasLayoutChanged',
            'atlas.algorithm': 'atlasLayoutChanged',
            'atlas.sortBy': 'atlasLayoutChanged',
            'atlas.sortOrder': 'atlasLayoutChanged',
            'atlas.allowRotate': 'atlasLayoutChanged',

            'canvasSettings.smoothCanvas': 'smoothCanvasChanged',
            'canvasSettings.showCheckerboard': 'showCheckerboardChanged',

            'canvasSettings.elementBgColor.r': 'repaintAtlasCanvas',
            'canvasSettings.elementBgColor.g': 'repaintAtlasCanvas',
            'canvasSettings.elementBgColor.b': 'repaintAtlasCanvas',
            'canvasSettings.elementBgColor.a': 'repaintAtlasCanvas',
            'canvasSettings.elementSelectColor.r': 'repaintAtlasCanvas',
            'canvasSettings.elementSelectColor.g': 'repaintAtlasCanvas',
            'canvasSettings.elementSelectColor.b': 'repaintAtlasCanvas',
            'canvasSettings.elementSelectColor.a': 'repaintAtlasCanvas',
            'canvasSettings.backgroundColor.r': 'repaintAtlasCanvas',
            'canvasSettings.backgroundColor.g': 'repaintAtlasCanvas',
            'canvasSettings.backgroundColor.b': 'repaintAtlasCanvas',
            'canvasSettings.backgroundColor.a': 'repaintAtlasCanvas',
        },

        created: function() {
            this.atlas = new FIRE.Atlas();
            this.sizeList = [ 
                { name: '128', value: 128 },
                { name: '256', value: 256 },
                { name: '512', value: 512 },
                { name: '1024', value: 1024 },
                { name: '2048', value: 2048 },
                { name: '4096', value: 4096 },
            ];
            this.canvasSettings = new AtlasCanvasSettings();
        },

        domReady: function () {
            this.atlasCanvas = this.$["atlas-canvas"];
        },

        exportAction: function () {
            // build json
            var json = FIRE.serialize(this.atlas);
            // build png
            var data = this.atlasCanvas.export();
            // export
            var name = 'atlas';
            debugger;
            if (FIRE.isnw) {
                FIRE.getSavePath(name + '.json', 'Key_ExportAtlas', function (txtPath) {
                    var pngPath = FIRE.setExtension(txtPath, '.png');
                    var Path = require('path');
                    var basename = Path.basename(txtPath, Path.extname(txtPath));
                    
                    FIRE.saveText(json, basename + ".json", txtPath);
                    FIRE.savePng(data.canvas, basename, pngPath, data.buffer);
                    
                    var nwgui = require('nw.gui');
                    nwgui.Shell.showItemInFolder(txtPath);
                });
            }
            else {
                FIRE.saveText(json, name + ".json", null);
                FIRE.savePng(data.canvas, name, null, data.buffer);
            }
            //console.time('encode base64');
            //var pngDataURL = png.encode_base64();
            //pngDataURL = 'data:image/png;base64,' + pngDataURL;
            //console.timeEnd('encode base64');
                
            //var url2 = canvas.toDataURL("image/png");
            //url2 = url2.slice('data:image/png;base64,'.length, 1000);
            //console.log(pngDataURL.slice(0, 100));
            //console.log(pngDataURL.length);
            //console.log(pngDataURL.slice(pngDataURL.length - 100));
            //console.log(pngDataURL);
            //console.log(url2.slice(0, 100));
            //console.log(url2.length);
            //console.log(url2.slice(url2.length - 100));
            //console.log(url2);
            //console.log('decode64 pngDataURL ' + decode64(pngDataURL));
            //console.log('decode64 url2 ' + decode64(url2));
        },

        importAction: function ( event, files ) {
            var acceptedTypes = {
                'image/png': true,
                'image/jpeg': true,
                'image/jpg': true,
                'image/gif': true,
            };
            var processing = 0;
            var onload = function (event) {
                var filename = event.target.filename;   // target.filename may be deleted later
                var imgOnLoad = function () {
                    var texture = new FIRE.SpriteTexture(img);
                    texture.name = filename;

                    if (this.atlas.trim) {
                        var trimRect = FIRE.getTrimRect(img, this.atlas.trimThreshold);
                        texture.trimX = trimRect.x;
                        texture.trimY = trimRect.y;
                        texture.width = trimRect.width;
                        texture.height = trimRect.height;
                    }

                    this.atlas.add(texture);
                    processing -= 1;
                    
                    // checkIfFinished
                    if ( processing === 0 ) {
                        this.doAtlasLayout();
                        this.atlasCanvas.rebuildAtlas(false);
                    }
                };

                var img = new Image();
                img.classList.add('atlas-item');
                img.onload = imgOnLoad.bind(this);
                img.src = event.target.result;  // 这里的dataURL是原始数据，但Image填充到画布上后，透明像素的部分会变成黑色。
            };

            var onloadBinded = onload.bind(this);
            for (var i = 0; i < files.length; ++i) {
                file = files[i];
                if ( acceptedTypes[file.type] === true ) {
                    processing += 1;
                    var reader = new FileReader();
                    reader.filename = file.name;
                    reader.onload = onloadBinded;
                    reader.readAsDataURL(file);
                }
            }
        },

        layoutAction: function () {
            this.doAtlasLayout();
            this.atlasCanvas.repaint();
        },

        doAtlasLayout: function () {
            if ( this.atlas.autoSize ) {
                this.atlas.width = 128;
                this.atlas.height = 128;
            }
            this.atlas.sort();
            this.atlas.layout();
        },

        atlasSizeChanged: function () {
            this.atlasCanvas.resizeAtlas();
        },

        atlasLayoutChanged: function () {
            this.doAtlasLayout();
            this.atlasCanvas.repaint();
        },

        showCheckerboardChanged: function () {
            this.atlasCanvas.showCheckerboard(this.canvasSettings.showCheckerboard);
        },

        smoothCanvasChanged: function () {
            this.atlasCanvas.setSmoothCanvas(this.canvasSettings.smoothCanvas);
        },

        repaintAtlasCanvas: function () {
            this.atlasCanvas.repaint();
        },

    });
})();
