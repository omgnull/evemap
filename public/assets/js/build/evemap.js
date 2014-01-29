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
EveMap.Audio = function( settings ) {
    settings = settings || {};

    this.appId          = settings.appId;
    this.autoPlay       = settings.autoPlay !== undefined ? settings.autoPlay : true;
    this.sortOrder      = settings.sortOrder !== undefined ? settings.sortOrder : 'desc';
    this.sortProperty   = settings.sortProperty !== undefined ? settings.sortProperty : 'favoritings_count';
    this.volume         = settings.volume !== undefined ? settings.volume : 0.5;
    this.currentTime    = 0;

    this.domElement     = document.createElement( 'div' );
    this.domElement.id  = 'audio-player';

    this.player         = undefined;
    this.playerTitle    = undefined;

    this._tracks        = [];
    this._num           = 0;

    var domElement = settings.domElement ? settings.domElement : document;
    domElement.appendChild( this.domElement );

    this.error          = 0;

    this._init( settings.url );
};

EveMap.Audio.prototype = {
    constructor: EveMap.Audio,
    _init: function(  url ) {
        var script = document.createElement( 'script' );

        script.onload = function() {
            SC.initialize( { client_id: this.appId } );
            this._resolveUrl( url );
        }.bind( this );

        script.src = 'http://connect.soundcloud.com/sdk.js';
        document.getElementsByTagName( 'head' )[ 0 ].appendChild( script );
    },
    _play: function( play ) {
        this.player.src = this._uri( this._num );
        this.playerTitle.textContent = this._title( this._num );

        if ( play ) {
            this.player.play();
        }
    },
    _resolveUrl: function( url ) {
        SC.get( '/resolve', { "url": url }, function( result, error ){
            if ( error !== null ) {
                console.log( error );
                throw new TypeError(  );
            }
            this._loadTracks( result.uri );
        }.bind( this ) );
    },
    _loadTracks: function( uri ) {
        if (-1 === uri.indexOf( '/tracks' )) {
            uri += '/tracks';
        }

        SC.get( uri, { limit: 100 }, function( tracks, error ){
            if ( error !== null ) {
                console.log( error );
                throw new TypeError(  );
            }

            if ( tracks.length == 0 ) {
                throw new TypeError( 'No tracks loaded.' );
            }

            var property = this.sortProperty ;
            var order = this.sortOrder;
            if ( this.sortOrder && this.sortProperty ) {
                tracks.sort( function( a, b ) {
                    if (order === 'desc') {
                        if( a[ property ] > b[ property ] ) {
                            return -1;
                        }
                        return a[ property ] < b[ property ] ? 1 : 0;
                    }
                    if( a[ property ] < b[ property ] ) {
                        return -1;
                    }
                    return a[ property ] > b[ property ] ? 1 : 0;
                } );
            } else {
                tracks.sort( function() {
                    return Math.round( Math.random() );
                } );
            }

            this._tracks = tracks;
            this._render();
        }.bind( this ));
    },
    _changeTrack: function( num, fallbackNum ) {
        if ( ! this._tracks[ num ] ) {
            num = fallbackNum;
        }

        this._num = num;
        this.play();
    },
    _render: function() {
        this.playerTitle = document.createElement( 'div' );

        this.player = new Audio();
        this.player.setAttribute( 'controls', 'controls' );
        this.player.setAttribute( 'preload', 'auto' );
        this.player.volume = this.volume;
        this.player.autoplay = this.autoPlay;

        this.domElement.appendChild( this.playerTitle );
        this.domElement.appendChild( this.player );

        this.player.addEventListener( 'ended', function() {
            this.next();
        }.bind( this ) );
        this.player.addEventListener( 'timeupdate', function() {
            if ( this.error == 0 ) {
                this.currentTime = this.player.currentTime;
                this.error = 0;
            }
        }.bind( this ) );

        this._play( this.autoPlay );
    },
    _title: function( num ) {
        return this._tracks[ num ].title
    },
    _uri: function( num ) {
        return this._tracks[ num ]
            .stream_url + '?client_id=' + this.appId;
    },
    next: function() {
        this._changeTrack( this._num + 1, 0 );
    },
    prev: function() {
        this._changeTrack( this._num - 1, this._tracks.length - 1 );
    },
    play: function() {
        this._play( true );
    }
};
EveMap.Colors = function(){

    this._generic       = {};

    this.default        = undefined;
    this.randomize      = true;
    this.unAccessible   = undefined;
    
    this.system         = {
        security:   [], // Colors by sec status
        actual:     []  // Actual colors
    };
};

