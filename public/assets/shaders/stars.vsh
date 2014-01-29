uniform float scheme;
uniform float scale;

attribute vec3 actualColor;
attribute vec3 securityColor;
attribute vec3 regionColor;
attribute float radius;

varying vec3 vSecurityColor;
varying vec3 vActualColor;
varying vec3 vRegionColor;
varying float vRadius;
varying float vDistance;
varying float vPointSize;

void main() {
    vSecurityColor = securityColor;
    vActualColor = actualColor;
    vRegionColor = regionColor;
    vRadius = 10.0;
    float _modifier = 1.0;

	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	vDistance = length(mvPosition.xyz);

    if (scheme == 3.0) {
        _modifier = 8.0;
    }

    float _size = 1.0 * _modifier;
    float _maxSize = 12.0 * _modifier;

    gl_PointSize = 100.0 * scale * _modifier / vDistance;

    if (gl_PointSize > _maxSize) {
        gl_PointSize = _maxSize;
    }

	gl_Position = projectionMatrix * mvPosition;
	vPointSize = gl_PointSize;
}
