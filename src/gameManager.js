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
      width: 1000,
      height: 800,
      backgroundColor: 0x000000
    });
    document.body.appendChild(this.app.view);

    this.colores = ['red', 'blue', 'green', 'yellow', 'purple'];
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
      this.fantasmas.push(new Ghost(this.app, color));
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
  }

  start() {
    this.app.ticker.add(() => {
      this.wizard.update();

      this.fantasmas.forEach(f => {
        f.update();
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
      });

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