EveMap.Colors.prototype = {
    constructor: EveMap.Colors,
    getGenericColor: function( name, index ) {
        return this._generic[ name ][ index ] ?
            this._generic[ name ][ index ] : this.default;
    },
    getGenericColors: function( name, length ) {
        if ( ! this._generic[ name ] && length > 0 ) {
            this.generateColors( name, length, this.randomize );
        }
    
        return this._generic[ name ] ?
            this._generic[ name ] : [];
    },
    getSystemSecurityColor: function( security ) {
        if (0 > security) {
            return this.system.security[ 10 ];
        } else if ( 0.15 > security ) {
            return this.system.security[ 9 ];
        } else if ( 0.25 > security ) {
            return this.system.security[ 8 ];
        }else if ( 0.35 > security ) {
            return this.system.security[ 7 ];
        }else if ( 0.45 > security ) {
            return this.system.security[ 6 ];
        }else if ( 0.55 > security ) {
            return this.system.security[ 5 ];
        }else if ( 0.65 > security ) {
            return this.system.security[ 4 ];
        } else if ( 0.75 > security ) {
            return this.system.security[ 3 ];
        } else if ( 0.85 > security ) {
            return this.system.security[ 2 ];
        } else if ( 0.95 > security ) {
            return this.system.security[ 1 ];
        }
    
        return this.system.security[ 0 ];
    },
    getSystemActualColor: function( sunType ) {
        return this.system.actual[ sunType ] || this.default;
    },
    generateColors: function( name, length, randomize ) {
        var color, colors = [];
        for ( var i = 0; i < length; i++ ) {
            color = this.default.clone();
            color.setHSL( i / length, 0.8, 0.5 );
            colors.push( color );
        }

        if ( randomize ) {
            colors.sort( function() {
                return Math.round( Math.random() );
            } );
        }
    
        this._generic[ name ] =  colors;
    }
};

EveMap.GUI = function( evemap, viewport ) {

    this.evemap   = evemap;
    this.loaded   = false;
    this.scene    = new THREE.Scene();
    this.renderer = new THREE.CSS3DRenderer();
    this.renderer.domElement.id = 'gui-renderer';

    this.gui         = document.createElement( 'div' );
    this.gui.id      = 'gui';

    this.tools    = undefined;
    this.names    = [];

    this.progressBar = document.getElementById( 'progress-bar');

    viewport.appendChild( this.renderer.domElement );
    viewport.appendChild( this.gui );

    this.evemap.addEvent( EveMap.EVENT_MAP_LOADING, this.load.bind( this ) );
};

