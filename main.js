import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 25000);

// Renderer setup
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#solarSystem'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Label renderer setup
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.left = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.getElementById('container').appendChild(labelRenderer.domElement);

// Controls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 100;
controls.maxDistance = 20000;
controls.enablePan = false;
controls.autoRotate = false;

// Lighting setup
const ambientLight = new THREE.AmbientLight(0x555555);  // Brighter ambient light
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2, 3000);  // Increased intensity
scene.add(sunLight);

// Planet colors and materials
const planetColors = {
    Sun: 0xffdd44,  // Brighter yellow
    Mercury: 0xaaaaaa,  // Lighter grey
    Venus: 0xffd700,    // Brighter gold
    Earth: 0x4477ff,    // Brighter blue
    Mars: 0xff5533,     // Brighter red
    Jupiter: 0xffaa88,  // Brighter orange
    Saturn: 0xffcc88,   // Brighter tan
    Uranus: 0x99ffee,   // Brighter cyan
    Neptune: 0x4444ff   // Brighter deep blue
};

// Planet data
const planetData = {
    'Sun': { size: 20, color: 0xffff00, orbitRadius: 0, orbitSpeed: 0, rotationSpeed: 0.002 },
    'Mercury': { size: 3.8, color: 0x888888, orbitRadius: 40, orbitSpeed: 0.04, rotationSpeed: 0.004 },
    'Venus': { size: 9.5, color: 0xffd700, orbitRadius: 70, orbitSpeed: 0.015, rotationSpeed: 0.002 },
    'Earth': { size: 10, color: 0x2233ff, orbitRadius: 100, orbitSpeed: 0.01, rotationSpeed: 0.02 },
    'Mars': { size: 5.3, color: 0xff4400, orbitRadius: 150, orbitSpeed: 0.008, rotationSpeed: 0.018 },
    'Jupiter': { size: 19.8, color: 0xffaa88, orbitRadius: 200, orbitSpeed: 0.002, rotationSpeed: 0.04 },
    'Saturn': { size: 16.6, color: 0xffcc99, orbitRadius: 250, orbitSpeed: 0.0009, rotationSpeed: 0.038 },
    'Uranus': { size: 14.2, color: 0x99ffff, orbitRadius: 300, orbitSpeed: 0.0004, rotationSpeed: 0.03 },
    'Neptune': { size: 13.8, color: 0x3333ff, orbitRadius: 350, orbitSpeed: 0.0001, rotationSpeed: 0.032 }
};

// Universe scale thresholds
const UNIVERSE_SCALE = {
    SOLAR_SYSTEM: { START: 0, END: 2000 },
    NEBULA: { START: 3000, END: 6000 },      // Pushed back nebula visibility
    NEARBY_GALAXIES: { START: 5000, END: 9000 },
    DISTANT_GALAXIES: { START: 8000, END: 14000 },
    UNIVERSE: { START: 12000, END: 20000 }
};

// Constants for better performance
const VISIBILITY_THRESHOLDS = {
    SOLAR_SYSTEM: 300,
    NEARBY_STARS: 500,
    DISTANT_STARS: 800,
    NEBULA_START: 600,
    NEBULA_FULL: 1200,
    GALAXY_START: 1500,
    GALAXY_FULL: 2000
};

// Performance optimization flags
const PERFORMANCE = {
    USE_LOW_POLY: true,
    MAX_STARS: 2000,
    MAX_NEBULAS: 15,
    ENABLE_SHADOWS: false,
    USE_FRUSTUM_CULLING: true
};

