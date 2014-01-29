var EveMap = function(settings)
{
    this.scheme         = 1.0;
    this.settings       = settings;
    this.camera         = undefined;
    this.controls       = undefined;
    this.loader         = undefined;
    this.raycaster      = undefined;
    this.colors         = undefined;
    this.log            = undefined;
    this.index          = {};
    this.raw            = {};
    this.regions        = [];
    this.regionalJumps  = {};

    this.wgl            = undefined;
    this.gui            = undefined;

    this.events         = [
        EveMap.EVENT_MAP_LOADING,
        EveMap.EVENT_MAP_DATA_LOADED,
        EveMap.EVENT_MAP_LOAD_COMPLETE,
        EveMap.EVENT_MAP_RENDERED
    ];
    this._heap          = {};
    this._state         = undefined;
};

EveMap.prototype = {
    constructor: EveMap,
    addEvent: function( num, callback ) {
        if ( -1 === this.events.indexOf( num ) ) {
            throw new Error('Event number "' + num + '" not defined.');
        }

        if ( ! this._heap[ num ] ) {
            this._heap[ num ] = [];
        }

        this._heap[ num ].push( callback );
    },
    dispatch: function( num ) {
        if ( -1 === this.events.indexOf( num ) ) {
            throw new Error('Event number "' + num + '" not defined.');
        }

        if ( this._state >= num && -1 !== num ) {
            throw new Error('Event "' + num + '" stage already complete.');
        }

        this.gui.progress( num );
        var callbacks = this._heap[ num ];

        if ( ! callbacks ) {
            return;
        }

        for ( var i = 0; i < callbacks.length; i++ ) {
            callbacks[ i ]();
        }
        this._state = num;
    },
    render: function() {
        try {
            this.loader = new EveMap.Loader( this );
            this.loader.init();

            // EVENT_MAP_LOADING
            this.addEvent( EveMap.EVENT_MAP_LOADING, function() {
                this.loader.delayed( function() {
                    if ( ! this.settings.materials.loaded ) {
                        return false;
                    }
                    for ( var i = 0; i < this.settings.sources.length; i++ ) {
                        if ( ! this.raw[ this.settings.sources[ i ] ] ) {
                            return false;
                        }
                    }
                    return true;
                }.bind( this ), function() {
                    this.colors.default = new THREE.Color( this.settings.colorSettings.default );
                    this.colors.unAccessible = new THREE.Color( this.settings.colorSettings.unAccessible );

                    var generate = this.settings.colorSettings.generate;
                    for (var i = 0; i < generate.length; i++) {
                        if ( this.raw[ generate[ i ] ] ) {
                            this.colors.generateColors(
                                generate[ i ],
                                this.raw[ generate[ i ] ].length,
                                this.colors.randomize );
                        }
                    }

                    // Trigger EVENT_MAP_DATA_LOADED
                    this.dispatch( EveMap.EVENT_MAP_DATA_LOADED );
                }.bind( this ), 1000);
            }.bind( this ) );

            // EVENT_MAP_DATA_LOADED
            this.addEvent( EveMap.EVENT_MAP_DATA_LOADED, function() {
                this.loader.delayed( function(){
                    return this.wgl.loaded;
                }.bind( this ), function() {

                    // Trigger EVENT_MAP_LOAD_COMPLETE
                    this.dispatch( EveMap.EVENT_MAP_LOAD_COMPLETE );
                }.bind( this ), 500 );
            }.bind( this ) );

            // EVENT_MAP_LOAD_COMPLETE
            this.addEvent( EveMap.EVENT_MAP_LOAD_COMPLETE, function() {
                this.loader.delayed( function(){
                    return this.gui.loaded;
                }.bind( this ), function() {

                    // Trigger EVENT_MAP_RENDERED
                    this.dispatch( EveMap.EVENT_MAP_RENDERED );
                }.bind( this ), 500 );
            }.bind( this ) );

            // Start with EVENT_MAP_LOADING
            this.dispatch( EveMap.EVENT_MAP_LOADING );
        } catch (e) {
            this.log(e);
        }
    },
    _highlightSystem: function( mouseX, mouseY ) {
        var vector, intersects;

        vector = new THREE.Vector3( mouseX * 2 - 1, -mouseY * 2 + 1, 0.5 );
        this.settings.projector.unprojectVector( vector, this.settings.camera );
        this.raycaster.set(this.settings.camera.position, vector.sub(this.settings.camera.position).normalize());
        intersects = this.raycaster.intersectSystems(this.regions);

        if (intersects.length > 0) {
            for ( var i = 0; i < intersects.length; i++ ) {
                console.log(intersects[ i ].object.region.name + ' ' +intersects[ i ].object.name);
            }
        } else {
            console.log( 'none' );
        }
    }
};

EveMap.SCALE                    = 1;
EveMap.RAY_THRESHOLD            = 0.1;

EveMap.EVENT_MAP_LOADING        = 5;
EveMap.EVENT_MAP_DATA_LOADED    = 45;
EveMap.EVENT_MAP_LOAD_COMPLETE  = 90;
EveMap.EVENT_MAP_RENDERED       = 100;