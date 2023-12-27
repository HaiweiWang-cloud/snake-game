canvas1.width = 600;
canvas1.height = 300;
const ctx = canvas1.getContext("2d");

ctx.fillStyle = "black";
ctx.font = "52px Impact";
ctx.fillText("Loading . . . ", canvas1.width/2 -100, canvas1.height/2);

window.addEventListener("load", function() {

    class Grid {
        constructor(canvas, Nx, Ny, color) {
            this.Nx = Nx;
            this.Ny = Ny;
            this.backgroundColor = color;

            /* Calculated properties */
            this.squareLength = Math.min(canvas.width/this.Nx, canvas.height/this.Ny);
            this.width = this.squareLength * this.Nx;
            this.height = this.squareLength * this.Ny;

            this.x = 0;
            this.y = 0;

            if (Math.abs(canvas.width - this.width) < 0.01) {
                this.y = (canvas.height - this.height) / 2;
            } else {
                this.x = (canvas.width - this.width) / 2;
            }
        }

        draw(ctx) {
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    class Block {
        constructor(grid, i, j, color) {
            this.grid = grid;
            this.i = i;
            this.j = j;
            this.color = color;
        }

        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.i * this.grid.squareLength + this.grid.x, this.j * this.grid.squareLength + this.grid.y, this.grid.squareLength, this.grid.squareLength);
        }
    }

    class Food extends Block {
        constructor(grid, color) {
            super(grid, 0, 0, color);
            this.grid = grid;
            this.resetPosition();
        }

        resetPosition() {
            this.i = Math.floor(Math.random() * (this.grid.Nx - 1));
            this.j = Math.floor(Math.random() * (this.grid.Ny - 1))
        }
    }

    class Segment extends Block {
        constructor(grid, i, j, color) {
            super(grid, i, j, color);
            this.i = i;
            this.j = j;
            this.setPosition(i, j);
        }

        setPosition(newI, newJ) {
            this.i = newI;
            this.j = newJ;

            if (this.i < 0) {
                this.i = this.grid.Nx - 1;
            }

            if (this.j < 0) {
                this.j = this.grid.Ny - 1;
            }

            if (this.i >= this.grid.Nx) {
                this.i = 0;
            }

            if (this.j >= this.grid.Ny) {
                this.j = 0;
            }
        }
    }

    class Snake {
        constructor(input, grid, initialLength, color, startSegment) {

            this.initialLength = initialLength; // on top of the starting segment
            this.direction = "right"; // 0: up, 1: down, 2: left, 3: rightw
            this.startSegment = startSegment;
            this.segments = [this.startSegment];
            this.color = color;
            this.grid = grid;
            this.input = input;

            for (let i=1; i<this.initialLength + 1; i++) {
                this.segments.push(new Segment(this.grid, this.startSegment.i - i, this.startSegment.j, this.color));
            }

            this.alive = true;

            this.jumpTimer = 0;
        }

        update(food, powerUpSound) {
            
            let newI = this.segments[this.segments.length - 1].i;
            let newJ = this.segments[this.segments.length - 1].j;
                
            

            this.segments.toReversed().forEach((e, index, a) => {
                if (index<this.segments.length-1) {
                    e.setPosition(a[index+1].i, a[index+1].j);
                }
            });

            if (food.i === this.startSegment.i && food.j === this.startSegment.j) {
                this.segments.push(new Segment(this.grid, newI, newJ, this.color));
                food.resetPosition();
                powerUpSound.play();
            }
            

            /* Change direction of the start segment based on keyboard inputs */
            if (this.input.keysPressed.has('w') && this.direction != "down") {
                this.direction = "up";
            } else if (this.input.keysPressed.has('s') && this.direction != "up") {
                this.direction = "down";
            } else if (this.input.keysPressed.has('a') && this.direction != "right") {
                this.direction = "left";
            } else if (this.input.keysPressed.has('d') && this.direction != "left") {
                this.direction = "right";
            }

            switch (this.direction) {
                case "up":
                    this.startSegment.setPosition(this.startSegment.i, this.startSegment.j-1);
                    break;
                case "down":
                    this.startSegment.setPosition(this.startSegment.i, this.startSegment.j+1);
                    break;
                case "left":
                    this.startSegment.setPosition(this.startSegment.i-1, this.startSegment.j);
                    break;
                case "right":
                    this.startSegment.setPosition(this.startSegment.i+1, this.startSegment.j);
                    break;
            }

            this.segments.forEach((e,index) => {
                if (index > 0) {
                    if (this.startSegment.i === e.i && this.startSegment.j === e.j) {
                        this.alive = false;
                    }
                }
            });
        }

        draw(ctx) {
            this.segments.forEach((e) => {
                e.draw(ctx);
            });
        }
    }

    class InputHandler {
        constructor() {
            this.keysPressed = new Set();
            window.addEventListener("keydown", (e) => {
                this.keysPressed.add(e.key);
            });

            window.addEventListener("keyup", (e) => {
                this.keysPressed.delete(e.key);
            });
        }
    }

    class Game {
        constructor(canvas) {
            /* Game parameters */
            this.Nx = 60;
            this.Ny = 30;
            this.startPosition = [Math.floor(this.Nx/2), Math.floor(this.Ny/2)];
            this.bodyColor = "yellow";
            this.headColor = "blue";
            this.foodColor = "pink";
            this.backgroundColor = "black";
            this.initialLength = 10;
            this.speed = 15; // in blocks per second
            this.stepInterval = 1/this.speed * 1000;
            this.powerUpSound = new Audio();
            this.powerUpSound.src = "scored.wav";
            this.gameMusic = gameMusic;
            this.gameMusic.volume = 0.1;
            this.gameMusic.loop = true;
            this.gameMusic.play();

            this.canvas = canvas;
            this.ctx = this.canvas.getContext("2d");
            this.grid = new Grid(this.canvas, this.Nx, this.Ny, this.backgroundColor);
            this.input = new InputHandler();
            this.snake = new Snake(this.input, this.grid, this.initialLength, this.bodyColor, new Segment(this.grid, this.startPosition[0], this.startPosition[1], this.headColor));
            this.food = new Food(this.grid, this.foodColor);
            this.stepTimer = 0;
            this.score = 0;
        }

        update(deltaTime) {
            this.stepTimer += deltaTime;

            if (this.stepTimer > this.stepInterval) {
                this.snake.update(this.food, this.powerUpSound);
                this.stepTimer = 0;
                this.score = this.snake.segments.length - this.initialLength - 1;
            }
        }

        draw(ctx) {
            this.grid.draw(ctx);
            this.snake.draw(ctx);
            this.food.draw(ctx);

            ctx.fillStyle = "white";
            ctx.font = "30px Impact";
            ctx.fillText("Score: " + this.score, 20, 40);
        }
    }

    let game = new Game(canvas1);
    
    let deltaTime = 0;
    let lastTimestamp = 0;
    let gameOverEnded = false;

    function gameLoop(timeStamp) {
        deltaTime = timeStamp - lastTimestamp;
        lastTimestamp = timeStamp;
        if (game.snake.alive) {
            ctx.clearRect(0, 0, canvas1.width, canvas1.height);
            game.update(deltaTime);
            game.draw(ctx);
        } else {
            ctx.fillStyle = "white";
            ctx.font = "32px Impact";
            ctx.fillText("GAME OVER, press ENTER to restart.", canvas1.width/2 -200, canvas1.height/2);
            game.gameMusic.pause();
            if (!gameOverEnded) {
                gameOverMusic.play();
                gameOverEnded = true;
            }

            if (game.input.keysPressed.has("Enter")) {
                game = new Game(canvas1);
                gameOverEnded = false;
                gameMusic.currentTime = 0;
            }
        }
        requestAnimationFrame(gameLoop);
    }

    gameLoop(0);
});