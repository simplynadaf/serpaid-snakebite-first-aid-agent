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
})();
