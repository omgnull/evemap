uniform sampler2D map0;

varying vec2 vUv;

void main() {
    vUv = uv;

    //vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    vec3 coord = cross(normalize(cameraPosition - position), vec3(0.0, 1.0, 0.0))
    vec4 pos = projectionMatrix * modelViewMatrix * vec4(coord, 1.0);

    vec3 offset = pos.xyz / pos.w;
    vec3 vertex = vec3( position.xy * vec2(1.0, -1.0) / vec2(1500.0, 750.0) * 2.0, 0.0 );

    gl_Position = pos;
    //gl_Position = vec4( offset + vertex, 1.0 );

    //gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}