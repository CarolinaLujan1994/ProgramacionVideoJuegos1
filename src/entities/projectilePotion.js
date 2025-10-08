export class PocionProyectil {
  constructor(app, origen, destino, color, onImpacto) {
    this.app = app;
    this.color = color;
    this.onImpacto = onImpacto;

    this.sprite = new PIXI.Graphics();
    this.sprite.beginFill(PIXI.utils.string2hex(color));
    this.sprite.drawCircle(0, 0, 5);
    this.sprite.endFill();
    this.sprite.x = origen.x;
    this.sprite.y = origen.y;

    this.app.stage.addChild(this.sprite);

    const dx = destino.x - origen.x;
    const dy = destino.y - origen.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    this.vx = (dx / distancia) * 6;
    this.vy = (dy / distancia) * 6;
    this.destino = destino;
  }

  update() {
    this.sprite.x += this.vx;
    this.sprite.y += this.vy;

    const estela = new PIXI.Graphics();
    estela.beginFill(PIXI.utils.string2hex(this.color), 0.3);
    estela.drawCircle(0, 0, 3);
    estela.endFill();
    estela.x = this.sprite.x;
    estela.y = this.sprite.y;
    this.app.stage.addChild(estela);

    let alpha = 0.3;
    const fade = () => {
      alpha -= 0.05;
      estela.alpha = alpha;
      if (alpha <= 0) {
        this.app.stage.removeChild(estela);
        this.app.ticker.remove(fade);
      }
    };
    this.app.ticker.add(fade);

    const dx = this.destino.x - this.sprite.x;
    const dy = this.destino.y - this.sprite.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);

    if (distancia < 10) {
      this.app.stage.removeChild(this.sprite);
      this.onImpacto();
      return false;
    }

    return true;
  }
}