import { GameManager } from './gameManager.js';

window.onload = () => {
  const game = new GameManager();
  game.cargarSonidos();
  game.mostrarPantallaInicio();
};