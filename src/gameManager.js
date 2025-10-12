import { Wizard } from './entities/wizard.js';
import { Ghost } from './entities/ghost.js';
import { Potion } from './entities/potion.js';
import { HeartBar } from './ui/heartBar.js';
import { HeartPickup } from './ui/heartPickup.js';
import { ChargeBar } from './ui/chargeBar.js';
import { PocionHUD } from './ui/potionHUD.js';
import { PocionProyectil } from './entities/projectilePotion.js';

export class GameManager {
  constructor() {
    this.app = new PIXI.Application({
      width: 1024,
      height: 780,
      backgroundColor: 0x333333
    });
    document.body.appendChild(this.app.view);

    this.colores = ['red', 'blue', 'green', 'yellow', 'pink'];
    this.ghostTextures = {};

    const loader = new PIXI.Loader();
    this.colores.forEach(color => {
      loader.add(`${color}Ghost`, `src/assets/ghost/${color}Ghost.png`);
      loader.add(`${color}Potion`, `src/assets/potion/${color}Potion.png`);
    });

    loader
      .add('idleWizard', 'src/assets/wizard/idleWizard.png')
      .add('runWizard', 'src/assets/wizard/runWizard.png')
      .add('thrustWizard', 'src/assets/wizard/thrustWizard.png');

    loader.load((loader, resources) => {
      this.colores.forEach(color => {
        const recurso = resources[`${color}Ghost`];
        if (!recurso || !recurso.texture) return;

        const baseTexture = recurso.texture.baseTexture;
        const columnas = 4;
        const filas = 3;
        const frameWidth = baseTexture.width / columnas;
        const frameHeight = baseTexture.height / filas;

        const getFrame = (fila, columna) => {
          const x = columna * frameWidth;
          const y = fila * frameHeight;
          const rect = new PIXI.Rectangle(x, y, frameWidth, frameHeight);
          return new PIXI.Texture(baseTexture, rect);
        };

        const buildSet = (fila) => ({
          up: [getFrame(fila, 0)],
          down: [getFrame(fila, 1)],
          left: [getFrame(fila, 2)],
          right: [getFrame(fila, 3)]
        });

        this.ghostTextures[color] = {
          alive: buildSet(0),
          mid: buildSet(1),
          low: buildSet(2)
        };
      });

      // trexturas de pociones
      this.potionTextures = {};
      this.colores.forEach(color => {
        const recurso = resources[`${color}Potion`];
        if (recurso?.texture) {
          this.potionTextures[color] = recurso.texture;
        }
      });

      // texturas del mago
      const columnasPorEstado = {
        idle: 6,
        run: 8,
        thrust: 7
      };
      const filas = 5;
      const direcciones = ['back', 'left', 'front', 'right'];

      const cortarSprites = (baseTexture, columnas, filas, direcciones) => {
        const frameWidth = 64;   // medidas de cada frame
        const frameHeight = 64;
        const resultado = {};

        direcciones.forEach((dir, fila) => {
          const frames = [];
          for (let col = 0; col < columnas; col++) {
            const x = col * frameWidth;
            const y = fila * frameHeight;
            const rect = new PIXI.Rectangle(x, y, frameWidth, frameHeight);
            frames.push(new PIXI.Texture(baseTexture, rect));
          }
          resultado[dir] = frames;
        });

        return resultado;
      };


      const wizardTextures = {
        idle: cortarSprites(resources.idleWizard.texture.baseTexture, columnasPorEstado.idle, filas, direcciones),
        run: cortarSprites(resources.runWizard.texture.baseTexture, columnasPorEstado.run, filas, direcciones),
        thrust: cortarSprites(resources.thrustWizard.texture.baseTexture, columnasPorEstado.thrust, filas, direcciones)
      };

      this.wizard = new Wizard(this.app, wizardTextures);
      this.iniciarJuego();
    });
  }

