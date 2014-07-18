(function () {
    Polymer('loading-mask', {
        attached: function () {
            this.$.loading.style.top = (this.parentNode.clientHeight - this.clientHeight)/2;

            window.addEventListener('resize', function() {
                this.$.loading.style.top = (this.parentNode.clientHeight - this.clientHeight)/2;
            }.bind(this), false);

            this.style.display = "none"; 
        },

        show: function () {
            this.style.display = "inline"; 
            var player = document.timeline.play(
                new Animation(this, [
                                {opacity: "0.0"}, 
                                {opacity: "1.0"}
                              ], 1000 )
            );
        },

        hide: function () {
            var player = document.timeline.play(
                new Animation(this, [
                                {opacity: "1.0"}, 
                                {opacity: "0.0"}
                              ], 1000 )
            );
        },
    });
})();
