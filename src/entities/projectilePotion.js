export class PocionProyectil {
  constructor(app, camara, origen, destino, color, onImpacto) {
    this.app = app;
    this.camara = camara
    this.color = color;
    this.onImpacto = onImpacto;
    this.origen = origen;
    this.destino = destino;

    this.sprite = new PIXI.Graphics();
    this.sprite.x = origen.x;
    this.sprite.y = origen.y;
    this.camara.addChild(this.sprite);

    const dx = destino.x - origen.x;
    const dy = destino.y - origen.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    this.vx = (dx / distancia) * 6;
    this.vy = (dy / distancia) * 6;

    this.distanciaRecorrida = 0;
    this.largoMaximo = 300; // alcance máximo del rayo

  }

  update() {
    this.sprite.x += this.vx;
    this.sprite.y += this.vy;

    // rayo 
    const rayo = new PIXI.Graphics();
    rayo.lineStyle(2, PIXI.utils.string2hex(this.color), 0.6);
    rayo.blendMode = PIXI.BLEND_MODES.ADD;

    const x1 = this.sprite.x;
    const y1 = this.sprite.y;
    const x2 = x1 - this.vx * 2;
    const y2 = y1 - this.vy * 2;

    rayo.moveTo(x1, y1);
    const segmentos = 6;
    for (let i = 1; i < segmentos; i++) {
      const t = i / segmentos;
      const dx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 8;
      const dy = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 8;
      rayo.lineTo(dx, dy);
    }
    rayo.lineTo(x2, y2);
    this.camara.addChild(rayo);

    // rayo
    let alpha = 0.6;
    const fade = () => {
      alpha -= 0.05;
      rayo.alpha = alpha;
      if (alpha <= 0) {
        this.camara.removeChild(rayo);
        this.app.ticker.remove(fade);
      }
    };
    this.app.ticker.add(fade);

    // acumular la distancia recorrida
    const paso = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.distanciaRecorrida += paso;

    // se cancela si supera el largo máximo
    if (this.distanciaRecorrida > this.largoMaximo) {
      this.app.stage.removeChild(this.sprite);
      return false;
    }

    // impacto si está dentro del rango
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