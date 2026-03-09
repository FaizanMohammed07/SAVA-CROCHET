import { useEffect, useRef, useCallback, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
 *  ✨ SAVA Crochet — Enchanted Yarn Ball Cursor
 *
 *  A magical crochet-themed custom cursor featuring:
 *    • Spinning yarn ball with fiber texture & 3D shading
 *    • Sparkle dust trail that fades like magic
 *    • Click burst of crochet stitch marks
 *    • Interactive glow pulse on hover over links/buttons
 *    • Gentle idle bobbing animation
 *    • Tiny trailing stitch dots (NOT a rope/snake)
 *    • Desktop-only (hidden on touch devices)
 * ═══════════════════════════════════════════════════════════════ */

// ─── Brand palette ──────────────────────────────────────────
const PALETTE = [
  { r: 140, g: 105, b: 80 }, // warm brown
  { r: 210, g: 170, b: 170 }, // dusty pink
  { r: 160, g: 190, b: 160 }, // sage
  { r: 230, g: 195, b: 170 }, // peach
  { r: 245, g: 235, b: 220 }, // cream
];

// ─── Config ─────────────────────────────────────────────────
const BALL_RADIUS = 9;
const MAX_PARTICLES = 80;
const TRAIL_LENGTH = 14; // short trail dots, NOT a rope
const TRAIL_SPAWN_DIST = 8; // pixels between trail dots

// ─── Types ──────────────────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  type: "stitch" | "sparkle" | "dot" | "loop";
  color: { r: number; g: number; b: number };
  rotation: number;
  rotSpeed: number;
}

interface TrailDot {
  x: number;
  y: number;
  birth: number;
  color: { r: number; g: number; b: number };
}

