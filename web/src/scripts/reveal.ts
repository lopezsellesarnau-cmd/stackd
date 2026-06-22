const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduce) {
  // Hero entrance — runs once on load
  requestAnimationFrame(() => {
    document.querySelector('.hero')?.classList.add('is-revealed');
  });

  // Scroll-triggered reveals
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      }
    });
  });

  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
}
