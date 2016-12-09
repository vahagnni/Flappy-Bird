var game = new Phaser.Game(400, 590, Phaser.AUTO, 'game_div');

var main_state = {
    preload: function () {
        this.game.stage.backgroundColor = '#CCCC76';
        this.game.load.image('background', 'assets/background.png');
        this.game.load.image('ground', 'assets/ground.png');
        this.game.load.image('bird', 'assets/bird.png');
        this.game.load.image('pipe', 'assets/pipe.png');
        this.game.load.image('demo', 'assets/demo.jpeg');
        this.game.load.image('play', 'assets/play.png');

        // Load jump sound
        this.game.load.audio('jump', 'assets/wing.wav');
        this.game.load.audio('die', 'assets/hit.wav');
        this.game.load.audio('score', 'assets/point.wav');
    },

    create: function () {
        this.demo = this.game.add.sprite(0, 0, 'demo');
        this.demo.width = this.game.world.width;
        this.demo.height = this.game.world.height;
        this.demo.inDemo = true;
        game.input.onDown.add(this.start_game, this);
    },
    start_game: function () {
        this.demo.inDemo = false;
        this.demo.destroy();
        this.main_loop();
    },
    update: function () {
        if (!this.demo.inDemo) {
            if (this.bird.inWorld == false) {

                // this.bird.alive = false;

                // Prevent new pipes from apearing
                this.game.time.events.remove(this.timer);

                // Go trough all the pipes, and stop their movement
                this.pipes.forEachAlive(function (p) {
                    p.body.velocity.x = 0;
                }, this);
                if (this.bird.alive) {
                    this.die_sound.play();
                    this.bird.alive = false;
                }
            }

            // Make the bird slowly rotate downward
            if (this.bird.angle < 20)
                this.bird.angle += 1;

            this.game.physics.overlap(this.bird, this.pipes, this.hit_pipe, null, this);
            this.game.physics.overlap(this.bird, this.ground, this.hit_ground, null, this);
        }
    },
    main_loop: function () {
        var space_key = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        space_key.onDown.add(this.jump, this);
        this.game.input.onDown.add(this.jump, this);
        this.game.input.onTap.add(this.jump, this);
        this.bg = this.game.add.sprite(0, 0, 'background');
        this.bg.width = this.game.world.width * 2;

        this.ground = this.game.add.sprite(0, this.game.world.height - 100, 'ground');
        this.ground.scale.y = 0.5;
        this.pipes = game.add.group();
        this.pipes.createMultiple(20, 'pipe');
        this.timer = this.game.time.events.loop(1500, this.add_row_of_pipes, this);

        this.bird = this.game.add.sprite(100, 245, 'bird');
        this.bird.body.gravity.y = 1000;
        // Change the anchor point of the bird
        this.bird.anchor.setTo(-0.2, 0.5);

        this.score = 0;
        var style = { font: "30px Arial", fill: "#ffffff" };
        this.label_score = this.game.add.text(20, 20, "0", style);

        // Add sounds to the game
        this.jump_sound = this.game.add.audio('jump');
        this.die_sound = this.game.add.audio('die');
        this.score_sound = this.game.add.audio('score');
    },
    jump: function () {
        // if the bird hit a pipe, no jump
        if (this.bird.alive == false)
            return;

        this.bird.body.velocity.y = -350;

        // Animation to rotate the bird
        this.game.add.tween(this.bird).to({angle: -20}, 100).start();

        // Play a jump sound
        this.jump_sound.play();
    },

    // Dead animation when the bird hit a pipe
    hit_pipe: function () {
        // If the bird has already hit a pipe, we have nothing to do
        if (this.bird.alive == false)
            return;

        // Set the alive flag to false
        this.bird.alive = false;

        // Prevent new pipes from apearing
        this.game.time.events.remove(this.timer);

        // Go trough all the pipes, and stop their movement
        this.pipes.forEachAlive(function (p) {
            p.body.velocity.x = 0;
        }, this);
        this.die_sound.play();
    },
    hit_ground: function () {
        // if (this.bird.alive == false)
        ///     return;

        // Set the alive flag to false
        this.bird.alive = false;

        // Prevent new pipes from apearing
        this.game.time.events.remove(this.timer);
        this.bird.position.y = this.game.world.height - 100 - this.bird.height;
        this.bird.body.velocity.y = 0;
        this.bird.body.velocity.x = 0;
        this.bird.body.gravity.y = 0;
        this.bird.body.rotation = 0;
        this.bird.preUpdate();
        this.pipes.forEachAlive(function (p) {
            p.body.velocity.x = 0;
        }, this);

        this.die_sound.play();
        var t = this;
        var x = setInterval(function () {
            t.game.paused = false;
            clearInterval(x);
            t.die();
            //t.restart_game();
        }, 200);
        this.game.paused = true;
    },
    die: function () {
        this.game_over = this.game.add.text(100, 100, "Game Over", { font: "30px Arial", fill: "#ffffff" });
        this.last_score = this.game.add.text(100, 200, "Score " + this.score, { font: "30px Arial", fill: "#ffffff" });
        this.play = this.game.add.sprite(100, 300, 'play');
        this.play.width=200;
        this.play.height=90;
        var t = this;
        var handler = function () {
            t.restart_game();
        };

        this.game.input.onDown.add(handler, this);
        this.game.input.onTap.add(handler, this);
    },
    restart_game: function () {
        this.game.paused = false;
        this.game.time.events.remove(this.timer);
        this.game.state.start('main');
    },

    add_one_pipe: function (x, y) {
        var pipe = this.pipes.getFirstDead();
        pipe.reset(x, y);
        pipe.body.velocity.x = -200;
        pipe.outOfBoundsKill = true;
    },

    add_row_of_pipes: function () {
        var hole = Math.floor(Math.random() * 5) + 1;
        for (var i = 0; i < 8; i++)
            if (i != hole && i != hole + 1)
                this.add_one_pipe(400, i * 60 + 10);

        this.score += 1;
        this.label_score.content = this.score;
        this.score_sound.play();
    }
};

game.state.add('main', main_state);
game.state.start('main'); 