// Create planet with improved materials
function createPlanet(name, size, orbitRadius, orbitSpeed, rotationSpeed) {
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const material = new THREE.MeshPhongMaterial({
        color: planetData[name].color,
        transparent: true,
        opacity: 1,
        emissive: name === 'Sun' ? planetData[name].color : 0x000000,
        emissiveIntensity: name === 'Sun' ? 1 : 0,
        shininess: 25,
        specular: 0x333333
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Add planet label
    const planetLabel = document.createElement('div');
    planetLabel.className = 'label';
    planetLabel.textContent = name;
    planetLabel.style.color = '#ffffff';
    const label = new CSS2DObject(planetLabel);
    label.position.set(0, size + 1, 0);
    mesh.add(label);

    // Create orbit line
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    const segments = 128;

    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        orbitPoints.push(
            orbitRadius * Math.cos(theta),
            0,
            orbitRadius * Math.sin(theta)
        );
    }

    orbitGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(orbitPoints, 3)
    );

    const orbitMaterial = new THREE.LineBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.3,
    });

    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    if (name !== 'Sun') {
        scene.add(orbitLine);
    }

    return {
        mesh,
        orbit: orbitRadius,
        speed: orbitSpeed,
        angle: Math.random() * Math.PI * 2,
        rotationSpeed,
        orbitLine,
        label
    };
}

// Create optimized star field with better visibility
function createStarField() {
    const starCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        const radius = THREE.MathUtils.randFloat(400, 3000);
        const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
        const phi = THREE.MathUtils.randFloat(0, Math.PI);

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        // Random star colors (blue, white, yellow)
        const colorChoice = Math.random();
        if (colorChoice < 0.3) {
            colors[i * 3] = 0.6 + Math.random() * 0.4;
            colors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
            colors[i * 3 + 2] = 1;
        } else if (colorChoice < 0.8) {
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 1;
        } else {
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 0.8;
        }

        sizes[i] = Math.random() * 3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
    });

    const starField = new THREE.Points(geometry, material);
    scene.add(starField);
    return starField;
}

// Create nebula clouds with improved visibility and colors
function createNebulaClouds() {
    const nebulas = [];
    const nebulaCount = 8;
    const nebulaColors = [
        new THREE.Color(0xff6b8d),  // Pink
        new THREE.Color(0x4b79ff),  // Blue
        new THREE.Color(0x6bff9e),  // Green
        new THREE.Color(0xffcb6b)   // Gold
    ];

    for (let i = 0; i < nebulaCount; i++) {
        const group = new THREE.Group();
        const layerCount = 5;
        const baseColor = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
        
        for (let j = 0; j < layerCount; j++) {
            const geometry = new THREE.SphereGeometry(
                THREE.MathUtils.randFloat(200, 400),
                32, 32
            );
            
            const material = new THREE.MeshBasicMaterial({
                color: baseColor,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending
            });

            const cloud = new THREE.Mesh(geometry, material);
            cloud.position.set(
                THREE.MathUtils.randFloatSpread(100),
                THREE.MathUtils.randFloatSpread(100),
                THREE.MathUtils.randFloatSpread(100)
            );
            cloud.scale.set(
                THREE.MathUtils.randFloat(0.8, 1.2),
                THREE.MathUtils.randFloat(0.8, 1.2),
                THREE.MathUtils.randFloat(0.8, 1.2)
            );
            group.add(cloud);
        }

        // Position the nebula in space
        const radius = THREE.MathUtils.randFloat(2000, 4000);
        const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
        const phi = THREE.MathUtils.randFloat(0, Math.PI);

        group.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
        );

        scene.add(group);
        nebulas.push({
            group,
            baseOpacity: THREE.MathUtils.randFloat(0.3, 0.5),
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.0001,
                y: (Math.random() - 0.5) * 0.0001,
                z: (Math.random() - 0.5) * 0.0001
            }
        });
    }
    return nebulas;
}

// Create galaxy clusters
function createGalaxyClusters() {
    const galaxyClusters = [];
    const galaxyCount = {
        NEARBY: 20,
        DISTANT: 100
    };

    // Create nearby galaxies
    for (let i = 0; i < galaxyCount.NEARBY; i++) {
        const size = THREE.MathUtils.randFloat(200, 400);
        const geometry = new THREE.SphereGeometry(size, 32, 32);
        
        const galaxyMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.7, 0.4),
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        const galaxy = new THREE.Mesh(geometry, galaxyMaterial);
        
        // Position in near space
        const radius = THREE.MathUtils.randFloat(4000, 7000);
        const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
        const phi = THREE.MathUtils.randFloat(0, Math.PI);
        
        galaxy.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
        );

        scene.add(galaxy);
        galaxyClusters.push({
            mesh: galaxy,
            type: 'NEARBY',
            rotationSpeed: (Math.random() - 0.5) * 0.0001
        });
    }

    // Create distant galaxies
    for (let i = 0; i < galaxyCount.DISTANT; i++) {
        const size = THREE.MathUtils.randFloat(100, 200);
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        
        const galaxyMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.6, 0.3),
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });

        const galaxy = new THREE.Mesh(geometry, galaxyMaterial);
        
        // Position in far space
        const radius = THREE.MathUtils.randFloat(7000, 12000);
        const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
        const phi = THREE.MathUtils.randFloat(0, Math.PI);
        
        galaxy.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
        );

        scene.add(galaxy);
        galaxyClusters.push({
            mesh: galaxy,
            type: 'DISTANT',
            rotationSpeed: (Math.random() - 0.5) * 0.00005
        });
    }

    return galaxyClusters;
}

