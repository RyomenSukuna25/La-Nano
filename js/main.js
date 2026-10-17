/* El Ñaño — home page motion
   1) Hero: cinematic image + typography transitions (blur / scale dissolve)
   2) Menu: pinned, scroll-scrubbed dish story with floating garnish layers
   3) Editorial parallax: layers moving at different speeds across story / locations / close */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = root.classList.contains('rm');

  /* ---------- Images: local file → official URL → cropped fallback → brand pattern ---------- */
  var crops = [];
  function applyCrop(img) {
    var c = img._crop; if (!c || !img.naturalWidth) return;
    var box = img.parentElement, W = box.clientWidth, H = box.clientHeight; if (!W || !H) return;
    var a = img.naturalHeight / img.naturalWidth;
    var z = Math.max(c[2], H / (W * a), 1), iw = z * W, ih = iw * a;
    var cx = Math.min(Math.max(c[0], W / 2 / iw), 1 - W / 2 / iw);
    var cy = Math.min(Math.max(c[1], H / 2 / ih), 1 - H / 2 / ih);
    var s = img.style;
    s.maxWidth = 'none'; s.objectFit = 'fill'; s.right = s.bottom = 'auto';
    s.width = iw + 'px'; s.height = ih + 'px';
    s.left = (W / 2 - cx * iw) + 'px'; s.top = (H / 2 - cy * ih) + 'px';
  }
  $$('img[data-srcs]').forEach(function (img) {
    var list = img.getAttribute('data-srcs').split('|'), i = 0, crop = img.getAttribute('data-crop');
    var holder = img.closest('.ph'), logo = img.closest('[data-logo]');
    (function next() {
      if (i >= list.length) { if (holder) holder.classList.add('noimg'); return; }
      var raw = list[i], useCrop = raw.charAt(0) === '~', src = useCrop ? raw.slice(1) : raw;
      var probe = new Image();
      probe.onload = function () {
        if (useCrop && crop) {
          img._crop = crop.split(',').map(Number); crops.push(img);
          img.addEventListener('load', function () { applyCrop(img); img.classList.add('ld'); }, { once: true });
        } else { img.addEventListener('load', function () { img.classList.add('ld'); }, { once: true }); }
        img.src = src;
        if (logo) logo.classList.add('ok');
      };
      probe.onerror = function () { i++; next(); };
      probe.src = src;
    })();
  });
  var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { crops.forEach(applyCrop); }, 120); });

  /* ---------- Language (EN / ES) ---------- */
  var lang = 'en';
  try { lang = localStorage.getItem('eln-lang') || (/^es/i.test(navigator.language) ? 'es' : 'en'); } catch (e) {}
  function fmtPrice(v) { var s = v.toFixed(2); return lang === 'es' ? s.replace('.', ',') : s; }
  function setLang(l) {
    lang = l; root.lang = l;
    $$('[data-es]').forEach(function (el) {
      var t = el.querySelector('em') || el;
      if (!t.hasAttribute('data-en')) t.setAttribute('data-en', t.textContent);
      t.textContent = l === 'es' ? el.getAttribute('data-es') : t.getAttribute('data-en');
    });
    var p = $('[data-price]'); if (p && !p.dataset.run) p.textContent = fmtPrice(16.5);
    try { localStorage.setItem('eln-lang', l); } catch (e) {}
  }
  setLang(lang);
  $('#lang').addEventListener('click', function () { setLang(lang === 'en' ? 'es' : 'en'); });
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- Mobile nav ---------- */
  var burger = $('#burger'), nav = $('.nav');
  function closeNav() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () { var o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  $$('.nav a').forEach(function (a) { a.addEventListener('click', closeNav); });

  if (!window.gsap || !window.ScrollTrigger) { $('#intro').remove(); return; }
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('anim');

  /* ---------- Header ---------- */
  var hdr = $('#hdr');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (s) {
    hdr.classList.toggle('solid', s.scroll() > 60);
    hdr.classList.toggle('hide', s.direction === 1 && s.scroll() > 700 && !nav.classList.contains('open'));
  } });

  /* ---------- 1) HERO: image + type transitions ---------- */
  var slides = $$('.slide'), titles = $$('.t'), N = titles.length, cur = 0, busy = false;
  var ring = $('#hRing'), C = 189, ringTw = null, heroOn = true, hNum = $('#hNum');
  var tl$ = function (t) { return $$('.ln>*', t); };
  var heroUI = ['.hero-sub', '.hero-bar'];

  if (!reduce) { gsap.set(tl$(titles[0]), { opacity: 0 }); gsap.set(heroUI, { opacity: 0 }); }

  function startRing() {
    if (reduce) return;
    if (ringTw) ringTw.kill();
    gsap.set(ring, { strokeDashoffset: C });
    ringTw = gsap.to(ring, { strokeDashoffset: 0, duration: 7.5, ease: 'none', onComplete: function () { go((cur + 1) % N); } });
    if (!heroOn) ringTw.pause();
  }
  function go(to) {
    if (busy || to === cur) return; busy = true;
    if (ringTw) ringTw.kill();
    gsap.set(ring, { strokeDashoffset: C });
    var out = titles[cur], inn = titles[to], outS = slides[cur], inS = slides[to];
    var tl = gsap.timeline({ onComplete: function () { cur = to; busy = false; startRing(); } });
    tl.to(tl$(out), { scale: 1.9, filter: 'blur(26px)', opacity: 0, duration: 0.95, ease: 'power3.in', stagger: 0.06 }, 0)
      .set(out, { visibility: 'hidden' }, 0.98)
      .to(outS, { opacity: 0, duration: 1.3, ease: 'power2.inOut' }, 0.25)
      .fromTo(inS, { opacity: 0 }, { opacity: 1, duration: 1.3, ease: 'power2.inOut' }, 0.25)
      .fromTo($('img', inS), { scale: 1.2 }, { scale: 1.04, duration: 9, ease: 'power2.out' }, 0.25)
      .set(inn, { visibility: 'visible' }, 0.8)
      .fromTo(tl$(inn), { scale: 0.7, filter: 'blur(24px)', opacity: 0, y: 50 }, { scale: 1, filter: 'blur(0px)', opacity: 1, y: 0, duration: 1.5, ease: 'expo.out', stagger: 0.13 }, 0.8)
      .add(function () { hNum.textContent = '0' + (to + 1); }, 0.9);
  }
  $('#hNext').addEventListener('click', function () { go((cur + 1) % N); });
  (function () { var x0; var h = $('#hero');
    h.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    h.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 60) go(dx < 0 ? (cur + 1) % N : (cur + N - 1) % N); }, { passive: true });
  })();
  ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: 'bottom 40%', onToggle: function (s) {
    heroOn = s.isActive; if (ringTw) heroOn ? ringTw.play() : ringTw.pause();
  } });

  function playHero() {
    var tl = gsap.timeline();
    tl.fromTo('.slide[data-i="0"] img', { scale: 1.22 }, { scale: 1.04, duration: 9, ease: 'power2.out' }, 0)
      .fromTo(tl$(titles[0]), { scale: 0.72, filter: 'blur(26px)', opacity: 0, y: 50 }, { scale: 1, filter: 'blur(0px)', opacity: 1, y: 0, duration: 1.7, ease: 'expo.out', stagger: 0.14 }, 0.1)
      .to(heroUI, { opacity: 1, duration: 1.1, stagger: 0.15, ease: 'power2.out' }, 0.9)
      .add(startRing, 1.6);
    gsap.from('#hdr>*', { y: -30, opacity: 0, duration: 1, ease: 'expo.out', delay: 0.5, stagger: 0.08, clearProps: 'all' });
  }

  /* ---------- Intro ---------- */
  var intro = $('#intro'), seen = false;
  try { seen = sessionStorage.getItem('eln-intro') === '1'; } catch (e) {}
  function finishIntro() { document.body.classList.remove('lock'); intro.remove(); try { sessionStorage.setItem('eln-intro', '1'); } catch (e) {} }
  if (seen || reduce) {
    finishIntro();
    if (reduce) { gsap.set(heroUI.concat(tl$(titles[0])), { clearProps: 'all' }); } else { playHero(); }
  } else {
    document.body.classList.add('lock');
    var card = $('.intro-card');
    var itl = gsap.timeline({ onComplete: finishIntro });
    itl.from(card, { scale: 0.86, opacity: 0, duration: 1, ease: 'expo.out' })
       .from('.intro-tag', { opacity: 0, y: 10, duration: 0.6 }, 0.5)
       .to(intro, { backgroundPositionX: '-192px', duration: 2.2, ease: 'power1.inOut' }, 0)
       .to(card, { scale: 1.08, opacity: 0, duration: 0.7, ease: 'power3.in' }, 1.7)
       .to(intro, { yPercent: -100, duration: 1.15, ease: 'expo.inOut' }, 2.0)
       .add(playHero, 2.35);
    $('#skip').addEventListener('click', function () { itl.timeScale(3.2); });
    setTimeout(function () { if (document.body.classList.contains('lock')) itl.progress(1); }, 6500);
  }

  /* ---------- Scroll motion ---------- */
  if (!reduce) {
    var mobile = function () { return window.innerWidth < 981; };

    // 3) Editorial parallax: hero/close images, drifting lines, layers at different speeds
    $$('[data-parallax]').forEach(function (el) {
      var sec = el.parentElement.classList.contains('hero') || el.parentElement.classList.contains('close') ? el.parentElement : el.parentElement;
      var isHero = sec.classList.contains('hero');
      gsap.fromTo(el, { yPercent: isHero ? 0 : -6 }, { yPercent: isHero ? 7 : 6, ease: 'none',
        scrollTrigger: { trigger: sec, start: isHero ? 'top top' : 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('h2').forEach(function (h) {
      var lines = $$('[data-line]', h); if (!lines.length) return;
      gsap.fromTo(lines, { yPercent: 115, opacity: 1 }, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.12,
        scrollTrigger: { trigger: h, start: 'top 86%', once: true } });
    });
    $$('.ln[data-x]').forEach(function (ln) {
      var d = +ln.getAttribute('data-x') * (mobile() ? 0.4 : 1);
      gsap.fromTo(ln, { x: d }, { x: -d, ease: 'none', scrollTrigger: { trigger: ln, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('[data-reveal]').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('[data-mask]').forEach(function (f) {
      gsap.fromTo(f, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut',
        scrollTrigger: { trigger: f, start: 'top 88%', once: true } });
    });
    $$('[data-y]').forEach(function (el) {
      var d = +el.getAttribute('data-y') * (mobile() ? 0.35 : 1);
      gsap.fromTo(el, { y: d }, { y: -d, ease: 'none', scrollTrigger: { trigger: '.ed', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('[data-count]').forEach(function (b) {
      var end = +b.getAttribute('data-count'), o = { v: 0 };
      b.textContent = '0';
      ScrollTrigger.create({ trigger: b, start: 'top 92%', once: true, onEnter: function () {
        gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', onUpdate: function () { b.textContent = Math.round(o.v); } });
      } });
    });

    var mq = $('.mq-track');
    if (mq && mq.getAnimations) {
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (s) {
        var v = Math.min(Math.abs(s.getVelocity()) / 400, 6);
        mq.getAnimations().forEach(function (a) { a.playbackRate = 1 + v; });
        clearTimeout(mq._t); mq._t = setTimeout(function () { mq.getAnimations().forEach(function (a) { a.playbackRate = 1; }); }, 120);
      } });
    }

    // Menu del día: price count-up + drifting pattern
    var pe = $('[data-price]'), po = { v: 0 };
    pe.dataset.run = '1'; pe.textContent = fmtPrice(0);
    ScrollTrigger.create({ trigger: '.menu-card', start: 'top 80%', once: true, onEnter: function () {
      gsap.to(po, { v: 16.5, duration: 1.8, ease: 'power3.out', onUpdate: function () { pe.textContent = fmtPrice(po.v); } });
    } });
    gsap.fromTo('.menu-pat', { backgroundPositionY: '0px' }, { backgroundPositionY: '384px', ease: 'none',
      scrollTrigger: { trigger: '.menu', start: 'top bottom', end: 'bottom top', scrub: true } });

    var mm = gsap.matchMedia();

    // 2) Dish story: plate travels across the stage, garnish drifts on separate depth layers
    mm.add('(min-width:0px)', function () {
      var sec = $('#dishes'), pin = $('.dish-pin', sec);
      var plates = $$('.plate', sec), copies = $$('.copy', sec), gars = $$('.gar', sec), n = plates.length;
      var word = $('#dWord'), num = $('#dNum');
      var colors = ['#0B4A3A', '#0A5A55', '#3D3A12', '#14281F'];
      var ax = function (i) { return mobile() ? 0 : (i % 2 === 0 ? 1 : -1) * window.innerWidth * 0.21; };
      var ay = function () { return mobile() ? -window.innerHeight * 0.13 : 0; };
      var lead = 1, step = 1.7, trans = 0.9;

      gsap.set(copies.slice(1), { autoAlpha: 0, y: 40 });
      gsap.set(plates[0], { x: ax(0), y: ay(), scale: 1, rotation: 0 });

      var tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
      for (var i = 1; i < n; i++) {
        (function (i) {
          var t = lead + (i - 1) * step;
          tl.to(plates[i - 1], { x: function () { return ax(i - 1) + (ax(i - 1) > 0 ? 1 : -1) * window.innerWidth * 0.1; }, y: function () { return ay() + window.innerHeight * 0.22; }, rotation: -75, scale: 0.55, autoAlpha: 0, duration: trans }, t)
            .fromTo(plates[i], { x: function () { return ax(i) + (ax(i) > 0 ? 1 : -1) * window.innerWidth * 0.12; }, y: function () { return ay() - window.innerHeight * 0.2; }, rotation: 75, scale: 0.55, autoAlpha: 0 },
                    { x: function () { return ax(i); }, y: ay, rotation: 0, scale: 1, autoAlpha: 1, duration: trans }, t + 0.12)
            .to(copies[i - 1], { autoAlpha: 0, y: -34, duration: trans * 0.6 }, t)
            .to(copies[i], { autoAlpha: 1, y: 0, duration: trans * 0.7 }, t + 0.3);
        })(i);
      }
      var total = lead + (n - 1) * step + 0.5;
      gars.forEach(function (g, k) {
        var d = +g.getAttribute('data-d'), dir = k % 2 ? 1 : -1;
        tl.to(g, { x: function () { return dir * d * window.innerWidth * 0.085; }, y: function () { return ((k % 3) - 1) * d * window.innerHeight * 0.17; }, rotation: dir * d * 230, duration: total, ease: 'none' }, 0);
      });
      tl.fromTo(word, { xPercent: 6 }, { xPercent: -24, duration: total, ease: 'none' }, 0);

      var cur = -1;
      ScrollTrigger.create({
        trigger: sec, start: 'top top', end: '+=' + (mobile() ? 300 : 380) + '%',
        pin: pin, pinSpacing: true, scrub: 0.8, animation: tl, invalidateOnRefresh: true,
        onUpdate: function () {
          var t = tl.time();
          var idx = t < lead + 0.45 ? 0 : Math.min(n - 1, Math.floor((t - lead - 0.45) / step) + 1);
          if (idx !== cur) {
            cur = idx;
            word.textContent = copies[idx].getAttribute('data-word');
            num.textContent = '0' + (idx + 1);
            sec.style.setProperty('--dbg', colors[idx]);
          }
        }
      });
      return function () { sec.style.removeProperty('--dbg'); };
    });

    // Locations: controlled horizontal travel on desktop, native swipe elsewhere
    mm.add('(min-width:981px)', function () {
      var loc = $('.loc'), track = $('#locTrack');
      track.style.overflow = 'visible'; track.style.scrollSnapType = 'none';
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 40); };
      gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: loc, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.6, invalidateOnRefresh: true } });
      return function () { track.style.overflow = ''; track.style.scrollSnapType = ''; };
    });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { crops.forEach(applyCrop); ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { crops.forEach(applyCrop); ScrollTrigger.refresh(); });
})();
