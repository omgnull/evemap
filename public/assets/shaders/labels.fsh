uniform sampler2D map0;
uniform vec3 color;

varying vec2 vUv;

void main() {
    gl_FragColor = texture2D( map0, vUv);
    gl_FragColor = gl_FragColor * vec4( color, 1.0 );
}