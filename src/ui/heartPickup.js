export class HeartPickup {
  constructor(app, onRecolectado) {
    this.app = app;
    this.onRecolectado = onRecolectado;
    this.sprite = new PIXI.Graphics();
    this.sprite.beginFill(0xff69b4); // rosa 
    this.sprite.drawCircle(0, 0, 10);
    this.sprite.endFill();
    this.sprite.x = Math.random() * app.renderer.width;
    this.sprite.y = Math.random() * app.renderer.height;
    this.app.stage.addChild(this.sprite);
  }

  update(wizard) {
    const dx = wizard.x - this.sprite.x;
    const dy = wizard.y - this.sprite.y;
    if (Math.sqrt(dx * dx + dy * dy) < 20) {
      this.app.stage.removeChild(this.sprite);
      this.onRecolectado();
      return false;
    }
    return true;
  }
}