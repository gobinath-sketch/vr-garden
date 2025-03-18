import * as THREE from 'three';

// Forest environment configuration
const FOREST_COLORS = {
    fogColor: 0x2a3d1d,
    groundColor: 0x2d5a1d,
    treeColor: 0x1f4011,
    treeDarkColor: 0x162c0b,
    skyTopColor: 0x4a85c9,
    skyBottomColor: 0x8ab4e0
};

// Create a gradient sky background
function createSkyBackground() {
    const vertexShader = `
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
            float h = normalize(vWorldPosition + offset).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
    `;

    const uniforms = {
        topColor: { value: new THREE.Color(FOREST_COLORS.skyTopColor) },
        bottomColor: { value: new THREE.Color(FOREST_COLORS.skyBottomColor) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
    };

    const skyGeo = new THREE.SphereGeometry(60, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.BackSide
    });

    return new THREE.Mesh(skyGeo, skyMat);
}

// Create distant forest silhouettes with enhanced realism
function createDistantTrees() {
    const group = new THREE.Group();
    const treeCount = 400; // Dense forest
    const radius = 15;
    const innerRadius = 5;

    for (let i = 0; i < treeCount; i++) {
        // Calculate position in a ring formation
        const angle = (i / treeCount) * Math.PI * 2;
        const distance = innerRadius + Math.random() * (radius - innerRadius);
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;

        // Create tree trunk
        const trunkHeight = 1.5 + Math.random() * 1.5;
        const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, trunkHeight, 5);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: FOREST_COLORS.treeDarkColor,
            roughness: 0.9,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = trunkHeight / 2;

        // Create tree top with multiple layers for fuller appearance
        const treeTopGroup = new THREE.Group();
        const layers = 3;
        
        for (let j = 0; j < layers; j++) {
            const layerHeight = trunkHeight * 0.6;
            const coneGeometry = new THREE.ConeGeometry(0.8 - j * 0.2, layerHeight, 6);
            const coneMaterial = new THREE.MeshStandardMaterial({
                color: FOREST_COLORS.treeColor,
                roughness: 0.8,
                metalness: 0.1
            });
            const cone = new THREE.Mesh(coneGeometry, coneMaterial);
            cone.position.y = trunkHeight + j * (layerHeight * 0.5);
            treeTopGroup.add(cone);
        }

        // Create tree group with natural variation
        const treeGroup = new THREE.Group();
        treeGroup.add(trunk);
        treeGroup.add(treeTopGroup);
        
        // Position and rotate with natural variation
        treeGroup.position.set(x, 0, z);
        treeGroup.rotation.y = Math.random() * Math.PI;
        treeGroup.rotation.x = (Math.random() - 0.5) * 0.1;
        treeGroup.rotation.z = (Math.random() - 0.5) * 0.1;
        
        // Random scale variation
        const scale = 0.8 + Math.random() * 0.6;
        const heightScale = scale + Math.random() * 0.3;
        treeGroup.scale.set(scale, heightScale, scale);
        
        group.add(treeGroup);
    }

    return group;
}

// Create volumetric fog
function createFog() {
    return new THREE.FogExp2(FOREST_COLORS.fogColor, 0.03);
}

// Enhanced ground material
function createGroundMaterial() {
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: FOREST_COLORS.groundColor,
        roughness: 0.8,
        metalness: 0.2,
        flatShading: true
    });

    return groundMaterial;
}

export { createSkyBackground, createDistantTrees, createFog, createGroundMaterial };