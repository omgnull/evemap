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
                        map0:           { type: "t", value: THREE.ImageUtils.loadTexture( 'img/disc.png' ) },
                        map1:           { type: "t", value: THREE.ImageUtils.loadTexture( 'img/flare.png' ) }
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
