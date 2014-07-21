(function () {
    Polymer('loading-mask', {
        fading: false,

        attached: function () {
            this.$.loading.style.top = (this.parentNode.clientHeight - this.clientHeight)/2;

            window.addEventListener('resize', function() {
                this.$.loading.style.top = (this.parentNode.clientHeight - this.clientHeight)/2;
            }.bind(this), false);

            this.style.display = "none"; 
            this.$.mask.style.opacity = "none"; 
        },

        show: function () {
            console.log("yes");
            this.style.display = "inline"; 
            document.timeline.play(
                new AnimationGroup ([
                    new Animation(this, [
                                    {fading: true, display: "inline"}, 
                                    {fading: false}, 
                                  ], {
                                      duration: 500,
                                      fill: 'both'
                                  }),
                    new Animation(this.$.mask, [
                                    {opacity: "0.0"}, 
                                    {opacity: "1.0"}
                                  ], {
                                      duration: 500,
                                      fill: 'both'
                                  })
                ]) 
            );

            // DISABLE
            // var ratio = 0.0;
            // this.$.mask.style.opacity = 0.0;
            // var t = 0;
            // var id = window.setInterval ( function () {
            //     this.$.mask.style.opacity = t/1000;
            //     t += 10;
            //     if ( t === 1000 ) {
            //         this.$.mask.style.opacity = 1.0;
            //         window.clearInterval(id);
            //     }
            // }.bind(this),
            // 10 ); 
        },

        hide: function () {
            document.timeline.play(
                new AnimationGroup ([
                    new Animation(this.$.mask, [
                                    {opacity: "1.0"}, 
                                    {opacity: "0.0"}
                                  ], {
                                      duration: 500,
                                      fill: 'both'
                                  }),
                    new Animation(this, [
                                    {fading: true, display: "inline"}, 
                                    {fading: false, display: "none"}, 
                                  ], {
                                      duration: 500,
                                      fill: 'both'
                                  }),
                ]) 
            );
        },
    });
})();
