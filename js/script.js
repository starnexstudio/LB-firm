'use strict';

const $ = (selector, context = document) =>
  context.querySelector(selector);

const $$ = (selector, context = document) =>
  Array.from(context.querySelectorAll(selector));

function initNavbar() {
  const navbar = $('#navbar');
  const hamburger = $('#hamburger');
  const navLinks = $('#navLinks');

  if (!navbar) return;

  const links = navLinks ? $$('.nav-link', navLinks) : [];
  const sections = $$('section[id]');

  const closeMenu = () => {
    if (!hamburger || !navLinks) return;

    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    document.body.classList.remove('no-scroll');
    hamburger.setAttribute('aria-expanded', 'false');
  };

  const updateNavbar = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };

  const updateActiveLink = () => {
    let currentId = '';

    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= 140) {
        currentId = section.id;
      }
    });

    links.forEach((link) => {
      link.classList.toggle(
        'active',
        link.getAttribute('href') === `#${currentId}`
      );
    });
  };

  updateNavbar();
  updateActiveLink();

  window.addEventListener(
    'scroll',
    () => {
      updateNavbar();
      updateActiveLink();
    },
    { passive: true }
  );

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');

      hamburger.classList.toggle('open', isOpen);
      document.body.classList.toggle('no-scroll', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    links.forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (event) => {
      if (!navbar.contains(event.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });
  }
}

function initHeroVideo() {
  const video = $('#heroBgVideo');
  const source = $('#heroVideoSource');

  if (!video || !source) return;

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  let currentMode = '';
  let resizeTimer;

  const getMode = () =>
    window.innerWidth >= 769 ? 'desktop' : 'mobile';

  const tryPlay = async () => {
    if (reducedMotion.matches) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    try {
      await video.play();
    } catch (error) {
      // Autoplay may be blocked.
    }
  };

  const updateSource = (force = false) => {
    const mode = getMode();

    const nextSource =
      mode === 'desktop'
        ? video.dataset.desktop
        : video.dataset.mobile;

    if (!nextSource || (!force && mode === currentMode)) {
      return;
    }

    currentMode = mode;
    source.src = nextSource;
    video.load();

    video.addEventListener('loadedmetadata', tryPlay, {
      once: true
    });
  };

  if (reducedMotion.matches) {
    video.pause();
    video.removeAttribute('autoplay');
    return;
  }

  updateSource(true);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      tryPlay();
    }
  });

  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer);

      resizeTimer = window.setTimeout(() => {
        updateSource();
      }, 250);
    },
    { passive: true }
  );

  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) {
      video.pause();
      video.removeAttribute('autoplay');
    } else {
      video.setAttribute('autoplay', '');
      updateSource(true);
    }
  });
}

function initAnimations() {
  const elements = $$('[data-animate]');

  if (!elements.length) return;

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (
    reducedMotion ||
    !('IntersectionObserver' in window)
  ) {
    elements.forEach((element) => {
      element.classList.add('is-visible');
    });

    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const delay = Number.parseInt(
          entry.target.dataset.delay || '0',
          10
        );

        window.setTimeout(() => {
          entry.target.classList.add('is-visible');
        }, delay);

        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  elements.forEach((element) => {
    observer.observe(element);
  });
}

function initSlider() {
  const slider = $('#testimonialSlider');
  const previousButton = $('#sliderPrev');
  const nextButton = $('#sliderNext');
  const dotsContainer = $('#sliderDots');

  if (!slider) return;

  const slides = $$('.testimonial-slide', slider);

  if (!slides.length) return;

  let currentSlide = 0;
  let autoplayTimer;
  let touchStartX = 0;

  const getDots = () =>
    dotsContainer ? $$('.slider-dot', dotsContainer) : [];

  const updateSlider = () => {
    slider.style.transform =
      `translateX(-${currentSlide * 100}%)`;

    getDots().forEach((dot, index) => {
      const isActive = index === currentSlide;

      dot.classList.toggle('active', isActive);
      dot.setAttribute(
        'aria-current',
        isActive ? 'true' : 'false'
      );
    });
  };

  const stopAutoplay = () => {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = undefined;
    }
  };

  const goToSlide = (index, restart = true) => {
    currentSlide =
      (index + slides.length) % slides.length;

    updateSlider();

    if (restart) {
      startAutoplay();
    }
  };

  const startAutoplay = () => {
    stopAutoplay();

    if (slides.length <= 1) return;

    autoplayTimer = window.setInterval(() => {
      goToSlide(currentSlide + 1, false);
    }, 5500);
  };

  if (dotsContainer) {
    dotsContainer.innerHTML = '';

    slides.forEach((_, index) => {
      const dot = document.createElement('button');

      dot.type = 'button';
      dot.className =
        index === 0
          ? 'slider-dot active'
          : 'slider-dot';

      dot.setAttribute(
        'aria-label',
        `Bewertung ${index + 1} anzeigen`
      );

      dot.addEventListener('click', () => {
        goToSlide(index);
      });

      dotsContainer.appendChild(dot);
    });
  }

  previousButton?.addEventListener('click', () => {
    goToSlide(currentSlide - 1);
  });

  nextButton?.addEventListener('click', () => {
    goToSlide(currentSlide + 1);
  });

  slider.addEventListener(
    'touchstart',
    (event) => {
      touchStartX = event.touches[0].clientX;
    },
    { passive: true }
  );

  slider.addEventListener(
    'touchend',
    (event) => {
      const touchEndX =
        event.changedTouches[0].clientX;

      const difference =
        touchStartX - touchEndX;

      if (Math.abs(difference) > 50) {
        goToSlide(
          currentSlide +
            (difference > 0 ? 1 : -1)
        );
      }
    },
    { passive: true }
  );

  const wrapper = slider.closest(
    '.testimonial-slider-wrap'
  );

  wrapper?.addEventListener(
    'mouseenter',
    stopAutoplay
  );

  wrapper?.addEventListener(
    'mouseleave',
    startAutoplay
  );

  wrapper?.addEventListener(
    'focusin',
    stopAutoplay
  );

  wrapper?.addEventListener(
    'focusout',
    startAutoplay
  );

  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    }
  );

  updateSlider();
  startAutoplay();
}

