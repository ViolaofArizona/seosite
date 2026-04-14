/* ============================================================
   Rise Up Benefits Group — JavaScript
   Mobile nav, carousel, scroll animations, form validation
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initScrollAnimations();
  initTestimonialCarousel();
  initCounterAnimations();
  initContactForm();
  initFloatingCTA();
  initSmoothScroll();
});

/* ---------- Sticky Navbar ---------- */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let lastScroll = 0;
  const threshold = 50;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > threshold) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });
}

/* ---------- Mobile Menu ---------- */
function initMobileMenu() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('mobile-overlay');
  const closeBtn = document.getElementById('mobile-menu-close');

  if (!toggle || !menu) return;

  function openMenu() {
    menu.classList.add('open');
    if (overlay) {
      overlay.style.display = 'block';
      requestAnimationFrame(() => overlay.classList.add('active'));
    }
    document.body.style.overflow = 'hidden';
    toggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    menu.classList.remove('open');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => { overlay.style.display = 'none'; }, 250);
    }
    document.body.style.overflow = '';
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (overlay) overlay.addEventListener('click', closeMenu);

  // Close on nav link click
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      closeMenu();
    }
  });
}

/* ---------- Scroll Reveal Animations ---------- */
function initScrollAnimations() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    reveals.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

/* ---------- Testimonial Carousel ---------- */
function initTestimonialCarousel() {
  const track = document.getElementById('carousel-track');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const dotsContainer = document.getElementById('carousel-dots');

  if (!track) return;

  const cards = track.querySelectorAll('.testimonial-card');
  let currentIndex = 0;
  let visibleCards = getVisibleCards();
  let totalSlides = Math.ceil(cards.length / visibleCards);
  let autoplayTimer;

  function getVisibleCards() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 2;
  }

  function updateDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('button');
      dot.className = `carousel-dot${i === currentIndex ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Go to testimonial group ${i + 1}`);
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    }
  }

  function goToSlide(index) {
    currentIndex = Math.max(0, Math.min(index, totalSlides - 1));
    const cardWidth = cards[0].offsetWidth + parseInt(getComputedStyle(track).gap);
    const offset = currentIndex * visibleCards * cardWidth;
    track.style.transform = `translateX(-${offset}px)`;
    updateDots();
    resetAutoplay();
  }

  function nextSlide() {
    goToSlide(currentIndex >= totalSlides - 1 ? 0 : currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex <= 0 ? totalSlides - 1 : currentIndex - 1);
  }

  function startAutoplay() {
    autoplayTimer = setInterval(nextSlide, 5000);
  }

  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }

  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);

  // Pause on hover
  track.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
  track.addEventListener('mouseleave', startAutoplay);

  // Recalculate on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      visibleCards = getVisibleCards();
      totalSlides = Math.ceil(cards.length / visibleCards);
      currentIndex = Math.min(currentIndex, totalSlides - 1);
      goToSlide(currentIndex);
    }, 200);
  });

  // Keyboard navigation
  track.parentElement.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'ArrowRight') nextSlide();
  });

  // Initialize
  updateDots();
  startAutoplay();
}

/* ---------- Counter Animations ---------- */
function initCounterAnimations() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';

        if (prefersReducedMotion) {
          el.textContent = prefix + target + suffix;
        } else {
          animateCounter(el, target, prefix, suffix);
        }
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

function animateCounter(el, target, prefix, suffix) {
  const duration = 2000;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = prefix + current + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* ---------- Contact Form ---------- */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Basic validation
    let isValid = true;
    const required = form.querySelectorAll('[required]');

    required.forEach(field => {
      const group = field.closest('.form-group');
      const existingError = group.querySelector('.form-error');
      if (existingError) existingError.remove();

      if (!field.value.trim()) {
        isValid = false;
        const error = document.createElement('span');
        error.className = 'form-error';
        error.textContent = 'This field is required';
        error.style.cssText = 'color: var(--color-destructive); font-size: 0.75rem; margin-top: 0.25rem; display: block;';
        group.appendChild(error);
        field.style.borderColor = 'var(--color-destructive)';
      } else {
        field.style.borderColor = '';
      }
    });

    // Email validation
    const emailField = form.querySelector('[type="email"]');
    if (emailField && emailField.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailField.value)) {
        isValid = false;
        const group = emailField.closest('.form-group');
        const existingError = group.querySelector('.form-error');
        if (existingError) existingError.remove();

        const error = document.createElement('span');
        error.className = 'form-error';
        error.textContent = 'Please enter a valid email address';
        error.style.cssText = 'color: var(--color-destructive); font-size: 0.75rem; margin-top: 0.25rem; display: block;';
        group.appendChild(error);
        emailField.style.borderColor = 'var(--color-destructive)';
      }
    }

    if (!isValid) {
      // Focus first invalid field
      const firstInvalid = form.querySelector('[required]:invalid, [style*="destructive"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Show success state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      Message Sent!
    `;
    submitBtn.style.background = 'var(--color-accent-dark)';
    submitBtn.disabled = true;

    // Construct mailto link as fallback
    const subject = encodeURIComponent(`Website Inquiry from ${data.name}`);
    const body = encodeURIComponent(
      `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone || 'N/A'}\nPreferred Contact: ${data.contact_method || 'N/A'}\n\nMessage:\n${data.message}`
    );
    window.location.href = `mailto:viola@riseupbenefitsgroup.com?subject=${subject}&body=${body}`;

    // Reset after delay
    setTimeout(() => {
      submitBtn.innerHTML = originalText;
      submitBtn.style.background = '';
      submitBtn.disabled = false;
      form.reset();
    }, 3000);
  });

  // Inline validation on blur
  form.querySelectorAll('[required]').forEach(field => {
    field.addEventListener('blur', () => {
      const group = field.closest('.form-group');
      const existingError = group.querySelector('.form-error');
      if (existingError) existingError.remove();
      field.style.borderColor = '';
    });
  });
}

/* ---------- Floating CTA ---------- */
function initFloatingCTA() {
  const cta = document.getElementById('floating-cta');
  if (!cta) return;

  const hero = document.querySelector('.hero');
  if (!hero) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        cta.classList.add('visible');
      } else {
        cta.classList.remove('visible');
      }
    });
  }, { threshold: 0 });

  observer.observe(hero);
}

/* ---------- Smooth Scroll ---------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}
