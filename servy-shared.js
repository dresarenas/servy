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
  // Palabras que nunca son nombres: artículos, pronombres, preposiciones, abreviaturas
  var SW = /^(el|la|las|los|un|una|unos|unas|yo|me|te|se|nos|les|lo|le|él|ella|ellos|ellas|mi|tu|su|de|del|al|por|para|con|sin|que|qué|y|o|ni|pero|sino|cel|celu|tel|num|url|app|web|cbu|cvu|iva|dni|pus|ano|ley|gas|luz|sal|pan|río|día|mes|vía|pie|fin|rol|van|bus|dos|vos|ros|sos|gel|mar|sol|rey|red|hoy|sí|no|ya|acá|ahí|allá)$/i;
  if (words.length === 1 && SW.test(words[0])) return false;
  return true;
};

// Validación autoritativa con IA (gpt-4o-mini vía n8n). Falla ABIERTO ante error de red.
S.WEBHOOK_VALIDAR = 'https://n8n-n8n.8wg7if.easypanel.host/webhook/servy-validar-nombre';
S.validarNombreIA = async function(nombre) {
  try {
    var r = await fetch(S.WEBHOOK_VALIDAR, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombre })
    });
    if (!r.ok) return { valido: true, confianza: 0, motivo: 'fail_open' };
    return await r.json();
  } catch (e) { return { valido: true, confianza: 0, motivo: 'fail_open' }; }
};
// Rechaza solo si la IA dice inválido con confianza suficiente (>=0.6)
S.nombreRechazadoIA = function(res) {
  return !!(res && res.valido === false && (res.confianza == null || res.confianza >= 0.5));
};

// ===== ¿Es un DNI? (11/10/2026, pedido de Andrés) =====
// El panel dejaba subir CUALQUIER imagen como "DNI". El DNI argentino tiene un
// formato muy predecible, así que el propio celu intenta leer la foto (OCR con
// Tesseract.js, que se baja recién cuando hace falta) y busca las palabras fijas
// del frente. La imagen no sale a ningún servicio de terceros. Es una ayuda para
// quien revisa, no una verificación de identidad: si la lectura falla, la
// persona puede subirla igual y queda marcada.
S.CLAVES_DNI = [
  'REPUBLICA', 'ARGENTINA', 'DOCUMENTO', 'NACIONAL', 'IDENTIDAD', 'APELLIDO', 'NOMBRE',
  'SEXO', 'NACIONALIDAD', 'NACIMIENTO', 'EMISION', 'VENCIMIENTO', 'TRAMITE', 'EJEMPLAR',
  'SURNAME', 'NATIONALITY', 'DOMICILIO'
];

// Igual, o con una letra de diferencia (el OCR se equivoca de a una) -- solo en palabras largas.
function _dniCerca(a, b) {
  if (a === b) return true;
  if (b.length < 6 || Math.abs(a.length - b.length) > 1) return false;
  var i = 0;
  while (i < a.length && i < b.length && a.charAt(i) === b.charAt(i)) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  if (a.length > b.length) return a.slice(i + 1) === b.slice(i);
  return a.slice(i) === b.slice(i + 1);
}

