const teamBoxes = document.querySelectorAll('.team-box-content');
const pokemonContainer = document.getElementById('pokemon-list');

// Añade eventos de drag a un sprite
function addDragEvents(sprite) {
  sprite.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('name', sprite.dataset.name);
    e.dataTransfer.setData('src', sprite.src);
    e.dataTransfer.setData('from', sprite.dataset.location || 'pool'); // pool | team-1 | team-2
  });
}

function capitalizeName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
}

// Área de drop para cada caja de equipo
teamBoxes.forEach(box => {
  box.addEventListener('dragover', e => e.preventDefault());
  box.addEventListener('drop', e => {
    e.preventDefault();

    const name = e.dataTransfer.getData('name');
    const src = e.dataTransfer.getData('src');
    const from = e.dataTransfer.getData('from'); // de dónde venía

    // Límite de 6 por caja
    if (box.children.length >= 6) {
      alert('No puedes agregar más de 6 pokémones en un equipo.');
      return;
    }

    // Evitar duplicados en la misma caja
    const alreadyInTeam = Array.from(box.children).some(child => child.dataset.name === name);
    if (alreadyInTeam) {
      alert('Este Pokémon ya está en este equipo.');
      return;
    }

    // Si venía de otra caja, elimínalo de esa caja
    if (from.startsWith('team-')) {
      const fromBoxIndex = from.split('-')[1];
      const fromBox = document.querySelector(`.team-box-content[data-box-content="${fromBoxIndex}"]`);
      if (fromBox) {
        const existing = fromBox.querySelector(`img[data-name="${name}"]`);
        if (existing) fromBox.removeChild(existing);
      }
    }

    // Crear sprite en la nueva caja
    const img = document.createElement('img');
    img.src = src;
    img.alt = name;
    img.title = capitalizeName(name);
    img.className = 'sprite';
    img.dataset.name = name;
    img.dataset.location = `team-${box.dataset.boxContent}`;
    img.draggable = true;
    addDragEvents(img);
    box.appendChild(img);

    // Deshabilitar en la lista principal
    const original = pokemonContainer.querySelector(`img[data-name="${name}"]`);
    if (original) original.classList.add('disabled');
  });
});

// Área de drop para devolver pokémon al contenedor principal
pokemonContainer.addEventListener('dragover', e => e.preventDefault());
pokemonContainer.addEventListener('drop', e => {
  e.preventDefault();
  const name = e.dataTransfer.getData('name');
  const src = e.dataTransfer.getData('src');
  const from = e.dataTransfer.getData('from');

  // Si venía de una caja, quitarlo de la caja
  if (from.startsWith('team-')) {
    const fromBoxIndex = from.split('-')[1];
    const fromBox = document.querySelector(`.team-box-content[data-box-content="${fromBoxIndex}"]`);
    if (fromBox) {
      const existing = fromBox.querySelector(`img[data-name="${name}"]`);
      if (existing) fromBox.removeChild(existing);
    }
  }

  // Rehabilitar el sprite original en el pool
  const original = pokemonContainer.querySelector(`img[data-name="${name}"]`);
  if (original) {
    original.classList.remove('disabled');
  } else {
    // Si por algún motivo no está, lo creamos de nuevo
    const img = document.createElement('img');
    img.src = src;
    img.alt = name;
    img.title = capitalizeName(name);
    img.className = 'sprite';
    img.dataset.name = name;
    img.dataset.location = 'pool';
    img.draggable = true;
    addDragEvents(img);
    pokemonContainer.appendChild(img);
  }
});

// Carga inicial de sprites desde JSON
fetch('./pklist.json')
  .then(res => res.json())
  .then(pokemonList => {
    pokemonList.forEach(name => {
      const img = document.createElement('img');
      img.src = `assets/pokemonsprites/${name}.png`;
      img.alt = name;
      img.title = capitalizeName(name);
      img.draggable = true;
      img.className = 'sprite';
      img.dataset.name = name;
      img.dataset.location = 'pool';
      addDragEvents(img);
      pokemonContainer.appendChild(img);
    });
  })
  .catch(err => console.error('Error cargando lista de Pokémon:', err));

// Buscador en tiempo real
const searchInput = document.getElementById('pokemon-search');
searchInput.addEventListener('input', () => {
  const filter = searchInput.value.toLowerCase();
  Array.from(pokemonContainer.children).forEach(img => {
    const name = img.dataset.name.toLowerCase();
    img.style.display = name.includes(filter) ? '' : 'none';
  });
});