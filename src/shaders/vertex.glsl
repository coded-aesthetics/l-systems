attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;
attribute float a_depth;
attribute float a_height;

uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat3 u_normalMatrix;
uniform float u_time;

varying vec3 v_position;
varying vec3 v_normal;
varying vec2 v_uv;
varying float v_depth;
varying float v_height;
varying vec3 v_worldPosition;

void main() {
    // Apply gentle wind animation
    vec3 position = a_position;
    float windStrength = 0.1;
    float windSpeed = u_time * 2.0;

    // Wind affects higher parts more
    float heightFactor = a_height * 0.5 + 0.5;
    position.x += sin(windSpeed + a_position.y * 0.5) * windStrength * heightFactor;
    position.z += cos(windSpeed * 0.8 + a_position.y * 0.3) * windStrength * heightFactor * 0.5;

    vec4 worldPosition = u_modelViewMatrix * vec4(position, 1.0);
    v_worldPosition = worldPosition.xyz;
    v_position = position;
    v_normal = normalize(u_normalMatrix * a_normal);
    v_uv = a_uv;
    v_depth = a_depth;
    v_height = a_height;

    gl_Position = u_projectionMatrix * worldPosition;
}
