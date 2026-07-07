/* six pokemon wandering the hero box. hit-testing rasterizes the drawn
    fill svg (same geometry as the ::before mask: hero box + inset) and
    samples its alpha, so movement respects the irregular shape, not its bbox. */
(function () {
    var hero = document.querySelector('.hero.sketch-box');
    if (!hero || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var MONS = ['venusaur', 'jolteon', 'gengar', 'lucario', 'latios', 'lapras'];
    var DIRS = ['front', 'back', 'left', 'right'];
    var INSET = 10; /* keep in sync with .hero --sketch-inset */

    /* 2x on desktop, smaller on phones (1.5 lands on whole device px at 2-3x dpr) */
    function scaleNow() {
        return matchMedia('(max-width: 768px)').matches ? 1.5 : 2;
    }

    var W, H, alpha, aw, ah;
    var mons = [];
    var fillImg = new Image(), strokeImg = new Image();
    var mFillImg = new Image(), mStrokeImg = new Image();

    function buildShape() {
        W = hero.offsetWidth; H = hero.offsetHeight;
        alpha = null;
        /* mobile swaps in its own squarer drawing (Mobileherobox) */
        var mobile = matchMedia('(max-width: 768px)').matches;
        var fill = mobile ? mFillImg : fillImg;
        var stroke = mobile ? mStrokeImg : strokeImg;
        aw = W + 2 * INSET; ah = H + 2 * INSET;
        var c = document.createElement('canvas');
        c.width = aw; c.height = ah;
        var ctx = c.getContext('2d');
        try {
            ctx.drawImage(fill, 0, 0, aw, ah);
            /* punch the drawn line out of the interior, dilated 3px in every
               direction — stretched non-uniformly (mobile), the thin ink can
               antialias below the alpha threshold and sprites kiss the line */
            ctx.globalCompositeOperation = 'destination-out';
            for (var dx = -3; dx <= 3; dx += 3)
                for (var dy = -3; dy <= 3; dy += 3)
                    ctx.drawImage(stroke, dx, dy, aw, ah);
            var d = ctx.getImageData(0, 0, aw, ah).data;
            /* blank center = svg didn't rasterize -> keep rect fallback */
            if (d[((ah >> 1) * aw + (aw >> 1)) * 4 + 3]) alpha = d;
        } catch (e) { }
    }

    function inside(x, y) {
        /* no shape map (svg failed to rasterize) — stay well clear of the
           drawn border's inward wobble instead of roaming edge-to-edge */
        if (!alpha) return x > 14 && y > 14 && x < W - 14 && y < H - 14;
        x = (x + INSET) | 0; y = (y + INSET) | 0;
        return x >= 0 && y >= 0 && x < aw && y < ah && alpha[(y * aw + x) * 4 + 3] > 127;
    }

    /* walk the sprite rect's perimeter (plus a margin) every STEP px — the
       hand-drawn edge wobbles too much for corner checks alone */
    var MARGIN = 3, STEP = 8;
    function fits(x, y, w, h) {
        var x0 = x - MARGIN, y0 = y - MARGIN, x1 = x + w + MARGIN, y1 = y + h + MARGIN, i;
        for (i = x0; ; i = Math.min(i + STEP, x1)) {
            if (!inside(i, y0) || !inside(i, y1)) return false;
            if (i === x1) break;
        }
        for (i = y0; ; i = Math.min(i + STEP, y1)) {
            if (!inside(x0, i) || !inside(x1, i)) return false;
            if (i === y1) break;
        }
        return true;
    }

    function spawn(i, w, h) {
        /* try the sprite's own cell of a 3x2 grid first so they spread out */
        for (var t = 0; t < 60; t++) {
            var x = t < 40 ? (i % 3 + Math.random()) / 3 * (W - w) : Math.random() * (W - w);
            var y = t < 40 ? ((i / 3 | 0) + Math.random()) / 2 * (H - h) : Math.random() * (H - h);
            if (fits(x, y, w, h)) return { x: x, y: y };
        }
        return { x: (W - w) / 2, y: (H - h) / 2 };
    }

    function turn(m) {
        var a = Math.random() * 2 * Math.PI, s = 12 + Math.random() * 24;
        m.vx = Math.cos(a) * s; m.vy = Math.sin(a) * s;
        m.turnT = 2 + Math.random() * 4;
    }

    function addMon(name, i) {
        var frames = {}, left = DIRS.length * 2;
        DIRS.forEach(function (d) {
            [1, 2].forEach(function (f) {
                var im = new Image();
                im.onload = im.onerror = function () { if (!--left) ready(); };
                im.src = '/static/sprites/' + name + 'sprites/' + name + d + f + '.png';
                frames[d + f] = im;
            });
        });
        function ready() {
            var nw = 0, nh = 0; /* box = widest/tallest frame, so no tail pokes out */
            for (var k in frames) {
                nw = Math.max(nw, frames[k].naturalWidth);
                nh = Math.max(nh, frames[k].naturalHeight);
            }
            if (!nw) return;
            var s = scaleNow();
            var el = document.createElement('img');
            el.className = 'hero-sprite';
            el.alt = '';
            el.width = nw;   /* fixed box (see .hero-sprite object-fit) */
            el.height = nh;
            el.src = frames.front1.src;
            hero.appendChild(el);
            var p = spawn(i, nw * s, nh * s);
            var m = { el: el, frames: frames, x: p.x, y: p.y, nw: nw, nh: nh,
                      w: nw * s, h: nh * s, s: s,
                      frame: 1, frameT: Math.random(), cur: 'front1' };
            turn(m);
            mons.push(m);
        }
    }

    function tick(dt) {
        for (var j = 0; j < mons.length; j++) {
            var m = mons[j];
            if ((m.turnT -= dt) < 0) turn(m);
            var nx = m.x + m.vx * dt, ny = m.y + m.vy * dt;
            if (!fits(nx, m.y, m.w, m.h)) { m.vx = -m.vx; nx = m.x; }
            if (!fits(nx, ny, m.w, m.h)) { m.vy = -m.vy; ny = m.y; }
            m.x = nx; m.y = ny;
            if (!fits(m.x, m.y, m.w, m.h)) { /* stranded (resize) -> drift home */
                m.x += (W / 2 - m.x) * dt;
                m.y += (H / 2 - m.y) * dt;
            }
            if ((m.frameT -= dt) < 0) { m.frame = 3 - m.frame; m.frameT = 0.28; }
            var dir = Math.abs(m.vx) > Math.abs(m.vy)
                ? (m.vx > 0 ? 'right' : 'left')
                : (m.vy > 0 ? 'front' : 'back');
            if (dir + m.frame !== m.cur) {
                m.cur = dir + m.frame;
                m.el.src = m.frames[m.cur].src;
            }
            /* whole-px snap: fractional offsets make pixelated art shimmer */
            m.el.style.transform = 'translate(' + Math.round(m.x) + 'px,'
                + Math.round(m.y) + 'px) scale(' + m.s + ')';
        }
    }

    var pending = 4;
    var boxImgs = [fillImg, strokeImg, mFillImg, mStrokeImg];
    boxImgs.forEach(function (im) {
        im.onload = im.onerror = function () {
            if (--pending) return;
            buildShape();
            MONS.forEach(addMon);
            var last;
            requestAnimationFrame(function loop(t) {
                tick(Math.min((t - (last || t)) / 1000, 0.05));
                last = t;
                requestAnimationFrame(loop);
            });
        };
    });
    fillImg.src = '/static/svgs/Herobox-fill.svg';
    strokeImg.src = '/static/svgs/Herobox.svg';
    mFillImg.src = '/static/svgs/Mobileherobox-fill.svg';
    mStrokeImg.src = '/static/svgs/Mobileherobox.svg';

    /* the hero resizes without a window resize event too (webfont swap
       changes text metrics) — the shape canvas must follow or it drifts
       out of sync with the stretched mask and sprites cross the border */
    var rt;
    new ResizeObserver(function () {
        clearTimeout(rt);
        rt = setTimeout(function () {
            if (hero.offsetWidth === W && hero.offsetHeight === H) return;
            var ow = W, oh = H, s = scaleNow();
            buildShape();
            mons.forEach(function (m) {
                m.s = s; m.w = m.nw * s; m.h = m.nh * s;
                m.x *= W / ow; m.y *= H / oh;
            });
        }, 100);
    }).observe(hero);
})();
