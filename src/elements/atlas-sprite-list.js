(function () {
    Polymer('atlas-sprite-list', {
        publish: {
            atlas: new FIRE.Atlas(), 
        },

        observe: {
            'atlas.sprites': 'rebuild',
        },

        created: function () {
            this.focused = false;
            this.selection = [];
            this.editing = false;
        },

        ready: function () {
            this.$.focus.tabIndex = FIRE.getParentTabIndex(this)+1;
        },

        rebuild: function () {
            var listRoot = this.$.list;
            while (listRoot.firstChild) {
                listRoot.removeChild(listRoot.firstChild);
            }

            // sort by name
            var sortedList = this.atlas.sprites.slice(0);
            sortedList.sort( function (a,b) {
                return a.name.localeCompare( b.name );
            } );

            for ( var i = 0; i < sortedList.length; ++i ) {
                var item = sortedList[i];
                var el = new AtlasSpriteItem();
                el.value = item;
                listRoot.appendChild(el);
            }
        },

        focusinAction: function (event) {
            this.focused = true;
            this.classList.toggle('focused', this.focused);
        },

        focusoutAction: function (event) {
            if ( this.focused === false )
                return;

            if ( FIRE.find( this.shadowRoot, event.relatedTarget ) )
                return;

            this.clearSelect();
            this.focused = false;
            this.classList.toggle('focused', this.focused);
        },

        deleteAction: function (event, detail, sender) {
            console.log("deleteAction");
            event.stopPropagation();
        },

        clickAction: function (event) {
            if ( event.target instanceof AtlasSpriteItem ) {
                if ( event.metaKey || event.ctrlKey ) {
                    this.toggle( [event.target] );
                }
                else {
                    this.clearSelect();
                    this.select( [event.target] );
                } 
            }
            event.stopPropagation();
        },

        toggle: function ( items ) {
            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                if ( item.selected === false ) {
                    item.select();
                    this.selection.push(item);
                }
                else {
                    item.unselect();

                    var idx = this.selection.indexOf(item); 
                    this.selection.splice(idx,1);
                }
            }
        },

        select: function ( items ) {
            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                if ( item.selected === false ) {
                    item.select();
                    this.selection.push(item);
                }
            }
        },

        unselect: function ( items ) {
            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                if ( item.selected ) {
                    item.unselect();

                    var idx = this.selection.indexOf(item); 
                    this.selection.splice(idx,1);
                }
            }
        },

        clearSelect: function () {
            for ( var i = 0; i < this.selection.length; ++i ) {
                this.selection[i].unselect();
            }
            this.selection = [];
        },
    });
})();
