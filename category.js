// Builds a category page from articles.json.
// URL looks like: category.html?c=News
// With no ?c=..., it lists every article (used by "More Latest").

// How many stories show before the "Load more" button.
const PAGE_SIZE = 12;

const params = new URLSearchParams(window.location.search);
const requested = params.get('c'); // null means "all articles"

const titleEl = document.getElementById('category-title');
const countEl = document.getElementById('category-count');
const storyList = document.getElementById('story-list');
const messageEl = document.getElementById('category-message');
const moreButton = document.getElementById('load-more');

// ---------- helpers ----------

// Make an element. textContent (not innerHTML) keeps article text from injecting HTML.
function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(iso) {
  return parseDate(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function formatAuthors(list) {
  if (!list || list.length === 0) return '';
  if (list.length === 1) return list[0];
  if (list.length === 2) return list.join(' and ');
  return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1];
}

function excerptOf(a) {
  if (a.excerpt) return a.excerpt;
  if (a.subtitle) return a.subtitle;
  const first = (a.body || []).find(p => typeof p === 'string') || '';
  return first.length > 160 ? first.slice(0, 157).trimEnd() + '…' : first;
}

function link(href, className) {
  const a = make('a', className);
  a.href = href;
  return a;
}

function showMessage(text) {
  messageEl.textContent = text;
  messageEl.hidden = false;
}

// Underline the nav link for the category being viewed.
function highlightNav() {
  document.querySelectorAll('.nav-list a').forEach(a => {
    // Read the raw href (a.href would add this page's own ?c=... to a link like "#")
    const c = new URL(a.getAttribute('href'), 'http://example.com/').searchParams.get('c');
    const isCurrent = requested !== null && c !== null && c.toLowerCase() === requested.toLowerCase();
    a.classList.toggle('active', isCurrent);
  });
}

// ---------- one row in the list ----------

function makeStory(a) {
  const url = 'article.html?id=' + encodeURIComponent(a.id);
  const row = make('li', 'story');

  const photoLink = link(url, 'story-photo');
  if (a.image && a.image.src) {
    const img = make('img');
    img.src = a.image.src;
    img.alt = a.image.alt || '';
    img.loading = 'lazy';
    photoLink.appendChild(img);
  } else {
    photoLink.appendChild(make('div', 'photo-placeholder', 'PHOTO'));
  }
  row.appendChild(photoLink);

  const text = make('div', 'story-text');
  text.appendChild(make('p', 'category', a.category));

  const h2 = make('h2');
  const titleLink = link(url);
  titleLink.textContent = a.title;
  h2.appendChild(titleLink);
  text.appendChild(h2);

  text.appendChild(make('p', 'excerpt', excerptOf(a)));

  const authors = a.authors && a.authors.length ? 'By ' + formatAuthors(a.authors) : '';
  text.appendChild(make('p', 'byline', [authors, formatDate(a.date)].filter(Boolean).join(' · ')));
  row.appendChild(text);

  return row;
}

// ---------- load ----------

async function loadCategory() {
  highlightNav();
  try {
    const res = await fetch('articles.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    // Newest first, then keep only the requested category (if any)
    let articles = data.articles.slice().sort((a, b) => parseDate(b.date) - parseDate(a.date));
    if (requested) {
      articles = articles.filter(a => (a.category || '').toLowerCase() === requested.toLowerCase());
    }

    // Use the capitalization from the articles themselves if there is one
    const heading = requested ? (articles[0] ? articles[0].category : requested) : 'Latest';
    titleEl.textContent = heading;
    document.title = heading + ' | The Prestige';

    if (articles.length === 0) {
      countEl.textContent = '';
      return showMessage('No stories in this section yet.');
    }
    countEl.textContent = articles.length === 1 ? '1 story' : articles.length + ' stories';

    let shown = 0;
    function showMore() {
      articles.slice(shown, shown + PAGE_SIZE).forEach(a => storyList.appendChild(makeStory(a)));
      shown = Math.min(shown + PAGE_SIZE, articles.length);
      moreButton.hidden = shown >= articles.length;
    }
    moreButton.addEventListener('click', showMore);
    showMore();
  } catch (err) {
    console.error(err);
    titleEl.textContent = 'Stories';
    showMessage('Could not load articles. If you opened this file directly, run it with Live Server instead.');
  }
}

loadCategory();