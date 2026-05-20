/* ============================================
   SERVY — Home v2 — Interactions
   Cursor · Smooth scroll · Reveals · Rotator
   ============================================ */

(function() {
  'use strict';

  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============ CURSOR ============ */
  if (!isCoarse) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let dx = mx, dy = my;
    let rx = mx, ry = my;
    let ready = false;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!ready) {
        ready = true;
        document.body.classList.add('cursor-ready');
      }
    });

    function raf() {
      // dot follows almost instantly
      dx += (mx - dx) * 0.92;
      dy += (my - dy) * 0.92;
      // ring follows with a small, lively lag
      rx += (mx - rx) * 0.32;
      ry += (my - ry) * 0.32;
      if (dot) dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      if (ring) ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Hover states
    const hoverables = 'a, button, .search-shell, .tweak-opt, [data-cursor]';
    document.querySelectorAll(hoverables).forEach(el => {
      el.addEventListener('mouseenter', () => {
        const mode = el.getAttribute('data-cursor');
        document.body.classList.add('cursor-hover');
        if (mode === 'view') document.body.classList.add('cursor-view');
      });
      el.addEventListener('mouseleave', () => {
        document.body.classList.remove('cursor-hover');
        document.body.classList.remove('cursor-view');
      });
    });

    // Magnetic hover on pills + nav links + search submit
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * 0.2}px, ${y * 0.25}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ============ LOADER ============ */
  window.addEventListener('load', () => {
    setTimeout(() => {
      const loader = document.querySelector('.loader');
      if (loader) loader.classList.add('gone');
      document.body.classList.add('loaded');
    }, 600);
  });

  /* ============ SCROLL REVEALS ============ */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const isFuWrap = entry.target.classList.contains('fu-wrap');
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          if (!isFuWrap) io.unobserve(entry.target);
        } else if (isFuWrap) {
          entry.target.classList.remove('in');
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.reveal, .reveal-mask').forEach(el => io.observe(el));
  }


  /* ============ HERO VARIANT / ROTATOR ============ */
  const rotator = document.querySelector('[data-rotator]');
  if (rotator) {
    const words = (rotator.getAttribute('data-words') || '').split('|');
    let i = 0;
    const slot = rotator.querySelector('.rot-slot');
    function tick() {
      if (!slot) return;
      // Only target the visible (non-animating-out) word to avoid stacking on rapid calls
      const prev = slot.querySelector('.rot-word:not(.out)');
      // Safety: purge any extra visible words accumulated by throttled timers
      slot.querySelectorAll('.rot-word:not(.out)').forEach((el, idx) => { if (idx > 0) el.remove(); });
      const next = document.createElement('span');
      next.className = 'rot-word';
      next.textContent = words[i % words.length];
      next.style.transform = 'translateY(105%)';
      next.style.transition = 'transform 0.7s cubic-bezier(0.22,1,0.36,1)';
      slot.appendChild(next);
      requestAnimationFrame(() => { next.style.transform = 'translateY(0)'; });
      if (prev) {
        prev.classList.add('out');
        prev.style.transition = 'transform 0.7s cubic-bezier(0.22,1,0.36,1), opacity 0.5s';
        prev.style.transform = 'translateY(-105%)';
        setTimeout(() => prev.remove(), 750);
      }
      i++;
    }
    function resetRotator() {
      clearInterval(rotatorTimer);
      if (slot) slot.innerHTML = '';
      i = 0;
      tick();
      rotatorTimer = setInterval(tick, 2400);
    }
    if (slot) slot.innerHTML = '';
    tick();
    let rotatorTimer = setInterval(tick, 2400);

    // bfcache: reiniciar al volver con back/forward
    window.addEventListener('pagehide', () => clearInterval(rotatorTimer));
    window.addEventListener('pageshow', (e) => { if (e.persisted) resetRotator(); });
    // tab switch: cuando el browser throttlea los timers y acumula ticks
    document.addEventListener('visibilitychange', () => { if (!document.hidden) resetRotator(); });
  }

  /* ============ FLOATING SEARCH ============ */
  const floatEl = document.getElementById('search-float');
  const heroEl  = document.querySelector('.hero');
  if (floatEl && heroEl && 'IntersectionObserver' in window) {
    const heroObs = new IntersectionObserver((entries) => {
      const hidden = !entries[0].isIntersecting;
      floatEl.classList.toggle('visible', hidden);
      floatEl.setAttribute('aria-hidden', hidden ? 'false' : 'true');
    }, { threshold: 0 });
    heroObs.observe(heroEl);
  }

  /* ============ SEARCH SUBMIT ============ */
  const searchForm = document.querySelector('form.search') || document.querySelector('.search-shell');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = searchForm.querySelector('.search-input');
      const q = (input?.value || '').trim();
      window.location.href = q ? 'buscar.html?q=' + encodeURIComponent(q) : 'buscar.html';
    });
  }

  /* ============ NAV HAMBURGUESA ============ */
  const burger = document.getElementById('navBurger');
  const navLinks = document.querySelector('.nav-links');
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    navLinks.querySelectorAll('.nav-link').forEach(a =>
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ============ NAV ACTIVE PAGE ============ */
  (function() {
    var file = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link[href]').forEach(function(a) {
      var hfile = (a.getAttribute('href') || '').replace(/^\.\//, '').split('/').pop() || 'index.html';
      if (hfile === file) a.classList.add('active');
    });
  })();

  // Click on a search tag fills the input
  document.querySelectorAll('[data-tag]').forEach(tag => {
    tag.addEventListener('click', (e) => {
      e.preventDefault();
      const input = document.querySelector('.search-input');
      if (input) {
        input.value = tag.getAttribute('data-tag');
        input.focus();
      }
    });
  });

  /* ============ TWEAKS PANEL ============ */
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "palette": "midnight",
    "heroVariant": "rotator"
  }/*EDITMODE-END*/;

  let tweaks = { ...TWEAK_DEFAULTS };
  try {
    const saved = JSON.parse(localStorage.getItem('servy-v2-tweaks') || '{}');
    tweaks = { ...tweaks, ...saved };
  } catch(e) {}

  function applyTweaks() {
    document.documentElement.setAttribute('data-palette', tweaks.palette);
    document.body.setAttribute('data-hero-variant', tweaks.heroVariant);

    // update active states (tweaks panel)
    document.querySelectorAll('.tweak-opt').forEach(opt => {
      const group = opt.getAttribute('data-group');
      const val = opt.getAttribute('data-value');
      opt.classList.toggle('active', tweaks[group] === val);
    });
    // update active states (nav palette switcher)
    document.querySelectorAll('.palette-switcher button').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-p') === tweaks.palette);
    });

    // hero variant swap
    const v1 = document.querySelector('[data-variant="rotator"]');
    const v2 = document.querySelector('[data-variant="editorial"]');
    const v3 = document.querySelector('[data-variant="minimal"]');
    [v1, v2, v3].forEach(el => el && (el.style.display = 'none'));
    const active = document.querySelector(`[data-variant="${tweaks.heroVariant}"]`);
    if (active) active.style.display = '';

    try { localStorage.setItem('servy-v2-tweaks', JSON.stringify(tweaks)); } catch(e) {}

    // Persist via parent host (Make tweakable protocol)
    try {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: tweaks }, '*');
    } catch(e) {}
  }

  document.querySelectorAll('.tweak-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      const group = opt.getAttribute('data-group');
      const val = opt.getAttribute('data-value');
      tweaks[group] = val;
      applyTweaks();
    });
  });

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      tweaks.palette = tweaks.palette === 'bone' ? 'midnight' : 'bone';
      applyTweaks();
    });
  }

  applyTweaks();

  // Edit-mode protocol
  window.addEventListener('message', (e) => {
    const data = e.data || {};
    if (data.type === '__activate_edit_mode') {
      document.querySelector('.tweaks')?.classList.add('open');
    } else if (data.type === '__deactivate_edit_mode') {
      document.querySelector('.tweaks')?.classList.remove('open');
    }
  });
  try {
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
  } catch(e) {}

})();

