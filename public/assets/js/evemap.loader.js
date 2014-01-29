EveMap.Loader = function( evemap ) {

    this.evemap        = evemap;
    this.errors        = 0;

    this.viewport      = document.getElementById( 'viewport' );
    this.minHeight     = this.evemap.settings.scene.minHeight;
    this.minWidth      = this.evemap.settings.scene.minWidth;
    this.toolbarHeight = this.evemap.settings.toolbarHeight;
};

EveMap.Loader.prototype = {
    constructor: EveMap.Loader,
    init: function() {
        window.onerror = function(msg, url, line) {
            this.evemap.log( new TypeError( "Error: " + msg + "\nurl: " + url + "\nline #: " + line ));
            return true;
        }.bind( this );

        this.evemap.camera         = this.evemap.settings.camera();
        this.evemap.raycaster      = this.evemap.settings.raycaster;
        this.evemap.colors         = this.evemap.settings.colors;
        this.evemap.log            = this.evemap.settings.logger.log

        this.evemap.settings.materials.compile( this.evemap );

        // Renderer init
        this.evemap.wgl = new EveMap.WGL( this.evemap, this.viewport );
        this.evemap.gui = new EveMap.GUI( this.evemap, this.viewport );

        this.evemap.controls = this.evemap.settings.controls(
            this.evemap.camera, this.evemap.gui.gui
        );

        this.evemap.addEvent( EveMap.EVENT_MAP_LOADING, this.loadMapData.bind( this ) );
        window.addEventListener( 'resize', this._resizeScene.bind( this ) );

        this._resizeScene();
        this._animate();
    },
    _animate: function() {
        this.evemap.controls.update();
        this.evemap.wgl.render();
        this.evemap.gui.render();

        requestAnimationFrame( this._animate.bind( this ) );
    },
    _resizeScene: function() {
        var width, height;

        width = this.viewport.clientWidth < this.minWidth ?
            this.minWidth : this.viewport.clientWidth;

        height = this.viewport.clientHeight < this.minHeight ?
            this.minHeight : this.viewport.clientHeight;

        height -= this.toolbarHeight;

        this.evemap.camera.aspect = width / height;
        this.evemap.camera.updateProjectionMatrix();

        this.evemap.wgl.resize( width, height );
        this.evemap.gui.resize( width, height );
    },
    delayed: function ( condition, callback, timeout ) {
        if ( ! condition() ) {
            if ( this.errors > 0 ) {
                throw new Error('Stop delayed execution, we got network errors.');
            }
            window.setTimeout( this.delayed.bind( this, condition, callback, timeout ), timeout );
            return;
        }
        callback();
    },
    loadData: function( uri, callback, settings ) {
        settings = settings || {};

        var scope = this;
        var properties = {
            async:      true,
            type:       settings.data ? 'POST' : 'GET',
            cache:      true,
            beforeSend: null,
            data:       null,
            dataType:   'json',
            context:    this.context
        };
        $.extend(properties, settings);
        $.ajax( uri, properties)
            .done( callback )
            .fail( function( jqXHR, status, error ) {
                scope.evemap.log( error );
                scope.errors++;
        });
    },
    loadMapData: function() {
        if ( this.evemap.settings.dump ) {
            // load static dump file
            this.loadData( this.evemap.settings.uri.dump, ( function( evemap ){
                return function( data ) {
                    evemap.raw = data;
                    for ( var source in evemap.raw ) {
                        if ( evemap.raw.hasOwnProperty( source ) ) {
                            evemap.index[ source ] = {};
                        }
                    }
                }
            } ) ( this.evemap ) );

            return;
        }

        // load dynamic map data from sources paths
        var i, source;
        for ( i = 0; i < this.evemap.settings.sources.length; i++ ) {
            source = this.evemap.settings.sources[ i ];
            this.loadData( this.evemap.settings.uri[ source ], ( function( evemap, source ){
                return function( data ) {
                    evemap.raw[ source ] = data;
                    evemap.index[ source ] = [];
                }
            } ) ( this.evemap, source ) );
        }
    }
};

if ( !window.requestAnimationFrame ) {
    window.requestAnimationFrame = ( function() {
        return window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function( callback, element ) {
                window.setTimeout( callback, 1000 / 60 );
            };
    } )();
}