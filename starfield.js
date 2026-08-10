(() => {
  const canvas = document.getElementById('sky');
  const ctx = canvas.getContext('2d');

  const STAR_DENSITY = 0.00022; // stars per CSS pixel^2
  const SHOOTING_STAR_MIN_DELAY = 1500; // ms
  const SHOOTING_STAR_MAX_DELAY = 5000; // ms

  let width = 0;
  let height = 0;
  let stars = [];
  let shootingStars = [];
  let nextShootingStarAt = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = makeStars();
  }

  function makeStars() {
    const count = Math.round(width * height * STAR_DENSITY);
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.1 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 1.5 + 0.5, // twinkle speed
        baseAlpha: Math.random() * 0.5 + 0.4,
      });
    }
    return result;
  }

  function spawnShootingStar() {
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? Math.random() * width * 0.4 : width - Math.random() * width * 0.4;
    const startY = Math.random() * height * 0.4;
    const angle = fromLeft ? (Math.PI / 5) : (Math.PI - Math.PI / 5); // downward diagonal
    const speed = Math.random() * 600 + 500; // px/sec
    shootingStars.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: Math.random() * 80 + 60,
      life: 0,
      maxLife: Math.random() * 0.4 + 0.5, // seconds
    });
  }

  function scheduleNextShootingStar(now) {
    nextShootingStarAt = now + SHOOTING_STAR_MIN_DELAY +
      Math.random() * (SHOOTING_STAR_MAX_DELAY - SHOOTING_STAR_MIN_DELAY);
  }

  function drawStars(now) {
    for (const star of stars) {
      const twinkle = Math.sin(now * 0.001 * star.speed + star.phase) * 0.5 + 0.5;
      const alpha = star.baseAlpha * (0.5 + twinkle * 0.5);
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      ctx.fill();
    }
  }

  function drawShootingStars(dt) {
    shootingStars = shootingStars.filter((s) => {
      s.life += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const fade = 1 - s.life / s.maxLife;
      if (fade <= 0 || s.x > width + s.len || s.y > height + s.len) return false;

      const dirX = s.vx === 0 && s.vy === 0 ? 0 : s.vx / Math.hypot(s.vx, s.vy);
      const dirY = s.vy === 0 && s.vx === 0 ? 0 : s.vy / Math.hypot(s.vx, s.vy);
      const tailX = s.x - dirX * s.len;
      const tailY = s.y - dirY * s.len;

      const gradient = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${fade})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
      return true;
    });
  }

  let lastTime = 0;

  function frame(now) {
    const dt = lastTime ? (now - lastTime) / 1000 : 0;
    lastTime = now;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    drawStars(now);
    drawShootingStars(dt);

    if (now >= nextShootingStarAt) {
      spawnShootingStar();
      scheduleNextShootingStar(now);
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  scheduleNextShootingStar(performance.now());
  requestAnimationFrame(frame);
})();