EveMap.GUI.prototype = {
    constructor: EveMap.GUI,
    add: function( object ) {
        this.scene.add( object );
    },
    addTool: function( parameters ) {
        var el = document.createElement( 'li' );
        el.id = parameters.name.replace('/\s/g', '-' );
        el.textContent = parameters.name;

        var label = document.createElement( 'span' );
        label.setAttribute( 'class', 'tool-label' );

        var elClass = 'tool';

        if ( parameters.position ) {
            elClass += ' ' + parameters.position;
        }

        el.setAttribute( 'class', elClass );

        if ( parameters.parent ) {
            var parent = this.tools.getElementById( parameters.parent.replace( ' ', '-' ) );
            if ( parent ) {
                var list = parent.childNodes[ 1 ];
                if ( ! list ) {
                    list = document.createElement( 'ul' );
                    list.setAttribute( 'class', 'tool-list' );
                    parent.appendChild( list );
                }

                var child = document.createElement( 'li' );

                child.appendChild( el );
                list.appendChild( child );
            }
        } else {
            this.tools.appendChild( el );
        }
    },
    load: function() {
        var viewport     = document.getElementById( 'viewport' );
        this.tools       = document.getElementById( 'tools' );
        this.gui.style.top      = this.evemap.settings.toolbarHeight;

        this.evemap.addEvent( EveMap.EVENT_MAP_LOAD_COMPLETE, function() {
            var bar = this.progressBar;
            var $barBg = jQuery( bar ).find('.progress-bar-content');

            $barBg.promise().done( function() {
                var loadingScreen = document.getElementById( 'loading-screen' );

                $barBg.text( 'start' );
                bar.setAttribute('class', 'complete');

                var listener = bar.addEventListener( 'click', function( event ) {
                    event.preventDefault();

                    bar.removeEventListener( 'click', listener );

                    jQuery( loadingScreen ).animate({
                        opacity: 0
                    }, function() {
                        var about = document.getElementById( 'about').innerHTML;
                        this.addTool( { name: 'about', position: 'right', content: about } );
                        loadingScreen.parentNode.removeChild( loadingScreen );
                        this.evemap.controls.enabled = true;
                        this.evemap.controls.autoRotate = true;
                    }.bind( this ) );


                }.bind( this ) );
            }.bind( this ) );

            var player = new EveMap.Audio( {
                url: 'http://soundcloud.com/ccpgames/sets/eve-online-in-game-tracks',
                appId: 'f1e92862a3ba94720b75c32749f505a5',
                domElement: this.gui,
                autoPlay: true
            } );


            $(this.gui).append('<div id="test-click">Click me</div>');
            document.getElementById('test-click').addEventListener('click', function() {
                //var scheme = scope.evemap.ps.material.uniforms.scheme.value;
//        var scheme = scope.evemap.settings.materials.stars.uniforms.scheme.value;
//        scheme++;
//
//        if (scheme > 3) {
//            scheme = 1.0;
//        }
//
//        scope.evemap.settings.materials.stars.uniforms.scheme.value = scheme;
//        scope.evemap.settings.materials.lines.uniforms.scheme.value = scheme;

                this.evemap.scheme++;

                if (this.evemap.scheme > 3) {
                    this.evemap.scheme = 1.0;
                }

                var i, region;
                for (i = 0; i < this.evemap.regions.length; i++) {
                    region = this.evemap.regions[i];
                    region.systems.material.uniforms.scheme.value = this.evemap.scheme;
                    region.jumps.material.uniforms.scheme.value = this.evemap.scheme;
                }

                this.evemap.regionalJumps.material.uniforms.scheme.value = this.evemap.scheme;

            }.bind( this ), false);

            // Stats module
            this.stats = new Stats();
            this.stats.domElement.style.position = 'absolute';
            this.stats.domElement.style.left = '0px';
            this.stats.domElement.style.top = '0px';

            this.loaded = true;

        }.bind( this ) );
    },
    progress: function( amount ) {
        var progress = jQuery(this.progressBar);
        var normalized = progress.width() / 100 * amount;

        jQuery( progress.children()[ 0 ] ).animate( { width: normalized + 'px' } );
    },
    render: function() {
        this.renderer.render( this.scene, this.evemap.camera );
    },
    resize: function( width, height ) {
        this.renderer.setSize( width, height );
        this.gui.style.height = height + 'px';
        this.gui.style.width = width + 'px';
    }
};
EveMap.GUI.Window = function( title, content, height, width, domElement ) {

    this.title              = title;
    this.content            = content;

    this.domElement         = undefined;
    this.headerDomElement   = undefined;
    this.contentDomElement  = undefined;

    this.domParent          = domElement;
    this.height             = height;
    this.width              = width;

    this.activated          = false;

    this._events = {
        _onMouseUp:   undefined,
        _onMouseMove: undefined
    };

    this._init();
};

EveMap.GUI.Window.prototype = {
    constructor: EveMap.GUI.Window,
    _init: function() {
        this.domElement = document.createElement( 'div' );
        this.domElement.setAttribute( 'class', 'gui-window' );
        this.domElement.style.display = 'none';
        this.domElement.style.height = this.height + 'px';
        this.domElement.style.width = this.width + 'px';

        this.domParent.appendChild( this.domElement );

        this.headerDomElement = document.createElement( 'div' );
        this.headerDomElement.setAttribute( 'class', 'gui-window-header' );
        this.headerDomElement.textContent = this.title;
        this.headerDomElement.addEventListener( 'mousedown', this._onMouseDown.bind( this ) );

        var btnClose = document.createElement( 'div' );
        btnClose.setAttribute( 'class', 'gui-window-close' );
        btnClose.textContent = 'x';
        btnClose.addEventListener( 'click', this.close.bind( this ) );

        this.contentDomElement = document.createElement( 'div' );
        this.contentDomElement.setAttribute( 'class', 'gui-window-content' );
    },
    _onMouseUp: function( event ) {
        this.domParent.removeEventListener( 'mousemove', this._events._onMouseMove );
        this.domParent.removeEventListener( 'mouseup', this._events._onMouseUp );
    },
    _onMouseDown: function( event ) {
        if ( event.target !== this.headerDomElement ) {
            return;
        }

        this._events._onMouseMove = this.domParent.addEventListener( 'mousemove', this._onMouseMove.bind( this ) );
        this._events._onMouseUp = this.domParent.addEventListener( 'mouseup', this._onMouseMove.bind( this ) );
    },
    _onMouseMove: function( event ) {

    },
    close: function() {
        this.domElement.style.display = 'none';
    },
    open: function() {
        if ( ! this.activated ) {
            if ( typeof this.content === 'function' ) {
                this.content( this );
            } else {
                this.contentDomElement.textContent = this.content;
            }

            this.activated = true;
        }

        this.domElement.style.display = 'block';
    },
    update: function( width, height ) {

    }
};
EveMap.Helper = function() {

};

