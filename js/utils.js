// Utility functions

// Generate a unique ID
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Calculate distance between two points
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Check if a point is inside a rectangle
function pointInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
    return x >= rectX && x <= rectX + rectWidth && 
           y >= rectY && y <= rectY + rectHeight;
}

// Get a random integer between min and max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get a random position within the game bounds
function randomPosition(bounds, padding = 50) {
    return {
        x: randomInt(padding, bounds.width - padding),
        y: randomInt(padding, bounds.height - padding)
    };
}

// Get a random position within a specific area
function randomPositionInArea(x, y, width, height, padding = 10) {
    return {
        x: randomInt(x + padding, x + width - padding),
        y: randomInt(y + padding, y + height - padding)
    };
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Clamp a value between min and max
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Linear interpolation
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// Get angle between two points in radians
function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

// Convert radians to degrees
function radToDeg(rad) {
    return rad * 180 / Math.PI;
}

// Convert degrees to radians
function degToRad(deg) {
    return deg * Math.PI / 180;
}

// Check if two circles overlap
function circlesOverlap(x1, y1, r1, x2, y2, r2) {
    return distance(x1, y1, x2, y2) < r1 + r2;
}

// Get a color string for a side (0 = green/player, 1 = red/enemy)
function getSideColor(side, alpha = 1) {
    const colors = [
        `rgba(76, 175, 80, ${alpha})`,  // Green
        `rgba(244, 67, 54, ${alpha})`   // Red
    ];
    return colors[side] || colors[0];
}

// Debounce function to limit how often a function can be called
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Throttle function to limit how often a function can be called
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Deep clone an object
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
