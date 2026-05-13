/* ============================================================
   WORLD ENVIRONMENT DAY — VFX INTRO ENGINE
   Canvas: particles, plants, fireflies, water drops, ripples
   ============================================================ */
(function () {
  'use strict';

  /* ---- Target date: June 5 2026 midnight IST ---- */
  const TARGET = new Date('2026-06-05T00:00:00+05:30').getTime();

  /* ============================================================
     BUILD DOM
  ============================================================ */
  /* ============================================================
     COUNTDOWN TIMER
  ============================================================ */
  const prevVals = {};

  function flipDigit(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    if (prevVals[id] !== val) {
      el.classList.remove('flip');
      void el.offsetWidth; // reflow
      el.classList.add('flip');
      prevVals[id] = val;
    }
    el.textContent = val;
  }

  function updateCountdown() {
    const now = Date.now();
    const diff = TARGET - now;

    if (diff <= 0) {
      // Celebration!
      const intro = document.getElementById('wed-intro');
      if (intro && !intro.classList.contains('celebrating')) {
        intro.classList.add('celebrating');
        triggerFireworks();
      }
      return;
    }

    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);

    flipDigit('wd-days',  String(days).padStart(3, '0'));
    flipDigit('wd-hours', String(hours).padStart(2, '0'));
    flipDigit('wd-mins',  String(mins).padStart(2, '0'));
    flipDigit('wd-secs',  String(secs).padStart(2, '0'));
  }

  /* ============================================================
     CANVAS VFX ENGINE
  ============================================================ */
  let canvas, ctx, W, H, raf;
  let grassCanvas, grassCtx, grassW = 0;
  const particles  = [];
  const drops      = [];
  const fireflies  = [];
  const ripples    = [];
  const leaves     = [];
  const fireworks  = [];
  let celebrating  = false;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    // Rebuild grass on resize
    buildGrass();
  }

  /* ---- PARTICLE (pollen / dust) ---- */
  function Particle() {
    this.reset();
  }
  Particle.prototype.reset = function () {
    this.x  = Math.random() * W;
    this.y  = H + 10;
    this.r  = Math.random() * 2.5 + 0.5;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = -(Math.random() * 0.8 + 0.3);
    this.life = 1;
    this.decay = Math.random() * 0.003 + 0.001;
    const g = Math.floor(Math.random() * 80 + 160);
    this.color = `rgba(${Math.floor(g*0.4)},${g},${Math.floor(g*0.5)},`;
  };
  Particle.prototype.update = function () {
    this.x += this.vx + Math.sin(Date.now() * 0.001 + this.x) * 0.3;
    this.y += this.vy;
    this.life -= this.decay;
    if (this.life <= 0 || this.y < -20) this.reset();
  };
  Particle.prototype.draw = function () {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color + this.life + ')';
    ctx.fill();
  };

  /* ---- WATER DROP ---- */
  function Drop() {
    this.reset();
  }
  Drop.prototype.reset = function () {
    this.x   = Math.random() * W;
    this.y   = -20;
    this.len = Math.random() * 18 + 8;
    this.vx  = (Math.random() - 0.5) * 1.2;
    this.vy  = Math.random() * 5 + 4;
    this.life= 1;
    this.r   = Math.random() * 1.2 + 0.4;
  };
  Drop.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;
    if (this.y > H) {
      // spawn ripple
      ripples.push(new Ripple(this.x, H - 10));
      this.reset();
    }
  };
  Drop.prototype.draw = function () {
    ctx.save();
    ctx.strokeStyle = `rgba(120,220,180,${0.4 + Math.random()*0.15})`;
    ctx.lineWidth   = this.r;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.vx * 3, this.y - this.len);
    ctx.stroke();
    // droplet head
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(160,240,200,0.5)`;
    ctx.fill();
    ctx.restore();
  };

  /* ---- RIPPLE ---- */
  function Ripple(x, y) {
    this.x = x; this.y = y;
    this.radius = 2; this.life = 1;
  }
  Ripple.prototype.update = function () {
    this.radius += 1.8;
    this.life   -= 0.04;
  };
  Ripple.prototype.draw = function () {
    if (this.life <= 0) return;
    ctx.save();
    ctx.strokeStyle = `rgba(100,220,160,${this.life * 0.4})`;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.radius, this.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };

  /* ---- FIREFLY ---- */
  function Firefly() {
    this.x  = Math.random() * W;
    this.y  = Math.random() * H * 0.7 + H * 0.1;
    this.r  = Math.random() * 3 + 1.5;
    this.phase = Math.random() * Math.PI * 2;
    this.speed = Math.random() * 0.01 + 0.005;
    this.ax = (Math.random() - 0.5) * 0.008;
    this.ay = (Math.random() - 0.5) * 0.006;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.3;
  }
  Firefly.prototype.update = function () {
    this.phase += this.speed;
    this.vx   += this.ax;
    this.vy   += this.ay;
    this.vx    = Math.max(-0.8, Math.min(0.8, this.vx));
    this.vy    = Math.max(-0.6, Math.min(0.6, this.vy));
    this.x    += this.vx;
    this.y    += this.vy;
    if (this.x < 0 || this.x > W) this.vx *= -1;
    if (this.y < 0 || this.y > H * 0.85) this.vy *= -1;
  };
  Firefly.prototype.draw = function () {
    const alpha = (Math.sin(this.phase) * 0.5 + 0.5) * 0.85 + 0.1;
    const grd   = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 4);
    grd.addColorStop(0,   `rgba(160,255,130,${alpha})`);
    grd.addColorStop(0.4, `rgba(80,220,100,${alpha * 0.5})`);
    grd.addColorStop(1,   `rgba(40,180,80,0)`);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * 4, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220,255,200,${alpha})`;
    ctx.fill();
  };

  /* ---- FLOATING LEAF ---- */
  function Leaf() {
    this.reset();
  }
  Leaf.prototype.reset = function () {
    this.x     = Math.random() * W * 1.2 - W * 0.1;
    this.y     = -30;
    this.rot   = Math.random() * Math.PI * 2;
    this.rotV  = (Math.random() - 0.5) * 0.04;
    this.vx    = (Math.random() - 0.5) * 1.5;
    this.vy    = Math.random() * 1 + 0.5;
    this.size  = Math.random() * 14 + 8;
    this.life  = 1;
    this.sway  = Math.random() * 0.02 + 0.008;
    this.phase = Math.random() * Math.PI * 2;
    const g    = Math.floor(Math.random() * 60 + 80);
    this.color = `rgba(${Math.floor(g*0.3)},${g},${Math.floor(g*0.35)},`;
  };
  Leaf.prototype.update = function () {
    this.phase += this.sway;
    this.x    += this.vx + Math.sin(this.phase) * 0.8;
    this.y    += this.vy;
    this.rot  += this.rotV;
    if (this.y > H + 40) this.reset();
  };
  Leaf.prototype.draw = function () {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.beginPath();
    ctx.moveTo(0, -this.size);
    ctx.bezierCurveTo( this.size * 0.8, -this.size * 0.3,  this.size * 0.8,  this.size * 0.3, 0,  this.size);
    ctx.bezierCurveTo(-this.size * 0.8,  this.size * 0.3, -this.size * 0.8, -this.size * 0.3, 0, -this.size);
    ctx.fillStyle = this.color + '0.75)';
    ctx.fill();
    ctx.strokeStyle = this.color + '0.9)';
    ctx.lineWidth   = 0.8;
    ctx.stroke();
    // vein
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 0.9);
    ctx.lineTo(0,  this.size * 0.9);
    ctx.strokeStyle = `rgba(180,255,180,0.3)`;
    ctx.lineWidth   = 0.7;
    ctx.stroke();
    ctx.restore();
  };

  /* ---- FIREWORK BURST (celebration) ---- */
  function Firework(x, y) {
    this.x = x; this.y = y;
    this.particles = [];
    const count = 60 + Math.floor(Math.random() * 40);
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const spd = Math.random() * 5 + 2;
      const hue = Math.floor(Math.random() * 360);
      this.particles.push({
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 1,
        decay: Math.random() * 0.018 + 0.01,
        r: Math.random() * 2.5 + 1,
        color: `hsl(${hue},90%,65%)`
      });
    }
  }
  Firework.prototype.update = function () {
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.08;
      p.vx *= 0.98;
      p.life -= p.decay;
    });
    this.particles = this.particles.filter(p => p.life > 0);
  };
  Firework.prototype.draw = function () {
    this.particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace('hsl', 'hsla').replace(')', `,${p.life})`);
      ctx.fill();
    });
  };
  Firework.prototype.done = function () { return this.particles.length === 0; };

  function triggerFireworks() {
    celebrating = true;
    const burst = () => {
      fireworks.push(new Firework(
        W * (0.2 + Math.random() * 0.6),
        H * (0.1 + Math.random() * 0.5)
      ));
    };
    for (let i = 0; i < 5; i++) setTimeout(burst, i * 300);
    setInterval(burst, 1500);
  }

  /* ---- GRASS STRIP (built once, redrawn on resize) ---- */
  // Store blade data so we can animate sway without resizing the canvas
  const grassBlades = [];

  function buildGrass() {
    grassCanvas = document.getElementById('wed-grass-canvas');
    if (!grassCanvas) return;
    const cw = window.innerWidth;
    grassCanvas.width  = cw;
    grassCanvas.height = 220;
    grassCtx = grassCanvas.getContext('2d');
    grassW   = cw;
    grassBlades.length = 0;
    const count = Math.floor(cw / 5);
    for (let i = 0; i < count; i++) {
      const g = Math.floor(Math.random() * 60 + 80);
      grassBlades.push({
        bx:   (i / count) * cw + (Math.random() - 0.5) * 10,
        bh:   Math.random() * 100 + 50,
        bw:   Math.random() * 3 + 1,
        phase: Math.random() * Math.PI * 2,
        color: `rgba(${Math.floor(g*0.25)},${g},${Math.floor(g*0.3)},0.85)`
      });
    }
  }

  function drawGrass() {
    if (!grassCtx || !grassBlades.length) return;
    grassCtx.clearRect(0, 0, grassW, 220);
    const t = Date.now() * 0.001;
    grassBlades.forEach(b => {
      const sway = Math.sin(b.phase + t * 0.8) * 16;
      grassCtx.save();
      grassCtx.strokeStyle = b.color;
      grassCtx.lineWidth   = b.bw;
      grassCtx.beginPath();
      grassCtx.moveTo(b.bx, 220);
      grassCtx.quadraticCurveTo(b.bx + sway * 0.5, 220 - b.bh * 0.5, b.bx + sway, 220 - b.bh);
      grassCtx.stroke();
      grassCtx.restore();
    });
  }

  /* ---- MAIN LOOP ---- */
  function loop() {
    ctx.clearRect(0, 0, W, H);

    // Soft vignette
    const vgrd = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.85);
    vgrd.addColorStop(0,   'rgba(0,0,0,0)');
    vgrd.addColorStop(1,   'rgba(0,10,2,0.55)');
    ctx.fillStyle = vgrd;
    ctx.fillRect(0, 0, W, H);

    // Update & draw
    particles.forEach(p  => { p.update(); p.draw(); });
    leaves.forEach(l     => { l.update(); l.draw(); });
    drops.forEach(d      => { d.update(); d.draw(); });

    // Ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].update();
      ripples[i].draw();
      if (ripples[i].life <= 0) ripples.splice(i, 1);
    }

    fireflies.forEach(f  => { f.update(); f.draw(); });

    // Fireworks
    for (let i = fireworks.length - 1; i >= 0; i--) {
      fireworks[i].update();
      fireworks[i].draw();
      if (fireworks[i].done()) fireworks.splice(i, 1);
    }

    // Animated grass
    drawGrass();

    raf = requestAnimationFrame(loop);
  }

  /* ---- INIT VFX ---- */
  function initVFX() {
    canvas = document.getElementById('wed-canvas');
    ctx    = canvas.getContext('2d');
    resize(); // also calls buildGrass()
    window.addEventListener('resize', resize);

    // Particle counts — balanced for performance
    const isMobile = window.innerWidth < 640;
    const pCount = isMobile ? 40 : 70;
    const dCount = isMobile ? 18 : 30;
    const fCount = isMobile ? 14 : 24;
    const lCount = isMobile ? 12 : 20;

    for (let i = 0; i < pCount; i++) {
      const p = new Particle();
      p.y = Math.random() * H;
      particles.push(p);
    }
    for (let i = 0; i < dCount; i++) {
      const d = new Drop();
      d.y = Math.random() * H;
      drops.push(d);
    }
    for (let i = 0; i < fCount; i++) fireflies.push(new Firefly());
    for (let i = 0; i < lCount; i++) {
      const lf = new Leaf();
      lf.y = Math.random() * H;
      leaves.push(lf);
    }

    loop();
  }

  /* ============================================================
     DISMISS / SKIP
  ============================================================ */
  function dismiss() {
    const intro = document.getElementById('wed-intro');
    if (!intro || intro.classList.contains('exiting')) return;
    intro.classList.add('exiting');
    cancelAnimationFrame(raf);
    setTimeout(() => {
      intro.remove();
      document.body.style.overflow = '';
    }, 1200);
  }

  /* ============================================================
     BOOTSTRAP — DOM already in HTML, just wire up
  ============================================================ */
  function init() {
    initVFX();

    // Countdown tick
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Skip button
    const skipBtn = document.getElementById('wed-skip');
    if (skipBtn) skipBtn.addEventListener('click', dismiss);

    // Auto-dismiss after 12 s (if not celebrating)
    setTimeout(() => {
      const intro = document.getElementById('wed-intro');
      if (intro && !intro.classList.contains('celebrating')) dismiss();
    }, 12000);
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
