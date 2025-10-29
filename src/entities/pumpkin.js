import { HeartPickup } from './../ui/heartPickup.js';

export class Pumpkin {
  constructor(app, texture, gameManager, wizard) {
    this.app = app;
    this.gameManager = gameManager;
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(0.15);

    this.sprite.x = Math.random() * 2500 + 50;
    this.sprite.y = Math.random() * 1500 + 50;

    this.sprite.name = 'pumpkin';
    this.visible = true;
    this.wizard = wizard;
  }

  collidesWith(wizard) {
    const dx = wizard.x - this.sprite.x;
    const dy = wizard.y - this.sprite.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    return distancia < 25;
  }

  update(wizard, heartBar) {
    if (this.visible && this.collidesWith(wizard)) {
      if (wizard.invulnerable) return; // evitar daño repetido
      wizard.rebotarDesde(this.sprite);

      heartBar.perderCorazon();
      wizard.recibirDanio(() => {
        PIXI.sound.play('hurt', { volume: 0.2 });
        if (heartBar.getCantidad() < 5) {
          // --- Nueva posición segura para el corazón ---
          const redHeartTexture = this.gameManager.heartTextures?.red;
          const heartPickup = new HeartPickup(this.app, redHeartTexture, () => {
            heartBar.agregarCorazon();
          });

          let x, y;
          const distanciaMinima = 60; // píxeles de separación respecto a calabazas
          const maxIntentos = 50;
          let posicionValida = false;

          for (let i = 0; i < maxIntentos && !posicionValida; i++) {
            x = Math.random() * 2500 + 50;
            y = Math.random() * 1500 + 50;
            posicionValida = true;

            for (const pumpkin of this.gameManager.pumpkins) {
              const dx = pumpkin.sprite.x - x;
              const dy = pumpkin.sprite.y - y;
              const distancia = Math.sqrt(dx * dx + dy * dy);
              if (distancia < distanciaMinima) {
                posicionValida = false;
                break;
              }
            }
          }

          heartPickup.sprite.x = x;
          heartPickup.sprite.y = y;

          this.gameManager.heartPickups.push(heartPickup);
          this.gameManager.camara.addChild(heartPickup.sprite);

        }
      });

      wizard.invulnerable = true;
      let tiempoParpadeo = 60;
      const parpadeo = () => {
        tiempoParpadeo--;
        wizard.visible = tiempoParpadeo % 10 < 5;
        if (tiempoParpadeo <= 0) {
          wizard.visible = true;
          wizard.invulnerable = false;
          this.app.ticker.remove(parpadeo);
        }
      };
      this.app.ticker.add(parpadeo);
    }
  }
}