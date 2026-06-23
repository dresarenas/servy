(function () {
'use strict';
var S = window.SERVY = window.SERVY || {};

var _WC = 'https://n8n-n8n.8wg7if.easypanel.host/webhook/servy-clasificar';
var _WG = 'https://n8n-n8n.8wg7if.easypanel.host/webhook/servy-categorias';
var _FB = [
  'Plomero','Electricista','Gasista','Pintor','Albañil','Carpintero',
  'Jardinero','Cerrajero','Limpieza del hogar','Mudanzas',
  'Instalador de aire acondicionado','Herrero'
];

S.validatePhone = function (v) {
  var d = v.replace(/\D/g, '');
  return d.length >= 6 && d.length <= 15;
};

S.shareWA = function (msg) {
  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
};

S.clasificar = async function (texto) {
  var r = await fetch(_WC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto: texto })
  });
  return r.json();
};

S.getCategorias = async function () {
  var K = 'servy_cats_v1';
  try {
    var c = sessionStorage.getItem(K);
    if (c) return JSON.parse(c);
    var r = await fetch(_WG);
    var d = await r.json();
    var cats = Array.isArray(d)
      ? d.map(function (x) { return typeof x === 'string' ? x : x.nombre; })
      : _FB;
    sessionStorage.setItem(K, JSON.stringify(cats));
    return cats;
  } catch (e) { return _FB; }
};

S.renderChips = function (el, cats, opts) {
  opts = opts || {};
  el.innerHTML = '';
  var cc = opts.chipClass || 'chip';
  var sc = opts.selectedClass || 'sel';
  var multi = !!opts.multiSelect;
  var max = opts.maxVisible != null ? opts.maxVisible : 8;
  var onSel = opts.onSelect || function () {};
  var onOtro = opts.onOtro || function () {};

  function mk(lbl, val) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = cc;
    b.setAttribute('data-value', val);
    b.textContent = lbl;
    return b;
  }

  var vis = cats.slice(0, max);
  var hid = cats.slice(max);
  vis.forEach(function (c) { el.appendChild(mk(c, c)); });

  if (hid.length) {
    var mb = document.createElement('button');
    mb.type = 'button';
    mb.className = cc + ' chip-ver-mas';
    mb.textContent = 'Ver más →';
    el.appendChild(mb);
    mb.addEventListener('click', function () {
      mb.remove();
      var ot = el.querySelector('[data-value="otro"]');
      hid.forEach(function (c) {
        var b = mk(c, c);
        if (ot) el.insertBefore(b, ot); else el.appendChild(b);
      });
    });
  }

  if (opts.showOtro !== false) el.appendChild(mk('Otro...', 'otro'));

  el.addEventListener('click', function (e) {
    var b = e.target.closest('.' + cc);
    if (!b || b.classList.contains('chip-ver-mas')) return;
    var v = b.getAttribute('data-value');
    var otroPrevSel = !multi &&
      !!el.querySelector('[data-value="otro"].' + sc);
    if (!multi) el.querySelectorAll('.' + cc).forEach(function (x) { x.classList.remove(sc); });
    if (multi && opts.maxSel && !b.classList.contains(sc)) {
      var n = el.querySelectorAll('.' + cc + '.' + sc).length;
      if (n >= opts.maxSel) return;
    }
    b.classList.toggle(sc);
    if (v === 'otro') {
      onOtro(b.classList.contains(sc));
    } else {
      onSel(v, b.classList.contains(sc));
      if (otroPrevSel) onOtro(false);
    }
  });
};

S.getSelectedChips = function (el, cc, sc) {
  return Array.from(
    el.querySelectorAll('.' + (cc || 'chip') + '.' + (sc || 'sel'))
  ).map(function (b) { return b.getAttribute('data-value'); });
};
S.validarNombre = function(val) {
  val = (val || '').trim();
  if (val.length < 3) return false;
  if (val.length > 60) return false;
  if (!/[aeiouáéíóúü]/i.test(val)) return false;
  if (/[^aeiouáéíóúü\s\-']{5,}/i.test(val)) return false;
  if (/(.)\1{2,}/i.test(val)) return false;
  var words = val.split(/\s+/).filter(Boolean);
  if (words.length > 5) return false;
  if (words.some(function(w) { return w.length < 2 || !/[aeiouáéíóúü]/i.test(w); })) return false;
  // Stop words del español que nunca aparecen en nombres propios
  var SW = /\b(yo|me|te|se|nos|les|lo|la|le|él|ella|ellos|ellas|nosotros|vosotros|usted|ustedes|mi|tu|su|mis|tus|sus|un|una|unos|unas|este|esta|estos|estas|ese|esa|esos|esas|aquel|aquella|es|son|era|fue|ser|estar|hay|haber|tener|hacer|ir|ver|dar|poder|querer|saber|deber|poner|volver|venir|salir|decir|llamar|tomar|hola|gracias|bueno|bien|mal|muy|más|menos|tan|tanto|ya|si|sí|no|ni|porque|pero|aunque|sino|que|qué|cómo|como|dónde|donde|cuándo|cuando|cuál|cual|hoy|ayer|mañana|ahora|antes|después|aquí|ahí|allí|acá|allá|algo|nada|nadie|todo|nombre|dni|número|numero|poner|pongo|tomo|como|tengo|vivo|quiero|puedo|soy|sé)\b/i;
  if (SW.test(val)) return false;
  return true;
};
})();
