const pokemonContainer = document.getElementById('pokemon-list');
const teamsContainer = document.getElementById('teams');
const addTeamBtn = document.getElementById('add-team-btn');
const TEAM_STATE_KEY = 'pokemon-teams-state-v3';

// lista global para el randomizador
let allPokemonNames = [];

// ===== CARGAR DATOS DE EQUIPOS (JSON) =====

let pokemonTeamsData = {}; // sprite_name -> datos de equipo

fetch('assets/pokemon-teams-data.json')
  .then(res => res.json())
  .then(data => {
    pokemonTeamsData = data;
    console.log('✓ Datos de equipos cargados:', Object.keys(pokemonTeamsData).length, 'Pokémon');
  })
  .catch(err => console.error('Error cargando assets/pokemon-teams-data.json:', err));

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

// devuelve mapa name -> boxId donde está usado
function getPokemonUsage() {
  const usage = {}; // name -> boxId
  const boxElems = document.querySelectorAll('.team-box');
  boxElems.forEach(box => {
    const id = Number(box.dataset.box);
    const content = box.querySelector('.team-box-content');
    Array.from(content.children).forEach(img => {
      usage[img.dataset.name] = id;
    });
  });
  return usage;
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

// ---------- EXPORTAR EQUIPO ----------
function exportTeamToClipboard(boxIndex, boxName) {
  const box = document.querySelector(`.team-box[data-box="${boxIndex}"] .team-box-content`);

  if (!box) {
    alert('No se encontró la caja');
    return;
  }

  const sprites = Array.from(box.querySelectorAll('img.sprite'));

  if (sprites.length === 0) {
    alert('La caja está vacía');
    return;
  }

  let exportText = boxName + '\n\n';

  sprites.forEach((sprite) => {
    const spriteName = sprite.dataset.name; // ej: "bulbasaur"
    const data = pokemonTeamsData[spriteName];

    if (!data) {
      console.warn('No hay datos para', spriteName);
      return;
    }

    exportText += data.name + '\n';
    exportText += 'Ability: ' + data.ability + '\n';
    exportText += 'EVs: ' +
      data.evs.hp  + ' HP / ' +
      data.evs.atk + ' Atk / ' +
      data.evs.def + ' Def / ' +
      data.evs.spa + ' SpA / ' +
      data.evs.spd + ' SpD / ' +
      data.evs.spe + ' Spe\n';
    exportText += data.nature + ' Nature\n';
    exportText += '- ' + data.moves[0] + '\n';
    exportText += '- ' + data.moves[1] + '\n';
    exportText += '- ' + data.moves[2] + '\n';
    exportText += '- ' + data.moves[3] + '\n\n';
  });

  navigator.clipboard.writeText(exportText).then(() => {
    alert('✓ Equipo copiado al portapapeles');
    console.log(exportText);
  }).catch(err => {
    console.error('Error al copiar:', err);
  });
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

  // botón exportar
  const exportBtn = box.querySelector('.export-btn');
  exportBtn.addEventListener('click', () => {
    const titleEl = box.querySelector('.team-box-title');
    const boxName = (titleEl && titleEl.textContent.trim()) || `Equipo ${id}`;
    exportTeamToClipboard(id, boxName);
  });

  // botón importar
  const importBtn = box.querySelector('.import-btn');
  importBtn.addEventListener('click', () => {
    const raw = prompt('Pega la lista de nombres de pokémon (separados por coma o por líneas):');
    if (!raw) return;

    // normalizar: dividir por coma o salto de línea
    let names = raw
      .split(/[\n,]/)
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0);

    // quitar duplicados internos
    names = Array.from(new Set(names));

    if (names.length === 0) {
      alert('No se detectaron nombres válidos.');
      return;
    }

    if (names.length > 6) {
      alert('Tienes demasiados pokémon: máximo 6 por caja.');
      return;
    }

    // verificar que todos existan en la pool
    const invalid = names.filter(n => !pokemonContainer.querySelector(`img[data-name="${n}"]`));
    if (invalid.length) {
      alert('Los siguientes nombres no existen en la lista de pokémon: ' + invalid.join(', '));
      return;
    }

    // verificar uso en otras cajas
    const usage = getPokemonUsage();
    const conflictos = [];
    names.forEach(n => {
      const usedIn = usage[n];
      if (usedIn && usedIn !== id) {
        conflictos.push({ name: n, box: usedIn });
      }
    });

    if (conflictos.length) {
      const msg = conflictos
        .map(c => `- ${capitalizeName(c.name)} ya está siendo usado en la caja ${c.box}`)
        .join('\n');
      alert('No se puede importar porque:\n' + msg);
      return;
    }

    // limpiar la caja actual primero (como vaciar)
    const sprites = Array.from(content.children);
    sprites.forEach(sprite => {
      const name = sprite.dataset.name;
      content.removeChild(sprite);
      const original = pokemonContainer.querySelector(`img[data-name="${name}"]`);
      if (original) original.classList.remove('disabled');
    });

    // añadir cada pokémon
    names.forEach(name => {
      const src = `assets/pokemonsprites/webp/${name}.webp`;
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

    saveState();
    alert('Importación completada correctamente.');
  });

  // guardar cambios de nombre (título de caja)
  const titleEl = box.querySelector('.team-box-title');

  // al hacer foco por primera vez, si tiene el texto por defecto, vaciar
  titleEl.addEventListener('focus', () => {
    const current = titleEl.textContent.trim();
    const defaultTitle = `Equipo ${id}`;
    if (current === defaultTitle) {
      titleEl.textContent = '';
    }
  });

  // evitar saltos de línea y usar Enter como "terminar de escribir"
  titleEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      titleEl.blur();
    }
  });

  titleEl.addEventListener('blur', () => {
    let text = titleEl.textContent.trim();
    if (!text) {
      text = `Equipo ${id}`;
      titleEl.textContent = text;
    }
    saveState();
  });

  // reconstruir pokémon si vienen en estado
  if (boxState.pokemon && boxState.pokemon.length) {
    boxState.pokemon.forEach(name => {
      const src = `assets/pokemonsprites/webp/${name}.webp`;
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
  .then(list => {
    list.sort((a, b) => a.dex - b.dex);

    list.forEach(p => {
      const name = p.name; // nombre del sprite
      allPokemonNames.push(name); // para el randomizador

      const img = document.createElement('img');
      img.src = `assets/pokemonsprites/webp/${name}.webp`;
      img.alt = name;
      img.title = capitalizeName(name);
      img.draggable = true;
      img.className = 'sprite';
      img.dataset.name = name;
      img.dataset.dex = p.dex;
      img.dataset.location = 'pool';
      addDragEvents(img);
      pokemonContainer.appendChild(img);
    });

    const saved = loadState();
    if (saved) applyStateToDOM(saved);
  })
  .catch(err => console.error('Error cargando pklist.json:', err));

// ---------- buscador + botón borrar ----------
const searchInput = document.getElementById('pokemon-search');
const clearSearchBtn = document.getElementById('clear-search-btn');

function applySearchFilter() {
  const filter = searchInput.value.toLowerCase();
  Array.from(pokemonContainer.children).forEach(img => {
    const name = img.dataset.name.toLowerCase();
    img.style.display = name.includes(filter) ? '' : 'none';
  });
}

searchInput.addEventListener('input', applySearchFilter);

if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    applySearchFilter();
    searchInput.focus();
  });
}

