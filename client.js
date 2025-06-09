const ws = new WebSocket('ws://localhost:8080');
let jugador = null;
let cartes = [];

// Crear baraja completa
const numbers = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
const suits = ['spades', 'hearts', 'clubs', 'diamonds'];
const fullDeck = numbers.flatMap(number => suits.map(suit => `${number}_of_${suit}`));

// Función para barajar y repartir cartas
function dealCards(numCards) {
  // Barajar la baraja
  const shuffled = [...fullDeck].sort(() => Math.random() - 0.5);
  // Tomar las primeras numCards
  return shuffled.slice(0, numCards);
}

ws.onopen = () => {
  console.log('Conectado al servidor');
};

ws.onmessage = (event) => {
  const msg = event.data;
  console.log(`Mensaje recibido: ${msg}`);

  if (msg === 'Ets el jugador 1') {
    jugador = 'jugador1';
    cartes = dealCards(5); // Repartir 5 cartas aleatorias
    mostrarCartes('cartes-jugador1', 'back_black.svg');
  } else if (msg === 'Ets el jugador 2') {
    jugador = 'jugador2';
    cartes = dealCards(5); // Repartir 5 cartas aleatorias
    mostrarCartes('cartes-jugador2', 'back_red.svg');
  } else if (msg === 'Jugador 2 connectat') {
    document.getElementById('missatge').textContent = 'Jugador 2 connectat!';
  } else if (msg === 'Esperant que el jugador 2 es connecti...') {
    document.getElementById('missatge').textContent = 'Esperant que el jugador 2 es connecti...';
  } else if (msg === 'Carta no válida') {
    document.getElementById('missatge').textContent = 'Error: Carta no válida';
  } else if (msg === 'Ja has seleccionat la teva carta. Espera a que acabi la ronda.') {
    document.getElementById('missatge').textContent = 'Ja has seleccionat la teva carta...';
  } else if (msg === 'Repartint noves cartes...') {
    cartes = dealCards(5); // Repartir 5 nuevas cartas aleatorias
    document.getElementById('missatge').textContent = '';
    document.getElementById('carta-seleccionada-jugador1').innerHTML = '';
    document.getElementById('carta-seleccionada-jugador2').innerHTML = '';
    document.getElementById('novaRonda').style.display = 'none';
    mostrarCartes(jugador === 'jugador1' ? 'cartes-jugador1' : 'cartes-jugador2', jugador === 'jugador1' ? 'back_black.svg' : 'back_red.svg');
  } else if (msg === `Esperant resposta de l'altre jugador...`) {
    document.getElementById('missatge').textContent = `Esperant resposta de l\'altre jugador...`;
  } else if (msg.startsWith('resultat|')) {
    const [_, result, carta1, carta2] = msg.split('|');
    document.getElementById('missatge').textContent = result;
    mostrarCartaSeleccionada('carta-seleccionada-jugador1', carta1);
    mostrarCartaSeleccionada('carta-seleccionada-jugador2', carta2);
    document.getElementById('novaRonda').style.display = 'block';
  }
};

function mostrarCartes(containerId, backImage) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  cartes.forEach(carta => {
    const div = document.createElement('div');
    div.className = 'carta';
    const img = document.createElement('img');
    img.src = `cartes/${backImage}`;
    img.dataset.carta = carta;
    div.appendChild(img);
    div.onclick = () => seleccionarCarta(carta, div);
    container.appendChild(div);
  });
}

function seleccionarCarta(carta, div) {
  ws.send(`selecciona|${jugador}|${carta}`);
  const img = div.querySelector('img');
  img.src = `cartes/${carta}.svg`;
  const container = document.getElementById(jugador === 'jugador1' ? 'cartes-jugador1' : 'cartes-jugador2');
  container.querySelectorAll('.carta').forEach(c => {
    c.style.pointerEvents = 'none';
  });
}

function mostrarCartaSeleccionada(containerId, carta) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const img = document.createElement('img');
  img.src = `cartes/${carta}.svg`;
  container.appendChild(img);
}

document.getElementById('novaRonda').onclick = () => {
  ws.send('novaRonda');
};