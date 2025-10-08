export class ChargeBar {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container(); // contenedor visual
    this.barras = [];
    this.x = 0;
    this.y = 0;
    this.color = null;
    this.cantidad = 0;
  }

  update(color, cantidad) {
    this.color = color;
    this.cantidad = cantidad;

    this.barras.forEach(b => this.container.removeChild(b));
    this.barras = [];

    for (let i = 0; i < cantidad; i++) {
      const barra = new PIXI.Graphics();
      barra.beginFill(PIXI.utils.string2hex(color));
      barra.drawRoundedRect(0, 0, 10, 4, 2);
      barra.endFill();
      barra.x = -25 + i * 12;
      barra.y = 15;
      this.barras.push(barra);
      this.container.addChild(barra);
    }
  }

  updatePosition(x, y) {
    this.x = x;
    this.y = y;
    this.container.x = x;
    this.container.y = y;
  }
}