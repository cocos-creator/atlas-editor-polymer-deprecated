(function () {
    Polymer('atlas-canvas', {
        minZoom: 0.1,
        maxZoom: 8.0,

        publish: {
            atlas: null,
            customBackgroundColor: false,
            backgroundColor: new FIRE.Color(1,0,1,1),
            elementBgColor: new FIRE.Color( 0.1, 0.38, 1, 0.5 ),
            elementSelectColor: new FIRE.Color(0,0,0,1),
        },

        observe: {
            'zoom': 'updateZoom', 
        },

        created: function () {
            this.zoom = 1.0;

            this.transformSelectRect = null;
        },

        domReady: function () {
            var canvasEL = this.$.canvas;
            var self = this;

            // windows event
            var resizeEventID = window.addEventListener('resize', function() {
                self.resize( self.parentNode.clientWidth, self.parentNode.clientHeight );
            }, false);

            // init paper
            var viewSize = new paper.Size(canvasEL.width, canvasEL.height);

            // init 
            paper.setup(canvasEL);
            // NOTE: initialize should be here: canvasEL.getContext('2d').imageSmoothingEnabled = enabled;
            this.project = paper.project;
            this.project.view.viewSize = viewSize; // to prevent canvas resizing during paper.setup

            // sceneLayer
            this.sceneLayer = this.project.activeLayer;
            this.sceneLayer.applyMatrix = false;
            this.sceneLayer.position = [viewSize.width * 0.5, viewSize.height * 0.5];
            this.sceneLayer.pivot = [0,0];

            // bglayer
            this.bgLayer = PaperUtils.createLayer();
            this.bgLayer.position = [0,0];
            this.bgLayer.pivot = [0,0];
            this.project.layers.unshift(this.bgLayer);

            // fgLayer
            this.fgLayer = PaperUtils.createLayer();
            this.fgLayer.position = [0,0];
            this.fgLayer.pivot = [0,0];
            this.project.layers.push(this.fgLayer);

            this.cameraLayer = PaperUtils.createLayer();
            this.sceneLayer.addChildren ([
                this.cameraLayer,
            ]);

            // create select rect
            this.fgLayer.activate();
            this.selectRect = new paper.Shape.Rectangle(0,0,0,0);
            this.selectRect.style = {
                fillColor: new paper.Color(0, 0.5, 1.0, 0.5),
                strokeColor: new paper.Color(0, 0.7, 1.0, 1.0),
                strokeWidth: 1,
            };

            this.draggingCanvas = false;
            this.draggingItems = false;
            this.rectSelecting = false;
            this.rectSelectStartAt = [0,0];
            this.selection = [];
            this.selectCandicates = [];

            // 
            this._initScene();
            this.repaint();

            // ============================
            // init tool events
            // ============================

            var tool = new paper.Tool();
            var hoverItem = null; 

            function _applyCursor ( event ) {
                if ( event.modifiers.control || event.modifiers.command ) {
                    canvasEL.style.cursor = 'auto';
                    return;
                }

                if ( event.item && event.item.fm_selected ) {
                    canvasEL.style.cursor = 'pointer';
                }
                else {
                    canvasEL.style.cursor = 'auto';
                }
            }

            tool.onKeyDown = function (event) {
                if ( event.key == 'command' || event.key == 'control' ) {
                    canvasEL.style.cursor = 'auto';
                }
            };

            tool.onKeyUp = function (event) {
                if ( event.key == 'command' || event.key == 'control' ) {
                    if ( hoverItem && hoverItem.fm_selected ) {
                        canvasEL.style.cursor = 'pointer';
                    }
                    else {
                        canvasEL.style.cursor = 'auto';
                    }
                }
            };

            // NOTE: paper's mouse move will guarantee no mouse button press down.  
            tool.onMouseMove = function (event) {
                _applyCursor(event);
                hoverItem = event.item;
            };

            tool.onMouseDrag = function (event) {
                // process camera move
                if (self.draggingCanvas) {
                    // drag viewport
                    self.cameraLayer.position = [
                        self.cameraLayer.position.x + event.delta.x / self.zoom,
                        self.cameraLayer.position.y + event.delta.y / self.zoom,
                    ];
                    self.repaint();
                }

                // process rect select
                if ( self.rectSelecting ) {
                    var cursorPos = event.point.add(0.5,0.5);
                    var rect = new paper.Rectangle(self.rectSelectStartAt, cursorPos);
                    self.selectRect.position = rect.center;
                    self.selectRect.size = rect.size;
                    self.selectRect.bringToFront();

                    self.doRectSelect(self.cameraLayer);
                }

                // process dragging item
                if ( self.draggingItems ) {
                    self._moveSelected( self.selection, event.delta );
                }
            };

            tool.onMouseDown = function (event) {
                canvasEL.focus();

                if ( self.draggingCanvas ||
                     self.rectSelecting ||
                     self.draggingItems )
                {
                    return;
                }

                // process camera move ( rightButton or midButton )
                var rightButton = (event.event.which === 3 || event.event.which === 2);
                rightButton = rightButton || (event.event.buttons !== 'undefined' && (event.event.buttons & 2) > 0); // tweak for firefox and IE
                if (rightButton) {
                    self.draggingCanvas = true;
                    canvasEL.style.cursor = 'move';
                    FIRE.addDragGhost("move");
                }

                // process rect select 
                if ( event.event.which === 1 ) {
                    // process single item
                    if ( event.item && event.item.selectable ) {
                        if ( event.modifiers.control || event.modifiers.command ) {
                            self.toggleSelect(event.item);
                        }
                        else {
                            if ( self.isSelected(event.item) ) {
                                self.draggingItems = true;
                                canvasEL.style.cursor = 'pointer';
                                FIRE.addDragGhost("pointer");
                            }
                            else {
                                self.clearSelect();
                                self.addSelect(event.item);
                            }
                        }
                    }
                    else {
                        // start rect select
                        if ( !(event.modifiers.control || event.modifiers.command) ) {
                            self.clearSelect();
                        }
                        self.rectSelecting = true;
                        self.rectSelectStartAt = event.point.add(-0.5,-0.5);
                    }
                }
            };

            tool.onMouseUp = function (event) {
                if ( self.draggingCanvas ) {
                    self.draggingCanvas = false;
                    _applyCursor(event);
                    FIRE.removeDragGhost();
                }
                if ( self.rectSelecting ) {
                    self.confirmRectSelect(self.cameraLayer);

                    self.rectSelecting = false;
                    self.selectRect.position = [0,0]; 
                    self.selectRect.size = [0,0]; 
                }
                else if ( self.draggingItems ) {
                    self.draggingItems = false;
                    _applyCursor(event);
                    FIRE.removeDragGhost();
                }
                else {
                    _applyCursor(event);
                }
            };

            this.resize( this.parentNode.clientWidth, this.parentNode.clientHeight );
        },

        // zoom in / out
        // https://developer.mozilla.org/en-US/docs/Web/Reference/Events/wheel
        wheelAction: function ( event ) {
            var zoom = this.zoom;
            if( event.deltaY < 0 ) {
                zoom += 0.1;
                zoom = Math.min(zoom, this.maxZoom);
            }
            else {
                zoom -= 0.1;
                zoom = Math.max(zoom, this.minZoom);
            }
            this.zoom = parseFloat(zoom.toFixed(2));

            event.stopPropagation();
        },

        updateZoom: function () {
            this.sceneLayer.scaling = [this.zoom, this.zoom];
            this.project.view.update();
            this._zoomChanged(this.zoom);
        },

        setPos: function ( x, y ) {
            this.cameraLayer.position = [x, y];
        },

        setSmoothCanvas: function ( smoothCanvas ) {
            var canvasEL = this.$.canvas;
            canvasEL.getContext('2d').imageSmoothingEnabled = smoothCanvas;
            this.repaint();
        },

        setVersion: function ( version ) {
            this.version = version;
        },

        resetCamera: function () {
            this.zoom = 1.0;
            this.setPos(0,0);
            this.repaint();
        },

        resize: function ( width, height ) {
            var canvasEL = this.$.canvas;

            canvasEL.width = width;
            canvasEL.height = height;

            // resize
            var posFilter = Math.round;
            this.project.view.viewSize = [width, height];
            this.sceneLayer.position = [ 
                posFilter(width * 0.5), 
                posFilter(height * 0.5)
            ];

            this.repaint();
        },

        repaint: function () {
            this.project.activate();
            this._paint();
            this.project.view.update();
        },

        // selection 
        isSelected: function ( item ) {
            return this.selection.indexOf(item) !== -1; 
        },

        toggleSelect: function ( item ) {
            if ( !item )
                return;

            var idx = this.selection.indexOf(item); 
            if ( idx === -1 ) {
                this._select([item]);
                this.selection.push(item);
            }
            else {
                this._unselect([item]);
                this.selection.splice(idx,1);
            }
        },

        clearSelect: function () {
            this._unselect(this.selection);
            this.selection = [];
        },

        addSelect: function ( item ) {
            // var idx = this.selection.indexOf(item); 
            // if ( idx === -1 ) {
                this._select([item]);
                this.selection.push(item);
            // }
        },

        removeSelect: function ( item ) {
            // var idx = this.selection.indexOf(item); 
            // if ( idx !== -1 ) {
                this._unselect([item]);
                this.selection.splice(idx,1);
            // }
        },

        doRectSelectRecrusively: function ( node ) {
            for ( var i = 0; i < node.children.length; ++i ) {
                var item = node.children[i];
                if ( item.selectable ) {
                    if ( item.className === 'Layer' ) {
                        var selectRectTopLeft = item.globalMatrix.inverseTransform(this.selectRect.bounds.topLeft);
                        var selectRectBottomRight = item.globalMatrix.inverseTransform(this.selectRect.bounds.bottomRight);
                        this.transformSelectRect = new paper.Rectangle(selectRectTopLeft,selectRectBottomRight); 
                        this.doRectSelectRecrusively(item);
                    }
                    else {
                        if ( PaperUtils.rectRectContains( this.transformSelectRect, item.bounds ) !== 0 ||
                             PaperUtils.rectRectIntersect( this.transformSelectRect, item.bounds ) )
                        {
                            if ( this.selectCandicates.indexOf(item) === -1 ) {
                                this.selectCandicates.push(item);
                            }
                        }
                    }
                }
            }
        },

        doRectSelect: function ( node ) {
            var i = -1;
            var item = null;
            for ( i = this.selectCandicates.length-1; i >= 0; --i ) {
                item = this.selectCandicates[i];
                if ( this.selection.indexOf(item) !== -1 ) {
                    this.selectCandicates.splice(i,1);
                }
            }
            this._unselect( this.selectCandicates );
            this.selectCandicates = [];
            this.doRectSelectRecrusively (node);
            this._select( this.selectCandicates );
        },

        confirmRectSelect: function ( node ) {
            var i = -1;
            var item = null;
            for ( i = this.selectCandicates.length-1; i >= 0; --i ) {
                item = this.selectCandicates[i];
                if ( this.selection.indexOf(item) !== -1 ) {
                    this.selectCandicates.splice(i,1);
                }
            }
            this._unselect( this.selectCandicates );
            this.selectCandicates = [];
            this.doRectSelectRecrusively (node);
            for ( i = 0; i < this.selectCandicates.length; ++i ) {
                item = this.selectCandicates[i];
                if ( this.selection.indexOf(item) === -1 ) {
                    this.selection.push(item);
                }
            }
            this.selectCandicates = [];

            this._select( this.selection );
        },

        // =============================================

        _createCheckerboard: function ( width, height ) {
            var tmpLayer = PaperUtils.createLayer();
            tmpLayer.activate();

            var gridColor = new paper.Color(128/255, 128/255, 128/255, 1);
            var gridSize = 32;
            var posFilter = Math.round;
            var sizeFilter = Math.floor;
            var zoomedGridSize = sizeFilter(gridSize);
            var template = new paper.Shape.Rectangle(0, 0, zoomedGridSize, zoomedGridSize);
            template.remove();
            template.fillColor = gridColor;
            template.pivot = [-zoomedGridSize/2, -zoomedGridSize/2];
            var symbol = new paper.Symbol(template);
            for (var x = 0; x < width; x += gridSize) {
                for (var y = 0; y < height; y += gridSize) {
                    if (x % (gridSize * 2) !== y % (gridSize * 2)) {
                        symbol.place([posFilter(x), posFilter(y)]);
                    }
                }
            }

            var raster = tmpLayer.rasterize();
            tmpLayer.remove();

            return raster;
        },

        _initScene: function () {
            var posFilter = Math.round;
            var sizeFilter = Math.floor;

            this.atlasBGLayer = PaperUtils.createLayer();
            this.atlasBGLayer.position = [-this.atlas.width*0.5, -this.atlas.height*0.5];
            this.atlasLayer = PaperUtils.createLayer();
            this.atlasLayer.position = [-this.atlas.width*0.5, -this.atlas.height*0.5];
            this.atlasLayer.selectable = true;
            // this.atlasHandlerLayer = PaperUtils.createLayer();
            // this.atlasHandlerLayer.position = [
            //     -this.atlas.width*0.5, 
            //     -this.atlas.height*0.5
            // ];

            this.cameraLayer.addChildren ([
                this.atlasBGLayer,
                this.atlasLayer,
                // this.atlasHandlerLayer,
            ]);

            // init atlas-bg-layer
            this.atlasBGLayer.activate();

            // create checkerboard
            if ( this.checkerboard === undefined ) {
                this.checkerboard = this._createCheckerboard( this.atlas.width, this.atlas.height );
                this.atlasBGLayer.addChild(this.checkerboard);
            }
            if ( this.checkerboardMask === undefined ) {
                this.checkerboardMask = new paper.Shape.Rectangle(0, 0, this.atlas.width, this.atlas.height);
                this.checkerboardMask.insertAbove(this.checkerboard);
            }

            // // init debug text
            // this.fgLayer.activate();
            // if ( this.debugText === undefined ) {
            //     var text = new paper.PointText(10,20);
            //     text.justification = 'left';
            //     text.fillColor = 'white';
            //     text.fontSize = 16;
            //     text.content = 'Hello World';
            //     this.debugText = text;
            // }

            // create border rect
            this.bgLayer.activate();
            if ( this.border === undefined ) {
                var borderWidth = 2;
                this.border = new paper.Shape.Rectangle([0,0], [this.atlas.width,this.atlas.height]);
                this.border.style = {
                    fillColor: new paper.Color(204/255, 204/255, 204/255, 1),
                    strokeWidth: borderWidth,
                    strokeColor: new paper.Color(0.08, 0.08, 0.08, 1),
                    shadowColor: [0, 0, 0, 0.5],
                    shadowBlur: 7,
                    shadowOffset: new paper.Point(2, 2),
                };
            }
        }, 

        _paint: function () {
            var posFilter = Math.round;
            var sizeFilter = Math.floor;

            // without this, atlasLayer's global matrix can't update
            this.project.view.update();
            var atlasLayerMatrix = this.atlasLayer.globalMatrix;

            // update background color
            this.checkerboardMask.visible = this.customBackgroundColor;
            this.checkerboardMask.fillColor = PaperUtils.color( this.backgroundColor );

            var children = this.atlasLayer.children;
            for (var i = 0; i < children.length; ++i) {
                var child = children[i];
                var isRaster = child.data && child.data.sprite;
                if (!isRaster) {
                    continue;
                }

                // update atlas
                var sprite = child.data.sprite;
                if (sprite.rotated) {
                    child.pivot = [-sprite.width * 0.5, sprite.height * 0.5];
                    child.rotation = 90;
                }
                else {
                    child.pivot = [-sprite.width * 0.5, -sprite.height * 0.5];
                    child.rotation = 0;
                }
                child.position = [posFilter(sprite.x), posFilter(sprite.y)];

                // update rectangle
                var left = child.position.x;
                var top = child.position.y;
                var w = sprite.rotatedWidth;
                var h = sprite.rotatedHeight;
                var bgItem = child.data.bgItem;
                bgItem.size = [w, h];
                bgItem.position = new paper.Rectangle(left, top, w, h).center;
                bgItem.fillColor = PaperUtils.color( this.elementBgColor );

                // update outline
                var outline = child.data.outline;
                var outlineMask = child.data.outlineMask;
                if (outline.visible) {
                    var outlineBounds = bgItem.bounds;
                    // outlineBounds = outlineBounds.expand(-outline.strokeWidth/this.zoom);

                    var outlineTL = atlasLayerMatrix.transform(outlineBounds.topLeft);
                    var outlineBR = atlasLayerMatrix.transform(outlineBounds.bottomRight);
                    outlineTL.x = posFilter(outlineTL.x);
                    outlineTL.y = posFilter(outlineTL.y);
                    outlineBR.x = posFilter(outlineBR.x);
                    outlineBR.y = posFilter(outlineBR.y);
                    var outlineStrokeWidth = outline.strokeWidth;
                    var outlineSize = new paper.Point(
                        outlineBR.x-outlineTL.x, 
                        outlineBR.y-outlineTL.y
                    );
                    var outlineCenter = new paper.Point( 
                        outlineTL.x+outlineSize.x/2+outlineStrokeWidth/2, 
                        outlineTL.y+outlineSize.y/2+outlineStrokeWidth/2
                    );

                    outline.position = outlineCenter;
                    outline.size = outlineSize;
                    outline.strokeColor = PaperUtils.color( this.elementSelectColor );

                    outlineMask.position = outlineCenter;
                    outlineMask.size = outlineSize;
                    outlineMask.strokeColor.alpha = this.elementSelectColor.a;
                }
            }

            //
            var borderTL = atlasLayerMatrix.transform([0,0]);
            var borderBR = atlasLayerMatrix.transform([this.atlas.width,this.atlas.height]);
            borderTL.x = posFilter(borderTL.x);
            borderTL.y = posFilter(borderTL.y);
            borderBR.x = posFilter(borderBR.x);
            borderBR.y = posFilter(borderBR.y);

            var strokeWidth = this.border.strokeWidth;
            var size = new paper.Point(
                borderBR.x-borderTL.x+strokeWidth, 
                borderBR.y-borderTL.y+strokeWidth
            );
            var center = new paper.Point( 
                borderTL.x+size.x/2-strokeWidth/2, 
                borderTL.y+size.y/2-strokeWidth/2
            );
            this.border.position = center;
            this.border.size = size;
        },

        _dragEnterAction: function ( event ) {
            this.border.strokeColor = 'blue';
            this.project.view.update();

            event.preventDefault();
            event.stopPropagation();
        },

        _dragOverAction: function ( event ) {
            event.dataTransfer.dropEffect = 'copy';
            this.border.strokeColor = 'blue';
            this.project.view.update();

            event.preventDefault();
            event.stopPropagation();
        },

        _dragLeaveAction: function ( event ) {
            this.border.strokeColor = new paper.Color(0.08, 0.08, 0.08, 1);
            this.project.view.update();

            event.preventDefault();
            event.stopPropagation();
        },

        _dropAction: function ( event ) {
            this.border.strokeColor = new paper.Color(0.08, 0.08, 0.08, 1);
            this.project.view.update();
            var self = this;
            FIRE.getDraggingFiles(event, function (files) {
                self.fire('import', files);
            });

            event.preventDefault();
            event.stopPropagation();
        },

        _focusAction: function ( event ) {
            if (!this.deleteKeys) {
                this.deleteKeys = ['command+backspace', 'ctrl+backspace'];
                if (!FIRE.isdarwin) {
                    this.deleteKeys.push('del');
                }
            }
            Mousetrap.bind(this.deleteKeys, function() {
                for ( var i = 0; i < this.selection.length; ++i ) {
                    this.atlas.remove(this.selection[i].data.sprite);
                }

                if ( this.atlas.autoSize ) {
                    this.atlas.width = 128;
                    this.atlas.height = 128;
                    this.atlas.sort();
                    this.atlas.layout();
                }
                this.selection = [];
                this.rebuildAtlas(false);

                // return false to prevent default browser behavior
                // and stop event from bubbling
                return false;
            }.bind(this) );
        },

        _blurAction: function ( event ) {
            if (this.deleteKeys) {
                Mousetrap.unbind(this.deleteKeys);
            }
        },

        _zoomChanged: function ( zoom ) {
            // this.atlasHandlerLayer.scale( 1.0/this.atlasHandlerLayer.globalMatrix.scaling.x,
            //                               1.0/this.atlasHandlerLayer.globalMatrix.scaling.y );
            this.repaint();
        },

        _select: function ( items ) {
            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                item.data.outline.visible = true;
                item.data.outlineMask.visible = true;
                item.fm_selected = true;
                item.data.bgItem.bringToFront();
                item.bringToFront();
            }
            this.repaint();
        },

        _unselect: function ( items ) {
            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                item.data.outline.visible = false;
                item.data.outlineMask.visible = false;
                item.fm_selected = false;
            }
            this.repaint();
        },

        _moveSelected: function ( items, delta ) {
            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                var sprite = item.data.sprite;
                sprite.x = sprite.x + delta.x/this.zoom;
                sprite.y = sprite.y + delta.y/this.zoom;
            }
            this.repaint();
        },

        resizeAtlas: function () {
            if ( this.atlas.autoSize === false ) {
                this.atlas.layout();
            }

            //
            this.atlasBGLayer.position = [-this.atlas.width*0.5, -this.atlas.height*0.5];
            this.atlasLayer.position = [-this.atlas.width*0.5, -this.atlas.height*0.5];
            // this.atlasHandlerLayer.position = [-this.atlas.width*0.5, -this.atlas.height*0.5];

            //
            if ( this.checkerboard !== undefined ) {
                this.checkerboard.remove();
            }
            this.checkerboard = this._createCheckerboard( this.atlas.width, this.atlas.height );
            this.checkerboardMask.position = [this.atlas.width*0.5, this.atlas.height*0.5];
            this.checkerboardMask.size = [this.atlas.width, this.atlas.height];
            this.atlasBGLayer.addChild(this.checkerboard);
            this.checkerboardMask.insertAbove(this.checkerboard);

            //
            // var borderWidth = 2;
            // var borderRect = new paper.Rectangle(0, 0, this.atlas.width, this.atlas.height);
            // borderRect = borderRect.expand(borderWidth);
            // this.border.size = borderRect.size;
            // this.border.position = [(borderRect.size.width-borderWidth)*0.5,(borderRect.size.height-borderWidth)*0.5];

            this.zoom = 1.0;
            this.setPos(0,0);
            this.repaint();
        },

        // if not exporting, just draw atlas to current paper project
        rebuildAtlas: function (forExport) {
            if (!forExport) {
                this.fgLayer.removeChildren();
                this.atlasLayer.removeChildren();
                this.atlasLayer.activate();
            }

            var i = 0, j = 0, len = 0;
            for (i = 0; i < this.atlas.sprites.length; ++i) {
                var sprite = this.atlas.sprites[i];
                var raster = PaperUtils.createSpriteRaster(sprite);
                raster.selectable = true;
                raster.data.sprite = sprite;
                raster.position = [Math.round(sprite.x), Math.round(sprite.y)];

                if ( !forExport ) {
                    raster.data.bgItem = new paper.Shape.Rectangle(paper.Item.NO_INSERT);
                    raster.data.bgItem.insertBelow(raster);

                    raster.data.outlineMask = new paper.Shape.Rectangle(paper.Item.NO_INSERT);
                    raster.data.outlineMask.style = {
                        strokeWidth: 1,
                        strokeColor: new paper.Color(204/255, 204/255, 204/255, 1),
                    };
                    this.fgLayer.addChild(raster.data.outlineMask);
                    raster.data.outlineMask.visible = false;

                    raster.data.outline = new paper.Shape.Rectangle(paper.Item.NO_INSERT);
                    raster.data.outline.style = {
                        strokeWidth: 1,
                        strokeColor: PaperUtils.color( this.elementSelectColor ),
                        dashArray: [5, 4],
                    };
                    this.fgLayer.addChild(raster.data.outline);
                    raster.data.outline.visible = false;
                }
            }

            if (!forExport) {
                this.fgLayer.addChild(this.selectRect);
                this.selectRect.bringToFront();
                this.repaint();
            }
            else {
                paper.view.update();
            }
        },

        showCheckerboard: function ( showCheckerboard ) {
            this.checkerboard.visible = showCheckerboard;
            this.project.view.update();
        },

        export: function () {
            // setup canvas
            var canvas = document.createElement('canvas');
            paper.setup(canvas);
            paper.view.viewSize = [this.atlas.width, this.atlas.height];
            // render canvas
            if (this.atlas.customBuildColor) {
                var bg = new paper.Shape.Rectangle(0, 0, this.atlas.width, this.atlas.height);
                bg.fillColor = PaperUtils.color(this.atlas.buildColor);
            }
            this.rebuildAtlas(true);
            // restore paper context
            // if we have only one canvas, and only change paper context here, then we do not have to re-activate in other place.
            this.project.activate();

            //
            var ctx = canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var pixelBuffer = imageData.data;

            var fixTranparentBuildColor = this.atlas.customBuildColor && this.atlas.buildColor.a === 0;
            if (fixTranparentBuildColor) {
                var r8 = this.atlas.buildColor.r * 255;
                var g8 = this.atlas.buildColor.g * 255;
                var b8 = this.atlas.buildColor.b * 255;
                for (var i = 0, len = pixelBuffer.length; i < len; i += 4) {
                    if (pixelBuffer[i + 3] === 0) {
                        pixelBuffer[i]     = r8;
                        pixelBuffer[i + 1] = g8;
                        pixelBuffer[i + 2] = b8;
                    }
                }
            }

            pixelBuffer = Utils.applyBleed(this.atlas, pixelBuffer);   // 这里应该是一个导出前才进行的操作，否则对像素的更改有可能被paper重绘时覆盖
            
            return {
                canvas: canvas,
                buffer: pixelBuffer,
            };
        },
    });
})();
