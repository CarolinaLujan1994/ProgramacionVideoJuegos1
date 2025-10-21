export class HeartBar {
  constructor(app, cantidadInicial, textures) {
    this.app = app;
    this.textures = textures; // { red: Texture, grey: Texture }
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);

    // intento de coincidencia con el hud de pociones
    this.TOTAL = 5;
    this.ESPACIO = 25;
    this.ANCHO_COZARON = 20;
    this.cantidad = cantidadInicial;
    this.corazones = [];

    this.container.x = 20;
    this.container.y = 20;

    for (let i = 0; i < this.TOTAL; i++) {
      const sprite = new PIXI.Sprite(
        i < cantidadInicial ? this.textures.red : this.textures.grey
      );
      sprite.anchor.set(0.5);
      sprite.scale.set(0.4); // igual que pociones
      sprite.x = i * (this.ANCHO_COZARON + this.ESPACIO) + this.ANCHO_COZARON / 2;
      sprite.y = 10; // igual que pociones
      this.container.addChild(sprite);
      this.corazones.push(sprite);
    }
  }

  perderCorazon() {
    if (this.cantidad > 0) {
      this.cantidad--;
      this.actualizarSprites();
    }
  }

  agregarCorazon() {
    if (this.cantidad < this.TOTAL) {
      this.cantidad++;
      this.actualizarSprites();
    }
  }

  actualizarSprites() {
    for (let i = 0; i < this.TOTAL; i++) {
      const sprite = this.corazones[i];
      sprite.texture = i < this.cantidad ? this.textures.red : this.textures.grey;
    }
  }

  getCantidad() {
    return this.cantidad;
  }
}