// Create universe background
function createUniverseBackground() {
    const geometry = new THREE.SphereGeometry(15000, 64, 64);
    const material = new THREE.MeshBasicMaterial({
        color: 0x000066,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
    });
    const universe = new THREE.Mesh(geometry, material);
    scene.add(universe);
    return universe;
}

// Create black hole
function createBlackHole() {
    const group = new THREE.Group();
    
    // Event horizon
    const horizonGeometry = new THREE.SphereGeometry(100, 64, 64);
    const horizonMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.9
    });
    const horizon = new THREE.Mesh(horizonGeometry, horizonMaterial);
    group.add(horizon);

    // Accretion disk
    const diskGeometry = new THREE.RingGeometry(150, 400, 64);
    const diskMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3300,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const disk = new THREE.Mesh(diskGeometry, diskMaterial);
    disk.rotation.x = Math.PI / 2;
    group.add(disk);

    // Light effects
    const glowGeometry = new THREE.SphereGeometry(120, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x0066ff,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Position black hole
    group.position.set(3000, 500, -2000);
    scene.add(group);

    return {
        group,
        rotationSpeed: 0.001,
        diskRotationSpeed: 0.002
    };
}

// Create comet with tail
function createComet() {
    const group = new THREE.Group();

    // Comet nucleus
    const nucleusGeometry = new THREE.SphereGeometry(5, 16, 16);
    const nucleusMaterial = new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        emissive: 0x444444
    });
    const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    group.add(nucleus);

    // Comet tail (particle system)
    const particleCount = 1000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const distance = Math.random() * 100;
        const angle = Math.random() * Math.PI * 2;
        
        positions[i * 3] = -distance;
        positions[i * 3 + 1] = distance * Math.sin(angle) * 0.1;
        positions[i * 3 + 2] = distance * Math.cos(angle) * 0.1;

        const alpha = 1 - (distance / 100);
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
        size: 2,
        transparent: true,
        opacity: 0.8,
        vertexColors: true,
        blending: THREE.AdditiveBlending
    });

    const tail = new THREE.Points(particles, particleMaterial);
    group.add(tail);

    // Random orbit parameters
    const orbitRadius = THREE.MathUtils.randFloat(500, 1500);
    const orbitSpeed = THREE.MathUtils.randFloat(0.0005, 0.001);
    const orbitInclination = THREE.MathUtils.randFloat(-0.5, 0.5);

    return {
        group,
        orbitRadius,
        orbitSpeed,
        orbitInclination,
        angle: Math.random() * Math.PI * 2
    };
}

