import { gsap } from 'gsap';

export class UIController {
    constructor(app) {
        this.app = app;
        this.genres = ['Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Romance', 'Non-Fiction'];
        this.currentGenreIndex = 0;
        this.currentRating = 4;
        
        this.setupEventListeners();
        this.updateGenreDisplay();
    }
    
    setupEventListeners() {
        // Genre spinner
        document.querySelectorAll('[data-spinner="genre"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const direction = e.target.classList.contains('next') ? 1 : -1;
                this.changeGenre(direction);
            });
        });
        
        // Rating stars
        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.setRating(rating);
            });
        });
        
        // Shelf navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shelf = e.target.dataset.shelf;
                this.switchShelf(shelf);
            });
        });
        
        // Book modal
        this.setupBookModal();
    }
    
    setupBookModal() {
        const modal = document.getElementById('book-modal');
        const closeBtn = document.querySelector('.close-modal');
        const saveBtn = document.getElementById('save-book-data');
        const ratingStars = document.querySelectorAll('.star-input');
        
        closeBtn.addEventListener('click', () => this.closeBookModal());
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeBookModal();
            }
        });
        
        // Rating input
        ratingStars.forEach((star, index) => {
            star.addEventListener('click', () => {
                ratingStars.forEach((s, i) => {
                    s.classList.toggle('active', i <= index);
                });
            });
        });
        
        saveBtn.addEventListener('click', () => this.saveBookData());
    }
    
    changeGenre(direction) {
        this.currentGenreIndex = (this.currentGenreIndex + direction + this.genres.length) % this.genres.length;
        this.updateGenreDisplay();
        this.app.filterByGenre(this.genres[this.currentGenreIndex]);
    }
    
    updateGenreDisplay() {
        const display = document.getElementById('genre-display');
        const newGenre = this.genres[this.currentGenreIndex];
        
        gsap.to(display, {
            duration: 0.2,
            opacity: 0,
            onComplete: () => {
                display.textContent = newGenre;
                gsap.to(display, {
                    duration: 0.2,
                    opacity: 1
                });
            }
        });
    }
    
    setRating(rating) {
        this.currentRating = rating;
        
        document.querySelectorAll('.star').forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
        
        this.app.filterByRating(rating);
    }
    
    switchShelf(shelfType) {
        // Update active button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-shelf="${shelfType}"]`).classList.add('active');
        
        this.app.switchShelf(shelfType);
    }
    
    updateShelfInfo(shelfType) {
        const shelfInfo = document.getElementById('current-shelf');
        const shelfNames = {
            tbr: 'To Be Read',
            rated: 'Rated Books',
            genre: `${this.genres[this.currentGenreIndex]} Books`
        };
        
        gsap.to(shelfInfo, {
            duration: 0.3,
            opacity: 0,
            onComplete: () => {
                shelfInfo.textContent = shelfNames[shelfType];
                gsap.to(shelfInfo, {
                    duration: 0.3,
                    opacity: 1
                });
            }
        });
    }
    
    showBookInfo(book) {
        const bookInfo = document.getElementById('book-info');
        const title = document.getElementById('book-title');
        const author = document.getElementById('book-author');
        const notes = document.getElementById('book-notes');
        
        title.textContent = book.data.title;
        author.textContent = `by ${book.data.author}`;
        notes.textContent = book.data.notes || 'No notes yet...';
        
        bookInfo.style.display = 'block';
        gsap.fromTo(bookInfo, 
            { opacity: 0, y: 20 },
            { duration: 0.3, opacity: 1, y: 0 }
        );
    }
    
    hideBookInfo() {
        const bookInfo = document.getElementById('book-info');
        gsap.to(bookInfo, {
            duration: 0.3,
            opacity: 0,
            y: 20,
            onComplete: () => {
                bookInfo.style.display = 'none';
            }
        });
    }
    
    closeBookModal() {
        const modal = document.getElementById('book-modal');
        gsap.to(modal, {
            duration: 0.3,
            opacity: 0,
            scale: 0.8,
            onComplete: () => {
                modal.style.display = 'none';
            }
        });
    }
    
    saveBookData() {
        const modal = document.getElementById('book-modal');
        const title = document.getElementById('modal-title').textContent;
        const notes = document.getElementById('book-notes-input').value;
        const activeStars = document.querySelectorAll('.star-input.active').length;
        
        // Find the book and update its data
        const book = this.app.books.find(b => b.data.title === title);
        if (book) {
            book.data.notes = notes;
            book.data.rating = activeStars;
            
            // Show success animation
            gsap.to(modal, {
                duration: 0.3,
                scale: 1.05,
                yoyo: true,
                repeat: 1,
                ease: "power2.inOut"
            });
            
            setTimeout(() => this.closeBookModal(), 500);
        }
    }
}