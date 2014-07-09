(function () {
    Polymer('atlas-editor', {
        observe: {
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
            // TODO
            // var canvas = document.createElement('canvas');
            // paper.setup(canvas);
            // paper.view.viewSize = [$scope.atlas.width, $scope.atlas.height];
            // this.atlasCanvas.rebuildAtlas(false);

            // var ctx = canvas.getContext('2d');
            // var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // for (var i = 2, pixels = imageData.data, len = pixels.length; i < len; i += 4) {
            //     //pixels[i] = 255;
            //     //pixels[i+1] = 1;
            // }
            
            // return {
            //     canvas: canvas,
            //     buffer: pixels,
            // };
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
