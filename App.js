
/**
 * AEROFOLD™ - INDUSTRIAL REPLICA
 * Advanced Storytelling Engine (v2.0)
 * Logic for Unfolding, Takeoff, Exploded View, and Landing.
 */

class AerofoldApp {
    constructor() {
        this.canvas = document.querySelector('#webgl');
        this.loaderProgress = document.querySelector('#loader-progress');
        this.loader = document.querySelector('#loader');
        this.hudAltitude = document.querySelector('#hud-altitude');
        
        this.scene = new THREE.Scene();
        this.drone = null;
        this.parts = { 
            arms: [], 
            props: [], 
            gear: null, 
            aiChip: null, 
            camera: null, 
            chassisPlates: [] 
        };
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
        this.setupTextObserver();
        this.animate();
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 4, 15);
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
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
    }

    setupLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
        keyLight.position.set(10, 20, 10);
        this.scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
        rimLight.position.set(-10, 5, -5);
        this.scene.add(rimLight);

        const accentBlue = new THREE.PointLight(0x007AFF, 3, 25);
        accentBlue.position.set(-8, 3, -10);
        this.scene.add(accentBlue);
    }

    setupEnvironment() {
        const geo = new THREE.BufferGeometry();
        const count = 3000;
        const pos = new Float32Array(count * 3);
        for(let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 50;
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ color: 0x0066FF, size: 0.025, transparent: true, opacity: 0 });
        this.particles = new THREE.Points(geo, mat);
        this.scene.add(this.particles);
    }

    async loadAssets() {
        this.createIndustrialDrone();
        return new Promise(res => {
            let p = 0;
            const int = setInterval(() => {
                p += 4;
                if(this.loaderProgress) this.loaderProgress.style.width = `${p}%`;
                if(p >= 100) {
                    clearInterval(int);
                    gsap.to(this.loader, { opacity: 0, duration: 1, onComplete: () => this.loader.style.display = 'none' });
                    res();
                }
            }, 30);
        });
    }

    createIndustrialDrone() {
        this.drone = new THREE.Group();
        this.droneBody = new THREE.Group();

        const matYellow = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.2, roughness: 0.5 });
        const matBlack = new THREE.MeshStandardMaterial({ color: 0x0A0A0A, metalness: 0.5, roughness: 0.3 });
        const matGray = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 });
        const matGlowBlue = new THREE.MeshStandardMaterial({ color: 0x007AFF, emissive: 0x007AFF, emissiveIntensity: 5 });

        // CHASSIS PLATES (for Exploded View)
        const mainHull = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 2.6), matBlack);
        this.parts.chassisPlates.push(mainHull);

        const topPlate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 2.4), matYellow);
        topPlate.position.y = 0.25;
        this.parts.chassisPlates.push(topPlate);

        const bottomPlate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 2.4), matGray);
        bottomPlate.position.y = -0.25;
        this.parts.chassisPlates.push(bottomPlate);

        const nose = new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, 0.6), matYellow);
        nose.position.set(0, -0.1, 1.5);
        this.parts.chassisPlates.push(nose);

        this.droneBody.add(mainHull, topPlate, bottomPlate, nose);

        // INTERNAL AI CHIP
        this.parts.aiChip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), matGlowBlue);
        this.parts.aiChip.position.y = 0;
        this.parts.aiChip.scale.set(0,0,0);
        this.droneBody.add(this.parts.aiChip);

        // ARMS
        const armConfigs = [
            { pos: [1.8, 0, 1.2], rot: 0.4 },
            { pos: [-1.8, 0, 1.2], rot: -0.4 },
            { pos: [1.8, 0, -1.2], rot: 2.7 },
            { pos: [-1.8, 0, -1.2], rot: -2.7 }
        ];

        armConfigs.forEach((cfg, i) => {
            const pivot = new THREE.Group();
            pivot.position.set(cfg.pos[0] * 0.1, 0, cfg.pos[2] * 0.1);
            
            const beam = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 0.3), matBlack);
            beam.position.x = cfg.pos[0] > 0 ? 0.9 : -0.9;
            
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.08, 12, 32), matBlack);
            ring.rotation.x = Math.PI / 2;
            ring.position.x = cfg.pos[0] > 0 ? 1.8 : -1.8;
            beam.add(ring);

            const props = new THREE.Group();
            const blade = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.02, 0.1), matYellow);
            props.add(blade, blade.clone().rotateY(Math.PI/2));
            props.position.copy(ring.position);
            props.position.y = 0.2;
            beam.add(props);

            pivot.add(beam);
            this.droneBody.add(pivot);
            this.parts.arms.push(pivot);
            this.parts.props.push(props);
        });

        // CAMERA
        this.parts.camera = new THREE.Group();
        const camCore = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), matBlack);
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15), matGlowBlue);
        lens.rotation.x = Math.PI / 2;
        lens.position.z = 0.2;
        camCore.add(lens);
        this.parts.camera.add(camCore);
        this.parts.camera.position.set(0, -0.4, 1.3);
        this.droneBody.add(this.parts.camera);

        // GEAR
        this.parts.gear = new THREE.Group();
        const createLeg = (x, z) => {
            const g = new THREE.Group();
            const s = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.06), matBlack);
            s.position.y = -0.35;
            g.add(s);
            g.position.set(x, -0.2, z);
            return g;
        };
        this.parts.gear.add(createLeg(-0.5, 0.8), createLeg(0.5, 0.8), createLeg(-0.5, -0.8), createLeg(0.5, -0.8));
        this.parts.gear.scale.y = 0;
        this.droneBody.add(this.parts.gear);

        this.drone.add(this.droneBody);
        this.drone.scale.set(0.3, 0.3, 0.3);
        this.scene.add(this.drone);
    }

    setupTimelines() {
        gsap.registerPlugin(ScrollTrigger);
        const mainTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".content",
                start: "top top",
                end: "bottom bottom",
                scrub: 1.2
            }
        });

        // 1. HERO TO PHILOSOPHY (Scale and subtle rot)
        mainTl.to(this.drone.scale, { x: 1, y: 1, z: 1, duration: 2 }, 0);
        mainTl.to(this.drone.rotation, { x: 0.1, y: 0.3, duration: 2 }, 0);

        // 2. ARMS UNLOCK (Kinetic)
        this.parts.arms.forEach((arm, i) => {
            mainTl.to(arm.position, { x: 0, z: 0, duration: 2 }, 1.5);
            mainTl.to(arm.rotation, { y: i < 2 ? 0.3 : -0.3, duration: 2 }, 1.5);
        });

        // 3. PROPULSION ACTIVATION
        mainTl.to(this.parts.props, { rotationY: Math.PI * 180, ease: "none", duration: 10 }, 3);
        mainTl.to(this.drone.position, { y: 1, duration: 3 }, 3.5);

        // 4. VISION CORE DEPLOY
        mainTl.to(this.camera.position, { x: 0, y: -0.2, z: 5, duration: 4 }, 5);
        mainTl.to(this.parts.camera.position, { z: 1.7, duration: 2 }, 6);

        // 5. EXPLODED VIEW (Internal Architecture)
        // Move plates apart
        mainTl.to(this.parts.chassisPlates[1].position, { y: 1.2, duration: 3 }, 8); // Top plate up
        mainTl.to(this.parts.chassisPlates[2].position, { y: -1.2, duration: 3 }, 8); // Bottom plate down
        mainTl.to(this.parts.chassisPlates[3].position, { z: 2.5, duration: 3 }, 8); // Nose forward
        mainTl.to(this.parts.aiChip.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 2 }, 8.5);
        mainTl.to(this.camera.position, { x: 4, y: 1.5, z: 7, duration: 4 }, 8);

        // 6. RE-ASSEMBLE
        mainTl.to(this.parts.chassisPlates[1].position, { y: 0.25, duration: 2 }, 11);
        mainTl.to(this.parts.chassisPlates[2].position, { y: -0.25, duration: 2 }, 11);
        mainTl.to(this.parts.chassisPlates[3].position, { z: 1.5, duration: 2 }, 11);
        mainTl.to(this.parts.aiChip.scale, { x: 0, y: 0, z: 0, duration: 1 }, 11);

        // 7. RELIABILITY / WEATHER (Shaking / Particles)
        mainTl.to(this.particles.material, { opacity: 0.8, duration: 2 }, 13);
        mainTl.to(this.drone.rotation, { z: 0.1, repeat: 5, yoyo: true, duration: 0.2 }, 13.5);

        // 8. FINAL CTA (Landing Sequence)
        mainTl.to(this.parts.gear.scale, { y: 1, duration: 2 }, 15);
        mainTl.to(this.drone.position, { y: -0.5, duration: 3 }, 15);
        mainTl.to(this.camera.position, { x: -7, y: 3, z: 9, duration: 5 }, 15);
        mainTl.to(this.drone.rotation, { y: Math.PI * 2.3, duration: 6 }, 15);

        ScrollTrigger.create({
            trigger: ".content",
            onUpdate: (self) => {
                const altitude = Math.floor(self.progress * 1500);
                if(this.hudAltitude) this.hudAltitude.innerText = `${altitude.toString().padStart(4, '0')}ft`;
            }
        });
    }

    setupTextObserver() {
        const sections = document.querySelectorAll('.text-reveal');
        const observerOptions = { threshold: 0.4 };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) entry.target.classList.add('active');
                else entry.target.classList.remove('active');
            });
        }, observerOptions);
        sections.forEach(s => observer.observe(s));
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
            this.drone.position.y += Math.sin(time * 1.1) * 0.003;
            this.parts.aiChip.material.emissiveIntensity = 4 + Math.sin(time * 10) * 3;
            
            const lens = this.parts.camera.children[0].children[1];
            if(lens) lens.material.emissiveIntensity = 3 + Math.sin(time * 6) * 2;
        }

        if(this.particles && this.particles.material.opacity > 0) {
            const positions = this.particles.geometry.attributes.position.array;
            for(let i = 1; i < positions.length; i += 3) {
                positions[i] -= 0.12;
                if(positions[i] < -25) positions[i] = 25;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new AerofoldApp();