// Create asteroid belt with correct positioning between Mars and Jupiter
function createAsteroidBelt() {
    const asteroids = [];
    const asteroidCount = 1000;
    
    // Mars orbit is at 228 units, Jupiter at 778 units
    const minRadius = 228 + 50; // Start a bit beyond Mars
    const maxRadius = 778 - 50; // End a bit before Jupiter
    const beltWidth = maxRadius - minRadius;
    const avgRadius = (minRadius + maxRadius) / 2;

    const geometry = new THREE.IcosahedronGeometry(2.5, 1);
    const material = new THREE.MeshPhongMaterial({
        color: 0x888888,
        flatShading: true,
        shininess: 50,
        specular: 0x444444,
        emissive: 0x222222,
    });

    for (let i = 0; i < asteroidCount; i++) {
        const asteroid = new THREE.Mesh(geometry, material);
        
        const angle = Math.random() * Math.PI * 2;
        // Random radius between Mars and Jupiter orbits with gaussian distribution
        const radius = minRadius + (Math.random() + Math.random()) * beltWidth / 2;
        const height = (Math.random() - 0.5) * 25; // Reduced vertical spread
        
        asteroid.position.set(
            radius * Math.cos(angle),
            height,
            radius * Math.sin(angle)
        );

        asteroid.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        const scale = Math.random() * 1.5 + 1;
        asteroid.scale.set(scale, scale, scale);

        scene.add(asteroid);
        asteroids.push({
            mesh: asteroid,
            orbitSpeed: THREE.MathUtils.randFloat(0.001, 0.002) * (avgRadius / radius), // Adjust speed based on radius
            orbitRadius: radius,
            angle,
            rotationSpeed: THREE.MathUtils.randFloat(0.01, 0.02)
        });
    }

    return asteroids;
}

// Create gas clouds
function createGasClouds() {
    const clouds = [];
    const cloudCount = 15;
    const cloudColors = [
        new THREE.Color(0xff9999), // Red
        new THREE.Color(0x99ff99), // Green
        new THREE.Color(0x9999ff), // Blue
        new THREE.Color(0xffff99)  // Yellow
    ];

    for (let i = 0; i < cloudCount; i++) {
        const group = new THREE.Group();
        const layerCount = 8;
        const baseColor = cloudColors[Math.floor(Math.random() * cloudColors.length)];
        
        for (let j = 0; j < layerCount; j++) {
            const size = THREE.MathUtils.randFloat(100, 300);
            const geometry = new THREE.SphereGeometry(size, 32, 32);
            
            const material = new THREE.MeshBasicMaterial({
                color: baseColor,
                transparent: true,
                opacity: 0.15,
                blending: THREE.AdditiveBlending
            });

            const cloud = new THREE.Mesh(geometry, material);
            cloud.position.set(
                THREE.MathUtils.randFloatSpread(200),
                THREE.MathUtils.randFloatSpread(200),
                THREE.MathUtils.randFloatSpread(200)
            );
            
            cloud.scale.set(
                THREE.MathUtils.randFloat(0.5, 1.5),
                THREE.MathUtils.randFloat(0.5, 1.5),
                THREE.MathUtils.randFloat(0.5, 1.5)
            );
            
            group.add(cloud);
        }

        // Position the gas cloud
        const radius = THREE.MathUtils.randFloat(1000, 3000);
        const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
        const phi = THREE.MathUtils.randFloat(0, Math.PI);

        group.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
        );

        scene.add(group);
        clouds.push({
            group,
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.0002,
                y: (Math.random() - 0.5) * 0.0002,
                z: (Math.random() - 0.5) * 0.0002
            }
        });
    }
    return clouds;
}

// Create planets
const planets = {};
Object.entries(planetData).forEach(([name, data]) => {
    planets[name] = createPlanet(name, data.size, data.orbitRadius, data.orbitSpeed, data.rotationSpeed);
});

