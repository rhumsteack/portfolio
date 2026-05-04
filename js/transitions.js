/**
 * transitions.js — Animations de transition plein écran (clic sur carte)
 *
 * Chaque section déclenche une animation canvas unique avant la navigation :
 *   qualite   → Pluie de code binaire (Matrix)
 *   ia        → Noyau neuronal et impulsions
 *   running   → Onde ECG / ligne de vie
 *   iaido     → Slash diagonal lumineux
 *   dessin    → Trait de crayon qui envahit l'écran
 *   robotique → Grille hexagonale qui se déploie
 *   misc      → Réseau de nœuds et impulsions
 *   echecs    → Damier stratégique en révélation
 *   ai-agent  → Agent-friendly HUD et flux de contexte
 */

(function () {
    'use strict';

    const DURATION = 900; // ms d'animation avant navigation

    /* ════════════════════════════════════════
       POINT D'ENTRÉE PUBLIC
    ════════════════════════════════════════ */

    /**
     * Joue l'animation de transition correspondant à la zone,
     * puis appelle `onDone` à la fin.
     *
     * @param {string}   zone    - identifiant de zone (qualite, running, …)
     * @param {string}   color   - couleur principale (hex)
     * @param {Function} onDone  - callback appelé en fin d'animation
     */
    function play(zone, color, onDone) {
        const overlay  = document.getElementById('transition-overlay');
        const canvas   = document.getElementById('transition-canvas');
        if (!overlay || !canvas) { onDone(); return; }

        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        overlay.style.opacity = '1';
        overlay.classList.add('is-active');

        const fn = ANIMATIONS[zone] || ANIMATIONS['qualite'];
        fn(canvas, color, () => {
            overlay.style.opacity = '0';
            overlay.classList.remove('is-active');
            onDone();
        });
    }

    /* ════════════════════════════════════════
       01 · QUALITÉ LOGICIELLE — Matrix rain
    ════════════════════════════════════════ */

    function animQualite(canvas, color, done) {
        const ctx  = canvas.getContext('2d');
        const W    = canvas.width;
        const H    = canvas.height;
        const COLS = Math.floor(W / 14);
        const drops = Array(COLS).fill(1).map(() => Math.random() * -40);
        const chars = '01 10 01 11 00 10 01'.split(' ').join('');
        const rgb   = hexToRgb(color);
        let   start = null;

        function draw(ts) {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / DURATION, 1);

            // Fondu d'entrée sur la première moitié, image figée
            const bgAlpha = progress < 0.6 ? 0.08 : lerp(0.08, 0.9, (progress - 0.6) / 0.4);
            ctx.fillStyle = `rgba(5, 10, 19, ${bgAlpha})`;
            ctx.fillRect(0, 0, W, H);

            ctx.font = '13px "JetBrains Mono", monospace';

            drops.forEach((y, i) => {
                const char = chars[Math.floor(Math.random() * chars.length)];
                // Tête de la colonne : plus brillante
                ctx.fillStyle = `rgba(255,255,255,0.9)`;
                ctx.fillText(char, i * 14, y * 14);

                // Corps de la colonne
                ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.7)`;
                if (y > 1) {
                    const prev = chars[Math.floor(Math.random() * chars.length)];
                    ctx.fillText(prev, i * 14, (y - 1) * 14);
                }

                if (y * 14 > H && Math.random() > 0.975) drops[i] = 0;
                else drops[i] += 0.5;
            });

            if (progress < 1) {
                requestAnimationFrame(draw);
            } else {
                done();
            }
        }
        requestAnimationFrame(draw);
    }

    /* ════════════════════════════════════════
       02 · COURSE À PIED — ECG / Heartbeat
    ════════════════════════════════════════ */

    function animRunning(canvas, color, done) {
        const ctx   = canvas.getContext('2d');
        const W     = canvas.width;
        const H     = canvas.height;
        const rgb   = hexToRgb(color);
        let   start = null;

        // Séquence de points d'une onde ECG normalisée [0..1] → [-1..1] en y
        const ecgPattern = [
            [0, 0], [0.05, 0], [0.1, -0.05], [0.13, 0.5],
            [0.15, -0.7], [0.18, 2.5], [0.21, -1.2],
            [0.25, 0], [0.3, 0.2], [0.4, 0.15], [0.45, 0],
            [0.5, 0], [0.55, 0], [0.6, -0.05], [0.63, 0.5],
            [0.65, -0.7], [0.68, 2.5], [0.71, -1.2],
            [0.75, 0], [0.8, 0.2], [0.9, 0.15], [1.0, 0],
        ];

        function getEcgY(t) {
            // Interpolation linéaire dans le pattern
            for (let i = 0; i < ecgPattern.length - 1; i++) {
                const [t0, v0] = ecgPattern[i];
                const [t1, v1] = ecgPattern[i + 1];
                if (t >= t0 && t <= t1) {
                    const lt = (t - t0) / (t1 - t0);
                    return v0 + lt * (v1 - v0);
                }
            }
            return 0;
        }

        function draw(ts) {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / DURATION, 1);

            ctx.fillStyle = `rgba(5, 10, 19, ${progress < 0.7 ? 0.06 : 0.18})`;
            ctx.fillRect(0, 0, W, H);

            // Dessiner plusieurs lignes ECG parallèles
            for (let line = 0; line < 6; line++) {
                const cy  = H * (0.15 + line * 0.14);
                const amp = H * (0.06 - line * 0.005);
                const alpha = Math.max(0, 1 - line * 0.18) * progress;

                ctx.beginPath();
                const drawn = Math.floor(progress * W * 1.4);

                for (let x = 0; x < Math.min(drawn, W); x++) {
                    const t  = (x / W) % 1;
                    const vy = getEcgY(t) * amp;
                    if (x === 0) ctx.moveTo(x, cy + vy);
                    else         ctx.lineTo(x, cy + vy);
                }

                ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
                ctx.lineWidth   = Math.max(0.5, 2 - line * 0.3);
                ctx.shadowBlur  = 12;
                ctx.shadowColor = color;
                ctx.stroke();
                ctx.shadowBlur  = 0;
            }

            // Flash final
            if (progress > 0.85) {
                const flashAlpha = (progress - 0.85) / 0.15 * 0.7;
                ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${flashAlpha})`;
                ctx.fillRect(0, 0, W, H);
            }

            if (progress < 1) requestAnimationFrame(draw);
            else done();
        }
        requestAnimationFrame(draw);
    }

    /* ════════════════════════════════════════
       03 · IA — Noyau neuronal et impulsions
    ════════════════════════════════════════ */

    function animIA(canvas, color, done) {
        const ctx   = canvas.getContext('2d');
        const W     = canvas.width;
        const H     = canvas.height;
        const rgb   = hexToRgb(color);
        let   start = null;

        const cx = W * 0.5;
        const cy = H * 0.5;

        const nodes = Array.from({ length: 44 }, () => {
            const a = Math.random() * Math.PI * 2;
            const r = 55 + Math.random() * Math.min(W, H) * 0.48;
            return {
                x: cx + Math.cos(a) * r,
                y: cy + Math.sin(a) * r,
                a,
                r,
                phase: Math.random() * Math.PI * 2,
            };
        });

        function draw(ts) {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / DURATION, 1);

            const bgA = progress < 0.7 ? 0.08 : lerp(0.08, 0.9, (progress - 0.7) / 0.3);
            ctx.fillStyle = `rgba(5, 10, 19, ${bgA})`;
            ctx.fillRect(0, 0, W, H);

            // Anneaux d'impulsion
            const ringCount = 4;
            for (let i = 0; i < ringCount; i++) {
                const t = clamp((progress * 1.25 - i * 0.16), 0, 1);
                if (t <= 0) continue;
                const radius = easeOutCubic(t) * Math.hypot(W, H) * 0.45;
                const alpha  = (1 - t) * 0.45;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
                ctx.lineWidth   = 2;
                ctx.stroke();
            }

            // Connexions dynamiques vers un noyau
            const reach = easeOutCubic(progress) * Math.min(W, H) * 0.52;
            nodes.forEach((n, idx) => {
                const wobble = Math.sin(progress * 12 + n.phase) * 8;
                const nx = cx + Math.cos(n.a) * (n.r + wobble);
                const ny = cy + Math.sin(n.a) * (n.r + wobble);

                const d = Math.hypot(nx - cx, ny - cy);
                if (d < reach) {
                    const lineA = (1 - d / reach) * 0.55;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(nx, ny);
                    ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${lineA})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

                const pulse = 0.45 + 0.55 * Math.sin(progress * 20 + idx * 0.7);
                ctx.beginPath();
                ctx.arc(nx, ny, 1.8 + pulse * 1.8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${0.25 + pulse * 0.5})`;
                ctx.fill();
            });

            // Noyau central
            const corePulse = 0.55 + 0.45 * Math.sin(progress * 26);
            const coreR = 14 + corePulse * 10;
            const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, coreR);
            grad.addColorStop(0, `rgba(255,255,255,${0.8 * corePulse})`);
            grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},${0.15 + 0.4 * corePulse})`);
            ctx.beginPath();
            ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            if (progress < 1) requestAnimationFrame(draw);
            else done();
        }

        requestAnimationFrame(draw);
    }

    /* ════════════════════════════════════════
       04 · IAÏDO — Slash diagonal
    ════════════════════════════════════════ */

    function animIaido(canvas, color, done) {
        const ctx   = canvas.getContext('2d');
        const W     = canvas.width;
        const H     = canvas.height;
        const rgb   = hexToRgb(color);
        let   start = null;

        function draw(ts) {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / DURATION, 1);

            ctx.fillStyle = `rgba(5, 10, 19, 0.12)`;
            ctx.fillRect(0, 0, W, H);

            if (progress < 0.4) {
                // Phase 1 : le slash traverse l'écran
                const t = progress / 0.4;
                const eased = easeOutCubic(t);

                // Plusieurs lames (épaisseurs variées)
                const blades = [
                    { width: 80, alpha: 0.15, offset: 0 },
                    { width: 20, alpha: 0.6,  offset: 0 },
                    { width: 4,  alpha: 1.0,  offset: 0 },
                    { width: 1,  alpha: 1.0,  offset: 6 },
                ];

                blades.forEach(blade => {
                    // Le slash va du coin supérieur droit vers le coin inférieur gauche
                    const x1 = W - eased * (W + 200) + blade.offset;
                    const y1 = -100;
                    const x2 = x1 + H + 200;
                    const y2 = H + 100;

                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${blade.alpha})`;
                    ctx.lineWidth   = blade.width;
                    ctx.lineCap     = 'butt';
                    if (blade.width <= 4) {
                        ctx.shadowBlur  = 30;
                        ctx.shadowColor = color;
                    }
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                    ctx.restore();
                });

            } else if (progress < 0.7) {
                // Phase 2 : l'écran se fend en deux (ligne de coupure visible)
                const t     = (progress - 0.4) / 0.3;
                const split = easeInOutCubic(t) * 60; // px d'écart

                // Demi-écran gauche glisse vers le bas
                ctx.drawImage(canvas, -split * 0.3, split * 0.5);

                // Ligne de coupe lumineuse
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(W, 0);
                ctx.lineTo(0, H);
                ctx.strokeStyle = `rgba(255,255,255,${0.8 - t * 0.6})`;
                ctx.lineWidth   = 3;
                ctx.shadowBlur  = 40;
                ctx.shadowColor = color;
                ctx.stroke();
                ctx.restore();

            } else {
                // Phase 3 : fondu noir
                const t = (progress - 0.7) / 0.3;
                ctx.fillStyle = `rgba(5, 10, 19, ${easeInCubic(t)})`;
                ctx.fillRect(0, 0, W, H);
            }

            if (progress < 1) requestAnimationFrame(draw);
            else done();
        }
        requestAnimationFrame(draw);
    }

    /* ════════════════════════════════════════
       04 · DESSIN — Révélation par traits
    ════════════════════════════════════════ */

    function animDessin(canvas, color, done) {
        const ctx   = canvas.getContext('2d');
        const W     = canvas.width;
        const H     = canvas.height;
        const rgb   = hexToRgb(color);
        let   start = null;

        // Générer des traits statiques au préalable
        const strokes = [];
        for (let i = 0; i < 120; i++) {
            const cx    = Math.random() * W;
            const cy    = Math.random() * H;
            const angle = Math.random() * Math.PI * 2;
            const len   = 30 + Math.random() * 180;
            const alpha = 0.1 + Math.random() * 0.5;
            const width = 0.5 + Math.random() * 2;
            const delay = Math.random() * 0.7; // normalised [0..1]
            strokes.push({ cx, cy, angle, len, alpha, width, delay });
        }

        function draw(ts) {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / DURATION, 1);

            ctx.fillStyle = `rgba(5, 10, 19, 0.07)`;
            ctx.fillRect(0, 0, W, H);

            strokes.forEach(s => {
                const localP = clamp((progress - s.delay) / (1 - s.delay), 0, 1);
                if (localP <= 0) return;

                const drawn = easeOutCubic(localP);
                const x1    = s.cx - Math.cos(s.angle) * s.len * 0.5;
                const y1    = s.cy - Math.sin(s.angle) * s.len * 0.5;
                const x2    = x1 + Math.cos(s.angle) * s.len * drawn;
                const y2    = y1 + Math.sin(s.angle) * s.len * drawn;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${s.alpha * localP})`;
                ctx.lineWidth   = s.width;
                ctx.lineCap     = 'round';
                ctx.stroke();
            });

            // Fond de page final
            if (progress > 0.8) {
                const a = (progress - 0.8) / 0.2;
                ctx.fillStyle = `rgba(5, 10, 19, ${easeInCubic(a) * 0.9})`;
                ctx.fillRect(0, 0, W, H);
            }

            if (progress < 1) requestAnimationFrame(draw);
            else done();
        }
        requestAnimationFrame(draw);
    }

    /* ════════════════════════════════════════
       05 · ROBOTIQUE — Grille hexagonale
    ════════════════════════════════════════ */

    function animRobotique(canvas, color, done) {
        const ctx   = canvas.getContext('2d');
        const W     = canvas.width;
        const H     = canvas.height;
        const rgb   = hexToRgb(color);
        let   start = null;

        const HEX_SIZE  = 46;
        const HEX_W     = HEX_SIZE * 2;
        const HEX_H     = Math.sqrt(3) * HEX_SIZE;
        const cx        = W / 2;
        const cy        = H / 2;

        // Générer tous les hexagones
        const hexes = [];
        const cols  = Math.ceil(W / HEX_W) + 2;
        const rows  = Math.ceil(H / HEX_H) + 2;

        for (let r = -rows; r <= rows; r++) {
            for (let c = -cols; c <= cols; c++) {
                const x = c * HEX_W * 0.75;
                const y = r * HEX_H + (c % 2 === 0 ? 0 : HEX_H / 2);
                const d = Math.sqrt((x - cx + W/2) ** 2 + (y - cy + H/2) ** 2);
                hexes.push({ x: x + cx - W/2 * 0.5, y: y + cy - H/2 * 0.5, d });
            }
        }

        const maxD = Math.max(...hexes.map(h => h.d));

        function drawHex(x, y, size, strokeAlpha, fillAlpha) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a  = (Math.PI / 3) * i - Math.PI / 6;
                const hx = x + size * Math.cos(a);
                const hy = y + size * Math.sin(a);
                if (i === 0) ctx.moveTo(hx, hy);
                else         ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            if (fillAlpha > 0) {
                ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${fillAlpha})`;
                ctx.fill();
            }
            ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${strokeAlpha})`;
            ctx.lineWidth   = 1;
            ctx.stroke();
        }

        function draw(ts) {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / DURATION, 1);

            ctx.fillStyle = `rgba(5, 10, 19, 0.15)`;
            ctx.fillRect(0, 0, W, H);

            const wave = easeOutCubic(progress) * maxD * 1.2;

            hexes.forEach(h => {
                if (h.d > wave) return;
                const localT = clamp(1 - (h.d / wave) * 0.5, 0, 1);
                const fade   = progress > 0.75
                    ? 1 - easeInCubic((progress - 0.75) / 0.25)
                    : 1;

                drawHex(h.x, h.y, HEX_SIZE * 0.9,
                    localT * 0.7 * fade,
                    localT * 0.04 * fade
                );
            });

            // Flash final
            if (progress > 0.82) {
                const a = (progress - 0.82) / 0.18;
                ctx.fillStyle = `rgba(5, 10, 19, ${easeInCubic(a)})`;
                ctx.fillRect(0, 0, W, H);
            }

            if (progress < 1) requestAnimationFrame(draw);
            else done();
        }
        requestAnimationFrame(draw);
    }

    /* ════════════════════════════════════════
       06 · MISC — Réseau de nœuds
    ════════════════════════════════════════ */

    function animMisc(canvas, color, done) {
        const ctx   = canvas.getContext('2d');
        const W     = canvas.width;
        const H     = canvas.height;
        const rgb   = hexToRgb(color);
        let   start = null;

        const nodes = Array.from({ length: 26 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: 1 + Math.random() * 3,
        }));

        function draw(ts) {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / DURATION, 1);
            const reach = easeOutCubic(progress) * 220;

            ctx.fillStyle = `rgba(5, 10, 19, ${0.08 + progress * 0.18})`;
            ctx.fillRect(0, 0, W, H);

            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < reach) {
                        const a = (1 - d / reach) * 0.5;
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }

            nodes.forEach((node, index) => {
                const pulse = (Math.sin(progress * 10 + index) + 1) / 2;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.r + pulse * 1.8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${0.35 + pulse * 0.45})`;
                ctx.fill();
            });

            if (progress > 0.82) {
                const fade = (progress - 0.82) / 0.18;
                ctx.fillStyle = `rgba(5, 10, 19, ${easeInCubic(fade)})`;
                ctx.fillRect(0, 0, W, H);
            }

            if (progress < 1) requestAnimationFrame(draw);
            else done();
        }

        requestAnimationFrame(draw);
    }

    /* ════════════════════════════════════════
       07 · ÉCHECS — Damier dynamique
    ════════════════════════════════════════ */

    function animEchecs(canvas, color, done) {
        const ctx   = canvas.getContext('2d');
        const W     = canvas.width;
        const H     = canvas.height;
        const rgb   = hexToRgb(color);
        let   start = null;

        const cell = 48;

        function draw(ts) {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / DURATION, 1);
            const reveal = easeOutCubic(progress);

            ctx.fillStyle = 'rgba(5, 10, 19, 0.16)';
            ctx.fillRect(0, 0, W, H);

            const radius = Math.hypot(W, H) * reveal;
            const cx = W * 0.5;
            const cy = H * 0.5;

            for (let y = 0; y < H + cell; y += cell) {
                for (let x = 0; x < W + cell; x += cell) {
                    const dx = x - cx;
                    const dy = y - cy;
                    const d = Math.hypot(dx, dy);
                    if (d > radius) continue;

                    const dark = ((x / cell + y / cell) % 2) === 0;
                    const baseAlpha = dark ? 0.22 : 0.08;
                    const pulse = 0.6 + 0.4 * Math.sin(progress * 18 + (x + y) * 0.02);
                    const alpha = baseAlpha * pulse;

                    ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
                    ctx.fillRect(x, y, cell - 1, cell - 1);
                }
            }

            const lineAlpha = 0.35 * (1 - Math.max(0, progress - 0.7) / 0.3);
            ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${lineAlpha})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(8, 8, W - 16, H - 16);

            if (progress > 0.84) {
                const fade = (progress - 0.84) / 0.16;
                ctx.fillStyle = `rgba(5, 10, 19, ${easeInCubic(fade)})`;
                ctx.fillRect(0, 0, W, H);
            }

            if (progress < 1) requestAnimationFrame(draw);
            else done();
        }

        requestAnimationFrame(draw);
    }

    /* ════════════════════════════════════════
       09 · AGENT IA — Agent-friendly
    ════════════════════════════════════════ */

    function animAgentFriendly(canvas, color, done) {
        const ctx   = canvas.getContext('2d');
        const W     = canvas.width;
        const H     = canvas.height;
        const rgb   = hexToRgb(color);
        const cx    = W * 0.5;
        const cy    = H * 0.5;
        let   start = null;

        const particles = Array.from({ length: 65 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: 0.8 + Math.random() * 2.2,
            phase: Math.random() * Math.PI * 2,
            vx: -0.45 + Math.random() * 0.9,
            vy: -0.35 + Math.random() * 0.7,
        }));

        function drawHudPanel(x, y, w, h, title, value, alpha) {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(6, 12, 24, 0.84)';
            ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.6)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.95)`;
            ctx.font = '11px "JetBrains Mono", monospace';
            ctx.fillText(title, x + 10, y + 18);
            ctx.fillStyle = 'rgba(232, 253, 250, 0.94)';
            ctx.font = '16px "Orbitron", sans-serif';
            ctx.fillText(value, x + 10, y + 40);
            ctx.restore();
        }

        function draw(ts) {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / DURATION, 1);
            const t = (ts - start) / 1000;

            const bgA = progress < 0.7 ? 0.09 : lerp(0.09, 0.9, (progress - 0.7) / 0.3);
            ctx.fillStyle = `rgba(4, 9, 18, ${bgA})`;
            ctx.fillRect(0, 0, W, H);

            ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.08)`;
            ctx.lineWidth = 1;
            for (let x = 0; x < W; x += 52) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, H);
                ctx.stroke();
            }
            for (let y = 0; y < H; y += 52) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(W, y);
                ctx.stroke();
            }

            const reach = Math.min(W, H) * (0.12 + 0.56 * easeOutCubic(progress));
            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < -20) p.x = W + 20;
                if (p.x > W + 20) p.x = -20;
                if (p.y < -20) p.y = H + 20;
                if (p.y > H + 20) p.y = -20;

                const pulse = 0.5 + 0.5 * Math.sin(t * 3.2 + p.phase + i * 0.07);
                const d = Math.hypot(p.x - cx, p.y - cy);
                if (d < reach) {
                    const a = (1 - d / reach) * (0.06 + pulse * 0.24);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(p.x, p.y);
                    ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r + pulse * 1.1, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${0.2 + pulse * 0.55})`;
                ctx.fill();
            });

            const panelAlpha = Math.min(1, progress * 2.1);
            drawHudPanel(20, 22, 206, 52, 'AGENT MODE', 'ENABLED', panelAlpha);
            drawHudPanel(W - 228, 22, 208, 52, 'SIGNAL', `${Math.round(90 + 8 * Math.sin(t * 1.9))}%`, panelAlpha);
            drawHudPanel(20, H - 76, 260, 52, 'CONTEXT', `${Math.round(12 + 20 * progress)}K TOKENS`, panelAlpha);
            drawHudPanel(W - 318, H - 76, 298, 52, 'TARGET', 'MODULE 09 / AGENT IA', panelAlpha);

            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = `rgba(238, 255, 252, ${Math.min(1, progress * 2.3)})`;
            ctx.font = '700 30px "Orbitron", sans-serif';
            ctx.fillText('AGENT-FRIENDLY', cx, cy - 6);
            ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b}, ${Math.min(1, progress * 2.3)})`;
            ctx.font = '12px "JetBrains Mono", monospace';
            ctx.fillText('CLEAR SIGNALS · LOW NOISE · FAST ROUTING', cx, cy + 20);
            ctx.restore();

            if (progress > 0.82) {
                const fade = (progress - 0.82) / 0.18;
                ctx.fillStyle = `rgba(4, 9, 18, ${easeInCubic(fade)})`;
                ctx.fillRect(0, 0, W, H);
            }

            if (progress < 1) requestAnimationFrame(draw);
            else done();
        }

        requestAnimationFrame(draw);
    }

    /* ════════════════════════════════════════
       TABLE DE DISPATCH
    ════════════════════════════════════════ */

    const ANIMATIONS = {
        qualite:   animQualite,
        ia:        animIA,
        running:   animRunning,
        iaido:     animIaido,
        dessin:    animDessin,
        robotique: animRobotique,
        misc:      animMisc,
        echecs:    animEchecs,
        'ai-agent': animAgentFriendly,
    };

    /* ════════════════════════════════════════
       UTILITAIRES
    ════════════════════════════════════════ */

    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
    function easeOutCubic(t)    { return 1 - Math.pow(1 - t, 3); }
    function easeInCubic(t)     { return t * t * t; }
    function easeInOutCubic(t)  {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /* ── Exposition ── */
    window.Transitions = { play };

})();
