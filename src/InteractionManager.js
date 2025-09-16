import * as THREE from 'three';
import { gsap } from 'gsap';

export class InteractionManager {
    constructor(app) {
        this.app = app;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isDragging = false;
        this.dragObject = null;
        this.dragOffset = new THREE.Vector3();
        this.hoveredObject = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const canvas = this.app.renderer.domElement;
        
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        canvas.addEventListener('click', (e) => this.onClick(e));
        
        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }
    
    updateMousePosition(clientX, clientY) {
        const rect = this.app.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    onMouseMove(event) {
        this.updateMousePosition(event.clientX, event.clientY);
        
        if (this.isDragging && this.dragObject) {
            this.handleDrag();
        } else {
            this.handleHover();
        }
    }
    
    onMouseDown(event) {
        this.updateMousePosition(event.clientX, event.clientY);
        
        const intersects = this.getIntersects();
        if (intersects.length > 0) {
            const book = intersects[0].object.userData.book;
            if (book) {
                this.startDrag(book, intersects[0].point);
            }
        }
    }
    
    onMouseUp(event) {
        if (this.isDragging && this.dragObject) {
            this.endDrag();
        }
    }
    
    onClick(event) {
        if (this.isDragging) return;
        
        this.updateMousePosition(event.clientX, event.clientY);
        
        const intersects = this.getIntersects();
        if (intersects.length > 0) {
            const book = intersects[0].object.userData.book;
            if (book) {
                book.onClick();
            }
        }
    }
    
    onTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        this.updateMousePosition(touch.clientX, touch.clientY);
        
        const intersects = this.getIntersects();
        if (intersects.length > 0) {
            const book = intersects[0].object.userData.book;
            if (book) {
                this.startDrag(book, intersects[0].point);
            }
        }
    }
    
    onTouchMove(event) {
        event.preventDefault();
        const touch = event.touches[0];
        this.updateMousePosition(touch.clientX, touch.clientY);
        
        if (this.isDragging && this.dragObject) {
            this.handleDrag();
        }
    }
    
    onTouchEnd(event) {
        event.preventDefault();
        if (this.isDragging && this.dragObject) {
            this.endDrag();
        }
    }
    
    getIntersects() {
        this.raycaster.setFromCamera(this.mouse, this.app.camera);
        
        const bookMeshes = this.app.books.map(book => book.mesh);
        return this.raycaster.intersectObjects(bookMeshes);
    }
    
    handleHover() {
        const intersects = this.getIntersects();
        
        if (intersects.length > 0) {
            const book = intersects[0].object.userData.book;
            
            if (this.hoveredObject !== book) {
                // Remove hover from previous object
                if (this.hoveredObject) {
                    this.hoveredObject.onHover(false);
                    this.app.uiController.hideBookInfo();
                }
                
                // Add hover to new object
                this.hoveredObject = book;
                book.onHover(true);
                this.app.uiController.showBookInfo(book);
                
                // Change cursor
                this.app.renderer.domElement.style.cursor = 'pointer';
            }
        } else {
            // No intersection
            if (this.hoveredObject) {
                this.hoveredObject.onHover(false);
                this.app.uiController.hideBookInfo();
                this.hoveredObject = null;
                this.app.renderer.domElement.style.cursor = 'grab';
            }
        }
    }
    
    startDrag(book, intersectionPoint) {
        this.isDragging = true;
        this.dragObject = book;
        
        // Calculate drag offset
        this.dragOffset.copy(intersectionPoint).sub(book.mesh.position);
        
        // Visual feedback
        book.isSelected = true;
        gsap.to(book.mesh.scale, {
            duration: 0.2,
            x: book.originalScale.x * 1.2,
            y: book.originalScale.y * 1.2,
            z: book.originalScale.z * 1.2,
            ease: "back.out(1.7)"
        });
        
        // Lift the book
        gsap.to(book.mesh.position, {
            duration: 0.3,
            y: book.mesh.position.y + 1,
            ease: "power2.out"
        });
        
        this.app.renderer.domElement.style.cursor = 'grabbing';
    }
    
    handleDrag() {
        if (!this.dragObject) return;
        
        // Create a plane for dragging
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const intersection = new THREE.Vector3();
        
        this.raycaster.setFromCamera(this.mouse, this.app.camera);
        this.raycaster.ray.intersectPlane(plane, intersection);
        
        // Update book position
        const newPosition = intersection.sub(this.dragOffset);
        this.dragObject.mesh.position.x = newPosition.x;
        this.dragObject.mesh.position.z = newPosition.z;
        
        // Add rotation while dragging
        this.dragObject.mesh.rotation.y = Math.sin(Date.now() * 0.01) * 0.1;
    }
    
    endDrag() {
        if (!this.dragObject) return;
        
        const book = this.dragObject;
        
        // Find nearest shelf
        const nearestShelf = this.app.bookshelfManager.findNearestShelfSlot(book.mesh.position);
        
        if (nearestShelf) {
            // Update book's shelf assignment
            book.data.shelf = nearestShelf;
            
            // Rearrange books
            this.app.arrangeBooks();
            
            // Visual feedback
            this.showDropFeedback(book, true);
        } else {
            // Return to original position
            gsap.to(book.mesh.position, {
                duration: 0.8,
                x: book.shelfPosition?.x || 0,
                y: book.shelfPosition?.y || 0,
                z: book.shelfPosition?.z || 0,
                ease: "back.out(1.7)"
            });
            
            this.showDropFeedback(book, false);
        }
        
        // Reset book state
        book.isSelected = false;
        gsap.to(book.mesh.scale, {
            duration: 0.3,
            x: book.originalScale.x,
            y: book.originalScale.y,
            z: book.originalScale.z,
            ease: "power2.out"
        });
        
        gsap.to(book.mesh.rotation, {
            duration: 0.5,
            y: 0,
            ease: "power2.out"
        });
        
        this.isDragging = false;
        this.dragObject = null;
        this.app.renderer.domElement.style.cursor = 'grab';
    }
    
    showDropFeedback(book, success) {
        // Create temporary visual feedback
        const geometry = new THREE.RingGeometry(0.5, 0.7, 16);
        const material = new THREE.MeshBasicMaterial({
            color: success ? 0x00ff00 : 0xff0000,
            transparent: true,
            opacity: 0.7
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(book.mesh.position);
        ring.position.y -= 0.5;
        ring.rotation.x = -Math.PI / 2;
        
        this.app.scene.add(ring);
        
        // Animate feedback
        gsap.to(ring.scale, {
            duration: 0.5,
            x: 2,
            y: 2,
            z: 2,
            ease: "power2.out"
        });
        
        gsap.to(ring.material, {
            duration: 0.5,
            opacity: 0,
            ease: "power2.out",
            onComplete: () => {
                this.app.scene.remove(ring);
                geometry.dispose();
                material.dispose();
            }
        });
    }
}