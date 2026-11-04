/* Momento de destaque da home: a foto abre dentro do anel do "microscópio" e,
 * na rolagem, aproxima devagar (zoom preso à barra de rolagem, sem movimento automático).
 * Com movimento reduzido ou sem GSAP, nada acontece e a foto já está no lugar.
 */
(() => {
  'use strict';
  if (window.__destaqueFernanda) return;
  window.__destaqueFernanda = true;
  if (!window.gsap || !window.ScrollTrigger) return;
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const foto = hero.querySelector('.hero__foto');
  const zoom = hero.querySelector('.hero__zoom');
  const img = hero.querySelector('.hero__zoom img');
  const disco = hero.querySelector('.hero__disco');
  if (!foto || !zoom || !img || !disco) return;

  let mm;
  try {
    mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Abertura em cortina, de baixo para cima, com a foto assentando de 1,12 para 1.
      const tl = gsap.timeline({ delay: 0.1 });
      tl.fromTo(foto, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut', clearProps: 'clipPath' }, 0)
        .fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.5, ease: 'power2.out', clearProps: 'transform' }, 0)
        .fromTo(disco, { scale: 0.94 }, { scale: 1, duration: 1.2, ease: 'expo.out' }, 0);

      // Ken Burns pela rolagem: aproxima 10% enquanto a primeira tela sai.
      gsap.fromTo(zoom, { scale: 1 }, {
        scale: 1.1, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      });
      // Paralaxe leve do disco.
      gsap.to(disco, {
        yPercent: 7, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      });
    });
  } catch (erro) {
    console.error('[destaque]', erro);
    if (mm) mm.revert();
  }
})();
