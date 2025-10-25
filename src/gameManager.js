import { Wizard } from './entities/wizard.js';
import { Ghost } from './entities/ghost.js';
import { Potion } from './entities/potion.js';
import { HeartBar } from './ui/heartBar.js';
import { HeartPickup } from './ui/heartPickup.js';
import { ChargeBar } from './ui/chargeBar.js';
import { PocionHUD } from './ui/potionHUD.js';
import { PocionProyectil } from './entities/projectilePotion.js';
import { Pumpkin } from './entities/pumpkin.js';
import { Skeleton } from './entities/skeleton.js';

const PIXI = window.PIXI;

export class GameManager {
  constructor() {
    this.app = new PIXI.Application({
      //width: 1024,
      //height: 780,
      resizeTo: window,
      //backgroundColor: 0x333333
    });
    document.body.appendChild(this.app.view);

    this.victoriaMostrada = false;

    PIXI.sound.muteAll = true;


    // cámara
    this.camara = new PIXI.Container();
    this.app.stage.addChild(this.camara);

    this.colores = ['red', 'blue', 'green', 'yellow', 'pink'];
    this.ghostTextures = {};

    this.skeletons = [];
    this.skeletonsActivated = false;
    this.skeletonTextures = null;


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
      .add('skeleton', 'src/assets/skeleton/skeleton.png')

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

      // esqueleto textura
      const skeletonBase = resources.skeleton.texture.baseTexture;
      const skeletonFrames = [];
      const columnasSkeleton = 9;
      const filasSkeleton = 4;
      const frameWidth = 512 / columnasSkeleton;
      const frameHeight = 256 / filasSkeleton;

      for (let i = 0; i < filasSkeleton * columnasSkeleton; i++) {
        const x = (i % columnasSkeleton) * frameWidth;
        const y = Math.floor(i / columnasSkeleton) * frameHeight;
        const rect = new PIXI.Rectangle(x, y, frameWidth, frameHeight);
        skeletonFrames.push(new PIXI.Texture(skeletonBase, rect));
      }

      this.skeletonTextures = {
        walk: skeletonFrames
      };


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

      if (this.wizard) {
        this.wizard.x = mapaWidth / 2;
        this.wizard.y = mapaHeight / 2;
      }


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

      // esquelos que aparecen cuando quedan 10 fantmas
      const fantasmasVivos = this.ghosts?.filter(g => g.hp > 0).length || 0;

      if (fantasmasVivos <= 10 && !this.skeletonsActivated) {
        this.skeletonsActivated = true;
        this.spawnSkeletonGroup(); // genera los primeros 5
      }
      // actualizacion de esqueletos
      this.skeletons.forEach(skeleton => skeleton.update());

      // pausar juego
      let juegoPausado = false;
      let textoPausa = null;

      window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'p') {
          juegoPausado = !juegoPausado;

          if (juegoPausado) {
            PIXI.sound.play('pause')
            if (!textoPausa) {
              textoPausa = new PIXI.Text('JUEGO PAUSADO', {
                fontFamily: 'Press Start 2P',
                fontSize: 50,
                fill: '#000000ff',
                stroke: '#bf36e9ff',
                strokeThickness: 4
              });
              textoPausa.anchor.set(0.5);
              textoPausa.x = this.app.renderer.width / 2;
              textoPausa.y = this.app.renderer.height * 0.3;
              this.app.stage.addChild(textoPausa);
            }
            textoPausa.visible = true;
            this.app.renderer.render(this.app.stage);
            this.app.stop();
          } else {
            if (textoPausa) {
              textoPausa.visible = false;
            }
            PIXI.sound.play('pause')
            this.app.start();

          }
        }
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

