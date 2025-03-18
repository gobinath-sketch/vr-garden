// Custom shaders for realistic plant rendering
const plantVertexShader = `
    uniform float time;
    uniform vec3 windDirection;
    uniform float windStrength;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying float vWindEffect;
    
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        // Enhanced wind animation with natural movement
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        float primaryWind = sin(time * 2.0 + worldPosition.x + worldPosition.z) * windStrength;
        float secondaryWind = cos(time * 3.0 + worldPosition.z) * windStrength * 0.5;
        float heightFactor = smoothstep(0.0, 1.0, position.y);
        
        vec3 windOffset = windDirection * (primaryWind + secondaryWind) * heightFactor;
        vWindEffect = length(windOffset) * heightFactor;
        
        vec3 transformed = position + windOffset;
        vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        vViewPosition = -mvPosition.xyz;
    }
`;

const plantFragmentShader = `
    uniform vec3 diffuse;
    uniform float opacity;
    uniform vec3 subsurfaceColor;
    uniform float subsurfaceIntensity;
    uniform float roughness;
    uniform sampler2D leafTexture;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying float vWindEffect;
    
    void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        
        // Enhanced lighting with fresnel effect
        float NdotV = max(dot(normal, viewDir), 0.0);
        float fresnel = pow(1.0 - NdotV, 5.0);
        
        // Advanced subsurface scattering
        float subsurface = pow(1.0 - NdotV, 3.0) * subsurfaceIntensity;
        vec3 subsurfaceLight = subsurfaceColor * subsurface;
        
        // Leaf vein texture and color variation
        vec2 windUV = vUv + vec2(vWindEffect * 0.1);
        vec3 leafPattern = mix(
            diffuse,
            diffuse * 0.8,
            smoothstep(0.4, 0.6, sin(windUV.x * 20.0) * sin(windUV.y * 20.0))
        );
        
        // Final color with enhanced realism
        vec3 outgoingLight = leafPattern + subsurfaceLight + vec3(0.2) * fresnel;
        
        gl_FragColor = vec4(outgoingLight, opacity);
    }
`;

export { plantVertexShader, plantFragmentShader };