function initFAQ() {
  const items = $$('.faq-item');

  if (!items.length) return;

  items.forEach((item) => {
    const question = $('.faq-question', item);

    if (!question) return;

    question.addEventListener('click', () => {
      const shouldOpen =
        !item.classList.contains('open');

      items.forEach((otherItem) => {
        otherItem.classList.remove('open');

        $('.faq-question', otherItem)?.setAttribute(
          'aria-expanded',
          'false'
        );
      });

      if (shouldOpen) {
        item.classList.add('open');
        question.setAttribute(
          'aria-expanded',
          'true'
        );
      }
    });
  });
}

function initContactForm() {
  const form = $('#contactForm');

  if (!form) return;

  const submitButton = form.querySelector(
    'button[type="submit"]'
  );

  const successMessage = $('#formSuccess');

  const originalButtonHTML =
    submitButton?.innerHTML || '';

  let statusMessage = $('#formStatus');

  if (!statusMessage) {
    statusMessage = document.createElement('div');
    statusMessage.id = 'formStatus';
    statusMessage.className = 'form-status';

    statusMessage.setAttribute(
      'aria-live',
      'polite'
    );

    if (successMessage) {
      successMessage.insertAdjacentElement(
        'afterend',
        statusMessage
      );
    } else if (submitButton) {
      submitButton.insertAdjacentElement(
        'afterend',
        statusMessage
      );
    }
  }

  const fields = {
    fullName: {
      element: $('#fullName'),
      error: $('#fullNameError'),

      validate(value) {
        const cleanValue = value.trim();

        if (!cleanValue) {
          return 'Bitte geben Sie Ihren Namen ein.';
        }

        if (cleanValue.length < 2) {
          return 'Der Name muss mindestens 2 Zeichen enthalten.';
        }

        return '';
      }
    },

    email: {
      element: $('#email'),
      error: $('#emailError'),

      validate(value) {
        const cleanValue = value.trim();

        const pattern =
          /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        if (!cleanValue) {
          return 'Bitte geben Sie Ihre E-Mail-Adresse ein.';
        }

        if (!pattern.test(cleanValue)) {
          return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
        }

        return '';
      }
    },

    service: {
      element: $('#service'),
      error: $('#serviceError'),

      validate(value) {
        return value
          ? ''
          : 'Bitte wählen Sie eine Dienstleistung aus.';
      }
    },

    message: {
      element: $('#message'),
      error: $('#messageError'),

      validate(value) {
        const cleanValue = value.trim();

        if (!cleanValue) {
          return 'Bitte geben Sie eine Nachricht ein.';
        }

        if (cleanValue.length < 10) {
          return 'Die Nachricht muss mindestens 10 Zeichen enthalten.';
        }

        return '';
      }
    }
  };

  const showFieldError = (
    field,
    message
  ) => {
    if (!field.element) return;

    field.element.classList.toggle(
      'error',
      Boolean(message)
    );

    field.element.setAttribute(
      'aria-invalid',
      message ? 'true' : 'false'
    );

    if (field.error) {
      field.error.textContent = message;
    }
  };

  const validateField = (key) => {
    const field = fields[key];

    if (!field?.element) {
      return true;
    }

    const message = field.validate(
      field.element.value
    );

    showFieldError(field, message);

    return !message;
  };

  const validateForm = () =>
    Object.keys(fields).every((key) =>
      validateField(key)
    );

  const clearStatus = () => {
    successMessage?.classList.remove('show');

    if (statusMessage) {
      statusMessage.textContent = '';
      statusMessage.className =
        'form-status';
    }
  };

  const setSubmitting = (
    isSubmitting
  ) => {
    if (!submitButton) return;

    submitButton.disabled =
      isSubmitting;

    submitButton.setAttribute(
      'aria-busy',
      String(isSubmitting)
    );

    submitButton.innerHTML =
      isSubmitting
        ? '<i class="fa-solid fa-spinner fa-spin"></i> Wird gesendet...'
        : originalButtonHTML;
  };

  Object.keys(fields).forEach((key) => {
    const field = fields[key];

    if (!field.element) return;

    field.element.addEventListener(
      'blur',
      () => {
        validateField(key);
      }
    );

    field.element.addEventListener(
      'input',
      () => {
        clearStatus();

        if (
          field.element.classList.contains(
            'error'
          )
        ) {
          validateField(key);
        }
      }
    );

    field.element.addEventListener(
      'change',
      () => {
        clearStatus();
        validateField(key);
      }
    );
  });

  form.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      clearStatus();

      if (!validateForm()) {
        form.querySelector('.error')?.focus();
        return;
      }

      const accessKey = form
        .querySelector(
          'input[name="access_key"]'
        )
        ?.value.trim();

      if (
        !accessKey ||
        accessKey ===
          'VENDOS_ACCESS_KEY_KETU'
      ) {
        if (statusMessage) {
          statusMessage.textContent =
            'Der Web3Forms Access Key wurde noch nicht eingetragen.';

          statusMessage.className =
            'form-status error';
        }

        return;
      }

      setSubmitting(true);

      try {
        const response = await fetch(
          form.action,
          {
            method: 'POST',
            body: new FormData(form),
            headers: {
              Accept: 'application/json'
            }
          }
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              'Die Anfrage konnte nicht gesendet werden.'
          );
        }

        form.reset();

        Object.values(fields).forEach(
          (field) => {
            showFieldError(field, '');
          }
        );

        successMessage?.classList.add(
          'show'
        );

        successMessage?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      } catch (error) {
        if (statusMessage) {
          statusMessage.textContent =
            error.message ||
            'Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.';

          statusMessage.className =
            'form-status error';
        }
      } finally {
        setSubmitting(false);
      }
    }
  );
}

