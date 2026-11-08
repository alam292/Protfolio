/**
 * Navigation Controller
 * Sticky navbar, accessible mobile drawer, scrollspy active indicators, and back-to-top button.
 */

class NavigationController {
  constructor() {
    this.navbar = document.getElementById('navbar');
    this.mobileToggle = document.getElementById('mobileToggle');
    this.mobileDrawer = document.getElementById('mobileDrawer');
    this.drawerBackdrop = document.getElementById('mobileDrawerBackdrop');
    this.drawerCloseBtn = document.getElementById('drawerCloseBtn');
    this.desktopLinks = document.querySelectorAll('.nav-link');
    this.mobileLinks = document.querySelectorAll('.mobile-nav-link');
    this.sections = document.querySelectorAll('section[id]');
    this.backToTopBtn = document.getElementById('backToTop');

    this.init();
  }

  init() {
    this.bindScrollEvents();
    this.bindMobileDrawer();
    this.bindBackToTop();
    this.updateActiveNav();
  }

  bindScrollEvents() {
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.handleScroll();
          this.updateActiveNav();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  handleScroll() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

    // Navbar background blur switch
    if (this.navbar) {
      if (scrollY > 40) {
        this.navbar.classList.add('scrolled');
      } else {
        this.navbar.classList.remove('scrolled');
      }
    }

    // Back to top button visibility
    if (this.backToTopBtn) {
      if (scrollY > 500) {
        this.backToTopBtn.classList.add('visible');
      } else {
        this.backToTopBtn.classList.remove('visible');
      }
    }
  }

  bindMobileDrawer() {
    if (!this.mobileToggle || !this.mobileDrawer) return;

    const toggleDrawer = (forceClose = false) => {
      const isOpen = forceClose ? false : !this.mobileDrawer.classList.contains('open');

      this.mobileToggle.classList.toggle('active', isOpen);
      this.mobileDrawer.classList.toggle('open', isOpen);
      if (this.drawerBackdrop) {
        this.drawerBackdrop.classList.toggle('open', isOpen);
      }
      this.mobileToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';

      if (isOpen) {
        const firstLink = this.mobileDrawer.querySelector('a');
        if (firstLink) firstLink.focus();
      } else {
        // Return focus to toggle button for WCAG accessibility
        if (document.activeElement && this.mobileDrawer.contains(document.activeElement)) {
          this.mobileToggle.focus();
        }
      }
    };

    this.mobileToggle.addEventListener('click', () => toggleDrawer());

    // Close on close button click
    if (this.drawerCloseBtn) {
      this.drawerCloseBtn.addEventListener('click', () => toggleDrawer(true));
    }

    // Close on backdrop overlay click
    if (this.drawerBackdrop) {
      this.drawerBackdrop.addEventListener('click', () => toggleDrawer(true));
    }

    // Close on link click
    this.mobileLinks.forEach((link) => {
      link.addEventListener('click', () => toggleDrawer(true));
    });

    // Keyboard accessibility: Escape to close and Tab focus trap
    document.addEventListener('keydown', (e) => {
      if (!this.mobileDrawer.classList.contains('open')) return;

      if (e.key === 'Escape') {
        toggleDrawer(true);
        this.mobileToggle.focus();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = this.mobileDrawer.querySelectorAll('a[href], button:not([disabled])');
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !this.mobileDrawer.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    });

    // Touch gesture: Swipe left to close drawer
    let touchStartX = 0;
    let touchStartY = 0;
    this.mobileDrawer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    this.mobileDrawer.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const diffX = touchStartX - touchEndX;
      const diffY = Math.abs(touchStartY - touchEndY);

      // If swiped left by > 50px and not a vertical scroll
      if (diffX > 50 && diffY < 60) {
        toggleDrawer(true);
      }
    }, { passive: true });

    // Close on backdrop click (fallback)
    this.mobileDrawer.addEventListener('click', (e) => {
      if (e.target === this.mobileDrawer) {
        toggleDrawer(true);
      }
    });
  }

  updateActiveNav() {
    const scrollPos = window.pageYOffset + 220;

    this.sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        this.desktopLinks.forEach((link) => {
          const href = link.getAttribute('href');
          if (href === `#${id}`) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
          } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
          }
        });

        this.mobileLinks.forEach((link) => {
          const href = link.getAttribute('href');
          if (href === `#${id}`) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
          } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
          }
        });
      }
    });
  }

  bindBackToTop() {
    if (!this.backToTopBtn) return;

    this.backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}

window.NavigationController = NavigationController;

