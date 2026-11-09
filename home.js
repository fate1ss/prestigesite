// Fills the homepage from articles.json.
//
// Rules:
//  - Lead story: the newest article marked "featured": true (or just the newest).
//  - Latest: the 5 newest articles after the lead.
//  - News and Sports grids: the 4 newest in each category.
//  - Section Three: the newest in that category is the lead, the next 4 are the list.

// Which category the third section shows. Keep the heading in index.html in sync.
const SECTION_THREE_CATEGORY = 'Opinion';

const byId = id => document.getElementById(id);

// ---------- helpers ----------

// Make an element. textContent (not innerHTML) keeps article text from injecting HTML.
function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

// "2026-10-26" -> a Date at local midnight (avoids time zone shifts)
function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(iso) {
  return parseDate(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

// "Today", "Yesterday", "3 days ago", or the full date after a week
function relativeDay(iso) {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((midnight - parseDate(iso)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return days + ' days ago';
  return formatDate(iso);
}

function formatAuthors(list) {
  if (!list || list.length === 0) return '';
  if (list.length === 1) return list[0];
  if (list.length === 2) return list.join(' and ');
  return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1];
}

function byline(a) {
  return a.authors && a.authors.length ? 'By ' + formatAuthors(a.authors) : '';
}

// Summary text: "excerpt" if given, else the subtitle, else the start of the story.
function excerptOf(a) {
  if (a.excerpt) return a.excerpt;
  if (a.subtitle) return a.subtitle;
  const first = (a.body || []).find(p => typeof p === 'string') || '';
  return first.length > 160 ? first.slice(0, 157).trimEnd() + '…' : first;
}

function urlOf(a) {
  return 'article.html?id=' + encodeURIComponent(a.id);
}

// The article's photo, or the striped placeholder if it has none.
function photo(a, placeholderClass) {
  const src = a.image && a.image.src;
  if (src) {
    const img = make('img');
    img.src = src;
    img.alt = (a.image && a.image.alt) || '';
    return img;
  }
  return make('div', 'photo-placeholder ' + placeholderClass, 'PHOTO');
}

function link(href, className) {
  const a = make('a', className);
  a.href = href;
  return a;
}

function inCategory(list, category) {
  return list.filter(a => (a.category || '').toLowerCase() === category.toLowerCase());
}

function showEmpty(el, text) {
  el.replaceChildren(make('p', 'empty-message', text || 'No stories yet.'));
}

// ---------- renderers ----------

// Big story: photo, category, headline, byline, summary
function renderLead(el, a) {
  if (!a) return showEmpty(el);
  const url = urlOf(a);
  el.replaceChildren();

  const photoLink = link(url);
  photoLink.appendChild(photo(a, 'lead-photo'));
  el.appendChild(photoLink);

  el.appendChild(make('p', 'category', a.category));

  const h2 = make('h2');
  const titleLink = link(url);
  titleLink.textContent = a.title;
  h2.appendChild(titleLink);
  el.appendChild(h2);

  el.appendChild(make('p', 'byline', [byline(a), formatDate(a.date)].filter(Boolean).join(' · ')));
  el.appendChild(make('p', 'excerpt', excerptOf(a)));
}

// Small rows with a thumbnail: used for "Latest" and Section Three
function renderList(ul, list) {
  if (list.length === 0) return showEmpty(ul);
  ul.replaceChildren();
  list.forEach(a => {
    const url = urlOf(a);
    const li = make('li');

    const thumb = link(url, 'thumb');
    thumb.appendChild(photo(a, 'thumb-photo'));
    li.appendChild(thumb);

    const text = make('div', 'latest-text');
    text.appendChild(make('p', 'category', a.category));
    const titleLink = link(url);
    titleLink.textContent = a.title;
    text.appendChild(titleLink);
    text.appendChild(make('span', 'time', relativeDay(a.date)));
    li.appendChild(text);

    ul.appendChild(li);
  });
}

// Cards in a grid: used for the News and Sports sections
function renderCards(grid, list) {
  if (list.length === 0) return showEmpty(grid);
  grid.replaceChildren();
  list.forEach(a => {
    const url = urlOf(a);
    const card = make('article', 'card');

    const photoLink = link(url);
    photoLink.appendChild(photo(a, 'article-photo'));
    card.appendChild(photoLink);

    const h4 = make('h4');
    const titleLink = link(url);
    titleLink.textContent = a.title;
    h4.appendChild(titleLink);
    card.appendChild(h4);

    card.appendChild(make('p', 'byline', byline(a)));
    grid.appendChild(card);
  });
}

// ---------- load ----------

async function loadHome() {
  try {
    const res = await fetch('articles.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    // Newest first
    const all = data.articles.slice().sort((a, b) => parseDate(b.date) - parseDate(a.date));
    const lead = all.find(a => a.featured) || all[0];
    const rest = all.filter(a => a !== lead);

    renderLead(byId('lead'), lead);
    renderList(byId('latest-list'), rest.slice(0, 5));
    renderCards(byId('news-grid'), inCategory(rest, 'News').slice(0, 4));
    renderCards(byId('sports-grid'), inCategory(rest, 'Sports').slice(0, 4));

    const three = inCategory(rest, SECTION_THREE_CATEGORY);
    renderLead(byId('three-lead'), three[0]);
    renderList(byId('three-list'), three.slice(1, 5));
  } catch (err) {
    console.error(err);
    showEmpty(byId('lead'), 'Could not load articles. If you opened this file directly, run it with Live Server instead.');
  }
}

loadHome();