const colorPicker = document.getElementById("textColor");
const canvasColor = document.getElementById("backColor");
const linewidthPicker = document.getElementById("fontSize");
const lineStylePicker = document.getElementById("lineStyle");
const canvas = document.getElementById("myCanvas");
const clearButton = document.getElementById("clear");
const saveButton = document.getElementById("save");
const retrieveButton = document.getElementById("retrieve");
const eraserButton = document.getElementById("eraser");
const undoButton = document.getElementById("undo");
const ctx = canvas.getContext('2d');

let isDrawing = false;
let isErasing = false;
let lastX = 0;
let lastY = 0;
let canvasStates = []; // To store canvas states for undo functionality
let currentStateIndex = -1;

// Initial canvas setup
function initializeCanvas() {
    ctx.strokeStyle = colorPicker.value;
    ctx.fillStyle = canvasColor.value;
    ctx.lineWidth = parseInt(linewidthPicker.value); // Ensure it's a number
    ctx.lineCap = 'round'; // Default line cap for solid lines
    ctx.lineJoin = 'round'; // Default line join for solid lines
    ctx.setLineDash([]); // Default to solid line
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveCanvasState(); // Save initial blank state
}

// Function to save the current canvas state
function saveCanvasState() {
    currentStateIndex++;
    // Remove any states after the current one if we've undone something and then drawn
    if (currentStateIndex < canvasStates.length) {
        canvasStates.length = currentStateIndex;
    }
    canvasStates.push(canvas.toDataURL());
}

// Function to redraw the canvas from a saved state
function restoreCanvasState(index) {
    if (index >= 0 && index < canvasStates.length) {
        let img = new Image();
        img.src = canvasStates[index];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear before redrawing
            ctx.fillStyle = canvasColor.value; // Restore background color
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            // Reapply drawing settings after restoring state
            ctx.strokeStyle = colorPicker.value;
            ctx.fillStyle = canvasColor.value; // Important for background
            ctx.lineWidth = parseInt(linewidthPicker.value);
            // Reapply line dash setting based on current selection
            applyLineStyle();
        };
    }
}

// Function to apply the selected line style
function applyLineStyle() {
    const selectedStyle = lineStylePicker.value;
    switch (selectedStyle) {
        case 'round': // Solid
            ctx.setLineDash([]);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            break;
        case 'butt': // Dashed (uses 'butt' for sharper segments)
            // Dash array: [length of dash, length of space]
            ctx.setLineDash([ctx.lineWidth * 2, ctx.lineWidth]); // Dash length is 2x line width, space is 1x line width
            ctx.lineCap = 'butt';
            ctx.lineJoin = 'miter'; // Miter for sharper joins if lines intersect
            break;
        case 'square': // Dotted (short dashes with 'round' or 'square' caps to make dots)
            ctx.setLineDash([1, ctx.lineWidth * 1.5]); // Very short dash (1px) followed by a space
            ctx.lineCap = 'round'; // Round caps make the dots round
            ctx.lineJoin = 'round';
            break;
        default:
            ctx.setLineDash([]);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
    }
}

// --- Event Listeners ---

// Text Color Picker
colorPicker.addEventListener('change', (e) => {
    ctx.strokeStyle = e.target.value;
    isErasing = false; // Disable eraser when changing color
    eraserButton.style.backgroundColor = '#ffc107'; // Reset eraser button color
    eraserButton.style.color = '#333';
    applyLineStyle(); // Reapply line style to ensure dash settings are correct for new color
});

// Background Color Picker
canvasColor.addEventListener('change', (e) => {
    ctx.fillStyle = e.target.value;
    // Clear and redraw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Restore previous drawing on top of new background
    if (currentStateIndex >= 0) {
        let img = new Image();
        img.src = canvasStates[currentStateIndex];
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            saveCanvasState(); // Save new state with updated background
        };
    } else {
        saveCanvasState(); // If no previous drawing, just save the new background
    }
});

// Line Width Picker
linewidthPicker.addEventListener('change', (e) => {
    ctx.lineWidth = parseInt(e.target.value);
    applyLineStyle(); // Reapply line style as dash pattern might depend on line width
});

// Line Style Picker
lineStylePicker.addEventListener('change', () => {
    applyLineStyle(); // Apply the selected line style
});

// Canvas Drawing
canvas.addEventListener('pointerdown', (e) => {
    isDrawing = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
    ctx.beginPath(); // Start a new path for each stroke
    ctx.moveTo(lastX, lastY);
    e.preventDefault(); // Prevent default touch actions like scrolling
});

