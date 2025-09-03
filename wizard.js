import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@7.x/dist/pixi.min.mjs'

export class Mago {
  constructor(texture, x, y, width = 64, height = 64) {
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.width = width;
    this.sprite.height = height;

    this.speed = 5;
    this.canShoot = true;
    this.cooldown = 300;
  }

  mover(dx, dy) {
    this.sprite.x += dx * this.speed;
    this.sprite.y += dy * this.speed;
  }

  disparar(bulletTexture) {
    if (!this.canShoot) return null;

    const bullet = new PIXI.Sprite(bulletTexture);
    bullet.anchor.set(0.5);
    bullet.x = this.sprite.x;
    bullet.y = this.sprite.y;
    bullet.vy = -10;

    this.canShoot = false;
    setTimeout(() => (this.canShoot = true), this.cooldown);

    return bullet;
  }

  agregarAlEscenario(stage) {
    stage.addChild(this.sprite);
  }
}

