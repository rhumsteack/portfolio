/**
 * circuit.js — Animation de fond "circuit imprimé"
 *
 * Crée sur un <canvas> un réseau de traces PCB animé :
 * - Nœuds disposés sur une grille
 * - Segments horizontaux / verticaux reliant les nœuds
 * - "Électrons" qui voyagent le long des segments
 * - Pulsations lumineuses sur les nœuds actifs
 */

(function () {
    'use strict';

    /* ── Configuration ── */
    const CFG = {
        cellSize:       44,          // taille de chaque cellule de la grille (px)
        traceColor:     '#00d4ff',   // couleur principale des traces
        traceAlpha:     0.12,        // opacité des traces au repos
        nodeRadius:     2,           // rayon des nœuds
        nodeAlpha:      0.25,        // opacité des nœuds
        electronCount:  18,          // nombre d'électrons simultanés
        electronSpeed:  1.2,         // vitesse de déplacement des électrons (px/frame)
        electronLength: 60,          // longueur de la traîne de l'électron (px)
        electronAlpha:  0.85,        // opacité max de l'électron
        pulseFreq:      0.008,       // probabilité qu'un nœud pulse par frame
        bgColor:        '#050a13',   // couleur de fond (doit correspondre au CSS)
    };

    /* ── État interne ── */
    let canvas, ctx;
    let W, H;
    let nodes  = [];   // { x, y, cx, cy, connections: [nodeIdx], pulse, pulseAge }
    let segs   = [];   // { ax, ay, bx, by } (segments entre nœuds)
    let electrons = []; // { segIdx, t, dir, color }

    /* ════════════════════════════════════════
       INITIALISATION
    ════════════════════════════════════════ */

    function init(canvasId) {
        canvas = document.getElementById(canvasId);
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        resize();
        buildGrid();
        spawnElectrons();
        requestAnimationFrame(frame);

        window.addEventListener('resize', debounce(() => {
            resize();
            buildGrid();
            spawnElectrons();
        }, 200));
    }

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    /* ════════════════════════════════════════
       CONSTRUCTION DE LA GRILLE
    ════════════════════════════════════════ */

    function buildGrid() {
        nodes = [];
        segs  = [];

        const cols = Math.ceil(W / CFG.cellSize) + 1;
        const rows = Math.ceil(H / CFG.cellSize) + 1;

        /* Créer les nœuds – chaque nœud a une légère position aléatoire
           autour du point de grille pour rendre le rendu organique */
        const grid = [];
        for (let r = 0; r < rows; r++) {
            grid[r] = [];
            for (let c = 0; c < cols; c++) {
                const jitter = CFG.cellSize * 0.18;
                const x = c * CFG.cellSize + rand(-jitter, jitter);
                const y = r * CFG.cellSize + rand(-jitter, jitter);
                const node = { x, y, pulse: 0, pulseAge: 0, connections: [] };
                grid[r][c] = nodes.length;
                nodes.push(node);
            }
        }

        /* Connecter les nœuds : horizontal, vertical, quelques diagonales */
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const idxA = grid[r][c];
                // Droite
                if (c + 1 < cols && Math.random() < 0.72) {
                    const idxB = grid[r][c + 1];
                    connect(idxA, idxB);
                }
                // Bas
                if (r + 1 < rows && Math.random() < 0.72) {
                    const idxB = grid[r + 1][c];
                    connect(idxA, idxB);
                }
            }
        }

        /* S'assurer que le graphe est connexe en ajoutant
           des segments manquants sur les nœuds isolés */
        nodes.forEach((n, i) => {
            if (n.connections.length === 0 && i < nodes.length - 1) {
                connect(i, i + 1);
            }
        });
    }

    function connect(iA, iB) {
        if (nodes[iA].connections.includes(iB)) return;
        nodes[iA].connections.push(iB);
        nodes[iB].connections.push(iA);
        segs.push({ iA, iB });
    }

    /* ════════════════════════════════════════
       ÉLECTRONS
    ════════════════════════════════════════ */

    function spawnElectrons() {
        electrons = [];
        for (let i = 0; i < CFG.electronCount; i++) {
            electrons.push(makeElectron());
        }
    }

    function makeElectron() {
        const segIdx = Math.floor(Math.random() * segs.length);
        return {
            segIdx,
            t:    Math.random(),   // position 0→1 le long du segment
            dir:  Math.random() < 0.5 ? 1 : -1,
            hue:  Math.random() < 0.8 ? 190 : Math.random() * 60 + 260, // cyan ou violet
        };
    }

    function updateElectron(e) {
        const seg = segs[e.segIdx];
        if (!seg) { return makeElectron(); }

        const nA = nodes[seg.iA];
        const nB = nodes[seg.iB];
        const segLen = dist(nA, nB);

        // Avancer
        e.t += (CFG.electronSpeed / segLen) * e.dir;

        if (e.t > 1) {
            // Atteint le nœud B : passer au prochain segment ou rebondir
            const next = nextSeg(e.segIdx, seg.iB);
            if (next !== null) {
                e.segIdx = next.segIdx;
                e.t = next.t;
                e.dir = next.dir;
                pulseNode(seg.iB);
            } else {
                e.dir = -1;
                e.t = 1;
            }
        } else if (e.t < 0) {
            const next = nextSeg(e.segIdx, seg.iA);
            if (next !== null) {
                e.segIdx = next.segIdx;
                e.t = next.t;
                e.dir = next.dir;
                pulseNode(seg.iA);
            } else {
                e.dir = 1;
                e.t = 0;
            }
        }
        return e;
    }

    function nextSeg(currentSegIdx, nodeIdx) {
        const node = nodes[nodeIdx];
        if (node.connections.length <= 1) return null;

        // Choisir un segment connexe différent de l'actuel
        const candidates = segs
            .map((s, i) => ({ s, i }))
            .filter(({ s, i }) =>
                i !== currentSegIdx &&
                (s.iA === nodeIdx || s.iB === nodeIdx)
            );

        if (candidates.length === 0) return null;
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        const goingFromA = chosen.s.iA === nodeIdx;
        return {
            segIdx: chosen.i,
            t:      goingFromA ? 0 : 1,
            dir:    goingFromA ? 1 : -1,
        };
    }

    function pulseNode(nodeIdx) {
        if (nodes[nodeIdx]) {
            nodes[nodeIdx].pulse    = 1;
            nodes[nodeIdx].pulseAge = 0;
        }
    }

    /* ════════════════════════════════════════
       RENDU
    ════════════════════════════════════════ */

    function frame() {
        ctx.clearRect(0, 0, W, H);

        drawTraces();
        drawNodes();
        drawElectrons();

        // Mise à jour des électrons
        electrons = electrons.map(updateElectron);

        // Pulses aléatoires sur des nœuds au hasard
        if (Math.random() < CFG.pulseFreq * nodes.length) {
            const ri = Math.floor(Math.random() * nodes.length);
            pulseNode(ri);
        }

        requestAnimationFrame(frame);
    }

    function drawTraces() {
        ctx.strokeStyle = hexToRgba(CFG.traceColor, CFG.traceAlpha);
        ctx.lineWidth   = 1;
        ctx.lineCap     = 'round';

        segs.forEach(seg => {
            const a = nodes[seg.iA];
            const b = nodes[seg.iB];
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        });
    }

    function drawNodes() {
        nodes.forEach(n => {
            // Nœud de base
            ctx.beginPath();
            ctx.arc(n.x, n.y, CFG.nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(CFG.traceColor, CFG.nodeAlpha);
            ctx.fill();

            // Pulsation
            if (n.pulse > 0) {
                n.pulseAge++;
                n.pulse = Math.max(0, 1 - n.pulseAge / 25);

                const r = CFG.nodeRadius + n.pulse * 8;
                ctx.beginPath();
                ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
                ctx.strokeStyle = hexToRgba(CFG.traceColor, n.pulse * 0.6);
                ctx.lineWidth = 1;
                ctx.stroke();

                // Point central brillant
                ctx.beginPath();
                ctx.arc(n.x, n.y, CFG.nodeRadius + 1, 0, Math.PI * 2);
                ctx.fillStyle = hexToRgba(CFG.traceColor, n.pulse * 0.9);
                ctx.fill();
            }
        });
    }

    function drawElectrons() {
        electrons.forEach(e => {
            const seg = segs[e.segIdx];
            if (!seg) return;
            const nA = nodes[seg.iA];
            const nB = nodes[seg.iB];

            // Position de tête
            const hx = lerp(nA.x, nB.x, e.t);
            const hy = lerp(nA.y, nB.y, e.t);

            // Traîne (gradient linéaire le long du segment)
            const segLen = dist(nA, nB);
            const trailLen = Math.min(CFG.electronLength, segLen);
            const trailT   = trailLen / segLen;
            const tTail    = clamp(e.t - e.dir * trailT, 0, 1);
            const tx = lerp(nA.x, nB.x, tTail);
            const ty = lerp(nA.y, nB.y, tTail);

            const grad = ctx.createLinearGradient(tx, ty, hx, hy);
            grad.addColorStop(0, `hsla(${e.hue}, 100%, 60%, 0)`);
            grad.addColorStop(1, `hsla(${e.hue}, 100%, 70%, ${CFG.electronAlpha})`);

            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(hx, hy);
            ctx.strokeStyle = grad;
            ctx.lineWidth   = 2;
            ctx.lineCap     = 'round';
            ctx.stroke();

            // Point brillant en tête
            ctx.beginPath();
            ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${e.hue}, 100%, 85%, ${CFG.electronAlpha})`;
            ctx.fill();
        });
    }

    /* ════════════════════════════════════════
       UTILITAIRES
    ════════════════════════════════════════ */

    function rand(a, b) { return a + Math.random() * (b - a); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
    function dist(a, b) {
        const dx = b.x - a.x, dy = b.y - a.y;
        return Math.sqrt(dx * dx + dy * dy) || 0.001;
    }

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function debounce(fn, ms) {
        let t;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    /* ── Exposition publique ── */
    window.CircuitBg = { init };

})();
