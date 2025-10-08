export class HeartBar {
  constructor(app, cantidadInicial) {
    this.app = app;
    this.corazones = [];
    for (let i = 0; i < cantidadInicial; i++) {
      this.agregarCorazon();
    }
  }

  agregarCorazon() {
    if (this.corazones.length < 3) {
      const nuevo = new PIXI.Graphics();
      nuevo.beginFill(0xff0000);
      nuevo.drawCircle(0, 0, 10);
      nuevo.endFill();
      nuevo.x = 20 + this.corazones.length * 30;
      nuevo.y = 20;
      this.app.stage.addChild(nuevo);
      this.corazones.push(nuevo);
    }
  }

  perderCorazon() {
    if (this.corazones.length > 0) {
      const ultimo = this.corazones.pop();
      this.app.stage.removeChild(ultimo);
    }
  }

  getCantidad() {
    return this.corazones.length;
  }
}