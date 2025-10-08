export class PocionHUD {
  constructor(app) {
    this.app = app;
    this.pociones = [];
    this.container = new PIXI.Container();
    this.container.x = this.app.renderer.width - 20 - 5 * 14;
    this.container.y = 20;
    this.app.stage.addChild(this.container);
  }

  agregarPocion(color) {
    if (this.pociones.length >= 5) return false;
    this.pociones.push({ color, cargas: 5 });
    this.redibujar();
    return true;
  }

  gastarCarga(color) {
    if (this.pociones.length === 0) return;
    if (this.pociones[0].color === color) {
      this.pociones[0].cargas--;
      if (this.pociones[0].cargas <= 0) {
        this.pociones.shift();
      }
      this.redibujar();
    }
  }

  getSiguientePocion() {
    if (this.pociones.length === 0) return null;
    const siguiente = this.pociones.shift();
    this.redibujar();
    return siguiente;
  }

  redibujar() {
    this.container.removeChildren();
    this.pociones.forEach((p, i) => {
      const barra = new PIXI.Graphics();
      barra.beginFill(PIXI.utils.string2hex(p.color));
      barra.drawRoundedRect(0, 0, 10, 10, 3);
      barra.endFill();
      barra.x = i * 14;
      this.container.addChild(barra);
    });
  }
}