// Planetary data for info panel
const planetaryData = {
    'Mercury': {
        mass: '3.285 × 10^23 kg',
        diameter: '4,879 km',
        gravity: '3.7 m/s²',
        orbitalPeriod: '88 Earth days',
        rotationPeriod: '59 Earth days',
        avgTemp: '167°C',
        sunDistance: '57.9 million km',
        moons: 0,
        earthComparison: {
            size: '0.383',
            gravity: '0.378',
            day: '58.646',
            year: '0.24'
        },
        travelTimes: {
            light: '3.2 minutes',
            shuttle: '115 days',
            spacecraft: '85 days'
        }
    },
    'Venus': {
        mass: '4.867 × 10^24 kg',
        diameter: '12,104 km',
        gravity: '8.87 m/s²',
        orbitalPeriod: '225 Earth days',
        rotationPeriod: '243 Earth days',
        avgTemp: '464°C',
        sunDistance: '108.2 million km',
        moons: 0,
        earthComparison: {
            size: '0.949',
            gravity: '0.904',
            day: '243',
            year: '0.615'
        },
        travelTimes: {
            light: '6 minutes',
            shuttle: '215 days',
            spacecraft: '160 days'
        }
    },
    'Earth': {
        mass: '5.972 × 10^24 kg',
        diameter: '12,742 km',
        gravity: '9.81 m/s²',
        orbitalPeriod: '365.25 days',
        rotationPeriod: '24 hours',
        avgTemp: '15°C',
        sunDistance: '149.6 million km',
        moons: 1,
        earthComparison: {
            size: '1',
            gravity: '1',
            day: '1',
            year: '1'
        },
        travelTimes: {
            light: '8.3 minutes',
            shuttle: '0',
            spacecraft: '0'
        }
    },
    'Mars': {
        mass: '6.39 × 10^23 kg',
        diameter: '6,779 km',
        gravity: '3.71 m/s²',
        orbitalPeriod: '687 Earth days',
        rotationPeriod: '24.6 hours',
        avgTemp: '-63°C',
        sunDistance: '227.9 million km',
        moons: 2,
        earthComparison: {
            size: '0.532',
            gravity: '0.378',
            day: '1.025',
            year: '1.88'
        },
        travelTimes: {
            light: '12.7 minutes',
            shuttle: '300 days',
            spacecraft: '225 days'
        }
    },
    'Jupiter': {
        mass: '1.898 × 10^27 kg',
        diameter: '139,820 km',
        gravity: '24.79 m/s²',
        orbitalPeriod: '11.9 Earth years',
        rotationPeriod: '9.9 hours',
        avgTemp: '-110°C',
        sunDistance: '778.5 million km',
        moons: 79,
        earthComparison: {
            size: '11.209',
            gravity: '2.528',
            day: '0.413',
            year: '11.862'
        },
        travelTimes: {
            light: '43.2 minutes',
            shuttle: '2.7 years',
            spacecraft: '2.1 years'
        }
    },
    'Saturn': {
        mass: '5.683 × 10^26 kg',
        diameter: '116,460 km',
        gravity: '10.44 m/s²',
        orbitalPeriod: '29.5 Earth years',
        rotationPeriod: '10.7 hours',
        avgTemp: '-140°C',
        sunDistance: '1.434 billion km',
        moons: 82,
        earthComparison: {
            size: '9.449',
            gravity: '1.065',
            day: '0.446',
            year: '29.457'
        },
        travelTimes: {
            light: '79.7 minutes',
            shuttle: '4.5 years',
            spacecraft: '3.5 years'
        }
    },
    'Uranus': {
        mass: '8.681 × 10^25 kg',
        diameter: '50,724 km',
        gravity: '8.69 m/s²',
        orbitalPeriod: '84 Earth years',
        rotationPeriod: '17.2 hours',
        avgTemp: '-195°C',
        sunDistance: '2.871 billion km',
        moons: 27,
        earthComparison: {
            size: '4.007',
            gravity: '0.886',
            day: '0.717',
            year: '84'
        },
        travelTimes: {
            light: '159.6 minutes',
            shuttle: '8.4 years',
            spacecraft: '6.8 years'
        }
    },
    'Neptune': {
        mass: '1.024 × 10^26 kg',
        diameter: '49,244 km',
        gravity: '11.15 m/s²',
        orbitalPeriod: '165 Earth years',
        rotationPeriod: '16.1 hours',
        avgTemp: '-200°C',
        sunDistance: '4.495 billion km',
        moons: 14,
        earthComparison: {
            size: '3.883',
            gravity: '1.137',
            day: '0.671',
            year: '164.79'
        },
        travelTimes: {
            light: '4.1 hours',
            shuttle: '12 years',
            spacecraft: '9.5 years'
        }
    }
};

