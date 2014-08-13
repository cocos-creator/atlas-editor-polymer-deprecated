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
            this.$.focus.tabIndex = EditorUI.getParentTabIndex(this)+1;
        },

        rebuild: function () {
            this.clearSelect();

            var listRoot = this.$.list;
            while (listRoot.firstChild) {
                listRoot.removeChild(listRoot.firstChild);
            }

            // sort by name
            var sortedList = this.atlas.sprites.slice(0);
            sortedList.sort( function (a,b) {
                return a.name.localeCompare( b.name );
            } );

            var ondelete = function (event) {
                var itemEL = event.target;
                this.atlas.remove(itemEL.value);
                listRoot.removeChild(itemEL);

                event.stopPropagation();

                this.fire('delete');
            }.bind(this); 

            for ( var i = 0; i < sortedList.length; ++i ) {
                var sprite = sortedList[i];
                var el = new AtlasSpriteItem();
                el.addEventListener( "delete", ondelete );
                el.value = sprite;
                listRoot.appendChild(el);
            }
        },

        updateSelection: function () {
            if ( this.selecting ) {
                this.selecting = false;
                return;
            }

            // DEBUG:
            // console.log("updateSelection at list");

            var tmpList = this.selectedSprites.slice(0);
            var item = null;
            var i = -1;
            var selected = [];
            var listRoot = this.$.list;
            this.selection = [];

            for ( i = 0; i < listRoot.children.length; ++i ) {
                item = listRoot.children[i];

                if ( item instanceof AtlasSpriteItem ) {
                    var found = false;

                    for ( var j = 0; j < tmpList.length; ++j ) {
                        var sprite = tmpList[j];

                        if ( item.value == sprite ) {
                            selected.push(item);

                            tmpList.splice(j,1);
                            found = true;
                            break;
                        }
                    }

                    if ( found === false ) {
                        item.unselect();
                    }
                }
            }

            for ( i = 0; i < selected.length; ++i ) {
                item = selected[i];
                this.selection.push(item);
                item.select();
            }
        },

        focusinAction: function (event) {
            this.focused = true;
            this.classList.toggle('focused', this.focused);
        },

        focusoutAction: function (event) {
            if ( this.focused === false )
                return;

            if ( EditorUI.find( this.shadowRoot, event.relatedTarget ) )
                return;

            // this.clearSelect();
            this.focused = false;
            this.classList.toggle('focused', this.focused);
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
