
/**
 * AEROFOLD™ - INDUSTRIAL REPLICA
 * Advanced Storytelling Engine (v3.3)
 * Features: Vision, AI, Stabilization, Battery Intelligence, Exploded Logic
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
        this.particles = null;
        this.scanner = null;
        
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
        for(let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 60;
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ color: 0x0066FF, size: 0.02, transparent: true, opacity: 0 });
        this.particles = new THREE.Points(geo, mat);
        this.scene.add(this.particles);

        const scanGeo = new THREE.CylinderGeometry(0.1, 2, 4, 32, 1, true);
        const scanMat = new THREE.MeshBasicMaterial({ color: 0x0066FF, transparent: true, opacity: 0, side: THREE.DoubleSide });
        this.scanner = new THREE.Mesh(scanGeo, scanMat);
        this.scanner.rotation.x = Math.PI / 2;
        this.scene.add(this.scanner);
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
        this.droneBody = new THREE.Group();
        const matYellow = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.2, roughness: 0.5 });
        const matBlack = new THREE.MeshStandardMaterial({ color: 0x0A0A0A, metalness: 0.5, roughness: 0.3 });
        const matGray = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 });
        const matGlowBlue = new THREE.MeshStandardMaterial({ color: 0x007AFF, emissive: 0x007AFF, emissiveIntensity: 5 });
        const matRed = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 2 });

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

        // Internal AI Core
        this.parts.aiChip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), matGlowBlue);
        this.parts.aiChip.position.y = 0.05;
        this.parts.aiChip.scale.set(0,0,0);
        this.droneBody.add(this.parts.aiChip);

        // Battery Cells
        for(let i = 0; i < 4; i++) {
            const cell = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.4), matBlack);
            cell.position.set((i % 2 === 0 ? 0.3 : -0.3), 0, (i < 2 ? 0.4 : -0.4));
            cell.visible = false;
            this.parts.batteryCells.push(cell);
            this.droneBody.add(cell);
        }

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

        this.parts.camera = new THREE.Group();
        const camCore = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), matBlack);
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15), matGlowBlue);
        lens.rotation.x = Math.PI / 2;
        lens.position.z = 0.2;
        camCore.add(lens);
        this.parts.camera.add(camCore);
        this.parts.camera.position.set(0, -0.4, 1.3);
        this.droneBody.add(this.parts.camera);

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
        this.drone.scale.set(0.15, 0.15, 0.15);
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

        // 1. HERO & PHILOSOPHY
        mainTl.to(this.drone.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 3 }, 0);
        mainTl.to(this.drone.rotation, { y: 0.4, x: 0.1, duration: 3 }, 0);
        
        // 2. UNFOLDING
        this.parts.arms.forEach((arm, i) => {
            mainTl.to(arm.position, { x: 0, z: 0, duration: 2 }, 4);
            mainTl.to(arm.rotation, { y: i < 2 ? 0.3 : -0.3, duration: 2 }, 4);
        });
        mainTl.to(this.parts.props, { rotationY: Math.PI * 180, ease: "none", duration: 10 }, 5);

        // 3. VISION CORE CLOSE-UP
        mainTl.to(this.camera.position, { x: 0, y: 1.5, z: 6, duration: 4 }, 8);
        mainTl.to(this.drone.rotation, { x: 0.4, y: 0, duration: 4 }, 8);
        mainTl.to(this.parts.camera.position, { z: 1.6, duration: 2 }, 9);

        // 4. AI CORE BRAIN REVEAL
        mainTl.to(this.parts.chassisPlates[1].position, { y: 0.8, duration: 3 }, 12);
        mainTl.to(this.parts.aiChip.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 2 }, 13);
        mainTl.to(this.camera.position, { x: 2, y: 2, z: 8, duration: 4 }, 12);

        // 5. STABILIZATION DEMO
        mainTl.to(this.parts.aiChip.scale, { x: 1, y: 1, z: 1, duration: 2 }, 16);
        mainTl.to(this.drone.rotation, { z: 0.2, x: -0.2, repeat: 3, yoyo: true, duration: 1 }, 16);
        mainTl.to(this.parts.camera.rotation, { z: -0.2, x: 0.2, repeat: 3, yoyo: true, duration: 1 }, 16);

        // 6. BATTERY INTELLIGENCE
        mainTl.to(this.parts.chassisPlates[1].position, { y: 0.25, duration: 2 }, 19);
        mainTl.to(this.parts.chassisPlates[0].material, { opacity: 0.2, transparent: true, duration: 2 }, 19);
        this.parts.batteryCells.forEach(c => {
            mainTl.set(c, { visible: true }, 19);
            mainTl.to(c.material, { emissiveIntensity: 5, duration: 2 }, 20);
        });

        // 7. EXPLODED ARCHITECTURE
        mainTl.to(this.parts.chassisPlates[1].position, { y: 2, duration: 3 }, 23);
        mainTl.to(this.parts.chassisPlates[2].position, { y: -2, duration: 3 }, 23);
        mainTl.to(this.parts.chassisPlates[0].material, { opacity: 1, duration: 1 }, 23);

        // 8. FINAL MISSION MODE
        mainTl.to(this.parts.chassisPlates[1].position, { y: 0.25, duration: 2 }, 26);
        mainTl.to(this.parts.chassisPlates[2].position, { y: -0.25, duration: 2 }, 26);
        mainTl.to(this.camera.position, { x: 0, y: 5, z: 16, duration: 5 }, 26);
        mainTl.to(this.drone.rotation, { y: Math.PI * 10, duration: 15 }, 26);
        mainTl.to(this.scanner.material, { opacity: 0.2, duration: 1 }, 28);
        mainTl.to(this.particles.material, { opacity: 0.7, duration: 3 }, 30);

        // Landing
        mainTl.to(this.parts.gear.scale, { y: 1, duration: 2 }, 38);
        mainTl.to(this.drone.position, { y: -1.5, duration: 4 }, 38);
        mainTl.to(this.camera.position, { x: -3, y: 2, z: 12, duration: 5 }, 38);

        ScrollTrigger.create({
            trigger: ".content",
            onUpdate: (self) => {
                const alt = Math.floor(self.progress * 3500);
                if(this.hudAltitude) this.hudAltitude.innerText = `${alt.toString().padStart(4, '0')}ft`;
            }
        });
    }

    setupTextObserver() {
        const sections = document.querySelectorAll('.text-reveal');
        const observerOptions = { threshold: 0.3 };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) entry.target.classList.add('active');
                else entry.target.classList.remove('active');
            });
        }, observerOptions);
        sections.forEach(s => observer.observe(s));
    }

    bindEvents() {
        window.addEventListener('resize', () => this.onResize());
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const aspect = width / height;
        this.camera.aspect = aspect;
        this.camera.fov = aspect < 1 ? 55 : 35;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = Date.now() * 0.001;
        if(this.drone) {
            this.drone.position.y += Math.sin(time * 1.5) * 0.002;
            this.parts.aiChip.material.emissiveIntensity = 4 + Math.sin(time * 10) * 4;
            const lens = this.parts.camera.children[0].children[1];
            if(lens) lens.material.emissiveIntensity = 3 + Math.sin(time * 6) * 2;
            
            this.parts.batteryCells.forEach((c, i) => {
                if(c.visible) {
                    c.material.emissiveIntensity = 2 + Math.sin(time * 3 + i) * 2;
                }
            });
        }
        if(this.scanner && this.scanner.material.opacity > 0) {
            this.scanner.position.copy(this.drone.position);
            this.scanner.position.z += 1.0;
            this.scanner.rotation.y = time * 2;
        }
        if(this.particles && this.particles.material.opacity > 0) {
            const pos = this.particles.geometry.attributes.position.array;
            for(let i = 1; i < pos.length; i += 3) {
                pos[i] -= 0.15;
                if(pos[i] < -30) pos[i] = 30;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
        this.renderer.render(this.scene, this.camera);
    }
}

new AerofoldApp();