// Update info panel
function updateInfoPanel(camera) {
    // Update camera position
    const pos = camera.position;
    document.getElementById('cameraPosition').textContent = 
        `${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}, ${pos.z.toFixed(0)}`;

    // Find nearest planet
    let nearestPlanet = null;
    let minDistance = Infinity;
    let earthDistance = Infinity;

    Object.entries(planets).forEach(([name, planetObj]) => {
        if (name === 'Sun') return;
        
        const distance = camera.position.distanceTo(planetObj.mesh.position);
        if (distance < minDistance) {
            minDistance = distance;
            nearestPlanet = name;
        }
        
        if (name === 'Earth') {
            earthDistance = distance;
        }
    });

    // Update Earth distance
    document.getElementById('earthDistance').textContent = 
        `${(earthDistance / 50).toFixed(2)} million km`;

    // Update nearest object info
    if (nearestPlanet && planetaryData[nearestPlanet]) {
        const data = planetaryData[nearestPlanet];
        document.getElementById('nearestObject').textContent = nearestPlanet;
        
        // Update basic info
        document.getElementById('objectMass').textContent = data.mass;
        document.getElementById('objectDiameter').textContent = data.diameter;
        document.getElementById('objectGravity').textContent = data.gravity;
        document.getElementById('objectOrbitalPeriod').textContent = data.orbitalPeriod;
        document.getElementById('objectRotationPeriod').textContent = data.rotationPeriod;
        document.getElementById('objectTemperature').textContent = data.avgTemp;
        document.getElementById('objectSunDistance').textContent = data.sunDistance;
        document.getElementById('objectMoons').textContent = data.moons;

        // Update Earth comparison
        document.getElementById('sizeRatio').textContent = `${data.earthComparison.size}x Earth`;
        document.getElementById('gravityRatio').textContent = `${data.earthComparison.gravity}x Earth`;
        document.getElementById('dayRatio').textContent = `${data.earthComparison.day}x Earth`;
        document.getElementById('yearRatio').textContent = `${data.earthComparison.year}x Earth`;

        // Update travel times
        document.getElementById('travelLight').textContent = data.travelTimes.light;
        document.getElementById('travelShuttle').textContent = data.travelTimes.shuttle;
        document.getElementById('travelSpacecraft').textContent = data.travelTimes.spacecraft;
    }
}

// Space Facts Database
const spaceFacts = [
    "A day on Venus is longer than its year. It takes Venus 243 Earth days to rotate on its axis but only 225 Earth days to orbit the Sun.",
    "The Sun loses 4 million tons of mass every second due to nuclear fusion, converting matter into energy.",
    "A teaspoonful of neutron star material would weigh about 4 billion tons on Earth.",
    "The footprints left by Apollo astronauts on the Moon will last for at least 100 million years since there's no wind to blow them away.",
    "If you could put Saturn in a giant bathtub, it would float. Its density is less than that of water.",
    "The largest known star, UY Scuti, is so big that it would take light 5 hours to travel around its equator.",
    "There's a planet made of diamonds twice the size of Earth, called 55 Cancri e.",
    "The black hole at the center of our galaxy, Sagittarius A*, weighs as much as 4 million suns.",
    "Light from the Andromeda Galaxy takes 2.5 million years to reach Earth.",
    "Jupiter's Great Red Spot is shrinking, but it's still big enough to fit 2-3 Earths inside it.",
    "The fastest known star, S5-HVS1, is moving at 8% the speed of light.",
    "There's a cloud of alcohol spanning 463 billion kilometers in space (mostly methanol).",
    "The largest known void in space, the Boötes void, could fit 10,000 Milky Way galaxies inside it.",
    "Astronauts grow about 2 inches taller in space due to the lack of gravity.",
    "The most distant object ever seen is a galaxy called GN-z11, observed as it was 13.4 billion years ago.",
    "There are more trees on Earth than stars in the Milky Way galaxy.",
    "The Sun's surface is so hot that a human-sized object would vaporize instantly if placed there.",
    "Some scientists believe that diamonds rain down on Jupiter and Saturn.",
    "The largest known structure in the universe is the Hercules-Corona Borealis Great Wall, spanning 10 billion light-years.",
    "A year on Mercury is only 88 Earth days, but a single day lasts 176 Earth days.",
    "The Olympus Mons on Mars is three times taller than Mount Everest.",
    "There's a planet where it rains glass sideways at 4,300 mph (HD 189733b).",
    "The core of Jupiter is as hot as the Sun's surface.",
    "There are more possible iterations of a game of chess than there are atoms in the universe.",
    "The Milky Way galaxy is moving through space at 1.3 million miles per hour.",
    "There's a planet made entirely of burning ice called Gliese 436 b.",
    "The largest known asteroid, Ceres, is about the size of Texas.",
    "A space suit costs approximately $12 million.",
    "The first photograph of a black hole, M87*, shows it as it appeared 55 million years ago.",
    "There are billions of molecules of water ice floating in space between stars."
];

