export class HeartPickup {
  constructor(app, texture, onRecolectado) {
    this.app = app;
    this.onRecolectado = onRecolectado;

    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(0.2); 
    this.sprite.alpha = 1;
    this.sprite.visible = true;
    this.sprite.tint = 0xffffff;

    this.sprite.x = Math.random() * app.renderer.width;
    this.sprite.y = Math.random() * app.renderer.height;

    this.app.stage.addChild(this.sprite);
    this.app.stage.setChildIndex(this.sprite, this.app.stage.children.length - 1);
  }

  update(wizard) {
    const dx = wizard.x - this.sprite.x;
    const dy = wizard.y - this.sprite.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);

    if (distancia < 20) {
      this.app.stage.removeChild(this.sprite);
      this.onRecolectado();
      return false;
    }

    return true;
  }
}