// ---------- botón agregar caja ----------
addTeamBtn.addEventListener('click', () => {
  const id = generateTeamId();
  const newBoxState = { id, title: `Equipo ${id}`, pokemon: [], collapsed: false };
  createTeamBox(newBoxState);
  saveState();
});

// ---------- randomizador visual ----------

const randomizerBtn = document.getElementById('randomizer-btn');
const randomizerImg = document.getElementById('randomizer-sprite');
const randomizerName = document.getElementById('randomizer-name');

let randomizerInterval = null;
let randomizerRunning = false;

function pickRandomPokemon() {
  if (!allPokemonNames || allPokemonNames.length === 0) return null;
  const idx = Math.floor(Math.random() * allPokemonNames.length);
  return allPokemonNames[idx];
}

function startRandomizerAnimation() {
  if (randomizerRunning) return;
  if (!allPokemonNames || allPokemonNames.length === 0) {
    alert('Aún no se han cargado los pokémon.');
    return;
  }

  randomizerRunning = true;
  randomizerBtn.disabled = true;

  let ticks = 0;
  const maxTicks = 25;
  const delay = 80;

  randomizerInterval = setInterval(() => {
    const name = pickRandomPokemon();
    if (!name) return;

    randomizerImg.src = `assets/pokemonsprites/webp/${name}.webp`;
    randomizerImg.alt = name;
    randomizerImg.title = capitalizeName(name);
    randomizerName.textContent = capitalizeName(name);

    ticks++;
    if (ticks >= maxTicks) {
      clearInterval(randomizerInterval);
      randomizerRunning = false;
      randomizerBtn.disabled = false;
      randomizerBtn.textContent = 'Girar otra vez';
    }
  }, delay);
}

if (randomizerBtn) {
  randomizerBtn.addEventListener('click', () => {
    startRandomizerAnimation();
  });
}