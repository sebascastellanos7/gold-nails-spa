/* ═══════════════════════════════════════════════════
   GOLD NAILS SPA — game.js
   Juega y Gana · Memory Match + Voucher System
   Vanilla JS IIFE, no dependencies
═══════════════════════════════════════════════════ */
'use strict';

(function GNSGame() {

  /* ─────────────────────────────────────────────
     CONSTANTS
  ───────────────────────────────────────────── */
  var VOUCHER_KEY      = 'gns_voucher_expiry';
  var VOUCHER_AMOUNT   = 5000;
  var VOUCHER_DURATION = 15 * 60 * 1000;   // 15 min ms
  var TIMER_SECONDS    = 20;
  var SYMBOLS          = ['💅','💅','🌸','🌸','✨','✨','🧴','🧴','❤️','❤️'];
  var URGENT_THRESHOLD = 5 * 60 * 1000;    // 5 min ms → FOMO
  var URGENT_GAME_SEC  = 5;                // game timer turns red
  var TICK_START_SEC   = 10;               // ticking sound starts at 10s remaining

  /* ─────────────────────────────────────────────
     VOUCHER STORAGE
  ───────────────────────────────────────────── */
  function getVoucherExpiry() {
    var v = localStorage.getItem(VOUCHER_KEY);
    return v ? parseInt(v, 10) : 0;
  }
  function isVoucherValid() {
    var expiry = getVoucherExpiry();
    if (!expiry || Date.now() > expiry) {
      if (expiry) localStorage.removeItem(VOUCHER_KEY);
      return false;
    }
    return true;
  }
  function setVoucher() {
    localStorage.setItem(VOUCHER_KEY, String(Date.now() + VOUCHER_DURATION));
    startGlobalCountdown();
  }
  function clearVoucher() {
    localStorage.removeItem(VOUCHER_KEY);
    clearInterval(state.countdownId);
    state.countdownId = null;
    // Let the cart re-render if present
    document.dispatchEvent(new CustomEvent('gns:voucher-cleared'));
  }
  function getRemainingMs() {
    return Math.max(0, getVoucherExpiry() - Date.now());
  }
  function formatCountdown(ms) {
    var totalSec = Math.floor(ms / 1000);
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ─────────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────────── */
  window.GNSVoucher = {
    AMOUNT:          VOUCHER_AMOUNT,
    isValid:         isVoucherValid,
    set:             setVoucher,
    clear:           clearVoucher,
    getExpiry:       getVoucherExpiry,
    formatCountdown: formatCountdown
  };

  /* ─────────────────────────────────────────────
     STATE
  ───────────────────────────────────────────── */
  var state = {
    phase:       'idle',   // idle | intro | playing | won | lost
    flipped:     [],
    matched:     0,
    lockBoard:   false,
    timerSec:    TIMER_SECONDS,
    gameTimerId: null,
    countdownId: null
  };

  /* ─────────────────────────────────────────────
     DOM REFS (populated after injection)
  ───────────────────────────────────────────── */
  var el = {};

  /* ─────────────────────────────────────────────
     HTML INJECTION
  ───────────────────────────────────────────── */
  function buildHTML() {
    return [
      /* ── Game FAB ── */
      '<button class="gns-fab" id="gnsGameFab" aria-label="Juega y Gana — ¡gana un bono de descuento!" type="button">',
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
          '<path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6z"/>',
        '</svg>',
        '<span class="gns-fab-label" aria-hidden="true">Juega y Gana</span>',
        '<span class="gns-fab-tooltip">¡Juega y Gana!</span>',
      '</button>',

      /* ── Main Game Modal ── */
      '<div class="gns-modal" id="gnsModal" role="dialog" aria-modal="true" aria-labelledby="gnsModalTitle" hidden>',
        '<div class="gns-modal-backdrop" id="gnsModalBackdrop"></div>',
        '<div class="gns-modal-box">',

          /* Close */
          '<button class="gns-close" id="gnsClose" aria-label="Cerrar juego" type="button">',
            '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M1 1l14 14M15 1L1 15"/></svg>',
          '</button>',

          /* Screen 1: Intro */
          '<div class="gns-screen" id="gnsScreenIntro">',
            '<p class="gns-eyebrow">Gold Nails Spa</p>',
            '<h2 class="gns-title" id="gnsModalTitle">Juega y <em>Gana</em></h2>',
            '<div class="gns-intro-icons" aria-hidden="true">💅 🌸 ✨ 🧴 ❤️</div>',
            '<p class="gns-subtitle">Encuentra los 4 pares en <strong>20 segundos</strong><br>y obtén <strong>$5,000 COP de descuento</strong> en tu reserva.</p>',
            '<button class="gns-btn-primary" id="gnsBtnStart" type="button">Empezar a Jugar</button>',
          '</div>',

          /* Screen 2: Game */
          '<div class="gns-screen" id="gnsScreenGame" hidden>',
            '<div class="gns-game-header">',
              '<span class="gns-timer-label">Tiempo</span>',
              '<span class="gns-timer" id="gnsTimer">20</span>',
            '</div>',
            '<div class="gns-board" id="gnsBoard" role="group" aria-label="Tablero de memoria"></div>',
          '</div>',

          /* Screen 3: Win */
          '<div class="gns-screen gns-screen-win" id="gnsScreenWin" hidden>',
            '<canvas class="gns-confetti-canvas" id="gnsConfettiCanvas" aria-hidden="true"></canvas>',
            '<div class="gns-win-inner">',
              '<div class="gns-win-badge" aria-hidden="true">🏆</div>',
              '<p class="gns-eyebrow">¡Felicitaciones!</p>',
              '<h2 class="gns-title">¡Ganaste!</h2>',
              '<p class="gns-win-amount">− $5,000 COP</p>',
              '<p class="gns-subtitle">Tu bono es válido por <strong>15 minutos</strong>.<br>Úsalo al confirmar tu reserva.</p>',
              '<div class="gns-voucher-pill" id="gnsVoucherPill">',
                '<span class="gns-voucher-pill-label">Expira en</span>',
                '<span class="gns-voucher-time" id="gnsVoucherTimeWin">15:00</span>',
              '</div>',
              '<button class="gns-btn-primary" id="gnsBtnClaim" type="button">Reclamar Bono →</button>',
            '</div>',
          '</div>',

          /* Screen 4: Lose */
          '<div class="gns-screen" id="gnsScreenLose" hidden>',
            '<div class="gns-lose-icon" aria-hidden="true">⏱️</div>',
            '<h2 class="gns-title">¡Tiempo!</h2>',
            '<p class="gns-subtitle">No encontraste todos los pares.<br>¡Inténtalo de nuevo, puedes lograrlo!</p>',
            '<button class="gns-btn-primary" id="gnsBtnRetry" type="button">Intentar de Nuevo</button>',
          '</div>',

        '</div>',/* /gns-modal-box */
      '</div>',/* /gnsModal */

      /* ── Expired overlay ── */
      '<div class="gns-expired-overlay" id="gnsExpiredModal" role="alertdialog" aria-modal="true" aria-labelledby="gnsExpiredTitle" hidden>',
        '<div class="gns-expired-box">',
          '<div class="gns-expired-icon" aria-hidden="true">⌛</div>',
          '<h3 class="gns-title" id="gnsExpiredTitle">Bono Expirado</h3>',
          '<p class="gns-subtitle">Tu tiempo se agotó.<br>¡Juega de nuevo para ganar otro bono!</p>',
          '<button class="gns-btn-primary" id="gnsBtnExpiredRetry" type="button">Jugar de Nuevo</button>',
          '<button class="gns-btn-ghost" id="gnsBtnExpiredDismiss" type="button">Cerrar</button>',
        '</div>',
      '</div>'
    ].join('');
  }

  function injectHTML() {
    document.body.insertAdjacentHTML('beforeend', buildHTML());
  }

  function cacheDom() {
    el.fab           = document.getElementById('gnsGameFab');
    el.modal         = document.getElementById('gnsModal');
    el.backdrop      = document.getElementById('gnsModalBackdrop');
    el.close         = document.getElementById('gnsClose');
    el.screens = {
      intro: document.getElementById('gnsScreenIntro'),
      game:  document.getElementById('gnsScreenGame'),
      win:   document.getElementById('gnsScreenWin'),
      lose:  document.getElementById('gnsScreenLose')
    };
    el.board          = document.getElementById('gnsBoard');
    el.timer          = document.getElementById('gnsTimer');
    el.timerWin       = document.getElementById('gnsVoucherTimeWin');
    el.confettiCanvas = document.getElementById('gnsConfettiCanvas');
    el.expiredModal   = document.getElementById('gnsExpiredModal');

    // Position FAB via CSS class so media queries can override on mobile
    var hasCartFab = !!document.getElementById('cartFab');
    if (hasCartFab) el.fab.classList.add('gns-fab--above-cart');
  }

  /* ─────────────────────────────────────────────
     EVENTS
  ───────────────────────────────────────────── */
  function bindEvents() {
    el.fab.addEventListener('click', onFabClick);
    el.fab.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFabClick(); }
    });
    el.backdrop.addEventListener('click', closeModal);
    el.close.addEventListener('click', closeModal);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isModalOpen()) closeModal();
    });
    document.getElementById('gnsBtnStart').addEventListener('click', startGame);
    document.getElementById('gnsBtnRetry').addEventListener('click', startGame);
    document.getElementById('gnsBtnClaim').addEventListener('click', claimVoucher);
    document.getElementById('gnsBtnExpiredRetry').addEventListener('click', onExpiredRetry);
    document.getElementById('gnsBtnExpiredDismiss').addEventListener('click', dismissExpired);
    el.board.addEventListener('click', onCardClick);
  }

  /* ─────────────────────────────────────────────
     MODAL
  ───────────────────────────────────────────── */
  function isModalOpen() {
    return el.modal.classList.contains('gns-visible');
  }

  function onFabClick() {
    // If voucher already active, go straight to win screen showing countdown
    if (isVoucherValid()) {
      showScreen('win');
      updateWinCountdown();
    } else {
      showScreen('intro');
    }
    openModal();
  }

  function openModal() {
    if (isModalOpen()) return;
    el.modal.removeAttribute('hidden');
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        el.modal.classList.add('gns-visible');
      });
    });
    document.body.style.overflow = 'hidden';
    el.close.focus();
  }

  function closeModal() {
    if (!isModalOpen()) return;
    stopGameTimer();
    el.modal.classList.remove('gns-visible');
    el.modal.addEventListener('transitionend', function handler() {
      el.modal.removeEventListener('transitionend', handler);
      if (!isModalOpen()) {
        el.modal.setAttribute('hidden', '');
      }
    });
    document.body.style.overflow = '';
  }

  function showScreen(name) {
    Object.keys(el.screens).forEach(function(k) {
      el.screens[k].hidden = (k !== name);
    });
  }

  /* ─────────────────────────────────────────────
     AUDIO  (Web Audio API — no external files)
  ───────────────────────────────────────────── */
  var _audioCtx = null;

  function getAudioCtx() {
    if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return null;
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; }
    }
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
  }

  // Soft card-snap: filtered noise burst + short pitch sweep
  function playFlipSound() {
    var ctx = getAudioCtx(); if (!ctx) return;
    var now = ctx.currentTime;

    // Noise layer
    var buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.07), ctx.sampleRate);
    var d   = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.8);
    var ns  = ctx.createBufferSource();
    ns.buffer = buf;
    var bp  = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1.2;
    var ng  = ctx.createGain();
    ng.gain.setValueAtTime(0.22, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    ns.connect(bp); bp.connect(ng); ng.connect(ctx.destination);
    ns.start(now);

    // Pitch sweep layer
    var osc = ctx.createOscillator();
    var og  = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);
    og.gain.setValueAtTime(0.10, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(og); og.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.09);
  }

  // Two ascending chime notes on a match
  function playMatchSound() {
    var ctx = getAudioCtx(); if (!ctx) return;
    [523.25, 783.99].forEach(function(freq, i) {
      var osc = ctx.createOscillator();
      var g   = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      var t = ctx.currentTime + i * 0.13;
      g.gain.setValueAtTime(0.0, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.42);
    });
  }

  // Sharp metronome click — louder + higher when urgent
  function playTickSound(urgent) {
    var ctx = getAudioCtx(); if (!ctx) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var g   = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = urgent ? 1400 : 900;
    g.gain.setValueAtTime(urgent ? 0.20 : 0.09, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.055);
  }

  // Celebratory ascending arpeggio (C5-E5-G5-C6)
  function playWinSound() {
    var ctx = getAudioCtx(); if (!ctx) return;
    [523.25, 659.25, 783.99, 1046.50].forEach(function(freq, i) {
      var osc = ctx.createOscillator();
      var g   = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      var t = ctx.currentTime + i * 0.11;
      g.gain.setValueAtTime(0.0, t);
      g.gain.linearRampToValueAtTime(0.20, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.50);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.50);
    });
  }

  // Descending "wah-wah" on lose
  function playLoseSound() {
    var ctx = getAudioCtx(); if (!ctx) return;
    [392.00, 349.23, 311.13, 277.18].forEach(function(freq, i) {
      var osc = ctx.createOscillator();
      var g   = ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.value = freq;
      var t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.0, t);
      g.gain.linearRampToValueAtTime(0.15, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.30);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.30);
    });
  }

  /* ─────────────────────────────────────────────
     GAME LOGIC
  ───────────────────────────────────────────── */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function startGame() {
    stopGameTimer();
    state.flipped   = [];
    state.matched   = 0;
    state.lockBoard = false;
    state.timerSec  = TIMER_SECONDS;
    state.phase     = 'playing';
    buildBoard();
    updateTimerDisplay();
    showScreen('game');
    el.timer.classList.remove('gns-timer--urgent');
    state.gameTimerId = setInterval(tickGameTimer, 1000);
  }

  function buildBoard() {
    var symbols = shuffle(SYMBOLS);
    el.board.innerHTML = '';
    symbols.forEach(function(sym) {
      var btn = document.createElement('button');
      btn.className  = 'gns-card';
      btn.type       = 'button';
      btn.dataset.symbol = sym;
      btn.setAttribute('aria-label', 'Carta');
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML =
        '<span class="gns-card-face gns-card-back" aria-hidden="true">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35" aria-hidden="true">' +
            '<path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6z"/>' +
          '</svg>' +
        '</span>' +
        '<span class="gns-card-face gns-card-front" aria-hidden="true">' + sym + '</span>';
      el.board.appendChild(btn);
    });
  }

  function tickGameTimer() {
    state.timerSec--;
    updateTimerDisplay();
    if (state.timerSec <= TICK_START_SEC) {
      playTickSound(state.timerSec <= URGENT_GAME_SEC);
    }
    if (state.timerSec <= URGENT_GAME_SEC) {
      el.timer.classList.add('gns-timer--urgent');
    }
    if (state.timerSec <= 0) {
      stopGameTimer();
      triggerLose();
    }
  }

  function stopGameTimer() {
    clearInterval(state.gameTimerId);
    state.gameTimerId = null;
  }

  function updateTimerDisplay() {
    el.timer.textContent = state.timerSec;
  }

  function onCardClick(e) {
    if (state.lockBoard || state.phase !== 'playing') return;
    var card = e.target.closest('.gns-card');
    if (!card) return;
    if (card.classList.contains('gns-flipped') || card.classList.contains('gns-matched')) return;
    if (state.flipped.length >= 2) return;

    flipCard(card);
    state.flipped.push(card);

    if (state.flipped.length === 2) {
      state.lockBoard = true;
      checkMatch();
    }
  }

  function flipCard(card) {
    card.classList.add('gns-flipped');
    card.setAttribute('aria-pressed', 'true');
    playFlipSound();
  }

  function checkMatch() {
    var a = state.flipped[0];
    var b = state.flipped[1];
    if (a.dataset.symbol === b.dataset.symbol) {
      markMatched(a, b);
    } else {
      setTimeout(function() { unflipCards(a, b); }, 950);
    }
  }

  function markMatched(a, b) {
    a.classList.add('gns-matched');
    b.classList.add('gns-matched');
    state.matched++;
    state.flipped   = [];
    state.lockBoard = false;
    playMatchSound();
    if (state.matched === 5) triggerWin();
  }

  function unflipCards(a, b) {
    a.classList.remove('gns-flipped');
    b.classList.remove('gns-flipped');
    a.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-pressed', 'false');
    state.flipped   = [];
    state.lockBoard = false;
  }

  function triggerWin() {
    stopGameTimer();
    state.phase = 'won';
    playWinSound();
    setVoucher();
    // Update FAB visuals to indicate active voucher
    el.fab.classList.add('gns-fab--active');
    showScreen('win');
    launchConfetti();
  }

  function triggerLose() {
    state.phase     = 'lost';
    state.lockBoard = true;
    playLoseSound();
    showScreen('lose');
  }

  /* ─────────────────────────────────────────────
     VOUCHER CLAIM & COUNTDOWN
  ───────────────────────────────────────────── */
  function claimVoucher() {
    closeModal();
    // Small delay to let modal close transition finish
    setTimeout(function() {
      if (document.getElementById('cartTotals')) {
        // Already on services.html — trigger cart re-render
        document.dispatchEvent(new CustomEvent('gns:voucher-claimed'));
      } else {
        window.location.href = 'services.html';
      }
    }, 350);
  }

  function startGlobalCountdown() {
    clearInterval(state.countdownId);
    state.countdownId = setInterval(tickGlobalCountdown, 1000);
  }

  function tickGlobalCountdown() {
    var remaining = getRemainingMs();
    if (remaining <= 0) {
      clearInterval(state.countdownId);
      state.countdownId = null;
      localStorage.removeItem(VOUCHER_KEY);
      el.fab.classList.remove('gns-fab--active');
      // If modal is open on win screen, close it
      if (isModalOpen()) closeModal();
      showExpiredModal();
      document.dispatchEvent(new CustomEvent('gns:voucher-cleared'));
      return;
    }
    updateAllCountdownDisplays(remaining);
  }

  function updateAllCountdownDisplays(remainingMs) {
    var formatted = formatCountdown(remainingMs);
    var urgent    = remainingMs <= URGENT_THRESHOLD;

    // Win screen timer
    if (el.timerWin) {
      el.timerWin.textContent = formatted;
      el.timerWin.classList.toggle('gns-urgent', urgent);
    }

    // Cart panel countdown (services.html)
    var cartEl = document.getElementById('cartVoucherCountdown');
    if (cartEl) {
      cartEl.textContent = formatted;
      cartEl.classList.toggle('gns-urgent', urgent);
    }
  }

  function updateWinCountdown() {
    if (el.timerWin) {
      el.timerWin.textContent = formatCountdown(getRemainingMs());
    }
  }

  function showExpiredModal() {
    el.expiredModal.removeAttribute('hidden');
  }

  function dismissExpired() {
    el.expiredModal.setAttribute('hidden', '');
    document.dispatchEvent(new CustomEvent('gns:voucher-cleared'));
  }

  function onExpiredRetry() {
    el.expiredModal.setAttribute('hidden', '');
    showScreen('intro');
    openModal();
  }

  /* ─────────────────────────────────────────────
     CONFETTI
  ───────────────────────────────────────────── */
  function launchConfetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var canvas = el.confettiCanvas;
    var parent = canvas.parentElement;
    canvas.width  = parent.offsetWidth  || 400;
    canvas.height = parent.offsetHeight || 300;
    var ctx = canvas.getContext('2d');
    var colors = ['#D4AF37','#E8C84A','#FAF9F6','#FFB7C5','#ffffff','#C5A028'];
    var particles = [];
    var DURATION  = 3600;
    var startTime = Date.now();

    function Particle(x) {
      this.x     = x;
      this.y     = -10;
      this.w     = 4 + Math.random() * 6;
      this.h     = 8 + Math.random() * 10;
      this.vx    = (Math.random() - 0.5) * 4;
      this.vy    = 1.5 + Math.random() * 2.5;
      this.alpha = 1;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.rot   = Math.random() * Math.PI * 2;
      this.rotV  = (Math.random() - 0.5) * 0.2;
    }

    function burst() {
      var positions = [canvas.width * 0.2, canvas.width * 0.5, canvas.width * 0.8];
      positions.forEach(function(x) {
        for (var i = 0; i < 12; i++) particles.push(new Particle(x + (Math.random() - 0.5) * 40));
      });
    }

    burst();
    var burstId = setInterval(function() {
      if (Date.now() - startTime < DURATION - 400) burst();
    }, 400);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var elapsed = Date.now() - startTime;
      particles = particles.filter(function(p) { return p.alpha > 0.02; });
      particles.forEach(function(p) {
        p.x   += p.vx;
        p.y   += p.vy;
        p.vy  += 0.05; // gravity
        p.rot += p.rotV;
        if (elapsed > DURATION * 0.6) p.alpha -= 0.012;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (elapsed < DURATION || particles.length > 0) {
        requestAnimationFrame(draw);
      } else {
        clearInterval(burstId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(draw);
  }

  /* ─────────────────────────────────────────────
     PAGE-LOAD VOUCHER CHECK
  ───────────────────────────────────────────── */
  function checkVoucherOnLoad() {
    if (isVoucherValid()) {
      el.fab.classList.add('gns-fab--active');
      startGlobalCountdown();
      // Immediately update displays with current remaining time
      updateAllCountdownDisplays(getRemainingMs());
    }
  }

  /* ─────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────── */
  function init() {
    injectHTML();
    cacheDom();
    bindEvents();
    checkVoucherOnLoad();
  }

  // Boot after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
