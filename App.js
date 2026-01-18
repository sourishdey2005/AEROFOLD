
/**
 * AEROFOLD™ ADVANCED SCENE CONTROLLER
 * Advanced Three.js + GSAP Integration
 * Updated with Industrial "Hazard" Livery and Complex Geometry
 */

class AerofoldApp {
    constructor() {
        this.canvas = document.querySelector('#webgl');
        this.loaderProgress = document.querySelector('#loader-progress');
        this.loader = document.querySelector('#loader');
        this.hudAltitude = document.querySelector('#hud-altitude');
        
        this.scene = new THREE.Scene();
        this.drone = null;
        this.parts = { arms: [], props: [], rings: [] };
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
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
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
        this.renderer.outputEncoding = THREE.sRGBEncoding;
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        this.keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.keyLight.position.set(5, 10, 5);
        this.scene.add(this.keyLight);

        const rimLight = new THREE.SpotLight(0x007AFF, 2);
        rimLight.position.set(-10, 5, -5);
        this.scene.add(rimLight);
    }

    setupEnvironment() {
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
        this.createIndustrialDrone();
        
        return new Promise((resolve) => {
            let p = 0;
            const interval = setInterval(() => {
                p += 4;
                this.loaderProgress.style.width = `${p}%`;
                if (p >= 100) {
                    clearInterval(interval);
                    gsap.to(this.loader, { opacity: 0, duration: 1, delay: 0.5, onComplete: () => this.loader.style.display = 'none' });
                    resolve();
                }
            }, 30);
        });
    }

