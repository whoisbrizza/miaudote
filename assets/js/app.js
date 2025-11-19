/* assets/js/app.js */
/* Entrega III - Interatividade e funcionalidades (SPA, validações e máscaras) */

(() => {
  'use strict';

  /* ---------- Helpers ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function el(tag, attrs = {}, ...children) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    children.forEach(c => {
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else if (c) e.appendChild(c);
    });
    return e;
  }

  function showToast(message, type = 'success', timeout = 3500) {
    let container = $('#toast-container');
    if (!container) {
      container = el('div', { id: 'toast-container', 'aria-live': 'polite' });
      Object.assign(container.style, {
        position: 'fixed', right: '1rem', bottom: '1rem', zIndex: 9999
      });
      document.body.appendChild(container);
    }
    const toast = el('div', { role: 'status' }, message);
    Object.assign(toast.style, {
      background: type === 'success' ? '#e6ffef' : '#fff1f0',
      border: `1px solid ${type === 'success' ? '#2ecc71' : '#f44336'}`,
      padding: '0.6rem 1rem',
      borderRadius: '8px',
      marginTop: '0.5rem',
      boxShadow: '0 6px 18px rgba(0,0,0,0.06)'
    });
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, timeout);
  }

  /* ---------- NAV TOGGLE ---------- */
  function initNavToggle() {
    const toggle = $('#nav-toggle');
    const navList = $('#nav-list');
    if (!toggle || !navList) return;

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      navList.classList.toggle('open');
    });

    // close menu when clicking a nav link (mobile)
    navList.addEventListener('click', (e) => {
      if (e.target.tagName.toLowerCase() === 'a') {
        navList.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    // close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navList.classList.contains('open')) {
        navList.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ---------- INPUT MASKS & VALIDATION ---------- */

  // remove tudo o que não for número
  function onlyDigits(v) {
    return v.replace(/\D/g, '');
  }

  function maskCPF(value) {
    const v = onlyDigits(value).slice(0, 11);
    return v
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  function maskPhone(value) {
    const v = onlyDigits(value).slice(0, 11);
    if (v.length <= 10) {
      return v.replace(/^(\d{2})(\d{4})(\d)/, '($1) $2-$3').replace(/([^\d\-\(\)\s]+)$/,'').trim();
    } else {
      return v.replace(/^(\d{2})(\d{5})(\d)/, '($1) $2-$3');
    }
  }

  function maskCEP(value) {
    const v = onlyDigits(value).slice(0, 8);
    return v.replace(/^(\d{5})(\d)/, '$1-$2');
  }

  // Validação de CPF (algoritmo)
  function validateCPF(cpfRaw) {
    const cpf = onlyDigits(cpfRaw);
    if (cpf.length !== 11) return false;
    // rejeita sequências óbvias
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    const calcDigit = (cpfArray, factor) => {
      let total = 0;
      for (let i = 0; i < factor - 1; i++) {
        total += parseInt(cpfArray[i], 10) * (factor - i);
      }
      const mod = (total * 10) % 11;
      return mod === 10 ? 0 : mod;
    };

    const a = cpf.split('').map(d => parseInt(d, 10));
    const d1 = calcDigit(a, 10);
    const d2 = calcDigit(a, 11);
    return d1 === a[9] && d2 === a[10];
  }

  function attachMasks() {
    const cpf = $('#cpf');
    const tel = $('#telefone');
    const cep = $('#cep');

    if (cpf) {
      cpf.addEventListener('input', (e) => {
        const pos = e.target.selectionStart;
        e.target.value = maskCPF(e.target.value);
        e.target.setSelectionRange(pos, pos);
      });
    }

    if (tel) {
      tel.addEventListener('input', (e) => {
        const pos = e.target.selectionStart;
        e.target.value = maskPhone(e.target.value);
        e.target.setSelectionRange(pos, pos);
      });
    }

    if (cep) {
      cep.addEventListener('input', (e) => {
        const pos = e.target.selectionStart;
        e.target.value = maskCEP(e.target.value);
        e.target.setSelectionRange(pos, pos);
      });
    }
  }

  /* ---------- FORM HANDLING ---------- */
  function handleFormSubmission() {
    const form = document.querySelector('form');
    if (!form) return;

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();

      // basic HTML5 validity
      if (!form.checkValidity()) {
        form.reportValidity();
        showToast('Por favor, preencha corretamente os campos obrigatórios.', 'error');
        return;
      }

      // extra CPF validation
      const cpfInput = $('#cpf');
      if (cpfInput && !validateCPF(cpfInput.value)) {
        cpfInput.focus();
        showToast('CPF inválido. Verifique e tente novamente.', 'error');
        return;
      }

      // gather data
      const formData = new FormData(form);
      const obj = Object.fromEntries(formData.entries());
      obj.id = Date.now();
      obj.submittedAt = new Date().toISOString();

      // save to localStorage
      const key = 'miaudote_signups';
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      current.push(obj);
      localStorage.setItem(key, JSON.stringify(current));

      console.info('Formulário salvo em localStorage:', obj);
      showToast('Cadastro enviado com sucesso! Obrigada pelo apoio 💖', 'success');

      form.reset();
      // if you want, keep nav closed on mobile
      const navList = $('#nav-list');
      const toggle = $('#nav-toggle');
      if (navList) navList.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
  }

  /* ---------- SIMPLE SPA ROUTER ---------- */
  async function loadPage(href, replaceState = false) {
    try {
      const url = href.split('/').pop() || 'index.html';
      const resp = await fetch(url, { cache: 'no-store' });
      if (!resp.ok) {
        throw new Error('Erro ao carregar página');
      }
      const text = await resp.text();
      // extrair apenas o <main> da resposta
      const tmp = document.createElement('div');
      tmp.innerHTML = text;
      const newMain = tmp.querySelector('main');
      if (newMain) {
        const currentMain = document.querySelector('main');
        currentMain.replaceWith(newMain);
        // re-attach features for newly loaded content:
        attachMasks();
        handleFormSubmission();
        initNavToggle(); // safe to call multiple times
      }
      if (!replaceState) {
        history.pushState({ page: url }, '', url);
      }
      // focus main for accessibility
      document.querySelector('main').setAttribute('tabindex', '-1');
      document.querySelector('main').focus();
    } catch (err) {
      console.error(err);
      showToast('Não foi possível carregar a página. Tente recarregar.', 'error');
    }
  }

  function initSPA() {
    // intercept nav links
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href) return;
      // only intercept internal links (same origin and html files)
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;
      e.preventDefault();
      loadPage(href);
    });

    // handle back/forward
    window.addEventListener('popstate', (e) => {
      const page = (e.state && e.state.page) ? e.state.page : 'index.html';
      loadPage(page, true);
    });
  }

  /* ---------- INIT ON LOAD ---------- */
  function init() {
    initNavToggle();
    attachMasks();
    handleFormSubmission();
    initSPA();
    console.info('Miaudote JS inicializado — Entrega III');
  }

  // run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
