export class Wizard extends PIXI.Container {
  constructor(app, texturesByStateAndDirection) {
    super();

    this.app = app;
    this.texturesByStateAndDirection = texturesByStateAndDirection;

    this.state = 'idle';
    this.direction = 'front';
    this.destino = null;
    this.velocidad = 3;
    this.invulnerable = false;

    // aceleración / desaceleración
    this.velocidad = 3;
    this.velocidadActual = 0;
    this.aceleracion = 0.2;
    this.desaceleracion = 0.3;


    // sprite animado
    this.sprite = new PIXI.AnimatedSprite(this.texturesByStateAndDirection.idle.front);
    this.sprite.animationSpeed = 0.1;
    this.sprite.loop = true;
    this.sprite.play();

    this.sprite.anchor.set(0.5);
    this.sprite.x = 0;
    this.sprite.y = 0;
    this.addChild(this.sprite);

    // "aura" cuando agarra una poción
    this.aura = new PIXI.Graphics();
    this.aura.visible = false;
    this.addChild(this.aura);

    // posición inicial (momentanea)
    this.x = 512;
    this.y = 390;

    //this.app.stage.addChild(this);
  }

  setState(newState) {
    if (this.state !== newState) {
      this.state = newState;
      this.updateTextures();
    }
  }

  setDirection(newDirection) {
    if (this.direction !== newDirection) {
      this.direction = newDirection;
      this.updateTextures();
    }
  }

  updateTextures() {
    const newTextures = this.texturesByStateAndDirection[this.state]?.[this.direction];

    if (newTextures && Array.isArray(newTextures) && newTextures.length > 1) {
      this.sprite.textures = newTextures;

      if (this.state === 'idle') {
        this.sprite.loop = true;
        this.sprite.animationSpeed = 0.1; // animación para estado quieto
        this.sprite.gotoAndPlay(0);
      } else if (this.state === 'run') {
        this.sprite.loop = true;
        this.sprite.animationSpeed = 0.15; // animación para caminar
        this.sprite.gotoAndPlay(0);
      } else if (this.state === 'thrust') {
        this.sprite.loop = false;
        this.sprite.animationSpeed = 0.5; // animacion para atacar
        this.sprite.gotoAndPlay(0);
        this.sprite.onComplete = () => {
          this.setState('idle');
        };
      }
    } else if (newTextures?.length === 1) {
      this.sprite.textures = newTextures;
      this.sprite.gotoAndStop(0);
    } else {
      console.warn(`No se encontraron texturas para estado "${this.state}" y dirección "${this.direction}"`);
    }
  }

  setDestino(pos) {
    this.destino = { x: pos.x, y: pos.y };
    this.setState('run');
    this.setDirection(this.calcularDireccion(pos));
  }

  calcularDireccion(punto) {
    const dx = punto.x - this.x;
    const dy = punto.y - this.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'front' : 'back';
    }
  }

  update() {
    if (this.destino) {
      const dx = this.destino.x - this.x;
      const dy = this.destino.y - this.y;
      const distancia = Math.sqrt(dx * dx + dy * dy);

      // distancia donde empieza a desaceleración
      const zonaFrenado = 25; 

      // --- ACELERAR ---
      if (distancia > zonaFrenado) {
        // acelera a velocidad máxima
        if (this.velocidadActual < this.velocidad) {
          this.velocidadActual += this.aceleracion;
        }
      }
      // --- DESACELERAR ---
      else {
        // va frenando
        if (this.velocidadActual > 0.5) {
          this.velocidadActual -= this.desaceleracion;
        }
      }

      // se mueve según velocidadActual
      if (distancia > this.velocidadActual) {
        this.x += (dx / distancia) * this.velocidadActual;
        this.y += (dy / distancia) * this.velocidadActual;
      } else {
        // llegó
        this.x = this.destino.x;
        this.y = this.destino.y;
        this.destino = null;
        this.velocidadActual = 0; // reset
        this.setState('idle');
      }
    }

    // aura 
    this.aura.x = 0;
    this.aura.y = 0;
  }



  // aura como círculo
  activarAura(color = '#00ffff') {
    this.aura.clear();
    this.aura.beginFill(PIXI.utils.string2hex(color), 0.3);
    this.aura.drawCircle(0, 0, 20);
    this.aura.endFill();
    this.aura.visible = true;
  }

  desactivarAura() {
    this.aura.visible = false;
  }


  recibirDanio(callback) {
    this.sprite.tint = 0xff0000;
    setTimeout(() => {
      this.sprite.tint = 0xffffff;
      if (typeof callback === 'function') {
        callback();
      }
    }, 200);
  }

  rebotarDesde(fantasma) {
    const dx = this.x - fantasma.x;
    const dy = this.y - fantasma.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    const fuerza = 15;

    if (distancia > 0) {
      this.x += (dx / distancia) * fuerza;
      this.y += (dy / distancia) * fuerza;
    }
  }
}