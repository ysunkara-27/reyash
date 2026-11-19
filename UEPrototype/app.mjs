import { careers } from './careers.mjs';
import { benefits } from './benefits.mjs';

const app = document.querySelector('#app');
const unavailable = document.querySelector('#unavailable');
const showUnavailable = () => unavailable.showModal();

function render() {
  const [area, page, id] = (location.hash.slice(1) || 'home').split('/');
  if (unavailable.open) unavailable.close();
  document.body.className = area;
  if (area === 'careers') careers(app, page, id);
  else if (area === 'benefits') benefits(app, page, id);
  else {
    document.body.className = 'launcher-page';
    document.title = 'UE Prototype';
    app.innerHTML = `<main class="launcher">
      <h1>UE Prototype</h1>
      <nav aria-label="Prototype tasks">
        <a class="primary" href="/ProviderTask/">Provider</a>
        <a class="primary" href="#careers">Careers</a>
        <a class="primary" href="#benefits">Benefits and Assistance</a>
      </nav>
    </main>`;
  }
  window.scrollTo(0, 0);
}

app.addEventListener('click', event => {
  if (event.target.closest('[data-unavailable]')) showUnavailable();
});
unavailable.addEventListener('click', event => {
  if (event.target === unavailable) unavailable.close();
});
window.addEventListener('hashchange', render);
render();
