const $ = id => document.getElementById(id);

const APP = {
    state: {
        isLive: false, isRecording: false, isFullscreen: false,
        isCycle: false, cycleTimer: null, isMobile: false,
        theme: 'cyan', startTime: Date.now(), lastPrices: { btc: 0, eth: 0, sol: 0 }
    },
    vj: {
        brightness: 1.0, contrast: 1.0, saturation: 1.0, hue: 0,
        trailsEnabled: false, trailAlpha: 0.92, rgbEnabled: false,
        rgbIntensity: 0, rgbBassLink: false, pixelateEnabled: false,
        pixelSize: 1, rumbleEnabled: false, invert: false,
        uiReactivity: false, shakeIntensity: 0, lastBassLevel: 0
    },
    media: { queue: [], currentIndex: -1, currentElement: null },
    audio: {
        ctx: null, analyzer: null, source: null, element: null,
        playlist: [], currentTrack: -1, isPlaying: false, isConnected: false,
        spatialMode: 'stereo', panner: null, compressor: null, masterGain: null,
        vuData: new Uint8Array(32)
    },
    camera: { stream: null, recorder: null, chunks: [], mode: 'off', isRecording: false },
    render: { canvas: null, ctx: null, width: 1920, height: 1080, fps: 0, frameCount: 0, lastFpsUpdate: 0, scale: 1.0 },
    bug: { visible: true, text: 'DRIS//core', image: null, scale: 1.0, style: 'cyan' },
    ui: { logoMorph: 0, morphs: ['m1','m2','m3','m4','m5','m6','m7','m8','m9','m10','m11','m12','m13','m14','m15'] }
};

// --- CORE UTILS ---
function log(msg) {
    const box = $('sys-log');
    const ts = new Date().toTimeString().split(' ')[0];
    const el = document.createElement('div');
    el.className = 'log-line';
    el.innerHTML = `<span class="ts">${ts}</span>${msg}`;
    box.insertBefore(el, box.firstChild);
    if (box.children.length > 30) box.lastChild.remove();
}

function checkMobile() {
    APP.state.isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
    if (APP.state.isMobile) {
        APP.render.width = 960; APP.render.height = 540;
        log('MOBILE_MODE');
    }
}

// --- VISUAL ENGINE ---
function initCanvas() {
    APP.render.canvas = $('vj-canvas');
    APP.render.ctx = APP.render.canvas.getContext('2d', { alpha: false, desynchronized: true });
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    APP.render.canvas.width = APP.render.width;
    APP.render.canvas.height = APP.render.height;
    $('res').textContent = `${APP.render.width}x${APP.render.height}`;
}

function renderLoop(timestamp) {
    requestAnimationFrame(renderLoop);
    APP.render.frameCount++;
    if (timestamp - APP.render.lastFpsUpdate >= 1000) {
        APP.render.fps = APP.render.frameCount;
        APP.render.frameCount = 0;
        APP.render.lastFpsUpdate = timestamp;
        $('fps-val').textContent = APP.render.fps;
    }

    const ctx = APP.render.ctx;
    const { width: w, height: h } = APP.render;

    ctx.imageSmoothingEnabled = false;
    
    // Background / Trails
    if (APP.vj.trailsEnabled) {
        ctx.globalAlpha = APP.vj.trailAlpha;
        ctx.drawImage(APP.render.canvas, 0, 0);
        ctx.globalAlpha = 1;
    } else {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
    }

    let source = APP.state.isLive ? $('preview-vid') : APP.media.currentElement;

    if (source) {
        const ready = source.tagName === 'VIDEO' ? source.readyState >= 2 : source.complete;
        if (ready) {
            ctx.filter = `brightness(${APP.vj.brightness}) contrast(${APP.vj.contrast}) saturate(${APP.vj.saturation}) hue-rotate(${APP.vj.hue}deg)${APP.vj.invert ? ' invert(1)' : ''}`;
            
            const srcW = source.videoWidth || source.naturalWidth || source.width;
            const srcH = source.videoHeight || source.naturalHeight || source.height;
            
            // Image Fit Logic (Saved Preference)
            let scale = APP.state.isFullscreen ? Math.max(w / srcW, h / srcH) : Math.min(w / srcW, h / srcH);
            let dW = srcW * scale, dH = srcH * scale;
            ctx.drawImage(source, (w - dW) / 2, (h - dH) / 2, dW, dH);
            ctx.filter = 'none';
        }
    }
}

// --- AUDIO ENGINE ---
function setupAudioAnalyzer() {
    if (!APP.audio.ctx) APP.audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    // ERROR-FREE GUARD: Prevent duplicate source attachment
    if (!APP.audio.source) {
        APP.audio.source = APP.audio.ctx.createMediaElementSource($('audio-el'));
    }

    APP.audio.analyzer = APP.audio.ctx.createAnalyser();
    APP.audio.compressor = APP.audio.ctx.createDynamicsCompressor();
    APP.audio.masterGain = APP.audio.ctx.createGain();

    APP.audio.source.connect(APP.audio.compressor).connect(APP.audio.masterGain).connect(APP.audio.analyzer).connect(APP.audio.ctx.destination);
    APP.audio.isConnected = true;
    log('AUDIO_STABLE');
}



// --- BOOT SEQUENCE ---
document.addEventListener('DOMContentLoaded', () => {
    checkMobile();
    initCanvas();
    requestAnimationFrame(renderLoop);

    // One-time UI Morph Loop
    (function morph() {
        const logo = $('main-logo');
        APP.ui.morphs.forEach(m => logo.classList.remove(m));
        APP.ui.logoMorph = (APP.ui.logoMorph + 1) % APP.ui.morphs.length;
        logo.classList.add(APP.ui.morphs[APP.ui.logoMorph]);
        setTimeout(morph, 4000);
    })();

    // Unified Input Bindings
    $('btn-init-cam').onclick = () => { /* initCamera Logic */ };
    $('btn-media').onclick = () => $('file-media').click();
    $('btn-audio').onclick = () => $('file-audio').click();
    
    log('SOVEREIGN_CORE_ONLINE');
});