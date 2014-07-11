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

        ready: function () {
            this.atlasCanvas = this.$["atlas-canvas"];
        },

        exportAction: function () {
            // 测试代码，需要整理
            window.navigator.saveBlob = window.navigator.saveBlob || window.navigator.msSaveBlob;
            // export json
            var json = FIRE.serialize(this.atlas);
            var blob = new Blob([json], { type: "text/plain;charset=utf-8" });    // not support 'application/json'
            var name = 'atlas';
            if (window.navigator.saveBlob) {
                window.navigator.saveBlob(blob, name + ".json");
            }
            else {
                var jsonDataURL = (window.URL || window.webkitURL).createObjectURL(blob);
                FIRE.downloadDataUrl(jsonDataURL, name + ".json");
            }
            // export png
            var data = this.atlasCanvas.export();
            var canvas = data.canvas;
            var buffer = data.buffer;
            var pngDataURL, blobBuilderObject;
            var encodeByCanvas = false;     // encodedByCanvas not contour bleeding
            if (encodeByCanvas) {
                canvas.toBlob = canvas.toBlob || canvas.msToBlob;
                if (canvas.toBlob && window.navigator.saveBlob) {
                    window.navigator.saveBlob(canvas.toBlob(), name + ".png");
                }
                else {
                    pngDataURL = canvas.toDataURL("image/png");
                    FIRE.downloadDataUrl(pngDataURL, name + ".png");
                }
            }
            else {
                console.time('libpng');

                var png = libpng.createWriter(canvas.width, canvas.height);
                png.set_filter(libpng.FILTER_NONE);
                png.set_compression_level(3);
                png.write_imageData(buffer);
                png.write_end();

                console.timeEnd('libpng');
                console.log('Bytes: ' + png.data.length);
                console.time('encode base64');

                pngDataURL = png.encode_base64();

                console.timeEnd('encode base64');
            
                // save png data
                if (Blob && window.navigator.saveBlob) {
                    blob = new Blob([new Uint8Array(png.data)], {type: 'image/png'});
                    window.navigator.saveBlob(blob, name + ".png");
                }
                else {
                    pngDataURL = 'data:image/png;base64,' + pngDataURL;
                    //pngDataURL = 'i' + pngDataURL;
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
                    FIRE.downloadDataUrl(pngDataURL, name + ".png");
                }
            }
        },

        importAction: function ( event, detail ) {
            var acceptedTypes = {
                'image/png': true,
                'image/jpeg': true,
                'image/jpg': true,
                'image/gif': true
            };
            var processing = 0;
            var onload = function (event) {
                var imgOnLoad = function () {
                    var texture = new FIRE.SpriteTexture(img);
                    texture.name = event.target.filename;

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
            for (var i = 0; i < detail.files.length; ++i) {
                file = detail.files[i];
                if ( acceptedTypes[file.type] === true ) {
                    processing += 1;
                    var reader = new FileReader();
                    reader.filename = file.name;
                    reader.atlas = this.atlas;
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
