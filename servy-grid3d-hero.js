(function () {
  var hero = document.getElementById('hero-vanta') || document.querySelector('.hero');
  if (!hero || hero.querySelector('.servy-grid3d-bg')) return;

  var bg = document.createElement('div');
  bg.className = 'servy-grid3d-bg';
  bg.setAttribute('aria-hidden', 'true');
  bg.innerHTML = [
    '<div class="servy-grid3d-aura"></div>',
    '<div class="servy-grid3d-scene">',
      '<div class="servy-grid3d-wrap">',
        '<div class="servy-grid3d-plane"></div>',
        '<div class="servy-grid3d-beam"></div>',
      '</div>',
    '</div>',
    '<div class="servy-grid3d-scan"></div>',
    '<div class="servy-grid3d-scrim"></div>'
  ].join('');
  hero.insertBefore(bg, hero.firstChild);

  var wrap = bg.querySelector('.servy-grid3d-wrap');
  var plane = bg.querySelector('.servy-grid3d-plane');
  var hotTiles = [12, 19, 29, 38, 47, 55, 66];
  var warmTiles = [7, 24, 40, 63];
  var routeTiles = [31, 32, 33, 42, 51];
  var pointer = { x: 0.5, y: 0.36, tx: 0.5, ty: 0.36 };
  var raf = null;

  for (var i = 0; i < 81; i += 1) {
    var tile = document.createElement('span');
    tile.className = 'servy-grid3d-tile';
    if (hotTiles.indexOf(i) > -1) tile.className += ' is-hot';
    if (warmTiles.indexOf(i) > -1) tile.className += ' is-warm';
    if (routeTiles.indexOf(i) > -1) tile.className += ' is-route';
    tile.style.setProperty('--i', i);
    tile.style.setProperty('--z', (i % 7) * 3 + 'px');
    plane.appendChild(tile);
  }

  function setPointer(clientX, clientY) {
    var rect = hero.getBoundingClientRect();
    pointer.tx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    pointer.ty = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
  }

  function updateGrid() {
    pointer.x += (pointer.tx - pointer.x) * 0.08;
    pointer.y += (pointer.ty - pointer.y) * 0.08;

    var rotateX = (pointer.y - 0.5) * -11;
    var rotateY = (pointer.x - 0.5) * 12;
    var lift = Math.max(-8, Math.min(18, (0.42 - pointer.y) * 42));

    wrap.style.transform = 'rotateX(' + (62 + rotateX) + 'deg) rotateZ(' + (-34 + rotateY) + 'deg) translateY(' + (18 + lift) + 'px)';
    raf = requestAnimationFrame(updateGrid);
  }

  hero.addEventListener('pointermove', function (event) {
    setPointer(event.clientX, event.clientY);
  }, { passive: true });

  hero.addEventListener('pointerdown', function (event) {
    setPointer(event.clientX, event.clientY);
  }, { passive: true });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && raf) {
      cancelAnimationFrame(raf);
      raf = null;
    } else if (!document.hidden && !raf) {
      raf = requestAnimationFrame(updateGrid);
    }
  });

  raf = requestAnimationFrame(updateGrid);
})();
