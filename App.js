
/**
 * AEROFOLD™ - INDUSTRIAL REPLICA (v4.0)
 * Update: Extended timeline for Benchmarks, Comparison, Pricing, and SDK sections.
 * Fix: Guaranteed centering with dynamic LookAt focus.
 */

class AerofoldApp {
    constructor() {
        this.canvas = document.querySelector('#webgl');
        this.loaderProgress = document.querySelector('#loader-progress');
        this.loader = document.querySelector('#loader');
        this.hudAltitude = document.querySelector('#hud-altitude');
        
        this.scene = new THREE.Scene();
        this.drone = null;
        this.lookAtTarget = new THREE.Vector3(0, 0, 0);
        this.parts = { 
            arms: [], 
            props: [], 
            aiChip: null, 
            chassisPlates: []
        };
        this.otaRing = null;
        this.dataParticles = null;
        
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
        this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 15);
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
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
        keyLight.position.set(10, 20, 10);
        this.scene.add(keyLight);
        const rimLight = new THREE.PointLight(0x0066FF, 2.0);
        rimLight.position.set(-8, -8, 8);
        this.scene.add(rimLight);
    }

    setupEnvironment() {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(4000 * 3);
        for(let i = 0; i < 12000; i++) pos[i] = (Math.random() - 0.5) * 100;
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ color: 0x0066FF, size: 0.04, transparent: true, opacity: 0 });
        this.dataParticles = new THREE.Points(geo, mat);
        this.scene.add(this.dataParticles);

        const ringGeo = new THREE.TorusGeometry(1.5, 0.02, 16, 100);
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
        const matYellow = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.5, roughness: 0.2 });
        const matBlack = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });
        const matGlowBlue = new THREE.MeshStandardMaterial({ color: 0x007AFF, emissive: 0x007AFF, emissiveIntensity: 5 });

        const hull = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.8), matBlack);
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 2.6), matYellow);
        top.position.y = 0.3;
        this.parts.chassisPlates.push(hull, top);
        this.drone.add(hull, top);

        const armConfigs = [[1.5, 1.5], [-1.5, 1.5], [1.5, -1.5], [-1.5, -1.5]];
        armConfigs.forEach((cfg, i) => {
            const pivot = new THREE.Group();
            pivot.position.set(cfg[0]*0.1, 0, cfg[1]*0.1);
            const beam = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 0.4), matBlack);
            beam.position.x = cfg[0] > 0 ? 1.0 : -1.0;
            pivot.add(beam);
            
            const prop = new THREE.Group();
            const blade = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.02, 0.1), matYellow);
            prop.add(blade, blade.clone().rotateY(Math.PI/2));
            prop.position.set(cfg[0] > 0 ? 2.0 : -2.0, 0.15, 0);
            beam.add(prop);
            
            this.drone.add(pivot);
            this.parts.arms.push(pivot);
            this.parts.props.push(prop);
        });

        this.parts.aiChip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), matGlowBlue);
        this.parts.aiChip.position.y = 0.4;
        this.parts.aiChip.visible = false;
        this.drone.add(this.parts.aiChip);

        this.drone.scale.set(0.01, 0.01, 0.01);
        this.scene.add(this.drone);
    }

    setupTimelines() {
        gsap.registerPlugin(ScrollTrigger);
        
        const mainTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".content",
                start: "top top",
                end: "bottom bottom",
                scrub: 1.0
            }
        });

        // Intro: Reveal
        mainTl.to(this.drone.scale, { x: 1, y: 1, z: 1, duration: 3 }, 0);
        this.parts.arms.forEach((arm, i) => {
            mainTl.to(arm.rotation, { y: i < 2 ? 0.3 : -0.3, duration: 3 }, 1);
        });

        // Benchmarks: Dynamic Side View
        mainTl.to(this.camera.position, { x: 8, y: 1, z: 8, duration: 5 }, 4);
        mainTl.to(this.drone.rotation, { y: -Math.PI / 2, duration: 5 }, 4);

        // Comparison: Top-down Silhouette
        mainTl.to(this.camera.position, { x: 0, y: 12, z: 2, duration: 5 }, 10);
        mainTl.to(this.drone.rotation, { x: 0, y: 0, duration: 5 }, 10);

        // Pricing: Perspective Macro
        mainTl.to(this.camera.position, { x: -3, y: 2, z: 6, duration: 5 }, 16);
        mainTl.to(this.drone.rotation, { y: Math.PI / 4, x: 0.2, duration: 5 }, 16);

        // SDK: Reveal Internal Hardware
        mainTl.to(this.camera.position, { x: 0, y: 2.5, z: 5, duration: 5 }, 22);
        mainTl.to(this.parts.chassisPlates[1].position, { y: 1.5, duration: 2 }, 22);
        mainTl.set(this.parts.aiChip, { visible: true }, 22);
        mainTl.to(this.parts.aiChip.scale, { x: 2, y: 2, z: 2, duration: 2 }, 23);

        // Final Outro
        mainTl.to(this.parts.chassisPlates[1].position, { y: 0.3, duration: 2 }, 28);
        mainTl.to(this.camera.position, { x: 0, y: 0, z: 20, duration: 6 }, 28);
        mainTl.to(this.drone.rotation, { y: Math.PI * 6, duration: 10 }, 28);

        ScrollTrigger.create({
            trigger: ".content",
            onUpdate: (self) => {
                const alt = Math.floor(self.progress * 5000);
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
        window.addEventListener('resize', () => this.onResize());
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = Date.now() * 0.001;
        
        if(this.drone) {
            this.drone.position.y += Math.sin(time * 2) * 0.002;
            this.parts.props.forEach(p => p.rotation.y += 1.5);
            if(this.parts.aiChip.visible) {
                this.parts.aiChip.material.emissiveIntensity = 2 + Math.sin(time * 10) * 4;
            }
        }

        // Camera always focuses on drone center
        this.camera.lookAt(this.lookAtTarget);
        this.renderer.render(this.scene, this.camera);
    }
}

new AerofoldApp();
