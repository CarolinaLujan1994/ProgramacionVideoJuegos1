export class Potion {
  constructor(app, color) {
    this.app = app;
    this.color = color;
    this.visible = true;

    this.sprite = new PIXI.Graphics();
    this.sprite.beginFill(PIXI.utils.string2hex(color));
    this.sprite.drawCircle(0, 0, 8);
    this.sprite.endFill();

    this.sprite.x = Math.random() * 900 + 50;
    this.sprite.y = Math.random() * 700 + 50;

    this.app.stage.addChild(this.sprite);
  }

  collidesWith(wizard) {
    const dx = wizard.x - this.sprite.x;
    const dy = wizard.y - this.sprite.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    return distancia < 20;
  }

  hide() {
    this.visible = false;

    const texto = new PIXI.Text(`+5 ${this.color}`, {
      fontSize: 14,
      fill: this.color,
      fontWeight: 'bold'
    });
    texto.anchor.set(0.5);
    texto.x = this.sprite.x;
    texto.y = this.sprite.y;
    this.app.stage.addChild(texto);

    let alpha = 1;
    const fadeOut = () => {
      alpha -= 0.05;
      texto.alpha = alpha;
      if (alpha <= 0) {
        this.app.stage.removeChild(texto);
        this.app.ticker.remove(fadeOut);
      }
    };
    this.app.ticker.add(fadeOut);

    const sprite = this.sprite;
    const fadePotion = () => {
      sprite.alpha -= 0.05;
      if (sprite.alpha <= 0) {
        this.app.stage.removeChild(sprite);
        this.app.ticker.remove(fadePotion);
      }
    };
    this.app.ticker.add(fadePotion);

    // reaparecen en 15 segundos
    setTimeout(() => {
      this.visible = true;
      this.sprite.alpha = 1;
      this.sprite.x = Math.random() * 900 + 50;
      this.sprite.y = Math.random() * 700 + 50;
      this.app.stage.addChild(this.sprite);
    }, 15000);
  }
}