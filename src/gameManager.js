import { Wizard } from './entities/wizard.js';
import { Ghost } from './entities/ghost.js';
import { Potion } from './entities/potion.js';
import { HeartBar } from './ui/heartBar.js';
import { HeartPickup } from './ui/heartPickup.js';
import { ChargeBar } from './ui/chargeBar.js';
import { PocionHUD } from './ui/potionHUD.js';
import { PocionProyectil } from './entities/projectilePotion.js';
import { Pumpkin } from './entities/pumpkin.js';

export class GameManager {

  constructor() {
    this.app = new PIXI.Application({
      //width: 1024,
      //height: 780,
      resizeTo: window,
      //backgroundColor: 0x333333
    });
    document.body.appendChild(this.app.view);

    // cámara
    this.camara = new PIXI.Container();
    this.app.stage.addChild(this.camara);

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
      .add('thrustWizard', 'src/assets/wizard/thrustWizard.png')
      .add('redHeart', 'src/assets/hearts/redHeart.png')
      .add('greyHeart', 'src/assets/hearts/greyHeart.png')
      .add('fondo', 'src/assets/background/background2.png')

    loader.load((loader, resources) => {
      const mapaWidth = 2500;
      const mapaHeight = 1500;

      const fondoTexture = resources.fondo.texture;
      this.fondo = new PIXI.TilingSprite(
        fondoTexture,
        mapaWidth,
        mapaHeight
      );
      this.fondo.tileScale.set(1);
      this.fondo.tilePosition.set(0, 0);
      this.fondo.position.set(0, 0)

      // fondo agregado
      this.camara.addChildAt(this.fondo, 0);

      const minZoomX = this.app.renderer.width / mapaWidth;
      const minZoomY = this.app.renderer.height / mapaHeight;
      const minZoom = Math.max(minZoomX, minZoomY);

      // zoom inicial mínimo
      this.camara.scale.set(minZoom);


      // fantasmas
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

      // pociones
      this.potionTextures = {};
      this.colores.forEach(color => {
        const recurso = resources[`${color}Potion`];
        if (recurso?.texture) {
          this.potionTextures[color] = recurso.texture;
        }
      });

      // corazones
      this.heartTextures = {
        red: resources.redHeart.texture,
        grey: resources.greyHeart.texture
      };

      // mago
      const columnasPorEstado = {
        idle: 6,
        run: 8,
        thrust: 7
      };
      const filas = 5;
      const direcciones = ['back', 'left', 'front', 'right'];

      const cortarSprites = (baseTexture, columnas, filas, direcciones) => {
        const frameWidth = 64;
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
      this.camara.addChild(this.wizard); // mago dentro de la cámara

      // cámara que sigue al mago
      /*       this.app.ticker.add(() => {
              this.camara.pivot.x = this.wizard.x;
              this.camara.pivot.y = this.wizard.y;
              this.camara.position.x = this.app.renderer.width / 2;
              this.camara.position.y = this.app.renderer.height / 2;
            }); */

      if (!this.camara.scaleSet) {
        this.camara.scale.set(1.0);
        this.camara.scaleSet = true; // evita que se reestablezca en cada frame
      }


      this.app.ticker.add(() => {
        // zoom mínimo para que el fondo cubra la ventana
        const minZoomX = this.app.renderer.width / mapaWidth;
        const minZoomY = this.app.renderer.height / mapaHeight;
        const minZoom = Math.max(minZoomX, minZoomY);
        const maxZoom = 2;

        // limitar el zoom
        this.camara.scale.x = Math.max(minZoom, Math.min(this.camara.scale.x, maxZoom));
        this.camara.scale.y = Math.max(minZoom, Math.min(this.camara.scale.y, maxZoom));

        // limitar movimiento del mago dentro del mapa
        const margen = 0;
        this.wizard.x = Math.max(margen, Math.min(this.wizard.x, mapaWidth - margen));
        this.wizard.y = Math.max(margen, Math.min(this.wizard.y, mapaHeight - margen));

        // calculo de mitad de pantalla ajustada al zoom
        const halfWidth = this.app.renderer.width / 2 / this.camara.scale.x;
        const halfHeight = this.app.renderer.height / 2 / this.camara.scale.y;

        // limitar la cámara para que no se salga del mapa
        const minPivotX = halfWidth;
        const maxPivotX = mapaWidth - halfWidth;
        const minPivotY = halfHeight;
        const maxPivotY = mapaHeight - halfHeight;

        let pivotX = this.wizard.x;
        let pivotY = this.wizard.y;

        pivotX = Math.max(minPivotX, Math.min(pivotX, maxPivotX));
        pivotY = Math.max(minPivotY, Math.min(pivotY, maxPivotY));

        // posición de cámara
        this.camara.pivot.set(pivotX, pivotY);
        this.camara.position.set(this.app.renderer.width / 2, this.app.renderer.height / 2);
      });



      // zoom con rueda del mouse
      this.app.view.addEventListener('wheel', (e) => {
        const zoomFactor = 1.05;
        const scale = e.deltaY < 0
          ? this.camara.scale.x * zoomFactor
          : this.camara.scale.x / zoomFactor;

        const clamped = Math.max(0.5, Math.min(2, scale));
        this.camara.scale.set(clamped);

        if (this.fondo) {
          this.fondo.tileScale.set(clamped);
        }
      });

      this.iniciarJuego();
    });
  }

  iniciarJuego() {
    // texturas de corazones
    const heartTextures = this.heartTextures;

    //console.log(heartTextures)

    // crear barra de corazones con 3 vidas (a revisar)
    this.heartBar = new HeartBar(this.app, 3, heartTextures);

    // hud agrupado: barra de carga + pociones
    this.hudContainer = new PIXI.Container();
    this.hudContainer.x = this.app.renderer.width - 140; // se ajusta según el ancho total del hud
    this.hudContainer.y = 20;
    this.app.stage.addChild(this.hudContainer);

    // barra de carga
    this.chargeBar = new ChargeBar(this.app);
    this.chargeBar.updatePosition(0, 0); // dentro del hudContainer
    this.hudContainer.addChild(this.chargeBar.container);

    // hud de pociones alineado debajo
    this.pocionHUD = new PocionHUD(this.app, this.potionTextures);
    this.pocionHUD.container.y = 18; // justo debajo de las barras
    this.hudContainer.addChild(this.pocionHUD.container);

    // contador de fantasmas
    this.totalFantasmas = 60;
    this.fantasmasVivos = 60;

    this.contadorFantasmas = new PIXI.Text(`60/60`, {
      fontSize: 16,
      fill: '#ffffff',
      fontWeight: 'bold'
    });
    this.contadorFantasmas.x = 20;
    this.contadorFantasmas.y = 20;
    this.app.stage.addChild(this.contadorFantasmas);

    //---------------

    this.pumpkinTexture = PIXI.Texture.from('src/assets/pumpkin/pumpkin.png');

    // pociones disponibles al iniciar el juego
    this.pociones = [];

    const cantidadPorColor = 4; 

    this.colores.forEach(color => {
      for (let i = 0; i < cantidadPorColor; i++) {
        const pocion = new Potion(this.app, color, this.potionTextures[color]);
        this.pociones.push(pocion);
        if (pocion.sprite) {
          this.camara.addChild(pocion.sprite); 
        }
      }
    });



    // proyectiles y enemigos
    this.proyectiles = [];
    this.heartPickups = [];
    this.fantasmas = [];

    for (let i = 0; i < 50; i++) {
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
        this.camara.addChild(fantasma.sprite);
      }
    }

    // crear calabazas
    this.pumpkins = [];

    for (let i = 0; i < 60; i++) {
      //const pumpkin = new Pumpkin(this.app, this.pumpkinTexture, this.heartTextures.red);
      const pumpkin = new Pumpkin(this.app, this.pumpkinTexture, this);
      this.pumpkins.push(pumpkin);
      this.camara.addChild(pumpkin.sprite);
    }

    // interacción del jugador
    this.app.stage.interactive = true;
    this.app.view.addEventListener('contextmenu', e => e.preventDefault());

    this.app.view.addEventListener('pointerdown', e => {
      const rect = this.app.view.getBoundingClientRect();
      /* const punto = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }; */
      const punto = this.camara.toLocal(new PIXI.Point(e.clientX - rect.left, e.clientY - rect.top));

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
            this.camara,
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
          this.camara.addChild(proyectil.container) //cambiar por sprite después
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

      // colisiones con fantasmas
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
          this.wizard.rebotarDesde(f);
          this.heartBar.perderCorazon();

          this.wizard.recibirDanio(() => {
            if (this.heartBar.getCantidad() < 5) {
              const redHeartTexture = this.heartTextures?.red;

              const heartPickup = new HeartPickup(this.app, redHeartTexture, () => {
                this.heartBar.agregarCorazon();
              });

              this.heartPickups.push(heartPickup);

            }
          });


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
      // primero elimina los corazones recogidos
      this.heartPickups = this.heartPickups.filter(p => {
        const activo = p.update(this.wizard);
        if (!activo && p.sprite?.parent) {
          p.sprite.parent.removeChild(p.sprite); // elimina visualmente
        }
        return activo;
      });

      // despu[es agrega los nuevos corazones que aún no están en escena
      this.heartPickups.forEach(p => {
        if (p.sprite && !this.camara.children.includes(p.sprite)) {
          this.camara.addChild(p.sprite); //agregar corazones a la camara 
        }
      });

      // actualizacion del mago al chocar con una calabaza
      this.pumpkins.forEach(p => {
        p.update(this.wizard, this.heartBar);
      });

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