EveMap.Helper.prototype = {
    constructor: EveMap.Helper
};

EveMap.Label = {
    _createTexture: function( text, parameters ) {
        var canvas, context, texture;

        canvas = document.createElement( 'canvas' );
        context = canvas.getContext( '2d' );
        context.font = parameters.font;
        context.textAlign = 'center'
        context.fillStyle = parameters.fillStyle;

        if ( parameters.uppercase ) {
            text = text.toUpperCase();
        }

        context.fillText( text, canvas.width / 2, canvas.height / 2 );
        texture = new THREE.Texture( canvas );
        texture.needsUpdate = true;
        texture.attr = {
            width:  canvas.width,
            height: canvas.height
        };

        return texture;
    },
    createSpriteLabel: function( object, parameters ) {
        var label, material;

        material = new THREE.SpriteMaterial( {
            map: this._createTexture( object.name, parameters ),
            blending: THREE.NormalBlending,
            alignment: new THREE.Vector2( 0, 0 ),
            transparent: true,
            useScreenCoordinates: true
        } );

        label = new THREE.Sprite( material );
        label.scale.set( parameters.scaleHeight * EveMap.SCALE, parameters.scaleWidth * EveMap.SCALE, 1.0 );

        return label;
    },
    createPlaneLabel: function( object, material, parameters ) {
        var label, texture;

        texture = this._createTexture( object.name, parameters );
        //texture.needsUpdate = true;
        material.uniforms.map0.value = texture;
        material.uniforms.map0.needsUpdate = true;

        label = new THREE.Mesh(
            new THREE.PlaneGeometry( 1, 1, 1, 1 ),
            material
            //new THREE.MeshBasicMaterial( { color: new THREE.Color( 0xFFFFFF ) ,map : texture } )
        );

//        label = new THREE.Mesh(
//            new THREE.PlaneGeometry(
//                2,
//                1,
//                1, 1 ),
//            new THREE.MeshLambertMaterial( { color: new THREE.Color( 0xFFFFFF ) ,map : texture } )
//        );
        //label.side = THREE.DoubleSide;
//        label = new THREE.Sprite( material );
//        material.uvScale = {
//            x: 1,
//            y: 1
//        };
//        material.uvOffset = {
//            x: 1,
//            y: 1
//        };
        label.position.copy( object.position ? object.position : object );
        label.scale.set( parameters.scaleHeight * EveMap.SCALE, parameters.scaleWidth * EveMap.SCALE, 1.0 );

        return label;
    },
    createCSS3DLabel: function( object, parameters ) {
        var label, name, labelElement;

        labelElement = document.createElement( 'div' );
        labelElement.className   = parameters.className ?
            'l ' + parameters.className : 'l';

        name = document.createElement( 'div' );
        name.className = 'name';
        name.textContent = object.name;
        labelElement.appendChild( name );

        label = new THREE.CSS3DObject( labelElement );
        label.position.copy( object.position ? object.position : object );

        return label;
    }
};
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
EveMap.Logger = function() {
    THREE.Object3D.call(this);

    this.GUI = null;
};

EveMap.Logger.prototype = {
    constructor: EveMap.Logger,
    log: function(message) {
        var msg;
        if ( console && console.log ) {
            for (var i = 0; i < arguments.length; i++) {
                msg = arguments[i];

                if (msg === undefined) {
                    var error = new Error('Log undefined variable.');
                    this.log(error);
                    continue;
                }

                if (msg.message) {
                    console.log(msg.message);
                    if (msg.stack) {
                        console.log(msg.stack);
                    }
                }

                console.log(msg);
            }
        }
    },
    GUILog: function(message) {
        this.GUI.log(message);
    }
};
EveMap.Materials = function() {
    this.loaded = false;
};

