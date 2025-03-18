import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { plantVertexShader, plantFragmentShader } from './shaders.js';
import { createSkyBackground, createDistantTrees, createFog, createGroundMaterial } from './environment.js';

let camera, scene, renderer;
let controls;
let controller1, controller2;
let controllerGrip1, controllerGrip2;

const plants = [];
const tempMatrix = new THREE.Matrix4();
const raycaster = new THREE.Raycaster();

// Wind animation parameters
const windDirection = new THREE.Vector3(1, 0, 0.5).normalize();
const windStrength = 0.1;
const clock = new THREE.Clock();

init();
animate();

// Import auth initialization
import { initializeAuth } from './auth.js';

function init() {
    // Initialize auth first
    initializeAuth();
    
    scene = new THREE.Scene();
    
    // Add sky background
    const sky = createSkyBackground();
    scene.add(sky);
    
    // Add volumetric fog
    scene.fog = createFog();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(3, 2, 5); // Better overview of the garden

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(2, 4, 2);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.1;
    mainLight.shadow.camera.far = 30;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    mainLight.shadow.bias = -0.001;
    scene.add(mainLight);

    // Add fill light for better depth
    const fillLight = new THREE.DirectionalLight(0x8088ff, 0.4);
    fillLight.position.set(-2, 3, -2);
    scene.add(fillLight);

    // Initialize renderer first
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Enable shadow mapping
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Enhanced ground with forest material
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = createGroundMaterial();
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add distant trees
    const distantTrees = createDistantTrees();
    scene.add(distantTrees);

    // Create some sample plants
    createPlants();

    // Set up animation loop
    function animate() {
        renderer.setAnimationLoop(render);
    }

    function render() {
        const time = clock.getElapsedTime();
        
        // Update plant shaders
        plants.forEach(plant => {
            const stem = plant.children[0];
            if (stem.material.uniforms) {
                stem.material.uniforms.time.value = time;
            }
        });

        controls.update();
        renderer.render(scene, camera);
    }

    // VR Button with support detection
    if (navigator.xr) {
        navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
            if (supported) {
                const button = VRButton.createButton(renderer);
                button.textContent = "Start Virtual Garden Tour";
                button.classList.add('webxr-button');
                document.body.appendChild(button);
                
                // Add smooth transition when entering VR
                button.addEventListener('click', () => {
                    // Animate camera to initial position
                    const startPos = camera.position.clone();
                    const targetPos = new THREE.Vector3(0, 1.6, 3);
                    const duration = 2000; // 2 seconds
                    const startTime = Date.now();
                    
                    function animateCamera() {
                        const elapsed = Date.now() - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        
                        // Smooth easing
                        const easeProgress = 1 - Math.pow(1 - progress, 3);
                        
                        camera.position.lerpVectors(startPos, targetPos, easeProgress);
                        
                        if (progress < 1) {
                            requestAnimationFrame(animateCamera);
                        }
                    }
                    
                    // Start animation
                    animateCamera();
                    
                    // Add fade out effect
                    button.classList.add('fade-out');
                });
                
                // Initialize camera controls for non-VR exploration
                controls.enableDamping = true;
                controls.dampingFactor = 0.05;
                controls.maxPolarAngle = Math.PI / 2;
                controls.minDistance = 2;
                controls.maxDistance = 10;
            } else {
                const message = document.createElement('div');
                message.style.position = 'absolute';
                message.style.bottom = '20px';
                message.style.right = '20px';
                message.style.padding = '12px 24px';
                message.style.background = '#ff4444';
                message.style.color = 'white';
                message.style.borderRadius = '4px';
                message.style.fontFamily = 'Arial, sans-serif';
                message.textContent = 'VR not supported on this device';
                document.body.appendChild(message);
            }
        });
    } else {
        const message = document.createElement('div');
        message.style.position = 'absolute';
        message.style.bottom = '20px';
        message.style.right = '20px';
        message.style.padding = '12px 24px';
        message.style.background = '#ff4444';
        message.style.color = 'white';
        message.style.borderRadius = '4px';
        message.style.fontFamily = 'Arial, sans-serif';
        message.textContent = 'WebXR not available on this browser';
        document.body.appendChild(message);
    }

    // Controllers
    controller1 = renderer.xr.getController(0);
    controller1.addEventListener('selectstart', onSelectStart);
    controller1.addEventListener('selectend', onSelectEnd);
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);
    scene.add(controller2);

    const controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    // Add non-VR controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.6, 0);
    controls.update();

    window.addEventListener('resize', onWindowResize);
}

function createPlants() {
    const plantTypes = [
        { name: 'Lavender', color: 0x9c27b0, height: 0.5, leafSize: 0.12, leafCount: 12 },
        { name: 'Mint', color: 0x4caf50, height: 0.3, leafSize: 0.15, leafCount: 8 },
        { name: 'Rosemary', color: 0x2e7d32, height: 0.6, leafSize: 0.08, leafCount: 16 },
        { name: 'Basil', color: 0x8bc34a, height: 0.4, leafSize: 0.18, leafCount: 10 }
    ];

    // Create herbs in a circular arrangement for the center plate
    const radius = 0.8;
    const centerPlateHerbs = 8;
    
    for (let i = 0; i < centerPlateHerbs; i++) {
        const plantType = plantTypes[i % plantTypes.length];
        const plant = createPlant(plantType);
        
        // Position herbs in a circle
        const angle = (i / centerPlateHerbs) * Math.PI * 2;
        plant.position.x = Math.cos(angle) * radius;
        plant.position.z = Math.sin(angle) * radius;
        
        // Add slight random variation
        plant.position.x += (Math.random() - 0.5) * 0.2;
        plant.position.z += (Math.random() - 0.5) * 0.2;
        plant.rotation.y = Math.random() * Math.PI * 2;
        
        scene.add(plant);
        plants.push(plant);
    }
}

