const teamBoxes = document.querySelectorAll('.team-box-content');
const pokemonContainer = document.getElementById('pokemon-list');
const TEAM_STATE_KEY = 'pokemon-teams-state-v1';

// ---------- utilidades ----------
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

function getStateFromDOM() {
  const boxes = [1, 2].map(i => {
    const boxContent = document.querySelector(`.team-box-content[data-box-content="${i}"]`);
    const titleEl = document.querySelector(`[data-box-title="${i}"]`);
    const names = Array.from(boxContent.children).map(img => img.dataset.name);
    return {
      id: i,
      title: titleEl ? titleEl.textContent.trim() : `Equipo ${i}`,
      pokemon: names
    };
  });
  return { boxes };
}

function applyStateToDOM(state) {
  if (!state || !state.boxes) return;

  // limpiar cajas
  [1, 2].forEach(i => {
    const boxContent = document.querySelector(`.team-box-content[data-box-content="${i}"]`);
    if (boxContent) boxContent.innerHTML = '';
  });

  // resetear sprites del pool
  Array.from(pokemonContainer.children).forEach(img => {
    img.classList.remove('disabled');
  });

  state.boxes.forEach(boxState => {
    const index = boxState.id;
    const boxContent = document.querySelector(`.team-box-content[data-box-content="${index}"]`);
    const titleEl = document.querySelector(`[data-box-title="${index}"]`);
    if (titleEl && boxState.title) titleEl.textContent = boxState.title;

    if (!boxContent) return;

    boxState.pokemon.forEach(name => {
      const src = `assets/pokemonsprites/${name}.png`;
      const img = document.createElement('img');
      img.src = src;
      img.alt = name;
      img.title = capitalizeName(name);
      img.className = 'sprite';
      img.dataset.name = name;
      img.dataset.location = `team-${index}`;
      img.draggable = true;
      addDragEvents(img);
      boxContent.appendChild(img);

      const original = pokemonContainer.querySelector(`img[data-name="${name}"]`);
      if (original) original.classList.add('disabled');
    });
  });
}

function saveState() {
  const state = getStateFromDOM();
  localStorage.setItem(TEAM_STATE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(TEAM_STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ---------- drop en cajas ----------
teamBoxes.forEach(box => {
  box.addEventListener('dragover', e => e.preventDefault());
  box.addEventListener('drop', e => {
    e.preventDefault();

    const name = e.dataTransfer.getData('name');
    const src = e.dataTransfer.getData('src');
    const from = e.dataTransfer.getData('from');

    if (box.children.length >= 6) {
      alert('No puedes agregar más de 6 pokémones en un equipo.');
      return;
    }

    const alreadyInTeam = Array.from(box.children).some(child => child.dataset.name === name);
    if (alreadyInTeam) {
      alert('Este Pokémon ya está en este equipo.');
      return;
    }

    if (from.startsWith('team-')) {
      const fromBoxIndex = from.split('-')[1];
      const fromBox = document.querySelector(`.team-box-content[data-box-content="${fromBoxIndex}"]`);
      if (fromBox) {
        const existing = fromBox.querySelector(`img[data-name="${name}"]`);
        if (existing) fromBox.removeChild(existing);
      }
    }

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

    const original = pokemonContainer.querySelector(`img[data-name="${name}"]`);
    if (original) original.classList.add('disabled');

    saveState();
  });
});

// ---------- drop en contenedor principal ----------
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

  saveState();
});

// ---------- carga inicial de sprites ----------
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

    // aplicar estado guardado si existe
    const saved = loadState();
    if (saved) applyStateToDOM(saved);
  })
  .catch(err => console.error('Error cargando lista de Pokémon:', err));

// ---------- buscador ----------
const searchInput = document.getElementById('pokemon-search');
searchInput.addEventListener('input', () => {
  const filter = searchInput.value.toLowerCase();
  Array.from(pokemonContainer.children).forEach(img => {
    const name = img.dataset.name.toLowerCase();
    img.style.display = name.includes(filter) ? '' : 'none';
  });
});

// ---------- ocultar/mostrar caja ----------
document.querySelectorAll('.toggle-box-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const index = btn.dataset.boxToggle;
    const box = document.querySelector(`.team-box[data-box="${index}"]`);
    if (!box) return;
    box.classList.toggle('collapsed');
    saveState();
  });
});

// ---------- vaciar caja ----------
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

    saveState();
  });
});

// ---------- guardar cambios de nombre de caja ----------
document.querySelectorAll('.team-box-title').forEach(titleEl => {
  titleEl.addEventListener('blur', () => {
    saveState();
  });
});