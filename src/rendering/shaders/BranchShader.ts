export const BRANCH_VERTEX_SHADER = `
    precision mediump float;

    attribute vec3 a_position;
    attribute vec3 a_normal;
    attribute vec2 a_uv;
    attribute float a_depth;
    attribute float a_height;
    attribute vec4 a_color;

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
    varying vec4 v_color;

    void main() {
        // Apply gentle wind animation
        vec3 position = a_position;
        float windStrength = 0.02;
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
        v_color = a_color;

        gl_Position = u_projectionMatrix * worldPosition;
    }
`;

export const BRANCH_FRAGMENT_SHADER = `
    precision mediump float;

    varying vec3 v_position;
    varying vec3 v_normal;
    varying vec2 v_uv;
    varying float v_depth;
    varying float v_height;
    varying vec3 v_worldPosition;
    varying vec4 v_color;

    uniform float u_time;
    uniform int u_colorMode;
    uniform bool u_useVertexColors;
    uniform vec3 u_lightDirection;

    // Color palettes for different modes
    vec3 getHeightGradientColor(float height) {
        // Brown to green gradient based on height
        vec3 brownColor = vec3(0.4, 0.2, 0.1);
        vec3 darkGreenColor = vec3(0.1, 0.3, 0.1);
        vec3 lightGreenColor = vec3(0.3, 0.7, 0.2);

        float normalizedHeight = (height + 1.0) * 0.5; // Convert from [-1,1] to [0,1]

        if (normalizedHeight < 0.3) {
            return mix(brownColor, darkGreenColor, normalizedHeight / 0.3);
        } else {
            return mix(darkGreenColor, lightGreenColor, (normalizedHeight - 0.3) / 0.7);
        }
    }

    vec3 getDepthColor(float depth) {
        // Color based on branch generation depth
        vec3 trunkColor = vec3(0.3, 0.15, 0.05);
        vec3 branchColor = vec3(0.2, 0.4, 0.1);
        vec3 leafColor = vec3(0.4, 0.8, 0.2);

        float normalizedDepth = clamp(depth / 8.0, 0.0, 1.0);

        if (normalizedDepth < 0.5) {
            return mix(trunkColor, branchColor, normalizedDepth * 2.0);
        } else {
            return mix(branchColor, leafColor, (normalizedDepth - 0.5) * 2.0);
        }
    }

    vec3 getUniformColor() {
        return vec3(0.2, 0.6, 0.15);
    }

    vec3 getAutumnColor(float height, float depth) {
        vec3 brownTrunk = vec3(0.4, 0.2, 0.1);
        vec3 orangeLeaf = vec3(0.8, 0.4, 0.1);
        vec3 redLeaf = vec3(0.7, 0.2, 0.1);
        vec3 yellowLeaf = vec3(0.9, 0.7, 0.2);

        float normalizedHeight = (height + 1.0) * 0.5;
        float normalizedDepth = clamp(depth / 8.0, 0.0, 1.0);

        if (normalizedDepth < 0.3) {
            return brownTrunk;
        } else {
            // Mix autumn colors based on position
            float colorMix = sin(v_position.x * 10.0 + v_position.z * 8.0 + u_time * 0.5) * 0.5 + 0.5;
            vec3 baseAutumn = mix(orangeLeaf, redLeaf, colorMix);
            return mix(baseAutumn, yellowLeaf, normalizedHeight * 0.3);
        }
    }

    void main() {
        vec3 baseColor;

        // Use vertex colors if available and enabled
        if (u_useVertexColors && v_color.a > 0.0) {
            baseColor = v_color.rgb;

            // Apply height gradient to parameterized colors
            // Blend with white based on height (higher = lighter)
            float normalizedHeight = (v_height + 1.0) * 0.5; // Convert from [-1,1] to [0,1]
            float whiteMixFactor = normalizedHeight * 0.1; // Adjust intensity (0.1 = 10% max white blend)
            baseColor = mix(baseColor, vec3(1.0, 1.0, 1.0), whiteMixFactor);
        } else {
            // Select color based on mode
            if (u_colorMode == 0) {
                baseColor = getHeightGradientColor(v_height);
            } else if (u_colorMode == 1) {
                baseColor = getDepthColor(v_depth);
            } else if (u_colorMode == 2) {
                baseColor = getUniformColor();
            } else {
                baseColor = getAutumnColor(v_height, v_depth);
            }
        }

        // Simple lighting calculation
        vec3 normal = normalize(v_normal);
        vec3 lightDir = normalize(u_lightDirection);
        float lightIntensity = max(dot(normal, lightDir), 0.2); // Ambient minimum

        // Add some rim lighting for depth
        vec3 viewDir = normalize(-v_worldPosition);
        float rimLight = 1.0 - max(dot(normal, viewDir), 0.0);
        rimLight = pow(rimLight, 3.0) * 0.3;

        // Combine lighting
        vec3 finalColor = baseColor * lightIntensity + baseColor * rimLight;

        // Add subtle color variation
        float noise = sin(v_position.x * 20.0 + v_position.y * 15.0 + v_position.z * 18.0) * 0.05 + 1.0;
        finalColor *= noise;

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

export const BRANCH_UNIFORMS = [
    'u_modelViewMatrix',
    'u_projectionMatrix',
    'u_normalMatrix',
    'u_time',
    'u_colorMode',
    'u_useVertexColors',
    'u_lightDirection'
];

export const BRANCH_ATTRIBUTES = [
    'a_position',
    'a_normal',
    'a_uv',
    'a_depth',
    'a_height',
    'a_color'
];
