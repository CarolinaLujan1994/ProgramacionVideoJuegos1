import { Mago } from './wizard.js';
import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@7.x/dist/pixi.min.mjs';


class App {
    constructor() {
        this.width = 1280;
        this.height = 720;
        this.pixiApp = null;
        this.bullets = [];
    }


    async initPIXI() {
        this.pixiApp = new PIXI.Application({
            width: this.width,
            height: this.height,
            backgroundColor: 0x000000
        });

        document.body.appendChild(this.pixiApp.view);

        // Registrar rutas
        PIXI.Assets.add('background', 'assets/background/background_2.png');
        PIXI.Assets.add('wizard', 'assets/wizard/mago_frente.png');
        //PIXI.Assets.add('bullet', 'assets/bullet.png');

        // Cargar assets
        await PIXI.Assets.load(['background', 'wizard'/* , 'bullet' */]);

        const backgroundTexture = await PIXI.Assets.get('background');
        const wizardTexture = await PIXI.Assets.get('wizard');
        //const bulletTexture = await PIXI.Assets.get('bullet');

        this.setup(backgroundTexture, wizardTexture/* , bulletTexture */);
    }


    /*         const loader = new PIXI.Loader();
            loader
                .add('background', 'assets/background/background_2.png')
                .add('wizard', 'assets/wizard/mago_frente.png')
                .add('bullet', 'assets/bullet.png')
                .load(() => this.setup(loader)); // */



    setup(backgroundTexture, wizardTexture/* , bulletTexture */) {
        const fondo = new PIXI.Sprite(backgroundTexture);
        fondo.width = this.pixiApp.screen.width;
        fondo.height = this.pixiApp.screen.height;
        this.pixiApp.stage.addChild(fondo);

        const mago = new Mago(wizardTexture, this.pixiApp.screen.width / 2, this.pixiApp.screen.height - 100);
        mago.agregarAlEscenario(this.pixiApp.stage);

        window.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowUp') mago.mover(0, -1);
            if (e.code === 'ArrowDown') mago.mover(0, 1);
            if (e.code === 'ArrowLeft') mago.mover(-1, 0);
            if (e.code === 'ArrowRight') mago.mover(1, 0);
            /* if (e.code === 'Space') {
                const bullet = mago.disparar(bulletTexture);
                if (bullet) {
                    this.pixiApp.stage.addChild(bullet);
                    this.bullets.push(bullet);
                }
            } */
        });

        this.pixiApp.ticker.add(() => {
            this.bullets.forEach((b, i) => {
                b.y += b.vy;
                if (b.y < 0) {
                    this.pixiApp.stage.removeChild(b);
                    this.bullets.splice(i, 1);
                }
            });
        });
    }
}

const juego = new App();
juego.initPIXI();
