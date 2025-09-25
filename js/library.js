// Library Manager for Play Organization and Management
class LibraryManager {
    constructor() {
        this.plays = [];
        this.filteredPlays = [];
        this.selectedPlays = new Set();
        this.filters = {
            search: '',
            formation: '',
            tags: ''
        };
        this.firebaseService = null;
    }

    init() {
        // Get Firebase service instance
        this.firebaseService = FirebaseService.getInstance();

        this.loadPlays();
        this.setupEventListeners();
        this.renderPlays();
    }

    setupEventListeners() {
        // Search and filter handlers are set up in app.js
        // This method can be extended for additional library-specific events
    }

    async loadPlays() {
        try {
            let plays = [];
            if (this.firebaseService && this.firebaseService.isInitialized()) {
                plays = await this.firebaseService.getPlays();
            } else {
                plays = JSON.parse(localStorage.getItem('footballPlays') || '[]');
            }
            this.setPlays(plays);
        } catch (error) {
            console.error('Error loading plays in library:', error);
            // Fallback to localStorage
            const plays = JSON.parse(localStorage.getItem('footballPlays') || '[]');
            this.setPlays(plays);
        }
    }

    setPlays(plays) {
        this.plays = plays;
        this.applyFilters();
    }

    applyFilters() {
        this.filteredPlays = this.plays.filter(play => {
            const matchesSearch = !this.filters.search ||
                play.name.toLowerCase().includes(this.filters.search.toLowerCase());

            const matchesFormation = !this.filters.formation ||
                play.formation === this.filters.formation;

            const matchesTags = !this.filters.tags ||
                (play.tags && play.tags.some(tag =>
                    tag.toLowerCase().includes(this.filters.tags.toLowerCase())
                ));

            return matchesSearch && matchesFormation && matchesTags;
        });

        this.renderPlays();
    }

    filterPlays(filters) {
        this.filters = { ...this.filters, ...filters };
        this.applyFilters();
    }

    renderPlays() {
        const playsGrid = document.getElementById('plays-grid');
        if (!playsGrid) return;

        playsGrid.innerHTML = '';

        if (this.filteredPlays.length === 0) {
            playsGrid.innerHTML = `
                <div class="no-plays-message">
                    <h3>No plays found</h3>
                    <p>Try adjusting your filters or create a new play.</p>
                    <button class="btn btn-primary" onclick="window.footballApp.showPage('chart')">
                        Create New Play
                    </button>
                </div>
            `;
            return;
        }

        this.filteredPlays.forEach(play => {
            const playCard = this.createPlayCard(play);
            playsGrid.appendChild(playCard);
        });
    }

