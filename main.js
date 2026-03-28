/* ═══════════════════════════════════════════════════
   GOLD NAILS SPA — main.js
═══════════════════════════════════════════════════ */

'use strict';

/* ── Navbar: glassmorphism on scroll ── */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ── Hamburger / Mobile Menu ── */
(function initMobileMenu() {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!hamburger || !mobileMenu) return;

  const toggle = (open) => {
    hamburger.classList.toggle('open', open);
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.contains('open');
    toggle(!isOpen);
  });

  // Close on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => toggle(false));
  });

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggle(false);
  });
})();

/* ── Scroll Reveal via IntersectionObserver ── */
(function initReveal() {
  const targets = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  targets.forEach(el => observer.observe(el));
})();

/* ── Parallax Backgrounds ── */
(function initParallax() {
  const bgs = document.querySelectorAll('.parallax-bg');
  if (!bgs.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const update = () => {
    bgs.forEach(bg => {
      const parent = bg.parentElement;
      const rect   = parent.getBoundingClientRect();
      const viewH  = window.innerHeight;

      // Only move when in viewport
      if (rect.bottom < 0 || rect.top > viewH) return;

      const progress = (viewH - rect.top) / (viewH + rect.height); // 0→1
      const shift    = (progress - 0.5) * 80; // ±40px
      bg.style.transform = `translateY(${shift}px)`;
    });
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
})();

/* ── Active Nav Link on scroll ── */
(function initActiveLink() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-links a:not(.nav-cta)');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => {
        const isActive = link.getAttribute('href') === `#${entry.target.id}`;
        link.style.color = isActive ? 'var(--cream)' : '';
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => observer.observe(s));
})();

/* ── Smooth Anchor Scroll ── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* ── Booking Form ── */
(function initForm() {
  const form  = document.querySelector('.booking-form');
  const toast = document.getElementById('toast');
  if (!form || !toast) return;

  // Floating label fix for date input (pre-filled by browser)
  const dateInput = document.getElementById('date');
  if (dateInput) {
    const checkDate = () => {
      if (dateInput.value) {
        dateInput.labels[0] && (dateInput.labels[0].style.top = '-0.7rem');
      }
    };
    dateInput.addEventListener('change', checkDate);
    checkDate();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic validation
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      if (!field.value.trim()) {
        valid = false;
        field.style.borderColor = '#c0392b';
        field.addEventListener('input', () => {
          field.style.borderColor = '';
        }, { once: true });
      }
    });

    if (!valid) return;

    // Simulate submission
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.querySelector('.btn-text').textContent;
    btn.disabled = true;
    btn.querySelector('.btn-text').textContent = 'Enviando...';

    setTimeout(() => {
      btn.disabled = false;
      btn.querySelector('.btn-text').textContent = originalText;
      form.reset();
      showToast();
    }, 1400);
  });

  function showToast() {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  }
})();

/* ── Update Footer Year ── */
(function updateYear() {
  const el = document.getElementById('current-year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ── Service card keyboard accessibility ── */
(function initServiceCards() {
  document.querySelectorAll('.service-card[tabindex="0"]').forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.querySelector('.btn')?.click();
      }
    });
  });
})();

/* ── Gallery: lazy load observer (extra perf) ── */
(function initLazyImages() {
  if (!('IntersectionObserver' in window)) return;

  const images = document.querySelectorAll('img[loading="lazy"]');
  const imgObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.6s ease';
        img.decode().then(() => {
          img.style.opacity = '1';
        }).catch(() => {
          img.style.opacity = '1';
        });
        imgObserver.unobserve(img);
      }
    });
  }, { rootMargin: '200px 0px' });

  images.forEach(img => imgObserver.observe(img));
})();
