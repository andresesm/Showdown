const boxes = document.querySelectorAll('.team-box');

function addDragEvents(sprite) {
  sprite.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('name', sprite.dataset.name);
    e.dataTransfer.setData('src', sprite.src);
  });
}

function capitalizeName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
}

boxes.forEach(box => {
  box.addEventListener('dragover', e => e.preventDefault());
  box.addEventListener('drop', e => {
    e.preventDefault();
    const name = e.dataTransfer.getData('name');
    const src = e.dataTransfer.getData('src');
    const img = document.createElement('img');
    img.src = src;
    img.alt = name;
    img.className = 'sprite';
    addDragEvents(img);
    box.appendChild(img);

    // Punto 3: Deshabilitar el sprite original en la lista
    const container = document.getElementById('pokemon-list');
    const original = container.querySelector(`img[data-name="${name}"]`);
    if (original) {
      original.classList.add('disabled');
    }
  });
});

fetch('./pklist.json')
  .then(res => res.json())
  .then(pokemonList => {
    const container = document.getElementById('pokemon-list');
    pokemonList.forEach(name => {
      const img = document.createElement('img');
      img.src = `assets/pokemonsprites/${name}.png`;
      img.alt = name;
      img.title = capitalizeName(name);
      img.draggable = true;
      img.className = 'sprite';
      img.dataset.name = name;
      addDragEvents(img);
      container.appendChild(img);
    });
  })
  .catch(err => console.error('Error cargando lista de Pokémon:', err));

  const searchInput = document.getElementById('pokemon-search');
searchInput.addEventListener('input', () => {
  const filter = searchInput.value.toLowerCase();
  const container = document.getElementById('pokemon-list');
  Array.from(container.children).forEach(img => {
    const name = img.dataset.name.toLowerCase();
    if (name.includes(filter)) {
      img.style.display = '';
    } else {
      img.style.display = 'none';
    }
  });
});