export class PocionHUD {
  constructor(app, potionTextures) {
    this.app = app;
    this.potionTextures = potionTextures;
    this.pociones = [];
    this.container = new PIXI.Container();

    this.pocionesRed = [];
    this.pocionesBlue = [];
    this.pocionesGreen = [];
    this.pocionesYellow = [];
    this.pocionesPink = [];


    // configuración visual de las pociones
    this.TOTAL = 5;
    this.ESPACIO = 6;
    this.ANCHO_POCION = 20;

    this.container.x = 0;
    this.container.y = 18;
  }

  agregarPocion(color) {
    if (this.pociones.length >= this.TOTAL) return false;
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
    const siguiente = this.pociones[0];
    this.redibujar();
    return siguiente;
  }

  redibujar() {
    this.container.removeChildren();

    for (let i = 0; i < this.TOTAL; i++) {
      const p = this.pociones[i];
      const textura = p ? this.potionTextures[p.color] : PIXI.Texture.EMPTY;

      const sprite = new PIXI.Sprite(textura);
      sprite.anchor.set(0.5);
      sprite.scale.set(0.4);
      sprite.x = i * (this.ANCHO_POCION + this.ESPACIO) + this.ANCHO_POCION / 2;
      sprite.y = 10;

      this.container.addChild(sprite);
    }
  }
  getConteoPorColor() {
    const conteo = { red: 0, blue: 0, green: 0, yellow: 0, pink: 0 };
    if (!this.pociones) return conteo;

    this.pociones.forEach(p => {
      if (p.color && conteo[p.color] !== undefined) {
        conteo[p.color]++;
      }
    });

    return conteo;
  }
}