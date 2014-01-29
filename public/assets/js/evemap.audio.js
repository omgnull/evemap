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