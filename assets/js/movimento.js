/* movimento.js · sites-premium
 *
 * Camada de movimento em GSAP que segue os tokens da Taste Skill (vendor/taste-skill/references/motion.md).
 * Funciona em HTML puro e em bloco colado em construtor de sites. Para React, veja references/movimento.md §6.
 *
 * Como ligar:
 *   No <head>, antes de qualquer CSS (marca que há JS e, se nada ficar pronto em 3 s, mostra tudo):
 *     <script>(function(r){r.classList.add('js');setTimeout(function(){if(!r.classList.contains('movimento-pronto'))r.classList.remove('js')},3000)})(document.documentElement)</script>
 *   No <head>:                          <link rel="stylesheet" href="movimento.css">
 *   No fim do <body>, nesta ordem (neste site, GSAP 3.15.0 servido da própria pasta assets/js/vendor):
 *     <script defer src="assets/js/vendor/gsap.min.js"></script>
 *     <script defer src="assets/js/vendor/ScrollTrigger.min.js"></script>
 *     <script defer src="assets/js/movimento.js"></script>
 *     <script defer src="assets/js/destaque.js"></script>
 *
 * Marcações (tudo opcional; o HTML sem script já é a página terminada):
 *   data-hero                 primeira tela; entra no carregamento (título em linhas, depois as partes)
 *   data-secao                cada seção; as partes entram quando ela chega a 85% da tela, uma vez
 *   data-parte                partes de uma seção ou do hero, na ordem de leitura (título, texto, imagem, detalhes)
 *   data-linhas               título ou frase que sobe linha a linha por trás de uma máscara (SplitText)
 *   data-tinta                uma frase por página que passa de cinza a tinta cheia conforme a rolagem
 *   data-numero="1234.5"      número real que rola até o valor (data-casas="1" para decimais; formato pt-BR).
 *                             O texto do elemento já traz o valor final formatado: sem script, ele fica lá.
 *   data-janela               moldura cuja imagem abre de um recorte até a largura toda, presa à rolagem
 *   data-paralaxe             imagem dentro de moldura que desliza menos de 8% (a moldura precisa de overflow: clip)
 *
 * Regras que este arquivo segue:
 *   só transform, opacity e clip-path; nada de width, height, top ou left;
 *   com prefers-reduced-motion: reduce, nada se move e nada é escondido;
 *   se o GSAP não carregar ou der erro, a classe .js sai e tudo aparece;
 *   as entradas limpam os estilos inline ao terminar, para o :hover do CSS voltar a funcionar.
 */
