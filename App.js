
/**
 * AEROFOLD™ EXACT INDUSTRIAL REPLICA
 * Adjusted for Light Mode aesthetics.
 */

class AerofoldApp {
    constructor() {
        this.canvas = document.querySelector('#webgl');
        this.loaderProgress = document.querySelector('#loader-progress');
        this.loader = document.querySelector('#loader');
        this.hudAltitude = document.querySelector('#hud-altitude');
        
        this.scene = new THREE.Scene();
        this.drone = null;
        this.parts = { arms: [], props: [], gear: null, aiChip: null, camera: null };
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
        this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 4, 12);
        this.camera.lookAt(0, 0, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true // Critical for white background
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
    }

    setupLights() {
        // Brighter ambient for white background
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        
        const sun = new THREE.DirectionalLight(0xffffff, 1.5);
        sun.position.set(5, 10, 5);
        this.scene.add(sun);

        // Fill light for shadows
        const fill = new THREE.DirectionalLight(0xffffff, 0.5);
        fill.position.set(-5, 5, 2);
        this.scene.add(fill);

        const blueRim = new THREE.PointLight(0x007AFF, 2.5, 20);
        blueRim.position.set(-5, 2, -5);
        this.scene.add(blueRim);
    }

    setupEnvironment() {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(2000 * 3);
        for(let i = 0; i < 2000 * 3; i++) pos[i] = (Math.random() - 0.5) * 40;
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        // Using a slightly more saturated blue for particles on white
        const mat = new THREE.PointsMaterial({ color: 0x0055BB, size: 0.03, transparent: true, opacity: 0 });
        this.particles = new THREE.Points(geo, mat);
        this.scene.add(this.particles);
    }

    async loadAssets() {
        this.createExactDrone();
        return new Promise(res => {
            let p = 0;
            const int = setInterval(() => {
                p += 5;
                this.loaderProgress.style.width = `${p}%`;
                if(p >= 100) {
                    clearInterval(int);
                    gsap.to(this.loader, { opacity: 0, duration: 0.8, onComplete: () => this.loader.style.display = 'none' });
                    res();
                }
            }, 20);
        });
    }

