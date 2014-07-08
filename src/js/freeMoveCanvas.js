var FreeMoveCanvas = (function () {
    function FreeMoveCanvas ( canvas ) {
        //
        this.elementBgColor = new FIRE.Color( 0, 0.28, 1, 0.5 );
        this.elementSelectColor = new FIRE.Color(1,1,0,1);
        this.backgroundColor = new FIRE.Color(0,0,0,0);
        this.showCheckerboard = true;
        this.smoothCanvas = true;

        //
        this.zoom = 1.0;

        // init canvas
        canvas.width = canvas.parentNode.clientWidth;
        canvas.height = canvas.parentNode.clientHeight;

        // canvas event
        canvas.oncontextmenu = function() { return false; };

        // zoom in / out
        // https://developer.mozilla.org/en-US/docs/Web/Reference/Events/wheel
        canvas.onwheel = function () {
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
        };
    }

    FreeMoveCanvas.prototype.setZoom = function ( zoom ) {
        if ( this.zoom != zoom ) {
            this.zoom = zoom;
            this.rootLayer.scaling = [zoom, zoom];
            this.project.view.update();
        }
    };

    return FreeMoveCanvas;
})();
