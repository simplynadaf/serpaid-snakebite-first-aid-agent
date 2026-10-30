/* SerpAID 3D background: a slow, living "venom current", thousands of particles
   flowing along a drifting sine-serpent curve. Calm, premium, never distracting.
   Respects prefers-reduced-motion. */
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070b0a, 0.055);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 18);

  // Build a flowing ribbon of particles that traces a serpent-like curve.
  const COUNT = reduce ? 1200 : 4200;
  const positions = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    seeds[i] = Math.random();
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Soft round sprite so points look like glowing motes, not squares.
  const sprite = (function () {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(120,255,205,1)');
    grad.addColorStop(0.4, 'rgba(56,255,176,0.5)');
    grad.addColorStop(1, 'rgba(56,255,176,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    const t = new THREE.Texture(c); t.needsUpdate = true; return t;
  })();

  const mat = new THREE.PointsMaterial({
    size: 0.5, map: sprite, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: 0.85, color: 0x38ffb0,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // a second, cooler, slower layer for depth
  const geo2 = geo.clone();
  const mat2 = mat.clone(); mat2.size = 0.26; mat2.opacity = 0.4; mat2.color = new THREE.Color(0x0fae79);
  const points2 = new THREE.Points(geo2, mat2); scene.add(points2);

  const pos = geo.attributes.position.array;
  const pos2 = geo2.attributes.position.array;

  let t = 0, scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  function serpent(u, time, amp) {
    // u in [0,1] along the body; returns a point on a drifting double-sine curve
    const x = (u - 0.5) * 42;
    const y = Math.sin(u * 7.5 + time) * amp + Math.sin(u * 3.1 - time * 0.6) * amp * 0.5;
    const z = Math.cos(u * 5.2 + time * 0.8) * amp * 0.8;
    return [x, y, z];
  }

  function frame() {
    t += reduce ? 0.0015 : 0.004;
    for (let i = 0; i < COUNT; i++) {
      const u = seeds[i];
      const jitter = (seeds[i] - 0.5);
      const [x, y, z] = serpent(u, t, 3.4);
      pos[i * 3] = x;
      pos[i * 3 + 1] = y + jitter * 2.2;
      pos[i * 3 + 2] = z + jitter * 2.0;
      const [x2, y2, z2] = serpent((u + 0.12) % 1, t * 0.7 + 1.5, 4.2);
      pos2[i * 3] = x2;
      pos2[i * 3 + 1] = y2 + jitter * 3.0 - 1.5;
      pos2[i * 3 + 2] = z2 + jitter * 3.0 - 4;
    }
    geo.attributes.position.needsUpdate = true;
    geo2.attributes.position.needsUpdate = true;

    const sc = scrollY * 0.0012;
    points.rotation.z = Math.sin(t * 0.2) * 0.06 + sc * 0.1;
    points2.rotation.z = -Math.sin(t * 0.15) * 0.05;
    camera.position.y = -sc * 2.2;
    camera.position.x = Math.sin(t * 0.1) * 0.6;
    camera.lookAt(0, camera.position.y * 0.3, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