    createExactDrone() {
        this.drone = new THREE.Group();
        this.droneBody = new THREE.Group();

        // Exact Palette - slightly adjusted for white background
        const matYellow = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.1, roughness: 0.6 });
        const matBlack = new THREE.MeshStandardMaterial({ color: 0x0A0A0A, metalness: 0.4, roughness: 0.3 });
        const matGray = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.4 });
        const matRed = new THREE.MeshStandardMaterial({ color: 0xEE0000, emissive: 0xEE0000, emissiveIntensity: 1 });
        const matElectricBlue = new THREE.MeshStandardMaterial({ color: 0x007AFF, emissive: 0x007AFF, emissiveIntensity: 4 });

        // CHASSIS - Angular industrial blocky
        const chassisBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 2.4), matBlack);
        
        // Hazard plates on sides
        const sidePlateL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 2), matYellow);
        sidePlateL.position.set(-0.6, 0, 0);
        const sidePlateR = sidePlateL.clone();
        sidePlateR.position.x = 0.6;
        chassisBase.add(sidePlateL, sidePlateR);

        // Sloped front
        const nose = new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, 0.6), matYellow);
        nose.position.set(0, -0.1, 1.4);
        chassisBase.add(nose);

        // TOP MOUNTED RAIL
        const railSystem = new THREE.Group();
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.4), matGray);
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0, 0.6, -0.2);
        
        const railSupports = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.4), matYellow);
        railSupports.position.y = 0.4;
        railSystem.add(bar, railSupports);
        chassisBase.add(railSystem);

        // REAR EXHAUSTS
        const exhaustL = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3), matRed);
        exhaustL.rotation.x = Math.PI / 2;
        exhaustL.position.set(-0.3, 0, -1.3);
        const exhaustR = exhaustL.clone();
        exhaustR.position.x = 0.3;
        chassisBase.add(exhaustL, exhaustR);

        // LANDING GEAR
        this.parts.gear = new THREE.Group();
        const legGeo = new THREE.BoxGeometry(0.08, 0.6, 0.08);
        const footGeo = new THREE.BoxGeometry(0.15, 0.04, 0.3);
        
        const createLeg = (x, z) => {
            const leg = new THREE.Group();
            const strut = new THREE.Mesh(legGeo, matBlack);
            strut.position.y = -0.3;
            const foot = new THREE.Mesh(footGeo, matGray);
            foot.position.y = -0.6;
            leg.add(strut, foot);
            leg.position.set(x, -0.2, z);
            return leg;
        };

        this.parts.gear.add(createLeg(-0.4, 0.6), createLeg(0.4, 0.6), createLeg(-0.4, -0.6), createLeg(0.4, -0.6));
        this.parts.gear.scale.y = 0; 
        chassisBase.add(this.parts.gear);

        // AI Chip
        const chip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), matElectricBlue);
        chip.scale.set(0,0,0);
        this.parts.aiChip = chip;
        chassisBase.add(chip);

        this.droneBody.add(chassisBase);

        // ARMS
        const armConfigs = [
            { pos: [1.6, 0, 1.2], rot: 0.5 },
            { pos: [-1.6, 0, 1.2], rot: -0.5 },
            { pos: [1.6, 0, -1.2], rot: 2.6 },
            { pos: [-1.6, 0, -1.2], rot: -2.6 }
        ];

        armConfigs.forEach((cfg, i) => {
            const pivot = new THREE.Group();
            pivot.position.set(cfg.pos[0] * 0.1, 0, cfg.pos[2] * 0.1);

            const armBeam = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.35), matBlack);
            armBeam.position.x = cfg.pos[0] > 0 ? 0.9 : -0.9;
            
            const decal = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.05, 0.37), matYellow);
            decal.position.y = 0.11;
            armBeam.add(decal);

            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.08, 8, 32), matBlack);
            ring.rotation.x = Math.PI / 2;
            ring.position.x = cfg.pos[0] > 0 ? 1.8 : -1.8;
            armBeam.add(ring);

            const props = new THREE.Group();
            const bladeGeo = new THREE.BoxGeometry(1.2, 0.02, 0.12);
            const blade1 = new THREE.Mesh(bladeGeo, matYellow);
            for(let s = -0.4; s <= 0.4; s += 0.3) {
                const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.025, 0.13), matBlack);
                stripe.position.x = s;
                blade1.add(stripe);
            }
            const blade2 = blade1.clone();
            blade2.rotation.y = Math.PI;
            props.add(blade1, blade2);
            props.position.copy(ring.position);
            props.position.y = 0.25;
            armBeam.add(props);

            pivot.add(armBeam);
            this.droneBody.add(pivot);
            this.parts.arms.push(pivot);
            this.parts.props.push(props);
        });

        // CAMERA
        this.parts.camera = new THREE.Group();
        const sensorCore = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), matBlack);
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1), matElectricBlue);
        lens.rotation.x = Math.PI / 2;
        lens.position.z = 0.2;
        sensorCore.add(lens);
        this.parts.camera.add(sensorCore);
        this.parts.camera.position.set(0, -0.4, 1.2);
        this.droneBody.add(this.parts.camera);

        this.drone.add(this.droneBody);
        this.drone.scale.set(0.2, 0.2, 0.2);
        this.scene.add(this.drone);
    }

    setupTimelines() {
        gsap.registerPlugin(ScrollTrigger);
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".content",
                start: "top top",
                end: "bottom bottom",
                scrub: 1.5
            }
        });

        tl.to(this.drone.scale, { x: 1, y: 1, z: 1, duration: 2 }, 0);
        tl.to(this.drone.rotation, { x: 0.2, y: 0.3, duration: 2 }, 0);
        
        this.parts.arms.forEach((arm, i) => {
            tl.to(arm.position, { x: 0, z: 0, duration: 2 }, 0.5);
            tl.to(arm.rotation, { y: i < 2 ? 0.4 : -0.4, duration: 2 }, 0.5);
        });

        tl.to(this.parts.props, { rotationY: Math.PI * 80, ease: "none", duration: 10 }, 1.5);
        tl.to(this.drone.position, { y: 0.5, duration: 2 }, 2);

        tl.to(this.camera.position, { x: -3, y: 1, z: 6, duration: 3 }, 3.5);
        tl.to(this.drone.rotation, { y: -0.6, duration: 3 }, 3.5);

        tl.to(this.camera.position, { x: 3, y: 2, z: 5, duration: 3 }, 5.5);
        tl.to(this.droneBody.children[0].material, { opacity: 0.2, transparent: true, duration: 1 }, 6);
        tl.to(this.parts.aiChip.scale, { x: 1, y: 1, z: 1, duration: 1.5 }, 6);

        tl.to(this.droneBody.children[0].material, { opacity: 1, transparent: false, duration: 1 }, 7.5);
        tl.to(this.camera.position, { x: 0, y: 3, z: 10, duration: 3 }, 7.5);
        tl.to(this.particles.material, { opacity: 0.6, duration: 1 }, 8);
        tl.to(this.drone.rotation, { z: 0.15, duration: 1, repeat: 3, yoyo: true }, 8.5);

        tl.to(this.parts.gear.scale, { y: 1, duration: 2 }, 9);
        
        tl.to(this.camera.position, { x: 0, y: 5, z: 8, duration: 3 }, 10);
        tl.to(this.drone.rotation, { x: -0.4, y: Math.PI * 2, duration: 4 }, 10);

        ScrollTrigger.create({
            trigger: ".content",
            onUpdate: (self) => {
                this.hudAltitude.innerText = `${Math.floor(self.progress * 1200).toString().padStart(4, '0')}ft`;
            }
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
            this.drone.position.y += Math.sin(time * 1.5) * 0.002;
            const pulse = 2 + Math.sin(time * 5) * 2;
            this.parts.aiChip.material.emissiveIntensity = pulse;
            
            const lens = this.parts.camera.children[0].children[1];
            if(lens) lens.material.emissiveIntensity = 4 + Math.sin(time * 10) * 2;
        }

        if(this.particles && this.particles.material.opacity > 0) {
            const positions = this.particles.geometry.attributes.position.array;
            for(let i = 1; i < positions.length; i += 3) {
                positions[i] -= 0.15;
                if(positions[i] < -20) positions[i] = 20;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new AerofoldApp();
