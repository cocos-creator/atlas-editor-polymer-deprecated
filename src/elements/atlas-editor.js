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

            'canvasSettings.customBackgroundColor': 'repaintAtlasCanvas',
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
            if (!requirejs) {
                console.error('requirejs not loaded!');
            }
            var selectedExporter = 'exporter-cocos2d';
            var self = this;

            var loadingMask = document.body.querySelector("loading-mask");
            loadingMask.show();

            window.setTimeout (
                function () {
                    requirejs([selectedExporter], function (exporter) {
                        // build png
                        var imgData = self.atlasCanvas.export();
                        var canvas = imgData.canvas;
                        var pixelBuffer = imgData.buffer;
                        var dataName = exporter.fileName;
                        self.atlas.textureFileName = FIRE.Path.setExtension(dataName, '.png');

                        function doExport(dataName, dataPath, imgPath) {
                            // build data
                            exporter.exportData(self.atlas, function (text) {
                                if (dataPath && imgPath) {
                                    // save data
                                    FIRE.saveText(text, dataName, dataPath);
                                    // save png
                                    FIRE.savePng(canvas,
                                                 self.atlas.textureFileName,
                                                 imgPath,
                                                 pixelBuffer,
                                                 null,
                                                 function () {
                                                     loadingMask.hide();
                                                 });
                                }
                                else {
                                    // save in zip
                                    requirejs(['jszip'], function (JSZip) {
                                        console.time('zip');
                                        var zip = new JSZip();
                                        zip.file(dataName, text);
                                        FIRE.savePng(canvas, self.atlas.textureFileName, imgPath, pixelBuffer, zip, function () {
                                            var zipname = FIRE.Path.setExtension(dataName, '.zip');
                                            var blob = zip.generate({ type: "blob" });
                                            console.timeEnd('zip');
                                            //requirejs(['filesaver'], function () {
                                                saveAs(blob, zipname);
                                                loadingMask.hide();
                                            //});
                                        });
                                    });
                                }
                            });
                        }
                        if (FIRE.isnw) {
                            FIRE.getSavePath(dataName, 'Key_ExportAtlas', function (dataPath) {
                                var pngPath = FIRE.Path.setExtension(dataPath, '.png');
                                var Path = require('path');
                                dataName = Path.basename(dataPath);
                                
                                doExport(dataName, dataPath, pngPath);
                                
                                var nwgui = require('nw.gui');
                                nwgui.Shell.showItemInFolder(dataPath);
                            });
                        }
                        else {
                            doExport(dataName, null, null);
                        }
                    });
                },
                500
            );
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
                    var sprite = new FIRE.Sprite(img);
                    sprite.name = filename;

                    if (this.atlas.trim) {
                        var trimRect = FIRE.getTrimRect(img, this.atlas.trimThreshold);
                        sprite.trimX = trimRect.x;
                        sprite.trimY = trimRect.y;
                        sprite.width = trimRect.width;
                        sprite.height = trimRect.height;
                    }

                    this.atlas.add(sprite);
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

            this.atlasCanvas.clearSelect();
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
