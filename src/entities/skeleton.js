export class Skeleton {
  constructor(app, textures, camara, wizard, skeletons) {
    this.app = app;
    this.textures = textures;
    this.camara = camara;
    this.wizard = wizard;
    this.skeletons = skeletons;


    this.hp = 3;
    this.maxHp = 3;
    this.speed = 0.8;
    this.state = 'idle';
    this.respawnDelay = 600;
    this.respawnCounter = 0;
    this.direccionActual = -1; // dirección visual actual
    this.animacionesPorFila = {};

    if (!textures?.walk) {
      console.warn('Textura de caminata faltante para Skeleton');
      this.invalid = true;
      this.sprite = new PIXI.Sprite();
      this.sprite.visible = false;
      this.update = () => { };
      return;
    }

    this.sprite = new PIXI.AnimatedSprite(textures.walk.slice(0, 6)); // fila 0 por defecto
    this.sprite.animationSpeed = 0.5;
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(1);
    this.sprite.visible = true;
    this.sprite.play();

    const margen = 50;
    this._x = Math.random() * (2500 - margen * 2) + margen;
    this._y = Math.random() * (1500 - margen * 2) + margen;

    this.sprite.x = this._x;
    this.sprite.y = this._y;

    this.hpBar = new PIXI.Graphics();
    this.hpText = new PIXI.Text(`${this.hp}/${this.maxHp}`, {
      fontSize: 12,
      fill: '#ffffff',
      fontWeight: 'bold'
    });
    this.hpText.anchor.set(0.5);

    this.app.stage.addChild(this.sprite);
  }

  update() {
    if (this.invalid || this.hp <= 0) {
      this.respawnCounter++;
      if (this.respawnCounter >= this.respawnDelay) {
        this.respawn();
      }
      return;
    }

    this.perseguirMago();
    this.updateHpBar();

    if (this.collidesWith(this.wizard)) {
      this.wizard.recibirDanio();
    }
  }

perseguirMago() {
  const targetX = this.wizard.x ?? this.wizard.sprite?.x;
  const targetY = this.wizard.y ?? this.wizard.sprite?.y;

  const dx = targetX - this._x;
  const dy = targetY - this._y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 0.5) {
    const nextX = this._x + (dx / dist) * this.speed;
    const nextY = this._y + (dy / dist) * this.speed;

    // Verificar colisión con otros esqueletos
    const radioColision = 24; // ajustado al tamaño real del sprite
    let bloqueado = false;

    for (const otro of this.skeletons) {
      if (otro === this || otro.hp <= 0) continue;

      const dX = otro.x - nextX;
      const dY = otro.y - nextY;
      const distancia = Math.sqrt(dX * dX + dY * dY);

      if (distancia < radioColision) {
        bloqueado = true;
        break;
      }
    }

    if (!bloqueado) {
      this._x = nextX;
      this._y = nextY;
    }

    // direcciones
    let fila;
    if (Math.abs(dx) > Math.abs(dy)) {
      fila = dx > 0 ? 3 : 1; // derecha o izquierda
    } else {
      fila = dy > 0 ? 2 : 0; // sur o norte
    }

    if (fila !== this.direccionActual) {
      if (!this.animacionesPorFila[fila]) {
        const framesPorFila = 9;
        const inicio = fila * framesPorFila;
        const fin = inicio + framesPorFila;
        this.animacionesPorFila[fila] = this.textures.walk.slice(inicio, fin);
      }

      this.sprite.textures = this.animacionesPorFila[fila];
      this.sprite.animationSpeed = 0.5;
      this.sprite.play();
      this.direccionActual = fila;
    }
  }

  this.sprite.rotation = 0;
  this.sprite.x = this._x;
  this.sprite.y = this._y;
}

  updateHpBar() {
    this.hpBar.clear();

    const barWidth = 24;
    const barHeight = 4;
    const porcentaje = Math.max(this.hp, 0) / this.maxHp;

    this.hpBar.beginFill(0x000000);
    this.hpBar.drawRect(0, 0, barWidth, barHeight);
    this.hpBar.endFill();

    this.hpBar.beginFill(0xaaaaaa);
    this.hpBar.drawRect(0, 0, barWidth * porcentaje, barHeight);
    this.hpBar.endFill();

    this.hpBar.x = this._x - barWidth / 2;
    this.hpBar.y = this._y - 20;

    this.hpText.text = `${Math.max(this.hp, 0)}/${this.maxHp}`;
    this.hpText.x = this._x;
    this.hpText.y = this._y - 30;

    if (this.hp <= 0 && this.sprite.alpha > 0) {
      this.sprite.stop();

      let alpha = this.sprite.alpha;
      const fadeOut = () => {
        alpha -= 0.05;
        this.sprite.alpha = alpha;
        if (alpha <= 0) {
          this.sprite.visible = false;
          this.app.ticker.remove(fadeOut);
        }
      };
      this.app.ticker.add(fadeOut);

      this.hpBar.visible = false;
      this.hpText.visible = false;

      this.respawnCounter = 0;
    }
  }

  respawn() {
    this.hp = this.maxHp;
    this.sprite.alpha = 1;
    this.sprite.visible = true;

    this.hpBar.visible = true;
    this.hpText.visible = true;

    if (!this.camara.children.includes(this.sprite)) {
      this.camara.addChild(this.sprite);
    }

    const margen = 50;
    this._x = Math.random() * (2500 - margen * 2) + margen;
    this._y = Math.random() * (1500 - margen * 2) + margen;

    this.sprite.x = this._x;
    this.sprite.y = this._y;

    this.respawnCounter = 0;
  }

  collidesWith(target) {
    const dx = target.x - this._x;
    const dy = target.y - this._y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    return distancia < 20;
  }

  get x() { return this._x; }
  get y() { return this._y; }
}