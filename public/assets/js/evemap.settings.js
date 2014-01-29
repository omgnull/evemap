EveMap.Settings = function( adjust ) {
    this.scale          = 100000;
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
        shaders:            '/shaders/',
        dump:               '/js/dump.json'
    };

    this.camera = function(){
        var camera = new THREE.PerspectiveCamera(
            30,
            window.innerWidth / ( window.innerHeight - this.toolbarHeight ),
            EveMap.SCALE,
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