EveMap.Materials.prototype = {
    constructor: EveMap.Materials,
    _materials: {
        stars:  {
            main: function(scope) {
                return {
                    uniforms:       {
                        color:          { type: "c", value: new THREE.Color( 0xFFFFFF ) },
                        scheme:         { type: 'f', value: 1.0 },
                        scale:          { type: 'f', value: EveMap.SCALE },
                        map0:           { type: "t", value: THREE.ImageUtils.loadTexture( 'assets/img/disc.png' ) },
                        map1:           { type: "t", value: THREE.ImageUtils.loadTexture( 'assets/img/flare.png' ) }
                    },
                    vertexShader:   scope.shaders.loaded[ 'stars' ][ 'vertex' ],
                    fragmentShader: scope.shaders.loaded[ 'stars' ][ 'fragment' ],
                    depthTest: 		false,
                    depthWrite: 	false,
                    transparent:	true,
                    blending: 		THREE.AdditiveBlending,
                    blendSrc:       THREE.SrcAlphaFactor,
                    blendEquation:  THREE.AddEquation
                }
            },
            attributes: function() {
                return {
                    actualColor:    { type: 'c', value: [] },
                    regionColor:    { type: 'c', value: [] },
                    securityColor:  { type: 'c', value: [] },
                    radius:         { type: 'f', value: [] }
                }
            }
        },
        lines: {
            main: function(scope) {
                return {
                    uniforms:       {
                        color:          { type: "c", value: new THREE.Color( 0xD3D3D3 ) },
                        scheme:         { type: 'f', value: 1.0 },
                        alpha:          { type: 'f', value: 0.12 }
                    },
                    vertexShader:   scope.shaders.loaded['lines']['vertex'],
                    fragmentShader: scope.shaders.loaded['lines']['fragment'],
                    blending: 		THREE.SrcAlphaFactor,
                    depthTest: 		true,
                    depthWrite: 	false,
                    transparent:	true
                }
            },
            attributes: function () {
                return {
                    actualColor:    { type: 'c', value: [] },
                    regionColor:    { type: 'c', value: [] },
                    securityColor:  { type: 'c', value: [] }
                }
            }
        },
        labels:  {
            main: function(scope) {
                return {
                    vertexShader:   scope.shaders.loaded[ 'labels' ][ 'vertex' ],
                    fragmentShader: scope.shaders.loaded[ 'labels' ][ 'fragment' ],
                    depthTest: 		false,
                    depthWrite: 	false,
                    transparent:	true,
                    blending: 		THREE.AdditiveBlending,
                    blendSrc:       THREE.SrcAlphaFactor,
                    blendEquation:  THREE.AddEquation
                }
            },
            uniforms: function() {
                return {
                    color:          { type: "c", value: new THREE.Color( 0xFFFFFF ) },
                    map0:           { type: "t", value: '' }
                }
            }
        }
    },
    shaders: {},
    compile: function( evemap ) {
        var loader = evemap.loader;
        var uri = evemap.settings.uri.shaders;
        this.shaders = evemap.settings.shaders;

        var type, name,
            filesLoaded = 0,
            settings = {
                dataType: 'text',
                async:    true
            };

        for ( var i = 0; i < this.shaders.list.length; i++ ) {
            name = this.shaders.list[ i ];
            this.shaders.loaded[ name ] = { };

            for ( var it = 0; it < this.shaders.extensions.length; it++ ) {
                type = this.shaders.extensions[ it ].split( '|' );

                loader.loadData( uri + name + type[ 1 ], ( function( scope, name, type ) {
                    return function( data ) {
                        scope.shaders.loaded[ name ][ type ] = data;
                        filesLoaded++;
                    }
                })( this, name, type[ 0 ] ), settings )
            }
        }

        loader.delayed( function() {
            return this.shaders.list.length * 2 === filesLoaded;
        }.bind( this ), function() {
            var i, name;
            for ( i = 0; i < this.shaders.list.length; i++ ) {
                name = this.shaders.list[ i ];
                this._materials[ name ].main = new this._materials[ name ].main( this );
            }
            this.loaded = true;
        }.bind( this ), 1000 );
    },
    getMaterial: function( name ) {
        var i, material, type, attribute,
            attributes = [ 'uniforms', 'attributes' ];

        if ( ! ( this._materials[ name ] ) ) {
            throw new Error( 'Material "%s" not exists'.replace( '%s', name ) );
        }

        material = new THREE.ShaderMaterial( this._materials[ name ].main );

        for ( i = 0; i < attributes.length; i++ ) {
            type = attributes[ i ];
            attribute = this._materials[ name ][ type ];

            if ( typeof attribute === 'function' ) {
                material[ type ] = new this._materials[ name ][ type ]();
            }
        }

        return material;
    }
};

EveMap.Raycaster = function() {
    THREE.Raycaster.call( this );
    this.threshold = EveMap.RAY_THRESHOLD;

    //document.addEventListener('mouse')
};

EveMap.Raycaster.prototype = Object.create( THREE.Raycaster.prototype );
EveMap.Raycaster.prototype.constructor = EveMap.Raycaster;


EveMap.Raycaster.prototype.intersectRegions = function( regions ) {
    var i, region, distance, intersects = [];

    for ( i = 0; i < regions.length; i++ ) {
        region = regions[ i ];
        distance = this.ray.distanceToPoint( region.position );

        if ( distance > region.boundingSphere.radius ) {
            continue;
        }

        intersects.push( {
            distance: distance,
            object: region
        } );
    }

    if ( intersects.length > 0 ) {
        intersects.sort( this.descSort );
    }

    return intersects;
};

