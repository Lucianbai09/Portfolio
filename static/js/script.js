// theme cycles light → brown → dark
function toggleTheme() {
    const modes = ['', 'brown', 'dark'];
    const cur = document.body.classList.contains('dark') ? 'dark'
            : document.body.classList.contains('brown') ? 'brown' : '';
    const next = modes[(modes.indexOf(cur) + 1) % modes.length];
    document.body.classList.remove('brown', 'dark');
    if (next) document.body.classList.add(next);
    localStorage.setItem('theme', next);
}

// favourites carousel — all cards pre-rendered; Spotify iframes are created
// the first time a card is shown and never destroyed (reload stops playback)
const carousels = {};

function initCarousel(id, items) {
    const track = document.querySelector('#carousel-' + id + ' .carousel-track');
    items.forEach(function(item) {
        const card = document.createElement('div');
        card.className = 'fav-card' + (item.embed ? ' spotify-card' : '');
        if (item.embed) {
            card.dataset.embed = item.embed;
        } else {
            if (item.link) {
                card.classList.add('fav-card--linked');
                card.onclick = function() { window.open(item.link, '_blank'); };
            }
            const sub = item.description || '';
            const imgHtml = item.image ? '<img src="/static/images/' + item.image + '" alt="' + item.name + '" loading="lazy">' : '';
            card.innerHTML = '<div class="fav-card-img">' + imgHtml + '</div><div class="fav-card-info"><div class="fav-card-title">' + item.name + '</div>' + (sub ? '<div class="fav-card-sub">' + sub + '</div>' : '') + '</div>';
        }
        track.appendChild(card);
    });
    carousels[id] = { pos: 0, n: items.length, track: track, cards: Array.from(track.children) };
    applyOrder(id);
}

function applyOrder(id) {
    const c = carousels[id];
    // 1 card on mobile, 3 on desktop (must match the 768 breakpoint in style.css)
    const visible = window.innerWidth <= 768 ? 1 : 3;
    c.cards.forEach(function(card, i) {
        const rel = (i - c.pos + c.n) % c.n;
        const show = rel < visible;
        card.style.order = show ? rel : '';
        card.style.display = show ? '' : 'none';
        if (show && card.dataset.embed && !card.firstChild) {
            const iframe = document.createElement('iframe');
            iframe.src = card.dataset.embed + '?utm_source=generator';
            iframe.setAttribute('scrolling', 'no');
            iframe.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture');
            card.appendChild(iframe);
        }
    });
}

window.addEventListener('resize', function() {
    Object.keys(carousels).forEach(applyOrder);
});

function carouselMove(id, dir) {
    const c = carousels[id];
    c.pos = (c.pos + dir + c.n) % c.n;
    c.track.style.opacity = '0';
    setTimeout(function() { applyOrder(id); c.track.style.opacity = '1'; }, 150);
}