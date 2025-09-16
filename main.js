import * as THREE from './node_modules/three/build/three.module.js';
import { gsap } from './node_modules/gsap/index.js';
import { BookshelfManager } from './src/BookshelfManager.js';
import { Book } from './src/Book.js';
import { UIController } from './src/UIController.js';
import { InteractionManager } from './src/InteractionManager.js';
import { bookData } from './src/bookData.js';

class BookshelfApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.bookshelfManager = null;
        this.uiController = null;
        this.interactionManager = null;
        this.books = [];
        this.currentShelf = 'rated';
        this.currentGenre = 'Fiction';
        this.selectedRating = 4;
        
        this.init();
    }
    
    async init() {
        this.setupScene();
        this.setupLighting();
        this.setupCamera();
        this.setupRenderer();
        
        // Initialize managers
        this.bookshelfManager = new BookshelfManager(this.scene);
        this.uiController = new UIController(this);
        this.interactionManager = new InteractionManager(this);
        
        // Create books
        await this.createBooks();
        
        // Setup bookshelf
        this.bookshelfManager.createBookshelf();
        this.arrangeBooks();
        
        // Start render loop
        this.animate();
        
        // Hide loading screen
        this.hideLoading();
        
        // Setup window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffeaa7);
        
        // Add fog for depth
        this.scene.fog = new THREE.Fog(0xffeaa7, 15, 40);
    }
    
    setupLighting() {
        // Ambient + hemisphere for soft, rich pastels
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
        this.scene.add(ambientLight);
        const hemi = new THREE.HemisphereLight(0xfff5f8, 0xf0f4ff, 0.55); // sky, ground
        this.scene.add(hemi);
        
        // Main directional light (soft pastel tone)
        const directionalLight = new THREE.DirectionalLight(0xffc2e8, 0.85);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Point lights for dreamy pastel accents
        const pointLight1 = new THREE.PointLight(0xbde0fe, 0.45, 20); // baby blue
        pointLight1.position.set(-5, 8, 3);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xfff6a3, 0.38, 15); // soft lemon
        pointLight2.position.set(5, 6, -2);
        this.scene.add(pointLight2);
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 3, 8);
        this.camera.lookAt(0, 3, 0.3);
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.physicallyCorrectLights = true;
        
        document.getElementById('app').appendChild(this.renderer.domElement);
    }
    
    async createBooks() {
        const loadingPromises = bookData.map(async (data, index) => {
            const book = new Book(data, this.scene);
            await book.init();
            this.books.push(book);
        });
        
        await Promise.all(loadingPromises);
    }
    
    arrangeBooks() {
        this.bookshelfManager.arrangeBooks(this.books, this.currentShelf, {
            genre: this.currentGenre,
            rating: this.selectedRating
        });
    }
    
    switchShelf(shelfType) {
        this.currentShelf = shelfType;
        this.arrangeBooks();
        this.uiController.updateShelfInfo(shelfType);
        
        // Animate camera to new position
        const targetPosition = this.bookshelfManager.getShelfCameraPosition(shelfType);
        gsap.to(this.camera.position, {
            duration: 1.5,
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z,
            ease: "power2.inOut"
        });
        // Keep camera looking straight forward at shelf center
        if (targetPosition.lookAt) {
            gsap.to({ t: 0 }, {
                duration: 1.5,
                t: 1,
                ease: "power2.inOut",
                onUpdate: () => this.camera.lookAt(targetPosition.lookAt.x, targetPosition.lookAt.y, targetPosition.lookAt.z)
            });
        }
    }
    
    filterByGenre(genre) {
        this.currentGenre = genre;
        if (this.currentShelf === 'genre') {
            this.arrangeBooks();
        }
    }
    
    filterByRating(rating) {
        this.selectedRating = rating;
        if (this.currentShelf === 'rated') {
            this.arrangeBooks();
        }
    }
    
    async addNewBook(bookData) {
        const { Book } = await import('./src/Book.js');
        const book = new Book(bookData, this.scene);
        await book.init();
        this.books.push(book);
        
        // Rearrange books to show the new one
        this.arrangeBooks();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update books animations
        this.books.forEach(book => book.update());
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    hideLoading() {
        const loading = document.getElementById('loading');
        gsap.to(loading, {
            duration: 0.5,
            opacity: 0,
            onComplete: () => {
                loading.style.display = 'none';
            }
        });
    }
}

// Start the application
new BookshelfApp();