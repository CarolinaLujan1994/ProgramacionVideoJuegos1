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
    });

    loader.load((loader, resources) => {
      this.colores.forEach(color => {
        const recurso = resources[`${color}Ghost`];
        if (!recurso || !recurso.texture) {
          console.warn(`No se pudo cargar el spritesheet para ${color}`);
          return;
        }

        const baseTexture = recurso.texture.baseTexture;
        const columnas = 4;
        const filas = 3;

        if (baseTexture.width % columnas !== 0 || baseTexture.height % filas !== 0) {
          console.warn(`Spritesheet ${color}Ghost tiene dimensiones incompatibles: ${baseTexture.width}x${baseTexture.height}`);
          return;
        }

        const frameWidth = baseTexture.width / columnas;
        const frameHeight = baseTexture.height / filas;

        const getFrame = (fila, columna) => {
          const x = columna * frameWidth;
          const y = fila * frameHeight;

          if (x + frameWidth > baseTexture.width || y + frameHeight > baseTexture.height) {
            console.warn(`Frame fuera de límites: fila ${fila}, columna ${columna}`);
            return null;
          }

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

      this.iniciarJuego();
    });
  }

  iniciarJuego() {
    this.wizard = new Wizard(this.app);
    this.heartBar = new HeartBar(this.app, 3);
    this.chargeBar = new ChargeBar(this.app);
    this.chargeBar.updatePosition(this.app.renderer.width - 60, 20);
    this.pocionHUD = new PocionHUD(this.app);
    this.app.stage.addChild(this.chargeBar.container);
    this.pociones = this.colores.map(c => new Potion(this.app, c));
    this.pocionActiva = null;
    this.proyectiles = [];
    this.heartPickups = [];
    this.fantasmas = [];

    for (let i = 0; i < 10; i++) {
      const color = this.colores[Math.floor(Math.random() * this.colores.length)];
      const textura = this.ghostTextures[color];

      const esTexturaValida = (t) =>
        Array.isArray(t) &&
        t[0] instanceof PIXI.Texture &&
        t[0]?._uvs !== undefined;

      const valid =
        esTexturaValida(textura?.alive?.down) &&
        esTexturaValida(textura?.mid?.down) &&
        esTexturaValida(textura?.low?.down);

      if (!valid) {
        console.warn(`Textura inválida para fantasma ${color}:`, {
          aliveDown: textura?.alive?.down?.[0],
          midDown: textura?.mid?.down?.[0],
          lowDown: textura?.low?.down?.[0]
        });
        continue;
      }

      let fantasma;
      try {
        fantasma = new Ghost(this.app, color, textura);
      } catch (err) {
        console.error(`Error al instanciar fantasma ${color}:`, err);
        continue;
      }

      if (
        fantasma &&
        typeof fantasma.update === 'function' &&
        typeof fantasma.x === 'number' &&
        typeof fantasma.y === 'number' &&
        !fantasma.invalid
      ) {
        this.fantasmas.push(fantasma);
      } else {
        console.warn(`Fantasma inválido descartado:`, fantasma);
      }
    }

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
        const objetivo = this.fantasmas.find(f => {
          if (!f || typeof f.update !== 'function' || f.invalid) return false;
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

      this.wizard.update();

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
            this.wizard.graphic.visible = tiempoParpadeo % 10 < 5;
            if (tiempoParpadeo <= 0) {
              this.wizard.graphic.visible = true;
              this.wizard.invulnerable = false;
              this.app.ticker.remove(parpadeo);
            }
          };
          this.app.ticker.add(parpadeo);
        }
      }

      this.heartPickups = this.heartPickups.filter(p => p.update(this.wizard));
      this.proyectiles = this.proyectiles.filter(p => p.update());



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