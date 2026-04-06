(() => {
  const cvs = document.getElementById('game');
  const ctx = cvs.getContext('2d');
  const panel = document.getElementById('panel');
  const startBtn = document.getElementById('start');
  const lvlEl = document.getElementById('lvl');
  const bestEl = document.getElementById('best');
  const attemptsEl = document.getElementById('attempts');
  const crashesEl = document.getElementById('crashes');
  const streakEl = document.getElementById('streak');
  const srStatus = document.getElementById('sr-status');
  const restartBtn = document.getElementById('restart');
  const muteBtn = document.getElementById('mute');
  const dailySeedCheckbox = document.getElementById('daily-seed');

  // ---- storage ----
  const memoryStorage = new Map();
  function safeGet(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ?? fallback;
    } catch {
      return memoryStorage.get(key) ?? fallback;
    }
  }
  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      memoryStorage.set(key, value);
    }
  }

  // ---- audio ----
  let audioCtx;
  let muted = safeGet('gw_muted', '0') === '1';
  function updateMuteUi() {
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
  }
  updateMuteUi();
  function ensureAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
  }
  function beep(freq = 440, ms = 90, type = 'sine', gain = 0.04) {
    if (muted) return;
    ensureAudio();
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g).connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
    o.start(now);
    o.stop(now + ms / 1000);
  }

  // ---- rng ----
  function mulberry32(seed) {
    return function rand() {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const nowDate = new Date().toISOString().slice(0, 10);
  const dateSeed = nowDate.split('-').join('');
  let useDailySeed = safeGet('gw_daily_seed', '1') === '1';
  dailySeedCheckbox.checked = useDailySeed;
  let randFn = Math.random;
  function seededRandom(seedOffset = 0) {
    const seed = Number(dateSeed) + seedOffset;
    randFn = useDailySeed ? mulberry32(seed) : Math.random;
  }
  function rand(a, b) {
    return a + randFn() * (b - a);
  }

  // ---- dimensions ----
  let W = 0,
    H = 0,
    DPR = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    cvs.width = W * DPR;
    cvs.height = H * DPR;
    cvs.style.width = `${W}px`;
    cvs.style.height = `${H}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- stars ----
  let stars = [];
  function makeStars() {
    stars = [];
    const n = Math.floor((W * H) / 6000);
    for (let i = 0; i < n; i++) {
      stars.push({
        x: randFn() * W,
        y: randFn() * H,
        r: randFn() * 1.4 + 0.2,
        t: randFn() * Math.PI * 2,
      });
    }
  }
  makeStars();
  window.addEventListener('resize', makeStars);

  // ---- state ----
  let level = 1;
  let best = parseInt(safeGet('gw_best', '0'), 10);
  let attempts = 0;
  let crashesTotal = parseInt(safeGet('gw_crashes_total', '0'), 10);
  let streak = 0;
  bestEl.textContent = best;
  crashesEl.textContent = crashesTotal;

  let ship, goal, planets, particles, trail, ghosts;
  let aiming = false;
  let aimNow = null;
  let flying = false;
  let crashed = false;
  let won = false;
  let shake = 0;
  let pointerId = null;
  let launchVector = { x: 0, y: 0 };
  let aimStart = null;
  let keyboardMode = false;

  function announce(text) {
    srStatus.textContent = text;
  }

  function updateMetricsUi() {
    attemptsEl.textContent = attempts;
    crashesEl.textContent = crashesTotal;
    streakEl.textContent = streak;
  }
  updateMetricsUi();

  function buildLevel() {
    seededRandom(level * 1009);
    const minSide = Math.min(W, H);
    const margin = minSide * 0.12;
    ship = {
      x: margin + rand(0, minSide * 0.1),
      y: H - margin - rand(0, minSide * 0.1),
      vx: 0,
      vy: 0,
      r: 7,
    };
    goal = {
      x: W - margin - rand(0, minSide * 0.1),
      y: margin + rand(0, minSide * 0.1),
      r: minSide * 0.045,
    };
    planets = [];
    const count = Math.min(2 + Math.floor(level / 2), 6);
    let tries = 0;
    let planetId = 0;
    while (planets.length < count && tries < 400) {
      tries++;
      const r = rand(minSide * 0.04, minSide * 0.08);
      const x = rand(r + 20, W - r - 20);
      const y = rand(r + 80, H - r - 80);
      if (Math.hypot(x - ship.x, y - ship.y) < r + 80) continue;
      if (Math.hypot(x - goal.x, y - goal.y) < r + goal.r + 30) continue;
      let ok = true;
      for (const p of planets) {
        if (Math.hypot(x - p.x, y - p.y) < r + p.r + 30) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      planets.push({
        id: `p-${planetId++}`,
        x,
        y,
        r,
        m: r * r * 0.9,
        sign: randFn() < 0.3 ? -1 : 1,
        hue: rand(180, 320),
      });
    }
    particles = [];
    trail = [];
    ghosts = [];
    flying = false;
    crashed = false;
    won = false;
    aiming = false;
    aimNow = null;
    lvlEl.textContent = level;
    attempts = 0;
    updateMetricsUi();
    announce(`Level ${level} ready`);
  }

  let savedLayout = null;
  function snapshot() {
    savedLayout = {
      ship: { x: ship.x, y: ship.y },
      goal: { x: goal.x, y: goal.y, r: goal.r },
      planets: planets.map((p) => ({ ...p })),
    };
  }
  function restoreLayout() {
    if (trail && trail.length > 1) {
      ghosts.push(trail.map((t) => ({ x: t.x, y: t.y })));
      if (ghosts.length > 4) ghosts.shift();
    }
    ship = { x: savedLayout.ship.x, y: savedLayout.ship.y, vx: 0, vy: 0, r: 7 };
    goal = { ...savedLayout.goal };
    planets = savedLayout.planets.map((p) => ({ ...p }));
    particles = [];
    trail = [];
    flying = false;
    crashed = false;
    won = false;
    aiming = false;
    aimNow = null;
    lvlEl.textContent = level;
    announce(`Attempt ${attempts + 1}`);
  }
  function reset(toLevel, regen) {
    if (toLevel != null) level = toLevel;
    if (regen || !savedLayout) {
      buildLevel();
      snapshot();
    } else {
      restoreLayout();
    }
  }

  function setPlanetSign(planet) {
    planet.sign *= -1;
    if (savedLayout) {
      const sp = savedLayout.planets.find((s) => s.id === planet.id);
      if (sp) sp.sign = planet.sign;
    }
    beep(280, 70, 'triangle', 0.03);
  }

  function tryFlipPlanet(x, y) {
    for (const pl of planets) {
      if (Math.hypot(x - pl.x, y - pl.y) < pl.r + 14) {
        setPlanetSign(pl);
        return true;
      }
    }
    return false;
  }

  function launch(dx, dy) {
    const mag = Math.hypot(dx, dy);
    if (mag < 8) return;
    const power = Math.min(mag, 160) * 0.05;
    const ang = Math.atan2(dy, dx);
    ship.vx = Math.cos(ang) * power;
    ship.vy = Math.sin(ang) * power;
    flying = true;
    attempts += 1;
    updateMetricsUi();
    beep(540, 90, 'square', 0.03);
  }

  // ---- pointer input ----
  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    if (won || crashed) {
      reset(won ? level + 1 : level, won);
    }
    if (flying) return;
    if (tryFlipPlanet(e.clientX, e.clientY)) return;

    pointerId = e.pointerId;
    keyboardMode = false;
    aiming = true;
    aimStart = { x: e.clientX, y: e.clientY };
    aimNow = { x: e.clientX, y: e.clientY };
    launchVector = { x: 0, y: 0 };
    cvs.setPointerCapture(pointerId);
  }

  function onPointerMove(e) {
    if (!aiming || pointerId !== e.pointerId) return;
    e.preventDefault();
    aimNow = { x: e.clientX, y: e.clientY };
    launchVector = { x: aimStart.x - aimNow.x, y: aimStart.y - aimNow.y };
  }

  function onPointerUp(e) {
    if (!aiming || pointerId !== e.pointerId) return;
    e.preventDefault();
    aiming = false;
    pointerId = null;
    aimStart = null;
    launch(launchVector.x, launchVector.y);
    launchVector = { x: 0, y: 0 };
  }

  function onPointerCancel(e) {
    if (pointerId !== e.pointerId) return;
    aiming = false;
    pointerId = null;
    aimStart = null;
    launchVector = { x: 0, y: 0 };
  }

  cvs.addEventListener('pointerdown', onPointerDown, { passive: false });
  cvs.addEventListener('pointermove', onPointerMove, { passive: false });
  cvs.addEventListener('pointerup', onPointerUp, { passive: false });
  cvs.addEventListener('pointercancel', onPointerCancel, { passive: false });
  cvs.addEventListener('mouseleave', onPointerCancel, { passive: false });

  // ---- keyboard input ----
  const keyState = { up: false, down: false, left: false, right: false };
  function updateLaunchVectorFromKeys() {
    const x = (keyState.right ? 1 : 0) - (keyState.left ? 1 : 0);
    const y = (keyState.down ? 1 : 0) - (keyState.up ? 1 : 0);
    const len = Math.hypot(x, y);
    if (len === 0) {
      launchVector = { x: 0, y: 0 };
      return;
    }
    const magnitude = 120;
    launchVector = { x: (x / len) * magnitude, y: (y / len) * magnitude };
    keyboardMode = true;
    aiming = !flying;
  }

  function keyMap(e, isDown) {
    const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') keyState.up = isDown;
    if (k === 'arrowdown' || k === 's') keyState.down = isDown;
    if (k === 'arrowleft' || k === 'a') keyState.left = isDown;
    if (k === 'arrowright' || k === 'd') keyState.right = isDown;
  }

  window.addEventListener('keydown', (e) => {
    if (!panel.classList.contains('hidden')) return;
    if (won || crashed) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        reset(won ? level + 1 : level, won);
      }
      return;
    }

    if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      hardRestart();
      return;
    }
    if (e.key.toLowerCase() === 'm') {
      e.preventDefault();
      muted = !muted;
      safeSet('gw_muted', muted ? '1' : '0');
      updateMuteUi();
      return;
    }

    keyMap(e, true);
    updateLaunchVectorFromKeys();

    if ((e.key === ' ' || e.key === 'Enter') && !flying) {
      e.preventDefault();
      launch(launchVector.x, launchVector.y);
      aiming = false;
      launchVector = { x: 0, y: 0 };
    }
  });

  window.addEventListener('keyup', (e) => {
    keyMap(e, false);
    updateLaunchVectorFromKeys();
  });

  restartBtn.addEventListener('click', () => hardRestart());
  muteBtn.addEventListener('click', () => {
    muted = !muted;
    safeSet('gw_muted', muted ? '1' : '0');
    updateMuteUi();
    beep(600, 40, 'triangle', 0.02);
  });
  dailySeedCheckbox.addEventListener('change', () => {
    useDailySeed = dailySeedCheckbox.checked;
    safeSet('gw_daily_seed', useDailySeed ? '1' : '0');
    hardRestart();
  });

  function hardRestart() {
    level = 1;
    streak = 0;
    attempts = 0;
    reset(1, true);
    announce('Run restarted');
    updateMetricsUi();
  }

  startBtn.addEventListener('click', () => {
    panel.classList.add('hidden');
    hardRestart();
  });

  // ---- physics ----
  function step(dt) {
    if (!flying) return;
    let ax = 0;
    let ay = 0;
    for (const p of planets) {
      const dx = p.x - ship.x;
      const dy = p.y - ship.y;
      const d2 = dx * dx + dy * dy;
      const d = Math.sqrt(d2);
      if (d < p.r + ship.r) {
        crash();
        return;
      }
      const f = (p.m * p.sign) / Math.max(d2, 100);
      ax += (dx / d) * f;
      ay += (dy / d) * f;
    }
    ship.vx += ax * dt;
    ship.vy += ay * dt;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    trail.push({ x: ship.x, y: ship.y, life: 1 });
    if (trail.length > 120) trail.shift();
    if (ship.x < -20 || ship.x > W + 20 || ship.y < -20 || ship.y > H + 20) crash();
    if (Math.hypot(ship.x - goal.x, ship.y - goal.y) < goal.r + ship.r) win();
  }

  function crash() {
    if (crashed || won) return;
    crashed = true;
    flying = false;
    shake = 12;
    streak = 0;
    crashesTotal += 1;
    safeSet('gw_crashes_total', String(crashesTotal));
    updateMetricsUi();
    announce('Crashed. Press space or tap to retry.');
    beep(180, 140, 'sawtooth', 0.05);
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(1, 4);
      particles.push({
        x: ship.x,
        y: ship.y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 1,
        hue: 10,
      });
    }
  }

  function win() {
    if (won || crashed) return;
    won = true;
    flying = false;
    streak += 1;
    updateMetricsUi();
    announce(`Level ${level} cleared. Tap or press space for next level.`);
    beep(680, 90, 'triangle', 0.04);
    setTimeout(() => beep(880, 120, 'triangle', 0.03), 60);
    for (let i = 0; i < 50; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(1, 5);
      particles.push({
        x: goal.x,
        y: goal.y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 1,
        hue: 50,
      });
    }
    if (level > best) {
      best = level;
      safeSet('gw_best', String(best));
      bestEl.textContent = best;
    }
  }

  // ---- render helpers ----
  function drawPredictedPath() {
    if (flying || (!aiming && !keyboardMode)) return;
    const dx = launchVector.x;
    const dy = launchVector.y;
    if (Math.hypot(dx, dy) < 8) return;

    const mag = Math.min(Math.hypot(dx, dy), 160);
    const power = mag * 0.05;
    const ang = Math.atan2(dy, dx);
    let px = ship.x;
    let py = ship.y;
    let vx = Math.cos(ang) * power;
    let vy = Math.sin(ang) * power;

    ctx.save();
    ctx.strokeStyle = 'rgba(192,139,255,0.65)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let i = 0; i < 70; i++) {
      let ax = 0;
      let ay = 0;
      for (const p of planets) {
        const gx = p.x - px;
        const gy = p.y - py;
        const d2 = Math.max(gx * gx + gy * gy, 100);
        const d = Math.sqrt(d2);
        const f = (p.m * p.sign) / d2;
        ax += (gx / d) * f;
        ay += (gy / d) * f;
      }
      vx += ax * 0.5;
      vy += ay * 0.5;
      px += vx * 0.5;
      py += vy * 0.5;
      if (px < -30 || px > W + 30 || py < -30 || py > H + 30) break;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ---- render ----
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 16.67, 2);
    last = now;

    for (let i = 0; i < 2; i++) step(dt / 2);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= 0.02;
    }
    particles = particles.filter((p) => p.life > 0);
    for (const t of trail) t.life -= 0.01;
    if (shake > 0) shake *= 0.85;

    ctx.save();
    if (shake > 0.2) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    ctx.fillStyle = '#05060d';
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
      s.t += 0.02;
      const a = 0.4 + Math.sin(s.t) * 0.3;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#cdd6ff';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    const gp = (Math.sin(now / 300) + 1) / 2;
    ctx.beginPath();
    const gg = ctx.createRadialGradient(goal.x, goal.y, 0, goal.x, goal.y, goal.r * 2.5);
    gg.addColorStop(0, `rgba(255,212,121,${0.6 + gp * 0.3})`);
    gg.addColorStop(1, 'rgba(255,212,121,0)');
    ctx.fillStyle = gg;
    ctx.arc(goal.x, goal.y, goal.r * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = '#ffd479';
    ctx.arc(goal.x, goal.y, goal.r, 0, Math.PI * 2);
    ctx.fill();

    for (const p of planets) {
      const col = p.sign > 0 ? `hsl(${p.hue},70%,60%)` : `hsl(${p.hue},70%,40%)`;
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.2);
      grd.addColorStop(0, col);
      grd.addColorStop(0.5, `hsla(${p.hue},70%,40%,.4)`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x - p.r * 0.35, p.y);
      ctx.lineTo(p.x + p.r * 0.35, p.y);
      if (p.sign > 0) {
        ctx.moveTo(p.x, p.y - p.r * 0.35);
        ctx.lineTo(p.x, p.y + p.r * 0.35);
      }
      ctx.stroke();
    }

    ctx.lineWidth = 1.5;
    for (let g = 0; g < ghosts.length; g++) {
      const fade = 0.25 + (g / ghosts.length) * 0.35;
      ctx.strokeStyle = `rgba(192,139,255,${fade})`;
      ctx.beginPath();
      const path = ghosts[g];
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
      ctx.stroke();
    }

    ctx.lineWidth = 2;
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1];
      const b = trail[i];
      ctx.strokeStyle = `rgba(125,249,255,${b.life * 0.6})`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    if (!crashed) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      const ang = flying ? Math.atan2(ship.vy, ship.vx) : -Math.PI / 4;
      ctx.rotate(ang);
      ctx.fillStyle = '#7df9ff';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-7, 6);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-7, -6);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = '#7df9ff';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();
    }

    drawPredictedPath();

    if ((aiming || keyboardMode) && Math.hypot(launchVector.x, launchVector.y) > 4) {
      const mag = Math.min(Math.hypot(launchVector.x, launchVector.y), 160);
      const ang = Math.atan2(launchVector.y, launchVector.x);
      const ex = ship.x + Math.cos(ang) * mag;
      const ey = ship.y + Math.sin(ang) * mag;
      ctx.strokeStyle = `rgba(125,249,255,${0.3 + (mag / 160) * 0.6})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (const p of particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = `hsl(${p.hue},90%,60%)`;
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1;

    if (won || crashed) {
      ctx.fillStyle = won ? 'rgba(255,212,121,.9)' : 'rgba(255,120,120,.9)';
      ctx.font = '600 28px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(won ? 'NICE FLYING' : 'CRASHED', W / 2, H / 2 - 10);
      ctx.font = '14px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(230,236,255,.8)';
      ctx.fillText(won ? 'tap/space for next level' : 'tap/space to retry', W / 2, H / 2 + 16);
    }

    ctx.restore();
    requestAnimationFrame(frame);
  }

  // ---- pwa ----
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // No-op if service worker fails.
      });
    });
  }

  reset(1, true);
  requestAnimationFrame(frame);
})();
