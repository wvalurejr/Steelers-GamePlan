// Canvas Manager for Football Field Drawing
class CanvasManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.elements = [];
        this.selectedElement = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.tool = 'select';
        this.actionMode = 'move'; // 'move', 'route', 'block'
        this.shape = 'circle';
        this.color = '#000000';
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.currentPath = [];
        this.activeRoute = null; // For multi-segment routes
        this.avoidCollisions = true; // Default collision avoidance

        this.init();
    }

    init() {
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

        let canvasHeight = Math.min(700, containerRect.height - 40);
        let canvasWidth = canvasHeight * fieldAspectRatio;

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

    drawField() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Field background
        this.ctx.fillStyle = '#2d5016';
        this.ctx.fillRect(0, 0, width, height);

        // Field lines for vertical 30-yard field (15 yards each side of center)
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;

        // Center line (at middle of field)
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, height / 2);
        this.ctx.lineTo(width, height / 2);
        this.ctx.stroke();

        // 5-yard lines above center
        this.ctx.lineWidth = 1;
        for (let i = 1; i <= 3; i++) {
            const y = height / 2 - (height / 6) * i; // 5, 10, 15 yard lines above center
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }

        // 5-yard lines below center
        for (let i = 1; i <= 3; i++) {
            const y = height / 2 + (height / 6) * i; // 5, 10, 15 yard lines below center
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }

        // 10-yard lines (thicker)
        this.ctx.lineWidth = 2;
        const tenYardAbove = height / 2 - (height / 3); // 10 yard line above center
        const tenYardBelow = height / 2 + (height / 3); // 10 yard line below center

        this.ctx.beginPath();
        this.ctx.moveTo(0, tenYardAbove);
        this.ctx.lineTo(width, tenYardAbove);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(0, tenYardBelow);
        this.ctx.lineTo(width, tenYardBelow);
        this.ctx.stroke();

        // Hash marks (horizontal lines across the field)
        const hashLength = width * 0.08;
        this.ctx.lineWidth = 1;

        // Draw hash marks every yard
        for (let i = 0; i <= 6; i++) {
            const yAbove = height / 2 - (height / 6) * i;
            const yBelow = height / 2 + (height / 6) * i;

            // Left hash marks
            this.ctx.beginPath();
            this.ctx.moveTo(width * 0.35, yAbove);
            this.ctx.lineTo(width * 0.35 + hashLength, yAbove);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(width * 0.35, yBelow);
            this.ctx.lineTo(width * 0.35 + hashLength, yBelow);
            this.ctx.stroke();

            // Right hash marks
            this.ctx.beginPath();
            this.ctx.moveTo(width * 0.65 - hashLength, yAbove);
            this.ctx.lineTo(width * 0.65, yAbove);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(width * 0.65 - hashLength, yBelow);
            this.ctx.lineTo(width * 0.65, yBelow);
            this.ctx.stroke();
        }

        // Sidelines
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, height);
        this.ctx.moveTo(width, 0);
        this.ctx.lineTo(width, height);
        this.ctx.stroke();

        // End lines
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(width, 0);
        this.ctx.moveTo(0, height);
        this.ctx.lineTo(width, height);
        this.ctx.stroke();
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

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
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isDragging && this.selectedElement && this.actionMode === 'move') {
            this.selectedElement.x = x - this.dragOffset.x;
            this.selectedElement.y = y - this.dragOffset.y;
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
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isDrawing && (this.actionMode === 'route' || this.actionMode === 'block' || this.tool === 'route' || this.tool === 'block')) {
            // Don't finish immediately - allow for multi-segment drawing
            // Double-click or right-click will finish the path
        } else {
            this.finishDrawing();
        }

        this.isDragging = false;
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

        // Cancel any pending operations
        if (this.isDrawing) {
            this.currentPath = [];
            this.isDrawing = false;
            this.activeRoute = null;
        }

        // Deselect current position
        this.selectedElement = null;
        this.isDragging = false;

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

    handleSelect(x, y) {
        const element = this.getElementAt(x, y);

        if (element) {
            this.selectedElement = element;
            this.isDragging = true;
            this.dragOffset.x = x - element.x;
            this.dragOffset.y = y - element.y;
        } else {
            this.selectedElement = null;
        }

        this.render();
    }

    // New method to handle selection with different action modes
    handleSelectWithAction(x, y) {
        const element = this.getElementAt(x, y);

        if (element && element.type === 'position') {
            // Keep the position selected for modification
            this.selectedElement = element;

            switch (this.actionMode) {
                case 'move':
                    this.isDragging = true;
                    this.dragOffset.x = x - element.x;
                    this.dragOffset.y = y - element.y;
                    break;
                case 'route':
                    this.startRouteFromPosition(element, x, y);
                    break;
                case 'block':
                    this.startBlockFromPosition(element, x, y);
                    break;
            }

            // Update UI to reflect selected position properties
            this.updateUIForSelectedPosition();

            // Update status in app
            if (window.footballApp) {
                window.footballApp.updateSelectionStatus(element);
            }
        } else if (!this.isDrawing) {
            // Only deselect if we're not in the middle of drawing
            // Right-click will handle deselection during drawing
            // Keep current selection if clicking empty space
        }

        this.render();
    }

    // Start a route from a selected position
    startRouteFromPosition(position, x, y) {
        this.isDrawing = true;
        this.currentPath = [{ x: position.x, y: position.y }];
        this.activeRoute = {
            type: 'route',
            startPosition: position,
            segments: []
        };
    }

    // Start a block from a selected position
    startBlockFromPosition(position, x, y) {
        this.isDrawing = true;
        this.currentPath = [{ x: position.x, y: position.y }];
        this.activeRoute = {
            type: 'block',
            startPosition: position,
            segments: []
        };
    }

    // Check if a path segment would collide with any positions
    checkPathCollision(from, to) {
        if (!this.avoidCollisions) return false;

        for (let element of this.elements) {
            if (element.type === 'position') {
                const distance = this.distanceToLine({ x: element.x, y: element.y }, from, to);
                if (distance < 25) { // Collision threshold (slightly larger than position radius)
                    return true;
                }
            }
        }
        return false;
    }

    // Finish the current drawing operation
    finishDrawing() {
        if (this.isDrawing && this.currentPath.length > 1) {
            const path = {
                type: this.actionMode === 'route' ? 'route' : (this.actionMode === 'block' ? 'block' : this.tool),
                path: [...this.currentPath],
                color: this.color,
                id: Date.now().toString(),
                startPosition: this.activeRoute?.startPosition || null
            };

            this.elements.push(path);
            this.render();
        }

        this.currentPath = [];
        this.isDrawing = false;
        this.activeRoute = null;
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
        };

        this.elements.push(position);
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
                if (distance <= 22) { // Updated to match larger shape radius
                    return element;
                }
            } else if (element.type === 'route' || element.type === 'block') {
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
        const radius = 22; // Larger shapes for better visibility

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

        // Draw T-bars at each segment end to indicate blocking
        for (let i = 1; i < block.path.length; i++) {
            const from = block.path[i - 1];
            const to = block.path[i];

            // Calculate perpendicular direction for T-bar
            const angle = Math.atan2(to.y - from.y, to.x - from.x);
            const perpAngle = angle + Math.PI / 2;
            const tBarLength = 15;

            // Draw T-bar at the end point
            this.ctx.beginPath();
            this.ctx.moveTo(
                to.x - Math.cos(perpAngle) * tBarLength,
                to.y - Math.sin(perpAngle) * tBarLength
            );
            this.ctx.lineTo(
                to.x + Math.cos(perpAngle) * tBarLength,
                to.y + Math.sin(perpAngle) * tBarLength
            );
            this.ctx.stroke();
        }
    }

    highlightElement(element) {
        if (element.type === 'position') {
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(element.x, element.y, 20, 0, 2 * Math.PI);
            this.ctx.stroke();
        }
    }

    setTool(tool) {
        this.tool = tool;
        this.selectedElement = null;
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
            this.elements = lineup.map(pos => ({
                ...pos,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
            }));
            this.selectedElement = null;
            this.render();
        }
    }

    saveCustomLineup(name) {
        if (!name.trim()) return false;

        const lineupData = {
            name: name,
            positions: this.elements.filter(el => el.type === 'position'),
            created: new Date().toISOString()
        };

        let customLineups = JSON.parse(localStorage.getItem('customLineups') || '[]');

        // Remove existing lineup with same name
        customLineups = customLineups.filter(lineup => lineup.name !== name);
        customLineups.push(lineupData);

        localStorage.setItem('customLineups', JSON.stringify(customLineups));
        return true;
    }

    getCustomLineups() {
        return JSON.parse(localStorage.getItem('customLineups') || '[]');
    }

    loadCustomLineup(name) {
        const customLineups = this.getCustomLineups();
        const lineup = customLineups.find(l => l.name === name);

        if (lineup) {
            this.elements = lineup.positions.map(pos => ({
                ...pos,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
            }));
            this.selectedElement = null;
            this.render();
            return true;
        }
        return false;
    }

    deleteCustomLineup(name) {
        let customLineups = this.getCustomLineups();
        customLineups = customLineups.filter(lineup => lineup.name !== name);
        localStorage.setItem('customLineups', JSON.stringify(customLineups));
    }

    // Action mode control methods
    setActionMode(mode) {
        this.actionMode = mode;
        // Visual feedback could be added here
        console.log(`Action mode set to: ${mode}`);
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
