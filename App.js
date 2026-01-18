
/**
 * AEROFOLD™ ULTRA SCENE CONTROLLER
 * High-end industrial drone simulation.
 * Updated: Precision centering logic to keep the model in viewport.
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
        // Positioned slightly further back to ensure full drone visibility at scale 1
        this.camera.position.set(0, 2, 10);
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

        this.keyLight = new THREE.DirectionalLight(0xffffff, 2);
        this.keyLight.position.set(5, 10, 7);
        this.scene.add(this.keyLight);

        const rimLight = new THREE.SpotLight(0x007AFF, 5);
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
        for(let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 40;
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
        
        const matYellow = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.4, roughness: 0.3 });
        const matCarbon = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });
        const matSteel = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 1, roughness: 0.2 });
        const matElectricBlue = new THREE.MeshStandardMaterial({ color: 0x007AFF, emissive: 0x007AFF, emissiveIntensity: 3 });
        const matThrusterGlow = new THREE.MeshStandardMaterial({ color: 0x007AFF, emissive: 0x007AFF, emissiveIntensity: 8 });

        const coreBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 2.8), matCarbon);
        const shell = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 1.8), matYellow);
        shell.position.set(0, 0.3, 0);
        
        const heart = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), matElectricBlue);
        heart.scale.set(0,0,0);
        this.parts.aiChip = heart;
        coreBase.add(heart);

        const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.4), matThrusterGlow);
        thrusterL.rotation.x = Math.PI/2;
        thrusterL.position.set(-0.35, -0.1, -1.4);
        const thrusterR = thrusterL.clone();
        thrusterR.position.x = 0.35;
        coreBase.add(thrusterL, thrusterR);

        this.droneBody.add(coreBase, shell);

        const corners = [
            { pos: [1.5, 0, 1.3] }, { pos: [-1.5, 0, 1.3] },
            { pos: [1.5, 0, -1.3] }, { pos: [-1.5, 0, -1.3] }
        ];

        corners.forEach((c, i) => {
            const pivot = new THREE.Group();
            pivot.position.set(c.pos[0] * 0.15, 0, c.pos[2] * 0.15);
            const arm = new THREE.Mesh(new THREE.BoxGeometry(2, 0.18, 0.35), matCarbon);
            arm.position.x = c.pos[0] > 0 ? 1 : -1;
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.06, 0.37), matYellow);
            stripe.position.y = 0.08;
            arm.add(stripe);
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.07, 12, 32), matCarbon);
            ring.rotation.x = Math.PI/2;
            ring.position.x = c.pos[0] > 0 ? 2 : -2;
            arm.add(ring);
            const props = new THREE.Group();
            const blade = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.01, 0.12), matCarbon);
            const yellowTip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.015, 0.13), matYellow);
            yellowTip.position.x = 0.5;
            blade.add(yellowTip);
            const bladeOpposite = blade.clone(); bladeOpposite.rotation.y = Math.PI;
            props.add(blade, bladeOpposite);
            props.position.copy(ring.position);
            props.position.y = 0.25;
            arm.add(props);
            pivot.add(arm);
            this.droneBody.add(pivot);
            this.parts.arms.push(pivot);
            this.parts.props.push(props);
        });

        this.parts.camera = new THREE.Group();
        const camBox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.5), matCarbon);
        const lensCore = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08), matElectricBlue);
        lensCore.rotation.x = Math.PI/2; lensCore.position.z = 0.25;
        camBox.add(lensCore);
        this.parts.camera.add(camBox);
        this.parts.camera.position.set(0, -0.4, 1.4);
        this.droneBody.add(this.parts.camera);

        this.parts.gear = new THREE.Group();
        const gearGeo = new THREE.BoxGeometry(0.05, 0.6, 1.2);
        const gearL = new THREE.Mesh(gearGeo, matCarbon); gearL.position.set(-0.6, -0.6, 0);
        const padL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 1.3), matElectricBlue);
        padL.position.y = -0.3; gearL.add(padL);
        const gearR = gearL.clone(); gearR.position.x = 0.6;
        this.parts.gear.add(gearL, gearR);
        this.droneBody.add(this.parts.gear);

        this.drone.add(this.droneBody);
        this.drone.scale.set(0.25, 0.25, 0.25); // Start small for hero
        this.scene.add(this.drone);
    }

    setupTimelines() {
        gsap.registerPlugin(ScrollTrigger);

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".content",
                start: "top top",
                end: "bottom bottom",
                scrub: 1.5,
            }
        });

        // LOCK POSITION: The drone stays at 0,0,0. We only move camera or rotate the drone.
        // Hero to Unfold
        tl.to(this.drone.scale, { x: 1, y: 1, z: 1, duration: 2 }, 0);
        tl.to(this.drone.rotation, { x: 0.3, y: 0.4, duration: 2 }, 0);
        
        this.parts.arms.forEach((arm, i) => {
            tl.to(arm.position, { x: 0, z: 0, duration: 2 }, 0.5);
            tl.to(arm.rotation, { y: i < 2 ? 0.4 : -0.4, duration: 2 }, 0.5);
        });

        // Gear & Flight
        tl.to(this.parts.gear.position, { y: -0.2, duration: 1 }, 1.5);
        tl.to(this.parts.props, { rotationY: Math.PI * 60, ease: "none", duration: 10 }, 1.5);
        // Subtle altitude gain, keeping within camera view
        tl.to(this.drone.position, { y: 0.5, duration: 2 }, 2);

        // Sectional Focus: Vision (Orbiting camera to side-front)
        tl.to(this.camera.position, { x: -4, y: 1, z: 6, duration: 3 }, 3.5);
        tl.to(this.drone.rotation, { y: -0.8, x: 0.1, duration: 3 }, 3.5);

        // Sectional Focus: AI Brain (Orbiting to other side)
        tl.to(this.camera.position, { x: 4, y: 2, z: 5, duration: 3 }, 5.5);
        tl.to(this.droneBody.children[0].material, { opacity: 0.1, transparent: true, duration: 1 }, 6);
        tl.to(this.parts.aiChip.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 1.5 }, 6);
        tl.to(this.parts.aiChip.rotation, { y: Math.PI * 4, duration: 3 }, 6);

        // Sectional Focus: Weather (Return to wide front)
        tl.to(this.droneBody.children[0].material, { opacity: 1, transparent: false, duration: 1 }, 7.5);
        tl.to(this.camera.position, { x: 0, y: 3, z: 10, duration: 3 }, 7.5);
        tl.to(this.particles.material, { opacity: 1, duration: 1 }, 8);
        tl.to(this.drone.rotation, { z: 0.2, x: -0.1, duration: 1, repeat: 3, yoyo: true }, 8.5);

        // Final Hero Pose: Looking down at the camera
        tl.to(this.camera.position, { x: 0, y: 6, z: 8, duration: 3 }, 10);
        tl.to(this.drone.rotation, { x: -0.6, y: Math.PI * 2, z: 0, duration: 4 }, 10);

        ScrollTrigger.create({
            trigger: ".content",
            onUpdate: (self) => {
                const alt = Math.floor(self.progress * 1500);
                this.hudAltitude.innerText = `${alt.toString().padStart(4, '0')}ft`;
            }
        });

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
            // Constant subtle levitation/hover
            this.drone.position.y += Math.sin(time * 1.5) * 0.002;
            this.drone.rotation.y += 0.0002;
            
            const pulse = 0.5 + Math.sin(time * 4) * 0.5;
            this.parts.aiChip.material.emissiveIntensity = 2 + pulse * 3;
            
            const lens = this.parts.camera.children[0].children[0];
            if (lens.material) lens.material.emissiveIntensity = 5 + Math.sin(time * 12) * 2;
        }

        if(this.particles && this.particles.material.opacity > 0) {
            const positions = this.particles.geometry.attributes.position.array;
            for(let i = 0; i < positions.length; i += 3) {
                positions[i+1] -= 0.2; 
                if(positions[i+1] < -15) positions[i+1] = 15;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new AerofoldApp();