  iniciarJuego() {
    // HUD agrupado: barra de carga + pociones
    this.hudContainer = new PIXI.Container();
    this.hudContainer.x = this.app.renderer.width - 140; // ajustá según el ancho total del HUD
    this.hudContainer.y = 20;
    this.app.stage.addChild(this.hudContainer);

    // barra de corazones
    this.heartBar = new HeartBar(this.app, 3);

    // barra de carga
    this.chargeBar = new ChargeBar(this.app);
    this.chargeBar.updatePosition(0, 0); // dentro del hudContainer
    this.hudContainer.addChild(this.chargeBar.container);

    // HUD de pociones alineado debajo
    this.pocionHUD = new PocionHUD(this.app, this.potionTextures);
    this.pocionHUD.container.y = 18; // justo debajo de las barras
    this.hudContainer.addChild(this.pocionHUD.container);

    // pociones disponibles
    this.pociones = this.colores.map(c => new Potion(this.app, c, this.potionTextures[c]));
    this.pocionActiva = null;

    // proyectiles y enemigos
    this.proyectiles = [];
    this.heartPickups = [];
    this.fantasmas = [];

    for (let i = 0; i < 10; i++) {
      const color = this.colores[Math.floor(Math.random() * this.colores.length)];
      const textura = this.ghostTextures[color];
      const valido = textura?.alive?.down?.[0]?._uvs;

      if (!valido) continue;

      let fantasma;
      try {
        fantasma = new Ghost(this.app, color, textura);
      } catch (err) {
        continue;
      }

      if (fantasma && typeof fantasma.update === 'function') {
        this.fantasmas.push(fantasma);
      }
    }

    // interacción del jugador
    this.app.stage.interactive = true;
    this.app.view.addEventListener('contextmenu', e => e.preventDefault());

    this.app.view.addEventListener('pointerdown', e => {
      const rect = this.app.view.getBoundingClientRect();
      const punto = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      if (e.button === 0) {
        this.wizard.setDestino(punto);
      }

      if (e.button === 2) {
        this.wizard.setState('thrust');

        const objetivo = this.fantasmas.find(f => {
          const dx = punto.x - f.x;
          const dy = punto.y - f.y;
          return f.hp > 0 && Math.sqrt(dx * dx + dy * dy) < 20;
        });

        if (objetivo && this.pocionActiva?.cargas > 0) {
          const proyectil = new PocionProyectil(
            this.app,
            { x: this.wizard.x, y: this.wizard.y },
            { x: objetivo.x, y: objetivo.y },
            this.pocionActiva.color,
            () => {
              const daño = (this.pocionActiva.color === objetivo.color) ? 3 : 1;
              objetivo.hp -= daño;
              objetivo.updateHpBar();
              this.pocionActiva.cargas--;
              this.chargeBar.update(this.pocionActiva.color, this.pocionActiva.cargas);
              this.pocionHUD.gastarCarga(this.pocionActiva.color);

              if (this.pocionActiva.cargas <= 0) {
                this.wizard.desactivarAura();
                const siguiente = this.pocionHUD.getSiguientePocion();
                if (siguiente) {
                  this.pocionActiva = { color: siguiente.color, cargas: siguiente.cargas };
                  this.chargeBar.update(siguiente.color, siguiente.cargas);
                  this.wizard.activarAura(siguiente.color);
                } else {
                  this.pocionActiva = null;
                }
              }
            }
          );
          this.proyectiles.push(proyectil);
        }
      }
    });

    this.start();
  }


  start() {
    this.app.ticker.add(() => {
      if (!this.fantasmas || this.fantasmas.length === 0) return;

      // filtrar fantasmas 
      this.fantasmas = this.fantasmas.filter((f, i) => {
        const valido =
          f &&
          typeof f.update === 'function' &&
          typeof f.x === 'number' &&
          typeof f.y === 'number';

        if (!valido) {
          console.warn(`Fantasma inválido ${i}:`, f);
        }

        return valido;
      });

      // ctualizar mago
      this.wizard.update();

      // colisiones
      for (const f of this.fantasmas) {
        try {
          f.update();
        } catch (err) {
          console.error('Error en f.update():', err, f);
          continue;
        }

        const dx = this.wizard.x - f.x;
        const dy = this.wizard.y - f.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);

        if (f.hp > 0 && distancia < 20 && !this.wizard.invulnerable) {
          this.wizard.recibirDanio();
          this.wizard.rebotarDesde(f);
          this.heartBar.perderCorazon();

          const pickup = new HeartPickup(this.app, () => {
            this.heartBar.agregarCorazon();
          });
          this.heartPickups.push(pickup);

          this.wizard.invulnerable = true;
          let tiempoParpadeo = 60;
          const parpadeo = () => {
            tiempoParpadeo--;
            this.wizard.visible = tiempoParpadeo % 10 < 5;
            if (tiempoParpadeo <= 0) {
              this.wizard.visible = true;
              this.wizard.invulnerable = false;
              this.app.ticker.remove(parpadeo);
            }
          };
          this.app.ticker.add(parpadeo);
        }
      }

      // recoger corazones
      this.heartPickups = this.heartPickups.filter(p => p.update(this.wizard));

      // proyectiles ("magia")
      this.proyectiles = this.proyectiles.filter(p => p.update());

      // agarra las pociones
      this.pociones.forEach(p => {
        if (p.visible && p.collidesWith(this.wizard)) {
          const pudoAgregar = this.pocionHUD.agregarPocion(p.color);
          if (pudoAgregar && !this.pocionActiva) {
            this.pocionActiva = { color: p.color, cargas: 5 };
            p.hide();
            this.chargeBar.update(p.color, 5);
            this.wizard.activarAura(p.color);
          } else {
            p.hide();
          }
        }
      });
    });
  }
}