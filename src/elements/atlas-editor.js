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
            this.version = 'v<%= gulp_version %> (Build <%= gulp_build %>)';
            this.selection = [];
        },

        domReady: function () {
            this.atlasCanvas = this.$["atlas-canvas"];
            this.atlasCanvas.setVersion(this.version);
            this.spriteListView = this.$["sprite-list-view"];
        },

        exportAction: function () {
            if (!requirejs) {
                console.error('requirejs not loaded!');
            }
            var selectedExporter = 'exporter-cocos2d';
            var minLoadingTime = 800;
            var self = this;

            function buildPng (useZip) {
                return new Promise(function (resolve, reject) {
                    var imgData = self.atlasCanvas.export();
                    var canvas = imgData.canvas;
                    var pixelBuffer = imgData.buffer;
                    // save png
                    FIRE.buildPng(canvas,
                                  self.atlas.textureFileName,
                                  pixelBuffer,
                                  useZip,
                                  function (data) {
                                      resolve(data);
                                  });
                });
            }
            
            function exportFiles (exporter, dataName, dataPath, buildPngPromise) {
                return new Promise(function (resolve, reject) {
                    exporter.exportData(self.atlas, function (text) {
                        // save data
                        FIRE.saveText(text, dataName, dataPath);
                        buildPngPromise.then(function (data) {
                            var imgPath = dataPath && FIRE.Path.setExtension(dataPath, '.png');
                            FIRE.savePng(data, self.atlas.textureFileName, imgPath, null);
                            resolve();
                        });
                    });
                });
            }

            function exportZip (exporter, dataName, buildPngPromise, requireZip) {
                return new Promise(function (resolve, reject) {
                    exporter.exportData(self.atlas, function (text) {
                        Promise.all([ buildPngPromise, requireZip ])
                        .spread(function (data, JSZip) {
                            // create
                            //console.time('zip');
                            var zip = new JSZip();

                            zip.file(dataName, text);
                            FIRE.savePng(data, self.atlas.textureFileName, null, zip);

                            var blob = zip.generate({ type: "blob" });
                            //console.timeEnd('zip');
                            resolve(blob);
                        });
                    });
                });
            }

            var loadingMask = this.$.loadingMask;
            loadingMask.show();

            var maskFadeInDuration = 500;   // IE压缩png时会挂起浏览器，所以需要等mask渲染出来
            var buildPngPromise = Promise.delay(maskFadeInDuration).then(function () {
                var useZip = !FIRE.isnw;
                return buildPng(useZip);
            });
            if (FIRE.isnw) {
                requireAsync(selectedExporter)
                .then(function (exporter) {
                    loadingMask.hide(); // here have to hide the mask temporary,
                                        // because it seems like that in node-webkit, we could not get any callback while users canceled the file dialog
                    return new Promise(function (resolve, reject) {
                        FIRE.getSavePath(exporter.fileName, 'Key_ExportAtlas', function (dataPath) {
                            loadingMask.show();

                            var Path = require('path');
                            var dataName = Path.basename(dataPath);
                            self.atlas.textureFileName = FIRE.Path.setExtension(dataName, '.png');
                            Promise.all([
                                Promise.delay(minLoadingTime),
                                exportFiles(exporter, dataName, dataPath, buildPngPromise)
                            ]).then(function () {
                                resolve(dataPath);
                            });
                        });
                    });
                }).then(function (dataPath) {
                    var nwgui = require('nw.gui');
                    nwgui.Shell.showItemInFolder(dataPath);
                    // finished
                    loadingMask.hide();
                });
            }
            else {
                var requireSaver = requireAsync('filesaver');
                var requireZip = requireAsync('jszip');
                var exportPromise = requireAsync(selectedExporter)
                                    .then(function (exporter) {
                                        self.atlas.textureFileName = FIRE.Path.setExtension(exporter.fileName, '.png');
                                        return exportZip(exporter, exporter.fileName, buildPngPromise, requireZip);
                                    });
                Promise.all([exportPromise, requireSaver, Promise.delay(minLoadingTime)])
                .spread(function(blob) {
                    var zipname = FIRE.Path.setExtension(self.atlas.textureFileName, '.zip');
                    saveAs(blob, zipname);
                    // finished
                    loadingMask.hide();
                });
            }
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
                img.src = event.target.result;  // 这里的dataURL是原始数据，但Image填充到画布上后，透明像素的部分会变成黑色
            };

            //
            var fileProcessList = [];
            var i = 0;
            var file = null;
            var onloadBinded = onload.bind(this);

            for (i = 0; i < files.length; ++i) {
                file = files[i];
                if ( acceptedTypes[file.type] === true ) {
                    fileProcessList.push(file);
                }
            }

            //
            processing = fileProcessList.length;
            for (i = 0; i < fileProcessList.length; ++i) {
                file = fileProcessList[i];
                var reader = new FileReader();
                reader.filename = file.name;
                reader.onload = onloadBinded;
                reader.readAsDataURL(file);
            }
        },

        layoutAction: function () {
            this.doAtlasLayout();
            this.atlasCanvas.repaint();
        },

        deleteSpritesAction: function () {
            if ( this.atlas.autoSize ) {
                this.atlas.width = 128;
                this.atlas.height = 128;
                this.atlas.sort();
                this.atlas.layout();
            }
            this.atlasCanvas.rebuildAtlas(false);
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
