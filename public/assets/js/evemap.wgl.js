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