let currentFactIndex = 0;

// Initialize space facts
function initSpaceFacts() {
    const prevButton = document.getElementById('prevFact');
    const nextButton = document.getElementById('nextFact');
    const factText = document.getElementById('currentFact');
    const factNumber = document.getElementById('factNumber');

    function updateFact() {
        factText.textContent = spaceFacts[currentFactIndex];
        factNumber.textContent = `${currentFactIndex + 1}/${spaceFacts.length}`;
    }

    prevButton.addEventListener('click', () => {
        currentFactIndex = (currentFactIndex - 1 + spaceFacts.length) % spaceFacts.length;
        updateFact();
    });

    nextButton.addEventListener('click', () => {
        currentFactIndex = (currentFactIndex + 1) % spaceFacts.length;
        updateFact();
    });

    // Auto-advance facts every 15 seconds
    setInterval(() => {
        currentFactIndex = (currentFactIndex + 1) % spaceFacts.length;
        updateFact();
    }, 15000);

    // Show initial fact
    updateFact();
}

// Initialize facts after DOM is loaded
initSpaceFacts();

// Create space environment
const starField = createStarField();
const nebulas = createNebulaClouds();
const galaxyClusters = createGalaxyClusters();
const universeBackground = createUniverseBackground();
const blackHole = createBlackHole();
const comets = Array(5).fill(null).map(() => createComet());
const asteroidBelt = createAsteroidBelt();
const gasClouds = createGasClouds();

// Camera setup
camera.position.set(300, 150, 300);
controls.target.set(0, 0, 0);  // Look at the center of the solar system
controls.update();

