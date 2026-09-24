const preloader = document.querySelector('#preloader');
const enterButton = document.querySelector('#enter-button');
const introVideo = document.querySelector('#intro-video');
const welcomeVideo = document.querySelector('#welcome-video');
const canvas = document.querySelector('#blast-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
const lowPowerDevice = (navigator.deviceMemory && navigator.deviceMemory <= 4)
  || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
const useMobileAssets = window.matchMedia('(max-width: 900px)').matches || lowPowerDevice || navigator.connection?.saveData;
if (useMobileAssets) {
  document.querySelectorAll('video').forEach((video) => {
    const mobileSource = video.querySelector('source[media]')?.getAttribute('src');
    if (mobileSource) { video.src = mobileSource; video.load(); }
  });
}

let introReady = false;
let entryStarted = false;
function dismissLoader() { preloader.classList.add('dismissed'); }
function closeWelcome() {
  if (preloader.classList.contains('exit-stage')) return;
  preloader.classList.add('exit-stage');
  setTimeout(dismissLoader, 640);
}
function beginEntry() {
  if (!introReady || entryStarted) return;
  entryStarted = true; preloader.classList.remove('awaiting-click'); preloader.classList.add('transition-out');
  setTimeout(() => { preloader.classList.add('welcome-stage'); welcomeVideo.currentTime = 0; welcomeVideo.play().catch(() => {}); }, 620);
  setTimeout(closeWelcome, 9000);
}
introVideo.addEventListener('ended', () => { introReady = true; preloader.classList.add('awaiting-click'); });
welcomeVideo.addEventListener('ended', closeWelcome);
preloader.addEventListener('pointerdown', (event) => { if (event.button === 0) beginEntry(); });

const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');
menu.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', open);
});

function fitCanvas() { const ratio = lowPowerDevice ? 1 : Math.min(devicePixelRatio || 1, 2); canvas.width = innerWidth * ratio; canvas.height = innerHeight * ratio; ctx.setTransform(ratio, 0, 0, ratio, 0, 0); }
fitCanvas(); addEventListener('resize', fitCanvas);
function burst(x, y) {
  particles = Array.from({ length: lowPowerDevice ? 58 : 105 }, () => {
    const a = Math.random() * Math.PI * 2, speed = 2 + Math.random() * 10;
    return { x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 1, size: 1 + Math.random() * 3, hue: Math.random() > .22 ? 73 : 15 };
  });
  document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake');
  requestAnimationFrame(drawBlast);
}
function drawBlast() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .16; p.vx *= .98; p.life -= .023; ctx.fillStyle = `hsla(${p.hue}, 100%, 62%, ${Math.max(p.life, 0)})`; ctx.fillRect(p.x, p.y, p.size, p.size); });
  particles = particles.filter(p => p.life > 0); if (particles.length) requestAnimationFrame(drawBlast);
}
document.querySelectorAll('[data-target]').forEach(link => link.addEventListener('click', event => {
  const id = link.dataset.target; const section = document.getElementById(id); if (!section) return;
  event.preventDefault(); const r = link.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); nav.classList.remove('open'); setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 180);
}));

const sequence = document.querySelector('#gear-sequence');
function updateMachine() {
  const box = sequence.getBoundingClientRect();
  const progress = Math.min(1, Math.max(0, -box.top / (box.height - innerHeight)));
  document.documentElement.style.setProperty('--gear-progress', progress.toFixed(3));
}
addEventListener('scroll', updateMachine, { passive: true }); updateMachine();

document.querySelectorAll('.date-tabs button').forEach(button => button.addEventListener('click', () => {
  document.querySelector('.date-tabs .active').classList.remove('active'); button.classList.add('active');
  const table = document.querySelector('.schedule-table'); table.classList.remove('shake'); void table.offsetWidth; table.classList.add('shake');
}));
const numberVideo = document.querySelector('#numbers-video');
const numberSequence = document.querySelector('.numbers-sequence');
const videoObserver = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) numberVideo.play().catch(() => {});
  else numberVideo.pause();
}, { threshold: .35 });
videoObserver.observe(numberSequence);