function initBackToTop() {
  const button = $('#backToTop');

  if (!button) return;

  const updateButton = () => {
    button.classList.toggle(
      'visible',
      window.scrollY > 400
    );
  };

  updateButton();

  window.addEventListener(
    'scroll',
    updateButton,
    { passive: true }
  );

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

function initFooterYear() {
  const footerYear = $('#footerYear');

  if (footerYear) {
    footerYear.textContent =
      new Date().getFullYear();
  }
}

function initSmoothScroll() {
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener(
      'click',
      (event) => {
        const href =
          link.getAttribute('href');

        if (!href || href === '#') {
          return;
        }

        const target =
          document.querySelector(href);

        if (!target) return;

        event.preventDefault();

        const navbarHeight =
          $('#navbar')?.offsetHeight || 72;

        const targetPosition =
          target.getBoundingClientRect().top +
          window.scrollY -
          navbarHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    );
  });
}

function initCardTilt() {
  const cards = $$('.service-card, .why-card');

  if (!cards.length) return;

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const supportsHover = window.matchMedia(
    '(hover: hover) and (pointer: fine)'
  ).matches;

  if (reducedMotion || !supportsHover) {
    return;
  }

  cards.forEach((card) => {
    let animationFrame;

    card.addEventListener(
      'mousemove',
      (event) => {
        if (animationFrame) {
          cancelAnimationFrame(
            animationFrame
          );
        }

        animationFrame =
          requestAnimationFrame(() => {
            const rectangle =
              card.getBoundingClientRect();

            const x =
              (
                event.clientX -
                rectangle.left
              ) /
                rectangle.width -
              0.5;

            const y =
              (
                event.clientY -
                rectangle.top
              ) /
                rectangle.height -
              0.5;

            card.style.transform =
              `translateY(-6px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
          });
      }
    );

    card.addEventListener(
      'mouseleave',
      () => {
        card.style.transform = '';
      }
    );
  });
}

document.addEventListener(
  'DOMContentLoaded',
  () => {
    initNavbar();
    initHeroVideo();
    initAnimations();
    initSlider();
    initFAQ();
    initContactForm();
    initBackToTop();
    initFooterYear();
    initSmoothScroll();
    initCardTilt();
  }
);