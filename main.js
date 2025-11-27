const pokemonContainer = document.getElementById('pokemon-list');
const teamsContainer = document.getElementById('teams');
const addTeamBtn = document.getElementById('add-team-btn');
const TEAM_STATE_KEY = 'pokemon-teams-state-v3';

// ---------- utilidades ----------
function addDragEvents(sprite) {
  sprite.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('name', sprite.dataset.name);
    e.dataTransfer.setData('src', sprite.src);
    e.dataTransfer.setData('from', sprite.dataset.location || 'pool'); // pool | team-<id>
  });
}

function capitalizeName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
}

function generateTeamId() {
  const boxElems = document.querySelectorAll('.team-box');
  const existingIds = Array.from(boxElems).map(b => Number(b.dataset.box));
  let id = 1;
  while (existingIds.includes(id)) id++;
  return id;
}

// ---------- estado ----------
function getStateFromDOM() {
  const boxElems = document.querySelectorAll('.team-box');
  const boxes = Array.from(boxElems).map(box => {
    const id = Number(box.dataset.box);
    const titleEl = box.querySelector('.team-box-title');
    const content = box.querySelector('.team-box-content');
    const names = Array.from(content.children).map(img => img.dataset.name);
    const collapsed = box.classList.contains('collapsed');
    return {
      id,
      title: titleEl ? titleEl.textContent.trim() : `Equipo ${id}`,
      pokemon: names,
      collapsed
    };
  });
  return { boxes };
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

// ---------- creación dinámica de cajas ----------
function createTeamBox(boxState) {
  const id = boxState.id;
  const box = document.createElement('div');
  box.className = 'team-box';
  box.dataset.box = id;
  if (boxState.collapsed) box.classList.add('collapsed');

  box.innerHTML = `
    <div class="team-box-header">
      <span class="team-box-title" contenteditable="true" data-box-title="${id}">${boxState.title || `Equipo ${id}`}</span>
      <div>
        <button class="toggle-box-btn" data-box-toggle="${id}" title="Ocultar/mostrar">👁</button>
        <button class="close-box-btn" data-box-close="${id}" title="Eliminar caja">✖</button>
      </div>
    </div>
    <div class="team-box-content" data-box-content="${id}"></div>
    <div class="team-box-buttons">
      <button class="import-btn" data-box-import="${id}" title="Importar">⬆</button>
      <button class="clear-btn" data-box-clear="${id}" title="Vaciar caja">🗑</button>
      <button class="export-btn" data-box-export="${id}" title="Exportar">⬇</button>
    </div>
  `;

  teamsContainer.appendChild(box);

  const content = box.querySelector('.team-box-content');

  // eventos de drop para esta caja
  content.addEventListener('dragover', e => e.preventDefault());
  content.addEventListener('drop', e => {
    e.preventDefault();

    const name = e.dataTransfer.getData('name');
    const src = e.dataTransfer.getData('src');
    const from = e.dataTransfer.getData('from');

    if (content.children.length >= 6) {
      alert('No puedes agregar más de 6 pokémones en un equipo.');
      return;
    }

    const alreadyInTeam = Array.from(content.children).some(child => child.dataset.name === name);
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

    const img = document.createElement('img');
    img.src = src;
    img.alt = name;
    img.title = capitalizeName(name);
    img.className = 'sprite';
    img.dataset.name = name;
    img.dataset.location = `team-${id}`;
    img.draggable = true;
    addDragEvents(img);
    content.appendChild(img);

    const original = pokemonContainer.querySelector(`img[data-name="${name}"]`);
    if (original) original.classList.add('disabled');

    saveState();
  });

  // botón ocultar/mostrar
  const toggleBtn = box.querySelector('.toggle-box-btn');
  toggleBtn.addEventListener('click', () => {
    box.classList.toggle('collapsed');
    saveState();
  });

  // botón vaciar caja
  const clearBtn = box.querySelector('.clear-btn');
  clearBtn.addEventListener('click', () => {
    const sprites = Array.from(content.children);
    sprites.forEach(sprite => {
      const name = sprite.dataset.name;
      content.removeChild(sprite);
      const original = pokemonContainer.querySelector(`img[data-name="${name}"]`);
      if (original) original.classList.remove('disabled');
    });
    saveState();
  });

  // botón cerrar caja (X)
  const closeBtn = box.querySelector('.close-box-btn');
  closeBtn.addEventListener('click', () => {
    // devolver pokémon como si fuera papelera
    const sprites = Array.from(content.children);
    sprites.forEach(sprite => {
      const name = sprite.dataset.name;
      content.removeChild(sprite);
      const original = pokemonContainer.querySelector(`img[data-name="${name}"]`);
      if (original) original.classList.remove('disabled');
    });

    box.remove();
    saveState();
  });

  // guardar cambios de nombre
  const titleEl = box.querySelector('.team-box-title');
  titleEl.addEventListener('blur', () => {
    saveState();
  });

  // reconstruir pokémon si vienen en estado
  if (boxState.pokemon && boxState.pokemon.length) {
    boxState.pokemon.forEach(name => {
      const src = `assets/pokemonsprites/${name}.png`;
      const img = document.createElement('img');
      img.src = src;
      img.alt = name;
      img.title = capitalizeName(name);
      img.className = 'sprite';
      img.dataset.name = name;
      img.dataset.location = `team-${id}`;
      img.draggable = true;
      addDragEvents(img);
      content.appendChild(img);

      const original = pokemonContainer.querySelector(`img[data-name="${name}"]`);
      if (original) original.classList.add('disabled');
    });
  }
}

function applyStateToDOM(state) {
  teamsContainer.innerHTML = '';

  Array.from(pokemonContainer.children).forEach(img => {
    img.classList.remove('disabled');
  });

  if (state && state.boxes && state.boxes.length) {
    state.boxes.forEach(boxState => createTeamBox(boxState));
  }
}

// ---------- drop en pool ----------
pokemonContainer.addEventListener('dragover', e => e.preventDefault());
pokemonContainer.addEventListener('drop', e => {
  e.preventDefault();
  const name = e.dataTransfer.getData('name');
  const src = e.dataTransfer.getData('src');
  const from = e.dataTransfer.getData('from');

  if (from && from.startsWith('team-')) {
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

// ---------- carga inicial de sprites y estado ----------
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

// ---------- botón agregar caja ----------
addTeamBtn.addEventListener('click', () => {
  const id = generateTeamId();
  const newBoxState = { id, title: `Equipo ${id}`, pokemon: [], collapsed: false };
  createTeamBox(newBoxState);
  saveState();
});