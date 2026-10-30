/* SerpAID scroll + entrance motion. Pure vanilla, no deps. */
(function () {
  // staggered reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('in'), (i % 4) * 90);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.16 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // hero intro sequence
  const seq = ['#k', '#h1', '#lede', '#cta'];
  seq.forEach((sel, i) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.style.transition = 'opacity .9s cubic-bezier(.22,.61,.36,1), transform .9s cubic-bezier(.22,.61,.36,1)';
    el.style.opacity = '0';
    el.style.transform = 'translateY(26px)';
    setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'none'; }, 180 + i * 180);
  });

  // nav background on scroll
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // cursor spotlight (skipped on reduced motion / touch)
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const spot = document.getElementById('spotlight');
  if (spot && !reduce) {
    window.addEventListener('pointermove', (e) => {
      spot.style.setProperty('--mx', e.clientX + 'px');
      spot.style.setProperty('--my', e.clientY + 'px');
    }, { passive: true });
  }

  // magnetic buttons: lean toward the pointer, spring back on leave
  if (!reduce) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transition = 'transform .08s linear';
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.3 - 3}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform .5s cubic-bezier(.22,.61,.36,1)';
        el.style.transform = 'translate(0,0)';
      });
    });
  }
})();
