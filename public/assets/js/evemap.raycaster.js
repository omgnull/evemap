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