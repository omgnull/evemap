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