/* ===== BOTTOM NAV ===== */
(function() {
  var ITEMS = [
    { href: 'index.html',      label: 'Inicio',     icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
    { href: 'buscar.html',     label: 'Buscar',     icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' },
    { href: 'recomendar.html', label: 'Recomendar', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' },
    { href: 'prestador.html',  label: 'Prestador',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
  ];
  var current = location.pathname.split('/').pop() || 'index.html';
  var nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'Navegación principal');
  var loginIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  nav.innerHTML = ITEMS.map(function(p) {
    var isActive = current === p.href || (current === '' && p.href === 'index.html');
    return '<a href="' + p.href + '" class="bottom-nav-item' + (isActive ? ' active' : '') + '" aria-current="' + (isActive ? 'page' : 'false') + '">'
         + p.icon + '<span>' + p.label + '</span></a>';
  }).join('') + '<a href="#" class="bottom-nav-item bottom-nav-login" onclick="servyOpenLogin(event)">' + loginIcon + '<span>Ingresar</span></a>';
  document.body.appendChild(nav);
})();

/* ============ LOGIN MODAL ============ */
(function () {
  var overlay = document.createElement('div');
  overlay.className = 'servy-login-overlay';
  overlay.id = 'servyLoginOverlay';
  overlay.innerHTML = [
    '<div class="servy-login-box">',
    '  <button class="servy-login-close" onclick="servyCloseLogin()">✕</button>',
    '  <div class="servy-login-logo">SERVY</div>',
    '  <div class="servy-login-sub">Accedé a tu panel de prestador</div>',
    '  <div class="servy-login-demo-badge">',
    '    ◈ Modo demo — credenciales precargadas',
    '  </div>',
    '  <input class="servy-login-field" id="servyLoginEmail" type="email" value="demo@servy.ar" placeholder="Email">',
    '  <input class="servy-login-field" id="servyLoginPass" type="password" value="demo123" placeholder="Contraseña">',
    '  <button class="servy-login-btn" onclick="servyDoLogin()">Ingresar al panel →</button>',
    '  <button class="servy-login-free" onclick="servyDoLogin()">Continuar sin cuenta</button>',
    '</div>'
  ].join('');
  overlay.addEventListener('click', function (e) { if (e.target === overlay) servyCloseLogin(); });
  document.body.appendChild(overlay);
})();

window.servyOpenLogin = function (e) {
  if (e) e.preventDefault();
  document.getElementById('servyLoginOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
};
window.servyCloseLogin = function () {
  document.getElementById('servyLoginOverlay').classList.remove('open');
  document.body.style.overflow = '';
};
window.servyDoLogin = function () {
  window.location.href = 'servy-demo-panel.html';
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