    createPlayCard(play) {
        const card = document.createElement('div');
        card.className = 'play-card';
        card.setAttribute('data-play-id', play.id);

        // Create canvas for play preview
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 280;
        previewCanvas.height = 150;
        previewCanvas.className = 'play-preview';

        // Render play preview
        this.renderPlayPreview(previewCanvas, play);

        // Create play info
        const playInfo = document.createElement('div');
        playInfo.className = 'play-info';

        const playName = document.createElement('h3');
        playName.textContent = play.name;

        const playMeta = document.createElement('div');
        playMeta.className = 'play-meta';
        playMeta.innerHTML = `
            <div>Formation: ${play.formation || 'Unknown'}</div>
            <div>Created: ${new Date(play.created).toLocaleDateString()}</div>
        `;

        const playTags = document.createElement('div');
        playTags.className = 'play-tags';
        if (play.tags && play.tags.length > 0) {
            play.tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'tag';
                tagSpan.textContent = tag;
                playTags.appendChild(tagSpan);
            });
        }

        const playActions = document.createElement('div');
        playActions.className = 'play-actions';
        playActions.innerHTML = `
            <button class="btn btn-sm btn-secondary" onclick="libraryManager.editPlay('${play.id}')">
                Edit
            </button>
            <button class="btn btn-sm btn-secondary" onclick="libraryManager.duplicatePlay('${play.id}')">
                Duplicate
            </button>
            <button class="btn btn-sm btn-secondary" onclick="libraryManager.exportPlay('${play.id}')">
                Export
            </button>
            <button class="btn btn-sm btn-danger" onclick="libraryManager.deletePlay('${play.id}')">
                Delete
            </button>
        `;

        playInfo.appendChild(playName);
        playInfo.appendChild(playMeta);
        playInfo.appendChild(playTags);
        playInfo.appendChild(playActions);

        card.appendChild(previewCanvas);
        card.appendChild(playInfo);

        // Add click handler for selection
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.play-actions')) {
                this.togglePlaySelection(play.id);
            }
        });

        return card;
    }

    renderPlayPreview(canvas, play) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Draw field background
        ctx.fillStyle = '#2d5016';
        ctx.fillRect(0, 0, width, height);

        // Draw simplified field lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        // Yard lines
        const yardSpacing = width / 12;
        for (let i = 1; i < 12; i++) {
            ctx.beginPath();
            ctx.moveTo(i * yardSpacing, 0);
            ctx.lineTo(i * yardSpacing, height);
            ctx.stroke();
        }

        // 50-yard line
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();

        // Render play elements if they exist
        if (play.data && play.data.elements) {
            const scaleX = width / (play.data.canvasSize?.width || 800);
            const scaleY = height / (play.data.canvasSize?.height || 600);

            play.data.elements.forEach(element => {
                if (element.type === 'position') {
                    this.drawPreviewPosition(ctx, element, scaleX, scaleY);
                } else if (element.type === 'route') {
                    this.drawPreviewRoute(ctx, element, scaleX, scaleY);
                } else if (element.type === 'block') {
                    this.drawPreviewBlock(ctx, element, scaleX, scaleY);
                }
            });
        }
    }

    drawPreviewPosition(ctx, position, scaleX, scaleY) {
        const x = position.x * scaleX;
        const y = position.y * scaleY;
        const size = 8; // Smaller size for preview

        ctx.fillStyle = position.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        switch (position.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(x, y, size, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                break;
            case 'square':
                ctx.fillRect(x - size, y - size, size * 2, size * 2);
                ctx.strokeRect(x - size, y - size, size * 2, size * 2);
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(x, y - size);
                ctx.lineTo(x - size, y + size);
                ctx.lineTo(x + size, y + size);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            default:
                ctx.beginPath();
                ctx.arc(x, y, size, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
        }
    }

    drawPreviewRoute(ctx, route, scaleX, scaleY) {
        if (route.path.length < 2) return;

        ctx.strokeStyle = route.color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(route.path[0].x * scaleX, route.path[0].y * scaleY);

        for (let i = 1; i < route.path.length; i++) {
            ctx.lineTo(route.path[i].x * scaleX, route.path[i].y * scaleY);
        }

        ctx.stroke();
    }

    drawPreviewBlock(ctx, block, scaleX, scaleY) {
        if (block.path.length < 2) return;

        ctx.strokeStyle = block.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);

        ctx.beginPath();
        ctx.moveTo(block.path[0].x * scaleX, block.path[0].y * scaleY);

        for (let i = 1; i < block.path.length; i++) {
            ctx.lineTo(block.path[i].x * scaleX, block.path[i].y * scaleY);
        }

        ctx.stroke();
        ctx.setLineDash([]);
    }

    togglePlaySelection(playId) {
        const card = document.querySelector(`[data-play-id="${playId}"]`);
        if (!card) return;

        if (this.selectedPlays.has(playId)) {
            this.selectedPlays.delete(playId);
            card.classList.remove('selected');
        } else {
            this.selectedPlays.add(playId);
            card.classList.add('selected');
        }
    }

    getSelectedPlays() {
        return this.plays.filter(play => this.selectedPlays.has(play.id));
    }

    editPlay(playId) {
        const play = this.plays.find(p => p.id === playId);
        if (play) {
            window.footballApp.showPage('chart');
            setTimeout(() => {
                if (window.footballApp) {
                    window.footballApp.loadPlayData(play);
                }
            }, 100);
        }
    }

    duplicatePlay(playId) {
        const play = this.plays.find(p => p.id === playId);
        if (play) {
            const duplicatedPlay = {
                ...play,
                id: Date.now().toString(),
                name: `${play.name} (Copy)`,
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            };

            this.plays.push(duplicatedPlay);
            this.saveToStorage();
            this.applyFilters();

            if (window.footballApp) {
                window.footballApp.showNotification('Play duplicated successfully!', 'success');
            }
        }
    }

    exportPlay(playId) {
        const play = this.plays.find(p => p.id === playId);
        if (play) {
            const dataStr = JSON.stringify(play, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `${play.name.replace(/[^a-z0-9]/gi, '_')}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (window.footballApp) {
                window.footballApp.showNotification('Play exported successfully!', 'success');
            }
        }
    }

    deletePlay(playId) {
        if (confirm('Are you sure you want to delete this play?')) {
            const index = this.plays.findIndex(p => p.id === playId);
            if (index > -1) {
                this.plays.splice(index, 1);
                this.selectedPlays.delete(playId);
                this.saveToStorage();
                this.applyFilters();

                if (window.footballApp) {
                    window.footballApp.showNotification('Play deleted successfully!', 'success');
                }
            }
        }
    }

    saveToStorage() {
        localStorage.setItem('footballPlays', JSON.stringify(this.plays));
    }

    // Bulk operations
    selectAllPlays() {
        this.filteredPlays.forEach(play => {
            this.selectedPlays.add(play.id);
        });
        this.updateSelectionUI();
    }

    deselectAllPlays() {
        this.selectedPlays.clear();
        this.updateSelectionUI();
    }

    updateSelectionUI() {
        document.querySelectorAll('.play-card').forEach(card => {
            const playId = card.getAttribute('data-play-id');
            if (this.selectedPlays.has(playId)) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    exportSelectedPlays() {
        const selectedPlays = this.getSelectedPlays();
        if (selectedPlays.length === 0) {
            if (window.footballApp) {
                window.footballApp.showNotification('Please select plays to export', 'warning');
            }
            return;
        }

        const dataStr = JSON.stringify(selectedPlays, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `football_plays_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (window.footballApp) {
            window.footballApp.showNotification(
                `${selectedPlays.length} plays exported successfully!`,
                'success'
            );
        }
    }

    deleteSelectedPlays() {
        const selectedPlays = this.getSelectedPlays();
        if (selectedPlays.length === 0) {
            if (window.footballApp) {
                window.footballApp.showNotification('Please select plays to delete', 'warning');
            }
            return;
        }

        if (confirm(`Are you sure you want to delete ${selectedPlays.length} selected plays?`)) {
            selectedPlays.forEach(play => {
                const index = this.plays.findIndex(p => p.id === play.id);
                if (index > -1) {
                    this.plays.splice(index, 1);
                }
            });

            this.selectedPlays.clear();
            this.saveToStorage();
            this.applyFilters();

            if (window.footballApp) {
                window.footballApp.showNotification(
                    `${selectedPlays.length} plays deleted successfully!`,
                    'success'
                );
            }
        }
    }

    // Search and sort functionality
    sortPlays(criteria) {
        switch (criteria) {
            case 'name':
                this.filteredPlays.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'created':
                this.filteredPlays.sort((a, b) => new Date(b.created) - new Date(a.created));
                break;
            case 'modified':
                this.filteredPlays.sort((a, b) => new Date(b.modified) - new Date(a.modified));
                break;
            case 'formation':
                this.filteredPlays.sort((a, b) => (a.formation || '').localeCompare(b.formation || ''));
                break;
        }
        this.renderPlays();
    }

    // Statistics and analytics
    getPlayStatistics() {
        const stats = {
            total: this.plays.length,
            formations: {},
            tags: {},
            recentlyCreated: 0,
            recentlyModified: 0
        };

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        this.plays.forEach(play => {
            // Formation stats
            const formation = play.formation || 'Unknown';
            stats.formations[formation] = (stats.formations[formation] || 0) + 1;

            // Tag stats
            if (play.tags) {
                play.tags.forEach(tag => {
                    stats.tags[tag] = (stats.tags[tag] || 0) + 1;
                });
            }

            // Recent activity
            if (new Date(play.created) > oneWeekAgo) {
                stats.recentlyCreated++;
            }
            if (new Date(play.modified) > oneWeekAgo) {
                stats.recentlyModified++;
            }
        });

        return stats;
    }
}

// Add CSS for no plays message
const style = document.createElement('style');
style.textContent = `
    .no-plays-message {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .no-plays-message h3 {
        margin-bottom: 10px;
        color: #6C757D;
    }
    
    .no-plays-message p {
        margin-bottom: 20px;
        color: #6C757D;
    }
    
    .btn-sm {
        padding: 6px 12px;
        font-size: 12px;
        margin-right: 5px;
    }
    
    .btn-danger {
        background-color: #DC3545;
        color: white;
        border: none;
    }
    
    .btn-danger:hover {
        background-color: #C82333;
    }
    
    .play-actions {
        margin-top: 15px;
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
    }
    
    .play-meta {
        font-size: 12px;
        color: #6C757D;
        margin-bottom: 10px;
    }
    
    .play-meta div {
        margin-bottom: 3px;
    }
`;
document.head.appendChild(style);
