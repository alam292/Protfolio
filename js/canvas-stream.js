/**
 * CanvasStream Controller
 * Smooth scroll-scrubbed 300-frame canvas stream with kinematics,
 * DPR adaptation, frame caching, and mouse parallax.
 */

class CanvasStream {
  constructor(options = {}) {
    this.totalFrames = options.totalFrames || 300;
    this.frameDir = options.frameDir || 'ezgif-8638738b594a7204-jpg';
    this.canvasId = options.canvasId || 'canvas';
    this.containerId = options.containerId || 'canvas-container';

    this.canvas = document.getElementById(this.canvasId);
    this.container = document.getElementById(this.containerId);
    if (!this.canvas || !this.container) return;

    this.ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true });
    this.frames = new Array(this.totalFrames);
    this.loaded = new Array(this.totalFrames).fill(false);

    this.currentFrame = 0;
    this.targetFrame = 0;
    this.lastRenderedFrame = -1;

    // Parallax
    this.mouseX = 0;
    this.mouseY = 0;
    this.currentParallaxX = 0;
    this.currentParallaxY = 0;

    // Layout cache
    this.dpr = 1;
    this.vw = 0;
    this.vh = 0;
    this.drawX = 0;
    this.drawY = 0;
    this.drawW = 0;
    this.drawH = 0;
    this.needsRedraw = true;

    this.isRunning = false;

    this.init();
  }

  getFrameUrl(index) {
    const padded = String(index).padStart(3, '0');
    return `${this.frameDir}/ezgif-frame-${padded}.jpg`;
  }

  init() {
    this.updateDimensions();
    this.bindEvents();
    this.preload();
    this.startLoop();
  }

  updateDimensions() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;

    this.canvas.width = Math.round(this.vw * this.dpr);
    this.canvas.height = Math.round(this.vh * this.dpr);

    const iw = 1280;
    const ih = 720;
    const scale = Math.max(this.vw / iw, this.vh / ih);

    this.drawW = Math.round(iw * scale * this.dpr);
    this.drawH = Math.round(ih * scale * this.dpr);
    this.drawX = Math.round(((this.vw - (iw * scale)) / 2) * this.dpr);
    this.drawY = Math.round(((this.vh - (ih * scale)) / 2) * this.dpr);

    this.needsRedraw = true;
    this.renderFrame(Math.round(this.currentFrame));
  }

  bindEvents() {
    window.addEventListener('resize', () => this.updateDimensions(), { passive: true });

    window.addEventListener('mousemove', (e) => {
      const halfX = window.innerWidth / 2;
      const halfY = window.innerHeight / 2;
      this.mouseX = (e.clientX - halfX) / halfX;
      this.mouseY = (e.clientY - halfY) / halfY;
    }, { passive: true });

    window.addEventListener('scroll', () => {
      const docElem = document.documentElement;
      const maxScroll = docElem.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const scrollY = window.pageYOffset || docElem.scrollTop || 0;
      const progress = Math.max(0, Math.min(1, scrollY / maxScroll));
      this.targetFrame = progress * (this.totalFrames - 1);
    }, { passive: true });
  }

  getBestFrameIndex(requestedIndex) {
    if (this.loaded[requestedIndex]) return requestedIndex;

    for (let offset = 1; offset < this.totalFrames; offset++) {
      const prev = requestedIndex - offset;
      if (prev >= 0 && this.loaded[prev]) return prev;
      const next = requestedIndex + offset;
      if (next < this.totalFrames && this.loaded[next]) return next;
    }
    return -1;
  }

  renderFrame(index) {
    const frameIdx = this.getBestFrameIndex(index);
    if (frameIdx === -1) return;
    if (frameIdx === this.lastRenderedFrame && !this.needsRedraw) return;

    const img = this.frames[frameIdx];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    this.ctx.drawImage(img, this.drawX, this.drawY, this.drawW, this.drawH);
    this.lastRenderedFrame = frameIdx;
    this.needsRedraw = false;
  }

  startLoop() {
    if (this.isRunning) return;
    this.isRunning = true;

    const loop = () => {
      const diff = this.targetFrame - this.currentFrame;
      if (Math.abs(diff) > 0.0001) {
        this.currentFrame += diff * 0.085;
      } else {
        this.currentFrame = this.targetFrame;
      }

      this.currentParallaxX += (this.mouseX - this.currentParallaxX) * 0.05;
      this.currentParallaxY += (this.mouseY - this.currentParallaxY) * 0.05;

      const px = (this.currentParallaxX * -8).toFixed(2);
      const py = (this.currentParallaxY * -6).toFixed(2);
      const scrollProgress = this.currentFrame / (this.totalFrames - 1);
      const zoom = (1 + scrollProgress * 0.035).toFixed(4);

      if (this.container) {
        this.container.style.transform = `translate3d(${px}px, ${py}px, 0) scale(${zoom})`;
      }

      this.renderFrame(Math.round(this.currentFrame));
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  preload() {
    // 1. First frame immediate priority
    const firstImg = new Image();
    firstImg.src = this.getFrameUrl(1);
    this.frames[0] = firstImg;
    firstImg.onload = () => {
      this.loaded[0] = true;
      this.needsRedraw = true;
      this.renderFrame(0);
    };

    // 2. Preload remaining sequence with decode()
    for (let i = 2; i <= this.totalFrames; i++) {
      const img = new Image();
      const idx = i - 1;
      img.src = this.getFrameUrl(i);
      this.frames[idx] = img;

      if (img.decode) {
        img.decode().then(() => {
          this.loaded[idx] = true;
          if (Math.round(this.currentFrame) === idx) {
            this.needsRedraw = true;
            this.renderFrame(idx);
          }
        }).catch(() => {
          this.loaded[idx] = true;
        });
      } else {
        img.onload = () => {
          this.loaded[idx] = true;
          if (Math.round(this.currentFrame) === idx) {
            this.needsRedraw = true;
            this.renderFrame(idx);
          }
        };
      }
    }
  }

  setTargetFrame(frameIndex) {
    this.targetFrame = Math.max(0, Math.min(this.totalFrames - 1, frameIndex));
  }
}

window.CanvasStream = CanvasStream;

