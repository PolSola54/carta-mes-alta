const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 43853 });

let player1 = null;
let player2 = null;
let gameStarted = false;
// Objeto para contar la votación para una nueva ronda
let newRoundVotes = { jugador1: false, jugador2: false };

wss.on('connection', (ws) => {
  console.log('Nuevo jugador conectado');


  // Manejo de errores para evitar que el servidor crashee
  ws.on('error', (err) => {
    console.error('Error en WebSocket:', err.message);
  });
  
  // Asignar jugadores
  if (!player1) {
    player1 = ws;
    ws.send('Ets el jugador 1');
  } else if (!player2) {
    player2 = ws;
    ws.send('Ets el jugador 2');
    // Notificar a jugador1 que ya se ha conectado el jugador2
    if (player1) {
      player1.send('Jugador 2 connectat');
    }
  } else {
    ws.send('Jugador completat, espera turno');
  }

  ws.on('message', (message) => {
    // Convertir a cadena si es necesario
    const msg = typeof message === 'string' ? message : message.toString();
    console.log(`Mensaje recibido: ${msg}`);
    
    // Si es el mensaje de selección de carta
    if (msg.startsWith('selecciona|')) {
      const [_, jugador, card] = msg.split('|');
      
      // Si jugador1 intenta seleccionar pero jugador2 no está conectado:
      if (jugador === 'jugador1' && ws === player1 && !player2) {
        ws.send("Esperant que el jugador 2 es connecti...");
        return;
      }
      
      // No permitimos selección si la ronda ya ha comenzado
      if (gameStarted) {
        ws.send("Ja has seleccionat la teva carta. Espera a que acabi la ronda.");
        return;
      }
      
      // Guardamos la carta seleccionada (solo si aún no se ha asignado)
      if (jugador === 'jugador1' && ws === player1 && !player1.selectedCard) {
        player1.selectedCard = card;
      } else if (jugador === 'jugador2' && ws === player2 && !player2.selectedCard) {
        player2.selectedCard = card;
      }
      
      // Si ambos jugadores han seleccionado carta, comparar
      if (player1.selectedCard && player2.selectedCard) {
        gameStarted = true;  // Iniciar la ronda
        const val1 = getCardValue(player1.selectedCard);
        const val2 = getCardValue(player2.selectedCard);
        let result = 'Empat';
        if (val1 > val2) result = 'Jugador 1 guanya!';
        else if (val2 > val1) result = 'Jugador 2 guanya!';
        player1.send(result);
        player2.send(result);
      }
    }
    
    // Si se envía el mensaje de "novaRonda"
    if (msg === 'novaRonda') {
      if (ws === player1) {
        newRoundVotes.jugador1 = true;
        ws.send("Esperant resposta de l'altre jugador...");
      } else if (ws === player2) {
        newRoundVotes.jugador2 = true;
        ws.send("Esperant resposta de l'altre jugador...");
      }
      // Si ambos han votado, reiniciamos el estado de la ronda
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

// Función para obtener el valor de la carta
function getCardValue(card) {
  const cardValues = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    '10': 10, 'jack': 11, 'queen': 12, 'king': 13, 'ace': 14
  };
  return cardValues[card.split('_')[0]] || 0;
}
