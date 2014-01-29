uniform vec3 color;
uniform float scheme;
uniform sampler2D map0;
uniform sampler2D map1;

varying vec3 vSecurityColor;
varying vec3 vActualColor;
varying vec3 vRegionColor;
varying float vRadius;
varying float vDistance;
varying float vPointSize;
varying float vIntensity;

void main() {
    vec4 _map = texture2D( map0, vec2( gl_PointCoord.x, gl_PointCoord.y ));
    vec3 _color = vec3( 0.5, 0.0, 0.0);

    if (1.0 == scheme) {
        _color = vSecurityColor;
    } else if (2.0 == scheme) {
        _color = vRegionColor;
    } else if (3.0 == scheme) {
        _map = texture2D( map1, vec2( gl_PointCoord.x, gl_PointCoord.y ));
        _map.a *= .5;
        _color = vActualColor;
    }

    gl_FragColor = _map;

    if (gl_FragColor.a < 0.5) {
        //discard;
    }

    gl_FragColor = vec4( gl_FragColor.rgb * _color, gl_FragColor.a );
}