
/**
 * AEROFOLD™ ADVANCED SCENE CONTROLLER
 * Advanced Three.js + GSAP Integration
 */

class AerofoldApp {
    constructor() {
        this.canvas = document.querySelector('#webgl');
        this.loaderProgress = document.querySelector('#loader-progress');
        this.loader = document.querySelector('#loader');
        this.hudAltitude = document.querySelector('#hud-altitude');
        
        this.scene = new THREE.Scene();
        this.drone = null;
        this.parts = { arms: [], props: [] };
        this.particles = null;
        
        this.init();
    }

    async init() {
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupEnvironment();
        this.bindEvents();
        
        await this.loadAssets();
        this.setupTimelines();
        this.animate();
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 8);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambient);

        this.keyLight = new THREE.DirectionalLight(0x007AFF, 2);
        this.keyLight.position.set(5, 5, 5);
        this.scene.add(this.keyLight);

        const rimLight = new THREE.SpotLight(0xffffff, 4);
        rimLight.position.set(-10, 5, -5);
        this.scene.add(rimLight);
    }

    setupEnvironment() {
        // Particle System for Weather Section
        const geo = new THREE.BufferGeometry();
        const count = 3000;
        const pos = new Float32Array(count * 3);
        for(let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 20;
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ color: 0x007AFF, size: 0.02, transparent: true, opacity: 0 });
        this.particles = new THREE.Points(geo, mat);
        this.scene.add(this.particles);
    }

    async loadAssets() {
        this.createAdvancedDrone();
        
        return new Promise((resolve) => {
            let p = 0;
            const interval = setInterval(() => {
                p += 2;
                this.loaderProgress.style.width = `${p}%`;
                if (p >= 100) {
                    clearInterval(interval);
                    gsap.to(this.loader, { opacity: 0, duration: 1, delay: 0.5, onComplete: () => this.loader.style.display = 'none' });
                    resolve();
                }
            }, 30);
        });
    }

    createAdvancedDrone() {
        this.drone = new THREE.Group();
        this.droneBody = new THREE.Group();
        
        const matBody = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 1, roughness: 0.1 });
        const matBlue = new THREE.MeshStandardMaterial({ color: 0x007AFF, emissive: 0x007AFF, emissiveIntensity: 2 });
        
        // Main Core
        const core = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 2, 2, 2, 2), matBody);
        this.droneBody.add(core);

        // Internal "AI Chips" (Visible during X-Ray)
        const chip = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.4), matBlue);
        chip.position.y = 0.35;
        chip.scale.set(0,0,0);
        this.parts.aiChip = chip;
        this.droneBody.add(chip);

        // Arms & Hinges
        const armGeo = new THREE.CylinderGeometry(0.06, 0.04, 1.5);
        const corners = [
            { pos: [0.7, 0, 1], rot: [0, 0, Math.PI/4] },
            { pos: [-0.7, 0, 1], rot: [0, 0, -Math.PI/4] },
            { pos: [0.7, 0, -1], rot: [0, 0, 3*Math.PI/4] },
            { pos: [-0.7, 0, -1], rot: [0, 0, -3*Math.PI/4] }
        ];

        corners.forEach((c, i) => {
            const pivot = new THREE.Group();
            pivot.position.set(c.pos[0] * 0.2, 0, c.pos[2] * 0.2);
            
            const arm = new THREE.Mesh(armGeo, matBody);
            arm.rotation.z = Math.PI/2;
            arm.position.x = c.pos[0] > 0 ? 0.75 : -0.75;
            
            const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2), matBody);
            motor.position.set(c.pos[0] > 0 ? 1.5 : -1.5, 0.1, 0);
            
            const prop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.1), matBlue);
            prop.position.y = 0.15;
            motor.add(prop);
            
            pivot.add(arm, motor);
            this.droneBody.add(pivot);
            this.parts.arms.push(pivot);
            this.parts.props.push(prop);
        });

        // Camera Unit
        this.parts.camera = new THREE.Group();
        const camMesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 32, 32), matBody);
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1), matBlue);
        lens.rotation.x = Math.PI/2;
        lens.position.z = 0.2;
        this.parts.camera.add(camMesh, lens);
        this.parts.camera.position.set(0, -0.4, 1);
        this.droneBody.add(this.parts.camera);

        this.drone.add(this.droneBody);
        this.drone.scale.set(0.6, 0.6, 0.6);
        this.scene.add(this.drone);
    }

    setupTimelines() {
        gsap.registerPlugin(ScrollTrigger);

        const masterTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".content",
                start: "top top",
                end: "bottom bottom",
                scrub: 2
            }
        });

        // SECTION 1-2: Deploying
        masterTl.to(this.drone.scale, { x: 1, y: 1, z: 1, duration: 2 }, 0);
        this.parts.arms.forEach((p, i) => {
            masterTl.to(p.position, { x: 0, z: 0, duration: 2 }, 0);
            masterTl.to(p.rotation, { y: i < 2 ? 0.4 : -0.4, duration: 2 }, 0.5);
        });

        // SECTION 3-4: Propulsion (Props spin)
        masterTl.to(this.parts.props, { rotationY: Math.PI * 40, ease: "none", duration: 5 }, 1);
        masterTl.to(this.drone.position, { y: 1.5, duration: 2 }, 1.5);
        masterTl.to(this.camera.position, { y: 1, z: 6, duration: 2 }, 1.5);

        // SECTION 5: Vision (Zoom on lens)
        masterTl.to(this.camera.position, { x: 0, y: 0, z: 3, duration: 2 }, 2.5);
        masterTl.to(this.parts.camera.rotation, { x: 0.4, duration: 2 }, 2.5);

        // SECTION 6: Brain (X-Ray Reveal)
        masterTl.to(this.droneBody.children[0].material, { opacity: 0.2, transparent: true, duration: 1 }, 3.5);
        masterTl.to(this.parts.aiChip.scale, { x: 1, y: 1, z: 1, duration: 1 }, 3.5);

        // SECTION 7-8: Stabilization
        masterTl.to(this.drone.rotation, { z: 0.2, x: -0.1, duration: 1, repeat: 1, yoyo: true }, 4.5);
        masterTl.to(this.droneBody.children[0].material, { opacity: 1, transparent: false, duration: 1 }, 4.5);

        // SECTION 9: Weather (Particles)
        masterTl.to(this.particles.material, { opacity: 0.8, duration: 1 }, 5.5);
        masterTl.to(this.camera.position, { z: 7, duration: 2 }, 5.5);

        // HUD Update logic
        ScrollTrigger.create({
            trigger: ".content",
            onUpdate: (self) => {
                const alt = Math.floor(self.progress * 450);
                this.hudAltitude.innerText = `${alt.toString().padStart(3, '0')}m`;
            }
        });

        // Text reveal
        document.querySelectorAll('section').forEach(sec => {
            const reveal = sec.querySelector('.text-reveal');
            ScrollTrigger.create({
                trigger: sec,
                start: "top 80%",
                onEnter: () => reveal.classList.add('active'),
                onLeaveBack: () => reveal.classList.remove('active')
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
        const time = Date.now() * 0.001;

        if(this.drone) {
            this.drone.position.y += Math.sin(time * 2) * 0.002;
            this.drone.rotation.y += 0.001;
        }

        if(this.particles && this.particles.material.opacity > 0) {
            const positions = this.particles.geometry.attributes.position.array;
            for(let i = 1; i < positions.length; i += 3) {
                positions[i] -= 0.1; // Rain falling
                if(positions[i] < -10) positions[i] = 10;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new AerofoldApp();
