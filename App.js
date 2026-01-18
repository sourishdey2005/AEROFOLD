
/**
 * AEROFOLD™ ULTRA SCENE CONTROLLER
 * High-end industrial drone simulation with "Hazard" livery and "Electric Blue" accents.
 */

class AerofoldApp {
    constructor() {
        this.canvas = document.querySelector('#webgl');
        this.loaderProgress = document.querySelector('#loader-progress');
        this.loader = document.querySelector('#loader');
        this.hudAltitude = document.querySelector('#hud-altitude');
        
        this.scene = new THREE.Scene();
        this.drone = null;
        this.parts = { arms: [], props: [], sensorGlows: [] };
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
        this.camera.position.set(0, 5, 12);
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
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambient);

        // Warm key light for yellow contrast
        this.keyLight = new THREE.DirectionalLight(0xffffff, 2);
        this.keyLight.position.set(5, 10, 7);
        this.scene.add(this.keyLight);

        // Electric blue rim light
        const rimLight = new THREE.SpotLight(0x007AFF, 4);
        rimLight.position.set(-10, 5, -5);
        rimLight.angle = 0.5;
        this.scene.add(rimLight);
        
        const topLight = new THREE.PointLight(0xffffff, 1);
        topLight.position.set(0, 5, 0);
        this.scene.add(topLight);
    }

    setupEnvironment() {
        const geo = new THREE.BufferGeometry();
        const count = 4000;
        const pos = new Float32Array(count * 3);
        for(let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 30;
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ color: 0x007AFF, size: 0.015, transparent: true, opacity: 0 });
        this.particles = new THREE.Points(geo, mat);
        this.scene.add(this.particles);
    }

    async loadAssets() {
        this.createUltraDrone();
        
        return new Promise((resolve) => {
            let p = 0;
            const interval = setInterval(() => {
                p += 5;
                this.loaderProgress.style.width = `${p}%`;
                if (p >= 100) {
                    clearInterval(interval);
                    gsap.to(this.loader, { opacity: 0, duration: 1, delay: 0.5, onComplete: () => this.loader.style.display = 'none' });
                    resolve();
                }
            }, 30);
        });
    }

    createUltraDrone() {
        this.drone = new THREE.Group();
        this.droneBody = new THREE.Group();
        
        // Premium Materials
        const matYellow = new THREE.MeshStandardMaterial({ 
            color: 0xffcc00, 
            metalness: 0.4, 
            roughness: 0.3,
            bumpScale: 0.02
        });
        const matCarbon = new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            metalness: 0.9, 
            roughness: 0.1,
            envMapIntensity: 1 
        });
        const matSteel = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 1, roughness: 0.2 });
        const matElectricBlue = new THREE.MeshStandardMaterial({ 
            color: 0x007AFF, 
            emissive: 0x007AFF, 
            emissiveIntensity: 3 
        });
        
        // Updated Thruster Material to use Electric Blue Glow per request
        const matThrusterGlow = new THREE.MeshStandardMaterial({ 
            color: 0x007AFF, 
            emissive: 0x007AFF, 
            emissiveIntensity: 8 
        });

        // MAIN CHASSIS - Multi-layered geometry
        const coreBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 2.8), matCarbon);
        
        // Hazard Top Shell
        const shell = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 1.8), matYellow);
        shell.position.set(0, 0.3, 0);
        
        // Industrial vents
        for(let i = -0.5; i <= 0.5; i += 0.25) {
            const vent = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.1), matSteel);
            vent.position.set(0, 0.4, i - 0.2);
            coreBase.add(vent);
        }

        // Electric Blue internal glow (Heart/AI Chip)
        const heart = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), matElectricBlue);
        heart.scale.set(0,0,0);
        this.parts.aiChip = heart;
        coreBase.add(heart);

        // Thrusters (Updated with Electric Blue emissive properties)
        const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.4), matThrusterGlow);
        thrusterL.rotation.x = Math.PI/2;
        thrusterL.position.set(-0.35, -0.1, -1.4);
        const thrusterR = thrusterL.clone();
        thrusterR.position.x = 0.35;
        coreBase.add(thrusterL, thrusterR);

        this.droneBody.add(coreBase, shell);

        // FOLDING ARMS
        const corners = [
            { pos: [1.5, 0, 1.3], angle: 0.45 },
            { pos: [-1.5, 0, 1.3], angle: -0.45 },
            { pos: [1.5, 0, -1.3], angle: 2.7 },
            { pos: [-1.5, 0, -1.3], angle: -2.7 }
        ];

        corners.forEach((c, i) => {
            const pivot = new THREE.Group();
            pivot.position.set(c.pos[0] * 0.1, 0, c.pos[2] * 0.1); // Folded start
            
            // Carbon Fiber Arm with Yellow Stripe
            const arm = new THREE.Mesh(new THREE.BoxGeometry(2, 0.18, 0.35), matCarbon);
            arm.position.x = c.pos[0] > 0 ? 1 : -1;
            
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.06, 0.37), matYellow);
            stripe.position.y = 0.08;
            arm.add(stripe);

            // Motor Housing & Rings
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.07, 12, 32), matCarbon);
            ring.rotation.x = Math.PI/2;
            ring.position.x = c.pos[0] > 0 ? 2 : -2;
            arm.add(ring);

            // Motor Node with Blue Glow
            const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.35), matSteel);
            motor.position.copy(ring.position);
            const statusLight = new THREE.Mesh(new THREE.SphereGeometry(0.05), matElectricBlue);
            statusLight.position.set(0, 0.2, 0);
            motor.add(statusLight);
            arm.add(motor);

            // Propellers
            const props = new THREE.Group();
            const blade = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.01, 0.12), matCarbon);
            const yellowTip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.015, 0.13), matYellow);
            yellowTip.position.x = 0.5;
            blade.add(yellowTip);
            const bladeOpposite = blade.clone();
            bladeOpposite.rotation.y = Math.PI;
            props.add(blade, bladeOpposite);
            props.position.copy(motor.position);
            props.position.y = 0.25;
            arm.add(props);

            pivot.add(arm);
            this.droneBody.add(pivot);
            this.parts.arms.push(pivot);
            this.parts.props.push(props);
        });

        // SENSOR ARRAY (Updated Camera Lens with subtle Electric Blue glow)
        this.parts.camera = new THREE.Group();
        const gimbalJoint = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), matSteel);
        const camBox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.5), matCarbon);
        camBox.position.y = -0.35;
        
        // Glowing Camera Lens
        const lensCore = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08), matElectricBlue);
        lensCore.rotation.x = Math.PI/2;
        lensCore.position.z = 0.25;
        camBox.add(lensCore);
        
        // LiDAR array below gimbal
        const lidar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), matElectricBlue);
        lidar.position.y = -0.6;
        this.parts.camera.add(gimbalJoint, camBox, lidar);
        this.parts.camera.position.set(0, -0.4, 1.4);
        this.droneBody.add(this.parts.camera);

        // LANDING GEAR
        this.parts.gear = new THREE.Group();
        const gearGeo = new THREE.BoxGeometry(0.05, 0.6, 1.2);
        const gearL = new THREE.Mesh(gearGeo, matCarbon);
        gearL.position.set(-0.6, -0.6, 0);
        const gearR = gearL.clone();
        gearR.position.x = 0.6;
        
        const padL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 1.3), matElectricBlue);
        padL.position.y = -0.3;
        gearL.add(padL);
        const padR = padL.clone();
        gearR.add(padR);
        
        this.parts.gear.add(gearL, gearR);
        this.droneBody.add(this.parts.gear);

        this.drone.add(this.droneBody);
        this.drone.scale.set(0.3, 0.3, 0.3);
        this.scene.add(this.drone);
    }

    setupTimelines() {
        gsap.registerPlugin(ScrollTrigger);

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".content",
                start: "top top",
                end: "bottom bottom",
                scrub: 2,
            }
        });

        // Phase 1: Global Reveal & Unfolding
        tl.to(this.drone.scale, { x: 1, y: 1, z: 1, duration: 2 }, 0);
        tl.to(this.drone.rotation, { x: 0.2, y: -0.2, duration: 2 }, 0);
        
        this.parts.arms.forEach((arm, i) => {
            tl.to(arm.position, { x: 0, z: 0, duration: 2 }, 0.5);
            tl.to(arm.rotation, { y: i < 2 ? 0.4 : -0.4, duration: 2 }, 0.5);
        });

        // Phase 2: Landing Gear & Propulsion
        tl.to(this.parts.gear.position, { y: -0.2, duration: 1 }, 1.5);
        tl.to(this.parts.props, { rotationY: Math.PI * 80, ease: "none", duration: 10 }, 1.5);
        tl.to(this.drone.position, { y: 2, duration: 3 }, 2);

        // Phase 3: Vision Deep Dive
        tl.to(this.camera.position, { x: -3, y: 0.5, z: 5, duration: 2 }, 4);
        tl.to(this.parts.camera.rotation, { x: 0.4, y: 0.3, duration: 2 }, 4);

        // Phase 4: AI & Internal X-Ray
        tl.to(this.droneBody.children[0].material, { opacity: 0.1, transparent: true, duration: 1 }, 5.5);
        tl.to(this.parts.aiChip.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 1.5 }, 5.5);
        tl.to(this.parts.aiChip.rotation, { y: Math.PI * 4, duration: 2 }, 5.5);

        // Phase 5: Weather Combat
        tl.to(this.droneBody.children[0].material, { opacity: 1, transparent: false, duration: 1 }, 7);
        tl.to(this.particles.material, { opacity: 0.9, duration: 1 }, 7);
        tl.to(this.drone.rotation, { z: 0.2, x: -0.1, duration: 1, repeat: 2, yoyo: true }, 7.5);

        // Final Hero Pose
        tl.to(this.camera.position, { x: 0, y: 3, z: 9, duration: 2 }, 9);
        tl.to(this.drone.rotation, { x: 0, y: Math.PI * 0.2, z: 0, duration: 2 }, 9);

        // HUD Progress
        ScrollTrigger.create({
            trigger: ".content",
            onUpdate: (self) => {
                const alt = Math.floor(self.progress * 1250);
                this.hudAltitude.innerText = `${alt.toString().padStart(4, '0')}ft`;
            }
        });

        // Text reveal triggers
        document.querySelectorAll('section').forEach(sec => {
            const reveal = sec.querySelector('.text-reveal');
            ScrollTrigger.create({
                trigger: sec,
                start: "top 75%",
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
            this.drone.position.y += Math.sin(time * 2) * 0.003;
            // Pulse all Electric Blue emissive elements
            const pulse = 0.5 + Math.sin(time * 5) * 0.5;
            this.parts.aiChip.material.emissiveIntensity = 2 + pulse * 2;
            
            // Subtle flickering of the camera lens and lidar
            const lens = this.parts.camera.children[1].children[0];
            if (lens.material) lens.material.emissiveIntensity = 4 + Math.sin(time * 10) * 1.5;
            
            const lidar = this.parts.camera.children[2];
            if (lidar.material) lidar.material.emissiveIntensity = 3 + Math.cos(time * 8) * 1;
        }

        if(this.particles && this.particles.material.opacity > 0) {
            const positions = this.particles.geometry.attributes.position.array;
            for(let i = 0; i < positions.length; i += 3) {
                positions[i+1] -= 0.15; 
                positions[i] -= 0.08; 
                if(positions[i+1] < -15) positions[i+1] = 15;
                if(positions[i] < -15) positions[i] = 15;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new AerofoldApp();
