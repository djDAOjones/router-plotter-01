// Route Plotter Application
class RoutePlotter {
    constructor() {
        this.canvas = document.getElementById('mapCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.image = null;
        this.pathPoints = [];  // All click points
        this.waypoints = [];    // Named major waypoints
        this.isAnimating = false;
        this.isPaused = false;
        this.animationProgress = 0;
        this.currentDistance = 0;  // Current distance traveled in pixels
        this.baseSpeed = 1;  // 1 = 5 seconds to cross full width
        this.speedMultipliers = [0.25, 0.5, 1, 2, 4];
        this.currentSpeedIndex = 2;  // Default to 1x
        this.lineColor = '#FF6B6B';
        this.lineThickness = 5;
        this.lastAnimationTime = 0;
        this.pauseAtWaypoints = false;
        this.pauseDuration = 2;  // seconds
        this.currentPauseTime = 0;
        this.isPausingAtWaypoint = false;
        this.firstWaypointName = '';
        this.pendingWaypointIndex = null;
        this.showNamesAlways = true;  // Show waypoint names from start
        this.showBeacons = false;  // Show beacon animations
        this.beacons = [];  // Active beacon animations
        this.visitedWaypoints = new Set();  // Track which waypoints have been visited
        this.useSmoothing = false;  // Use Catmull-Rom path smoothing
        this.imageName = null;  // Store image filename
        this.imageData = null;  // Store base64 image data
        this.db = null;  // IndexedDB database
        
        this.initDatabase();
        this.showInitialModal();
    }

    initDatabase() {
        const request = indexedDB.open('RoutePlotterDB', 1);
        
        request.onerror = () => {
            console.error('Database failed to open');
        };
        
        request.onsuccess = () => {
            this.db = request.result;
            console.log('Database opened successfully');
        };
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('saves')) {
                const objectStore = db.createObjectStore('saves', { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('name', 'name', { unique: false });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    }

    showInitialModal() {
        const modal = document.getElementById('initialModal');
        const input = document.getElementById('initialWaypointInput');
        const startBtn = document.getElementById('startApp');
        
        startBtn.addEventListener('click', () => {
            this.firstWaypointName = input.value.trim() || 'Start';
            modal.classList.remove('active');
            this.initializeEventListeners();
            this.setupDragDrop();
        });
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') startBtn.click();
        });
    }

    setupDragDrop() {
        const dropZone = document.getElementById('canvasWrapper');
        const placeholder = document.getElementById('placeholder');
        const fileInput = document.getElementById('imageUpload');

        // Make placeholder clickable
        placeholder.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop events
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.handleImageFile(files[0]);
            }
        });
    }

    initializeEventListeners() {
        // Image upload
        document.getElementById('imageUpload').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.handleImageFile(e.target.files[0]);
            }
        });
        
        // Canvas click for path points
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // Style controls
        document.getElementById('lineColor').addEventListener('input', (e) => {
            this.lineColor = e.target.value;
            this.redraw();
        });
        
        document.getElementById('lineThickness').addEventListener('input', (e) => {
            this.lineThickness = parseInt(e.target.value);
            document.getElementById('thicknessValue').textContent = e.target.value;
            this.redraw();
        });
        
        // Playback controls
        document.getElementById('playPauseBtn').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetAnimation());
        document.getElementById('togglePauseMode').addEventListener('click', () => this.togglePauseMode());
        
        // Speed slider
        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.currentSpeedIndex = parseInt(e.target.value);
            this.updateSpeedDisplay();
        });
        
        // Pause duration
        document.getElementById('pauseDuration').addEventListener('change', (e) => {
            this.pauseDuration = parseInt(e.target.value);
        });
        
        // Display options
        document.getElementById('toggleNamesVisibility').addEventListener('click', () => this.toggleNamesVisibility());
        document.getElementById('toggleBeacons').addEventListener('click', () => this.toggleBeacons());
        document.getElementById('toggleSmoothing').addEventListener('click', () => this.toggleSmoothing());
        
        // Design controls
        document.getElementById('newWaypointBtn').addEventListener('click', () => this.createNewWaypoint());
        document.getElementById('undoBtn').addEventListener('click', () => this.undoPoint());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        
        // Save/Load/Export
        document.getElementById('saveLocalBtn').addEventListener('click', () => this.showSaveDialog());
        document.getElementById('manageSavesBtn').addEventListener('click', () => this.showSaveManager());
        document.getElementById('exportJSONBtn').addEventListener('click', () => this.exportToJSON());
        document.getElementById('importJSONBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', (e) => this.handleImport(e));
        document.getElementById('exportBtn').addEventListener('click', () => this.exportVideo());
        
        // Save name modal
        document.getElementById('confirmSaveName').addEventListener('click', () => this.saveLocally());
        document.getElementById('cancelSaveName').addEventListener('click', () => {
            document.getElementById('saveNameModal').classList.remove('active');
        });
        document.getElementById('saveNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveLocally();
        });
        
        // Save manager modal
        document.getElementById('closeSaveManager').addEventListener('click', () => {
            document.getElementById('saveManagerModal').classList.remove('active');
        });
        
        // Demo buttons (placeholders for now)
        document.getElementById('demo1Btn').addEventListener('click', () => {
            alert('Demo 1 - Coming in next iteration');
        });
        document.getElementById('demo2Btn').addEventListener('click', () => {
            alert('Demo 2 - Coming in next iteration');
        });
        document.getElementById('demo3Btn').addEventListener('click', () => {
            alert('Demo 3 - Coming in next iteration');
        });
        
        // Waypoint list toggle
        document.getElementById('toggleWaypoints').addEventListener('click', () => this.toggleWaypointList());
        
        // Waypoint modal
        document.getElementById('saveWaypointName').addEventListener('click', () => this.saveWaypointName());
        document.getElementById('cancelWaypoint').addEventListener('click', () => this.cancelWaypoint());
        document.getElementById('waypointNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveWaypointName();
        });
    }

    updateSpeedDisplay() {
        const speed = this.speedMultipliers[this.currentSpeedIndex];
        document.getElementById('speedDisplay').textContent = speed + 'x';
    }

    handleImageFile(file) {
        this.imageName = file.name;  // Store image filename
        const reader = new FileReader();
        reader.onload = (e) => {
            this.imageData = e.target.result;  // Store base64 image data
            const img = new Image();
            img.onload = () => {
                this.image = img;
                this.setupCanvas();
                this.redraw();
                document.getElementById('placeholder').classList.add('hidden');
                this.updateButtonStates();
            };
            img.src = this.imageData;
        };
        reader.readAsDataURL(file);
    }

    setupCanvas() {
        // Set canvas to actual image dimensions
        this.canvas.width = this.image.width;
        this.canvas.height = this.image.height;
        
        // Let CSS handle the responsive sizing
        this.canvas.style.width = '';
        this.canvas.style.height = '';
    }

    handleCanvasClick(event) {
        if (!this.image) return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        // Add as path point, not waypoint
        this.pathPoints.push({ x, y });
        
        // If this is the first point, automatically make it a waypoint
        if (this.pathPoints.length === 1) {
            this.waypoints.push({
                index: 0,
                name: this.firstWaypointName
            });
        }
        
        this.redraw();
        this.updateWaypointList();
        this.updateButtonStates();
    }

    createNewWaypoint() {
        if (this.pathPoints.length === 0) return;
        
        this.pendingWaypointIndex = this.pathPoints.length - 1;
        this.showWaypointModal();
    }

    showWaypointModal() {
        const modal = document.getElementById('waypointModal');
        const input = document.getElementById('waypointNameInput');
        modal.classList.add('active');
        input.value = '';
        input.focus();
    }

    hideWaypointModal() {
        document.getElementById('waypointModal').classList.remove('active');
    }

    saveWaypointName() {
        const name = document.getElementById('waypointNameInput').value.trim();
        if (name && this.pendingWaypointIndex !== null) {
            this.waypoints.push({
                index: this.pendingWaypointIndex,
                name: name
            });
            this.pendingWaypointIndex = null;
            this.redraw();
            this.updateWaypointList();
            this.updateButtonStates();
        }
        this.hideWaypointModal();
    }

    cancelWaypoint() {
        this.pendingWaypointIndex = null;
        this.hideWaypointModal();
    }

    toggleNamesVisibility() {
        this.showNamesAlways = !this.showNamesAlways;
        const btn = document.getElementById('toggleNamesVisibility');
        if (this.showNamesAlways) {
            btn.classList.remove('active');
            document.getElementById('namesVisibilityText').textContent = 'Names: Always';
        } else {
            btn.classList.add('active');
            document.getElementById('namesVisibilityText').textContent = 'Names: On Arrival';
        }
        this.redraw();
    }

    toggleBeacons() {
        this.showBeacons = !this.showBeacons;
        const btn = document.getElementById('toggleBeacons');
        if (this.showBeacons) {
            btn.classList.add('active');
            document.getElementById('beaconsText').textContent = 'Beacons: On';
        } else {
            btn.classList.remove('active');
            document.getElementById('beaconsText').textContent = 'Beacons: Off';
            this.beacons = [];  // Clear existing beacons
        }
    }

    toggleSmoothing() {
        this.useSmoothing = !this.useSmoothing;
        const btn = document.getElementById('toggleSmoothing');
        if (this.useSmoothing) {
            btn.classList.add('active');
            document.getElementById('smoothingText').textContent = 'Smoothing: On';
        } else {
            btn.classList.remove('active');
            document.getElementById('smoothingText').textContent = 'Smoothing: Off';
        }
        // Smoothing only affects playback, not static route display
    }

    addBeacon(x, y) {
        if (!this.showBeacons) return;
        
        // Add new beacon animation
        this.beacons.push({
            x: x,
            y: y,
            radius: 0,
            opacity: 1,
            startTime: performance.now()
        });
    }

    updateBeacons(currentTime) {
        if (!this.showBeacons) return;
        
        // Update existing beacons
        this.beacons = this.beacons.filter(beacon => {
            const elapsed = (currentTime - beacon.startTime) / 1000;  // Convert to seconds
            beacon.radius = elapsed * 100;  // Expand at 100 pixels per second (doubled)
            beacon.opacity = Math.max(0, 1 - elapsed / 4);  // Fade out over 4 seconds (doubled duration)
            return beacon.opacity > 0;
        });
    }

    drawBeacons() {
        if (!this.showBeacons) return;
        
        this.beacons.forEach(beacon => {
            this.ctx.save();
            this.ctx.globalAlpha = beacon.opacity;
            this.ctx.strokeStyle = this.lineColor;
            this.ctx.lineWidth = 6;  // Much bolder (was 2)
            
            // Draw multiple concentric circles (doubled spacing)
            for (let i = 0; i < 3; i++) {
                const r = beacon.radius - i * 30;  // Doubled spacing (was 15)
                if (r > 0) {
                    this.ctx.beginPath();
                    this.ctx.arc(beacon.x, beacon.y, r, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            }
            
            this.ctx.restore();
        });
    }

    redraw() {
        if (!this.image) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.image, 0, 0);

        if (this.pathPoints.length > 0) {
            this.drawRoute();
            this.drawPoints();
        }
        
        this.drawBeacons();
    }

    drawRoute() {
        if (this.pathPoints.length < 2) return;

        // Static route always uses straight lines (no smoothing)
        this.ctx.strokeStyle = this.lineColor;
        this.ctx.lineWidth = this.lineThickness;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        
        for (let i = 1; i < this.pathPoints.length; i++) {
            this.ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        
        this.ctx.stroke();
    }

    createSmoothPath() {
        if (this.pathPoints.length < 2) return this.pathPoints;

        const smoothPath = [];
        const pointsPerSegment = 20;  // Interpolate between points

        if (this.useSmoothing) {
            // Catmull-Rom spline with 50% smoothing strength
            const tension = 0.5;  // Standard tension for balanced smoothing
            
            for (let i = 0; i < this.pathPoints.length - 1; i++) {
                const p0 = this.pathPoints[Math.max(i - 1, 0)];
                const p1 = this.pathPoints[i];
                const p2 = this.pathPoints[i + 1];
                const p3 = this.pathPoints[Math.min(i + 2, this.pathPoints.length - 1)];

                for (let t = 0; t < pointsPerSegment; t++) {
                    const segment = t / pointsPerSegment;
                    const point = this.catmullRom(p0, p1, p2, p3, segment, tension);
                    smoothPath.push(point);
                }
            }
        } else {
            // Linear interpolation between points (no smoothing)
            for (let i = 0; i < this.pathPoints.length - 1; i++) {
                const p1 = this.pathPoints[i];
                const p2 = this.pathPoints[i + 1];

                for (let t = 0; t < pointsPerSegment; t++) {
                    const ratio = t / pointsPerSegment;
                    const point = {
                        x: p1.x + (p2.x - p1.x) * ratio,
                        y: p1.y + (p2.y - p1.y) * ratio
                    };
                    smoothPath.push(point);
                }
            }
        }

        smoothPath.push(this.pathPoints[this.pathPoints.length - 1]);
        return smoothPath;
    }

    calculatePathLength(path) {
        let totalLength = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const dx = path[i + 1].x - path[i].x;
            const dy = path[i + 1].y - path[i].y;
            totalLength += Math.sqrt(dx * dx + dy * dy);
        }
        return totalLength;
    }

    // Build array of cumulative distances for each point in path
    buildDistanceMap(path) {
        const distances = [0];
        let cumulative = 0;
        
        for (let i = 1; i < path.length; i++) {
            const dx = path[i].x - path[i - 1].x;
            const dy = path[i].y - path[i - 1].y;
            const segmentLength = Math.sqrt(dx * dx + dy * dy);
            cumulative += segmentLength;
            distances.push(cumulative);
        }
        
        return distances;
    }

    // Find position on path at given distance with easing between waypoints
    getPositionAtDistance(path, distances, targetDistance) {
        const totalDistance = distances[distances.length - 1];
        
        if (targetDistance <= 0) return { ...path[0], progress: 0 };
        if (targetDistance >= totalDistance) return { ...path[path.length - 1], progress: 1 };
        
        // Find segment containing target distance
        for (let i = 0; i < distances.length - 1; i++) {
            if (targetDistance >= distances[i] && targetDistance <= distances[i + 1]) {
                const segmentStart = distances[i];
                const segmentEnd = distances[i + 1];
                const segmentLength = segmentEnd - segmentStart;
                const distanceInSegment = targetDistance - segmentStart;
                const t = distanceInSegment / segmentLength;
                
                // Apply easing if within waypoint segments
                const easedT = this.applyWaypointEasing(i, t, path.length);
                
                // Interpolate position
                const x = path[i].x + (path[i + 1].x - path[i].x) * easedT;
                const y = path[i].y + (path[i + 1].y - path[i].y) * easedT;
                
                return { x, y, progress: targetDistance / totalDistance };
            }
        }
        
        return { ...path[path.length - 1], progress: 1 };
    }

    // Apply smooth easing between waypoints
    applyWaypointEasing(segmentIndex, t, pathLength) {
        if (this.waypoints.length === 0) return t;
        
        const pointsPerSegment = 20;
        const currentPointIndex = Math.floor(segmentIndex / pointsPerSegment);
        
        // Find the waypoint segment we're in (between two waypoints)
        let prevWaypointIndex = -1;
        let nextWaypointIndex = this.pathPoints.length;
        
        for (const wp of this.waypoints) {
            if (wp.index <= currentPointIndex) {
                prevWaypointIndex = wp.index;
            }
            if (wp.index > currentPointIndex && nextWaypointIndex === this.pathPoints.length) {
                nextWaypointIndex = wp.index;
            }
        }
        
        // Only apply easing if we're between two waypoints
        if (prevWaypointIndex >= 0 && nextWaypointIndex < this.pathPoints.length) {
            const segmentLength = nextWaypointIndex - prevWaypointIndex;
            const positionInSegment = (currentPointIndex - prevWaypointIndex) / segmentLength;
            
            // Ease in (first 30% of journey between waypoints)
            if (positionInSegment < 0.3) {
                const easeT = positionInSegment / 0.3;
                const eased = easeT * easeT;  // Quadratic ease in
                return t * eased;
            }
            // Ease out (last 30% of journey between waypoints)
            else if (positionInSegment > 0.7) {
                const easeT = (positionInSegment - 0.7) / 0.3;
                const eased = 1 - (1 - easeT) * (1 - easeT);  // Quadratic ease out
                return t * eased;
            }
        }
        
        return t;  // Constant speed in middle section
    }

    catmullRom(p0, p1, p2, p3, t, tension) {
        const t2 = t * t;
        const t3 = t2 * t;

        const v0 = (p2.x - p0.x) * tension;
        const v1 = (p3.x - p1.x) * tension;
        const x = (2 * p1.x - 2 * p2.x + v0 + v1) * t3 +
                  (-3 * p1.x + 3 * p2.x - 2 * v0 - v1) * t2 +
                  v0 * t + p1.x;

        const v0y = (p2.y - p0.y) * tension;
        const v1y = (p3.y - p1.y) * tension;
        const y = (2 * p1.y - 2 * p2.y + v0y + v1y) * t3 +
                  (-3 * p1.y + 3 * p2.y - 2 * v0y - v1y) * t2 +
                  v0y * t + p1.y;

        return { x, y };
    }

    drawPoints() {
        // Only draw waypoints (not intermediate path points)
        this.waypoints.forEach(waypoint => {
            const point = this.pathPoints[waypoint.index];
            if (!point) return;
            
            // Check if we should show the name
            const shouldShowName = this.showNamesAlways || this.visitedWaypoints.has(waypoint.index);
            
            // Draw waypoint circle
            this.ctx.fillStyle = this.lineColor;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, this.lineThickness * 1.8, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw white border
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // Draw label if appropriate
            if (shouldShowName) {
                this.ctx.fillStyle = 'white';
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 3;
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.strokeText(waypoint.name, point.x, point.y - this.lineThickness * 3);
                this.ctx.fillText(waypoint.name, point.x, point.y - this.lineThickness * 3);
            }
        });
    }

    togglePlayPause() {
        if (this.pathPoints.length < 2) return;
        
        if (this.isAnimating && !this.isPaused) {
            // Pause
            this.isPaused = true;
            this.updatePlayPauseButton();
        } else {
            // Play/Resume
            this.isAnimating = true;
            this.isPaused = false;
            this.lastAnimationTime = performance.now();
            this.updatePlayPauseButton();
            this.animate();
        }
    }

    togglePauseMode() {
        this.pauseAtWaypoints = !this.pauseAtWaypoints;
        const btn = document.getElementById('togglePauseMode');
        if (this.pauseAtWaypoints) {
            btn.classList.add('active');
            document.getElementById('pauseModeText').textContent = 'Continuous';
        } else {
            btn.classList.remove('active');
            document.getElementById('pauseModeText').textContent = 'Pause at Waypoints';
        }
    }

    updatePlayPauseButton() {
        const btn = document.getElementById('playPauseBtn');
        const icon = document.getElementById('playPauseIcon');
        const text = document.getElementById('playPauseText');
        
        if (this.isAnimating && !this.isPaused) {
            icon.textContent = '⏸️';
            text.textContent = 'Pause';
            btn.classList.add('paused');
        } else {
            icon.textContent = '▶️';
            text.textContent = 'Play';
            btn.classList.remove('paused');
        }
    }

    resetAnimation() {
        // Stop animation
        this.isAnimating = false;
        this.isPaused = true;  // Set to paused state
        this.animationProgress = 0;
        this.currentDistance = 0;
        this.currentPauseTime = 0;
        this.isPausingAtWaypoint = false;
        this.visitedWaypoints.clear();
        this.beacons = [];
        
        // Clear the canvas and redraw without the route
        if (this.image) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.image, 0, 0);
            // Only draw waypoints, not the route
            this.drawPoints();
        }
        
        this.updatePlayPauseButton();
        this.updateButtonStates();
    }

    animate(currentTime = performance.now()) {
        if (!this.isAnimating || this.isPaused) return;

        const deltaTime = (currentTime - this.lastAnimationTime) / 1000;
        this.lastAnimationTime = currentTime;

        // Update beacon animations
        this.updateBeacons(currentTime);

        const smoothPath = this.createSmoothPath();
        const distances = this.buildDistanceMap(smoothPath);
        const totalDistance = distances[distances.length - 1];

        // Handle pause at waypoint
        if (this.isPausingAtWaypoint) {
            this.currentPauseTime += deltaTime;
            if (this.currentPauseTime >= this.pauseDuration) {
                this.isPausingAtWaypoint = false;
                this.currentPauseTime = 0;
            }
            // Draw at current position during pause
            const position = this.getPositionAtDistance(smoothPath, distances, this.currentDistance);
            this.animationProgress = position.progress;
            this.drawAnimatedRoute(smoothPath, this.animationProgress);
            requestAnimationFrame((time) => this.animate(time));
            return;
        }

        // Calculate constant speed movement
        const basePixelsPerSecond = 200;  // Base speed: 200 pixels per second at 1x
        const speedMultiplier = this.speedMultipliers[this.currentSpeedIndex];
        const pixelsPerSecond = basePixelsPerSecond * speedMultiplier;
        
        // Move forward by distance
        const pixelsCovered = pixelsPerSecond * deltaTime;
        this.currentDistance += pixelsCovered;

        // Check if animation is complete
        if (this.currentDistance >= totalDistance) {
            this.currentDistance = totalDistance;
            this.animationProgress = 1;
            this.isAnimating = false;
            this.isPaused = false;
            this.updatePlayPauseButton();
            this.updateButtonStates();
        }

        // Get current position based on distance traveled
        const position = this.getPositionAtDistance(smoothPath, distances, this.currentDistance);
        this.animationProgress = position.progress;

        // Check if we're at a waypoint
        if (this.waypoints.length > 0) {
            const currentPointIndex = Math.floor(this.animationProgress * (this.pathPoints.length - 1));
            const currentWaypoint = this.waypoints.find(wp => wp.index === currentPointIndex);
            
            if (currentWaypoint && !this.visitedWaypoints.has(currentWaypoint.index)) {
                this.visitedWaypoints.add(currentWaypoint.index);
                
                // Add beacon animation
                const point = this.pathPoints[currentWaypoint.index];
                if (point) {
                    this.addBeacon(point.x, point.y);
                }
                
                // Pause if needed
                if (this.pauseAtWaypoints && !this.isPausingAtWaypoint) {
                    this.isPausingAtWaypoint = true;
                    this.currentPauseTime = 0;
                }
            }
        }

        this.drawAnimatedRoute(smoothPath, this.animationProgress);

        if (this.isAnimating) {
            requestAnimationFrame((time) => this.animate(time));
        }
    }

    drawAnimatedRoute(smoothPath, progress) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.image, 0, 0);

        const totalPoints = smoothPath.length;
        const currentPoint = Math.floor(progress * totalPoints);

        if (currentPoint > 0) {
            this.ctx.strokeStyle = this.lineColor;
            this.ctx.lineWidth = this.lineThickness;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            this.ctx.beginPath();
            this.ctx.moveTo(smoothPath[0].x, smoothPath[0].y);

            for (let i = 1; i <= currentPoint && i < smoothPath.length; i++) {
                this.ctx.lineTo(smoothPath[i].x, smoothPath[i].y);
            }

            this.ctx.stroke();

            // Draw animated point
            if (currentPoint < smoothPath.length) {
                const point = smoothPath[currentPoint];
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, this.lineThickness * 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = this.lineColor;
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }
        }

        this.drawPoints();
        this.drawBeacons();
    }

    undoPoint() {
        if (this.pathPoints.length > 0) {
            const lastIndex = this.pathPoints.length - 1;
            
            // Remove waypoint if the last point is a waypoint
            this.waypoints = this.waypoints.filter(wp => wp.index !== lastIndex);
            
            // Adjust waypoint indices
            this.waypoints.forEach(wp => {
                if (wp.index > lastIndex) wp.index--;
            });
            
            // Remove the path point
            this.pathPoints.pop();
            
            this.redraw();
            this.updateWaypointList();
            this.updateButtonStates();
        }
    }

    clearAll() {
        if (confirm('Are you sure you want to clear everything?')) {
            this.pathPoints = [];
            this.waypoints = [];
            this.visitedWaypoints.clear();
            this.beacons = [];
            this.resetAnimation();
            this.redraw();
            this.updateWaypointList();
            this.updateButtonStates();
        }
    }

    toggleWaypointList() {
        const list = document.getElementById('waypointList');
        const btn = document.getElementById('toggleWaypoints');
        
        if (list.classList.contains('hidden')) {
            list.classList.remove('hidden');
            btn.textContent = '▲ Hide';
        } else {
            list.classList.add('hidden');
            btn.textContent = '▼ Show';
        }
    }

    updateWaypointList() {
        const container = document.getElementById('waypointList');
        document.getElementById('waypointCount').textContent = this.waypoints.length;
        
        // Show all waypoints
        const waypointHTML = this.waypoints.map((wp, index) => {
            const point = this.pathPoints[wp.index];
            return `
                <div class="waypoint-item">
                    <span><strong>${wp.name}</strong></span>
                    <span>Point ${wp.index + 1} (${Math.round(point.x)}, ${Math.round(point.y)})</span>
                </div>
            `;
        }).join('');
        
        // Show path points count
        const pathPointsHTML = this.pathPoints.length > this.waypoints.length ?
            `<div class="waypoint-item path-point">
                <span>Path points: ${this.pathPoints.length}</span>
                <span>${this.pathPoints.length - this.waypoints.length} unmarked points</span>
            </div>` : '';
        
        container.innerHTML = waypointHTML + pathPointsHTML;
    }

    updateButtonStates() {
        const hasPoints = this.pathPoints.length > 0;
        const canAnimate = this.pathPoints.length >= 2;
        
        document.getElementById('undoBtn').disabled = !hasPoints;
        document.getElementById('clearBtn').disabled = !hasPoints;
        document.getElementById('newWaypointBtn').disabled = !hasPoints;
        document.getElementById('saveLocalBtn').disabled = !hasPoints;
        document.getElementById('exportJSONBtn').disabled = !hasPoints;
        document.getElementById('playPauseBtn').disabled = !canAnimate;
        document.getElementById('resetBtn').disabled = !canAnimate;
        document.getElementById('togglePauseMode').disabled = !canAnimate || this.waypoints.length < 2;
        document.getElementById('exportBtn').disabled = !canAnimate;
        document.getElementById('toggleNamesVisibility').disabled = this.waypoints.length === 0;
        document.getElementById('toggleBeacons').disabled = this.waypoints.length === 0;
        document.getElementById('toggleSmoothing').disabled = !canAnimate;
    }

    showSaveDialog() {
        const modal = document.getElementById('saveNameModal');
        const input = document.getElementById('saveNameInput');
        const timestamp = new Date().toLocaleString();
        input.value = `Route ${timestamp}`;
        input.select();
        modal.classList.add('active');
    }

    async saveLocally() {
        if (!this.db) {
            alert('Database not ready. Please try again.');
            return;
        }

        const saveName = document.getElementById('saveNameInput').value.trim();
        if (!saveName) {
            alert('Please enter a name for this save');
            return;
        }

        const saveData = {
            name: saveName,
            timestamp: new Date().toISOString(),
            imageName: this.imageName,
            imageData: this.imageData,
            pathPoints: this.pathPoints,
            waypoints: this.waypoints,
            settings: {
                lineColor: this.lineColor,
                lineThickness: this.lineThickness,
                currentSpeedIndex: this.currentSpeedIndex,
                pauseAtWaypoints: this.pauseAtWaypoints,
                pauseDuration: this.pauseDuration,
                showNamesAlways: this.showNamesAlways,
                showBeacons: this.showBeacons,
                useSmoothing: this.useSmoothing
            }
        };

        const transaction = this.db.transaction(['saves'], 'readwrite');
        const objectStore = transaction.objectStore('saves');
        const request = objectStore.add(saveData);

        request.onsuccess = () => {
            document.getElementById('saveNameModal').classList.remove('active');
            alert('Route saved locally!');
        };

        request.onerror = () => {
            alert('Error saving route: ' + request.error);
        };
    }

    async showSaveManager() {
        if (!this.db) {
            alert('Database not ready. Please try again.');
            return;
        }

        const modal = document.getElementById('saveManagerModal');
        const saveList = document.getElementById('saveList');

        const transaction = this.db.transaction(['saves'], 'readonly');
        const objectStore = transaction.objectStore('saves');
        const request = objectStore.getAll();

        request.onsuccess = () => {
            const saves = request.result;
            
            if (saves.length === 0) {
                saveList.innerHTML = '<p class="no-saves">No saved routes yet. Create a route and click "Save Locally" to get started.</p>';
            } else {
                saveList.innerHTML = saves.map(save => {
                    const date = new Date(save.timestamp).toLocaleString();
                    const waypointCount = save.waypoints ? save.waypoints.length : 0;
                    const pointCount = save.pathPoints ? save.pathPoints.length : 0;
                    
                    return `
                        <div class="save-item">
                            <div class="save-item-info">
                                <div class="save-item-name">${save.name}</div>
                                <div class="save-item-meta">
                                    ${date} • ${waypointCount} waypoints • ${pointCount} points
                                    ${save.imageName ? ` • ${save.imageName}` : ''}
                                </div>
                            </div>
                            <div class="save-item-actions">
                                <button class="btn btn-primary" onclick="app.loadSave(${save.id})">Load</button>
                                <button class="btn btn-danger" onclick="app.deleteSave(${save.id})">Delete</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
            
            modal.classList.add('active');
        };

        request.onerror = () => {
            alert('Error loading saves: ' + request.error);
        };
    }

    async loadSave(id) {
        if (!this.db) return;

        const transaction = this.db.transaction(['saves'], 'readonly');
        const objectStore = transaction.objectStore('saves');
        const request = objectStore.get(id);

        request.onsuccess = () => {
            const data = request.result;
            if (!data) {
                alert('Save not found');
                return;
            }

            // Load all data
            this.pathPoints = data.pathPoints || [];
            this.waypoints = data.waypoints || [];
            
            // Reset animation state to starting position
            this.isAnimating = false;
            this.isPaused = true;
            this.animationProgress = 0;
            this.currentDistance = 0;
            this.currentPauseTime = 0;
            this.isPausingAtWaypoint = false;
            this.visitedWaypoints.clear();
            this.beacons = [];
            
            // Load settings
            if (data.settings) {
                this.lineColor = data.settings.lineColor || this.lineColor;
                this.lineThickness = data.settings.lineThickness || this.lineThickness;
                this.currentSpeedIndex = data.settings.currentSpeedIndex !== undefined ? 
                    data.settings.currentSpeedIndex : this.currentSpeedIndex;
                this.pauseAtWaypoints = data.settings.pauseAtWaypoints || false;
                this.pauseDuration = data.settings.pauseDuration || 2;
                this.showNamesAlways = data.settings.showNamesAlways !== undefined ?
                    data.settings.showNamesAlways : true;
                this.showBeacons = data.settings.showBeacons || false;
                this.useSmoothing = data.settings.useSmoothing || false;
                
                // Update UI controls
                document.getElementById('lineColor').value = this.lineColor;
                document.getElementById('lineThickness').value = this.lineThickness;
                document.getElementById('thicknessValue').textContent = this.lineThickness;
                document.getElementById('speedSlider').value = this.currentSpeedIndex;
                document.getElementById('pauseDuration').value = this.pauseDuration;
                this.updateSpeedDisplay();
                this.updateToggleButtons();
            }

            // Load image
            if (data.imageData) {
                this.imageName = data.imageName;
                this.imageData = data.imageData;
                const img = new Image();
                img.onload = () => {
                    this.image = img;
                    this.setupCanvas();
                    this.redraw();
                    document.getElementById('placeholder').classList.add('hidden');
                    this.updateWaypointList();
                    this.updateButtonStates();
                    this.updatePlayPauseButton();
                    document.getElementById('saveManagerModal').classList.remove('active');
                    alert('Route loaded successfully!');
                };
                img.src = data.imageData;
            } else {
                this.redraw();
                this.updateWaypointList();
                this.updateButtonStates();
                this.updatePlayPauseButton();
                document.getElementById('saveManagerModal').classList.remove('active');
                alert('Route loaded!\nNote: No image was saved with this route.');
            }
        };

        request.onerror = () => {
            alert('Error loading save: ' + request.error);
        };
    }

    async deleteSave(id) {
        if (!this.db) return;
        
        if (!confirm('Are you sure you want to delete this save?')) return;

        const transaction = this.db.transaction(['saves'], 'readwrite');
        const objectStore = transaction.objectStore('saves');
        const request = objectStore.delete(id);

        request.onsuccess = () => {
            this.showSaveManager(); // Refresh the list
        };

        request.onerror = () => {
            alert('Error deleting save: ' + request.error);
        };
    }

    updateToggleButtons() {
        // Update pause mode button
        const pauseBtn = document.getElementById('togglePauseMode');
        if (this.pauseAtWaypoints) {
            pauseBtn.classList.add('active');
            document.getElementById('pauseModeText').textContent = 'Continuous';
        } else {
            pauseBtn.classList.remove('active');
            document.getElementById('pauseModeText').textContent = 'Pause at Waypoints';
        }
        
        // Update names visibility button
        const namesBtn = document.getElementById('toggleNamesVisibility');
        if (this.showNamesAlways) {
            namesBtn.classList.remove('active');
            document.getElementById('namesVisibilityText').textContent = 'Names: Always';
        } else {
            namesBtn.classList.add('active');
            document.getElementById('namesVisibilityText').textContent = 'Names: On Arrival';
        }
        
        // Update beacons button
        const beaconsBtn = document.getElementById('toggleBeacons');
        if (this.showBeacons) {
            beaconsBtn.classList.add('active');
            document.getElementById('beaconsText').textContent = 'Beacons: On';
        } else {
            beaconsBtn.classList.remove('active');
            document.getElementById('beaconsText').textContent = 'Beacons: Off';
        }
        
        // Update smoothing button
        const smoothingBtn = document.getElementById('toggleSmoothing');
        if (this.useSmoothing) {
            smoothingBtn.classList.add('active');
            document.getElementById('smoothingText').textContent = 'Smoothing: On';
        } else {
            smoothingBtn.classList.remove('active');
            document.getElementById('smoothingText').textContent = 'Smoothing: Off';
        }
    }

    exportToJSON() {
        const data = {
            imageName: this.imageName,  // Include image reference
            imageData: this.imageData,  // Include base64 image data
            pathPoints: this.pathPoints,
            waypoints: this.waypoints,
            settings: {
                lineColor: this.lineColor,
                lineThickness: this.lineThickness,
                currentSpeedIndex: this.currentSpeedIndex,
                pauseAtWaypoints: this.pauseAtWaypoints,
                pauseDuration: this.pauseDuration,
                showNamesAlways: this.showNamesAlways,
                showBeacons: this.showBeacons,
                useSmoothing: this.useSmoothing
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadFile(blob, 'route-plotter-save.json');
    }

    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const data = JSON.parse(content);
                
                // Load path points and waypoints
                this.pathPoints = data.pathPoints || [];
                this.waypoints = data.waypoints || [];
                
                // Reset animation state to starting position
                this.isAnimating = false;
                this.isPaused = true;
                this.animationProgress = 0;
                this.currentDistance = 0;
                this.currentPauseTime = 0;
                this.isPausingAtWaypoint = false;
                this.visitedWaypoints.clear();
                this.beacons = [];
                
                // Load settings first
                if (data.settings) {
                    this.lineColor = data.settings.lineColor || this.lineColor;
                    this.lineThickness = data.settings.lineThickness || this.lineThickness;
                    this.currentSpeedIndex = data.settings.currentSpeedIndex !== undefined ? 
                        data.settings.currentSpeedIndex : this.currentSpeedIndex;
                    this.pauseAtWaypoints = data.settings.pauseAtWaypoints || false;
                    this.pauseDuration = data.settings.pauseDuration || 2;
                    this.showNamesAlways = data.settings.showNamesAlways !== undefined ?
                        data.settings.showNamesAlways : true;
                    this.showBeacons = data.settings.showBeacons || false;
                    this.useSmoothing = data.settings.useSmoothing || false;
                    
                    // Update UI controls
                    document.getElementById('lineColor').value = this.lineColor;
                    document.getElementById('lineThickness').value = this.lineThickness;
                    document.getElementById('thicknessValue').textContent = this.lineThickness;
                    document.getElementById('speedSlider').value = this.currentSpeedIndex;
                    document.getElementById('pauseDuration').value = this.pauseDuration;
                    this.updateSpeedDisplay();
                    this.updateToggleButtons();
                }

                // Load image if included in save file
                if (data.imageData) {
                    this.imageName = data.imageName;
                    this.imageData = data.imageData;
                    const img = new Image();
                    img.onload = () => {
                        this.image = img;
                        this.setupCanvas();
                        this.redraw();
                        document.getElementById('placeholder').classList.add('hidden');
                        this.updateWaypointList();
                        this.updateButtonStates();
                        this.updatePlayPauseButton();
                        alert('Route and image loaded successfully!');
                    };
                    img.src = data.imageData;
                } else {
                    // No image data in file
                    if (data.imageName) {
                        console.log('Route was created with image:', data.imageName);
                    }
                    this.redraw();
                    this.updateWaypointList();
                    this.updateButtonStates();
                    this.updatePlayPauseButton();
                    alert('Route loaded successfully!\nNote: Image not included, please upload the image separately.');
                }
            } catch (error) {
                alert('Error loading file: ' + error.message);
            }
        };
        reader.readAsText(file);
        
        event.target.value = '';
    }

    async exportVideo() {
        if (!this.image || this.pathPoints.length < 2) return;
        
        try {
            const stream = this.canvas.captureStream(30);
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const chunks = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                this.downloadFile(blob, 'route-animation.webm');
                alert('Video export complete!');
            };

            // Calculate actual animation duration based on path length
            const smoothPath = this.createSmoothPath();
            const pathLength = this.calculatePathLength(smoothPath);
            const basePixelsPerSecond = 200;
            const speedMultiplier = this.speedMultipliers[this.currentSpeedIndex];
            const pixelsPerSecond = basePixelsPerSecond * speedMultiplier;
            const animationDuration = pathLength / pixelsPerSecond;
            
            // Add pauses at waypoints if enabled
            let totalPauses = 0;
            if (this.pauseAtWaypoints && this.waypoints.length > 0) {
                totalPauses = this.waypoints.length * this.pauseDuration;
            }
            
            // Total duration: 1s start + animation + pauses + 3s end
            const totalDuration = (1 + animationDuration + totalPauses + 3) * 1000;
            
            alert(`Recording video... Duration: ${(totalDuration/1000).toFixed(1)}s`);

            recorder.start();
            
            // Wait 1 second before starting animation
            setTimeout(() => {
                this.resetAnimation();
                this.togglePlayPause();  // Start playing
            }, 1000);

            // Stop recording after total duration
            setTimeout(() => {
                if (this.isAnimating) {
                    this.togglePlayPause();  // Stop if still playing
                }
                recorder.stop();
            }, totalDuration);
        } catch (error) {
            alert('Error exporting video: ' + error.message);
        }
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the application
const app = new RoutePlotter();
