document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    
    const previewContainer = document.getElementById('previewContainer');
    const imageCanvas = document.getElementById('imageCanvas');
    const brushCanvas = document.getElementById('brushCanvas');
    const imgCtx = imageCanvas.getContext('2d');
    const brushCtx = brushCanvas.getContext('2d');
    
    const brushSizeInput = document.getElementById('brushSize');
    const clearBrushBtn = document.getElementById('clearBrushBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const processBtn = document.getElementById('processBtn');
    
    const loadingState = document.getElementById('loadingState');
    const resultSection = document.getElementById('resultSection');
    const resultImage = document.getElementById('resultImage');
    const originalImage = document.getElementById('originalImage');
    const sliderInput = document.getElementById('sliderInput');
    const sliderLine = document.getElementById('sliderLine');
    const downloadBtn = document.getElementById('downloadBtn');
    const newBtn = document.getElementById('newBtn');
    const promptInput = document.getElementById('promptInput');

    const modeWatermark = document.getElementById('modeWatermark');
    const modeEnhance = document.getElementById('modeEnhance');
    const workspaceTitle = document.getElementById('workspaceTitle');
    const workspaceDesc = document.getElementById('workspaceDesc');

    let currentFile = null;
    let isDrawing = false;
    let currentMode = 'watermark';
    let baseImage = new Image();

    // Canvas styling properties
    const BRUSH_COLOR = 'rgba(255, 0, 0, 0.5)';

    // --- MODE TOGGLE LOGIC ---
    modeWatermark.addEventListener('click', () => {
        currentMode = 'watermark';
        modeWatermark.classList.add('active');
        modeEnhance.classList.remove('active');
        workspaceTitle.textContent = 'Remove Watermark';
        workspaceDesc.textContent = 'Upload an image and brush over any object to remove it seamlessly.';
        promptInput.value = 'Remove any watermarks, texts, or logos from the image seamlessly';
        brushCanvas.style.pointerEvents = 'auto';
        brushCanvas.style.opacity = '1';
    });

    modeEnhance.addEventListener('click', () => {
        currentMode = 'enhance';
        modeEnhance.classList.add('active');
        modeWatermark.classList.remove('active');
        workspaceTitle.textContent = 'Enhance Image';
        workspaceDesc.textContent = 'Upload a low-quality image to upscale, denoise, and enhance its details.';
        promptInput.value = 'Upscale, denoise, and enhance this image to make it highly detailed, sharp, and high quality.';
        brushCanvas.style.pointerEvents = 'none';
        brushCanvas.style.opacity = '0';
        clearBrush();
    });

    // Handle Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    browseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
    });

    dropZone.addEventListener('click', (e) => {
        if(e.target !== browseBtn) {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (JPEG, PNG, WEBP).');
            return;
        }

        currentFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            baseImage.src = e.target.result;
            baseImage.onload = () => {
                dropZone.classList.add('hidden');
                previewContainer.classList.remove('hidden');
                initCanvases();
            };
        };
        reader.readAsDataURL(file);
    }

    function initCanvases() {
        const wrapper = document.getElementById('canvasWrapper');
        const maxWidth = wrapper.clientWidth || 800;
        const maxHeight = 600;
        
        let width = baseImage.width;
        let height = baseImage.height;
        
        if (width > maxWidth) {
            height = Math.round(height * maxWidth / width);
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = Math.round(width * maxHeight / height);
            height = maxHeight;
        }

        imageCanvas.width = width;
        imageCanvas.height = height;
        brushCanvas.width = width;
        brushCanvas.height = height;

        imgCtx.drawImage(baseImage, 0, 0, width, height);
        
        brushCtx.lineCap = 'round';
        brushCtx.lineJoin = 'round';
        brushCtx.strokeStyle = BRUSH_COLOR;
        brushCtx.lineWidth = brushSizeInput.value;
    }

    brushSizeInput.addEventListener('input', (e) => {
        brushCtx.lineWidth = e.target.value;
    });

    function clearBrush() {
        brushCtx.clearRect(0, 0, brushCanvas.width, brushCanvas.height);
    }

    clearBrushBtn.addEventListener('click', clearBrush);

    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) * (canvas.width / rect.width),
            y: (evt.clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    brushCanvas.addEventListener('mousedown', (e) => {
        if (currentMode !== 'watermark') return;
        isDrawing = true;
        const pos = getMousePos(brushCanvas, e);
        brushCtx.beginPath();
        brushCtx.moveTo(pos.x, pos.y);
    });

    brushCanvas.addEventListener('mousemove', (e) => {
        if (!isDrawing || currentMode !== 'watermark') return;
        const pos = getMousePos(brushCanvas, e);
        brushCtx.lineTo(pos.x, pos.y);
        brushCtx.stroke();
    });

    brushCanvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    brushCanvas.addEventListener('mouseleave', () => {
        isDrawing = false;
    });

    cancelBtn.addEventListener('click', resetUI);
    newBtn.addEventListener('click', resetUI);

    function resetUI() {
        currentFile = null;
        fileInput.value = '';
        clearBrush();
        promptInput.value = 'Remove any watermarks, texts, or logos from the image seamlessly';
        isDrawing = false;
        
        previewContainer.classList.add('hidden');
        resultSection.classList.add('hidden');
        loadingState.classList.add('hidden');
        dropZone.classList.remove('hidden');
    }

    function hasBrushStrokes() {
        const imageData = brushCtx.getImageData(0, 0, brushCanvas.width, brushCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i+3] > 0) return true;
        }
        return false;
    }

    // Image Comparison Slider
    sliderInput.addEventListener('input', (e) => {
        const value = e.target.value;
        originalImage.style.clipPath = `polygon(0 0, ${value}% 0, ${value}% 100%, 0 100%)`;
        sliderLine.style.left = `${value}%`;
    });

    processBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        previewContainer.classList.add('hidden');
        loadingState.classList.remove('hidden');

        const formData = new FormData();
        formData.append('image', currentFile);
        
        let finalPrompt = promptInput.value;

        if (currentMode === 'watermark') {
            const hasStrokes = hasBrushStrokes();
            if (hasStrokes) {
                // Create composited image (original image + red strokes on top)
                const exportCanvas = document.createElement('canvas');
                exportCanvas.width = baseImage.width;
                exportCanvas.height = baseImage.height;
                const exCtx = exportCanvas.getContext('2d');
                
                exCtx.drawImage(baseImage, 0, 0, exportCanvas.width, exportCanvas.height);
                exCtx.drawImage(brushCanvas, 0, 0, exportCanvas.width, exportCanvas.height);
                
                const compositedBlob = await new Promise(resolve => exportCanvas.toBlob(resolve, 'image/jpeg', 0.95));
                formData.set('image', compositedBlob, 'image.jpg'); // Overwrite original image
                
                finalPrompt = "Remove the object or watermark completely covered by the red brush strokes in this image and restore the background seamlessly. Return the clean image without any red strokes. " + finalPrompt;
            }
        }
        
        formData.append('prompt', finalPrompt);

        try {
            const response = await fetch('/api/process-image', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process image');
            }

            // Success
            let finalOutputDataUrl = data.result;

            if (currentMode === 'watermark' && hasBrushStrokes()) {
                const blendCanvas = document.createElement('canvas');
                blendCanvas.width = baseImage.width;
                blendCanvas.height = baseImage.height;
                const blendCtx = blendCanvas.getContext('2d');

                // 1. Draw original base image
                blendCtx.drawImage(baseImage, 0, 0, blendCanvas.width, blendCanvas.height);

                // 2. Load the AI result image
                const aiResultImg = new Image();
                await new Promise((resolve, reject) => {
                    aiResultImg.onload = resolve;
                    aiResultImg.onerror = reject;
                    aiResultImg.src = data.result;
                });

                // 3. Create a mask canvas from brush strokes
                const maskCanvas = document.createElement('canvas');
                maskCanvas.width = blendCanvas.width;
                maskCanvas.height = blendCanvas.height;
                const maskCtx = maskCanvas.getContext('2d');
                
                maskCtx.drawImage(brushCanvas, 0, 0, maskCanvas.width, maskCanvas.height);
                
                // Make mask strokes fully opaque
                const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
                for (let i = 0; i < maskData.data.length; i += 4) {
                    if (maskData.data[i+3] > 0) {
                        maskData.data[i] = 255;
                        maskData.data[i+1] = 255;
                        maskData.data[i+2] = 255;
                        maskData.data[i+3] = 255; // Make fully opaque
                    }
                }
                maskCtx.putImageData(maskData, 0, 0);

                // 4. Isolate the AI result using the mask
                const isolatedAiCanvas = document.createElement('canvas');
                isolatedAiCanvas.width = blendCanvas.width;
                isolatedAiCanvas.height = blendCanvas.height;
                const isolatedCtx = isolatedAiCanvas.getContext('2d');
                
                isolatedCtx.drawImage(aiResultImg, 0, 0, isolatedAiCanvas.width, isolatedAiCanvas.height);
                isolatedCtx.globalCompositeOperation = 'destination-in';
                isolatedCtx.drawImage(maskCanvas, 0, 0, isolatedAiCanvas.width, isolatedAiCanvas.height);

                // 5. Draw the isolated AI patches onto the original image
                blendCtx.globalCompositeOperation = 'source-over';
                blendCtx.drawImage(isolatedAiCanvas, 0, 0, blendCanvas.width, blendCanvas.height);

                finalOutputDataUrl = blendCanvas.toDataURL('image/jpeg', 0.95);
            }

            loadingState.classList.add('hidden');
            resultSection.classList.remove('hidden');
            
            resultImage.src = finalOutputDataUrl;
            originalImage.src = baseImage.src;
            downloadBtn.href = finalOutputDataUrl;
            
            // Reset slider
            sliderInput.value = 50;
            originalImage.style.clipPath = `polygon(0 0, 50% 0, 50% 100%, 0 100%)`;
            sliderLine.style.left = `50%`;

        } catch (error) {
            alert(`Error: ${error.message}`);
            loadingState.classList.add('hidden');
            previewContainer.classList.remove('hidden');
        }
    });
});