const scrollMeter = document.querySelector('#scroll-meter-fill');
const topButton = document.querySelector('#back-to-top');
function updateScrollUI() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const percent = max > 0 ? (scrollY / max) * 100 : 0;
  scrollMeter.style.height = `${percent}%`;
  topButton.classList.toggle('visible', scrollY > innerHeight * .8);
}
addEventListener('scroll', updateScrollUI, { passive: true });
updateScrollUI();
topButton.addEventListener('click', () => { burst(innerWidth - 38, innerHeight - 42); scrollTo({ top: 0, behavior: 'smooth' }); });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('revealed'); revealObserver.unobserve(entry.target); } });
}, { threshold: .16 });
document.querySelectorAll('.section, .impact-bridge').forEach((element) => { element.classList.add('reveal-pending'); revealObserver.observe(element); });

// The black hole is a lightweight canvas: scrolling shifts its orbit, while pointer motion
// releases small shooting stars that curve inward to the gravity well.
const about = document.querySelector('#about');
const blackholeCanvas = document.querySelector('#blackhole-canvas');
if (about && blackholeCanvas) {
  const blackholeCtx = blackholeCanvas.getContext('2d');
  const stars = [];
  const pointer = { x: 0, y: 0, active: false, last: 0 };
  let blackholeVisible = false;
  let blackholeSize = { width: 0, height: 0 };
  let blackholeFrameQueued = false;

  function requestBlackholeFrame() {
    if (!blackholeFrameQueued) { blackholeFrameQueued = true; requestAnimationFrame(drawBlackhole); }
  }

  function resizeBlackhole() {
    const rect = about.getBoundingClientRect();
    const ratio = lowPowerDevice ? 1 : Math.min(devicePixelRatio || 1, 2);
    blackholeSize = { width: rect.width, height: rect.height };
    blackholeCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
    blackholeCanvas.height = Math.max(1, Math.floor(rect.height * ratio));
    blackholeCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function gravityCenter() {
    const rect = about.getBoundingClientRect();
    const travel = Math.max(0, Math.min(1, (innerHeight * .76 - rect.top) / (rect.height + innerHeight * .55)));
    const parallaxX = pointer.active ? (pointer.x - blackholeSize.width * .5) * .055 : 0;
    const parallaxY = pointer.active ? (pointer.y - blackholeSize.height * .5) * .035 : 0;
    return {
      x: blackholeSize.width * (.72 - travel * .38) + parallaxX,
      y: blackholeSize.height * (.25 + travel * .48) + parallaxY,
      radius: Math.min(blackholeSize.width, blackholeSize.height) * .105
    };
  }

  function releaseStar(x, y) {
    const core = gravityCenter();
    const dx = core.x - x, dy = core.y - y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const tangent = (Math.random() - .5) * 2.4;
    stars.push({ x, y, px: x, py: y, vx: dx / length * (2.6 + Math.random() * 2.3) - dy / length * tangent, vy: dy / length * (2.6 + Math.random() * 2.3) + dx / length * tangent, life: 1, size: 1 + Math.random() * 1.7, hue: Math.random() > .78 ? 65 : 193 });
    if (stars.length > 110) stars.splice(0, stars.length - 110);
  }

  function drawBlackhole() {
    blackholeFrameQueued = false;
    if (blackholeVisible) {
      const { width, height } = blackholeSize;
      const core = gravityCenter();
      const time = performance.now() * .001;
      blackholeCtx.clearRect(0, 0, width, height);
      blackholeCtx.save();
      blackholeCtx.translate(core.x, core.y);
      blackholeCtx.rotate(time * .12);
      for (let ring = 0; ring < 4; ring += 1) {
        const r = core.radius * (1.38 + ring * .32);
        blackholeCtx.beginPath();
        blackholeCtx.ellipse(0, 0, r * 1.8, r * (.34 + ring * .025), 0, 0, Math.PI * 2);
        blackholeCtx.strokeStyle = `hsla(${184 + ring * 13}, 94%, ${38 + ring * 9}%, ${.08 + ring * .035})`;
        blackholeCtx.lineWidth = 1 + ring * .35;
        blackholeCtx.stroke();
      }
      const glow = blackholeCtx.createRadialGradient(0, 0, core.radius * .12, 0, 0, core.radius * 2.45);
      glow.addColorStop(0, '#020407'); glow.addColorStop(.35, '#020407'); glow.addColorStop(.57, '#007dff33'); glow.addColorStop(.77, '#72f5ff18'); glow.addColorStop(1, '#72f5ff00');
      blackholeCtx.fillStyle = glow;
      blackholeCtx.beginPath(); blackholeCtx.arc(0, 0, core.radius * 2.45, 0, Math.PI * 2); blackholeCtx.fill();
      blackholeCtx.fillStyle = '#010204'; blackholeCtx.beginPath(); blackholeCtx.arc(0, 0, core.radius * .7, 0, Math.PI * 2); blackholeCtx.fill();
      blackholeCtx.restore();

      for (let i = stars.length - 1; i >= 0; i -= 1) {
        const star = stars[i];
        const dx = core.x - star.x, dy = core.y - star.y;
        const d = Math.max(36, Math.hypot(dx, dy));
        star.vx += dx / d * .13; star.vy += dy / d * .13;
        star.px = star.x; star.py = star.y; star.x += star.vx; star.y += star.vy; star.life -= .016;
        if (d < core.radius * .72 || star.life <= 0) { stars.splice(i, 1); continue; }
        blackholeCtx.beginPath(); blackholeCtx.moveTo(star.px, star.py); blackholeCtx.lineTo(star.x, star.y);
        blackholeCtx.strokeStyle = `hsla(${star.hue},100%,70%,${star.life})`;
        blackholeCtx.lineWidth = star.size; blackholeCtx.stroke();
      }
    }
    if (blackholeVisible && (stars.length || pointer.active)) requestBlackholeFrame();
  }

  about.addEventListener('pointermove', (event) => {
    const rect = about.getBoundingClientRect();
    pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top; pointer.active = true;
    const now = performance.now();
    if (now - pointer.last > 28) { releaseStar(pointer.x, pointer.y); pointer.last = now; }
    requestBlackholeFrame();
  });
  about.addEventListener('pointerleave', () => { pointer.active = false; requestBlackholeFrame(); });
  new ResizeObserver(resizeBlackhole).observe(about);
  new IntersectionObserver(([entry]) => { blackholeVisible = entry.isIntersecting; if (blackholeVisible) requestBlackholeFrame(); }, { threshold: .03 }).observe(about);
  addEventListener('scroll', () => { if (blackholeVisible) requestBlackholeFrame(); }, { passive: true });
  resizeBlackhole();
  requestBlackholeFrame();
}

// Cinematic gravity journey: starts with the About slide and follows the visitor to the outro.
const gravityCanvas = document.querySelector('#gravity-journey');
const gravityVideo = document.querySelector('#gravity-video');
const outro = document.querySelector('#contact');
if (gravityCanvas && about && outro) {
  const gravityCtx = gravityCanvas.getContext('2d');
  const meteors = [];
  const lightTrail = [];
  const cursor = { x: innerWidth * .7, y: innerHeight * .5, lastX: 0, lastY: 0, lastTime: 0, seen: false };
  let journeyProgress = 0;
  let journeyOnScreen = false;
  let gravityFrameQueued = false;

  function requestGravityFrame() {
    if (!gravityFrameQueued) { gravityFrameQueued = true; requestAnimationFrame(drawGravityJourney); }
  }

  function fitGravityCanvas() {
    const ratio = lowPowerDevice ? 1 : Math.min(devicePixelRatio || 1, 2);
    gravityCanvas.width = Math.floor(innerWidth * ratio);
    gravityCanvas.height = Math.floor(innerHeight * ratio);
    gravityCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function gravityProgress() {
    const start = about.offsetTop - innerHeight * .32;
    const finish = outro.offsetTop + outro.offsetHeight - innerHeight * .36;
    journeyProgress = Math.max(0, Math.min(1, (scrollY - start) / Math.max(1, finish - start)));
    journeyOnScreen = scrollY > start - innerHeight && scrollY < finish + innerHeight;
    document.body.classList.toggle('gravity-active', journeyOnScreen);
    document.querySelectorAll('#about, #schedule, #events, #value, #prefest, #logistics, #contact').forEach((section) => {
      section.classList.add('gravity-pull');
    });
      const finalTitle = document.querySelector('#contact h2');
      if (finalTitle) {
        const swallow = Math.max(0, Math.min(1, (journeyProgress - .87) / .13));
        finalTitle.classList.add('final-swallow');
        finalTitle.style.transform = 'none';
        const box = finalTitle.getBoundingClientRect();
      const core = corePosition();
      const dx = core.x - (box.left + box.width * .5), dy = core.y - (box.top + box.height * .5);
      finalTitle.style.transform = `translate(${(dx * swallow).toFixed(1)}px, ${(dy * swallow).toFixed(1)}px) scale(${(1 - swallow * .94).toFixed(3)})`;
      finalTitle.style.opacity = (1 - swallow).toFixed(3);
    }
    if (journeyOnScreen && gravityVideo) gravityVideo.play().catch(() => {});
    if (!journeyOnScreen && gravityVideo) gravityVideo.pause();
    if (journeyOnScreen) requestGravityFrame();
  }

  function corePosition() {
    return { x: innerWidth * .5, y: innerHeight * .5, r: Math.min(innerWidth, innerHeight) * .14 };
  }

  function shootMeteor(x, y, vx, vy) {
    if (!journeyOnScreen) return;
    const speed = Math.max(5, Math.min(18, Math.hypot(vx, vy) * .72 + 4));
    const norm = Math.max(1, Math.hypot(vx, vy));
    meteors.push({ x, y, px: x, py: y, vx: vx / norm * speed, vy: vy / norm * speed, life: 1, length: 28 + Math.random() * 58, warm: Math.random() > .46 });
    if (meteors.length > 90) meteors.splice(0, meteors.length - 90);
  }

  function drawGravityJourney(now) {
    gravityFrameQueued = false;
    gravityCtx.clearRect(0, 0, innerWidth, innerHeight);
    if (journeyOnScreen) {
      const core = corePosition();
      const pulse = 1 + Math.sin(now * .0024) * .045;
      if (!gravityVideo) {
      // Soft orange cloud around the accretion disc.
      const haze = gravityCtx.createRadialGradient(core.x, core.y, core.r * .35, core.x, core.y, core.r * 3.4);
      haze.addColorStop(0, 'rgba(0,0,0,0)'); haze.addColorStop(.42, 'rgba(255,74,15,.11)'); haze.addColorStop(.7, 'rgba(255,142,41,.045)'); haze.addColorStop(1, 'rgba(255,120,30,0)');
      gravityCtx.fillStyle = haze; gravityCtx.beginPath(); gravityCtx.arc(core.x, core.y, core.r * 3.4, 0, Math.PI * 2); gravityCtx.fill();
      gravityCtx.save(); gravityCtx.translate(core.x, core.y); gravityCtx.rotate(now * .00022);
      for (let ring = 0; ring < 7; ring += 1) {
        const r = core.r * (1.08 + ring * .115) * pulse;
        gravityCtx.beginPath();
        gravityCtx.ellipse(0, 0, r * (1.95 + ring * .055), r * (.28 + ring * .025), 0, -Math.PI * .93, Math.PI * .93);
        gravityCtx.strokeStyle = `hsla(${22 + ring * 4},100%,${73 - ring * 4}%,${.16 + ring * .055})`;
        gravityCtx.lineWidth = ring === 2 ? 3.2 : 1 + ring * .38;
        gravityCtx.shadowColor = '#ff6a19'; gravityCtx.shadowBlur = 12 + ring * 6; gravityCtx.stroke();
      }
      gravityCtx.restore();
      const edge = gravityCtx.createRadialGradient(core.x - core.r * .18, core.y - core.r * .12, core.r * .1, core.x, core.y, core.r * 1.02);
      edge.addColorStop(0, '#030305'); edge.addColorStop(.62, '#020204'); edge.addColorStop(.82, '#3d0802'); edge.addColorStop(1, '#ffad6177');
      gravityCtx.fillStyle = edge; gravityCtx.beginPath(); gravityCtx.arc(core.x, core.y, core.r, 0, Math.PI * 2); gravityCtx.fill();
      }
      for (let i = meteors.length - 1; i >= 0; i -= 1) {
        const meteor = meteors[i];
        const dx = core.x - meteor.x, dy = core.y - meteor.y;
        const distance = Math.max(20, Math.hypot(dx, dy));
        meteor.vx += dx / distance * .085; meteor.vy += dy / distance * .085;
        meteor.px = meteor.x; meteor.py = meteor.y; meteor.x += meteor.vx; meteor.y += meteor.vy; meteor.life -= .014;
        if (meteor.life <= 0 || distance < core.r * .72) { meteors.splice(i, 1); continue; }
        const tailX = meteor.x - meteor.vx / Math.max(1, Math.hypot(meteor.vx, meteor.vy)) * meteor.length;
        const tailY = meteor.y - meteor.vy / Math.max(1, Math.hypot(meteor.vx, meteor.vy)) * meteor.length;
        const trail = gravityCtx.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
        const colour = meteor.warm ? '255,138,61' : '144,232,255';
        trail.addColorStop(0, `rgba(${colour},0)`); trail.addColorStop(.7, `rgba(${colour},${meteor.life * .45})`); trail.addColorStop(1, `rgba(255,255,245,${meteor.life})`);
        gravityCtx.save(); gravityCtx.strokeStyle = trail; gravityCtx.lineWidth = 1.1 + meteor.life * 1.5; gravityCtx.lineCap = 'round'; gravityCtx.shadowColor = meteor.warm ? '#ff8138' : '#66dcff'; gravityCtx.shadowBlur = 9; gravityCtx.beginPath(); gravityCtx.moveTo(tailX, tailY); gravityCtx.lineTo(meteor.x, meteor.y); gravityCtx.stroke(); gravityCtx.restore();
        gravityCtx.fillStyle = '#fff8d9'; gravityCtx.beginPath(); gravityCtx.arc(meteor.x, meteor.y, 1.2 + meteor.life, 0, Math.PI * 2); gravityCtx.fill();
      }
      for (let i = lightTrail.length - 1; i >= 0; i -= 1) {
        const point = lightTrail[i];
        point.life -= .027;
        if (point.life <= 0) { lightTrail.splice(i, 1); continue; }
        const glow = gravityCtx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 14 * point.life + 3);
        glow.addColorStop(0, `rgba(236,255,255,${point.life * .95})`); glow.addColorStop(.28, `rgba(102,227,255,${point.life * .55})`); glow.addColorStop(1, 'rgba(61,187,255,0)');
        gravityCtx.fillStyle = glow; gravityCtx.beginPath(); gravityCtx.arc(point.x, point.y, 17 * point.life + 4, 0, Math.PI * 2); gravityCtx.fill();
      }
      // When the cursor pauses, leave a calm twinkling guide-star at that exact point.
      const idleFor = now - cursor.lastTime;
      if (cursor.seen && idleFor > 110) {
        const twinkle = .62 + Math.sin(now * .008) * .22;
        const radius = 2.2 + twinkle * 1.8;
        const halo = gravityCtx.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, 24 + twinkle * 12);
        halo.addColorStop(0, `rgba(255,255,235,${twinkle})`); halo.addColorStop(.18, `rgba(147,230,255,${twinkle * .65})`); halo.addColorStop(1, 'rgba(116,223,255,0)');
        gravityCtx.fillStyle = halo; gravityCtx.beginPath(); gravityCtx.arc(cursor.x, cursor.y, 34, 0, Math.PI * 2); gravityCtx.fill();
        gravityCtx.save(); gravityCtx.translate(cursor.x, cursor.y); gravityCtx.strokeStyle = `rgba(235,250,255,${twinkle})`; gravityCtx.lineWidth = 1;
        gravityCtx.beginPath(); gravityCtx.moveTo(-12 - twinkle * 7, 0); gravityCtx.lineTo(12 + twinkle * 7, 0); gravityCtx.moveTo(0, -12 - twinkle * 7); gravityCtx.lineTo(0, 12 + twinkle * 7); gravityCtx.stroke(); gravityCtx.restore();
        gravityCtx.fillStyle = '#fffdf0'; gravityCtx.beginPath(); gravityCtx.arc(cursor.x, cursor.y, radius, 0, Math.PI * 2); gravityCtx.fill();
      }
    }
    if (journeyOnScreen) requestGravityFrame();
  }

  addEventListener('pointermove', (event) => {
    const now = performance.now();
    const vx = event.clientX - cursor.lastX, vy = event.clientY - cursor.lastY;
    if (cursor.lastTime && now - cursor.lastTime > 28 && Math.hypot(vx, vy) > 3) shootMeteor(event.clientX, event.clientY, vx, vy);
    if (journeyOnScreen && Math.hypot(vx, vy) > 1) {
      lightTrail.push({ x: event.clientX, y: event.clientY, life: 1 });
      if (lightTrail.length > 34) lightTrail.splice(0, lightTrail.length - 34);
    }
    cursor.x = event.clientX; cursor.y = event.clientY; cursor.lastX = event.clientX; cursor.lastY = event.clientY; cursor.lastTime = now; cursor.seen = true;
    if (journeyOnScreen) requestGravityFrame();
  }, { passive: true });
  addEventListener('resize', () => { fitGravityCanvas(); gravityProgress(); }, { passive: true });
  addEventListener('scroll', gravityProgress, { passive: true });
  fitGravityCanvas(); gravityProgress();
}

