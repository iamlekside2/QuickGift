// ===== Mobile Menu Toggle =====
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const hamburger = document.getElementById('hamburger');

menuToggle.addEventListener('click', () => {
  const isOpen = !mobileMenu.classList.contains('hidden');
  mobileMenu.classList.toggle('hidden');
  hamburger.classList.toggle('active');
  menuToggle.setAttribute('aria-expanded', !isOpen);
});

document.querySelectorAll('.mobile-nav-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    hamburger.classList.remove('active');
  });
});

// ===== Navbar Scroll Effect =====
const navbar = document.getElementById('navbar');

function handleNavScroll() {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
}

window.addEventListener('scroll', handleNavScroll, { passive: true });
handleNavScroll();

// ===== Reveal on Scroll (IntersectionObserver) =====
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
);

revealElements.forEach((el) => revealObserver.observe(el));

// ===== Counter Animation =====
const counters = document.querySelectorAll('[data-count]');

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'), 10);
        animateCounter(el, target);
        counterObserver.unobserve(el);
      }
    });
  },
  { threshold: 0.3 }
);

counters.forEach((counter) => counterObserver.observe(counter));

function animateCounter(el, target) {
  const duration = 1800;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4); // ease-out quart
    const current = Math.round(eased * target);

    el.textContent = current.toLocaleString() + '+';

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// ===== Smooth Scroll for Anchor Links =====
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;

    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      e.preventDefault();
      const navHeight = navbar.offsetHeight;
      const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({ top: targetPosition, behavior: 'smooth' });

      // Close mobile menu if open
      mobileMenu.classList.add('hidden');
      hamburger.classList.remove('active');
    }
  });
});
