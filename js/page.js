/**
 * page.js — Logique commune aux pages de section
 *
 * - Lance l'animation de fond circuit (version atténuée)
 * - Anime le canvas hero de la section
 * - Gère le retour clavier sur le lien "retour"
 * - Animation d'entrée au chargement (fade depuis l'overlay)
 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        /* Fond circuit (opacité réduite pour ne pas surcharger) */
        if (window.CircuitBg) {
            CircuitBg.init('bg-canvas');
        }

        /* Animation canvas hero de section (si présent) */
        const heroCanvas = document.getElementById('hero-canvas');
        if (heroCanvas && window.HeroAnim) {
            HeroAnim.start(heroCanvas);
        }

        /* Fondu d'entrée : la page arrive déjà visible après la transition */
        document.body.style.opacity = '0';
        requestAnimationFrame(() => {
            document.body.style.transition = 'opacity 0.4s ease';
            document.body.style.opacity    = '1';
        });
    });

})();