// ─── Helpers ────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const dist = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const YarnCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const smoothMouse = useRef({ x: -100, y: -100 });
  const velocity = useRef({ x: 0, y: 0 });
  const particles = useRef<Particle[]>([]);
  const trail = useRef<TrailDot[]>([]);
  const lastTrailPos = useRef({ x: -9999, y: -9999 });
  const animFrame = useRef(0);
  const lastMoveTime = useRef(Date.now());
  const isHovering = useRef(false);
  const hoverGlow = useRef(0);
  const yarnAngle = useRef(0);
  const timeRef = useRef(0);
  const colorIdx = useRef(0);
  const [isTouch, setIsTouch] = useState(false);

  // ─── Detect touch ─────────────────────────────────────────
  useEffect(() => {
    const touch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches;
    setIsTouch(touch);
  }, []);

  // ─── Spawn click burst ────────────────────────────────────
  const spawnBurst = useCallback((x: number, y: number) => {
    const types: Particle["type"][] = ["stitch", "sparkle", "loop"];
    for (let i = 0; i < 10; i++) {
      const angle = ((Math.PI * 2) / 10) * i + rand(-0.3, 0.3);
      const speed = rand(2, 5);
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: rand(0.5, 1),
        size: rand(2.5, 5),
        type: types[i % 3],
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        rotation: rand(0, Math.PI * 2),
        rotSpeed: rand(-0.12, 0.12),
      });
    }
  }, []);

  // ─── Mouse handlers ───────────────────────────────────────
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const prev = { ...mouse.current };
    mouse.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: e.clientX - prev.x, y: e.clientY - prev.y };
    lastMoveTime.current = Date.now();

    const target = e.target as HTMLElement;
    isHovering.current = !!target.closest(
      'a, button, [role="button"], input, textarea, select, [data-cursor-glow]',
    );
  }, []);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      spawnBurst(e.clientX, e.clientY);
    },
    [spawnBurst],
  );

  // ─── Draw yarn ball ───────────────────────────────────────
  const drawYarnBall = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
      const speed = dist(velocity.current.x, velocity.current.y, 0, 0);
      yarnAngle.current += speed * 0.05 + 0.01; // always slowly rotates
      const angle = yarnAngle.current;

      // Smooth hover glow
      const targetGlow = isHovering.current ? 1 : 0;
      hoverGlow.current += (targetGlow - hoverGlow.current) * 0.1;
      const glow = hoverGlow.current;

      // Idle gentle float
      const idle = Date.now() - lastMoveTime.current > 120;
      const floatY = idle ? Math.sin(time * 2.5) * 2.5 : 0;
      const floatX = idle ? Math.cos(time * 1.8) * 1.2 : 0;
      const bx = x + floatX;
      const by = y + floatY;

      // Squish based on velocity
      const squish = Math.min(speed * 0.01, 0.15);
      const moveAngle = Math.atan2(velocity.current.y, velocity.current.x);

      ctx.save();
      ctx.translate(bx, by);

      // ── Hover glow aura ──
      if (glow > 0.01) {
        const grad = ctx.createRadialGradient(
          0,
          0,
          BALL_RADIUS * 0.4,
          0,
          0,
          BALL_RADIUS * 3,
        );
        grad.addColorStop(0, `rgba(230, 195, 170, ${glow * 0.4})`);
        grad.addColorStop(0.6, `rgba(210, 170, 170, ${glow * 0.15})`);
        grad.addColorStop(1, `rgba(210, 170, 170, 0)`);
        ctx.beginPath();
        ctx.arc(0, 0, BALL_RADIUS * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // ── Velocity squish transform ──
      if (speed > 1) {
        ctx.rotate(moveAngle);
        ctx.scale(1 + squish, 1 - squish * 0.7);
        ctx.rotate(-moveAngle);
      }

      // ── Shadow ──
      ctx.beginPath();
      ctx.arc(0.8, 1.5, BALL_RADIUS + 0.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fill();

      // ── Main ball gradient ──
      const bg = ctx.createRadialGradient(
        -BALL_RADIUS * 0.3,
        -BALL_RADIUS * 0.35,
        0.5,
        0,
        0,
        BALL_RADIUS,
      );
      bg.addColorStop(0, "rgb(250, 235, 218)"); // bright peach highlight
      bg.addColorStop(0.4, "rgb(220, 180, 170)"); // dusty pink mid
      bg.addColorStop(0.85, "rgb(160, 120, 95)"); // warm brown edge
      bg.addColorStop(1, "rgb(130, 95, 70)"); // dark edge
      ctx.beginPath();
      ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();

      // ── Yarn wrap lines (horizontal arcs) ──
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
      ctx.clip();

      for (let i = 0; i < 6; i++) {
        const la = angle + (Math.PI / 6) * i;
        const cy = Math.sin(la) * BALL_RADIUS * 0.85;
        ctx.beginPath();
        ctx.moveTo(-BALL_RADIUS, cy);
        ctx.quadraticCurveTo(
          0,
          cy + Math.cos(la + i * 0.5) * 3.5,
          BALL_RADIUS,
          cy - 0.8,
        );
        ctx.strokeStyle = `rgba(255,255,255,${0.12 + Math.sin(la) * 0.06})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      // ── Diagonal cross-wraps ──
      for (let i = 0; i < 4; i++) {
        const la = angle * 0.6 + ((Math.PI * 2) / 4) * i;
        const sx = Math.cos(la) * BALL_RADIUS;
        ctx.beginPath();
        ctx.moveTo(sx, -BALL_RADIUS);
        ctx.quadraticCurveTo(
          sx * 0.3 + Math.sin(la) * 2.5,
          0,
          -sx,
          BALL_RADIUS,
        );
        ctx.strokeStyle = `rgba(120, 85, 60, ${0.1 + Math.cos(la) * 0.04})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      ctx.restore();

      // ── Glass highlight ──
      ctx.beginPath();
      ctx.ellipse(
        -BALL_RADIUS * 0.25,
        -BALL_RADIUS * 0.3,
        BALL_RADIUS * 0.28,
        BALL_RADIUS * 0.18,
        -0.4,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "rgba(255,255,255,0.30)";
      ctx.fill();

      // ── Tiny crochet hook ──
      ctx.save();
      ctx.translate(BALL_RADIUS * 0.45, -BALL_RADIUS * 0.55);
      ctx.rotate(-Math.PI / 4.5);
      // handle
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -9);
      ctx.strokeStyle = "rgba(100, 70, 45, 0.85)";
      ctx.lineWidth = 1.4;
      ctx.lineCap = "round";
      ctx.stroke();
      // hook curve
      ctx.beginPath();
      ctx.arc(1.8, -9, 2.2, Math.PI * 0.55, Math.PI * 1.85, false);
      ctx.strokeStyle = "rgba(100, 70, 45, 0.85)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    },
    [],
  );

  // ─── Draw trail dots (NOT a rope) ────────────────────────
  const drawTrail = useCallback(
    (ctx: CanvasRenderingContext2D, now: number) => {
      const dots = trail.current;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const age = now - d.birth;
        const lifespan = 0.6; // seconds to fully fade
        const t = Math.min(age / lifespan, 1);
        if (t >= 1) continue;

        const alpha = (1 - t) * 0.45;
        const size = lerp(2.2, 0.4, t);
        const { r, g, b } = d.color;

        // Small soft dot
        ctx.beginPath();
        ctx.arc(d.x, d.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();

        // Tiny plus/stitch shape on every 3rd dot
        if (i % 3 === 0 && t < 0.5) {
          const s = size * 1.2;
          const sa = alpha * 0.6;
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.rotate(d.birth * 5); // varied rotation
          ctx.beginPath();
          ctx.moveTo(-s, 0);
          ctx.lineTo(s, 0);
          ctx.moveTo(0, -s);
          ctx.lineTo(0, s);
          ctx.strokeStyle = `rgba(${r},${g},${b},${sa})`;
          ctx.lineWidth = 0.6;
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.restore();
        }
      }

      // Prune dead dots
      trail.current = dots.filter((d) => now - d.birth < 0.6);
    },
    [],
  );

  // ─── Draw particles (click bursts) ───────────────────────
  const drawParticles = useCallback(
    (ctx: CanvasRenderingContext2D, dt: number) => {
      const alive: Particle[] = [];
      for (const p of particles.current) {
        p.life -= dt / p.maxLife;
        if (p.life <= 0) continue;

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.vy += 0.04; // light gravity
        p.rotation += p.rotSpeed;

        const alpha = Math.min(1, p.life * 2) * 0.75;
        const { r, g, b } = p.color;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = alpha;

        if (p.type === "stitch") {
          // ✕ Cross-stitch
          const s = p.size;
          ctx.beginPath();
          ctx.moveTo(-s, -s);
          ctx.lineTo(s, s);
          ctx.moveTo(s, -s);
          ctx.lineTo(-s, s);
          ctx.strokeStyle = `rgb(${r},${g},${b})`;
          ctx.lineWidth = 1.2;
          ctx.lineCap = "round";
          ctx.stroke();
        } else if (p.type === "sparkle") {
          // ✦ Diamond sparkle
          const s = p.size * 0.6;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.5, 0);
          ctx.lineTo(0, s);
          ctx.lineTo(-s * 0.5, 0);
          ctx.closePath();
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fill();
        } else if (p.type === "loop") {
          // ○ Tiny crochet loop / chain stitch
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.7, p.size * 0.45, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgb(${r},${g},${b})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.restore();
        alive.push(p);
      }
      particles.current = alive;
    },
    [],
  );

  // ─── Ambient sparkles (gentle floating sparkles near cursor) ──
  const spawnAmbient = useCallback((x: number, y: number) => {
    if (particles.current.length > MAX_PARTICLES) return;
    particles.current.push({
      x: x + rand(-15, 15),
      y: y + rand(-15, 15),
      vx: rand(-0.3, 0.3),
      vy: rand(-0.6, -0.15),
      life: 1,
      maxLife: rand(0.8, 1.5),
      size: rand(1.5, 3),
      type: "sparkle",
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      rotation: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.05, 0.05),
    });
  }, []);

  // ─── Main render loop ─────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    ctx.clearRect(0, 0, w, h);

    const now = performance.now() / 1000;
    const dt = Math.min(now - (timeRef.current || now), 0.05);
    timeRef.current = now;

    // Smooth cursor follow (slight lag for elegance)
    smoothMouse.current.x += (mouse.current.x - smoothMouse.current.x) * 0.35;
    smoothMouse.current.y += (mouse.current.y - smoothMouse.current.y) * 0.35;
    const sx = smoothMouse.current.x;
    const sy = smoothMouse.current.y;

    // ── Add trail dots when cursor moves ──
    const dFromLast = dist(
      sx,
      sy,
      lastTrailPos.current.x,
      lastTrailPos.current.y,
    );
    if (dFromLast > TRAIL_SPAWN_DIST) {
      colorIdx.current = (colorIdx.current + 1) % PALETTE.length;
      trail.current.push({
        x: sx,
        y: sy,
        birth: now,
        color: PALETTE[colorIdx.current],
      });
      if (trail.current.length > TRAIL_LENGTH) trail.current.shift();
      lastTrailPos.current = { x: sx, y: sy };
    }

    // ── Ambient sparkles (sparse) ──
    const speed = dist(velocity.current.x, velocity.current.y, 0, 0);
    if (speed > 2 && Math.random() < 0.15) {
      spawnAmbient(sx, sy);
    }
    if (isHovering.current && Math.random() < 0.08) {
      spawnAmbient(sx, sy);
    }

    // ── Draw order: trail → particles → yarn ball ──
    drawTrail(ctx, now);
    drawParticles(ctx, dt);
    drawYarnBall(ctx, sx, sy, now);

    animFrame.current = requestAnimationFrame(draw);
  }, [drawYarnBall, drawTrail, drawParticles, spawnAmbient]);

  // ─── Setup ────────────────────────────────────────────────
  useEffect(() => {
    if (isTouch) return;

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("click", handleClick, { passive: true });
    animFrame.current = requestAnimationFrame(draw);
    document.body.style.cursor = "none";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      cancelAnimationFrame(animFrame.current);
      document.body.style.cursor = "";
    };
  }, [isTouch, handleMouseMove, handleClick, draw]);

  if (isTouch) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    />
  );
};

export default YarnCursor;