EveMap.Raycaster.prototype.intersectSystems = function(regions, threshold) {
    var intersectsRegions, intersects = [];

    intersectsRegions = this.intersectRegions(regions);

    if ( intersectsRegions.length == 0 ) {
        return intersects;
    }

    var i, it, region, systems, system, distance, ray,  matrix;
    threshold = threshold || this.threshold;

    for ( i = 0; i < intersectsRegions.length; i++ ) {
        region = intersectsRegions[i].object;
        systems = region.systems.geometry.vertices;

        matrix = new THREE.Matrix4();
        ray = this.ray.clone();

        matrix.getInverse(region.systems.matrixWorld);
        ray.origin.applyMatrix4(matrix);
        ray.direction.transformDirection(matrix);

        for (it = 0; it < systems.length; it ++ ) {
            system = systems[ it ];
            distance = ray.distanceToPoint( system );

            if ( distance > threshold ) {
                continue;
            }

            intersects.push( {
                distance: distance,
                object:   system
            } );
        }
    }

    if ( intersects.length > 0 ) {
        intersects.sort( this.descSort );
    }

    return intersects;
};
EveMap.Region = function( data, unAccessible ) {
    THREE.Object3D.call(this);

    this.uid        = data.uid;
    this.name       = data.name;
    this.label      = null;
    this.color      = null;
    this.accessable = -1 === unAccessible.indexOf( this.uid );

    this.systems    = null;
    this.jumps      = null;

    this.index      = {
        systems:        [],
        constellations: [],
        jumps:          []
    };

    data.radius *= 1.7;

    this.position.set( data.x, data.y, data.z );
    this.boundingSphere = new THREE.Sphere( new THREE.Vector3(), data.radius );

    this.test = false;
};

EveMap.Region.prototype = Object.create( THREE.Object3D.prototype );
EveMap.Region.prototype.constructor = EveMap.Region;

EveMap.Region.prototype.addSystem = function( system ) {
    system.sub( this.position );

    this.index.systems[ system.uid ] = system;
    this.systems.geometry.vertices.push( system );

    var attributes = this.systems.material.attributes;

    if ( this.accessable ) {
        attributes.securityColor.value.push( system.securityColor );
        attributes.actualColor.value.push( system.actualColor );
    } else {
        attributes.securityColor.value.push( this.color );
        attributes.actualColor.value.push( this.color );
    }

    attributes.regionColor.value.push( this.color );
    attributes.radius.value.push( system.radius );

//    if (system.label) {
//        this.add(system.label);
//    }
};

EveMap.Region.prototype.addJump = function( fromSystem, toSystem ) {
    var point, system, systems, attributes;

    systems    = [ fromSystem, toSystem ];
    attributes = this.jumps.material.attributes;

    for ( var i = 0; i < 2; i++ ) {
        system = systems[ i ];
        point  = system.clone();

        if ( this.accessable ) {
            attributes.actualColor.value.push( system.actualColor );
            attributes.securityColor.value.push( system.securityColor );
        } else {
            attributes.actualColor.value.push( this.color );
            attributes.securityColor.value.push( this.color );
        }

        attributes.regionColor.value.push( system.region.color );
        this.jumps.geometry.vertices.push( point );
    }
};

EveMap.Region.prototype.preRender = function( evemap ) {
    this.add( this.jumps );
    this.add( this.systems );

    if ( this.label ) {
        this.label.position = this.position;
        evemap.gui.add(this.label);
        //evemap.wgl.add(this.label);
    }
};


