export class Ghost {
  constructor(app, color) {
    this.app = app;
    this.color = color;
    this.hp = 5;
    this.maxHp = 5;

    this.sprite = new PIXI.Graphics();
    this.sprite.beginFill(PIXI.utils.string2hex(color));
    this.sprite.drawCircle(0, 0, 12);
    this.sprite.endFill();

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

    this.app.stage.addChild(this.sprite);
    this.app.stage.addChild(this.hpBar);
    this.app.stage.addChild(this.hpText);

    this.updateHpBar();
  }

  update() {
    this.sprite.x += this.vx;
    this.sprite.y += this.vy;

    // Rebote
    if (this.sprite.x < 20 || this.sprite.x > 980) this.vx *= -1;
    if (this.sprite.y < 20 || this.sprite.y > 780) this.vy *= -1;

    this.updateHpBar();
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

    if (this.hp <= 0) {
      this.app.stage.removeChild(this.sprite);
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