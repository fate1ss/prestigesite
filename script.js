// Show today's date in the top bar
const today = document.getElementById('today');
if (today) {
  today.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}
 
// Footer year (only if the element exists)
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
 
// Mobile menu toggle
const toggle = document.querySelector('.menu-toggle');
const navList = document.getElementById('nav-list');
if (toggle && navList) {
  toggle.addEventListener('click', () => {
    const open = navList.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
}
 
