// Builds an article page from articles.json.
// URL looks like: article.html?id=first-story

const root = document.getElementById('article');
const id = new URLSearchParams(window.location.search).get('id');

// Small helper: make an element, optionally with a class and text.
// Using textContent (not innerHTML) means article text can never inject HTML.
function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

// "2026-10-26" -> "October 26, 2026" (built from parts to avoid time zone shifts)
function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ["A"] -> "A"   ["A","B"] -> "A and B"   ["A","B","C"] -> "A, B, and C"
function formatAuthors(list) {
  if (list.length <= 1) return list.join('');
  if (list.length === 2) return list.join(' and ');
  return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1];
}

// A photo with optional caption and credit. No src -> striped placeholder.
function makeFigure(src, alt, caption, credit, extraClass) {
  const fig = make('figure', 'article-figure ' + (extraClass || ''));
  if (src) {
    const img = make('img');
    img.src = src;
    img.alt = alt || '';
    fig.appendChild(img);
  } else {
    fig.appendChild(make('div', 'photo-placeholder article-figure-placeholder', 'PHOTO'));
  }
  if (caption || credit) {
    const cap = make('figcaption');
    cap.textContent = [caption, credit && 'Photo by ' + credit].filter(Boolean).join(' ');
    fig.appendChild(cap);
  }
  return fig;
}

function render(a) {
  document.title = a.title + ' | The Prestige';
  root.replaceChildren();

  // Header: category, title, subtitle, byline
  root.appendChild(make('p', 'category', a.category));
  root.appendChild(make('h1', 'article-title', a.title));
  if (a.subtitle) root.appendChild(make('p', 'article-subtitle', a.subtitle));

  const authors = a.authors && a.authors.length ? 'By ' + formatAuthors(a.authors) : '';
  const meta = [authors, formatDate(a.date)].filter(Boolean).join(' · ');
  root.appendChild(make('p', 'article-meta', meta));

  // Main photo
  const img = a.image || {};
  root.appendChild(makeFigure(img.src, img.alt, img.caption, img.credit, 'article-hero'));

  // Story: strings are paragraphs, objects with "image" are inline photos
  const body = make('div', 'article-body');
  a.body.forEach(item => {
    if (typeof item === 'string') {
      body.appendChild(make('p', '', item));
    } else if (item.image) {
      body.appendChild(makeFigure(item.image, item.alt, item.caption, item.credit));
    }
  });
  root.appendChild(body);
}

function showMessage(text) {
  root.replaceChildren(make('p', 'article-message', text));
}

async function load() {
  if (!id) return showMessage('No article selected.');
  try {
    const res = await fetch('articles.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const article = data.articles.find(a => a.id === id);
    if (!article) return showMessage('Sorry, we could not find that article.');
    render(article);
  } catch (err) {
    console.error(err);
    showMessage('Could not load the article. If you opened this file directly, run it with Live Server instead.');
  }
}

load();