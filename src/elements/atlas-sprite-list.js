(function () {
    Polymer('atlas-sprite-list', {
        publish: {
            atlas: new FIRE.Atlas(), 
            selectedSprites: [],
        },

        observe: {
            'atlas.sprites': 'rebuild',
            'selectedSprites': 'updateSelection',
        },

        created: function () {
            this.focused = false;
            this.selection = [];
            this.selecting = false;
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

        updateSelection: function () {
            if ( this.selecting ) {
                this.selecting = false;
                return;
            }

            console.log("updateSelection at list");
            // TODO:
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
            if ( items.length === 0 )
                return;

            this.selecting = true;

            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                if ( item.selected === false ) {
                    item.select();
                    this.selection.push(item);
                    this.selectedSprites.push(item.value);
                }
                else {
                    item.unselect();

                    var idx = this.selection.indexOf(item); 
                    this.selection.splice(idx,1);

                    idx = this.selectedSprites.indexOf(item.value);
                    this.selectedSprites.splice(idx,1);
                }
            }
        },

        select: function ( items ) {
            if ( items.length === 0 )
                return;

            this.selecting = true;

            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                if ( item.selected === false ) {
                    item.select();
                    this.selection.push(item);
                    this.selectedSprites.push(item.value);
                }
            }
        },

        unselect: function ( items ) {
            if ( items.length === 0 )
                return;

            this.selecting = true;

            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                if ( item.selected ) {
                    item.unselect();

                    var idx = this.selection.indexOf(item); 
                    this.selection.splice(idx,1);

                    idx = this.selectedSprites.indexOf(item.value);
                    this.selectedSprites.splice(idx,1);
                }
            }
        },

        clearSelect: function () {
            if ( this.selection.length === 0 )
                return;

            this.selecting = true;

            for ( var i = 0; i < this.selection.length; ++i ) {
                this.selection[i].unselect();
            }
            this.selection = [];
            this.selectedSprites = [];
        },
    });
})();
