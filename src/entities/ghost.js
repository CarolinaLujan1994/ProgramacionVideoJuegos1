export class Ghost {
  constructor(app, color, textures) {
    this.app = app;
    this.color = color;
    this.hp = 5;
    this.maxHp = 5;

    if (!textures?.alive || !textures?.mid || !textures?.low) {
      console.warn(`Texturas incompletas para fantasma ${color}`);
      this.invalid = true;
      this.sprite = new PIXI.Sprite();
      this.sprite.visible = false;
      this.update = () => { };
      return;
    }

    this.textures = textures;

    // ✅ Textura inicial: estado alive, dirección down
    this.sprite = new PIXI.AnimatedSprite(this.textures.alive.down.slice());
    this.sprite.animationSpeed = 0.1;
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(0.25);
    this.sprite.visible = true;
    this.sprite.play();

    this.sprite.x = Math.random() * 900 + 50;
    this.sprite.y = Math.random() * 700 + 50;

    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;

    this.hpBar = new PIXI.Graphics();
    this.hpText = new PIXI.Text(`${this.hp}/${this.maxHp}`, {
      fontSize: 12,
      fill: '#ffffff',
      fontWeight: 'bold'
    });
    this.hpText.anchor.set(0.5);

    this.app.stage.addChild(this.hpBar);
    this.app.stage.addChild(this.hpText);
    this.app.stage.addChild(this.sprite);
  }

  update() {
    if (this.invalid) return;

    this.sprite.x += this.vx;
    this.sprite.y += this.vy;

    if (this.sprite.x < 20 || this.sprite.x > 980) this.vx *= -1;
    if (this.sprite.y < 20 || this.sprite.y > 780) this.vy *= -1;

    this.actualizarDireccion();
    this.updateHpBar();
  }

  actualizarDireccion() {
    if (this.hp <= 0) return;

    let estado = 'alive';
    if (this.hp <= 3) estado = 'mid';
    if (this.hp <= 1) estado = 'low';

    let direccion = 'down';
    if (Math.abs(this.vx) > Math.abs(this.vy)) {
      direccion = this.vx > 0 ? 'right' : 'left';
    } else {
      direccion = this.vy > 1 ? 'down' : 'up';
    }

    const nuevaTextura = this.textures[estado][direccion]?.slice();
    if (nuevaTextura && nuevaTextura[0]) {
      this.sprite.textures = nuevaTextura;
      this.sprite.play();
    }

  }

  updateHpBar() {
    this.hpBar.clear();

    const barWidth = 24;
    const barHeight = 4;
    const porcentaje = Math.max(this.hp, 0) / this.maxHp;

    this.hpBar.beginFill(0x000000);
    this.hpBar.drawRect(0, 0, barWidth, barHeight);
    this.hpBar.endFill();

    this.hpBar.beginFill(0xff0000);
    this.hpBar.drawRect(0, 0, barWidth * porcentaje, barHeight);
    this.hpBar.endFill();

    this.hpBar.x = this.sprite.x - barWidth / 2;
    this.hpBar.y = this.sprite.y - 20;

    this.hpText.text = `${Math.max(this.hp, 0)}/${this.maxHp}`;
    this.hpText.x = this.sprite.x;
    this.hpText.y = this.sprite.y - 30;

    /*     if (this.hp <= 0) {
          this.sprite.textures = this.textures.low.down.slice();
          this.sprite.gotoAndStop(0);
          this.app.stage.removeChild(this.hpBar);
          this.app.stage.removeChild(this.hpText);
        } */

    if (this.hp <= 0) {
      this.sprite.visible = false;
      this.sprite.stop();
      this.app.stage.removeChild(this.hpBar);
      this.app.stage.removeChild(this.hpText);
    }

  }

  collidesWith(wizard) {
    const dx = wizard.x - this.sprite.x;
    const dy = wizard.y - this.sprite.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    return distancia < 20;
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}