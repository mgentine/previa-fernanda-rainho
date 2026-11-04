/* Dra. Fernanda Rainho · comportamento do site
 * Menu do celular, vídeo do hero, exames ao microscópio, calculadora do último banho e formulário que abre o WhatsApp.
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

  /* ---------- Vídeo do hero ---------- */
  // Toca sozinho só sem "movimento reduzido" e sem economia de dados; o botão pausa e retoma.
  // Fora da tela o vídeo para (bateria e dados) e volta ao reaparecer, se a pessoa não tiver pausado.
  const video = $('[data-hero-video]');
  const pausa = $('[data-hero-pausa]');
  if (video && pausa) {
    const rotulo = $('.rotulo', pausa);
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const economia = !!(navigator.connection && navigator.connection.saveData);
    let pausadoPelaPessoa = reduzido || economia;
    let visivel = true;
    const marcar = (tocando) => {
      rotulo.textContent = tocando ? 'Pausar vídeo' : 'Reproduzir vídeo';
      pausa.classList.toggle('pausado', !tocando);
    };
    const tocar = () => {
      video.preload = 'auto';
      const p = video.play();
      if (p && p.catch) p.catch(() => marcar(false));
    };
    video.addEventListener('playing', () => { video.classList.add('ativo'); marcar(true); });
    video.addEventListener('pause', () => marcar(false));
    pausa.addEventListener('click', () => {
      if (video.paused) { pausadoPelaPessoa = false; tocar(); }
      else { pausadoPelaPessoa = true; video.pause(); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entradas) => {
        visivel = entradas[0].isIntersecting;
        if (!visivel && !video.paused) video.pause();
        else if (visivel && video.paused && !pausadoPelaPessoa) tocar();
      }, { threshold: 0.15 }).observe(video);
    }
    marcar(!pausadoPelaPessoa);
    if (!pausadoPelaPessoa) tocar();
  }

  /* ---------- Exames ao microscópio ---------- */
  $$('[data-mostruario]').forEach((bloco) => {
    const botoes = $$('[data-item]', bloco);
    const disco = $('.mostruario__disco', bloco);
    const escolher = (id) => {
      botoes.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.item === id)));
      $$('[data-figura]', bloco).forEach((f) => f.classList.toggle('ativo', f.dataset.figura === id));
      $$('[data-fato]', bloco).forEach((f) => f.classList.toggle('ativo', f.dataset.fato === id));
      const ativo = botoes.find((b) => b.dataset.item === id);
      if (disco && ativo) disco.dataset.cor = ativo.dataset.cor || '';
    };
    botoes.forEach((b) => b.addEventListener('click', () => escolher(b.dataset.item)));
    if (botoes[0]) escolher(botoes[0].dataset.item);
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
})();
