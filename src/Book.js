import * as THREE from '../node_modules/three/build/three.module.js';
import { gsap } from '../node_modules/gsap/index.js';

export class Book {
    constructor(data, scene) {
        this.data = data;
        this.scene = scene;
        this.mesh = null;
        this.isHovered = false;
        this.isSelected = false;
        this.isOnShelf = false;
        this.shelfPosition = null;
        this.originalScale = { x: 1, y: 1, z: 1 };
        this.hoverTween = null;
    }
    
    async init() {
        await this.createBookMesh();
        this.setupInteractions();
    }
    
    async createBookMesh() {
        const width = 0.3 + Math.random() * 0.1;
        const height = 1.2 + Math.random() * 0.3;
        const depth = 0.15 + Math.random() * 0.05;
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        
        // Create materials for different faces
        const materials = await this.createBookMaterials();
        
        this.mesh = new THREE.Mesh(geometry, materials);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData = { book: this };
        
        // Set initial position (off-screen)
        this.mesh.position.set(
            Math.random() * 20 - 10,
            -5,
            Math.random() * 10 - 5
        );
        
        this.scene.add(this.mesh);
    }
    
    async createBookMaterials() {
        const coverTexture = this.createCoverTexture();
        const spineTexture = this.createSpineTexture();
        const pageTexture = this.createPageTexture();
        
        return [
            new THREE.MeshLambertMaterial({ map: spineTexture }), // Right
            new THREE.MeshLambertMaterial({ map: spineTexture }), // Left
            new THREE.MeshLambertMaterial({ map: pageTexture }), // Top
            new THREE.MeshLambertMaterial({ map: pageTexture }), // Bottom
            new THREE.MeshLambertMaterial({ map: coverTexture }), // Front
            new THREE.MeshLambertMaterial({ map: coverTexture })  // Back
        ];
    }
    
    createCoverTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 384;
        const context = canvas.getContext('2d');
        
        // Background color based on genre
        const colors = {
            'Fiction': ['#8B0000', '#FF6B6B'],
            'Science Fiction': ['#4169E1', '#87CEEB'],
            'Fantasy': ['#8A2BE2', '#DDA0DD'],
            'Mystery': ['#2F4F4F', '#708090'],
            'Romance': ['#FF69B4', '#FFB6C1'],
            'Non-Fiction': ['#228B22', '#90EE90']
        };
        
        const colorPair = colors[this.data.genre] || colors['Fiction'];
        const gradient = context.createLinearGradient(0, 0, 0, 384);
        gradient.addColorStop(0, colorPair[0]);
        gradient.addColorStop(1, colorPair[1]);
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 256, 384);
        
        // Add border
        context.strokeStyle = '#000000';
        context.lineWidth = 4;
        context.strokeRect(0, 0, 256, 384);
        
        // Add title
        context.fillStyle = '#FFFFFF';
        context.font = 'bold 16px Arial';
        context.textAlign = 'center';
        
        const words = this.data.title.split(' ');
        let line = '';
        let y = 50;
        
        words.forEach(word => {
            const testLine = line + word + ' ';
            const metrics = context.measureText(testLine);
            
            if (metrics.width > 200 && line !== '') {
                context.fillText(line, 128, y);
                line = word + ' ';
                y += 25;
            } else {
                line = testLine;
            }
        });
        context.fillText(line, 128, y);
        
        // Add author
        context.font = '12px Arial';
        context.fillText(this.data.author, 128, 350);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createSpineTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 384;
        const context = canvas.getContext('2d');
        
        // Spine color (darker version of cover)
        const colors = {
            'Fiction': '#5A0000',
            'Science Fiction': '#2E4BC7',
            'Fantasy': '#6A1B9A',
            'Mystery': '#1C3333',
            'Romance': '#CC4A7A',
            'Non-Fiction': '#1A5A1A'
        };
        
        context.fillStyle = colors[this.data.genre] || colors['Fiction'];
        context.fillRect(0, 0, 64, 384);
        
        // Add spine text
        context.save();
        context.translate(32, 192);
        context.rotate(-Math.PI / 2);
        context.fillStyle = '#FFFFFF';
        context.font = '10px Arial';
        context.textAlign = 'center';
        context.fillText(this.data.title.substring(0, 20), 0, 0);
        context.restore();
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createPageTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        // Page color
        context.fillStyle = '#F5F5DC';
        context.fillRect(0, 0, 256, 64);
        
        // Add some page lines
        context.strokeStyle = '#E0E0E0';
        context.lineWidth = 1;
        for (let i = 10; i < 256; i += 20) {
            context.beginPath();
            context.moveTo(i, 0);
            context.lineTo(i, 64);
            context.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    setupInteractions() {
        // Store original scale
        this.originalScale = {
            x: this.mesh.scale.x,
            y: this.mesh.scale.y,
            z: this.mesh.scale.z
        };
    }
    
    onHover(isHovering) {
        if (this.isHovered === isHovering) return;
        
        this.isHovered = isHovering;
        
        if (this.hoverTween) {
            this.hoverTween.kill();
        }
        
        if (isHovering) {
            this.hoverTween = gsap.to(this.mesh.scale, {
                duration: 0.3,
                x: this.originalScale.x * 1.1,
                y: this.originalScale.y * 1.1,
                z: this.originalScale.z * 1.1,
                ease: "back.out(1.7)"
            });
            
            // Add glow effect
            gsap.to(this.mesh.position, {
                duration: 0.3,
                z: this.mesh.position.z + 0.2,
                ease: "power2.out"
            });
        } else {
            this.hoverTween = gsap.to(this.mesh.scale, {
                duration: 0.3,
                x: this.originalScale.x,
                y: this.originalScale.y,
                z: this.originalScale.z,
                ease: "power2.out"
            });
            
            // Remove glow effect
            if (this.isOnShelf && this.shelfPosition) {
                gsap.to(this.mesh.position, {
                    duration: 0.3,
                    z: this.shelfPosition.z,
                    ease: "power2.out"
                });
            }
        }
    }
    
    onClick() {
        this.openBook();
    }
    
    openBook() {
        // Animate book opening
        gsap.to(this.mesh.rotation, {
            duration: 0.8,
            y: Math.PI * 0.1,
            ease: "power2.out"
        });
        
        gsap.to(this.mesh.position, {
            duration: 0.8,
            y: this.mesh.position.y + 0.5,
            ease: "back.out(1.7)"
        });
        
        // Show book modal after animation
        setTimeout(() => {
            this.showBookModal();
        }, 400);
    }
    
    showBookModal() {
        const modal = document.getElementById('book-modal');
        const title = document.getElementById('modal-title');
        const author = document.getElementById('modal-author');
        const notesInput = document.getElementById('book-notes-input');
        const ratingStars = document.querySelectorAll('.star-input');
        
        title.textContent = this.data.title;
        author.textContent = `by ${this.data.author}`;
        notesInput.value = this.data.notes || '';
        
        // Set rating stars
        ratingStars.forEach((star, index) => {
            star.classList.toggle('active', index < (this.data.rating || 0));
        });
        
        modal.style.display = 'flex';
        gsap.fromTo(modal, 
            { opacity: 0, scale: 0.8 },
            { duration: 0.3, opacity: 1, scale: 1, ease: "back.out(1.7)" }
        );
    }
    
    update() {
        // Add subtle floating animation when on shelf
        if (this.isOnShelf && !this.isHovered && !this.isSelected) {
            const time = Date.now() * 0.001;
            const offset = this.mesh.position.x * 0.1;
            this.mesh.position.y += Math.sin(time + offset) * 0.002;
        }
    }
}