
/**
 * AEROFOLD™ - 3D Product Website
 * Core Logic: Three.js Rendering + GSAP Scroll Control
 */

class DroneExperience {
    constructor() {
        this.canvas = document.querySelector('#webgl');
        this.loaderProgress = document.querySelector('#loader-progress');
        this.loader = document.querySelector('#loader');
        
        this.scene = new THREE.Scene();
        this.drone = null;
        this.parts = {}; // References to drone components
        
        this.init();
    }

    async init() {
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupPostProcessingStub();
        this.bindEvents();
        
        await this.loadModel();
        this.setupScrollAnimations();
        
        this.animate();
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 5);
        this.scene.add(this.camera);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
    }

    setupLights() {
        // Main ambient light
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);

        // Key Light (Blueish)
        const keyLight = new THREE.DirectionalLight(0x007AFF, 2);
        keyLight.position.set(5, 5, 5);
        this.scene.add(keyLight);

        // Rim Light (White silhouette)
        const rimLight = new THREE.DirectionalLight(0xffffff, 3);
        rimLight.position.set(-5, 2, -5);
        this.scene.add(rimLight);

        // Subtle Fill
        const fillLight = new THREE.PointLight(0xffffff, 0.5);
        fillLight.position.set(0, -2, 2);
        this.scene.add(fillLight);
    }

    setupPostProcessingStub() {
        // In a full production app, we'd add Bloom here.
        // For this demo, we use high intensity lights to simulate a glow.
    }

    async loadModel() {
        const loader = new THREE.GLTFLoader();
        
        return new Promise((resolve) => {
            // NOTE: In a real environment, you'd provide 'drone.glb'.
            // For this functional demo, we generate a high-tech "mock" drone using primitives 
            // if the file isn't found, but the structure remains identical for a real GLB.
            
            // Simulation of model loading for demonstration stability:
            this.createMockDrone();
            
            // Simulating loading progress
            let p = 0;
            const interval = setInterval(() => {
                p += 5;
                this.loaderProgress.style.width = `${p}%`;
                if (p >= 100) {
                    clearInterval(interval);
                    gsap.to(this.loader, { opacity: 0, duration: 1, onComplete: () => this.loader.style.display = 'none' });
                    resolve();
                }
            }, 50);
        });
    }

    /**
     * Creates a modular 3D drone for the demo
     * Structure: Body -> [Arms] -> [Propellers] -> Camera -> Gear
     */
    createMockDrone() {
        this.drone = new THREE.Group();
        
        const matBody = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 });
        const matAccent = new THREE.MeshStandardMaterial({ color: 0x007AFF, emissive: 0x007AFF, emissiveIntensity: 0.5 });
        
        // Main Chassis
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), matBody);
        this.drone.add(body);
        
        // Arms (4 corners)
        this.parts.arms = [];
        const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 1);
        const corners = [
            { pos: [0.6, 0, 0.6], rot: [Math.PI/2, 0, Math.PI/4] },
            { pos: [-0.6, 0, 0.6], rot: [Math.PI/2, 0, -Math.PI/4] },
            { pos: [0.6, 0, -0.6], rot: [Math.PI/2, 0, 3*Math.PI/4] },
            { pos: [-0.6, 0, -0.6], rot: [Math.PI/2, 0, -3*Math.PI/4] }
        ];
        
        corners.forEach((c, i) => {
            const pivot = new THREE.Group();
            pivot.position.set(c.pos[0] * 0.1, 0, c.pos[2] * 0.1); // Start folded
            
            const arm = new THREE.Mesh(armGeo, matBody);
            arm.rotation.set(...c.rot);
            arm.position.set(0, 0, 0.5);
            
            // Motor/Propeller housing
            const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1), matAccent);
            motor.position.set(0, 0, 1);
            arm.add(motor);
            
            // Propeller
            const prop = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.01, 0.05), matBody);
            prop.position.set(0, 0.1, 1);
            motor.add(prop);
            
            pivot.add(arm);
            this.drone.add(pivot);
            this.parts.arms.push({ pivot, prop });
        });
        
        // Camera Unit
        const camPivot = new THREE.Group();
        camPivot.position.set(0, -0.1, 0.5);
        const camBody = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), matBody);
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1), matAccent);
        lens.rotation.x = Math.PI / 2;
        lens.position.z = 0.2;
        camBody.add(lens);
        camPivot.add(camBody);
        this.drone.add(camPivot);
        this.parts.camera = camPivot;
        
        // Landing Gear
        const gearPivot = new THREE.Group();
        const gearLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 1), matBody);
        gearLeft.position.set(-0.5, -0.4, 0);
        const gearRight = gearLeft.clone();
        gearRight.position.x = 0.5;
        gearPivot.add(gearLeft, gearRight);
        this.drone.add(gearPivot);
        this.parts.gear = gearPivot;
        
        this.drone.scale.set(0.5, 0.5, 0.5); // Initial folded scale
        this.scene.add(this.drone);
    }

    setupScrollAnimations() {
        gsap.registerPlugin(ScrollTrigger);

        // Global Timeline linked to scroll
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".content",
                start: "top top",
                end: "bottom bottom",
                scrub: 1.5,
            }
        });

        // 1. Hero -> Arms (Fold out)
        tl.to(this.drone.scale, { x: 1, y: 1, z: 1 }, 0);
        tl.to(this.camera.position, { z: 4 }, 0);
        
        this.parts.arms.forEach((arm, i) => {
            tl.to(arm.pivot.rotation, { y: (i % 2 === 0 ? 0.2 : -0.2), duration: 1 }, 0.1);
            tl.to(arm.pivot.position, { 
                x: (arm.pivot.position.x > 0 ? 0.3 : -0.3), 
                z: (arm.pivot.position.z > 0 ? 0.3 : -0.3),
                duration: 1 
            }, 0.1);
        });

        // 2. Vision System (Camera movement)
        tl.to(this.camera.position, { y: -1, z: 3 }, 0.3);
        tl.to(this.parts.camera.rotation, { x: 0.5, duration: 1 }, 0.3);
        tl.to(this.parts.camera.scale, { x: 1.2, y: 1.2, z: 1.2 }, 0.3);

        // 3. Propulsion (Propellers spin and lift)
        this.parts.arms.forEach(arm => {
            tl.to(arm.prop.rotation, { y: Math.PI * 10, ease: "none" }, 0.5);
        });
        tl.to(this.drone.position, { y: 0.5 }, 0.5);

        // 4. Autonomous (Rotating and floating)
        tl.to(this.drone.rotation, { y: Math.PI * 2, x: 0.1 }, 0.7);
        tl.to(this.camera.position, { x: 2, y: 0.5, z: 5 }, 0.7);

        // 5. Final CTA
        tl.to(this.drone.rotation, { y: Math.PI * 0.2, x: 0, z: 0 }, 0.9);
        tl.to(this.camera.position, { x: 0, y: 0, z: 6 }, 0.9);

        // Text reveal triggers
        const sections = document.querySelectorAll('section');
        sections.forEach((section, i) => {
            const reveal = section.querySelector('.text-reveal');
            ScrollTrigger.create({
                trigger: section,
                start: "top center",
                end: "bottom center",
                onEnter: () => reveal.classList.add('active'),
                onLeaveBack: () => i !== 0 && reveal.classList.remove('active'),
                onEnterBack: () => reveal.classList.add('active'),
                onLeave: () => i !== sections.length - 1 && reveal.classList.remove('active')
            });
        });
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Subtle floating animation
        if (this.drone) {
            const time = Date.now() * 0.001;
            this.drone.position.y += Math.sin(time) * 0.0005;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the app
new DroneExperience();
