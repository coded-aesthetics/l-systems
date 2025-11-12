export const LEAF_VERTEX_SHADER = `
    precision mediump float;

    attribute vec3 a_position;
    attribute vec3 a_normal;
    attribute vec2 a_uv;
    attribute vec4 a_color;

    uniform mat4 u_modelViewMatrix;
    uniform mat4 u_projectionMatrix;
    uniform mat3 u_normalMatrix;
    uniform float u_time;

    varying vec3 v_normal;
    varying vec2 v_uv;
    varying vec3 v_position;
    varying vec4 v_color;

    void main() {
        // Synchronize leaf wind animation with branches
        vec3 pos = a_position;
        float windStrength = 0.02; // Proportional to branch wind
        float windSpeed = u_time * 2.0;

        // Use same height-based calculation as branches
        float heightFactor = pos.y * 0.5 + 0.8; // Leaves are more affected by wind

        // Match branch wind patterns exactly but with stronger effect
        float windX = sin(windSpeed + pos.y * 0.5) * windStrength * heightFactor;
        float windZ = cos(windSpeed * 0.8 + pos.y * 0.3) * windStrength * heightFactor * 0.5;

        // Add leaf-specific gentle swaying
        windX += sin(windSpeed * 1.2 + pos.x * 0.3) * windStrength * 0.4;
        windZ += cos(windSpeed * 1.1 + pos.z * 0.2) * windStrength * 0.3;

        // Subtle vertical motion for floating effect
        float windY = sin(windSpeed * 1.5 + pos.x * 0.2) * windStrength * 0.15;

        pos.x += windX;
        pos.y += windY;
        pos.z += windZ;

        gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(pos, 1.0);

        v_normal = u_normalMatrix * a_normal;
        v_uv = a_uv;
        v_position = pos;
        v_color = a_color;
    }
`;

export const LEAF_FRAGMENT_SHADER = `
    precision mediump float;

    uniform vec3 u_lightDirection;
    uniform vec3 u_leafColor;
    uniform bool u_useVertexColors;

    varying vec3 v_normal;
    varying vec2 v_uv;
    varying vec3 v_position;
    varying vec4 v_color;

    void main() {
        vec3 normal = normalize(v_normal);
        vec3 lightDir = normalize(-u_lightDirection);
        vec3 viewDir = normalize(-v_position);

        // Calculate advanced lighting for glass-like appearance
        float diff = max(dot(normal, lightDir), 0.0);
        float ambient = 0.2;

        // Add rim lighting for glass effect
        float rim = 1.0 - max(dot(viewDir, normal), 0.0);
        rim = pow(rim, 3.0);

        float lighting = ambient + diff * 0.5 + rim * 0.6;

        // Enhanced fresnel effect for glass-like translucency
        float fresnel = 1.0 - abs(dot(normal, viewDir));
        fresnel = pow(fresnel, 1.5);

        // Use vertex color if available, otherwise use uniform leaf color
        vec3 baseColorSource = u_useVertexColors && v_color.a > 0.0 ? v_color.rgb : u_leafColor;
        vec3 baseColor = baseColorSource * 0.6;
        vec3 glowColor = baseColorSource * 1.8;
        vec3 leafColor = mix(baseColor, glowColor, fresnel);

        leafColor *= lighting;

        // Enhanced translucency for glass-like spheres
        float centerDist = length(v_uv - 0.5);
        float alpha = 0.2 + fresnel * 0.45; // Translucent base with fresnel glow
        alpha *= (1.0 - centerDist * 0.2); // Subtle edge transparency
        alpha = clamp(alpha, 0.15, 0.7); // Highly translucent but visible

        // Use vertex alpha if available
        if (u_useVertexColors && v_color.a > 0.0) {
            alpha *= v_color.a;
        }

        gl_FragColor = vec4(leafColor, alpha);
    }
`;

export const LEAF_UNIFORMS = [
    'u_modelViewMatrix',
    'u_projectionMatrix',
    'u_normalMatrix',
    'u_time',
    'u_useVertexColors',
    'u_lightDirection',
    'u_leafColor'
];

export const LEAF_ATTRIBUTES = [
    'a_position',
    'a_normal',
    'a_uv',
    'a_color'
];