EveMap.Settings = function( adjust ) {
    this.scale          = 100;
    this.rayThreshold   = 0.1;
    this.toolbarHeight  = 0;
    this.projector      = new THREE.Projector();
    this.materials      = new EveMap.Materials();
    this.colors         = new EveMap.Colors();
    this.logger         = new EveMap.Logger();
    this.sources        = [ 'regions', 'systems', 'jumps' ];
    this.dump           = false;
    this.autoRotate     = true;

    this.unAccessibleRegions = [ 10000004, 10000017, 10000019 ];

    this.scene          = {
        minHeight: 600,
        minWidth:  1000
    };

    this.colorSettings = {
        generate: [ 'regions', 'factions' ],
        security: [
            0xF00000,   // 0.0
            0xD73000,   // 0.1
            0xF04800,   // 0.2
            0xF06000,   // 0.3
            0xD77700,   // 0.4
            0xEFEF00,   // 0.5
            0x8FEF2F,   // 0.6
            0x00F000,   // 0.7
            0x00EF47,   // 0.8
            0x48F0C0,   // 0.9
            0x2FEFEF    // 1.0
        ],
        actual: [
            0xF3EA55,   // Sun G5 (Yellow)
            0xFFBD44,   // Sun K7 (Orange)
            0xFF4500,   // Sun K5 (Red Giant)
            0x87CEEB,   // Sun B0 (Blue)
            0xFFFFFF,   // Sun F0 (White)
            0x87CEFA,   // Sun O1 (Blue Bright)
            0xFFB6C1,   // Sun G5 (Pink)
            0xFFA500,   // Sun K5 (Orange Bright)
            0xFFC0CB,   // Sun G3 (Pink Small)
            0xFF8A44,   // Sun M0 (Orange radiant)
            0xADD8E6,   // Sun A0 (Blue Small)
            0xFFFF00,   // Sun K3 (Yellow Small)
            0xF8F8FF    // Sun B5 (White Dwarf)
        ],
        unAccessible: 0xC0C0C0,
        default: 0xFFFFFF,
        actualIndices: [ 6, 7, 8, 9, 10, 3796, 3797, 3798, 3799, 3800, 3801, 3802, 3803 ]
    };

    this.labels         = {
        region: {
            font:           '20px Arial',
            fillStyle:      'rgba(255, 255, 255, 0.95)',
            uppercase:      true,
            scaleHeight:    20,
            scaleWidth:     10
        },
        system:           {
            font:           '10px Arial',
            fillStyle:      'rgba(255, 255, 255, 0.95)',
            uppercase:      false,
            scaleHeight:    2,
            scaleWidth:     1
        }
    };

    this.shaders        = {
        list:               [ 'stars', 'lines' ,'labels' ],
        extensions:         [ 'vertex|.vsh', 'fragment|.fsh' ],
        loaded:             { }
    };
    this.uri            = {
        regions:            '/api/regions',
        systems:            '/api/systems',
        jumps:              '/api/jumps',
        constellations:     '/api/constellations',
        factions:           '/api/factions',
        system:             '/api/system/',
        shaders:            '/assets/shaders/',
        dump:               '/js/dump.json'
    };

    this.camera = function(){
        var camera = new THREE.PerspectiveCamera(
            30,
            window.innerWidth / ( window.innerHeight - this.toolbarHeight ),
            1,
            500  * EveMap.SCALE
        );
        camera.position.set( 0, 200 * this.scale, 0 );

        return camera;
    };

    this.controls = function( camera, domElement ) {
        var controls = new THREE.OrbitControls( camera, domElement );

        controls.minPolarAngle  = 0; // radians
        controls.maxPolarAngle  = Math.PI; // radians
        controls.maxDistance    = 200 * EveMap.SCALE; // radians
        controls.zoomSpeed      = 0.8;
        controls.rotateSpeed    = 0.8;
        controls.enabled        = false;

        return controls;
    };

    this._init( adjust );
};
EveMap.Settings.prototype = {
    constructor: EveMap.Settings,
    _init: function( adjust ) {
        var i, systemColor = this.colors.system;
        this.toolbarHeight = parseInt(
            window.getComputedStyle(
                document.getElementById( 'toolbar'),
                null
            ).getPropertyValue( 'height' ));

        for (i = 0; i < this.colorSettings.security.length; i++) {
            systemColor.security.unshift(new THREE.Color(this.colorSettings.security[i]));
        }

        for (i = 0; i < this.colorSettings.actualIndices.length; i++) {
            systemColor.actual[this.colorSettings.actualIndices[i]] = new THREE.Color(this.colorSettings.actual[i]);
        }

        if ( typeof adjust == 'function' ) {
            adjust( this );
        }

        EveMap.SCALE = this.scale;
        EveMap.RAY_THRESHOLD = this.rayThreshold * EveMap.SCALE;
    },
    clear: function() {
        delete this.colorSettings;
    }
};
EveMap.SystemInterior = function() {
    THREE.Object3D.call(this);
};

EveMap.SystemInterior.prototype = Object.create(THREE.Object3D.prototype);
EveMap.SystemInterior.prototype.constructor = EveMap.SystemInterior;
EveMap.System = function(region, data, colors) {
    THREE.Vector3.call(this, data.x, data.y, data.z);

    this.label              = null;
    this.uid                = data.uid;
    this.name               = data.name;
    this.region             = region;
    this.constellationID    = data.constellationID;
    this.security           = data.security;
    this.radius             = data.radius;
    this.luminosity         = data.luminosity;
    this.sunTypeID          = data.sunTypeID;
    this.active             = false;

    this.actualColor        = colors.getSystemActualColor(this.sunTypeID);
    this.securityColor      = colors.getSystemSecurityColor(this.security);
};