      this.mostrarPantallaInicio();
    });
  }

  iniciarJuego() {

    // texturas de corazones
    const heartTextures = this.heartTextures;

    // crear barra de corazones con 3 vidas (a revisar)
    this.heartBar = new HeartBar(this.app, 5, heartTextures);

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
    this.totalFantasmas = 1;
    this.fantasmasVivos = 1;

    this.contadorFantasmas = new PIXI.Text(`${this.fantasmasVivos}/${this.totalFantasmas}`, {
      fontFamily: 'Press Start 2P',
      fontSize: 30,
      fill: '#ffffff',
      fontWeight: 'normal',
      stroke: '#000000',
      strokeThickness: 4
    });

    this.contadorFantasmas.anchor.set(0.5);
    this.contadorFantasmas.x = this.app.renderer.width / 2;
    this.contadorFantasmas.y = 35;

    this.contadorFantasmas.style.stroke = '#000000';
    this.contadorFantasmas.style.strokeThickness = 2;

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
    this.skeletons = [];
    this.skeletonsActivated = false;


    for (let i = 0; i < this.fantasmasVivos; i++) {
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

    for (let i = 0; i < 120; i++) {
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
      const punto = this.camara.toLocal(new PIXI.Point(e.clientX - rect.left, e.clientY - rect.top));

      if (e.button === 0) {
        this.wizard.setDestino(punto);
      }

      if (e.button === 2) {
        this.wizard.setState('thrust');

        // buscar un objetivo: fantasma o esqueleto
        const objetivo =
          this.fantasmas.find(f => {
            const dx = punto.x - f.x;
            const dy = punto.y - f.y;
            return f.hp > 0 && Math.sqrt(dx * dx + dy * dy) < 20;
          }) ||
          this.skeletons.find(s => {
            const dx = punto.x - s.x;
            const dy = punto.y - s.y;
            return s.hp > 0 && Math.sqrt(dx * dx + dy * dy) < 20;
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

              if (objetivo.hp <= 0) {
                if (objetivo.constructor.name === 'Ghost') {
                  PIXI.sound.play('killingGhost');
                } else if (objetivo.constructor.name === 'Skeleton') {
                  //PIXI.sound.play('killingSkeleton');
                }

                // eliminar del escenario
                this.camara.removeChild(objetivo.sprite);

                // los esqueletos reaparecen después de 10 segundos
                setTimeout(() => {
                  if (objetivo && typeof objetivo.respawn === 'function') {
                    objetivo.respawn();
                    this.camara.addChild(objetivo.sprite);
                  }
                }, 10000);
              }

              // hud de pociones
              this.pocionActiva.cargas--;
              PIXI.sound.play('shoot');
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
                  PIXI.sound.play('outOfPotion');
                  this.pocionActiva = null;
                }
              }
            }


          );

          this.proyectiles.push(proyectil);
          this.camara.addChild(proyectil.sprite);
        }
      }

    });

    this.start();
  }

  start() {
    this.update = () => {
      if (this.wizard) {
        // posición inicial solo si no está en cámara
        if (!this.camara.children.includes(this.wizard)) {
          this.wizard.x = this.fondo.x + this.fondo.width / 2;
          this.wizard.y = this.fondo.y + this.fondo.height / 2;
          this.camara.addChild(this.wizard);
        }

        this.wizard.update(); // actualización del mago
      }

      if (!this.fantasmas || this.fantasmas.length === 0) return;

      // filtrar fantasmas válidos
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



      // activar game Over
      if (this.heartBar.getCantidad() <= 0 && !this.gameOverMostrado) {
        this.gameOverMostrado = true;
        this.iniciarTransicionDerrota();
      }

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
            PIXI.sound.play('hurt')
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

      // mostrar la pantalla de victoria
      const todosMuertos = this.fantasmas.every(f => f.hp <= 0);
      if (todosMuertos && !this.victoriaMostrada) {
        this.victoriaMostrada = true;
        this.iniciarTransicionVictoria();
      }

      // contador de fantasmas
      this.fantasmasVivos = this.fantasmas.filter(f => f.hp > 0).length;
      this.contadorFantasmas.text = `${this.fantasmasVivos}/${this.totalFantasmas}`;

      // recoger corazones
      this.heartPickups = this.heartPickups.filter(p => {
        const activo = p.update(this.wizard);
        if (!activo && p.sprite?.parent) {
          p.sprite.parent.removeChild(p.sprite);
        }
        return activo;
      });

      // insertar los corazones a la camara
      this.heartPickups.forEach(p => {
        if (p.sprite && !this.camara.children.includes(p.sprite)) {
          this.camara.addChild(p.sprite);
        }
      });

      // insertar los esqueletos a la camara
      this.skeletons.forEach(p => {
        if (p.sprite && !this.camara.children.includes(p.sprite)) {
          this.camara.addChild(p.sprite);
        }
      });

      // colisiones con calabazas
      this.pumpkins.forEach(p => {
        p.update(this.wizard, this.heartBar);
      });

      // colisiones con esqueletos
      for (const s of this.skeletons) {
        try {
          s.update();
        } catch (err) {
          console.error('Error en s.update():', err, s);
          continue;
        }

        const dx = this.wizard.x - s.x;
        const dy = this.wizard.y - s.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);

        if (s.hp > 0 && distancia < 20 && !this.wizard.invulnerable) {
          this.wizard.rebotarDesde(s);
          this.heartBar.perderCorazon();

          this.wizard.recibirDanio(() => {
            PIXI.sound.play('hurt');
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


      // proyectiles
      this.proyectiles = this.proyectiles.filter(p => p.update());

      // los esqueletos aparecen cuando quedan 10 fantasmas
      if (this.fantasmasVivos <= 10) {
        if (!this.skeletonsActivated) {
          this.skeletonsActivated = true;
          this.spawnSkeletonGroup();
        }
      } else {
        this.skeletonsActivated = false; // permite reaparecer esqueletos otra vez
      }


      // pociones
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
          PIXI.sound.play('pickUpPotion')
        }
      });
    };
    this.app.ticker.add(this.update); // loop controlado
  }

  // cantidad de esqueletos que aparecen 
  spawnSkeletonGroup() {
    for (let i = 0; i < 5; i++) {
      const skeleton = new Skeleton(this.app, this.skeletonTextures, this.camara, this.wizard);
      this.skeletons.push(skeleton);
    }
  }

  // inicio del juego
  mostrarPantallaInicio() {
    this.app.stage.removeChildren();

    this.gameOverMostrado = false;
    this.fantasmasVivos = 0;
    this.fantasmas = [];
    this.proyectiles = [];
    this.heartPickups = [];
    this.pocionActiva = null;

    const fondoNegro = new PIXI.Graphics();
    fondoNegro.beginFill(0x0f0f0f);
    fondoNegro.drawRect(0, 0, this.app.renderer.width, this.app.renderer.height);
    fondoNegro.endFill();
    this.app.stage.addChild(fondoNegro);

    // titulo del juego
    const titulo = new PIXI.Text('ARCANE ESCAPE', {
      fontFamily: 'Press Start 2P',
      fontSize: 50,
      fill: '#000000ff',
      stroke: '#bf36e9ff',
      strokeThickness: 4
    });
    titulo.anchor.set(0.5);
    titulo.x = this.app.renderer.width / 2;
    titulo.y = this.app.renderer.height * 0.25; // más arriba
    this.app.stage.addChild(titulo);

    // boton comenzar
    const botonComenzar = new PIXI.Text('COMENZAR', {
      fontFamily: 'Press Start 2P',
      fontSize: 25,
      fill: '#000000ff',
      stroke: '#bf36e9ff',
      strokeThickness: 4
    });
    botonComenzar.anchor.set(0.5);
    botonComenzar.x = this.app.renderer.width / 2;
    botonComenzar.y = this.app.renderer.height * 0.7;
    botonComenzar.interactive = true;
    botonComenzar.buttonMode = true;
    botonComenzar.on('pointerdown', () => {
      PIXI.sound.play('pressButton');
      this.mostrarIntroNarrativa()
    });
    this.app.stage.addChild(botonComenzar);

    // boton tutorial
    const botonTutorial = new PIXI.Text('TUTORIAL', {
      fontFamily: 'Press Start 2P',
      fontSize: 25,
      fill: '#000000ff',
      stroke: '#bf36e9ff',
      strokeThickness: 4
    });
    botonTutorial.anchor.set(0.5);
    botonTutorial.x = this.app.renderer.width / 2;
    botonTutorial.y = this.app.renderer.height * 0.8;
    botonTutorial.interactive = true;
    botonTutorial.buttonMode = true;
    botonTutorial.on('pointerdown', () => {
      PIXI.sound.play('pressButton');
      this.mostrarTutorial()
    });
    this.app.stage.addChild(botonTutorial);

    // boton creditos
    const botonCreditos = new PIXI.Text('CRÉDITOS', {
      fontFamily: 'Press Start 2P',
      fontSize: 25,
      fill: '#000000ff',
      stroke: '#bf36e9ff',
      strokeThickness: 4
    });
    botonCreditos.anchor.set(0.5);
    botonCreditos.x = this.app.renderer.width / 2;
    botonCreditos.y = this.app.renderer.height * 0.9;
    botonCreditos.interactive = true;
    botonCreditos.buttonMode = true;
    botonCreditos.on('pointerdown', () => {
      PIXI.sound.play('pressButton');
      this.mostrarCreditos()
    });
    this.app.stage.addChild(botonCreditos);
  }

  // pantalla de creditos
  mostrarCreditos() {
    this.app.stage.removeChildren();

    const fondoNegro = new PIXI.Graphics();
    fondoNegro.beginFill(0x0f0f0f);
    fondoNegro.drawRect(0, 0, this.app.renderer.width, this.app.renderer.height);
    fondoNegro.endFill();
    this.app.stage.addChild(fondoNegro);

    // texto
    const creditos = new PIXI.Text(
      'Desarrollado por Carolina Luján\nProgramación de Videojuegos I\nUniversidad Nacional de Hurlingham\nSegundo cuatrimestre 2025',
      {
        fontFamily: 'Press Start 2P',
        fontSize: 25,
        fill: '#bf36e9ff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }
    );
    creditos.anchor.set(0.5);
    creditos.x = this.app.renderer.width / 2;
    creditos.y = this.app.renderer.height * 0.25;
    this.app.stage.addChild(creditos);

    // boton volver
    const volver = new PIXI.Text('VOLVER', {
      fontFamily: 'Press Start 2P',
      fontSize: 25,
      fill: '#000000ff',
      stroke: '#bf36e9ff',
      strokeThickness: 4
    });
    volver.anchor.set(0.5);
    volver.x = this.app.renderer.width / 2;
    volver.y = this.app.renderer.height * 0.8;
    volver.interactive = true;
    volver.buttonMode = true;
    volver.on('pointerdown', () => {
      PIXI.sound.play('pressButton');
      this.mostrarPantallaInicio()
    });
    this.app.stage.addChild(volver);
  }

  // pantalla de tutorial
  mostrarTutorial() {
    this.app.stage.removeChildren();

    const fondoNegro = new PIXI.Graphics();
    fondoNegro.beginFill(0x0f0f0f);
    fondoNegro.drawRect(0, 0, this.app.renderer.width, this.app.renderer.height);
    fondoNegro.endFill();
    this.app.stage.addChild(fondoNegro);

    // texto
    const creditos = new PIXI.Text(
      'Clic izquierdo -> mover\nClic derecho -> disparar\n"P" -> pausa',
      {
        fontFamily: 'Press Start 2P',
        fontSize: 25,
        fill: '#bf36e9ff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }
    );
    creditos.anchor.set(0.5);
    creditos.x = this.app.renderer.width / 2;
    creditos.y = this.app.renderer.height * 0.25;
    this.app.stage.addChild(creditos);

    // boton volver
    const volver = new PIXI.Text('VOLVER', {
      fontFamily: 'Press Start 2P',
      fontSize: 25,
      fill: '#000000ff',
      stroke: '#bf36e9ff',
      strokeThickness: 4
    });
    volver.anchor.set(0.5);
    volver.x = this.app.renderer.width / 2;
    volver.y = this.app.renderer.height * 0.8;
    volver.interactive = true;
    volver.buttonMode = true;
    volver.on('pointerdown', () => {
      PIXI.sound.play('pressButton');
      this.mostrarPantallaInicio()
    });
    this.app.stage.addChild(volver);
  }

  // mostrar narrativa del juego
  mostrarIntroNarrativa() {
    this.app.stage.removeChildren(); // limpiar pantalla

    const fondoNarrativa = new PIXI.Graphics();
    fondoNarrativa.beginFill(0x0f0f0f);
    fondoNarrativa.drawRect(0, 0, this.app.renderer.width, this.app.renderer.height);
    fondoNarrativa.endFill();
    this.app.stage.addChild(fondoNarrativa);


    const textos = [
      /* '...' */
      'En un bosque encantado,',
      'un mago anciano despierta de su gran letargo.',
      'Criaturas lo acechan...',
      'pero hay esperanza en cada poción recolectada.'
    ];

    let index = 0;
    const textoNarrativo = new PIXI.Text('', {
      fontFamily: 'Press Start 2P',
      fontSize: 35,
      fill: '#000000ff',
      stroke: '#bf36e9ff',
      strokeThickness: 4,
      wordWrap: true,
      wordWrapWidth: this.app.renderer.width - 100
    });
    textoNarrativo.anchor.set(0.5);
    textoNarrativo.x = this.app.renderer.width / 2;
    textoNarrativo.y = this.app.renderer.height / 2;
    this.app.stage.addChild(textoNarrativo);

    const mostrarSiguiente = () => {
      if (index >= textos.length) {
        this.app.stage.removeChildren();

        // reconexión de cámara y fondo
        if (!this.app.stage.children.includes(this.camara)) {
          this.app.stage.addChild(this.camara);
        }

        if (!this.camara.children.includes(this.fondo)) {
          this.camara.addChildAt(this.fondo, 0);
        }

        this.iniciarJuego();
        return;
      }


      textoNarrativo.alpha = 0;
      textoNarrativo.text = textos[index];
      index++;

      // Fade in
      let fadeIn = true;
      let tiempo = 0;
      const ticker = new PIXI.Ticker();
      ticker.add(() => {
        if (fadeIn) {
          textoNarrativo.alpha += 0.05;
          if (textoNarrativo.alpha >= 1) {
            fadeIn = false;
            tiempo = 0;
          }
        } else {
          tiempo++;
          if (tiempo > 180) { // esperar segundos
            textoNarrativo.alpha -= 0.05;
            if (textoNarrativo.alpha <= 0) {
              ticker.stop();
              ticker.destroy();
              mostrarSiguiente(); // mostrar el próximo texto
            }
          }
        }
      });
      ticker.start();
    };

    mostrarSiguiente(); // inicia la secuencia
  }

  // finalizacion del juego
  mostrarGameOver() {
    this.app.ticker.remove(this.update);
    this.app.stage.removeChildren();

    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x0f0f0f, 0.8);
    overlay.drawRect(0, 0, this.app.renderer.width, this.app.renderer.height);
    overlay.endFill();
    this.app.stage.addChild(overlay);

    // game over
    const textoGameOver = new PIXI.Text('GAME OVER', {
      fontFamily: 'Press Start 2P',
      fontSize: 50,
      fill: '#000000ff',
      stroke: '#bf36e9ff',
      strokeThickness: 4
    });
    textoGameOver.anchor.set(0.5);
    textoGameOver.x = this.app.renderer.width / 2;
    textoGameOver.y = this.app.renderer.height * 0.25; // mismo que pantalla de inicio
    this.app.stage.addChild(textoGameOver);

    // bointon reintentar
    const botonReintentar = new PIXI.Text('REINTENTAR', {
      fontFamily: 'Press Start 2P',
      fontSize: 25,
      fill: '#000000ff',
      stroke: '#bf36e9ff',
      strokeThickness: 4
    });
    botonReintentar.anchor.set(0.5);
    botonReintentar.x = this.app.renderer.width / 2;
    botonReintentar.y = this.app.renderer.height * 0.7;
    botonReintentar.interactive = true;
    botonReintentar.buttonMode = true;
    botonReintentar.on('pointerdown', () => {
      PIXI.sound.play('pressButton');
      this.app.stage.removeChildren();
      this.camara.removeChildren();
      this.reiniciarJuego();
    });
    this.app.stage.addChild(botonReintentar);

    // boton de inicio
    const botonInicio = new PIXI.Text('INICIO', {
      fontFamily: 'Press Start 2P',
      fontSize: 25,
      fill: '#000000ff',
      stroke: '#bf36e9ff',
      strokeThickness: 4
    });
    botonInicio.anchor.set(0.5);
    botonInicio.x = this.app.renderer.width / 2;
    botonInicio.y = this.app.renderer.height * 0.8;
    botonInicio.interactive = true;
    botonInicio.buttonMode = true;
    botonInicio.on('pointerdown', () => {
      PIXI.sound.play('pressButton');
      this.app.stage.removeChildren();
      this.camara.removeChildren();
      this.mostrarPantallaInicio();
      PIXI.sound.stop('gameOver')
      PIXI.sound.play('generalGame')
    });
    this.app.stage.addChild(botonInicio);
  }

  // reiniciar juego luego del game over
  reiniciarJuego() {
    // limpiar cámara y hud
    this.app.ticker.remove(this.update);
    this.app.stage.removeChildren();
    PIXI.sound.stop('gameOver')
    PIXI.sound.play('generalGame')


    // resetear 
    this.fantasmas = [];
    this.pociones = [];
    this.proyectiles = [];
    this.heartPickups = [];
    this.pumpkins = [];
    this.pocionActiva = null;
    this.totalFantasmas = 20;
    this.fantasmasVivos = 20;
    this.gameOverMostrado = false;

    // agregar fondo
    if (this.fondo) this.camara.addChildAt(this.fondo, 0);

    // agregar cámara y hud al stage
    if (!this.app.stage.children.includes(this.camara)) {
      this.app.stage.addChild(this.camara);
    }
    if (this.hudContainer && !this.app.stage.children.includes(this.hudContainer)) {
      this.app.stage.addChild(this.hudContainer);
    }

    // asegurar que el mago esté en la cámara
    if (this.wizard) {
      this.camara.addChild(this.wizard);
    }

    this.iniciarJuego(true);
  }

  iniciarTransicionVictoria() {
    PIXI.sound.stop('generalGame')
    PIXI.sound.play('victory')

    // congelar imagen
    const captura = this.app.renderer.extract.canvas(this.app.stage);
    const texturaCongelada = PIXI.Texture.from(captura);
    const spriteCongelado = new PIXI.Sprite(texturaCongelada);
    spriteCongelado.x = 0;
    spriteCongelado.y = 0;
    spriteCongelado.width = this.app.renderer.width;
    spriteCongelado.height = this.app.renderer.height;

    this.app.stage.removeChildren(); // limpiar stage
    this.app.stage.addChild(spriteCongelado); // mostrar imagen congelada

    // color para desvanecer
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x0f0f0f); // 
    overlay.drawRect(0, 0, this.app.renderer.width, this.app.renderer.height);
    overlay.endFill();
    overlay.alpha = 0;
    this.app.stage.addChild(overlay);

    // fade in del overlay
    let alpha = 0;
    const fade = () => {
      alpha += 0.015;
      overlay.alpha = alpha;
      if (alpha >= 1) {
        this.app.ticker.remove(fade);
        this.mostrarPantallaVictoria();
      }

    };

    this.app.ticker.add(fade);
  }

  iniciarTransicionDerrota() {
    PIXI.sound.stop('hurt')
    PIXI.sound.stop('generalGame')
    PIXI.sound.play('gameOver')

    // congelar imagen
    const captura = this.app.renderer.extract.canvas(this.app.stage);
    const texturaCongelada = PIXI.Texture.from(captura);
    const spriteCongelado = new PIXI.Sprite(texturaCongelada);
    spriteCongelado.x = 0;
    spriteCongelado.y = 0;
    spriteCongelado.width = this.app.renderer.width;
    spriteCongelado.height = this.app.renderer.height;

    this.app.stage.removeChildren(); // limpiar stage
    this.app.stage.addChild(spriteCongelado); // mostrar imagen congelada

    // color para desvanecer
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x0f0f0f); // 
    overlay.drawRect(0, 0, this.app.renderer.width, this.app.renderer.height);
    overlay.endFill();
    overlay.alpha = 0;
    this.app.stage.addChild(overlay);

    // fade in del overlay
    let alpha = 0;
    const fade = () => {
      alpha += 0.015;
      overlay.alpha = alpha;
      if (alpha >= 1) {
        this.app.ticker.remove(fade);
        this.mostrarGameOver();
      }
    };

    this.app.ticker.add(fade);
  }

  // mostrar pantalla final del juego al ganar
  mostrarPantallaVictoria() {
    this.app.stage.removeChildren(); // limpiar pantalla
    this.camara.removeChildren();
    this.app.ticker.remove(this.update);

    // resetear 
    this.fantasmas = [];
    this.pociones = [];
    this.proyectiles = [];
    this.heartPickups = [];
    this.pumpkins = [];
    this.pocionActiva = null;
    this.totalFantasmas = 20;
    this.fantasmasVivos = 20;
    this.gameOverMostrado = false;


    const fondoNarrativa = new PIXI.Graphics();
    fondoNarrativa.beginFill(0x0f0f0f);
    fondoNarrativa.drawRect(0, 0, this.app.renderer.width, this.app.renderer.height);
    fondoNarrativa.endFill();
    this.app.stage.addChild(fondoNarrativa);


    const textos = [
      'El último hechizo ha sido lanzado.',
      'El mago, de pie en el bosque, ha vencido.',
      /* 'Las criaturas se disuelven en la niebla.', */
      'El bosque respira... y agradece.'
    ];

    let index = 0;
    const textoNarrativo = new PIXI.Text('', {
      fontFamily: 'Press Start 2P',
      fontSize: 35,
      fill: '#000000ff',
      stroke: '#bf36e9ff',
      strokeThickness: 4,
      wordWrap: true,
      wordWrapWidth: this.app.renderer.width - 100
    });
    textoNarrativo.anchor.set(0.5);
    textoNarrativo.x = this.app.renderer.width / 2;
    textoNarrativo.y = this.app.renderer.height / 2;
    this.app.stage.addChild(textoNarrativo);

    const mostrarSiguiente = () => {
      if (index >= textos.length) {
        this.app.stage.removeChildren();
        this.mostrarPantallaInicio();
        return;
      }

      textoNarrativo.alpha = 0;
      textoNarrativo.text = textos[index];
      index++;

      // Fade in
      let fadeIn = true;
      let tiempo = 0;
      const ticker = new PIXI.Ticker();
      ticker.add(() => {
        if (fadeIn) {
          textoNarrativo.alpha += 0.05;
          if (textoNarrativo.alpha >= 1) {
            fadeIn = false;
            tiempo = 0;
          }
        } else {
          tiempo++;
          if (tiempo > 180) { // esperar segundos
            textoNarrativo.alpha -= 0.05;
            if (textoNarrativo.alpha <= 0) {
              ticker.stop();
              ticker.destroy();
              mostrarSiguiente(); // mostrar el próximo texto
            }
          }
        }
      });
      ticker.start();
    };
    mostrarSiguiente(); // inicia la secuencia
  }

  // sonidos y musica
  cargarSonidos() {
    PIXI.sound.add({
      shoot: 'src/assets/music-sfx/shoot.mp3',
      hurt: 'src/assets/music-sfx/hurt.mp3',
      generalGame: {
        url: 'src/assets/music-sfx/generalGame.mp3',
        options: { loop: true, volume: 0.3 }
      },
      killingGhost: 'src/assets/music-sfx/killingGhost.mp3',
      outOfPotion: 'src/assets/music-sfx/outOfPotion.mp3',
      pause: 'src/assets/music-sfx/pause.mp3',
      pickUpHeart: 'src/assets/music-sfx/pickUpHeart.mp3',
      pickUpPotion: 'src/assets/music-sfx/pickUpPotion.mp3',
      pressButton: 'src/assets/music-sfx/pressButton.mp3',
      victory: 'src/assets/music-sfx/victory.mp3',
      gameOver: 'src/assets/music-sfx/gameOver.mp3'
    });

    PIXI.sound.play('generalGame');
  }
}