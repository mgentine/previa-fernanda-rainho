/* Dra. Fernanda Rainho · comportamento do site
 * Menu do celular, fio do cabeçalho, acordeão dos cuidados, calculadora do último banho e formulário que abre o WhatsApp.
 * Sem este arquivo, a página continua legível e os links do WhatsApp funcionam com mensagem padrão.
 */
(() => {
  'use strict';
  if (window.__siteFernanda) return;
  window.__siteFernanda = true;
  document.documentElement.classList.add('js-site');

  const WHATSAPP = '5517996162379';
  const $ = (s, d = document) => d.querySelector(s);
  const $$ = (s, d = document) => Array.from(d.querySelectorAll(s));

  /* ---------- Menu do celular ---------- */
  const botaoMenu = $('.topo__menu');
  const painel = $('#menu-movel');
  const topo = $('.topo');
  if (botaoMenu && painel) {
    const focaveis = () => $$('a, button', painel).concat(botaoMenu);
    const abrir = () => {
      painel.classList.add('aberto');
      painel.removeAttribute('inert');
      topo.classList.add('menu-aberto');
      botaoMenu.setAttribute('aria-expanded', 'true');
      botaoMenu.querySelector('.rotulo').textContent = 'Fechar';
      document.documentElement.style.overflow = 'hidden';
      setTimeout(() => { const a = $('a', painel); if (a) a.focus(); }, 60);
    };
    const fechar = (devolverFoco = true) => {
      painel.classList.remove('aberto');
      painel.setAttribute('inert', '');
      topo.classList.remove('menu-aberto');
      botaoMenu.setAttribute('aria-expanded', 'false');
      botaoMenu.querySelector('.rotulo').textContent = 'Menu';
      document.documentElement.style.overflow = '';
      if (devolverFoco) botaoMenu.focus();
    };
    painel.setAttribute('inert', '');
    botaoMenu.addEventListener('click', () => (painel.classList.contains('aberto') ? fechar() : abrir()));
    painel.addEventListener('click', (e) => { if (e.target.closest('a')) fechar(false); });
    document.addEventListener('keydown', (e) => {
      if (!painel.classList.contains('aberto')) return;
      if (e.key === 'Escape') { e.preventDefault(); fechar(); }
      if (e.key === 'Tab') {
        const f = focaveis();
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    // Se a tela crescer com o menu aberto (celular girado), fecha sem prender a rolagem.
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (m) => { if (m.matches && painel.classList.contains('aberto')) fechar(false); });
  }

  /* ---------- Fio do cabeçalho ao rolar ---------- */
  if (topo) {
    const marcarRolagem = () => topo.classList.toggle('rolou', window.scrollY > 8);
    window.addEventListener('scroll', marcarRolagem, { passive: true });
    marcarRolagem();
  }

  /* ---------- Cuidados: a foto acompanha o item aberto ---------- */
  // O acordeão é <details name="cuidados">, exclusivo por natureza nos navegadores atuais.
  // Nos antigos, o script fecha os outros itens. Sem script, todos abrem e a primeira foto fica.
  const detailsTemNome = 'name' in document.createElement('details');
  $$('[data-cuidados]').forEach((bloco) => {
    const itens = $$('details[data-foto]', bloco);
    const fotos = $$('figure[data-foto]', bloco);
    const mostrar = (id) => fotos.forEach((f) => {
      const ativa = f.dataset.foto === id;
      f.classList.toggle('ativo', ativa);
      if (ativa) f.removeAttribute('aria-hidden'); else f.setAttribute('aria-hidden', 'true');
    });
    itens.forEach((d) => d.addEventListener('toggle', () => {
      if (!d.open) return;
      mostrar(d.dataset.foto);
      if (!detailsTemNome) itens.forEach((o) => { if (o !== d) o.open = false; });
    }));
  });

  /* ---------- Calculadora do último banho ---------- */
  // Regra combinada para o site: o pet passa os três dias anteriores à consulta sem banho,
  // então o último banho é quatro dias antes da data marcada.
  const DIAS_SEM_BANHO = 3;
  const fmtDia = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'UTC' });
  const fmtSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' });
  $$('[data-banho]').forEach((form) => {
    const entrada = $('input[type="date"]', form);
    const saida = $('[data-banho-resultado]', form.closest('.banho') || form);
    if (!entrada || !saida) return;
    const hoje = new Date();
    const iso = (d) => d.toISOString().slice(0, 10);
    const hojeUTC = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
    entrada.min = iso(hojeUTC);
    const calcular = () => {
      if (!entrada.value) { saida.textContent = 'Escolha a data da consulta para ver o dia do último banho.'; return; }
      const [a, m, d] = entrada.value.split('-').map(Number);
      const consulta = new Date(Date.UTC(a, m - 1, d));
      if (Number.isNaN(consulta.getTime())) { saida.textContent = 'Data inválida. Use o formato dia, mês e ano.'; return; }
      const ultimo = new Date(consulta); ultimo.setUTCDate(ultimo.getUTCDate() - (DIAS_SEM_BANHO + 1));
      const semBanho = [];
      for (let i = DIAS_SEM_BANHO; i >= 1; i--) { const x = new Date(consulta); x.setUTCDate(x.getUTCDate() - i); semBanho.push(fmtSemana.format(x)); }
      const lista = semBanho.slice(0, -1).join(', ') + ' e ' + semBanho[semBanho.length - 1];
      saida.innerHTML = '';
      const forte = document.createElement('strong');
      forte.textContent = 'Último banho: ' + fmtDia.format(ultimo) + '.';
      const p = document.createElement('span');
      if (ultimo < hojeUTC) {
        p.textContent = ' Essa data já passou. Se o pet tomou banho depois dela, comente no agendamento.';
      } else {
        p.textContent = ' Assim ele passa ' + lista + ' sem banho, os três dias antes da consulta.';
      }
      saida.append(forte, p);
    };
    entrada.addEventListener('change', calcular);
    entrada.addEventListener('input', calcular);
    form.addEventListener('submit', (e) => { e.preventDefault(); calcular(); });
  });

  /* ---------- Formulário que abre o WhatsApp ---------- */
  const limpar = (v, max = 80) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
  $$('[data-whatsapp]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      // Os campos não têm "name": sem script, só a mensagem padrão vai para o WhatsApp.
      const valor = (n) => { const el = form.querySelector('[data-nome="' + n + '"]'); return el ? el.value : ''; };
      const tutor = limpar(valor('tutor'), 60);
      const pet = limpar(valor('pet'), 40);
      const especie = limpar(valor('especie'), 10);
      const motivo = limpar(valor('motivo'), 60);
      let msg = 'Olá, Dra. Fernanda!';
      if (tutor) msg += ' Meu nome é ' + tutor + '.';
      msg += ' Gostaria de agendar uma consulta dermatológica';
      if (pet && especie) msg += ' para ' + pet + ', ' + (especie === 'gato' ? 'meu gato' : 'meu cão') + '.';
      else if (pet) msg += ' para ' + pet + '.';
      else if (especie) msg += ' para ' + (especie === 'gato' ? 'meu gato' : 'meu cão') + '.';
      else msg += ' para meu pet.';
      if (motivo) msg += ' Motivo: ' + motivo + '.';
      const texto = $('input[name="text"]', form);
      if (texto) texto.value = msg;
      // Abre a conversa por um link real (nova aba), com espaços codificados como %20.
      // Sem script, o formulário envia só a mensagem padrão do campo oculto.
      e.preventDefault();
      const link = document.createElement('a');
      link.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
      link.target = '_blank';
      link.rel = 'noopener';
      document.body.append(link);
      link.click();
      link.remove();
    });
  });

  /* ---------- Avaliações que alternam sozinhas ---------- */
  // Troca o grupo de avaliações a cada TEMPO. Para com o botão Pausar e, enquanto durar, com o ponteiro
  // ou o foco sobre elas, com a seção fora da tela e com a aba escondida (WCAG 2.2.2).
  // Com "reduzir movimento" ligado, começa parada e troca só pelos botões. Sem script, fica o primeiro grupo.
  const lista = $('[data-carrossel]');
  const ctrl = $('[data-carrossel-controles]');
  if (lista && ctrl) {
    const TEMPO = 12000; // ms por grupo: tempo de ler as três avaliações
    const itens = $$('[data-pagina]', lista);
    const paginas = [...new Set(itens.map((el) => el.dataset.pagina))];
    const contador = $('[data-contador]', ctrl);
    const barra = $('[data-tempo]', ctrl);
    const botaoPausa = $('[data-pausa]', ctrl);
    const rotuloPausa = $('span', botaoPausa);
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
    const area = lista.closest('section') || lista;
    const motivos = new Set(['fora']); // o que segura a troca neste momento
    let ligado = !reduz.matches;        // escolha do visitante (botão)
    let atual = 0;

    if (paginas.length > 1 && contador && barra && botaoPausa) {
      barra.style.animationDuration = TEMPO + 'ms';

      const atualizar = () => {
        barra.style.animationPlayState = ligado && motivos.size === 0 ? 'running' : 'paused';
        ctrl.classList.toggle('carrossel--parado', !ligado);
        rotuloPausa.textContent = ligado ? 'Pausar' : 'Reproduzir';
        botaoPausa.setAttribute('aria-label', ligado ? 'Pausar a troca das avaliações' : 'Reproduzir a troca das avaliações');
        // Leitor de tela: anuncia a troca só quando o visitante pede, não a cada passagem automática.
        lista.setAttribute('aria-live', ligado ? 'off' : 'polite');
      };
      const reiniciarBarra = () => {
        barra.classList.remove('correr');
        void barra.offsetWidth; // reinicia a animação da barra
        if (ligado) barra.classList.add('correr');
        atualizar();
      };
      const mostrar = (i) => {
        atual = (i + paginas.length) % paginas.length;
        itens.forEach((el) => el.classList.toggle('atual', el.dataset.pagina === paginas[atual]));
        contador.textContent = `${atual + 1} de ${paginas.length}`;
        reiniciarBarra();
      };
      const segurar = (motivo, sim) => { sim ? motivos.add(motivo) : motivos.delete(motivo); atualizar(); };

      barra.addEventListener('animationend', () => mostrar(atual + 1));
      $('[data-anterior]', ctrl).addEventListener('click', () => mostrar(atual - 1));
      $('[data-proxima]', ctrl).addEventListener('click', () => mostrar(atual + 1));
      botaoPausa.addEventListener('click', () => { ligado = !ligado; reiniciarBarra(); });

      [lista, ctrl].forEach((el) => {
        el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') segurar('ponteiro', true); });
        el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') segurar('ponteiro', false); });
      });
      // Só o foco do teclado segura a troca; o clique nos botões não deixa a troca presa.
      area.addEventListener('focusin', (e) => { if (e.target.matches(':focus-visible')) segurar('foco', true); });
      area.addEventListener('focusout', (e) => { if (!area.contains(e.relatedTarget)) segurar('foco', false); });
      document.addEventListener('visibilitychange', () => segurar('aba', document.hidden));
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([e]) => segurar('fora', !e.isIntersecting), { threshold: 0.35 }).observe(lista);
      } else {
        motivos.delete('fora');
      }
      const aoMudarMovimento = () => { if (reduz.matches && ligado) { ligado = false; reiniciarBarra(); } };
      if (reduz.addEventListener) reduz.addEventListener('change', aoMudarMovimento);

      lista.classList.add('carrossel--ativo');
      ctrl.hidden = false;
      mostrar(0);
    }
  }

  /* ---------- Lente (revelação no toque) ---------- */
  // Duas imagens alinhadas da mesma área; a de cima ([data-lente-topo]) aparece só dentro do círculo, que segue
  // o mouse ou o dedo. Setas do teclado movem a lente (Shift para passo maior). O botão [data-lente-tudo="id"]
  // mostra a segunda imagem inteira. Não depende de biblioteca. Adaptado do módulo testado em 05/11/2026.
  $$('[data-lente]').forEach((caixa) => {
    const botao = caixa.id ? $(`[data-lente-tudo="${caixa.id}"]`) : null;
    const textoAbrir = botao ? botao.textContent : '';
    const textoFechar = botao ? (botao.getAttribute('data-texto-fechar') || 'Voltar para a lente') : '';
    let pos = null;
    const mover = (x, y) => {
      const r = caixa.getBoundingClientRect();
      pos = { x: Math.max(0, Math.min(r.width, x)), y: Math.max(0, Math.min(r.height, y)) };
      caixa.style.setProperty('--x', pos.x + 'px');
      caixa.style.setProperty('--y', pos.y + 'px');
      caixa.classList.add('lente--usada');
    };
    const doPonteiro = (e) => { const r = caixa.getBoundingClientRect(); mover(e.clientX - r.left, e.clientY - r.top); };
    const inteira = (ligar) => {
      caixa.classList.toggle('lente--inteira', ligar);
      caixa.classList.add('lente--usada');
      if (botao) { botao.setAttribute('aria-pressed', String(ligar)); botao.textContent = ligar ? textoFechar : textoAbrir; }
    };
    if (!caixa.hasAttribute('tabindex')) caixa.tabIndex = 0;
    caixa.addEventListener('pointerdown', (e) => {
      if (caixa.classList.contains('lente--inteira')) inteira(false);
      try { caixa.setPointerCapture(e.pointerId); } catch (erro) { /* navegador sem captura: segue sem ela */ }
      doPonteiro(e);
    });
    caixa.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' || caixa.hasPointerCapture(e.pointerId)) doPonteiro(e);
    });
    caixa.addEventListener('keydown', (e) => {
      const passo = e.shiftKey ? 64 : 24;
      const d = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo] }[e.key];
      if (!d) return;
      e.preventDefault();
      const r = caixa.getBoundingClientRect();
      const atual = pos || { x: r.width * 0.58, y: r.height * 0.46 };
      mover(atual.x + d[0], atual.y + d[1]);
    });
    if (botao) {
      botao.setAttribute('aria-pressed', 'false');
      botao.addEventListener('click', () => inteira(!caixa.classList.contains('lente--inteira')));
    }
  });

  /* ---------- Cartões que se empilham (sobreposição) ---------- */
  // O empilhamento é position: sticky (funciona sem script). Aqui: o degrau entre cartões (--i), o véu e, com
  // movimento normal e GSAP disponível, o cartão de baixo recua para 94% e escurece quando o seguinte chega.
  $$('[data-pilha]').forEach((pilha) => {
    const etapas = Array.from(pilha.children);
    etapas.forEach((etapa, i) => {
      etapa.style.setProperty('--i', i);
      if (i < etapas.length - 1 && !$('.pilha__veu', etapa)) {
        const veu = document.createElement('span');
        veu.className = 'pilha__veu';
        veu.setAttribute('aria-hidden', 'true');
        etapa.appendChild(veu);
      }
    });
    if (!(window.gsap && window.ScrollTrigger)) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      etapas.forEach((etapa, i) => {
        const proxima = etapas[i + 1];
        if (!proxima) return;
        const topo = parseFloat(getComputedStyle(proxima).top) || 0;
        const tl = window.gsap.timeline({
          scrollTrigger: { trigger: proxima, start: 'top bottom', end: () => 'top ' + (topo + 8) + 'px', scrub: true },
        });
        tl.to(etapa, { scale: 0.94, ease: 'none' }, 0);
        const veu = $('.pilha__veu', etapa);
        if (veu) tl.to(veu, { opacity: 0.28, ease: 'none' }, 0);
      });
    });
  });
})();
