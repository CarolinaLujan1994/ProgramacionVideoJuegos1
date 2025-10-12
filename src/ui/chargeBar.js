export class ChargeBar {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.barras = [];
    this.x = 0;
    this.y = 0;
    this.color = null;
    this.cantidad = 0;

    // configuración visual de las barritas
    this.TOTAL = 5;
    this.ESPACIO = 6;
    this.ANCHO_BARRA = 16;
    this.ALTO_BARRA = 10;
    this.ANCHO_POCION = 20;
    this.GROSOR_CONTORNO = 2; 
  }

  update(color, cantidad) {
    this.color = color;
    this.cantidad = cantidad;

    this.barras.forEach(b => this.container.removeChild(b));
    this.barras = [];

    for (let i = 0; i < this.TOTAL; i++) {
      const barra = new PIXI.Graphics();

      // contorno negro (más grande)
      barra.beginFill(0x000000);
      barra.drawRoundedRect(0, 0, this.ANCHO_BARRA, this.ALTO_BARRA, 4);
      barra.endFill();

      // relleno encima 
      const rellenoColor = i < cantidad
        ? PIXI.utils.string2hex(color)
        : 0x444444;

      const g = this.GROSOR_CONTORNO;

      barra.beginFill(rellenoColor);
      barra.drawRoundedRect(g, g, this.ANCHO_BARRA - 2 * g, this.ALTO_BARRA - 2 * g, 3);
      barra.endFill();

      // Ppsición alineada con pociones
      barra.x = i * (this.ANCHO_POCION + this.ESPACIO) + this.ANCHO_POCION / 2 - this.ANCHO_BARRA / 2;
      barra.y = 0;

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