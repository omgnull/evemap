uniform float scheme;

attribute vec3 actualColor;
attribute vec3 securityColor;
attribute vec3 regionColor;

varying vec3 vSecurityColor;
varying vec3 vActualColor;
varying vec3 vRegionColor;


void main() {
    vSecurityColor = securityColor;
    vActualColor = actualColor;
    vRegionColor = regionColor;

    gl_PointSize = 1.0;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}