EveMap.System.prototype = Object.create(THREE.Vector3.prototype);
EveMap.System.prototype.constructor = EveMap.System;
EveMap.WGL = function( evemap, viewport ) {
    this.evemap   = evemap;
    this.scene    = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: false } );
    this.renderer.domElement.id = 'wgl-renderer';
    this.loaded   = false;

    viewport.appendChild( this.renderer.domElement );
    this.evemap.addEvent( EveMap.EVENT_MAP_DATA_LOADED, this._dataLoaded.bind( this ) );
};

EveMap.WGL.prototype = {
    constructor: EveMap.WGL,
    _dataLoaded: function() {
        this.loadRegions();
        this.loadSystems();
        this.loadJumps();
    },
    add: function( object ) {
        this.scene.add( object );
    },
    resize: function( width, height ) {
        this.renderer.setSize( width, height );
    },
    render: function() {
        this.renderer.render( this.scene, this.evemap.camera );
    },
    loadRegions: function() {
        var i, region, regions, unAccessible;
        regions = this.evemap.raw.regions;
        unAccessible = this.evemap.settings.unAccessibleRegions;

        for ( i = 0; i < regions.length; i++ ) {
            region = new EveMap.Region( regions[ i ], unAccessible );
            region.color = region.accessable ?
                this.evemap.colors.getGenericColor( 'regions', i ) : this.evemap.colors.unAccessible;

            region.label = EveMap.Label.createCSS3DLabel(
                region, { className: 'rl' }
            );

//            region.label = EveMap.Label.createPlaneLabel(
//                region,
//                this.evemap.settings.materials.getMaterial( 'labels' ),
//                this.evemap.settings.labels.region
//            );

//            region.label = EveMap.Label.createSpriteLabel(
//                region,
//                this.evemap.settings.labels.region
//            );

            region.systems = new THREE.ParticleSystem(
                new THREE.Geometry(),
                this.evemap.settings.materials.getMaterial( 'stars' )
            );

            region.jumps = new THREE.Line(
                new THREE.Geometry(),
                this.evemap.settings.materials.getMaterial( 'lines' ),
                THREE.LinePieces
            );

            this.evemap.index.regions[ region.uid ] = region;
            this.evemap.regions.push( region );
        }
    },
    loadConstellations: function() {
        // TODO: load?
    },
    loadSystems: function() {
        var i, region, system, raw;
        for ( i = 0; i < this.evemap.raw.systems.length; i++ ) {
            raw = this.evemap.raw.systems[ i ];
            region = this.evemap.index.regions[ raw.regionID ];
            system = new EveMap.System( region, raw, this.evemap.settings.colors );

            this.evemap.index.systems[ system.uid ] = system;
            region.addSystem( system );
        }
    },
    loadJumps: function() {
        var i, it,  jump, fromSystem, toSystem, fromRegion, toRegion,
            systems, attributes, system, point, vertices;

        this.evemap.regionalJumps = new THREE.Line(
            new THREE.Geometry(),
            this.evemap.settings.materials.getMaterial( 'lines' ),
            THREE.LinePieces
        );
        attributes = this.evemap.regionalJumps.material.attributes;
        vertices = this.evemap.regionalJumps.geometry.vertices;

        for ( i = 0; i < this.evemap.raw.jumps.length; i++ ) {
            jump = this.evemap.raw.jumps[i];

            fromRegion = this.evemap.index.regions[ jump.fromRegionID ];
            toRegion   = this.evemap.index.regions[ jump.toRegionID ];
            fromSystem = this.evemap.index.systems[ jump.fromSolarSystemID ];
            toSystem   = this.evemap.index.systems[ jump.toSolarSystemID ];

            // TODO: think
            if ( fromSystem && toSystem ) {
                if ( fromRegion.uid === toRegion.uid ) {
                    fromRegion.addJump( fromSystem, toSystem );
                } else {
                    systems = [ fromSystem, toSystem ];

                    for ( it = 0; it < 2; it++ ) {
                        system = systems[ it ];
                        point  = system.clone();

                        if ( system.region.accessable ) {
                            attributes.actualColor.value.push( system.actualColor );
                            attributes.securityColor.value.push( system.securityColor );
                        } else {
                            attributes.actualColor.value.push( system.region.color  );
                            attributes.securityColor.value.push( system.region.color  );
                        }

                        attributes.regionColor.value.push( system.region.color );
                        vertices.push( point.add( system.region.position ) );
                    }
                }
                continue;
            }

            throw new Error('Could not process jumps.');
        }

        this.add(this.evemap.regionalJumps);

        var region;
        for ( i =0; i < this.evemap.raw.regions.length; i++ ) {
            region = this.evemap.index.regions[ this.evemap.raw.regions[ i ].uid ];
            region.preRender( this.evemap );

            this.add( region );
        }

        this.loaded = true;
    }
};