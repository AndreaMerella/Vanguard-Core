// ═══════════════════════════════════════════════════════════════════════════
// DRIS//core VNGRD v22.1 — SOVEREIGN BROADCAST ENGINE
// ═══════════════════════════════════════════════════════════════════════════

const $ = id => document.getElementById(id);

// ═══════════════════════════════════════════════════════════════════════════
// MASTER APP OBJECT
// ═══════════════════════════════════════════════════════════════════════════
const APP = {
    state: {
        isLive: false,
        isRecording: false,
        isFullscreen: false,
        isCycle: false,
        cycleTimer: null,
        isMobile: false,
        theme: 'cyan',
        startTime: Date.now(),
        lastPrices: { btc: 0, eth: 0, sol: 0 }
    },

    vj: {
        brightness: 1.0,
        contrast: 1.0,
        saturation: 1.0,
        hue: 0,
        trailsEnabled: false,
        trailAlpha: 0.92,
        rgbEnabled: false,
        rgbIntensity: 0,
        rgbBassLink: false,
        pixelateEnabled: false,
        pixelSize: 1,
        rumbleEnabled: false,
        invert: false,
        uiReactivity: false,
        shakeIntensity: 0,
        lastBassLevel: 0
    },

    media: {
        queue: [],
        currentIndex: -1,
        currentElement: null
    },

    audio: {
        ctx: null,
        analyzer: null,
        source: null,
        element: null,
        playlist: [],
        currentTrack: -1,
        currentTrackName: '',
        bassLevel: 0,
        vuData: new Uint8Array(32),
        isPlaying: false,
        isConnected: false,
        spatialMode: 'stereo',
        spatialEnabled: false,
        panner: null,
        compressor: null,
        masterGain: null
    },

    camera: {
        stream: null,
        recorder: null,
        chunks: [],
        mode: 'off',
        isRecording: false,
        isClipping: false
    },

    render: {
        canvas: null,
        ctx: null,
        width: 1920,
        height: 1080,
        fps: 0,
        frameCount: 0,
        lastFpsUpdate: 0,
        scale: 1.0
    },

    bug: {
        visible: true,
        text: 'DRIS//core',
        image: null,
        scale: 1.0,
        style: 'cyan'
    },

    lowerThird: {
        visible: false,
        preset: 'guest'
    },

    guest: {
        peer: null,
        connection: null,
        stream: null,
        videoElement: null,
        audioSource: null,
        isActive: false,
        peerId: null
    },

    // Sovereign Security Module
    security: {
        purge: null 
    },

    timeMachine: {
        recorder: null,
        chunks: [],
        stream: null,
        audioDest: null,
        isRecording: false,
        maxDuration: 30000 
    },
    
    // Projector
    projector: {
        window: null,
        stream: null,
        isOpen: false
    },

    // WebXR
    xr: {
        supported: false,
        checked: false,
        session: null,
        refSpace: null,
        gl: null,
        vjTexture: null,
        shaderProgram: null,
        quadBuffer: null,
        aPosition: null, aTexCoord: null, uProjection: null, uView: null, uTexture: null
    },

    ui: {
        logoMorph: 0,
        morphs: ['m1','m2','m3','m4','m5','m6','m7','m8','m9','m10','m11','m12','m13','m14','m15']
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════
function log(msg) {
    const box = $('sys-log');
    if (!box) return;
    const ts = new Date().toTimeString().split(' ')[0];
    const el = document.createElement('div');
    el.className = 'log-line';
    el.innerHTML = `<span class="ts">${ts}</span>${msg}`;
    box.insertBefore(el, box.firstChild);
    if (box.children.length > 30) box.lastChild.remove();
}

function checkMobile() {
    APP.state.isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry/i.test(navigator.userAgent);
    if (APP.state.isMobile) {
        APP.render.width = 960;
        APP.render.height = 540;
        log('MOBILE_MODE');
    }
}

function updateClock() {
    const now = new Date();
    if ($('clock')) {
        $('clock').textContent = now.toTimeString().split(' ')[0];
    }
    
    if ($('uptime') && APP.state.startTime) {
        const s = Math.floor((Date.now() - APP.state.startTime) / 1000);
        const h = String(Math.floor(s / 3600)).padStart(2, '0');
        const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
        const sec = String(s % 60).padStart(2, '0');
        $('uptime').textContent = `${h}:${m}:${sec}`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// VISUAL ENGINE
// ═══════════════════════════════════════════════════════════════════════════
function initCanvas() {
    APP.render.canvas = $('vj-canvas');
    APP.render.ctx = APP.render.canvas.getContext('2d', { 
        alpha: false, 
        desynchronized: true,
        willReadFrequently: false 
    });
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    log('CANVAS_INIT: GPU_LOCKED');
}

function resizeCanvas() {
    APP.render.canvas.width = APP.render.width;
    APP.render.canvas.height = APP.render.height;
    if ($('res')) $('res').textContent = `${APP.render.width}x${APP.render.height}`;
}

function renderLoop(timestamp) {
    APP.render.rafId = requestAnimationFrame(renderLoop);
    
    // FPS Counter
    APP.render.frameCount++;
    if (timestamp - APP.render.lastFpsUpdate >= 1000) {
        APP.render.fps = APP.render.frameCount;
        APP.render.frameCount = 0;
        APP.render.lastFpsUpdate = timestamp;
        if ($('fps-val')) $('fps-val').textContent = APP.render.fps;
    }
    
    const ctx = APP.render.ctx;
    const w = APP.render.width;
    const h = APP.render.height;
    
    ctx.imageSmoothingEnabled = false;
    
    // RUMBLE
    if (APP.vj.rumbleEnabled && APP.audio.bassLevel > 100) {
        APP.render.scale = 1.0 + (APP.audio.bassLevel / 255) * 0.06;
    } else {
        APP.render.scale = 1.0;
    }
    
    // TRAILS
    if (APP.vj.trailsEnabled) {
        ctx.globalAlpha = APP.vj.trailAlpha;
        ctx.drawImage(APP.render.canvas, 0, 0); // No transform for simple trail
        ctx.globalAlpha = 1;
    } else {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
    }
    
    // DRAW SOURCE
    let source = null;
    let forceFullBleed = false;
    
    if (APP.guest.stream && APP.guest.isActive && APP.guest.videoElement) {
        source = APP.guest.videoElement;
        forceFullBleed = true;
    } else if (APP.state.isLive && APP.camera.stream) {
        source = $('preview-vid');
    } else if (APP.media.currentElement) {
        source = APP.media.currentElement;
    }
    
    if (source) {
        const ready = source.tagName === 'VIDEO' ? source.readyState >= 2 : source.complete;
        if (ready) {
            ctx.filter = `brightness(${APP.vj.brightness}) contrast(${APP.vj.contrast}) saturate(${APP.vj.saturation}) hue-rotate(${APP.vj.hue}deg)${APP.vj.invert ? ' invert(1)' : ''}`;
            
            const srcW = source.videoWidth || source.naturalWidth || source.width;
            const srcH = source.videoHeight || source.naturalHeight || source.height;
            
            // ADAPTIVE SCALING (Sovereign Fit)
            let scale;
            if (APP.state.isFullscreen || forceFullBleed) {
                 // COVER (Fullscreen)
                 scale = Math.max(w / srcW, h / srcH) * APP.render.scale;
            } else {
                 // CONTAIN (Windowed - see everything)
                 scale = Math.min((w * 0.95) / srcW, (h * 0.95) / srcH) * APP.render.scale;
            }

            const drawW = srcW * scale;
            const drawH = srcH * scale;
            const drawX = (w - drawW) / 2;
            const drawY = (h - drawH) / 2;
            
            ctx.drawImage(source, drawX, drawY, drawW, drawH);
            ctx.filter = 'none';
        }
    }
    
    // PIXELATE (GPU)
    if (APP.vj.pixelateEnabled && APP.vj.pixelSize > 1) {
        if (!APP.render.pixelCanvas) {
            APP.render.pixelCanvas = document.createElement('canvas');
            APP.render.pixelCanvas.width = 64; APP.render.pixelCanvas.height = 36;
            APP.render.pixelCtx = APP.render.pixelCanvas.getContext('2d');
            APP.render.pixelCtx.imageSmoothingEnabled = false;
        }
        const downScale = Math.max(1, Math.floor(APP.vj.pixelSize / 2));
        const tW = Math.floor(64 / downScale);
        const tH = Math.floor(36 / downScale);
        APP.render.pixelCtx.drawImage(APP.render.canvas, 0, 0, tW, tH);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(APP.render.pixelCanvas, 0, 0, tW, tH, 0, 0, w, h);
    }
    
    // RGB SHIFT
    if (APP.vj.rgbEnabled && APP.vj.rgbIntensity > 0) {
        let offset = APP.vj.rgbIntensity;
        if (APP.vj.rgbBassLink) offset = Math.floor((APP.audio.bassLevel / 255) * APP.vj.rgbIntensity * 2);
        if (offset > 0) APP.render.canvas.style.filter = `url(#chromatic-ghost)`;
        else APP.render.canvas.style.filter = 'none';
    } else {
        APP.render.canvas.style.filter = 'none';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO ENGINE (FIXED)
// ═══════════════════════════════════════════════════════════════════════════
function setupAudioAnalyzer() {
    try {
        if (!APP.audio.ctx) APP.audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // --- GUARD: PREVENT CRASH IF SOURCE EXISTS ---
        if (!APP.audio.source) {
            APP.audio.source = APP.audio.ctx.createMediaElementSource($('audio-el'));
        }

        APP.audio.analyzer = APP.audio.ctx.createAnalyser();
        APP.audio.panner = APP.audio.ctx.createPanner();
        APP.audio.compressor = APP.audio.ctx.createDynamicsCompressor();
        APP.audio.masterGain = APP.audio.ctx.createGain();

        // 3D Audio Defaults
        APP.audio.panner.panningModel = 'HRTF';
        APP.audio.panner.distanceModel = 'inverse';

        // Broadcast Compressor
        APP.audio.compressor.threshold.setValueAtTime(-18, APP.audio.ctx.currentTime);
        APP.audio.compressor.ratio.setValueAtTime(12, APP.audio.ctx.currentTime);

        // Chain
        APP.audio.source
            .connect(APP.audio.panner)
            .connect(APP.audio.compressor)
            .connect(APP.audio.masterGain)
            .connect(APP.audio.analyzer)
            .connect(APP.audio.ctx.destination);

        APP.audio.isConnected = true;
        APP.audio.vuData = new Uint8Array(APP.audio.analyzer.frequencyBinCount);
        
        updateVU();
        log('DAW_ENGINE_ACTIVE');
    } catch (e) { log('AUDIO_ERR: ' + e.message); }
}

function setSpatialMode(mode) {
    if (!APP.audio.isConnected) return;
    
    APP.audio.spatialMode = mode;
    
    // --- SYNTAX FIX: SWITCH BLOCK ---
    switch(mode) {
        case 'stereo':
            APP.audio.spatialEnabled = false;
            APP.audio.panner.panningModel = 'equalpower';
            positionAudio(0, 0, -1);
            break;
            
        case '3d':
            APP.audio.spatialEnabled = true;
            APP.audio.panner.panningModel = 'HRTF';
            positionAudio(0, 0, -2);
            break;
            
        case 'dolby':
            APP.audio.spatialEnabled = true;
            APP.audio.panner.panningModel = 'HRTF';
            positionAudio(0, 5, -2);
            break;
    }
    
    // Update UI
    ['stereo', 'spatial', 'dolby'].forEach(m => {
        const btn = $(`btn-${m === '3d' ? 'spatial' : m}`);
        if(btn) btn.classList.toggle('on', mode === (m === 'spatial' ? '3d' : m));
    });

    log(`MODE: ${mode.toUpperCase()}`);
}

function positionAudio(x, y, z) {
    if (!APP.audio.panner) return;
    if (APP.audio.panner.positionX) {
        APP.audio.panner.positionX.setValueAtTime(x, APP.audio.ctx.currentTime);
        APP.audio.panner.positionY.setValueAtTime(y, APP.audio.ctx.currentTime);
        APP.audio.panner.positionZ.setValueAtTime(z, APP.audio.ctx.currentTime);
    } else {
        APP.audio.panner.setPosition(x, y, z);
    }
}

function updateVU() {
    requestAnimationFrame(updateVU);
    if (!APP.audio.analyzer || !APP.audio.isPlaying) return;
    
    APP.audio.analyzer.getByteFrequencyData(APP.audio.vuData);
    const bars = $('vu').children;
    if (bars.length > 0) {
        for (let i = 0; i < bars.length; i++) {
            bars[i].style.height = Math.max(2, (APP.audio.vuData[i * 2] / 255) * 28) + 'px';
        }
    }
    
    const currentBass = (APP.audio.vuData[0] + APP.audio.vuData[1] + APP.audio.vuData[2]) / 3;
    APP.audio.bassLevel = currentBass;
    const bassDelta = currentBass - APP.vj.lastBassLevel;

    // Reactivity
    if (APP.vj.uiReactivity && bassDelta > 45 && currentBass > 160) {
        const logo = $('main-logo');
        if(logo) {
            logo.style.filter = 'brightness(2)';
            setTimeout(() => logo.style.filter = '', 150);
        }
    }
    
    APP.vj.lastBassLevel = currentBass;
}

// ═══════════════════════════════════════════════════════════════════════════
// MEDIA LOGIC
// ═══════════════════════════════════════════════════════════════════════════
function loadMediaFiles(input) {
    if(!input.files) return;
    const isFirstLoad = APP.media.currentIndex === -1;
    
    Array.from(input.files).forEach((file, idx) => {
        const url = URL.createObjectURL(file);
        const type = file.type.startsWith('video') ? 'video' : 'image';
        const item = { type, url, element: null, name: file.name };
        
        if (type === 'video') {
            const vid = document.createElement('video');
            vid.src = url;
            vid.muted = true;
            vid.loop = !APP.state.isCycle;
            vid.playsInline = true;
            item.element = vid;
            if($('media-container')) $('media-container').appendChild(vid);
        } else {
            const img = new Image();
            img.src = url;
            item.element = img;
        }
        APP.media.queue.push(item);
        
        if (isFirstLoad && idx === 0) rotateMedia();
    });
    
    if($('q-count')) $('q-count').textContent = APP.media.queue.length;
    if($('media-dot')) $('media-dot').classList.remove('off');
    log(`MEDIA: +${input.files.length}`);
}

function rotateMedia() {
    if (APP.media.queue.length === 0) return;
    
    // Stop current
    if (APP.media.currentElement?.tagName === 'VIDEO') {
        APP.media.currentElement.pause();
    }
    
    APP.media.currentIndex = (APP.media.currentIndex + 1) % APP.media.queue.length;
    const item = APP.media.queue[APP.media.currentIndex];
    
    if (item.type === 'video') {
        item.element.currentTime = 0;
        item.element.play().catch(()=>{});
    }
    
    APP.media.currentElement = item.element;
    log(`SNAP: ${APP.media.currentIndex + 1}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// CAMERA LOGIC
// ═══════════════════════════════════════════════════════════════════════════
async function initCamera() {
    try {
        APP.camera.stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: false
        });
        $('preview-vid').srcObject = APP.camera.stream;
        $('cam-preview').style.display = 'block';
        $('btn-init-cam').style.display = 'none';
        $('cam-ctrls').style.display = 'block';
        $('cam-dot').classList.remove('off');
        log('CAM_ONLINE');
        
        // Init Audio Context on user gesture implicitly here
        if (!APP.audio.ctx) APP.audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { log('CAM_FAIL'); }
}

function goLive() {
    if (!APP.camera.stream) return;
    APP.state.isLive = true;
    $('live-ctrls').style.display = 'block';
    $('cam-ctrls').style.display = 'none';
    $('status-text').textContent = 'LIVE';
    $('main-dot').classList.add('live');
    log('LIVE');
}

function endLive() {
    APP.state.isLive = false;
    $('live-ctrls').style.display = 'none';
    $('cam-ctrls').style.display = 'block';
    $('status-text').textContent = 'STANDBY';
    $('main-dot').classList.remove('live');
    log('END_LIVE');
}

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM BOOT (UNIFIED)
// ═══════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    log('DRIS//core_VNGRD_v22.1_SOVEREIGN');
    
    // 1. Hardware Init
    try {
        checkMobile();
        initCanvas();
        APP.render.lastFpsUpdate = performance.now();
        requestAnimationFrame(renderLoop);
        
        updateClock();
        setInterval(updateClock, 1000);
        
        // Reveal
        setTimeout(() => {
            if($('blur-reveal')) $('blur-reveal').style.opacity = '0';
            setTimeout(() => { if($('blur-reveal')) $('blur-reveal').remove(); }, 800);
            log('CORE_ONLINE');
        }, 500);
        
    } catch(e) { log('BOOT_FAIL'); }
    
    // 2. DOM Bindings
    const bind = (id, evt, func) => { if($(id)) $(id).addEventListener(evt, func); };
    
    // Camera
    bind('btn-init-cam', 'click', initCamera);
    bind('btn-go-live', 'click', goLive);
    bind('btn-end', 'click', endLive);
    
    // Media
    bind('btn-media', 'click', () => $('file-media').click());
    bind('file-media', 'change', e => loadMediaFiles(e.target));
    bind('btn-rotate', 'click', rotateMedia);
    
    // Audio
    bind('btn-audio', 'click', () => $('file-audio').click());
    bind('file-audio', 'change', e => {
        if(e.target.files.length) {
            APP.audio.element.src = URL.createObjectURL(e.target.files[0]);
            APP.audio.element.play();
            APP.audio.isPlaying = true;
            setupAudioAnalyzer();
        }
    });
    
    // Audio Controls
    bind('btn-stereo', 'click', () => setSpatialMode('stereo'));
    bind('btn-spatial', 'click', () => setSpatialMode('3d'));
    bind('btn-dolby', 'click', () => setSpatialMode('dolby'));
    
    // VJ Controls
    bind('sl-b', 'input', e => { APP.vj.brightness = e.target.value/100; $('val-b').textContent = e.target.value + '%'; });
    bind('sl-c', 'input', e => { APP.vj.contrast = e.target.value/100; $('val-c').textContent = e.target.value + '%'; });
    bind('btn-trails', 'click', () => { 
        APP.vj.trailsEnabled = !APP.vj.trailsEnabled; 
        $('btn-trails').classList.toggle('on'); 
    });
    
    // Logo Morph Loop
    (function morph() {
        const logo = $('main-logo');
        if(logo) {
            APP.ui.morphs.forEach(m => logo.classList.remove(m));
            APP.ui.logoMorph = (APP.ui.logoMorph + 1) % APP.ui.morphs.length;
            logo.classList.add(APP.ui.morphs[APP.ui.logoMorph]);
        }
        setTimeout(morph, 4000);
    })();
});