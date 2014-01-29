uniform vec3 color;
uniform float scheme;
uniform float alpha;

varying vec3 vSecurityColor;
varying vec3 vActualColor;
varying vec3 vRegionColor;

void main() {
    vec3 _color = color;

    if (1.0 == scheme) {
        _color = vSecurityColor;
    } else if (2.0 == scheme) {
        _color = vRegionColor;
    } else if (3.0 == scheme) {
        _color = vActualColor;
    } else {
        _color = vec3( 1.0, 1.0, 1.0 );
    }

    gl_FragColor = vec4(_color, alpha);
}