canvas.addEventListener('pointermove', (e) => {
    if (!isDrawing) return;

    if (isErasing) {
        // Eraser mode
        ctx.globalCompositeOperation = 'destination-out'; // Erase by making pixels transparent
        // For eraser, line dash should usually be solid, and color doesn't matter
        ctx.setLineDash([]);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = parseInt(linewidthPicker.value) * 2; // Make eraser bigger
        ctx.strokeStyle = 'rgba(0,0,0,1)'; // Color is irrelevant for 'destination-out'
    } else {
        // Drawing mode
        ctx.globalCompositeOperation = 'source-over'; // Default drawing mode
        ctx.strokeStyle = colorPicker.value;
        ctx.lineWidth = parseInt(linewidthPicker.value);
        applyLineStyle(); // Apply the currently selected line style
    }

    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();

    lastX = e.offsetX;
    lastY = e.offsetY;
    e.preventDefault(); // Prevent default touch actions like scrolling
});

canvas.addEventListener('pointerup', () => {
    isDrawing = false;
    ctx.globalCompositeOperation = 'source-over'; // Reset to default drawing mode
    ctx.setLineDash([]); // Reset line dash to solid for next stroke setup
    saveCanvasState(); // Save state after each stroke
});

canvas.addEventListener('pointerleave', () => {
    isDrawing = false;
    ctx.globalCompositeOperation = 'source-over'; // Reset to default drawing mode
    ctx.setLineDash([]); // Reset line dash to solid
});


// Clear Button
clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = canvasColor.value; // Restore background color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    canvasStates = []; // Clear states
    currentStateIndex = -1;
    saveCanvasState(); // Save new blank state
});

// Eraser Button
eraserButton.addEventListener('click', () => {
    isErasing = !isErasing; // Toggle eraser mode
    if (isErasing) {
        eraserButton.style.backgroundColor = '#007bff'; // Highlight eraser button when active
        eraserButton.style.color = '#fff';
    } else {
        eraserButton.style.backgroundColor = '#ffc107'; // Reset to original color
        eraserButton.style.color = '#333';
        ctx.globalCompositeOperation = 'source-over'; // Ensure drawing mode is reset
        applyLineStyle(); // Reapply current line style if returning to drawing mode
    }
});

// Undo Button
undoButton.addEventListener('click', () => {
    if (currentStateIndex > 0) {
        currentStateIndex--;
        restoreCanvasState(currentStateIndex);
    } else if (currentStateIndex === 0) {
        // If only initial blank state is left, clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = canvasColor.value; // Restore background color
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        canvasStates = [];
        currentStateIndex = -1;
        saveCanvasState(); // Save a truly blank state
    }
});

// Save Button
saveButton.addEventListener('click', () => {
    localStorage.setItem('canvasContents', canvas.toDataURL());
    let link = document.createElement('a');
    link.download = 'my-signature.png';
    link.href = canvas.toDataURL();
    link.click();
});

// Retrieve Button
retrieveButton.addEventListener('click', () => {
    let savedCanvas = localStorage.getItem('canvasContents');
    if (savedCanvas) {
        let img = new Image();
        img.src = savedCanvas;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear before redrawing
            ctx.fillStyle = canvasColor.value; // Restore background color
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            saveCanvasState(); // Save the retrieved image as a new state
            applyLineStyle(); // Ensure line style is applied after retrieve
        };
    } else {
        alert("No saved signature found!");
    }
});

// Initial setup call
initializeCanvas();

// Handle canvas resizing for responsiveness
window.addEventListener('resize', () => {
    // Store current drawing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);

    // Get parent dimensions
    const parentWidth = canvas.parentElement.clientWidth;
    const parentHeight = canvas.parentElement.clientHeight;

    // Calculate new canvas dimensions to fit parent while maintaining aspect ratio
    const originalAspectRatio = 640 / 400; // Original aspect ratio
    let newWidth = parentWidth - 10; // Allow some padding
    let newHeight = newWidth / originalAspectRatio;

    if (newHeight > parentHeight - 10) {
        newHeight = parentHeight - 10;
        newWidth = newHeight * originalAspectRatio;
    }

    // Set new canvas dimensions
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Restore drawing to new dimensions
    ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);

    // Reapply current drawing settings after resize
    ctx.strokeStyle = colorPicker.value;
    ctx.fillStyle = canvasColor.value;
    ctx.lineWidth = parseInt(linewidthPicker.value);
    applyLineStyle(); // Ensure correct line dash is applied after resize

    // If canvas was empty, ensure background is drawn
    if (canvasStates.length === 0 || currentStateIndex === -1) {
        ctx.fillStyle = canvasColor.value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
});