function createPlant(plantType) {
    const group = new THREE.Group();

    // Create detailed stem with natural variations
    const stemSegments = Math.floor(plantType.height * 25);
    const stemGeometry = new THREE.CylinderGeometry(0.015, 0.025, plantType.height, 8, stemSegments);
    const stemMaterial = new THREE.ShaderMaterial({
        vertexShader: plantVertexShader,
        fragmentShader: plantFragmentShader,
        uniforms: {
            time: { value: 0 },
            windDirection: { value: windDirection },
            windStrength: { value: windStrength * 0.8 },
            diffuse: { value: new THREE.Color(plantType.color).multiplyScalar(0.7) },
            opacity: { value: 1.0 },
            subsurfaceColor: { value: new THREE.Color(plantType.color) },
            subsurfaceIntensity: { value: 0.7 },
            roughness: { value: 0.85 }
        }
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = plantType.height / 2;
    stem.castShadow = true;
    stem.receiveShadow = true;
    group.add(stem);

    // Create herb-specific leaf shapes
    const createHerbLeafShape = (type) => {
        const shape = new THREE.Shape();
        switch(type) {
            case 'Basil':
                shape.moveTo(0, 0);
                shape.bezierCurveTo(0.3, 0.2, 0.3, 0.8, 0, 1);
                shape.bezierCurveTo(-0.3, 0.8, -0.3, 0.2, 0, 0);
                break;
            case 'Mint':
                shape.moveTo(0, 0);
                shape.bezierCurveTo(0.4, 0.2, 0.4, 0.7, 0, 1);
                shape.bezierCurveTo(-0.4, 0.7, -0.4, 0.2, 0, 0);
                break;
            case 'Lavender':
                shape.moveTo(0, 0);
                shape.bezierCurveTo(0.15, 0.3, 0.15, 0.7, 0, 1);
                shape.bezierCurveTo(-0.15, 0.7, -0.15, 0.3, 0, 0);
                break;
            case 'Rosemary':
                shape.moveTo(0, 0);
                shape.bezierCurveTo(0.1, 0.2, 0.1, 0.8, 0, 1);
                shape.bezierCurveTo(-0.1, 0.8, -0.1, 0.2, 0, 0);
                break;
        }
        return shape;
    };

    // Create detailed leaves with herb-specific characteristics
    const leafCount = plantType.leafCount;
    const leafShape = createHerbLeafShape(plantType.name);
    const leafGeometry = new THREE.ShapeGeometry(leafShape);

    for (let i = 0; i < leafCount; i++) {
        const leafMaterial = new THREE.ShaderMaterial({
            vertexShader: plantVertexShader,
            fragmentShader: plantFragmentShader,
            uniforms: {
                time: { value: 0 },
                windDirection: { value: windDirection },
                windStrength: { value: windStrength * 1.5 },
                diffuse: { value: new THREE.Color(plantType.color) },
                opacity: { value: 0.95 },
                subsurfaceColor: { value: new THREE.Color(plantType.color).multiplyScalar(1.4) },
                subsurfaceIntensity: { value: 0.8 },
                roughness: { value: 0.65 }
            },
            side: THREE.DoubleSide,
            transparent: true
        });

        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        
        // Create natural leaf distribution pattern
        const heightFactor = i / leafCount;
        const angle = (i / leafCount) * Math.PI * 2 + Math.random() * 0.5;
        const radius = 0.12 * Math.random() + 0.08;
        
        leaf.position.x = Math.cos(angle) * radius;
        leaf.position.z = Math.sin(angle) * radius;
        leaf.position.y = plantType.height * (0.3 + heightFactor * 0.7);
        
        // Add natural variation to leaf orientation
        leaf.rotation.x = Math.PI * 0.3 + Math.random() * Math.PI * 0.2;
        leaf.rotation.y = angle + Math.PI * 0.5;
        leaf.rotation.z = Math.random() * Math.PI * 0.3;
        
        const leafScale = plantType.leafSize * (0.8 + Math.random() * 0.4);
        leaf.scale.set(leafScale, leafScale, leafScale);
        
        leaf.castShadow = true;
        leaf.receiveShadow = true;
        group.add(leaf);
    }

    group.userData = { name: plantType.name, interactive: true };
    return group;
}

function onSelectStart(event) {
    const controller = event.target;
    const intersections = getIntersections(controller);

    if (intersections.length > 0) {
        const intersection = intersections[0];
        const object = intersection.object;
        if (object.parent.userData.interactive) {
            object.parent.scale.multiplyScalar(1.2);
            console.log(`Selected ${object.parent.userData.name}`);
        }
    }
}

function onSelectEnd(event) {
    const controller = event.target;
    const intersections = getIntersections(controller);

    if (intersections.length > 0) {
        const intersection = intersections[0];
        const object = intersection.object;
        if (object.parent.userData.interactive) {
            object.parent.scale.set(1, 1, 1);
        }
    }
}

function getIntersections(controller) {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    return raycaster.intersectObjects(plants, true);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    const time = clock.getElapsedTime();
    
    // Update shader uniforms for all plants with enhanced animation
    plants.forEach((plant) => {
        plant.traverse((child) => {
            if (child.material && child.material.uniforms) {
                child.material.uniforms.time.value = time;
                // Add subtle rotation for more natural movement
                child.rotation.y = Math.sin(time * 0.5 + child.position.x) * 0.05;
            }
        });
    });

    // Update controls if available
    if (controls) controls.update();

    // Ensure proper rendering
    if (renderer) {
        renderer.render(scene, camera);
    }
}