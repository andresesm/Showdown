const teamBoxes = document.querySelectorAll('.team-box-content');
const pokemonContainer = document.getElementById('pokemon-list');

// drag común
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

// drop en cajas
teamBoxes.forEach(box => {
  box.addEventListener('dragover', e => e.preventDefault());
  box.addEventListener('drop', e => {
    e.preventDefault();

    const name = e.dataTransfer.getData('name');
    const src = e.dataTransfer.getData('src');
    const from = e.dataTransfer.getData('from');

    // límite por caja
    if (box.children.length >= 6) {
      alert('No puedes agregar más de 6 pokémones en un equipo.');
      return;
    }

    const alreadyInTeam = Array.from(box.children).some(child => child.dataset.name === name);
    if (alreadyInTeam) {
      alert('Este Pokémon ya está en este equipo.');
      return;
    }

    // quitar de caja anterior si venía de otra
    if (from.startsWith('team-')) {
      const fromBoxIndex = from.split('-')[1];
      const fromBox = document.querySelector(`.team-box-content[data-box-content="${fromBoxIndex}"]`);
      if (fromBox) {
        const existing = fromBox.querySelector(`img[data-name="${name}"]`);
        if (existing) fromBox.removeChild(existing);
      }
    }

    // crear sprite en nueva caja
    const index = box.dataset.boxContent;
    const img = document.createElement('img');
    img.src = src;
    img.alt = name;
    img.title = capitalizeName(name);
    img.className = 'sprite';
    img.dataset.name = name;
    img.dataset.location = `team-${index}`;
    img.draggable = true;
    addDragEvents(img);
    box.appendChild(img);

    // deshabilitar en pool
    const original = pokemonContainer.querySelector(`img[data-name="${name}"]`);
    if (original) original.classList.add('disabled');
  });
});

// drop en contenedor principal (devolver)
pokemonContainer.addEventListener('dragover', e => e.preventDefault());
pokemonContainer.addEventListener('drop', e => {
  e.preventDefault();
  const name = e.dataTransfer.getData('name');
  const src = e.dataTransfer.getData('src');
  const from = e.dataTransfer.getData('from');

  if (from.startsWith('team-')) {
    const fromBoxIndex = from.split('-')[1];
    const fromBox = document.querySelector(`.team-box-content[data-box-content="${fromBoxIndex}"]`);
    if (fromBox) {
      const existing = fromBox.querySelector(`img[data-name="${name}"]`);
      if (existing) fromBox.removeChild(existing);
    }
  }

  const original = pokemonContainer.querySelector(`img[data-name="${name}"]`);
  if (original) {
    original.classList.remove('disabled');
  } else {
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

// carga inicial
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

// buscador
const searchInput = document.getElementById('pokemon-search');
searchInput.addEventListener('input', () => {
  const filter = searchInput.value.toLowerCase();
  Array.from(pokemonContainer.children).forEach(img => {
    const name = img.dataset.name.toLowerCase();
    img.style.display = name.includes(filter) ? '' : 'none';
  });
});

// botón ocultar/mostrar caja
document.querySelectorAll('.toggle-box-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const index = btn.dataset.boxToggle;
    const box = document.querySelector(`.team-box[data-box="${index}"]`);
    if (!box) return;
    box.classList.toggle('collapsed');
  });
});

// botón vaciar caja (papelera)
document.querySelectorAll('.clear-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const index = btn.dataset.boxClear;
    const box = document.querySelector(`.team-box-content[data-box-content="${index}"]`);
    if (!box) return;

    const sprites = Array.from(box.children);
    sprites.forEach(sprite => {
      const name = sprite.dataset.name;
      box.removeChild(sprite);
      const original = pokemonContainer.querySelector(`img[data-name="${name}"]`);
      if (original) original.classList.remove('disabled');
    });
  });
});