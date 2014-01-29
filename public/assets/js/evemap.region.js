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
        //evemap.gui.add(this.label);
        evemap.wgl.add(this.label);
    }
};

