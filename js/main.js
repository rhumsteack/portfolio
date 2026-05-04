/**
 * main.js — Logique principale de la page d'accueil
 *
 * - Lance l'animation de fond (circuit board)
 * - Gère l'effet machine à écrire sur le titre
 * - Branche les clics sur les cartes → transition + navigation
 * - Gère la navigation clavier (accessibilité)
 */

(function () {
    'use strict';

    /* ── Lancement au chargement ── */
    document.addEventListener('DOMContentLoaded', () => {
        CircuitBg.init('bg-canvas');
        typewriterEffect();
        bindCards();
        setCurrentYear();
    });

    /* ════════════════════════════════════════
       MACHINE À ÉCRIRE
    ════════════════════════════════════════ */

    const PHRASES = [
        'Ingénieur Qualité Logicielle',
        'Pratiquant de Iaïdo',
        'Coureur & Traileur',
        'Joueur d\'échecs',
        'Passionné de Robotique',
        'Artiste Amateur',
        'Curieux de tout',
    ];

    function typewriterEffect() {
        const el = document.getElementById('typewriter');
        if (!el) return;

        let phraseIdx  = 0;
        let charIdx    = 0;
        let deleting   = false;
        let loopTimer;

        const SPEED_TYPE   = 70;   // ms par caractère (frappe)
        const SPEED_DELETE = 35;   // ms par caractère (effacement)
        const PAUSE_FULL   = 2000; // ms de pause quand la phrase est complète
        const PAUSE_EMPTY  = 400;  // ms de pause quand vide

        function tick() {
            const phrase = PHRASES[phraseIdx];

            if (!deleting) {
                charIdx++;
                el.textContent = phrase.slice(0, charIdx);

                if (charIdx === phrase.length) {
                    // Pause avant d'effacer
                    deleting = true;
                    loopTimer = setTimeout(tick, PAUSE_FULL);
                    return;
                }
            } else {
                charIdx--;
                el.textContent = phrase.slice(0, charIdx);

                if (charIdx === 0) {
                    deleting = false;
                    phraseIdx = (phraseIdx + 1) % PHRASES.length;
                    loopTimer = setTimeout(tick, PAUSE_EMPTY);
                    return;
                }
            }

            loopTimer = setTimeout(tick, deleting ? SPEED_DELETE : SPEED_TYPE);
        }

        tick();
    }

    /* ════════════════════════════════════════
       GESTION DES CARTES
    ════════════════════════════════════════ */

    function bindCards() {
        const cards = document.querySelectorAll('.zone-card');

        cards.forEach(card => {
            // Clic souris
            card.addEventListener('click', () => activateCard(card));

            // Touche Entrée / Espace (accessibilité clavier)
            card.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activateCard(card);
                }
            });
        });
    }

    function activateCard(card) {
        const zone  = card.dataset.zone;
        const href  = card.dataset.href;
        const color = getComputedStyle(card).getPropertyValue('--accent').trim();

        if (!href) return;

        // Effet visuel "pression" sur la carte
        card.classList.add('is-clicking');
        setTimeout(() => card.classList.remove('is-clicking'), 150);

        // Lancer l'animation de transition puis naviguer
        Transitions.play(zone, color, () => {
            window.location.href = href;
        });
    }

    /* ════════════════════════════════════════
       ANNÉE EN COURS
    ════════════════════════════════════════ */

    function setCurrentYear() {
        const el = document.getElementById('current-year');
        if (el) el.textContent = new Date().getFullYear();
    }

})();
