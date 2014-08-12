(function () {
    Polymer('atlas-sprite-item', {
        publish: {
            value: null,
            selected: {
                value: false,
                reflect: true,
            },
        },

        created: function () {
            this.selected = false;
        },

        domReady: function () {
            var img = new Image();
            img.src = this.value.rawTexture.image.src;
            this.$.image.appendChild(img);
            this.$.content.innerHTML = this.value.name;
        },

        delClickAction: function ( event ) {
            this.fire("delete");
            event.stopPropagation();
        },

        toggle: function () {
            if ( this.selected ) {
                this.unselect();
            }
            else {
                this.select();
            }
        },

        select: function () {
            if ( this.selected )
                return;

            this.selected = true;
        },

        unselect: function () {
            if ( this.selected === false )
                return;

            this.selected = false;
        },
    });
})();
