import * as THREE from '../node_modules/three/build/three.module.js';
import { gsap } from '../node_modules/gsap/index.js';

export class BookshelfManager {
    constructor(scene) {
        this.scene = scene;
        this.shelves = {};
        this.shelfPositions = {
            tbr: { x: -8, y: 0, z: 0 },
            rated: { x: 0, y: 0, z: 0 },
            genre: { x: 8, y: 0, z: 0 }
        };
    }
    
    createBookshelf() {
        this.createShelfStructure();
        this.createFloor();
        this.createWalls();
    }
    
    createShelfStructure() {
        const woodTexture = this.createWoodTexture();
        const shelfMaterial = new THREE.MeshLambertMaterial({ 
            map: woodTexture,
            color: 0xfab1a0
        });
        
        // Create shelves for each section
        Object.keys(this.shelfPositions).forEach(shelfType => {
            const shelfGroup = new THREE.Group();
            const position = this.shelfPositions[shelfType];
            
            // Create multiple shelf levels
            for (let level = 0; level < 4; level++) {
                const shelfGeometry = new THREE.BoxGeometry(6, 0.2, 1.5);
                const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
                shelf.position.set(0, level * 2, 0);
                shelf.castShadow = true;
                shelf.receiveShadow = true;
                shelfGroup.add(shelf);
                
                // Add vertical supports
                if (level < 3) {
                    const supportGeometry = new THREE.BoxGeometry(0.2, 2, 1.5);
                    
                    const leftSupport = new THREE.Mesh(supportGeometry, shelfMaterial);
                    leftSupport.position.set(-2.9, level * 2 + 1, 0);
                    leftSupport.castShadow = true;
                    shelfGroup.add(leftSupport);
                    
                    const rightSupport = new THREE.Mesh(supportGeometry, shelfMaterial);
                    rightSupport.position.set(2.9, level * 2 + 1, 0);
                    rightSupport.castShadow = true;
                    shelfGroup.add(rightSupport);
                }
            }
            
            shelfGroup.position.set(position.x, position.y, position.z);
            this.scene.add(shelfGroup);
            this.shelves[shelfType] = shelfGroup;
        });
    }
    
    createWoodTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Create wood grain pattern
        const gradient = context.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#fab1a0');
        gradient.addColorStop(0.3, '#e17055');
        gradient.addColorStop(0.6, '#fab1a0');
        gradient.addColorStop(1, '#d63031');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 512, 512);
        
        // Add wood grain lines
        context.strokeStyle = '#d63031';
        context.lineWidth = 2;
        for (let i = 0; i < 20; i++) {
            context.beginPath();
            context.moveTo(0, i * 25 + Math.random() * 10);
            context.lineTo(512, i * 25 + Math.random() * 10);
            context.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);
        
        return texture;
    }
    
    createFloor() {
        const floorGeometry = new THREE.PlaneGeometry(30, 20);
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffeaa7,
            transparent: true,
            opacity: 0.6
        });
        
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1;
        floor.receiveShadow = true;
        
        this.scene.add(floor);
    }
    
    createWalls() {
        const wallMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xfab1a0,
            transparent: true,
            opacity: 0.4
        });
        
        // Back wall
        const backWallGeometry = new THREE.PlaneGeometry(30, 12);
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.set(0, 5, -3);
        backWall.receiveShadow = true;
        this.scene.add(backWall);
    }
    
    arrangeBooks(books, shelfType, filters = {}) {
        let filteredBooks = books;
        
        // Apply filters based on shelf type
        switch (shelfType) {
            case 'tbr':
                filteredBooks = books.filter(book => book.data.status === 'tbr');
                break;
            case 'rated':
                filteredBooks = books.filter(book => 
                    book.data.rating && book.data.rating >= filters.rating
                );
                break;
            case 'genre':
                filteredBooks = books.filter(book => 
                    book.data.genre === filters.genre
                );
                break;
        }
        
        const shelfPosition = this.shelfPositions[shelfType];
        const booksPerShelf = 8;
        const shelfSpacing = 0.7;
        
        filteredBooks.forEach((book, index) => {
            const shelfLevel = Math.floor(index / booksPerShelf);
            const positionOnShelf = index % booksPerShelf;
            
            const targetPosition = {
                x: shelfPosition.x + (positionOnShelf - booksPerShelf / 2) * shelfSpacing,
                y: shelfLevel * 2 + 0.6,
                z: shelfPosition.z + 0.3
            };
            
            // Animate book to position
            gsap.to(book.mesh.position, {
                duration: 1 + Math.random() * 0.5,
                x: targetPosition.x,
                y: targetPosition.y,
                z: targetPosition.z,
                ease: "back.out(1.7)",
                delay: index * 0.05
            });
            
            // Reset rotation
            gsap.to(book.mesh.rotation, {
                duration: 0.8,
                x: 0,
                y: 0,
                z: 0,
                ease: "power2.out"
            });
            
            book.isOnShelf = true;
            book.shelfPosition = targetPosition;
        });
        
        // Hide books not in current filter
        books.forEach(book => {
            if (!filteredBooks.includes(book)) {
                gsap.to(book.mesh.position, {
                    duration: 0.5,
                    y: -5,
                    ease: "power2.in"
                });
                book.isOnShelf = false;
            }
        });
    }
    
    getShelfCameraPosition(shelfType) {
        const basePosition = this.shelfPositions[shelfType];
        return {
            x: basePosition.x,
            y: 3,
            z: 8,
            lookAt: { x: basePosition.x, y: 3, z: basePosition.z + 0.3 }
        };
    }
    
    findNearestShelfSlot(position) {
        let nearestShelf = null;
        let nearestDistance = Infinity;
        
        Object.keys(this.shelfPositions).forEach(shelfType => {
            const shelfPos = this.shelfPositions[shelfType];
            const distance = Math.sqrt(
                Math.pow(position.x - shelfPos.x, 2) +
                Math.pow(position.z - shelfPos.z, 2)
            );
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestShelf = shelfType;
            }
        });
        
        return nearestShelf;
    }
}