(() => {
  'use strict';

  // Evita rodar duas vezes quando o mesmo bloco é colado duas vezes num construtor.
  if (window.__sitesPremiumMovimento) return;
  window.__sitesPremiumMovimento = true;

  const raiz = document.documentElement;
  const mostrarTudo = () => raiz.classList.remove('js');

  if (!window.gsap || !window.ScrollTrigger) {
    mostrarTudo();
    return;
  }

  const temSplit = !!window.SplitText;
  gsap.registerPlugin(ScrollTrigger);
  if (temSplit) gsap.registerPlugin(SplitText);

  // Tokens da Taste traduzidos para GSAP (references/movimento.md §3).
  const T = {
    expo: 'expo.out',          // --ease-expo: revelações de 800 ms ou mais, linhas, aberturas
    saida: 'power4.out',       // --ease-out: entradas curtas e interface
    revelar: 0.8,              // --t-reveal
    linha: 0.09,               // --stagger-line
    item: 0.07,                // --stagger-item
  };
  const LIMPAR = 'transform,opacity,visibility';
  const INICIO = 'clamp(top 85%)'; // clamp(): o gatilho é alcançável mesmo no fim da página

  const todos = (seletor, dentro = document) => Array.from(dentro.querySelectorAll(seletor));

  // Linhas que sobem por trás de uma máscara. Com autoSplit, refaz a divisão quando a fonte carrega
  // ou a largura muda; a animação é devolvida para o SplitText sincronizar e limpar.
  function linhasMascaradas(el, comRolagem, atraso = 0) {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 110,
          duration: 0.9,
          ease: T.expo,
          stagger: T.linha,
          delay: atraso,
          scrollTrigger: comRolagem ? { trigger: el, start: INICIO, once: true } : undefined,
        });
      },
    });
  }

  function entrada(partes, gatilho, atraso = 0) {
    if (!partes.length) return;
    gsap.from(partes, {
      autoAlpha: 0,
      y: 24,
      duration: T.revelar,
      ease: T.expo,
      stagger: T.item,
      delay: atraso,
      clearProps: LIMPAR,
      scrollTrigger: gatilho ? { trigger: gatilho, start: INICIO, once: true } : undefined,
    });
  }

  let mm;
  try {
    mm = gsap.matchMedia();

    mm.add({ livre: '(prefers-reduced-motion: no-preference)' }, () => {
      // Sem SplitText, o que seria dividido em linhas entra como parte comum.
      const seletorPartes = temSplit ? '[data-parte]' : '[data-parte], [data-linhas]';

      // 1. Primeira tela: título em linhas, depois as partes. Tudo termina em cerca de 1,2 s.
      const hero = document.querySelector('[data-hero]');
      if (hero) {
        const titulos = temSplit ? todos('[data-linhas]', hero) : [];
        titulos.forEach((t) => linhasMascaradas(t, false, 0.05));
        entrada(todos(seletorPartes, hero), null, titulos.length ? 0.3 : 0.05);
      }

      // 2. Seções: cada uma coreografa as próprias partes quando chega à tela.
      todos('[data-secao]').forEach((secao) => {
        if (temSplit) todos('[data-linhas]', secao).forEach((t) => linhasMascaradas(t, true));
        entrada(todos(seletorPartes, secao), secao);
      });

      // 3. Frase que passa de cinza a tinta cheia, presa à barra de rolagem (uma por página).
      if (temSplit) {
        todos('[data-tinta]').forEach((el) => {
          const divisao = SplitText.create(el, { type: 'words' });
          gsap.fromTo(divisao.words, { opacity: 0.45 }, {
            opacity: 1,
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: { trigger: el, start: 'clamp(top 80%)', end: 'clamp(bottom 45%)', scrub: true },
          });
        });
      }

      // 4. Números reais que rolam até o valor final, formatados em pt-BR.
      todos('[data-numero]').forEach((el) => {
        const final = parseFloat(el.dataset.numero);
        if (!Number.isFinite(final)) return;
        const casas = parseInt(el.dataset.casas || '0', 10);
        const formato = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
        const estado = { v: 0 };
        gsap.to(estado, {
          v: final,
          duration: 1.2,
          ease: T.expo,
          onStart: () => { el.textContent = formato.format(0); },
          onUpdate: () => { el.textContent = formato.format(estado.v); },
          onComplete: () => { el.textContent = formato.format(final); },
          scrollTrigger: { trigger: el, start: 'clamp(top 90%)', once: true },
        });
      });

      // 5. Imagem que abre de um recorte até a moldura inteira, presa à rolagem.
      todos('[data-janela]').forEach((moldura) => {
        const midia = moldura.querySelector('img, video, picture');
        const tl = gsap.timeline({
          scrollTrigger: { trigger: moldura, start: 'clamp(top 85%)', end: 'clamp(top 20%)', scrub: true },
        });
        tl.fromTo(moldura, { clipPath: 'inset(10% 14% 10% 14%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none' }, 0);
        if (midia) tl.fromTo(midia, { scale: 1.12 }, { scale: 1, ease: 'none' }, 0);
      });

      // 6. Deriva leve de imagem dentro da moldura (menos de 8% do elemento).
      todos('[data-paralaxe]').forEach((img) => {
        gsap.fromTo(img, { yPercent: -4 }, {
          yPercent: 4,
          ease: 'none',
          scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
    });

    // Imagens com loading="lazy" sem largura e altura declaradas mudam o layout ao carregar;
    // recalcula os gatilhos uma vez depois de cada leva.
    let espera;
    const recalcular = () => { clearTimeout(espera); espera = setTimeout(() => ScrollTrigger.refresh(), 150); };
    todos('img[loading="lazy"]').forEach((img) => {
      if (!img.complete) img.addEventListener('load', recalcular, { once: true });
    });

    raiz.classList.add('movimento-pronto');
  } catch (erro) {
    // Desfaz o que chegou a ser criado (estilos inline, gatilhos, divisões de texto) e mostra a página.
    console.error('[movimento]', erro);
    if (mm) mm.revert();
    mostrarTudo();
  }
})();