// Update animation loop with all celestial objects
function animate() {
    requestAnimationFrame(animate);
    const cameraDistance = camera.position.length();

    // Update solar system visibility
    Object.entries(planets).forEach(([name, planetObj]) => {
        if (name !== 'Sun') {
            // Update planet positions
            planetObj.angle += planetObj.speed;
            planetObj.mesh.position.x = Math.cos(planetObj.angle) * planetObj.orbit;
            planetObj.mesh.position.z = Math.sin(planetObj.angle) * planetObj.orbit;
            planetObj.mesh.rotation.y += planetObj.rotationSpeed;

            // Fade out planets and orbit lines as we zoom out
            const fadeStart = UNIVERSE_SCALE.SOLAR_SYSTEM.START;
            const fadeEnd = UNIVERSE_SCALE.SOLAR_SYSTEM.END;
            const opacity = Math.max(0, 1 - (cameraDistance - fadeStart) / (fadeEnd - fadeStart));
            
            planetObj.mesh.material.opacity = opacity;
            planetObj.orbitLine.material.opacity = opacity * 0.3;
            
            if (planetObj.label) {
                planetObj.label.element.style.opacity = opacity;
                planetObj.label.visible = opacity > 0.1;
            }
        }
    });

    // Update black hole
    if (blackHole) {
        blackHole.group.rotation.y += blackHole.rotationSpeed;
        blackHole.group.children[1].rotation.z += blackHole.diskRotationSpeed; // Rotate accretion disk
        
        // Add pulsing effect to the glow
        const time = Date.now() * 0.001;
        blackHole.group.children[2].material.opacity = 0.3 + Math.sin(time * 2) * 0.1;
    }

    // Update comets
    comets.forEach(comet => {
        comet.angle += comet.orbitSpeed;
        const x = Math.cos(comet.angle) * comet.orbitRadius;
        const z = Math.sin(comet.angle) * comet.orbitRadius;
        const y = Math.sin(comet.angle) * comet.orbitRadius * comet.orbitInclination;
        
        comet.group.position.set(x, y, z);
        comet.group.lookAt(0, 0, 0); // Point tail away from center
        
        // Update tail particles
        const positions = comet.group.children[1].geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] *= 0.95;
            if (positions[i] > -1) positions[i] = -100;
        }
        comet.group.children[1].geometry.attributes.position.needsUpdate = true;
    });

    // Update asteroid belt with improved visibility
    asteroidBelt.forEach(asteroid => {
        asteroid.angle += asteroid.orbitSpeed;
        const x = Math.cos(asteroid.angle) * asteroid.orbitRadius;
        const z = Math.sin(asteroid.angle) * asteroid.orbitRadius;
        asteroid.mesh.position.x = x;
        asteroid.mesh.position.z = z;
        asteroid.mesh.rotation.y += asteroid.rotationSpeed;

        // Fade asteroids with distance but keep them more visible than planets
        const asteroidOpacity = Math.max(0, 1 - (cameraDistance - 1000) / 2000);
        asteroid.mesh.material.opacity = Math.min(1, asteroidOpacity * 1.5);
    });

    // Update gas clouds with delayed visibility
    gasClouds.forEach(cloud => {
        // Only show and update gas clouds when zoomed out far enough
        const cloudOpacity = Math.max(0, (cameraDistance - UNIVERSE_SCALE.NEBULA.START) / 
            (UNIVERSE_SCALE.NEBULA.END - UNIVERSE_SCALE.NEBULA.START));
        
        if (cloudOpacity > 0) {
            cloud.group.traverse(child => {
                if (child.material) {
                    child.material.opacity = cloudOpacity * 0.15;
                }
            });

            cloud.group.rotation.x += cloud.rotationSpeed.x;
            cloud.group.rotation.y += cloud.rotationSpeed.y;
            cloud.group.rotation.z += cloud.rotationSpeed.z;

            // Add subtle pulsing effect only when visible
            const time = Date.now() * 0.001;
            cloud.group.scale.x = 1 + Math.sin(time) * 0.1;
            cloud.group.scale.y = 1 + Math.cos(time * 1.1) * 0.1;
            cloud.group.scale.z = 1 + Math.sin(time * 0.9) * 0.1;
        } else {
            cloud.group.traverse(child => {
                if (child.material) {
                    child.material.opacity = 0;
                }
            });
        }
    });

    // Update nebulas with stricter distance-based visibility
    nebulas.forEach(nebula => {
        const nebulaOpacity = Math.max(0, (cameraDistance - UNIVERSE_SCALE.NEBULA.START) / 
            (UNIVERSE_SCALE.NEBULA.END - UNIVERSE_SCALE.NEBULA.START));

        nebula.group.traverse(child => {
            if (child.material) {
                child.material.opacity = nebulaOpacity * 0.5;
            }
        });

        if (nebulaOpacity > 0) {
            nebula.group.rotation.x += nebula.rotationSpeed.x;
            nebula.group.rotation.y += nebula.rotationSpeed.y;
            nebula.group.rotation.z += nebula.rotationSpeed.z;
        }
    });

    // Update galaxy clusters with improved visibility
    galaxyClusters.forEach(galaxy => {
        const distanceScale = galaxy.type === 'NEARBY' ? 
            UNIVERSE_SCALE.NEARBY_GALAXIES : UNIVERSE_SCALE.DISTANT_GALAXIES;

        const opacity = Math.min(
            Math.max(0, (cameraDistance - distanceScale.START) /
                (distanceScale.END - distanceScale.START)),
            1
        ) * (galaxy.type === 'NEARBY' ? 0.8 : 0.5);

        galaxy.mesh.material.opacity = opacity;
        galaxy.mesh.rotation.y += galaxy.rotationSpeed;
    });

    // Update universe background with smoother fade
    if (universeBackground) {
        universeBackground.material.opacity = Math.min(
            Math.max(0, (cameraDistance - UNIVERSE_SCALE.UNIVERSE.START) /
                (UNIVERSE_SCALE.UNIVERSE.END - UNIVERSE_SCALE.UNIVERSE.START)),
            0.3
        );
    }

    // Only show info panel when close to solar system
    if (cameraDistance < UNIVERSE_SCALE.SOLAR_SYSTEM.END) {
        updateInfoPanel(camera);
    }

    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();
