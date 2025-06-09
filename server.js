const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let player1 = null;
let player2 = null;
let gameStarted = false;
let newRoundVotes = { jugador1: false, jugador2: false };

// Lista de números y palos válidos para validación
const validNumbers = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
const validSuits = ['spades', 'hearts', 'clubs', 'diamonds'];

wss.on('connection', (ws) => {
  console.log('Nuevo jugador conectado');

  ws.on('error', (err) => {
    console.error('Error en WebSocket:', err.message);
  });

  if (!player1) {
    player1 = ws;
    ws.send('Ets el jugador 1');
  } else if (!player2) {
    player2 = ws;
    ws.send('Ets el jugador 2');
    if (player1) {
      player1.send('Jugador 2 connectat');
    }
  } else {
    ws.send('Jugador completat, espera turno');
  }

  ws.on('message', (message) => {
    const msg = typeof message === 'string' ? message : message.toString();
    console.log(`Mensaje recibido: ${msg}`);

    if (msg.startsWith('selecciona|')) {
      const [_, jugador, card] = msg.split('|');

      // Validar la carta recibida
      if (!isValidCard(card)) {
        ws.send('Carta no válida');
        return;
      }

      if (jugador === 'jugador1' && ws === player1 && !player2) {
        ws.send("Esperant que el jugador 2 es connecti...");
        return;
      }

      if (gameStarted) {
        ws.send("Ja has seleccionat la teva carta. Espera a que acabi la ronda.");
        return;
      }

      if (jugador === 'jugador1' && ws === player1 && !player1.selectedCard) {
        player1.selectedCard = card;
      } else if (jugador === 'jugador2' && ws === player2 && !player2.selectedCard) {
        player2.selectedCard = card;
      }

      if (player1.selectedCard && player2.selectedCard) {
        gameStarted = true;
        const val1 = getCardValue(player1.selectedCard);
        const val2 = getCardValue(player2.selectedCard);
        let result = 'Empat';
        if (val1 > val2) result = 'Jugador 1 guanya!';
        else if (val2 > val1) result = 'Jugador 2 guanya!';
        const resultMessage = `resultat|${result}|${player1.selectedCard}|${player2.selectedCard}`;
        if (player1) player1.send(resultMessage);
        if (player2) player2.send(resultMessage);
      }
    }

    if (msg === 'novaRonda') {
      if (ws === player1) {
        newRoundVotes.jugador1 = true;
        ws.send("Esperant resposta de l'altre jugador...");
      } else if (ws === player2) {
        newRoundVotes.jugador2 = true;
        ws.send("Esperant resposta de l'altre jugador...");
      }
      if (newRoundVotes.jugador1 && newRoundVotes.jugador2) {
        gameStarted = false;
        if (player1) player1.selectedCard = null;
        if (player2) player2.selectedCard = null;
        newRoundVotes = { jugador1: false, jugador2: false };
        if (player1) player1.send("Repartint noves cartes...");
        if (player2) player2.send("Repartint noves cartes...");
      }
    }
  });

  ws.on('close', () => {
    if (ws === player1) player1 = null;
    else if (ws === player2) player2 = null;
  });
});

function getCardValue(card) {
  const cardValues = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    '10': 10, 'jack': 11, 'queen': 12, 'king': 13, 'ace': 14
  };
  const number = card.split('_of_')[0];
  return cardValues[number] || 0;
}

function isValidCard(card) {
  const parts = card.split('_of_');
  if (parts.length !== 2) return false;
  const [number, suit] = parts;
  return validNumbers.includes(number) && validSuits.includes(suit);
}