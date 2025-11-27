const boxes = document.querySelectorAll('.team-box');

function addDragEvents(sprite) {
  sprite.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('name', sprite.dataset.name);
    e.dataTransfer.setData('src', sprite.src);
  });
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
  });
});

fetch('/pklist.json')
  .then(res => res.json())
  .then(pokemonList => {
    const container = document.getElementById('pokemon-list');
    pokemonList.forEach(name => {
      const img = document.createElement('img');
      img.src = `/assets/pokemonsprites/${name}.png`;
      img.alt = name;
      img.draggable = true;
      img.className = 'sprite';
      img.dataset.name = name;
      addDragEvents(img);
      container.appendChild(img);
    });
  })
  .catch(err => console.error('Error cargando lista de Pokémon:', err));