    createIndustrialDrone() {
        this.drone = new THREE.Group();
        this.droneBody = new THREE.Group();
        
        // Materials based on the reference image
        const matYellow = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.3, roughness: 0.4 });
        const matBlack = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
        const matGray = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 1, roughness: 0.1 });
        const matRed = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1 });
        const matAccent = new THREE.MeshStandardMaterial({ color: 0x007AFF, emissive: 0x007AFF, emissiveIntensity: 1.5 });

        // CHASSIS - Blocky industrial style
        const mainChassis = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 2.5), matBlack);
        
        // Hazard Stripes (Yellow top plates)
        const topPlate = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.1, 1), matYellow);
        topPlate.position.set(0, 0.35, 0.2);
        mainChassis.add(topPlate);

        const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.6), matGray);
        cockpit.position.set(0, 0.4, 0.8);
        mainChassis.add(cockpit);

        // Rear Exhausts (Red components)
        const exhaustL = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3), matRed);
        exhaustL.rotation.x = Math.PI/2;
        exhaustL.position.set(-0.3, 0, -1.3);
        const exhaustR = exhaustL.clone();
        exhaustR.position.x = 0.3;
        mainChassis.add(exhaustL, exhaustR);

        this.droneBody.add(mainChassis);

        // INTERNAL AI CHIP (X-Ray)
        const chip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.6), matAccent);
        chip.position.y = 0;
        chip.scale.set(0,0,0);
        this.parts.aiChip = chip;
        this.droneBody.add(chip);

        // ARMS - With yellow stripes and motor rings
        const corners = [
            { pos: [1.2, 0, 1.2], rot: [0, 0.4, 0] },
            { pos: [-1.2, 0, 1.2], rot: [0, -0.4, 0] },
            { pos: [1.2, 0, -1.2], rot: [0, 2.7, 0] },
            { pos: [-1.2, 0, -1.2], rot: [0, -2.7, 0] }
        ];

        corners.forEach((c, i) => {
            const pivot = new THREE.Group();
            // Start folded (close to body)
            pivot.position.set(c.pos[0] * 0.1, 0, c.pos[2] * 0.1);
            
            // Arm Beam
            const beam = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.3), matBlack);
            beam.position.x = c.pos[0] > 0 ? 0.9 : -0.9;
            
            // Yellow stripe on beam
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.05, 0.32), matYellow);
            stripe.position.y = 0.06;
            beam.add(stripe);

            // Motor Ring (The black circular guard)
            const ringGeo = new THREE.TorusGeometry(0.6, 0.08, 8, 24);
            const ring = new THREE.Mesh(ringGeo, matBlack);
            ring.rotation.x = Math.PI/2;
            ring.position.x = c.pos[0] > 0 ? 1.8 : -1.8;
            beam.add(ring);
            
            // Motor hub
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3), matGray);
            hub.position.copy(ring.position);
            beam.add(hub);

            // Propellers (Yellow/Black tipped)
            const propGroup = new THREE.Group();
            const blade1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.01, 0.15), matYellow);
            const tip1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.16), matBlack);
            tip1.position.x = 0.45;
            blade1.add(tip1);
            
            const blade2 = blade1.clone();
            blade2.rotation.y = Math.PI;
            
            propGroup.add(blade1, blade2);
            propGroup.position.copy(hub.position);
            propGroup.position.y += 0.2;
            beam.add(propGroup);

            pivot.add(beam);
            this.droneBody.add(pivot);
            this.parts.arms.push(pivot);
            this.parts.props.push(propGroup);
        });

        // CAMERA GIMBAL
        this.parts.camera = new THREE.Group();
        const gimbalBase = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4), matGray);
        const camHousing = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), matBlack);
        camHousing.position.y = -0.3;
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05), matAccent);
        lens.rotation.x = Math.PI/2;
        lens.position.z = 0.2;
        camHousing.add(lens);
        this.parts.camera.add(gimbalBase, camHousing);
        this.parts.camera.position.set(0, -0.3, 1.3);
        this.droneBody.add(this.parts.camera);

        this.drone.add(this.droneBody);
        this.drone.scale.set(0.4, 0.4, 0.4);
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

        // PHASE 1: Hero & Unfolding
        masterTl.to(this.drone.scale, { x: 1, y: 1, z: 1, duration: 2 }, 0);
        masterTl.to(this.drone.rotation, { x: 0.3, duration: 2 }, 0);

        this.parts.arms.forEach((arm, i) => {
            masterTl.to(arm.position, { 
                x: 0, 
                z: 0, 
                duration: 2,
                ease: "power2.out"
            }, 0.5);
            masterTl.to(arm.rotation, { 
                y: i < 2 ? 0.3 : -0.3, 
                duration: 2 
            }, 0.5);
        });

        // PHASE 2: Propulsion Start
        masterTl.to(this.parts.props, { 
            rotationY: Math.PI * 60, 
            ease: "none", 
            duration: 8 
        }, 1.5);
        masterTl.to(this.drone.position, { y: 2, duration: 3 }, 1.5);

        // PHASE 3: Camera & AI Detail
        masterTl.to(this.camera.position, { x: 2, y: 1, z: 4, duration: 2 }, 3);
        masterTl.to(this.parts.camera.rotation, { x: 0.5, y: -0.2, duration: 2 }, 3);

        // PHASE 4: X-Ray Brain
        masterTl.to(this.droneBody.children[0].material, { opacity: 0.1, transparent: true, duration: 1.5 }, 4.5);
        masterTl.to(this.parts.aiChip.scale, { x: 1, y: 1, z: 1, duration: 1.5 }, 4.5);

        // PHASE 5: Weather & Stabilization
        masterTl.to(this.droneBody.children[0].material, { opacity: 1, transparent: false, duration: 1 }, 6);
        masterTl.to(this.particles.material, { opacity: 1, duration: 1 }, 7);
        masterTl.to(this.drone.rotation, { 
            z: 0.15, 
            x: -0.1, 
            duration: 1, 
            repeat: 2, 
            yoyo: true 
        }, 7);

        // Final Positioning
        masterTl.to(this.camera.position, { x: 0, y: 2, z: 7, duration: 2 }, 9);

        // HUD Progress
        ScrollTrigger.create({
            trigger: ".content",
            onUpdate: (self) => {
                const alt = Math.floor(self.progress * 800);
                this.hudAltitude.innerText = `${alt.toString().padStart(3, '0')}ft`;
            }
        });

        // Section Text Activation
        document.querySelectorAll('section').forEach(sec => {
            const reveal = sec.querySelector('.text-reveal');
            ScrollTrigger.create({
                trigger: sec,
                start: "top 70%",
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
            // Hover bobbing
            this.drone.position.y += Math.sin(time * 2) * 0.003;
            // Constant rotation for flavor
            this.drone.rotation.y += 0.0005;
        }

        if(this.particles && this.particles.material.opacity > 0) {
            const positions = this.particles.geometry.attributes.position.array;
            for(let i = 0; i < positions.length; i += 3) {
                positions[i+1] -= 0.15; // Vertical drop
                positions[i] -= 0.05;  // Slight wind tilt
                if(positions[i+1] < -10) positions[i+1] = 10;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new AerofoldApp();
