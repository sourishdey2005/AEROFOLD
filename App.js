
/**
 * AEROFOLD™ - INDUSTRIAL REPLICA (v3.8)
 * Fix: Component Visibility for Materials/Safety via macro-zoom.
 * New: Compliance, OTA, AI Pipeline, and Reliability visual sequences.
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
            chassisPlates: [],
            batteryCells: []
        };
        this.otaRing = null;
        this.dataParticles = null;
        this.glowMaterial = null;
        
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
        this.onResize(); 
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 12);
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
        this.renderer.toneMappingExposure = 1.3;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
    }

    setupLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
        keyLight.position.set(10, 20, 10);
        this.scene.add(keyLight);
        const rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
        rimLight.position.set(-10, 5, -5);
        this.scene.add(rimLight);
    }

    setupEnvironment() {
        // Data Rain / Particles
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(3000 * 3);
        for(let i = 0; i < 9000; i++) pos[i] = (Math.random() - 0.5) * 80;
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ color: 0x0066FF, size: 0.04, transparent: true, opacity: 0 });
        this.dataParticles = new THREE.Points(geo, mat);
        this.scene.add(this.dataParticles);

        // OTA Pulse Ring
        const ringGeo = new THREE.TorusGeometry(1.5, 0.015, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x0066FF, transparent: true, opacity: 0 });
        this.otaRing = new THREE.Mesh(ringGeo, ringMat);
        this.otaRing.rotation.x = Math.PI / 2;
        this.scene.add(this.otaRing);
    }

    async loadAssets() {
        this.createIndustrialDrone();
        return new Promise(res => {
            let p = 0;
            const int = setInterval(() => {
                p += 5;
                if(this.loaderProgress) this.loaderProgress.style.width = `${p}%`;
                if(p >= 100) {
                    clearInterval(int);
                    gsap.to(this.loader, { opacity: 0, duration: 1, onComplete: () => this.loader.style.display = 'none' });
                    res();
                }
            }, 20);
        });
    }

    createIndustrialDrone() {
        this.drone = new THREE.Group();
        const matYellow = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.4, roughness: 0.3 });
        const matBlack = new THREE.MeshStandardMaterial({ color: 0x0A0A0A, metalness: 0.8, roughness: 0.1 });
        const matGlowBlue = new THREE.MeshStandardMaterial({ color: 0x007AFF, emissive: 0x007AFF, emissiveIntensity: 5 });

        // Chassis
        const hull = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 2.6), matBlack);
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 2.4), matYellow);
        top.position.y = 0.25;
        this.parts.chassisPlates.push(hull, top);
        this.drone.add(hull, top);

        // Arms
        const armConfigs = [[1.2, 1.2], [-1.2, 1.2], [1.2, -1.2], [-1.2, -1.2]];
        armConfigs.forEach((cfg, i) => {
            const pivot = new THREE.Group();
            pivot.position.set(cfg[0]*0.1, 0, cfg[1]*0.1);
            const beam = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.3), matBlack);
            beam.position.x = cfg[0] > 0 ? 0.9 : -0.9;
            pivot.add(beam);
            
            const props = new THREE.Group();
            const blade = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.1), matYellow);
            props.add(blade, blade.clone().rotateY(Math.PI/2));
            props.position.set(cfg[0] > 0 ? 1.8 : -1.8, 0.1, 0);
            beam.add(props);
            
            this.drone.add(pivot);
            this.parts.arms.push(pivot);
            this.parts.props.push(props);
        });

        // Hidden AI Chip
        this.parts.aiChip = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.4), matGlowBlue);
        this.parts.aiChip.position.y = 0.35;
        this.parts.aiChip.visible = false;
        this.drone.add(this.parts.aiChip);

        this.drone.scale.set(0.1, 0.1, 0.1);
        this.scene.add(this.drone);
    }

    setupTimelines() {
        gsap.registerPlugin(ScrollTrigger);
        const mainTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".content",
                start: "top top",
                end: "bottom bottom",
                scrub: 1.5
            }
        });

        // 1. INTRO (0-10%)
        mainTl.to(this.drone.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 2 }, 0);
        this.parts.arms.forEach((arm, i) => {
            mainTl.to(arm.position, { x: 0, z: 0, duration: 2 }, 1);
            mainTl.to(arm.rotation, { y: i < 2 ? 0.4 : -0.4, duration: 2 }, 1);
        });

        // 2. MATERIALS & MACRO ZOOM (10-25%) - FIX: High Detail Angle
        mainTl.to(this.camera.position, { x: 0.8, y: 0.6, z: 1.8, duration: 4 }, 3);
        mainTl.to(this.drone.rotation, { y: 2.8, x: 0.4, duration: 4 }, 3);
        mainTl.to(this.drone.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 4 }, 3);

        // 3. SAFETY REDUNDANCY (25-40%) - FIX: Orbit to show arms/motors
        mainTl.to(this.camera.position, { x: -4, y: 3, z: 7, duration: 4 }, 8);
        mainTl.to(this.drone.rotation, { y: -0.6, x: -0.5, duration: 4 }, 8);
        mainTl.to(this.drone.scale, { x: 0.9, y: 0.9, z: 0.9, duration: 4 }, 8);

        // 4. COMPLIANCE (40-50%)
        mainTl.to(this.camera.position, { x: 0, y: 0.5, z: 9, duration: 4 }, 13);
        mainTl.to(this.drone.rotation, { y: Math.PI * 2, x: 0, duration: 6 }, 13);

        // 5. OTA UPDATES (50-65%)
        mainTl.to(this.otaRing.material, { opacity: 0.6, duration: 1 }, 18);
        mainTl.to(this.otaRing.scale, { x: 6, y: 6, z: 6, duration: 3, ease: "power2.out" }, 18);
        mainTl.to(this.dataParticles.material, { opacity: 0.4, duration: 2 }, 18);
        mainTl.to(this.camera.position, { x: 0, y: 5, z: 10, duration: 4 }, 18);

        // 6. AI PIPELINE & EDGE AI (65-80%)
        mainTl.to(this.otaRing.material, { opacity: 0, duration: 1 }, 22);
        mainTl.to(this.parts.chassisPlates[1].position, { y: 1.2, duration: 2 }, 23); // Open lid
        mainTl.set(this.parts.aiChip, { visible: true }, 23);
        mainTl.to(this.parts.aiChip.scale, { x: 1.8, y: 1.8, z: 1.8, duration: 2 }, 24);
        mainTl.to(this.camera.position, { x: 1.5, y: 1.2, z: 4, duration: 4 }, 23);
        mainTl.to(this.drone.rotation, { y: 0.5, x: 0.2, duration: 4 }, 23);

        // 7. RELIABILITY & FINAL DEPLOYMENT (80-100%)
        mainTl.to(this.parts.chassisPlates[1].position, { y: 0.25, duration: 2 }, 28);
        mainTl.to(this.parts.aiChip.scale, { x: 0, y: 0, z: 0, duration: 1 }, 28);
        mainTl.to(this.camera.position, { x: -4, y: 2, z: 15, duration: 6 }, 28);
        mainTl.to(this.drone.position, { y: -2.5, duration: 6 }, 28);
        mainTl.to(this.drone.rotation, { y: Math.PI * 0.5, duration: 6 }, 28);

        ScrollTrigger.create({
            trigger: ".content",
            onUpdate: (self) => {
                const alt = Math.floor(self.progress * 4500);
                if(this.hudAltitude) this.hudAltitude.innerText = `${alt.toString().padStart(4, '0')}ft`;
            }
        });
    }

    setupTextObserver() {
        const sections = document.querySelectorAll('.text-reveal');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) entry.target.classList.add('active');
                else entry.target.classList.remove('active');
            });
        }, { threshold: 0.4 });
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
            this.drone.position.y += Math.sin(time * 2.0) * 0.003;
            this.parts.props.forEach(p => p.rotation.y += 0.8);
            if(this.parts.aiChip.visible) {
                this.parts.aiChip.material.emissiveIntensity = 4 + Math.sin(time * 8) * 4;
            }
        }

        if(this.otaRing && this.otaRing.material.opacity > 0) {
            this.otaRing.position.copy(this.drone.position);
            // Pulse logic integrated with timeline
        }

        if(this.dataParticles && this.dataParticles.material.opacity > 0) {
            const attr = this.dataParticles.geometry.attributes.position;
            for(let i = 0; i < attr.count; i++) {
                attr.array[i*3 + 1] -= 0.12;
                if(attr.array[i*3 + 1] < -40) attr.array[i*3 + 1] = 40;
            }
            attr.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new AerofoldApp();
