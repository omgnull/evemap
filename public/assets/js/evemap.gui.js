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