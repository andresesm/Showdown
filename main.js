const boxes = document.querySelectorAll('.team-box-content');

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

    if (box.children.length >= 6) {
      alert('No puedes agregar más de 6 pokémones en un equipo.');
      return;
    }

    const name = e.dataTransfer.getData('name');
    const src = e.dataTransfer.getData('src');

    // No agregar si ya está en el equipo
    const alreadyInTeam = Array.from(box.children).some(child => child.dataset.name === name);
    if (alreadyInTeam) {
      alert('Este Pokémon ya está en el equipo.');
      return;
    }

    const img = document.createElement('img');
    img.src = src;
    img.alt = name;
    img.className = 'sprite';
    img.dataset.name = name;
    addDragEvents(img);
    box.appendChild(img);

    // Deshabilitar en el listado principal
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

// Buscador en tiempo real
const searchInput = document.getElementById('pokemon-search');
searchInput.addEventListener('input', () => {
  const filter = searchInput.value.toLowerCase();
  const container = document.getElementById('pokemon-list');
  Array.from(container.children).forEach(img => {
    const name = img.dataset.name.toLowerCase();
    img.style.display = name.includes(filter) ? '' : 'none';
  });
});