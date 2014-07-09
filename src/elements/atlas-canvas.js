(function () {
    Polymer('atlas-canvas', {
        created: function () {
            this.atlas = new FIRE.Atlas(); 
            this.zoom = 1.0;

            this.transformSelectRect = null;
        },

        ready: function () {
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

            this.project.activate();

            // rootLayer
            this.rootLayer = this.project.activeLayer;
            this.rootLayer.applyMatrix = false;
            this.rootLayer.position = [viewSize.width * 0.5, viewSize.height * 0.5];
            this.rootLayer.pivot = [0,0];

            // bglayer
            this.bgLayer = PaperUtils.createLayer();
            this.bgLayer.position = [viewSize.width * 0.5, viewSize.height * 0.5];
            this.bgLayer.pivot = [0,0];
            this.project.layers.unshift(this.bgLayer);

            // fgLayer
            this.fgLayer = PaperUtils.createLayer();
            this.fgLayer.position = [0,0];
            this.fgLayer.pivot = [0,0];
            this.project.layers.push(this.fgLayer);

            this.sceneLayer = PaperUtils.createLayer();
            this.rootLayer.addChildren ([
                this.sceneLayer,
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
                    self.sceneLayer.position = [
                        self.sceneLayer.position.x + event.delta.x / self.zoom,
                        self.sceneLayer.position.y + event.delta.y / self.zoom,
                    ];
                    self.bgLayer.position = [ 
                        self.bgLayer.position.x + event.delta.x,
                        self.bgLayer.position.y + event.delta.y,
                    ];
                }

                // process rect select
                if ( self.rectSelecting ) {
                    var cursorPos = event.point.add(-0.5,-0.5);
                    var rect = new paper.Rectangle(self.rectSelectStartAt, cursorPos);
                    self.selectRect.position = rect.center;
                    self.selectRect.size = rect.size;

                    self.doRectSelect(self.sceneLayer);
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

                // process camera move
                var rightButton = event.event.which === 3;
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
                    self.confirmRectSelect(self.sceneLayer);

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
        },

        domReady: function () {
            this.resize( this.parentNode.clientWidth, this.parentNode.clientHeight );
        },

        // zoom in / out
        // https://developer.mozilla.org/en-US/docs/Web/Reference/Events/wheel
        wheelAction: function ( event ) {
            var zoom = this.zoom;
            if( event.deltaY < 0 ) {
                zoom += 0.1;
                zoom = Math.min(zoom, 8);
            }
            else {
                zoom -= 0.1;
                zoom = Math.max(zoom, 0.1);
            }
            this.setZoom(zoom);

            event.stopPropagation();
        },

        contextmenuAction: function ( event ) {
            event.preventDefault();
            event.stopPropagation();
        },

        setZoom: function ( zoom ) {
            if ( this.zoom != zoom ) {
                this.zoom = zoom;
                this.rootLayer.scaling = [zoom, zoom];
                this.project.view.update();
                this._zoomChanged(zoom);
            }
        },

        setPos: function ( x, y ) {
            this.sceneLayer.position = [x, y];
        },

        setSmoothCanvas: function ( smoothCanvas ) {
            var canvasEL = this.$.canvas;
            canvasEL.getContext('2d').imageSmoothingEnabled = smoothCanvas;
            this.repaint();
        },

        resize: function ( width, height ) {
            var canvasEL = this.$.canvas;

            canvasEL.width = width;
            canvasEL.height = height;

            // resize
            this.project.view.viewSize = [width, height];
            this.rootLayer.position = [width * 0.5, height * 0.5];
            this.bgLayer.position = [width * 0.5, height * 0.5];

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

            var gridColor2 = new paper.Color(135/255, 135/255, 135/255, 1);
            var gridSize = 32;
            var posFilter = Math.round;
            var sizeFilter = Math.floor;
            var zoomedGridSize = sizeFilter(gridSize);
            var template = new paper.Shape.Rectangle(0, 0, zoomedGridSize, zoomedGridSize);
            template.remove();
            template.fillColor = gridColor2;
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
            this.atlasBGLayer = PaperUtils.createLayer();
            this.atlasBGLayer.position = [-this.atlas.width*0.5, -this.atlas.height*0.5];
            this.atlasLayer = PaperUtils.createLayer();
            this.atlasLayer.position = [-this.atlas.width*0.5, -this.atlas.height*0.5];
            this.atlasLayer.selectable = true;
            this.atlasHandlerLayer = PaperUtils.createLayer();
            this.atlasHandlerLayer.position = [-this.atlas.width*0.5, -this.atlas.height*0.5];

            this.sceneLayer.addChildren ([
                this.atlasBGLayer,
                this.atlasLayer,
                this.atlasHandlerLayer,
            ]);

            // init atlas-bg-layer
            this.atlasBGLayer.activate();

            // create border rect
            if ( this.border === undefined ) {
                var borderWidth = 2;
                var borderRect = new paper.Rectangle(0, 0, this.atlas.width, this.atlas.height);
                borderRect = borderRect.expand(borderWidth);
                this.border = new paper.Shape.Rectangle(borderRect);
                this.border.style = {
                    fillColor: new paper.Color(204/255, 204/255, 204/255, 1),
                    strokeWidth: borderWidth,
                    strokeColor: new paper.Color(0.08, 0.08, 0.08, 1),
                    shadowColor: [0, 0, 0, 0.5],
                    shadowBlur: 7,
                    shadowOffset: new paper.Point(2, 2),
                };
            }

            // create checkerboard
            if ( this.checkerboard === undefined ) {
                this.checkerboard = this._createCheckerboard( this.atlas.width, this.atlas.height );
                this.atlasBGLayer.addChild(this.checkerboard);
            }
            if ( this.background === undefined ) {
                this.background = new paper.Shape.Rectangle(0, 0, this.atlas.width, this.atlas.height);
                this.background.fillColor = new paper.Color( 0,0,0,0 );
                this.background.insertAbove(this.checkerboard);
            }
        }, 

        _paint: function () {
            // update background
            this.background.fillColor = PaperUtils.color( this.backgroundColor );

            var children = this.atlasLayer.children;
            for (var i = 0; i < children.length; ++i) {
                var child = children[i];
                var isRaster = child.data && child.data.texture;
                if (!isRaster) {
                    continue;
                }

                // update atlas
                var tex = child.data.texture;
                if (tex.rotated) {
                    child.pivot = [-tex.width * 0.5, tex.height * 0.5];
                    child.rotation = 90;
                }
                else {
                    child.pivot = [-tex.width * 0.5, -tex.height * 0.5];
                    child.rotation = 0;
                }
                child.position = [tex.x, tex.y];

                // update rectangle
                var left = tex.x;
                var top = tex.y;
                var w = tex.rotatedWidth;
                var h = tex.rotatedHeight;
                var bgItem = child.data.bgItem;
                bgItem.size = [w, h];
                bgItem.position = new paper.Rectangle(left, top, w, h).center;
                bgItem.fillColor = PaperUtils.color( this.elementBgColor );

                // update outline
                var outline = child.data.outline;
                if (outline.visible) {
                    var outlineBounds = bgItem.bounds;
                    var strokeWidth = 2;
                    outlineBounds = outlineBounds.expand(-strokeWidth/this.zoom);
                    outline.position = [
                        outlineBounds.center.x*this.zoom, 
                        outlineBounds.center.y*this.zoom
                    ];
                    outline.size = [
                        outlineBounds.width*this.zoom, 
                        outlineBounds.height*this.zoom
                    ];
                    outline.strokeColor = PaperUtils.color( this.elementSelectColor );
                    outline.dashArray = [5,3];
                }
            }
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
            this.fire('import', { files: event.dataTransfer.files } );

            event.preventDefault();
            event.stopPropagation();
        },

        _zoomChanged: function ( zoom ) {
            this.atlasHandlerLayer.scale( 1.0/this.atlasHandlerLayer.globalMatrix.scaling.x,
                                          1.0/this.atlasHandlerLayer.globalMatrix.scaling.y );
            this.repaint();
        },

        _select: function ( items ) {
            this.atlasHandlerLayer.activate();
            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                item.data.outline.visible = true;
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
                item.fm_selected = false;
            }
            this.repaint();
        },

        _moveSelected: function ( items, delta ) {
            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                var tex = item.data.texture;
                tex.x = tex.x + delta.x/this.zoom;
                tex.y = tex.y + delta.y/this.zoom;
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
            this.atlasHandlerLayer.position = [-this.atlas.width*0.5, -this.atlas.height*0.5];

            //
            if ( this.checkerboard !== undefined ) {
                this.checkerboard.remove();
            }
            this.checkerboard = this._createCheckerboard( this.atlas.width, this.atlas.height );
            this.atlasBGLayer.addChild(this.checkerboard);
            this.background.insertAbove(this.checkerboard);

            //
            var borderWidth = 2;
            var borderRect = new paper.Rectangle(0, 0, this.atlas.width, this.atlas.height);
            borderRect = borderRect.expand(borderWidth);
            this.border.size = borderRect.size;
            this.border.position = [(borderRect.size.width-borderWidth)*0.5,(borderRect.size.height-borderWidth)*0.5];

            this.setZoom(1.0);
            this.setPos(0,0);
            this.repaint();
        },

        rebuildAtlas: function (forExport) {
            if (!forExport) {
                this.atlasLayer.removeChildren();
                this.atlasLayer.activate();
            }

            var i = 0, j = 0, len = 0;
            for (i = 0; i < this.atlas.textures.length; ++i) {
                var tex = this.atlas.textures[i];
                var raster = PaperUtils.createSpriteRaster(tex);
                raster.selectable = true;
                raster.data.texture = tex;
                raster.position = [tex.x, tex.y];

                if ( !forExport ) {
                    raster.data.bgItem = new paper.Shape.Rectangle(paper.Item.NO_INSERT);
                    raster.data.bgItem.insertBelow(raster);

                    raster.data.outline = new paper.Shape.Rectangle(paper.Item.NO_INSERT);
                    raster.data.outline.style = {
                        strokeWidth: 2,
                    };
                    this.atlasHandlerLayer.addChild(raster.data.outline);
                    raster.data.outline.visible = false;
                }
            }

            if (!forExport) {
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
    });
})();
