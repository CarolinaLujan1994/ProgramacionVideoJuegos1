export class Ghost {
  constructor(app, color, textures, camara) {
    this.app = app;
    this.color = color;
    this.hp = 5;
    this.maxHp = 5;
    this.camara = camara;

    if (!textures?.alive || !textures?.mid || !textures?.low) {
      console.warn(`Texturas incompletas para fantasma ${color}`);
      this.invalid = true;
      this.sprite = new PIXI.Sprite();
      this.sprite.visible = false;
      this.update = () => {};
      return;
    }

    this.textures = textures;

    this.sprite = new PIXI.AnimatedSprite(this.textures.alive.down.slice());
    this.sprite.animationSpeed = 0.05;
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(0.15);
    this.sprite.visible = true;
    this.sprite.play();

    const margen = 50;
    this.sprite.x = Math.random() * (2500 - margen * 2) + margen;
    this.sprite.y = Math.random() * (1500 - margen * 2) + margen;

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

    this.esTeleportador = Math.random() < 0.3;
    this.tiempoParaTeleport = Math.random() * 300 + 200;
  }

  update() {
    if (this.invalid) return;

    this.sprite.x += this.vx;
    this.sprite.y += this.vy;

    if (this.sprite.x < 20 || this.sprite.x > 2500) this.vx *= -1;
    if (this.sprite.y < 20 || this.sprite.y > 1500) this.vy *= -1;

    this.actualizarDireccion();
    this.updateHpBar();

    if (this.esTeleportador && this.hp > 0) {
      this.tiempoParaTeleport--;
      if (this.tiempoParaTeleport <= 0) {
        this.teletransportar();
        this.tiempoParaTeleport = Math.random() * 300 + 200;
      }
    }
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

    if (this.hp <= 0 && this.sprite.alpha > 0) {
      this.sprite.stop();
      this.app.stage.removeChild(this.hpBar);
      this.app.stage.removeChild(this.hpText);

      // actualizar contador global
      if (typeof this.app.fantasmasVivos === 'number' && this.app.contadorFantasmas) {
        this.app.fantasmasVivos--;
        this.app.contadorFantasmas.text = `${this.app.fantasmasVivos}/${this.app.totalFantasmas}`;
      }

      let alpha = this.sprite.alpha;
      const fadeOut = () => {
        alpha -= 0.05;
        this.sprite.alpha = alpha;
        if (alpha <= 0) {
          this.app.stage.removeChild(this.sprite);
          this.app.ticker.remove(fadeOut);
        }
      };
      this.app.ticker.add(fadeOut);
    }
  }

  teletransportar() {
    const fadeOut = () => {
      this.sprite.alpha -= 0.1;
      if (this.sprite.alpha <= 0) {
        this.sprite.alpha = 0;
        this.app.ticker.remove(fadeOut);

        const margen = 50;
        this.sprite.x = Math.random() * (2500 - margen * 2) + margen;
        this.sprite.y = Math.random() * (1500 - margen * 2) + margen;

        this.app.ticker.add(fadeIn);
      }
    };

    const fadeIn = () => {
      this.sprite.alpha += 0.1;
      if (this.sprite.alpha >= 1) {
        this.sprite.alpha = 1;
        this.app.ticker.remove(fadeIn);
      }
    };

    this.app.ticker.add(fadeOut);
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