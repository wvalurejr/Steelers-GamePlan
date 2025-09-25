// Canvas Manager for Football Field Drawing
class CanvasManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.elements = [];
        this.selectedElement = null;
        this.originalPosition = null; // Store original position for move cancel
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.potentialDrag = false;
        this.dragThreshold = 8; // pixels (increased from 5 for less sensitivity)
        this.dragStartPosition = { x: 0, y: 0 };
        this.tool = 'select';
        this.actionMode = 'move'; // 'edit', 'move', 'route', 'block'
        this.shape = 'circle';
        this.color = '#000000';
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.currentPath = [];
        this.activeRoute = null; // For multi-segment routes
        this.avoidCollisions = true; // Default collision avoidance
        this.snapToGrid = true; // Default snap to grid lines
        this.routeDrawingMode = false; // Track if we're in active route drawing mode
        this.previewPoint = null; // For showing arrow preview before placing point
        this.currentRoute = null; // Currently being drawn route
        this.editingRoutePoint = false; // Track if we're editing a route point
        this.editingRoute = null; // The route being edited
        this.editingPointIndex = -1; // The index of the point being edited
        this.originalPoint = null; // Store original point position for editing

        // Block drawing and editing state
        this.blockDrawingMode = false; // Track if we're in active block drawing mode
        this.activeBlock = null; // Currently being drawn block
        this.editingBlockPoint = false; // Track if we're editing a block point
        this.editingBlock = null; // The block being edited
        this.editingBlockPointIndex = -1; // The index of the block point being edited

        // Firebase service instance
        this.firebaseService = null;

        this.init();
    }

    init() {
        // Get Firebase service instance
        this.firebaseService = FirebaseService.getInstance();

        this.setupCanvas();
        this.setupEventListeners();
        this.drawField();
        this.render();
    }

    setupCanvas() {
        // Set canvas size for vertical 30-yard field (15 yards above and below center)
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();

        // Vertical field: 30 yards total (15 above + 15 below center line)
        // Width should be proportional to football field width (53.3 yards)
        const fieldAspectRatio = 53.3 / 30; // width/height ratio for 30-yard field

        // Significantly increase maximum height for realistic yard-to-player scaling
        // Goal: Each yard should be large enough that a player position fits comfortably within it
        // With 30 yards and 1200px height, each yard = 40px, making 18px radius players realistic
        let canvasHeight = Math.min(1200, containerRect.height - 40); // Increased from 700 to 1200
        let canvasWidth = canvasHeight * fieldAspectRatio;

        // Check if width exceeds container, if so scale down proportionally
        if (canvasWidth > containerRect.width - 40) {
            canvasWidth = containerRect.width - 40;
            canvasHeight = canvasWidth / fieldAspectRatio;
        }

        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        // Set CSS size to match canvas size
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        this.canvas.addEventListener('contextmenu', this.handleRightClick.bind(this));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // Prevent default touch behaviors
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
    }

    // Helper method to get accurate canvas coordinates
    getCanvasCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();

        // Get computed styles to account for borders and padding
        const computedStyle = window.getComputedStyle(this.canvas);
        const borderLeft = parseInt(computedStyle.borderLeftWidth) || 0;
        const borderTop = parseInt(computedStyle.borderTopWidth) || 0;

        // Calculate the actual canvas content area
        const canvasContentWidth = rect.width - (borderLeft * 2);
        const canvasContentHeight = rect.height - (borderTop * 2);

        // Calculate scaling factors
        const scaleX = this.canvas.width / canvasContentWidth;
        const scaleY = this.canvas.height / canvasContentHeight;

        // Adjust for borders and calculate scaled coordinates
        const x = (clientX - rect.left - borderLeft) * scaleX;
        const y = (clientY - rect.top - borderTop) * scaleY;

        return { x, y };
    } drawField() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Field background with grass texture
        this.ctx.fillStyle = '#2d5016';
        this.ctx.fillRect(0, 0, width, height);

        // Add subtle grass texture
        this.drawGrassTexture();

        // Field lines for vertical 30-yard field (15 yards each side of center)
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;

        // Center line (50-yard line) - thicker and more prominent
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, height / 2);
        this.ctx.lineTo(width, height / 2);
        this.ctx.stroke();

        // 5-yard lines above center (45, 40, 35 yard lines)
        this.ctx.lineWidth = 1.5;
        for (let i = 1; i <= 3; i++) {
            const y = height / 2 - (height / 6) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }

        // 5-yard lines below center (45, 40, 35 yard lines on other side)
        for (let i = 1; i <= 3; i++) {
            const y = height / 2 + (height / 6) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }

        // 10-yard lines (thicker) - these are the 40-yard lines
        this.ctx.lineWidth = 3;
        const tenYardAbove = height / 2 - (height / 3);
        const tenYardBelow = height / 2 + (height / 3);

        this.ctx.beginPath();
        this.ctx.moveTo(0, tenYardAbove);
        this.ctx.lineTo(width, tenYardAbove);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(0, tenYardBelow);
        this.ctx.lineTo(width, tenYardBelow);
        this.ctx.stroke();

        // Draw detailed hash marks
        this.drawHashMarks();

        // Sidelines - thicker and more prominent
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(2, 0);
        this.ctx.lineTo(2, height);
        this.ctx.moveTo(width - 2, 0);
        this.ctx.lineTo(width - 2, height);
        this.ctx.stroke();

        // End lines (goal lines)
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 2);
        this.ctx.lineTo(width, 2);
        this.ctx.moveTo(0, height - 2);
        this.ctx.lineTo(width, height - 2);
        this.ctx.stroke();

        // Add field crown effect (slight curve to simulate field crown)
        this.drawFieldCrown();
    }

    drawGrassTexture() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Create subtle grass stripes
        this.ctx.globalAlpha = 0.1;
        this.ctx.fillStyle = '#1a3d0f';

        const stripeWidth = width / 20;
        for (let i = 0; i < 20; i += 2) {
            this.ctx.fillRect(i * stripeWidth, 0, stripeWidth, height);
        }

        this.ctx.globalAlpha = 1.0;
    }

    drawHashMarks() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const hashLength = width * 0.08;

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;

        // NCAA/NFL hash mark positions (closer to center than high school)
        const leftHashX = width * 0.4;
        const rightHashX = width * 0.6;

        // Draw hash marks at every yard (every 6th of the field sections)
        for (let section = 0; section <= 6; section++) {
            const yAbove = height / 2 - (height / 6) * section;
            const yBelow = height / 2 + (height / 6) * section;

            if (section <= 3) { // Only draw for visible field area
                // Left hash marks
                this.ctx.beginPath();
                this.ctx.moveTo(leftHashX - hashLength / 2, yAbove);
                this.ctx.lineTo(leftHashX + hashLength / 2, yAbove);
                this.ctx.stroke();

                if (section > 0) { // Don't duplicate center line
                    this.ctx.beginPath();
                    this.ctx.moveTo(leftHashX - hashLength / 2, yBelow);
                    this.ctx.lineTo(leftHashX + hashLength / 2, yBelow);
                    this.ctx.stroke();
                }

                // Right hash marks
                this.ctx.beginPath();
                this.ctx.moveTo(rightHashX - hashLength / 2, yAbove);
                this.ctx.lineTo(rightHashX + hashLength / 2, yAbove);
                this.ctx.stroke();

                if (section > 0) { // Don't duplicate center line
                    this.ctx.beginPath();
                    this.ctx.moveTo(rightHashX - hashLength / 2, yBelow);
                    this.ctx.lineTo(rightHashX + hashLength / 2, yBelow);
                    this.ctx.stroke();
                }
            }
        }

        // Add smaller tick marks between major lines
        this.ctx.lineWidth = 1;
        const tickLength = hashLength * 0.4;

        for (let section = 0; section < 6; section++) {
            for (let tick = 1; tick < 5; tick++) {
                const yOffset = (height / 6) * (tick / 5);
                const yAbove = height / 2 - (height / 6) * section - yOffset;
                const yBelow = height / 2 + (height / 6) * section + yOffset;

                if (yAbove > 0 && yAbove < height && section < 3) {
                    // Left side ticks
                    this.ctx.beginPath();
                    this.ctx.moveTo(leftHashX - tickLength / 2, yAbove);
                    this.ctx.lineTo(leftHashX + tickLength / 2, yAbove);
                    this.ctx.stroke();

                    // Right side ticks
                    this.ctx.beginPath();
                    this.ctx.moveTo(rightHashX - tickLength / 2, yAbove);
                    this.ctx.lineTo(rightHashX + tickLength / 2, yAbove);
                    this.ctx.stroke();
                }

                if (yBelow > 0 && yBelow < height && section < 3) {
                    // Left side ticks
                    this.ctx.beginPath();
                    this.ctx.moveTo(leftHashX - tickLength / 2, yBelow);
                    this.ctx.lineTo(leftHashX + tickLength / 2, yBelow);
                    this.ctx.stroke();

                    // Right side ticks
                    this.ctx.beginPath();
                    this.ctx.moveTo(rightHashX - tickLength / 2, yBelow);
                    this.ctx.lineTo(rightHashX + tickLength / 2, yBelow);
                    this.ctx.stroke();
                }
            }
        }
    }

    drawFieldCrown() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Add subtle shading to simulate field crown (higher in the middle)
        this.ctx.globalAlpha = 0.05;

        const gradient = this.ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(0.2, 'transparent');
        gradient.addColorStop(0.8, 'transparent');
        gradient.addColorStop(1, '#000000');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);

        this.ctx.globalAlpha = 1.0;
    }

    handleMouseDown(e) {
        // Only handle left mouse button (button 0) for dragging operations
        if (e.button !== 0) {
            return;
        }

        const coords = this.getCanvasCoordinates(e.clientX, e.clientY);
        const x = coords.x;
        const y = coords.y;

        this.startX = x;
        this.startY = y;

        switch (this.tool) {
            case 'select':
                this.handleSelectWithAction(x, y);
                break;
            case 'position':
                this.createPosition(x, y);
                break;
            case 'route':
                this.startRoute(x, y);
                break;
            case 'block':
                this.startBlock(x, y);
                break;
        }
    }

    handleMouseMove(e) {
        const coords = this.getCanvasCoordinates(e.clientX, e.clientY);
        const x = coords.x;
        const y = coords.y;

        // Check if we should start dragging based on threshold
        if (this.potentialDrag && this.selectedElement && this.actionMode === 'move' && !this.isDragging) {
            console.log('Potential drag detected, checking threshold...');
            const deltaX = x - this.dragStartPosition.x;
            const deltaY = y - this.dragStartPosition.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (distance > this.dragThreshold) {
                // Start actual dragging
                this.isDragging = true;
                this.potentialDrag = false;
            }
        }

        // Only update position if we're actually dragging (not just potential drag)
        if (this.isDragging && this.selectedElement && this.actionMode === 'move') {
            let newX = x - this.dragOffset.x;
            let newY = y - this.dragOffset.y;

            // Apply snapping if enabled
            if (this.snapToGrid) {
                const snapped = this.snapCoordinates(newX, newY);
                newX = snapped.x;
                newY = snapped.y;
            }

            this.selectedElement.x = newX;
            this.selectedElement.y = newY;
            this.render();
        } else if (this.editingRoutePoint && this.editingRoute) {
            // Show preview of route point being edited
            let newX = x;
            let newY = y;

            // Apply snapping if enabled
            if (this.snapToGrid) {
                const snapped = this.snapCoordinates(newX, newY);
                newX = snapped.x;
                newY = snapped.y;
            }

            this.previewPoint = { x: newX, y: newY };
            this.render();
        } else if (this.editingBlockPoint && this.editingBlock) {
            // Show preview of block point being edited
            let newX = x;
            let newY = y;

            // Apply snapping if enabled
            if (this.snapToGrid) {
                const snapped = this.snapCoordinates(newX, newY);
                newX = snapped.x;
                newY = snapped.y;
            }

            this.previewPoint = { x: newX, y: newY };
            this.render();
        } else if (this.routeDrawingMode && this.activeRoute) {
            // Show preview arrow for next route point
            let previewX = x;
            let previewY = y;

            // Apply snapping if enabled
            if (this.snapToGrid) {
                const snapped = this.snapCoordinates(previewX, previewY);
                previewX = snapped.x;
                previewY = snapped.y;
            }

            this.previewPoint = { x: previewX, y: previewY };
            this.render();
        } else if (this.blockDrawingMode && this.activeBlock) {
            // Show preview line for next block point
            let previewX = x;
            let previewY = y;

            // Apply snapping if enabled
            if (this.snapToGrid) {
                const snapped = this.snapCoordinates(previewX, previewY);
                previewX = snapped.x;
                previewY = snapped.y;
            }

            this.previewPoint = { x: previewX, y: previewY };
            this.render();
        } else if (this.isDrawing) {
            if (this.actionMode === 'route' || this.actionMode === 'block' || this.tool === 'route' || this.tool === 'block') {
                // Add point if we've moved enough distance to avoid duplicate points
                const lastPoint = this.currentPath[this.currentPath.length - 1];
                const distance = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2));

                if (distance > 10) { // Minimum distance between points
                    // Check for collision avoidance
                    if (this.avoidCollisions && this.checkPathCollision(lastPoint, { x, y })) {
                        // Skip this point if it would cause a collision
                        return;
                    }
                    this.currentPath.push({ x, y });
                }
                this.render();
                this.drawCurrentPath();
            }
        }
    }

    handleMouseUp(e) {
        // Only handle left mouse button (button 0) for drag operations
        if (e.button !== 0) {
            return;
        }

        const coords = this.getCanvasCoordinates(e.clientX, e.clientY);
        const x = coords.x;
        const y = coords.y;

        // If we're editing a route point, complete the edit
        if (this.editingRoutePoint && this.editingRoute && this.previewPoint) {
            this.completeRoutePointEdit();
            return;
        }

        // If we're editing a block point, complete the edit
        if (this.editingBlockPoint && this.editingBlock && this.previewPoint) {
            this.completeBlockPointEdit();
            return;
        }

        // If we're dragging a position in move mode, drop it at the current location
        if ((this.isDragging || this.potentialDrag) && this.selectedElement && this.actionMode === 'move') {
            console.log('Dropping element to new position...');
            let newX = x - this.dragOffset.x;
            let newY = y - this.dragOffset.y;

            // Apply snapping if enabled
            if (this.snapToGrid) {
                const snapped = this.snapCoordinates(newX, newY);
                newX = snapped.x;
                newY = snapped.y;
            }

            // Final position update
            this.selectedElement.x = newX;
            this.selectedElement.y = newY;

            // Clear the original position since the move is complete
            this.originalPosition = null;

            // Mark as changed for save tracking
            if (window.footballApp && window.footballApp.markAsChanged) {
                window.footballApp.markAsChanged();
            }

            // Stop moving the position
            this.isDragging = false;
            this.potentialDrag = false;

            this.render();
        }

        if (this.isDrawing && (this.actionMode === 'route' || this.actionMode === 'block' || this.tool === 'route' || this.tool === 'block')) {
            // Don't finish immediately - allow for multi-segment drawing
            // Double-click or right-click will finish the path
        } else {
            this.finishDrawing();
        }

        this.isDragging = false;
        this.potentialDrag = false;
    }

    handleClick(e) {
        // Handle single clicks for certain tools
    }

    handleDoubleClick(e) {
        if (this.isDrawing) {
            this.finishDrawing();
        }
    }

    handleRightClick(e) {
        e.preventDefault(); // Prevent context menu

        const coords = this.getCanvasCoordinates(e.clientX, e.clientY);
        const x = coords.x;
        const y = coords.y;

        // If we're in route drawing mode, add final point and finish the route
        if (this.routeDrawingMode && this.activeRoute) {
            // Add the current mouse position as the final point
            this.addRoutePoint(x, y);
            this.finishRoute();
            return false;
        }

        // If we're in block drawing mode, finish the block without adding current point
        if (this.blockDrawingMode && this.activeBlock) {
            // Don't add the current mouse position, just finish with existing points
            this.finishBlock();
            return false;
        }

        // Cancel any pending operations
        if (this.isDrawing) {
            this.currentPath = [];
            this.isDrawing = false;
            this.activeRoute = null;
            this.activeBlock = null;
        }

        // If in move mode and a position is selected, restore its original position
        if (this.actionMode === 'move' && this.selectedElement && this.originalPosition) {
            this.selectedElement.x = this.originalPosition.x;
            this.selectedElement.y = this.originalPosition.y;
            this.originalPosition = null;

            // Mark as changed for save tracking
            if (window.footballApp && window.footballApp.markAsChanged) {
                window.footballApp.markAsChanged();
            }
        }

        // Deselect current position
        this.selectedElement = null;
        this.isDragging = false;
        this.potentialDrag = false;
        this.routeDrawingMode = false;
        this.blockDrawingMode = false;
        this.previewPoint = null;

        // Update status in app
        if (window.footballApp) {
            window.footballApp.updateSelectionStatus(null);
        }

        // Re-render to show deselection
        this.render();

        return false;
    }

    handleTouchStart(e) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    handleTouchMove(e) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    handleTouchEnd(e) {
        const mouseEvent = new MouseEvent('mouseup', {});
        this.canvas.dispatchEvent(mouseEvent);
    }

    // New method to handle selection with different action modes
    handleSelectWithAction(x, y) {
        const element = this.getElementAt(x, y);

        // If we're in route drawing mode and click on empty space, add route point
        if (this.routeDrawingMode && this.actionMode === 'route' && !element) {
            this.addRoutePoint(x, y);
            return;
        }

        // If we're in block drawing mode and click on empty space, add block point
        if (this.blockDrawingMode && this.actionMode === 'block' && !element) {
            this.addBlockPoint(x, y);
            return;
        }

        // If we click on a route point, start editing it
        if (element && element.isRoutePoint && this.actionMode === 'route') {
            this.startRoutePointEdit(element, element.pointIndex);
            return;
        }

        // If we click on a block point, start editing it
        if (element && element.isBlockPoint && this.actionMode === 'block') {
            this.startBlockPointEdit(element, element.pointIndex);
            return;
        }

        // If we click on a route while in route mode, allow editing
        if (this.routeDrawingMode && this.actionMode === 'route' && element && element.type === 'route') {
            this.editRoutePoint(element, x, y);
            return;
        }

        // If we click on a block while in block mode, allow editing
        if (this.blockDrawingMode && this.actionMode === 'block' && element && element.type === 'block') {
            this.editBlockPoint(element, x, y);
            return;
        }

        if (element && element.type === 'position') {
            // Keep the position selected for modification
            this.selectedElement = element;

            switch (this.actionMode) {
                case 'edit':
                    // In edit mode, just select the position for property editing
                    break;
                case 'move':
                    // Set up potential drag, but don't start dragging yet
                    this.potentialDrag = true;
                    this.dragStartPosition.x = x;
                    this.dragStartPosition.y = y;
                    this.dragOffset.x = x - element.x;
                    this.dragOffset.y = y - element.y;
                    // Store original position for cancel
                    this.originalPosition = { x: element.x, y: element.y };
                    break;
                case 'route':
                    // If already in route drawing mode for this position, continue
                    if (this.routeDrawingMode && this.activeRoute && this.activeRoute.startPosition === element) {
                        // Continue adding points to existing route
                        this.previewPoint = null;
                    } else {
                        // Start new route from this position
                        this.startRouteFromPosition(element, x, y);
                    }
                    break;
                case 'block':
                    // If already in block drawing mode for this position, continue
                    if (this.blockDrawingMode && this.activeBlock && this.activeBlock.startPosition === element) {
                        // Continue adding points to existing block
                        this.previewPoint = null;
                    } else {
                        // Start new block from this position
                        this.startBlockFromPosition(element, x, y);
                    }
                    break;
            }

            // Update UI to reflect selected position properties
            this.updateUIForSelectedPosition();

            // Update status in app
            if (window.footballApp) {
                window.footballApp.updateSelectionStatus(element);
            }
        } else if (this.actionMode === 'edit' && !element) {
            // In edit mode, clicking empty space creates a new position
            this.createPosition(x, y);
            return;
        } else if (!this.isDrawing && !this.routeDrawingMode) {
            // Only deselect if we're not in the middle of drawing
            // Right-click will handle deselection during drawing
            // Keep current selection if clicking empty space
        }

        this.render();
    }

    // Start a route from a selected position
    startRouteFromPosition(position, x, y) {
        // Clear any existing drawing modes to prevent conflicts
        this.clearDrawingModes();

        // Check if position already has a route, remove it
        this.removeExistingRouteForPosition(position);

        this.routeDrawingMode = true;
        this.isDrawing = false; // We'll set this true when we start placing points
        this.currentPath = [{ x: position.x, y: position.y }];
        this.activeRoute = {
            type: 'route',
            startPosition: position,
            segments: [],
            path: [{ x: position.x, y: position.y }],
            color: this.color
        };

        // Update status
        if (window.footballApp) {
            const statusElement = document.getElementById('action-status');
            if (statusElement) {
                statusElement.textContent = 'Click anywhere to add route points. Right-click to finish route.';
            }
        }
    }

    // Add a point to the current route
    addRoutePoint(x, y) {
        if (!this.routeDrawingMode || !this.activeRoute) return;

        // Apply snapping if enabled
        if (this.snapToGrid) {
            const snapped = this.snapCoordinates(x, y);
            x = snapped.x;
            y = snapped.y;
        }

        const lastPoint = this.activeRoute.path[this.activeRoute.path.length - 1];

        // Check for collision avoidance
        if (this.avoidCollisions) {
            const avoidedPath = this.calculateAvoidancePath(lastPoint, { x, y });
            // Add intermediate points if needed to avoid positions
            for (let i = 1; i < avoidedPath.length; i++) {
                this.activeRoute.path.push(avoidedPath[i]);
            }
        } else {
            this.activeRoute.path.push({ x, y });
        }

        this.currentPath = [...this.activeRoute.path];
        this.previewPoint = null;
        this.render();
    }

    // Calculate path that avoids positions
    calculateAvoidancePath(from, to) {
        if (!this.avoidCollisions) return [from, to];

        const path = [from];
        let current = from;
        const target = to;
        const maxIterations = 10;
        let iterations = 0;

        while (this.distanceBetweenPoints(current, target) > 10 && iterations < maxIterations) {
            iterations++;

            // Check if direct path is clear
            if (!this.checkPathCollision(current, target)) {
                path.push(target);
                break;
            }

            // Find intermediate point that avoids collisions
            const intermediatePoint = this.findAvoidancePoint(current, target);
            if (intermediatePoint) {
                path.push(intermediatePoint);
                current = intermediatePoint;
            } else {
                // If we can't find a good avoidance point, go direct
                path.push(target);
                break;
            }
        }

        return path;
    }

    // Find a point that avoids positions between current and target
    findAvoidancePoint(from, to) {
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;

        // Try points in a small radius around the midpoint
        const radius = 30;
        const angles = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI, 5 * Math.PI / 4, 3 * Math.PI / 2, 7 * Math.PI / 4];

        for (let angle of angles) {
            const testPoint = {
                x: midX + Math.cos(angle) * radius,
                y: midY + Math.sin(angle) * radius
            };

            if (!this.checkPathCollision(from, testPoint) && !this.checkPathCollision(testPoint, to)) {
                return testPoint;
            }
        }

        return null;
    }

    // Helper function to calculate distance between two points
    distanceBetweenPoints(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    // Start a block from a selected position
    startBlockFromPosition(position, x, y) {
        // Clear any existing drawing modes to prevent conflicts
        this.clearDrawingModes();

        // Check if position already has a block, remove it
        this.removeExistingBlockForPosition(position);

        this.blockDrawingMode = true;
        this.isDrawing = false; // We'll set this true when we start placing points
        this.currentPath = [{ x: position.x, y: position.y }];
        this.activeBlock = {
            type: 'block',
            startPosition: position,
            path: [{ x: position.x, y: position.y }],
            color: this.color
        };

        // Update status
        if (window.footballApp) {
            const statusElement = document.getElementById('action-status');
            if (statusElement) {
                statusElement.textContent = `Block started from ${position.name || 'position'}. Click to add points, right-click to finish.`;
            }
        }

        this.render();
    }

    // Check if a path segment would collide with any positions
    checkPathCollision(from, to) {
        if (!this.avoidCollisions) return false;

        for (let element of this.elements) {
            if (element.type === 'position') {
                const distance = this.distanceToLine({ x: element.x, y: element.y }, from, to);
                if (distance < 20) { // Collision threshold (slightly larger than new position radius)
                    return true;
                }
            }
        }
        return false;
    }

    // Finish the current route
    finishRoute() {
        if (this.routeDrawingMode && this.activeRoute && this.activeRoute.path.length > 1) {
            const route = {
                type: 'route',
                path: [...this.activeRoute.path],
                color: this.color,
                id: Date.now().toString(),
                startPosition: this.activeRoute.startPosition
            };

            this.elements.push(route);
        }

        // Reset route drawing state
        this.routeDrawingMode = false;
        this.activeRoute = null;
        this.currentPath = [];
        this.previewPoint = null;
        this.isDrawing = false;

        // Update status
        if (window.footballApp) {
            const statusElement = document.getElementById('action-status');
            if (statusElement) {
                statusElement.textContent = 'Route completed. Select a position or start a new route.';
            }
        }

        this.render();
    }

    // Start editing a route point
    startRoutePointEdit(element, pointIndex) {
        // Find the original route element in the elements array
        const routeElement = this.elements.find(el =>
            el.type === 'route' &&
            el.id === element.id
        );

        if (!routeElement || pointIndex < 0 || pointIndex >= routeElement.path.length) {
            return;
        }

        this.editingRoutePoint = true;
        this.editingRoute = routeElement;
        this.editingPointIndex = pointIndex;
        this.originalPoint = { ...routeElement.path[pointIndex] };

        // Set the preview point to current position
        this.previewPoint = { ...routeElement.path[pointIndex] };

        // Update status
        if (window.footballApp) {
            const statusElement = document.getElementById('action-status');
            if (statusElement) {
                statusElement.textContent = `Editing route point ${pointIndex + 1}. Move mouse and click to reposition.`;
            }
        }

        this.render();
    }

    // Complete the route point edit
    completeRoutePointEdit() {
        if (!this.editingRoutePoint || !this.editingRoute || !this.previewPoint) {
            return;
        }

        // Apply snapping if enabled
        let newX = this.previewPoint.x;
        let newY = this.previewPoint.y;

        if (this.snapToGrid) {
            const snapped = this.snapCoordinates(newX, newY);
            newX = snapped.x;
            newY = snapped.y;
        }

        // Update the route point
        this.editingRoute.path[this.editingPointIndex] = { x: newX, y: newY };

        // Reset editing state
        this.editingRoutePoint = false;
        this.editingRoute = null;
        this.editingPointIndex = -1;
        this.originalPoint = null;
        this.previewPoint = null;

        // Update status
        if (window.footballApp) {
            const statusElement = document.getElementById('action-status');
            if (statusElement) {
                statusElement.textContent = 'Route point updated. Click on another route point to edit or change action mode.';
            }
        }

        this.render();
    }

    // Method for editing route points (drag to move)
    editRoutePoint(route, x, y) {
        // Find the closest point in the route
        let closestIndex = 0;
        let closestDistance = Infinity;

        for (let i = 0; i < route.path.length; i++) {
            const point = route.path[i];
            const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = i;
            }
        }

        // If close enough to a point, start dragging it
        if (closestDistance < 15) {
            this.isDragging = true;
            this.selectedRoutePoint = { route, index: closestIndex };
            this.dragOffset = {
                x: x - route.path[closestIndex].x,
                y: y - route.path[closestIndex].y
            };
        }
    }

    // Add a block point to the current block being drawn
    addBlockPoint(x, y) {
        if (!this.blockDrawingMode || !this.activeBlock) return;

        // Apply snapping if enabled
        if (this.snapToGrid) {
            const snapped = this.snapCoordinates(x, y);
            x = snapped.x;
            y = snapped.y;
        }

        const lastPoint = this.activeBlock.path[this.activeBlock.path.length - 1];

        // Check for collision avoidance
        if (this.avoidCollisions) {
            const avoidedPath = this.calculateAvoidancePath(lastPoint, { x, y });
            // Add intermediate points if needed to avoid positions
            for (let i = 1; i < avoidedPath.length; i++) {
                this.activeBlock.path.push(avoidedPath[i]);
            }
        } else {
            this.activeBlock.path.push({ x, y });
        }

        this.currentPath = [...this.activeBlock.path];
        this.previewPoint = null;
        this.render();
    }

    // Finish the current block
    finishBlock() {
        if (this.blockDrawingMode && this.activeBlock && this.activeBlock.path.length > 1) {
            const block = {
                type: 'block',
                path: [...this.activeBlock.path],
                color: this.color,
                id: Date.now().toString(),
                startPosition: this.activeBlock.startPosition
            };

            this.elements.push(block);
        }

        // Reset block drawing state
        this.blockDrawingMode = false;
        this.activeBlock = null;
        this.currentPath = [];
        this.previewPoint = null;
        this.isDrawing = false;

        // Update status
        if (window.footballApp) {
            const statusElement = document.getElementById('action-status');
            if (statusElement) {
                statusElement.textContent = 'Block completed. Select a position or start a new block.';
            }
        }

        this.render();
    }

    // Start editing a block point
    startBlockPointEdit(element, pointIndex) {
        // Find the original block element in the elements array
        const blockElement = this.elements.find(el =>
            el.type === 'block' &&
            el.id === element.id
        );

        if (!blockElement || pointIndex < 0 || pointIndex >= blockElement.path.length) {
            return;
        }

        this.editingBlockPoint = true;
        this.editingBlock = blockElement;
        this.editingBlockPointIndex = pointIndex;
        this.originalPoint = { ...blockElement.path[pointIndex] };

        // Set the preview point to current position
        this.previewPoint = { ...blockElement.path[pointIndex] };

        // Update status
        if (window.footballApp) {
            const statusElement = document.getElementById('action-status');
            if (statusElement) {
                statusElement.textContent = `Editing block point ${pointIndex + 1}. Move mouse and click to reposition.`;
            }
        }

        this.render();
    }

    // Complete the block point edit
    completeBlockPointEdit() {
        if (!this.editingBlockPoint || !this.editingBlock || !this.previewPoint) {
            return;
        }

        // Apply snapping if enabled
        let newX = this.previewPoint.x;
        let newY = this.previewPoint.y;

        if (this.snapToGrid) {
            const snapped = this.snapCoordinates(newX, newY);
            newX = snapped.x;
            newY = snapped.y;
        }

        // Update the block point
        this.editingBlock.path[this.editingBlockPointIndex] = { x: newX, y: newY };

        // Reset editing state
        this.editingBlockPoint = false;
        this.editingBlock = null;
        this.editingBlockPointIndex = -1;
        this.originalPoint = null;
        this.previewPoint = null;

        // Update status
        if (window.footballApp) {
            const statusElement = document.getElementById('action-status');
            if (statusElement) {
                statusElement.textContent = 'Block point updated. Click on another block point to edit or change action mode.';
            }
        }

        this.render();
    }

    // Clear all drawing modes to prevent conflicts
    clearDrawingModes() {
        this.routeDrawingMode = false;
        this.blockDrawingMode = false;
        this.activeRoute = null;
        this.activeBlock = null;
        this.previewPoint = null;
        this.isDrawing = false;
        this.currentPath = [];

        // Clear editing states
        this.editingRoutePoint = false;
        this.editingRoute = null;
        this.editingPointIndex = -1;
        this.editingBlockPoint = false;
        this.editingBlock = null;
        this.editingBlockPointIndex = -1;
        this.originalPoint = null;
    }

    // Remove existing route for a position (only one route per position)
    removeExistingRouteForPosition(position) {
        this.elements = this.elements.filter(element =>
            !(element.type === 'route' &&
                element.startPosition &&
                element.startPosition.x === position.x &&
                element.startPosition.y === position.y)
        );
    }

    // Remove existing block for a position (only one block per position)
    removeExistingBlockForPosition(position) {
        this.elements = this.elements.filter(element =>
            !(element.type === 'block' &&
                element.startPosition &&
                element.startPosition.x === position.x &&
                element.startPosition.y === position.y)
        );
    }

    // Get route or block associated with a position for editing
    getRouteForPosition(position) {
        return this.elements.find(element =>
            element.type === 'route' &&
            element.startPosition &&
            element.startPosition.x === position.x &&
            element.startPosition.y === position.y
        );
    }

    getBlockForPosition(position) {
        return this.elements.find(element =>
            element.type === 'block' &&
            element.startPosition &&
            element.startPosition.x === position.x &&
            element.startPosition.y === position.y
        );
    }

    // Change color of existing route or block
    changeRouteColor(route, newColor) {
        if (route && route.type === 'route') {
            route.color = newColor;
            this.render();
        }
    }

    changeBlockColor(block, newColor) {
        if (block && block.type === 'block') {
            block.color = newColor;
            this.render();
        }
    }

    // Method for editing block points
    editBlockPoint(block, x, y) {
        // Find the closest point in the block
        let closestIndex = 0;
        let closestDistance = Infinity;

        for (let i = 0; i < block.path.length; i++) {
            const point = block.path[i];
            const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = i;
            }
        }

        // If close enough to a point, start dragging it
        if (closestDistance < 15) {
            this.isDragging = true;
            this.selectedBlockPoint = { block, index: closestIndex };
            this.dragOffset = {
                x: x - block.path[closestIndex].x,
                y: y - block.path[closestIndex].y
            };
        }
    }

    createPosition(x, y) {
        const position = {
            type: 'position',
            x: x,
            y: y,
            shape: this.shape,
            color: this.color,
            name: document.getElementById('position-name')?.value || '',
            player: document.getElementById('player-name')?.value || '',
            id: Date.now().toString()
        }; this.elements.push(position);
        this.selectedElement = position;
        this.render();

        // Clear input fields
        if (document.getElementById('position-name')) {
            document.getElementById('position-name').value = '';
        }
        if (document.getElementById('player-name')) {
            document.getElementById('player-name').value = '';
        }
    }

    startRoute(x, y) {
        this.isDrawing = true;
        this.currentPath = [{ x, y }];
    }

    startBlock(x, y) {
        this.isDrawing = true;
        this.currentPath = [{ x, y }];
    }

    finishPath() {
        if (this.currentPath.length > 1) {
            const path = {
                type: this.tool,
                path: [...this.currentPath],
                color: this.color,
                id: Date.now().toString()
            };

            this.elements.push(path);
            this.render();
        }

        this.currentPath = [];
    }

    drawCurrentPath() {
        if (this.currentPath.length < 2) return;

        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(this.currentPath[0].x, this.currentPath[0].y);

        for (let i = 1; i < this.currentPath.length; i++) {
            this.ctx.lineTo(this.currentPath[i].x, this.currentPath[i].y);
        }

        this.ctx.stroke();

        // Draw arrow for routes
        if (this.tool === 'route' && this.currentPath.length > 1) {
            this.drawArrow(
                this.currentPath[this.currentPath.length - 2],
                this.currentPath[this.currentPath.length - 1]
            );
        }
    }

    drawArrow(from, to) {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;

        this.ctx.beginPath();
        this.ctx.moveTo(to.x, to.y);
        this.ctx.lineTo(
            to.x - arrowLength * Math.cos(angle - arrowAngle),
            to.y - arrowLength * Math.sin(angle - arrowAngle)
        );
        this.ctx.moveTo(to.x, to.y);
        this.ctx.lineTo(
            to.x - arrowLength * Math.cos(angle + arrowAngle),
            to.y - arrowLength * Math.sin(angle + arrowAngle)
        );
        this.ctx.stroke();
    }

    getElementAt(x, y) {
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const element = this.elements[i];

            if (element.type === 'position') {
                const distance = Math.sqrt(
                    Math.pow(x - element.x, 2) + Math.pow(y - element.y, 2)
                );
                if (distance <= 18) { // Updated to match new position radius
                    return element;
                }
            } else if (element.type === 'route' || element.type === 'block') {
                // First check if click is near a route point for editing
                if (element.type === 'route') {
                    for (let j = 0; j < element.path.length; j++) {
                        const pointDistance = Math.sqrt(
                            Math.pow(x - element.path[j].x, 2) + Math.pow(y - element.path[j].y, 2)
                        );
                        if (pointDistance <= 8) { // Small radius for route points
                            return {
                                ...element,
                                isRoutePoint: true,
                                pointIndex: j
                            };
                        }
                    }
                }

                // Check if click is near a block point for editing
                if (element.type === 'block') {
                    for (let j = 0; j < element.path.length; j++) {
                        const pointDistance = Math.sqrt(
                            Math.pow(x - element.path[j].x, 2) + Math.pow(y - element.path[j].y, 2)
                        );
                        if (pointDistance <= 8) { // Small radius for block points
                            return {
                                ...element,
                                isBlockPoint: true,
                                pointIndex: j
                            };
                        }
                    }
                }

                // Check if click is near the path
                for (let j = 0; j < element.path.length - 1; j++) {
                    const pointDistance = this.distanceToLine(
                        { x, y },
                        element.path[j],
                        element.path[j + 1]
                    );
                    if (pointDistance <= 10) {
                        return element;
                    }
                }
            }
        }
        return null;
    }

    distanceToLine(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;

        if (lenSq === 0) return Math.sqrt(A * A + B * B);

        let param = dot / lenSq;

        if (param < 0) {
            return Math.sqrt(A * A + B * B);
        } else if (param > 1) {
            return Math.sqrt(
                Math.pow(point.x - lineEnd.x, 2) + Math.pow(point.y - lineEnd.y, 2)
            );
        } else {
            const projection = {
                x: lineStart.x + param * C,
                y: lineStart.y + param * D
            };
            return Math.sqrt(
                Math.pow(point.x - projection.x, 2) + Math.pow(point.y - projection.y, 2)
            );
        }
    }

    render() {
        // Clear canvas and redraw field
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawField();

        // Draw all elements
        this.elements.forEach(element => {
            this.drawElement(element);
        });

        // Draw route preview if in route drawing mode
        if (this.routeDrawingMode && this.activeRoute && this.previewPoint) {
            this.drawRoutePreview();
        }

        // Draw block preview if in block drawing mode
        if (this.blockDrawingMode && this.activeBlock && this.previewPoint) {
            this.drawBlockPreview();
        }

        // Draw route editing preview if editing a route point
        if (this.editingRoutePoint && this.editingRoute && this.previewPoint) {
            this.drawRouteEditPreview();
        }

        // Draw block editing preview if editing a block point
        if (this.editingBlockPoint && this.editingBlock && this.previewPoint) {
            this.drawBlockEditPreview();
        }

        // Highlight selected element
        if (this.selectedElement) {
            this.highlightElement(this.selectedElement);
        }
    }

    drawElement(element) {
        if (element.type === 'position') {
            this.drawPosition(element);
        } else if (element.type === 'route') {
            this.drawRoute(element);
        } else if (element.type === 'block') {
            this.drawBlock(element);
        }
    }

    drawPosition(position) {
        const { x, y, shape, color, name, player } = position;
        const radius = 18; // Scaled down for more realistic proportions relative to yard lines

        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;

        switch (shape) {
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.stroke();
                break;
            case 'square':
                this.ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
                this.ctx.strokeRect(x - radius, y - radius, radius * 2, radius * 2);
                break;
            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - radius);
                this.ctx.lineTo(x - radius * 0.86, y + radius * 0.5);
                this.ctx.lineTo(x + radius * 0.86, y + radius * 0.5);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                break;
            case 'diamond':
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - radius);
                this.ctx.lineTo(x + radius, y);
                this.ctx.lineTo(x, y + radius);
                this.ctx.lineTo(x - radius, y);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                break;
            case 'x':
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.moveTo(x - radius * 0.7, y - radius * 0.7);
                this.ctx.lineTo(x + radius * 0.7, y + radius * 0.7);
                this.ctx.moveTo(x + radius * 0.7, y - radius * 0.7);
                this.ctx.lineTo(x - radius * 0.7, y + radius * 0.7);
                this.ctx.stroke();
                break;
            case 'line':
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.moveTo(x - radius, y);
                this.ctx.lineTo(x + radius, y);
                this.ctx.stroke();
                break;
        }

        // Draw position name inside the shape
        if (name) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Add text shadow for better visibility
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(name, x, y);
            this.ctx.fillText(name, x, y);
        }

        // Draw player name below the shape
        if (player) {
            this.ctx.fillStyle = '#000000';
            this.ctx.font = '11px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(player, x, y + radius + 5);
        }

        // Draw coordinates above position using the same x and y as the lineup
        this.ctx.fillStyle = '#FF6B35';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        const coordText = `(${Math.round(x)}, ${Math.round(y)})`;
        this.ctx.fillText(coordText, x, y - radius - 5);
    }

    drawRoute(route) {
        if (route.path.length < 2) return;

        this.ctx.strokeStyle = route.color;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(route.path[0].x, route.path[0].y);

        for (let i = 1; i < route.path.length; i++) {
            this.ctx.lineTo(route.path[i].x, route.path[i].y);
        }

        this.ctx.stroke();

        // Draw arrow at the end
        if (route.path.length > 1) {
            this.drawArrow(
                route.path[route.path.length - 2],
                route.path[route.path.length - 1]
            );
        }
    }

    drawRoutePreview() {
        if (!this.activeRoute || !this.previewPoint) return;

        // Draw current route being constructed
        if (this.activeRoute.path.length > 0) {
            this.ctx.strokeStyle = this.activeRoute.color;
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            // Draw existing path
            if (this.activeRoute.path.length > 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.activeRoute.path[0].x, this.activeRoute.path[0].y);
                for (let i = 1; i < this.activeRoute.path.length; i++) {
                    this.ctx.lineTo(this.activeRoute.path[i].x, this.activeRoute.path[i].y);
                }
                this.ctx.stroke();
            }

            // Draw preview line from last point to mouse
            const lastPoint = this.activeRoute.path[this.activeRoute.path.length - 1];
            this.ctx.strokeStyle = this.activeRoute.color;
            this.ctx.globalAlpha = 0.6; // Semi-transparent preview
            this.ctx.setLineDash([5, 5]); // Dashed line for preview

            this.ctx.beginPath();
            this.ctx.moveTo(lastPoint.x, lastPoint.y);
            this.ctx.lineTo(this.previewPoint.x, this.previewPoint.y);
            this.ctx.stroke();

            // Draw preview arrow
            this.ctx.globalAlpha = 0.8;
            this.drawArrow(lastPoint, this.previewPoint);

            // Reset line dash and alpha
            this.ctx.setLineDash([]);
            this.ctx.globalAlpha = 1.0;
        }
    }

    drawRouteEditPreview() {
        if (!this.editingRoute || !this.previewPoint || this.editingPointIndex < 0) return;

        // Draw the route with the edited point in preview position
        const route = this.editingRoute;

        this.ctx.strokeStyle = route.color;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Draw route with preview point
        if (route.path.length > 1) {
            this.ctx.globalAlpha = 0.7; // Semi-transparent for preview
            this.ctx.setLineDash([3, 3]); // Dashed line for preview

            this.ctx.beginPath();

            // Draw to first point (or preview if editing first point)
            const firstPoint = this.editingPointIndex === 0 ? this.previewPoint : route.path[0];
            this.ctx.moveTo(firstPoint.x, firstPoint.y);

            // Draw through all points, substituting preview point where editing
            for (let i = 1; i < route.path.length; i++) {
                const point = this.editingPointIndex === i ? this.previewPoint : route.path[i];
                this.ctx.lineTo(point.x, point.y);
            }

            this.ctx.stroke();

            // Draw preview arrow
            if (route.path.length > 1) {
                const secondToLast = this.editingPointIndex === route.path.length - 2 ?
                    this.previewPoint : route.path[route.path.length - 2];
                const last = this.editingPointIndex === route.path.length - 1 ?
                    this.previewPoint : route.path[route.path.length - 1];

                this.ctx.globalAlpha = 0.8;
                this.drawArrow(secondToLast, last);
            }

            // Draw editing point indicator
            this.ctx.globalAlpha = 1.0;
            this.ctx.setLineDash([]);
            this.ctx.fillStyle = '#ff6600';
            this.ctx.beginPath();
            this.ctx.arc(this.previewPoint.x, this.previewPoint.y, 6, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Reset settings
            this.ctx.globalAlpha = 1.0;
        }
    }

    drawBlockPreview() {
        if (!this.activeBlock || !this.previewPoint) return;

        // Draw current block being constructed
        if (this.activeBlock.path.length > 0) {
            this.ctx.strokeStyle = this.activeBlock.color;
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            // Draw existing path
            if (this.activeBlock.path.length > 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.activeBlock.path[0].x, this.activeBlock.path[0].y);
                for (let i = 1; i < this.activeBlock.path.length; i++) {
                    this.ctx.lineTo(this.activeBlock.path[i].x, this.activeBlock.path[i].y);
                }
                this.ctx.stroke();
            }

            // Draw preview line from last point to mouse
            const lastPoint = this.activeBlock.path[this.activeBlock.path.length - 1];
            this.ctx.strokeStyle = this.activeBlock.color;
            this.ctx.globalAlpha = 0.6; // Semi-transparent preview
            this.ctx.setLineDash([5, 5]); // Dashed line for preview

            this.ctx.beginPath();
            this.ctx.moveTo(lastPoint.x, lastPoint.y);
            this.ctx.lineTo(this.previewPoint.x, this.previewPoint.y);
            this.ctx.stroke();

            // Draw T-bar preview at the end point
            this.ctx.globalAlpha = 0.8;
            const angle = Math.atan2(this.previewPoint.y - lastPoint.y, this.previewPoint.x - lastPoint.x);
            const perpAngle = angle + Math.PI / 2;
            const tBarLength = 15;

            this.ctx.beginPath();
            this.ctx.moveTo(
                this.previewPoint.x - Math.cos(perpAngle) * tBarLength,
                this.previewPoint.y - Math.sin(perpAngle) * tBarLength
            );
            this.ctx.lineTo(
                this.previewPoint.x + Math.cos(perpAngle) * tBarLength,
                this.previewPoint.y + Math.sin(perpAngle) * tBarLength
            );
            this.ctx.stroke();

            // Reset line dash and alpha
            this.ctx.setLineDash([]);
            this.ctx.globalAlpha = 1.0;
        }
    }

    drawBlockEditPreview() {
        if (!this.editingBlock || !this.previewPoint || this.editingBlockPointIndex < 0) return;

        // Draw the block with the edited point in preview position
        const block = this.editingBlock;

        this.ctx.strokeStyle = block.color;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Draw block with preview point
        if (block.path.length > 1) {
            this.ctx.globalAlpha = 0.7; // Semi-transparent for preview
            this.ctx.setLineDash([3, 3]); // Dashed line for preview

            this.ctx.beginPath();

            // Draw to first point (or preview if editing first point)
            const firstPoint = this.editingBlockPointIndex === 0 ? this.previewPoint : block.path[0];
            this.ctx.moveTo(firstPoint.x, firstPoint.y);

            // Draw through all points, substituting preview point where editing
            for (let i = 1; i < block.path.length; i++) {
                const point = this.editingBlockPointIndex === i ? this.previewPoint : block.path[i];
                this.ctx.lineTo(point.x, point.y);
            }

            this.ctx.stroke();

            // Draw T-bar only at the final point with preview
            if (block.path.length >= 2) {
                const secondLastIndex = block.path.length - 2;
                const finalIndex = block.path.length - 1;

                const secondLast = this.editingBlockPointIndex === secondLastIndex ? this.previewPoint : block.path[secondLastIndex];
                const finalPoint = this.editingBlockPointIndex === finalIndex ? this.previewPoint : block.path[finalIndex];

                // Calculate perpendicular direction for T-bar
                const angle = Math.atan2(finalPoint.y - secondLast.y, finalPoint.x - secondLast.x);
                const perpAngle = angle + Math.PI / 2;
                const tBarLength = 15;

                // Draw T-bar at the final point only
                this.ctx.beginPath();
                this.ctx.moveTo(
                    finalPoint.x - Math.cos(perpAngle) * tBarLength,
                    finalPoint.y - Math.sin(perpAngle) * tBarLength
                );
                this.ctx.lineTo(
                    finalPoint.x + Math.cos(perpAngle) * tBarLength,
                    finalPoint.y + Math.sin(perpAngle) * tBarLength
                );
                this.ctx.stroke();
            }

            // Draw editing point indicator
            this.ctx.globalAlpha = 1.0;
            this.ctx.setLineDash([]);
            this.ctx.fillStyle = '#ff6600';
            this.ctx.beginPath();
            this.ctx.arc(this.previewPoint.x, this.previewPoint.y, 6, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Reset settings
            this.ctx.globalAlpha = 1.0;
        }
    }

    drawBlock(block) {
        if (block.path.length < 2) return;

        this.ctx.strokeStyle = block.color;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Draw the main line
        this.ctx.beginPath();
        this.ctx.moveTo(block.path[0].x, block.path[0].y);

        for (let i = 1; i < block.path.length; i++) {
            this.ctx.lineTo(block.path[i].x, block.path[i].y);
        }

        this.ctx.stroke();

        // Draw T-bar only at the final point to indicate blocking
        if (block.path.length >= 2) {
            const secondLast = block.path[block.path.length - 2];
            const finalPoint = block.path[block.path.length - 1];

            // Calculate perpendicular direction for T-bar
            const angle = Math.atan2(finalPoint.y - secondLast.y, finalPoint.x - secondLast.x);
            const perpAngle = angle + Math.PI / 2;
            const tBarLength = 15;

            // Draw T-bar at the final point only
            this.ctx.beginPath();
            this.ctx.moveTo(
                finalPoint.x - Math.cos(perpAngle) * tBarLength,
                finalPoint.y - Math.sin(perpAngle) * tBarLength
            );
            this.ctx.lineTo(
                finalPoint.x + Math.cos(perpAngle) * tBarLength,
                finalPoint.y + Math.sin(perpAngle) * tBarLength
            );
            this.ctx.stroke();
        }
    }

    highlightElement(element) {
        if (element.type === 'position') {
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();

            const radius = 18; // Match the updated position size

            // Match the selection reticle to the position's shape with actual size
            switch (element.shape) {
                case 'circle':
                    this.ctx.arc(element.x, element.y, radius, 0, 2 * Math.PI);
                    break;

                case 'square':
                    this.ctx.rect(element.x - radius, element.y - radius, radius * 2, radius * 2);
                    break;

                case 'triangle':
                    this.ctx.moveTo(element.x, element.y - radius);
                    this.ctx.lineTo(element.x - radius * 0.86, element.y + radius * 0.5);
                    this.ctx.lineTo(element.x + radius * 0.86, element.y + radius * 0.5);
                    this.ctx.closePath();
                    break;

                case 'diamond':
                    this.ctx.moveTo(element.x, element.y - radius);
                    this.ctx.lineTo(element.x + radius, element.y);
                    this.ctx.lineTo(element.x, element.y + radius);
                    this.ctx.lineTo(element.x - radius, element.y);
                    this.ctx.closePath();
                    break;

                case 'x':
                    this.ctx.moveTo(element.x - radius * 0.7, element.y - radius * 0.7);
                    this.ctx.lineTo(element.x + radius * 0.7, element.y + radius * 0.7);
                    this.ctx.moveTo(element.x + radius * 0.7, element.y - radius * 0.7);
                    this.ctx.lineTo(element.x - radius * 0.7, element.y + radius * 0.7);
                    break;

                case 'line':
                    this.ctx.moveTo(element.x - radius, element.y);
                    this.ctx.lineTo(element.x + radius, element.y);
                    break;

                default:
                    this.ctx.arc(element.x, element.y, radius, 0, 2 * Math.PI);
                    break;
            }

            this.ctx.stroke();
        }
    } setTool(tool) {
        this.tool = tool;
        this.selectedElement = null;
        this.originalPosition = null; // Clear original position when switching tools
        this.render();
    }

    setShape(shape) {
        this.shape = shape;
    }

    setColor(color) {
        this.color = color;
    }

    clearCanvas() {
        this.elements = [];
        this.selectedElement = null;
        this.render();
    }

    getPlayData() {
        return {
            elements: this.elements,
            canvasSize: {
                width: this.canvas.width,
                height: this.canvas.height
            }
        };
    }

    loadPlayData(data) {
        this.elements = data.elements || [];

        // Snap all positions to grid when loading
        this.elements.forEach(element => {
            if (element.type === 'position') {
                const snapped = this.snapCoordinates(element.x, element.y);
                element.x = snapped.x;
                element.y = snapped.y;
            }
        });

        this.selectedElement = null;
        this.render();
    }

    handleResize() {
        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;

        this.setupCanvas();

        // Scale existing elements
        const scaleX = this.canvas.width / oldWidth;
        const scaleY = this.canvas.height / oldHeight;

        this.elements.forEach(element => {
            if (element.type === 'position') {
                element.x *= scaleX;
                element.y *= scaleY;
            } else if (element.path) {
                element.path.forEach(point => {
                    point.x *= scaleX;
                    point.y *= scaleY;
                });
            }
        });

        // Force a complete redraw
        this.drawField();
        this.render();
    }

    deleteSelected() {
        if (this.selectedElement) {
            const index = this.elements.indexOf(this.selectedElement);
            if (index > -1) {
                this.elements.splice(index, 1);
                this.selectedElement = null;
                this.render();
            }
        }
    }

    // Default lineups for 30-yard vertical field (center line at 50%)
    getDefaultLineups() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Convert relative positions from external config to actual canvas coordinates
        const result = {};

        for (const [lineupName, lineupData] of Object.entries(DEFAULT_LINEUPS)) {
            result[lineupName] = lineupData.positions.map(pos => ({
                type: 'position',
                x: width * pos.x,
                y: height * pos.y,
                shape: pos.shape,
                color: pos.color,
                name: pos.name,
                player: ''
            }));
        }

        return result;
    }

    loadDefaultLineup(lineupName) {
        const lineups = this.getDefaultLineups();
        const lineup = lineups[lineupName];

        if (lineup) {
            this.elements = lineup.map(pos => {
                const element = {
                    ...pos,
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
                };

                // Snap position to grid when loading
                if (element.type === 'position') {
                    const snapped = this.snapCoordinates(element.x, element.y);
                    element.x = snapped.x;
                    element.y = snapped.y;
                }

                return element;
            });
            this.selectedElement = null;
            this.render();
        }
    }

    async saveCustomLineup(name) {
        if (!name.trim()) return false;

        const width = this.canvas.width;
        const height = this.canvas.height;

        // Convert positions to relative coordinates for storage
        const positions = this.elements.filter(el => el.type === 'position').map(pos => ({
            ...pos,
            // Store as relative coordinates (0-1 range)
            x: pos.x / width,
            y: pos.y / height
        }));

        const lineupData = {
            name: name,
            positions: positions,
            created: new Date().toISOString()
        };

        try {
            if (this.firebaseService && this.firebaseService.isInitialized()) {
                // Use Firebase
                await this.firebaseService.saveCustomLineup(lineupData);
            } else {
                // Fallback to localStorage
                let customLineups = JSON.parse(localStorage.getItem('customLineups') || '[]');
                // Remove existing lineup with same name
                customLineups = customLineups.filter(lineup => lineup.name !== name);
                customLineups.push(lineupData);
                localStorage.setItem('customLineups', JSON.stringify(customLineups));
            }
            return true;
        } catch (error) {
            console.error('Error saving custom lineup:', error);
            // Fallback to localStorage on error
            let customLineups = JSON.parse(localStorage.getItem('customLineups') || '[]');
            customLineups = customLineups.filter(lineup => lineup.name !== name);
            customLineups.push(lineupData);
            localStorage.setItem('customLineups', JSON.stringify(customLineups));
            return true;
        }
    }

    async getCustomLineups() {
        try {
            if (this.firebaseService && this.firebaseService.isInitialized()) {
                return await this.firebaseService.getCustomLineups();
            } else {
                return JSON.parse(localStorage.getItem('customLineups') || '[]');
            }
        } catch (error) {
            console.error('Error getting custom lineups:', error);
            return JSON.parse(localStorage.getItem('customLineups') || '[]');
        }
    }

    async loadCustomLineup(name) {
        try {
            const customLineups = await this.getCustomLineups();
            const lineup = customLineups.find(l => l.name === name);

            if (lineup) {
                const width = this.canvas.width;
                const height = this.canvas.height;

                // Convert relative coordinates back to absolute coordinates
                this.elements = lineup.positions.map(pos => {
                    const element = {
                        ...pos,
                        // Convert from relative coordinates to current canvas coordinates
                        x: pos.x * width,
                        y: pos.y * height,
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
                    };

                    // Snap position to grid when loading custom lineup
                    if (element.type === 'position') {
                        const snapped = this.snapCoordinates(element.x, element.y);
                        element.x = snapped.x;
                        element.y = snapped.y;
                    }

                    return element;
                });
                this.selectedElement = null;
                this.render();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading custom lineup:', error);
            return false;
        }
    }

    async deleteCustomLineup(name) {
        try {
            if (this.firebaseService && this.firebaseService.isInitialized()) {
                await this.firebaseService.deleteCustomLineup(name);
            } else {
                let customLineups = JSON.parse(localStorage.getItem('customLineups') || '[]');
                customLineups = customLineups.filter(lineup => lineup.name !== name);
                localStorage.setItem('customLineups', JSON.stringify(customLineups));
            }
        } catch (error) {
            console.error('Error deleting custom lineup:', error);
            // Fallback to localStorage on error
            let customLineups = JSON.parse(localStorage.getItem('customLineups') || '[]');
            customLineups = customLineups.filter(lineup => lineup.name !== name);
            localStorage.setItem('customLineups', JSON.stringify(customLineups));
        }
    }

    // Action mode control methods
    setActionMode(mode) {
        // Clear original position when switching away from move mode
        if (this.actionMode === 'move' && mode !== 'move') {
            this.originalPosition = null;
        }

        this.actionMode = mode;
        // Visual feedback could be added here
        console.log(`Action mode set to: ${mode}`);

        // Re-render to maintain selection highlight
        this.render();
    }

    getActionMode() {
        return this.actionMode;
    }

    // Collision avoidance control
    setCollisionAvoidance(enabled) {
        this.avoidCollisions = enabled;
        console.log(`Collision avoidance: ${enabled ? 'enabled' : 'disabled'}`);
    }

    getCollisionAvoidance() {
        return this.avoidCollisions;
    }

    // Snap to grid control
    setSnapToGrid(enabled) {
        this.snapToGrid = enabled;
        console.log(`Snap to grid: ${enabled ? 'enabled' : 'disabled'}`);
    }

    getSnapToGrid() {
        return this.snapToGrid;
    }

    // Snap coordinates to nearest grid line (yard lines, half-yard, quarter-yard)
    snapCoordinates(x, y) {
        if (!this.snapToGrid) return { x, y };

        const yardSpacing = this.canvas.height / 30; // 30 yards total (15 above + 15 below center)
        const halfYardSpacing = yardSpacing / 2;
        const quarterYardSpacing = yardSpacing / 4;

        // Snap to nearest quarter-yard line first, then half-yard, then full yard
        const snappedY = Math.round(y / quarterYardSpacing) * quarterYardSpacing;

        // For horizontal snapping, use hash marks spacing
        const hashSpacing = this.canvas.width / 53.3; // 53.3 yards field width
        const snappedX = Math.round(x / hashSpacing) * hashSpacing;

        return { x: snappedX, y: snappedY };
    }

    // Route segment management
    removeLastRouteSegment() {
        if (this.isDrawing && this.currentPath.length > 2) {
            this.currentPath.pop(); // Remove last point
            this.render();
            this.drawCurrentPath();
        }
    }

    // Delete selected element (enhanced for routes)
    deleteSelected() {
        if (this.selectedElement) {
            const index = this.elements.indexOf(this.selectedElement);
            if (index > -1) {
                this.elements.splice(index, 1);
                this.selectedElement = null;
                this.render();
            }
        }
    }

    // Update UI controls to reflect selected position properties
    updateUIForSelectedPosition() {
        if (!this.selectedElement || this.selectedElement.type !== 'position') return;

        const position = this.selectedElement;

        // Update position name input
        const positionNameInput = document.getElementById('position-name');
        if (positionNameInput) {
            positionNameInput.value = position.name || '';
        }

        // Update player name input
        const playerNameInput = document.getElementById('player-name');
        if (playerNameInput) {
            playerNameInput.value = position.player || '';
        }

        // Update shape selection
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const shapeBtn = document.querySelector(`[data-shape="${position.shape}"]`);
        if (shapeBtn) {
            shapeBtn.classList.add('active');
        }

        // Update color selection
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const colorBtn = document.querySelector(`[data-color="${position.color}"]`);
        if (colorBtn) {
            colorBtn.classList.add('active');
        }
    }

    // Apply current UI settings to selected position
    applyUIToSelectedPosition() {
        if (!this.selectedElement || this.selectedElement.type !== 'position') return;

        const position = this.selectedElement;

        // Apply position name
        const positionNameInput = document.getElementById('position-name');
        if (positionNameInput) {
            position.name = positionNameInput.value;
        }

        // Apply player name
        const playerNameInput = document.getElementById('player-name');
        if (playerNameInput) {
            position.player = playerNameInput.value;
        }

        // Apply current shape and color from app state
        if (window.footballApp) {
            position.shape = window.footballApp.currentShape;
            position.color = window.footballApp.currentColor;
        }

        this.render();
    }

    // Enhanced setShape method to apply to selected position
    setShape(shape) {
        this.shape = shape;
        if (this.selectedElement && this.selectedElement.type === 'position') {
            this.selectedElement.shape = shape;
            this.render();
        }
    }

    // Enhanced setColor method to apply to selected position
    setColor(color) {
        this.color = color;
        if (this.selectedElement && this.selectedElement.type === 'position') {
            this.selectedElement.color = color;
            this.render();
        }
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (window.canvasManager) {
        switch (e.key) {
            case 'Delete':
                window.canvasManager.deleteSelected();
                break;
            case 'Enter':
                if (window.canvasManager.isDrawing) {
                    window.canvasManager.finishDrawing();
                }
                break;
            case 'Backspace':
                if (window.canvasManager.isDrawing) {
                    e.preventDefault();
                    window.canvasManager.removeLastRouteSegment();
                }
                break;
            case 'Escape':
                if (window.canvasManager.isDrawing) {
                    window.canvasManager.currentPath = [];
                    window.canvasManager.isDrawing = false;
                    window.canvasManager.activeRoute = null;
                    window.canvasManager.render();
                }
                break;
        }
    }
});
