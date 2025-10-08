export class Wizard {
  constructor(app) {
    this.app = app;
    this.graphic = new PIXI.Graphics();
    this.graphic.beginFill(0xffffff);
    this.graphic.drawCircle(0, 0, 10);
    this.graphic.endFill();
    this.app.stage.addChild(this.graphic);

    this.aura = new PIXI.Graphics();
    this.aura.visible = false;
    this.app.stage.addChild(this.aura);

    this.destino = null;
    this.velocidad = 3;
    this.invulnerable = false;
  }

  setDestino(pos) {
    this.destino = { x: pos.x, y: pos.y };
  }

  update() {
    if (this.destino) {
      const dx = this.destino.x - this.graphic.x;
      const dy = this.destino.y - this.graphic.y;
      const distancia = Math.sqrt(dx * dx + dy * dy);

      if (distancia > this.velocidad) {
        this.graphic.x += (dx / distancia) * this.velocidad;
        this.graphic.y += (dy / distancia) * this.velocidad;
      } else {
        this.graphic.x = this.destino.x;
        this.graphic.y = this.destino.y;
        this.destino = null;
      }
    }

    this.aura.x = this.graphic.x;
    this.aura.y = this.graphic.y;
  }

  activarAura(color = '#00ffff') {
    this.aura.clear();
    this.aura.beginFill(PIXI.utils.string2hex(color), 0.3);
    this.aura.drawCircle(0, 0, 20);
    this.aura.endFill();
    this.aura.visible = true;
  }

  desactivarAura() {
    this.aura.visible = false;
  }

  recibirDanio() {
    this.graphic.tint = 0xff0000;
    setTimeout(() => {
      this.graphic.tint = 0xffffff;
    }, 200);
  }

  rebotarDesde(fantasma) {
    const dx = this.graphic.x - fantasma.x;
    const dy = this.graphic.y - fantasma.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    const fuerza = 10;

    if (distancia > 0) {
      this.graphic.x += (dx / distancia) * fuerza;
      this.graphic.y += (dy / distancia) * fuerza;
    }
  }

  get x() { return this.graphic.x; }
  get y() { return this.graphic.y; }
  set x(valor) { this.graphic.x = valor; }
  set y(valor) { this.graphic.y = valor; }
}