// Pura (sin cámara ni red): recibe el texto que leyó el OCR y dice qué es.
//   ok      = frente de un DNI: 4 palabras propias del documento (o 3 + un número de documento) y
//             por lo menos una del título ("República", "Nacional", "Identidad"). Sin esa condición una
//             receta con "Apellido, Nombre, Documento, Sexo" pasaba por DNI.
//   dorso   = la parte de atrás (la línea de lectura automática, "IDARG…<<<")
//   no_dni  = otra cosa
S.evaluarTextoDni = function (texto) {
  var t = String(texto || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  var palabras = t.split(/[^A-Z0-9<]+/).filter(Boolean);
  var aciertos = S.CLAVES_DNI.filter(function (k) {
    return palabras.some(function (w) { return _dniCerca(w, k); });
  });
  var hayNumero = /(^|[^0-9])\d{1,2}[.\s]?\d{3}[.\s]?\d{3}([^0-9]|$)/.test(t);
  var compacto = t.replace(/\s+/g, '');
  var hayMRZ = /IDARG/.test(compacto) || (compacto.match(/</g) || []).length >= 12;
  var titulo = aciertos.filter(function (k) { return k === 'REPUBLICA' || k === 'NACIONAL' || k === 'IDENTIDAD'; }).length;
  if (titulo >= 1 && (aciertos.length >= 4 || (aciertos.length >= 3 && hayNumero))) return { estado: 'ok', aciertos: aciertos.length };
  if (hayMRZ) return { estado: 'dorso', aciertos: aciertos.length };
  return { estado: 'no_dni', aciertos: aciertos.length };
};

function _cargarTesseract() {
  return new Promise(function (res, rej) {
    if (window.Tesseract) return res(window.Tesseract);
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js';
    s.onload = function () { res(window.Tesseract); };
    s.onerror = function () { rej(new Error('no se pudo cargar el lector')); };
    document.head.appendChild(s);
  });
}

// Imagen en gris y con el contraste estirado, a un tamaño donde el OCR rinde; gira si hace falta.
function _dniPreparar(img, giros) {
  var maxLado = 1600;
  var sc = Math.min(1, maxLado / Math.max(img.width, img.height));
  var w = Math.round(img.width * sc), h = Math.round(img.height * sc);
  var cv = document.createElement('canvas');
  var giro = giros % 2 === 1;
  cv.width = giro ? h : w; cv.height = giro ? w : h;
  var cx = cv.getContext('2d');
  cx.translate(cv.width / 2, cv.height / 2);
  cx.rotate(giros * Math.PI / 2);
  cx.drawImage(img, -w / 2, -h / 2, w, h);
  cx.setTransform(1, 0, 0, 1, 0, 0);
  var d = cx.getImageData(0, 0, cv.width, cv.height), px = d.data, min = 255, max = 0, i, y;
  for (i = 0; i < px.length; i += 4) {
    y = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    px[i] = y; if (y < min) min = y; if (y > max) max = y;
  }
  var rango = Math.max(1, max - min);
  for (i = 0; i < px.length; i += 4) {
    y = Math.max(0, Math.min(255, (px[i] - min) * 255 / rango));
    px[i] = px[i + 1] = px[i + 2] = y;
  }
  cx.putImageData(d, 0, 0);
  return cv;
}

function _dniImagen(file) {
  return new Promise(function (res, rej) {
    var img = new Image();
    img.onload = function () { URL.revokeObjectURL(img.src); res(img); };
    img.onerror = function () { rej(new Error('imagen ilegible')); };
    img.src = URL.createObjectURL(file);
  });
}

// Devuelve {estado: 'ok' | 'dorso' | 'no_dni' | 'sin_ocr'}. 'sin_ocr' = no se pudo leer (sin red a la
// librería, tiempo agotado): no se bloquea a nadie por una falla nuestra.
S.verificarDni = async function (file, onProgreso) {
  // El aviso trae la fase ('lector' | 'descarga' | 'inicio' | 'lectura') y un avance de 0 a 1 dentro de
  // esa fase, para que la pantalla le diga a la persona qué está pasando (la primera vez se baja el lector).
  var avisar = function (fase, p) { if (onProgreso) { try { onProgreso({ fase: fase, progreso: p || 0 }); } catch (e) { /* la pantalla no frena la lectura */ } } };
  try {
    avisar('lector', 0);
    var T = await _cargarTesseract();
    var img = await _dniImagen(file);
    var limite = Date.now() + 70000;
    var resultado = null;
    // Una foto sacada de costado sale girada 90° (para un lado o para el otro): si de frente no se lee, se prueba girada.
    var intentos = img.height > img.width ? [0, 1, 3] : [0];
    for (var k = 0; k < intentos.length; k++) {
      var restante = limite - Date.now();
      if (restante < 5000) break;
      var lectura = await Promise.race([
        T.recognize(_dniPreparar(img, intentos[k]), 'spa', {
          // Modelo "fast" del idioma: 1 MB en vez de 8 (con el completo, la primera vez eran ~10 MB de datos
          // móviles para leer una foto). Para buscar palabras fijas alcanza.
          langPath: 'https://tessdata.projectnaptha.com/4.0.0_fast',
          logger: function (m) {
            if (m.status === 'recognizing text') avisar('lectura', m.progress);
            else if (/loading/.test(m.status)) avisar('descarga', m.progress);
            else avisar('inicio', m.progress);
          }
        }),
        new Promise(function (_, rej) { setTimeout(function () { rej(new Error('tiempo agotado')); }, restante); })
      ]);
      resultado = S.evaluarTextoDni(lectura.data.text);
      if (resultado.estado === 'ok') break;
    }
    return resultado || { estado: 'sin_ocr' };
  } catch (e) {
    return { estado: 'sin_ocr', error: String((e && e.message) || e) };
  }
};
})();
