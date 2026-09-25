/* ═══════════════════════════════════════════════════════════
   SERVICIOS SYNC — single source of truth: Servicios.json
   Loads Servicios.json and pushes precio/duracion into any
   element carrying data-servicio-key="<nombre exacto del JSON>".
   Must load BEFORE game.js / the cart script so prices are
   correct before a user can add anything to the cart.
   Note: requires the page to be served over http(s) — opening
   index.html/services.html directly as a file:// URL blocks
   fetch() in most browsers, so pages fall back to the static
   values already written in the HTML.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function formatCOP(n) {
    return '$' + Number(n).toLocaleString('es-CO');
  }

  function applyDuration(container, minutes) {
    if (!container) return;
    var svg = container.querySelector('svg');
    var node = svg ? svg.nextSibling : container.firstChild;
    while (node && node.nodeType !== Node.TEXT_NODE) node = node.nextSibling;
    if (node) node.data = node.data.replace(/\d+/, String(minutes));
  }

  function syncServiceAllCards(byNombre) {
    document.querySelectorAll('.service-all-card[data-servicio-key]').forEach(function (card) {
      var s = byNombre[card.dataset.servicioKey];
      if (!s) return;
      card.dataset.precio = String(s.precio);
      card.dataset.duracion = String(s.duracion);
      var priceEl = card.querySelector('.sac-price');
      if (priceEl) priceEl.innerHTML = '<span>desde</span>' + formatCOP(s.precio);
      applyDuration(card.querySelector('.sac-duration'), s.duracion);
    });
  }

  function syncServiceCards(byNombre) {
    document.querySelectorAll('.service-card[data-servicio-key]').forEach(function (card) {
      var s = byNombre[card.dataset.servicioKey];
      if (!s) return;
      var priceEl = card.querySelector('.service-price');
      if (priceEl) priceEl.innerHTML = '<span>desde</span> ' + formatCOP(s.precio);
    });
  }

  /* Order matches the itemListElement order in the ld+json block in index.html */
  var OFFER_CATALOG_ORDER = [
    'Manos Tradicionales',
    'Manos Semipermanente - Mujeres',
    'Pies semipermanente - Mujeres',
    'Acrílicas esculpidas con molde',
    'Soft gel - Press On'
  ];

  function syncOfferSchema(byNombre) {
    var script = document.getElementById('ldJsonOffers');
    if (!script) return;
    try {
      var data = JSON.parse(script.textContent);
      var offers = data.hasOfferCatalog && data.hasOfferCatalog.itemListElement;
      if (!offers) return;
      offers.forEach(function (offer, i) {
        var s = byNombre[OFFER_CATALOG_ORDER[i]];
        if (s && offer.itemOffered && offer.itemOffered.offers) {
          offer.itemOffered.offers.price = String(s.precio);
        }
      });
      script.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      /* leave schema untouched if it can't be parsed */
    }
  }

  function apply(servicios) {
    var byNombre = {};
    servicios.forEach(function (s) { byNombre[s.nombre] = s; });
    syncServiceAllCards(byNombre);
    syncServiceCards(byNombre);
    syncOfferSchema(byNombre);
  }

  function init() {
    fetch('Servicios.json')
      .then(function (res) {
        if (!res.ok) throw new Error('No se pudo cargar Servicios.json');
        return res.json();
      })
      .then(function (data) { apply(data[0].servicios); })
      .catch(function (err) {
        console.warn('[services-sync] usando precios estáticos del HTML:', err.message);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