// Presentation-only attendee portal. It intentionally stores no attendee data and makes no real payment.
const portal = document.querySelector('#portal');
const portalShell = portal?.querySelector('.portal-shell');
const portalTabs = document.querySelectorAll('[data-demo-tab]');
const portalPanels = document.querySelectorAll('[data-demo-panel]');
const registrationForm = document.querySelector('#demo-registration');
const ticketForm = document.querySelector('#demo-ticket-form');
const ticketResult = document.querySelector('#ticket-result');
const checkinResult = document.querySelector('#checkin-result');
let demoAttendee = 'Demo Attendee';
let demoPass = 'All-Access Pass';

function showPortalTab(name) {
  if (!portal) return;
  portalPanels.forEach((panel) => panel.classList.toggle('active', panel.dataset.demoPanel === name));
  portalTabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.demoTab === name));
  portalShell?.scrollTo({ top: 0, behavior: 'smooth' });
}

function openPortal(start = 'register') {
  if (!portal) return;
  portal.classList.add('open');
  portal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  showPortalTab(start);
  const rect = portalShell?.getBoundingClientRect();
  if (rect) burst(rect.left + rect.width / 2, rect.top + 30);
  setTimeout(() => portal.querySelector('input, button')?.focus(), 150);
}

function closePortal() {
  if (!portal) return;
  portal.classList.remove('open');
  portal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.querySelectorAll('[data-demo-open]').forEach((button) => button.addEventListener('click', (event) => { event.preventDefault(); openPortal(button.dataset.demoOpen); }));
document.querySelectorAll('[data-demo-close]').forEach((button) => button.addEventListener('click', closePortal));
portalTabs.forEach((tab) => tab.addEventListener('click', () => showPortalTab(tab.dataset.demoTab)));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && portal?.classList.contains('open')) closePortal(); });

registrationForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(registrationForm);
  demoAttendee = String(data.get('name') || 'Demo Attendee').trim() || 'Demo Attendee';
  demoPass = String(data.get('pass') || 'All-Access Pass').split('—')[0].trim();
  document.querySelector('#payment-name').textContent = demoAttendee.toUpperCase();
  document.querySelector('#payment-pass').textContent = demoPass.toUpperCase();
  burst(innerWidth / 2, innerHeight / 2);
  showPortalTab('payment');
});

document.querySelector('#demo-pay')?.addEventListener('click', () => {
  const button = document.querySelector('#demo-pay');
  button.textContent = 'VERIFYING DEMO PAYMENT...';
  portalShell?.classList.add('shake');
  setTimeout(() => {
    button.innerHTML = 'PAY ₹499 <span>↗</span>';
    portalShell?.classList.remove('shake');
    document.querySelector('#demo-ticket-code').textContent = 'SYN27-DEMO';
    burst(innerWidth / 2, innerHeight / 2);
    showPortalTab('success');
  }, 700);
});

ticketForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  ticketResult.hidden = false;
  document.querySelector('#ticket-owner').textContent = `${demoAttendee} · ${demoPass}`;
  burst(innerWidth / 2, innerHeight * .68);
});

document.querySelector('#demo-scan')?.addEventListener('click', () => {
  checkinResult.hidden = false;
  document.querySelector('#demo-scan').innerHTML = 'TICKET VERIFIED <span>✓</span>';
  burst(innerWidth / 2, innerHeight * .7);
});
