// Main Application Controller
class FootballChartApp {
    constructor() {
        this.currentPage = 'home';
        this.currentTool = 'select';
        this.currentActionMode = 'move'; // 'move', 'route', 'block'
        this.currentShape = 'circle';
        this.currentColor = '#E63E00'; // Default to darker orange
        this.collisionAvoidance = true;
        this.snapToGrid = true; // Default snap to grid enabled
        this.hasUnsavedChanges = false; // Track unsaved changes
        this.lastSavedState = null; // Store last saved state for comparison
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.setupThemeToggle();
        this.loadStoredPlays();
        this.setupRouting();
        this.loadInitialPage();
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        const navLogo = document.querySelector('.nav-logo h2');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateToPage(page);
                this.updateNavigation(link);

                // Close mobile menu
                navMenu.classList.remove('active');
            });
        });

        // Add click handler for Steelers GamePlan title
        if (navLogo) {
            navLogo.style.cursor = 'pointer';
            navLogo.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToPage('home');
                // Update navigation to show home as active
                const homeLink = document.querySelector('.nav-link[data-page="home"]');
                if (homeLink) {
                    this.updateNavigation(homeLink);
                }
            });
        }

        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
            }
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const currentTheme = localStorage.getItem('theme') || 'dark'; // Default to dark theme

        // Set initial theme
        document.documentElement.setAttribute('data-theme', currentTheme);
        themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

        // Set default highlight color to darker orange
        this.currentColor = '#E63E00';

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';

            // Update canvas if it exists
            if (window.canvasManager) {
                window.canvasManager.render();
            }
        });
    } setupEventListeners() {
        // Hero action buttons
        document.querySelectorAll('[data-action="new-chart"]').forEach(btn => {
            btn.addEventListener('click', () => this.navigateToPage('chart'));
        });

        document.querySelectorAll('[data-action="view-library"]').forEach(btn => {
            btn.addEventListener('click', () => this.navigateToPage('library'));
        });

        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectTool(e.target.getAttribute('data-tool'));
            });
        });

        // Action mode selection (for select tool)
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectActionMode(e.target.getAttribute('data-action'));
            });
        });

        // Collision avoidance toggle
        document.getElementById('collision-toggle')?.addEventListener('change', (e) => {
            this.setCollisionAvoidance(e.target.checked);
        });

        // Snap to grid toggle
        document.getElementById('snap-toggle')?.addEventListener('change', (e) => {
            this.setSnapToGrid(e.target.checked);
        });

        // Route control buttons
        document.getElementById('finish-route')?.addEventListener('click', () => {
            if (window.canvasManager) {
                window.canvasManager.finishDrawing();
            }
        });

        document.getElementById('remove-segment')?.addEventListener('click', () => {
            if (window.canvasManager) {
                window.canvasManager.removeLastRouteSegment();
            }
        });

        // Shape selection
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectShape(e.target.getAttribute('data-shape'));
            });
        });

        // Color selection
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectColor(e.target.getAttribute('data-color'));
            });
        });

        // Route/Block color selection
        document.querySelectorAll('.route-color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.getAttribute('data-color');
                this.changeSelectedRouteBlockColor(color);
            });
        });

        // Default lineup selection
        document.querySelectorAll('.lineup-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lineup = e.target.getAttribute('data-lineup');
                this.loadDefaultLineup(lineup);
            });
        });

        // Custom lineup management
        document.getElementById('save-lineup')?.addEventListener('click', () => {
            this.saveCustomLineup();
        });

        // Auto-load lineup selection
        document.getElementById('auto-load-lineup')?.addEventListener('change', (e) => {
            this.setAutoLoadLineup(e.target.value);
        });

        // Chart actions
        document.getElementById('save-play')?.addEventListener('click', () => {
            this.saveCurrentPlay();
        });

        document.getElementById('load-play')?.addEventListener('click', () => {
            this.loadPlay();
        });

        document.getElementById('clear-canvas')?.addEventListener('click', () => {
            if (window.canvasManager) {
                window.canvasManager.clearCanvas();
            }
        });

        // Library filters
        document.getElementById('play-search')?.addEventListener('input', (e) => {
            this.filterPlays();
        });

        document.getElementById('formation-filter')?.addEventListener('change', (e) => {
            this.filterPlays();
        });

        document.getElementById('tag-filter')?.addEventListener('input', (e) => {
            this.filterPlays();
        });

        // Print functionality
        document.getElementById('print-plays')?.addEventListener('click', () => {
            this.printSelectedPlays();
        });

        // Position property inputs - apply changes to selected position
        document.getElementById('position-name')?.addEventListener('input', (e) => {
            if (window.canvasManager && window.canvasManager.selectedElement) {
                window.canvasManager.selectedElement.name = e.target.value;
                window.canvasManager.render();
            }
        });

        document.getElementById('player-name')?.addEventListener('input', (e) => {
            if (window.canvasManager && window.canvasManager.selectedElement) {
                window.canvasManager.selectedElement.player = e.target.value;
                window.canvasManager.render();
            }
        });

        // Import play
        document.getElementById('import-play')?.addEventListener('change', (e) => {
            this.importPlay(e.target.files[0]);
        });

        // Window resize handler with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (window.canvasManager) {
                    window.canvasManager.handleResize();
                }
            }, 100); // 100ms debounce
        });
    }

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;

            // Update navigation highlighting
            this.updateNavigationForPage(pageId);

            // Update URL hash
            this.updateURL(pageId);

            // Initialize page-specific functionality
            switch (pageId) {
                case 'chart':
                    this.initializeChart();
                    break;
                case 'library':
                    this.initializeLibrary();
                    break;
            }
        }
    }

    navigateToPage(pageId) {
        // If navigating away from chart page, check for unsaved changes
        if (this.currentPage === 'chart' && pageId !== 'chart') {
            if (this.hasUnsavedChanges) {
                this.showSavePrompt(pageId);
                return;
            }
        }

        // Navigate normally if no unsaved changes
        this.showPage(pageId);
    }

    showSavePrompt(targetPage) {
        const modal = this.createSavePromptModal(targetPage);
        document.body.appendChild(modal);

        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    createSavePromptModal(targetPage) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content save-prompt-modal">
                <h3>Unsaved Changes</h3>
                <p>You have unsaved changes to your chart. What would you like to do?</p>
                <div class="modal-actions">
                    <button class="btn btn-primary" id="save-and-continue">Save & Continue</button>
                    <button class="btn btn-secondary" id="save-new-and-continue">Save New & Continue</button>
                    <button class="btn btn-outline" id="leave-without-saving">Leave Without Saving</button>
                    <button class="btn btn-outline" id="cancel-navigation">Cancel</button>
                </div>
            </div>
        `;

        // Add event listeners
        modal.querySelector('#save-and-continue').addEventListener('click', () => {
            this.saveCurrentPlay();
            this.closeSavePrompt(modal);
            this.showPage(targetPage);
        });

        modal.querySelector('#save-new-and-continue').addEventListener('click', () => {
            this.saveAsNewPlay();
            this.closeSavePrompt(modal);
            this.showPage(targetPage);
        });

        modal.querySelector('#leave-without-saving').addEventListener('click', () => {
            this.hasUnsavedChanges = false;
            this.closeSavePrompt(modal);
            this.showPage(targetPage);
        });

        modal.querySelector('#cancel-navigation').addEventListener('click', () => {
            this.closeSavePrompt(modal);
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeSavePrompt(modal);
            }
        });

        return modal;
    }

    closeSavePrompt(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    updateNavigation(activeLink) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    updateNavigationForPage(pageId) {
        // Update navigation highlighting based on current page
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // URL Routing Methods
    setupRouting() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });

        // Listen for browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.handleRouteChange();
        });
    }

    loadInitialPage() {
        // Check URL hash on startup and navigate to appropriate page
        const hash = window.location.hash.substring(1); // Remove the # symbol

        if (hash && ['home', 'chart', 'library'].includes(hash)) {
            this.showPage(hash);
        } else {
            // Default to home page if no valid hash
            this.showPage('home');
            this.updateURL('home');
        }
    }

    handleRouteChange() {
        // Handle URL hash changes
        const hash = window.location.hash.substring(1);

        if (hash && ['home', 'chart', 'library'].includes(hash)) {
            this.showPage(hash);
        }
    }

    updateURL(pageId) {
        // Update URL hash without triggering navigation
        if (window.location.hash !== `#${pageId}`) {
            window.history.pushState(null, null, `#${pageId}`);
        }
    }

    selectTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');

        if (window.canvasManager) {
            window.canvasManager.setTool(tool);
        }

        // Show/hide action mode controls based on selected tool
        this.updateActionModeVisibility(tool);
    }

    selectActionMode(actionMode) {
        this.currentActionMode = actionMode;
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-action="${actionMode}"]`)?.classList.add('active');

        if (window.canvasManager) {
            // Store current selection before changing mode
            const currentSelection = window.canvasManager.selectedElement;

            window.canvasManager.setActionMode(actionMode);

            // If there was a selection, update UI accordingly
            if (currentSelection) {
                this.updateSelectionStatus(currentSelection);
            } else {
                // Update UI feedback for the new action mode
                this.updateActionModeUI(actionMode);
            }
        } else {
            // Update UI feedback for the new action mode
            this.updateActionModeUI(actionMode);
        }
    }

    setCollisionAvoidance(enabled) {
        this.collisionAvoidance = enabled;
        if (window.canvasManager) {
            window.canvasManager.setCollisionAvoidance(enabled);
        }
    }

    setSnapToGrid(enabled) {
        this.snapToGrid = enabled;
        if (window.canvasManager) {
            window.canvasManager.setSnapToGrid(enabled);
        }
    }

    updateActionModeVisibility(tool) {
        const actionControls = document.getElementById('action-controls');
        if (actionControls) {
            // Show action controls only for select tool
            actionControls.style.display = tool === 'select' ? 'block' : 'none';
        }
    }

    updateActionModeUI(actionMode) {
        const statusText = document.getElementById('action-status');
        if (statusText) {
            const modes = {
                'move': 'Select a position to move it. Right-click to deselect.',
                'route': 'Select a position then drag to draw route. Right-click to deselect.',
                'block': 'Select a position then drag to draw blocks. Right-click to deselect.'
            };
            statusText.textContent = modes[actionMode] || '';
        }
    }

    // Method to update status for selected position
    updateSelectionStatus(selectedElement) {
        const statusText = document.getElementById('action-status');
        if (statusText && selectedElement && selectedElement.type === 'position') {
            const positionName = selectedElement.name || 'Position';
            statusText.textContent = `${positionName} selected. Modify properties below or right-click to deselect.`;
        } else if (statusText) {
            this.updateActionModeUI(this.currentActionMode);
        }

        // Update the route/block color section info
        this.updateSelectedPositionInfo(selectedElement);
    }

    selectShape(shape) {
        this.currentShape = shape;
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-shape="${shape}"]`).classList.add('active');

        if (window.canvasManager) {
            window.canvasManager.setShape(shape);
        }
    }

    selectColor(color) {
        this.currentColor = color;
        this.updateActiveColorButton(color);

        if (window.canvasManager) {
            window.canvasManager.setColor(color);
        }
    }

    changeSelectedRouteBlockColor(color) {
        if (!window.canvasManager || !window.canvasManager.selectedElement) {
            this.showNotification('Please select a position first', 'warning');
            return;
        }

        const selectedPosition = window.canvasManager.selectedElement;

        // Find and update route for this position
        const route = window.canvasManager.getRouteForPosition(selectedPosition);
        if (route) {
            window.canvasManager.changeRouteColor(route, color);
        }

        // Find and update block for this position
        const block = window.canvasManager.getBlockForPosition(selectedPosition);
        if (block) {
            window.canvasManager.changeBlockColor(block, color);
        }

        if (route || block) {
            this.showNotification(`${route ? 'Route' : ''}${route && block ? ' and ' : ''}${block ? 'Block' : ''} color updated!`, 'success');
            this.updateSelectedPositionInfo(selectedPosition);
        } else {
            this.showNotification('No route or block found for this position', 'info');
        }
    }

    updateSelectedPositionInfo(position) {
        const infoElement = document.getElementById('selected-position-info');
        if (!infoElement) return;

        if (!position) {
            infoElement.textContent = 'Select a position to change its route/block color';
            return;
        }

        const route = window.canvasManager.getRouteForPosition(position);
        const block = window.canvasManager.getBlockForPosition(position);

        let info = `Selected: ${position.name || 'Position'}`;
        if (route) {
            info += ` (Route: ●)`;
        }
        if (block) {
            info += ` (Block: ■)`;
        }
        if (!route && !block) {
            info += ' (No route/block)';
        }

        infoElement.textContent = info;
    }

    loadDefaultLineup(lineupName) {
        if (window.canvasManager) {
            window.canvasManager.loadDefaultLineup(lineupName);
            this.showNotification(`${lineupName.replace('-', ' ').toUpperCase()} lineup loaded!`, 'success');
        }
    }

    saveCustomLineup() {
        const lineupName = document.getElementById('lineup-name')?.value.trim();

        if (!lineupName) {
            this.showNotification('Please enter a lineup name', 'warning');
            return;
        }

        if (window.canvasManager) {
            const success = window.canvasManager.saveCustomLineup(lineupName);
            if (success) {
                this.showNotification(`Lineup "${lineupName}" saved!`, 'success');
                document.getElementById('lineup-name').value = '';
                this.refreshCustomLineupsList();
            } else {
                this.showNotification('Failed to save lineup', 'error');
            }
        }
    }

    loadCustomLineup(lineupName) {
        if (window.canvasManager) {
            const success = window.canvasManager.loadCustomLineup(lineupName);
            if (success) {
                this.showNotification(`Custom lineup "${lineupName}" loaded!`, 'success');
            } else {
                this.showNotification('Failed to load lineup', 'error');
            }
        }
    }

    deleteCustomLineup(lineupName) {
        if (confirm(`Are you sure you want to delete the lineup "${lineupName}"?`)) {
            if (window.canvasManager) {
                window.canvasManager.deleteCustomLineup(lineupName);
                this.showNotification(`Lineup "${lineupName}" deleted!`, 'success');
                this.refreshCustomLineupsList();
            }
        }
    }

    refreshCustomLineupsList() {
        const container = document.getElementById('saved-lineups');
        if (!container || !window.canvasManager) return;

        const customLineups = window.canvasManager.getCustomLineups();
        container.innerHTML = '';

        if (customLineups.length === 0) {
            container.innerHTML = '<p class="no-lineups">No saved lineups</p>';
        } else {
            customLineups.forEach(lineup => {
                const lineupItem = document.createElement('div');
                lineupItem.className = 'lineup-item';
                lineupItem.innerHTML = `
                    <span class="lineup-name">${lineup.name}</span>
                    <div class="lineup-actions">
                        <button class="btn btn-xs" onclick="window.footballApp.loadCustomLineup('${lineup.name}')">Load</button>
                        <button class="btn btn-xs btn-danger" onclick="window.footballApp.deleteCustomLineup('${lineup.name}')">Delete</button>
                    </div>
                `;
                container.appendChild(lineupItem);
            });
        }

        // Refresh auto-load dropdown to include custom lineups
        this.initializeAutoLoadDropdown();
    }

    // Auto-load lineup functionality
    setAutoLoadLineup(lineupName) {
        localStorage.setItem('autoLoadLineup', lineupName);
        if (lineupName) {
            this.showNotification(`Auto-load set to: ${lineupName.replace('-', ' ').toUpperCase()}`, 'success');
        } else {
            this.showNotification('Auto-load disabled', 'info');
        }
    }

    getAutoLoadLineup() {
        return localStorage.getItem('autoLoadLineup') || '';
    }

    loadAutoLineupIfSet() {
        const autoLineup = this.getAutoLoadLineup();
        if (autoLineup && autoLineup !== '') {
            if (autoLineup.startsWith('custom:')) {
                // Load custom lineup
                const lineupName = autoLineup.replace('custom:', '');
                this.loadCustomLineup(lineupName);
            } else {
                // Load default lineup
                this.loadDefaultLineup(autoLineup);
            }
        }
    }

    initializeAutoLoadDropdown() {
        const dropdown = document.getElementById('auto-load-lineup');
        if (dropdown) {
            // Clear existing options except the first one
            dropdown.innerHTML = '<option value="">None</option>';

            // Add default lineups
            const defaultLineups = [
                { value: 'steelers-default', name: 'Steelers' },
                { value: 'i-formation', name: 'I-Formation' },
                { value: 'shotgun', name: 'Shotgun' },
                { value: 'pistol', name: 'Pistol' },
                { value: 'wildcat', name: 'Wildcat' },
                { value: 'goal-line', name: 'Goal Line' }
            ];

            defaultLineups.forEach(lineup => {
                const option = document.createElement('option');
                option.value = lineup.value;
                option.textContent = lineup.name;
                dropdown.appendChild(option);
            });

            // Add custom lineups
            const customLineups = JSON.parse(localStorage.getItem('customLineups') || '[]');
            if (customLineups.length > 0) {
                // Add separator
                const separator = document.createElement('option');
                separator.disabled = true;
                separator.textContent = '── Custom Lineups ──';
                dropdown.appendChild(separator);

                customLineups.forEach(lineup => {
                    const option = document.createElement('option');
                    option.value = `custom:${lineup.name}`;
                    option.textContent = lineup.name;
                    dropdown.appendChild(option);
                });
            }

            const currentAutoLoad = this.getAutoLoadLineup();
            dropdown.value = currentAutoLoad;
        }
    }

    initializeChart() {
        if (!window.canvasManager) {
            window.canvasManager = new CanvasManager('football-field');
        }
        window.canvasManager.setTool(this.currentTool);
        window.canvasManager.setActionMode(this.currentActionMode);
        window.canvasManager.setCollisionAvoidance(this.collisionAvoidance);
        window.canvasManager.setSnapToGrid(this.snapToGrid);
        window.canvasManager.setShape(this.currentShape);
        window.canvasManager.setColor(this.currentColor);

        // Set the active color button to light green by default
        this.updateActiveColorButton(this.currentColor);

        this.refreshCustomLineupsList();
        this.updateActionModeVisibility(this.currentTool);
        this.updateActionModeUI(this.currentActionMode);

        // Initialize auto-load lineup dropdown
        this.initializeAutoLoadDropdown();

        // Load auto-lineup if set
        this.loadAutoLineupIfSet();

        // Initialize change tracking
        this.setupChangeTracking();
        this.markAsSaved(window.canvasManager.getPlayData());
    }

    setupChangeTracking() {
        if (!window.canvasManager) return;

        // Override the render method to track changes
        const originalRender = window.canvasManager.render.bind(window.canvasManager);
        window.canvasManager.render = () => {
            originalRender();
            // Check for changes after each render
            setTimeout(() => this.checkForChanges(), 10);
        };

        // Track changes on specific canvas events
        const canvas = window.canvasManager.canvas;
        if (canvas) {
            canvas.addEventListener('mouseup', () => {
                setTimeout(() => this.markAsChanged(), 10);
            });
        }
    }

    updateActiveColorButton(color) {
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const colorBtn = document.querySelector(`[data-color="${color}"]`);
        if (colorBtn) {
            colorBtn.classList.add('active');
        }
    }

    initializeLibrary() {
        if (window.libraryManager) {
            window.libraryManager.renderPlays();
        }
    }

    saveCurrentPlay() {
        if (!window.canvasManager) return;

        const playName = document.getElementById('play-name')?.value || 'Untitled Play';
        const playData = window.canvasManager.getPlayData();

        const play = {
            id: Date.now().toString(),
            name: playName,
            data: playData,
            formation: this.detectFormation(playData),
            tags: this.extractTags(playName),
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };

        this.storePlay(play);
        this.markAsSaved(playData);
        this.showNotification('Play saved successfully!', 'success');
    }

    saveAsNewPlay() {
        if (!window.canvasManager) return;

        const currentName = document.getElementById('play-name')?.value || 'Untitled Play';
        const newName = `${currentName} (Copy)`;

        // Temporarily update the name input
        const nameInput = document.getElementById('play-name');
        if (nameInput) {
            nameInput.value = newName;
        }

        const playData = window.canvasManager.getPlayData();

        const play = {
            id: Date.now().toString(),
            name: newName,
            data: playData,
            formation: this.detectFormation(playData),
            tags: this.extractTags(newName),
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };

        this.storePlay(play);
        this.markAsSaved(playData);
        this.showNotification('Play saved as new copy!', 'success');
    }

    markAsSaved(playData) {
        this.hasUnsavedChanges = false;
        this.lastSavedState = JSON.stringify(playData);
    }

    markAsChanged() {
        if (this.currentPage === 'chart') {
            this.hasUnsavedChanges = true;
        }
    }

    checkForChanges() {
        if (this.currentPage !== 'chart' || !window.canvasManager) {
            return;
        }

        const currentData = JSON.stringify(window.canvasManager.getPlayData());
        if (this.lastSavedState && currentData !== this.lastSavedState) {
            this.hasUnsavedChanges = true;
        }
    }

    loadPlay() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importPlay(file);
            }
        };
        input.click();
    }

    importPlay(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const playData = JSON.parse(e.target.result);
                this.loadPlayData(playData);
                this.showNotification('Play loaded successfully!', 'success');
            } catch (error) {
                this.showNotification('Error loading play file', 'error');
            }
        };
        reader.readAsText(file);
    }

    loadPlayData(playData) {
        if (window.canvasManager && playData.data) {
            window.canvasManager.loadPlayData(playData.data);
            document.getElementById('play-name').value = playData.name || '';
        }
    }

    storePlay(play) {
        let storedPlays = JSON.parse(localStorage.getItem('footballPlays') || '[]');

        // Update existing play or add new one
        const existingIndex = storedPlays.findIndex(p => p.id === play.id);
        if (existingIndex >= 0) {
            storedPlays[existingIndex] = play;
        } else {
            storedPlays.push(play);
        }

        localStorage.setItem('footballPlays', JSON.stringify(storedPlays));

        if (window.libraryManager) {
            window.libraryManager.loadPlays();
        }
    }

    loadStoredPlays() {
        const storedPlays = JSON.parse(localStorage.getItem('footballPlays') || '[]');
        if (window.libraryManager) {
            window.libraryManager.setPlays(storedPlays);
        }
        return storedPlays;
    }

    filterPlays() {
        if (window.libraryManager) {
            const searchTerm = document.getElementById('play-search')?.value || '';
            const formation = document.getElementById('formation-filter')?.value || '';
            const tags = document.getElementById('tag-filter')?.value || '';

            window.libraryManager.filterPlays({
                search: searchTerm,
                formation: formation,
                tags: tags
            });
        }
    }

    printSelectedPlays() {
        if (window.libraryManager) {
            const selectedPlays = window.libraryManager.getSelectedPlays();
            const layout = document.getElementById('print-layout')?.value || '1x1';
            const colorPrint = document.getElementById('color-print')?.checked || false;
            const fontSize = document.getElementById('font-size')?.value || 'medium';

            this.generatePrintLayout(selectedPlays, layout, colorPrint, fontSize);
        }
    }

    generatePrintLayout(plays, layout, colorPrint, fontSize) {
        if (plays.length === 0) {
            this.showNotification('Please select plays to print', 'warning');
            return;
        }

        const printWindow = window.open('', '_blank');
        const [cols, rows] = layout.split('x').map(Number);

        let printHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Football Plays</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 20px; 
                        ${colorPrint ? '' : 'color: black;'}
                    }
                    .plays-grid { 
                        display: grid; 
                        grid-template-columns: repeat(${cols}, 1fr); 
                        gap: 20px; 
                        page-break-inside: avoid;
                    }
                    .play-item { 
                        border: 2px solid black; 
                        padding: 15px; 
                        text-align: center;
                        page-break-inside: avoid;
                    }
                    .play-name { 
                        font-size: ${fontSize === 'large' ? '18px' : fontSize === 'small' ? '12px' : '16px'};
                        font-weight: bold; 
                        margin-bottom: 10px; 
                    }
                    .play-canvas { 
                        border: 1px solid #ccc; 
                        width: 100%; 
                        max-width: 200px; 
                        height: 150px;
                    }
                    @media print {
                        body { margin: 0; }
                        .plays-grid { gap: 10px; }
                    }
                </style>
            </head>
            <body>
                <div class="plays-grid">
        `;

        plays.forEach(play => {
            printHTML += `
                <div class="play-item">
                    <div class="play-name">${play.name}</div>
                    <canvas class="play-canvas" width="200" height="150"></canvas>
                </div>
            `;
        });

        printHTML += `
                </div>
                <script>
                    // Render play data to canvases
                    const plays = ${JSON.stringify(plays)};
                    const canvases = document.querySelectorAll('.play-canvas');
                    plays.forEach((play, index) => {
                        if (canvases[index] && play.data) {
                            // Simple rendering logic here
                            const ctx = canvases[index].getContext('2d');
                            ctx.fillStyle = '#2d5016';
                            ctx.fillRect(0, 0, 200, 150);
                            // Add play rendering logic
                        }
                    });
                    
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(printHTML);
        printWindow.document.close();
    }

    detectFormation(playData) {
        // Simple formation detection based on position count and arrangement
        if (!playData || !playData.positions) return 'Unknown';

        const positionCount = playData.positions.length;
        if (positionCount >= 11) return 'Full Formation';
        if (positionCount >= 7) return 'Shotgun';
        if (positionCount >= 5) return 'I-Formation';
        return 'Custom';
    }

    extractTags(playName) {
        // Extract tags from play name (simple implementation)
        const tags = [];
        const lowerName = playName.toLowerCase();

        if (lowerName.includes('run')) tags.push('run');
        if (lowerName.includes('pass')) tags.push('pass');
        if (lowerName.includes('screen')) tags.push('screen');
        if (lowerName.includes('sweep')) tags.push('sweep');
        if (lowerName.includes('slant')) tags.push('slant');

        return tags;
    }

    showNotification(message, type = 'info') {
        // Create and show notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
        `;

        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#28A745';
                break;
            case 'error':
                notification.style.backgroundColor = '#DC3545';
                break;
            case 'warning':
                notification.style.backgroundColor = '#FFC107';
                notification.style.color = '#000';
                break;
            default:
                notification.style.backgroundColor = '#17A2B8';
        }

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.footballApp = new FootballChartApp();

    // Initialize library manager
    window.libraryManager = new LibraryManager();
    window.libraryManager.init();
});

// Service Worker registration for PWA capabilities (if needed)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Global function for toolbar toggle (used in responsive design)
function toggleToolbar() {
    const toolbar = document.querySelector('.toolbar');
    const isOpen = toolbar.classList.contains('open');

    if (isOpen) {
        toolbar.classList.remove('open');
        // Remove overlay if it exists
        const overlay = document.querySelector('.toolbar-overlay');
        if (overlay) {
            overlay.remove();
        }
    } else {
        toolbar.classList.add('open');
        // Add overlay to close toolbar when clicking outside
        const overlay = document.createElement('div');
        overlay.className = 'toolbar-overlay';
        overlay.onclick = () => toggleToolbar();
        document.body.appendChild(overlay);
    }
}
