// This game shell was happily copied from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

function AssetManager() {
    this.successCount = 0;
    this.errorCount = 0;
    this.cache = [];
    this.downloadQueue = [];
}

AssetManager.prototype.queueDownload = function (path) {
    console.log(path.toString());
    this.downloadQueue.push(path);
}

AssetManager.prototype.isDone = function () {
    return (this.downloadQueue.length == this.successCount + this.errorCount);
}
AssetManager.prototype.downloadAll = function (callback) {
    if (this.downloadQueue.length === 0) window.setTimeout(callback, 100);
    for (var i = 0; i < this.downloadQueue.length; i++) {
        var path = this.downloadQueue[i];
        var img = new Image();
        var that = this;
        img.addEventListener("load", function () {
            console.log("dun: " + this.src.toString());
            that.successCount += 1;
            if (that.isDone()) { callback(); }
        });
        img.addEventListener("error", function () {
            that.errorCount += 1;
            if (that.isDone()) { callback(); }
        });
        img.src = path;
        this.cache[path] = img;
    }
}

AssetManager.prototype.getAsset = function (path) {
    //console.log(path.toString());
    return this.cache[path];
}

function Animation(spriteSheet, startX, startY, frameWidth, frameHeight, frameDuration, frames, loop, reverse) {
    this.spriteSheet = spriteSheet;
    this.startX = startX;
    this.startY = startY;
    this.frameWidth = frameWidth;
    this.frameDuration = frameDuration;
    this.frameHeight = frameHeight;
    this.frames = frames;
    this.totalTime = frameDuration * frames;
    this.elapsedTime = 0;
    this.loop = loop;
    this.reverse = reverse;
}

Animation.prototype.drawFrame = function (tick, ctx, x, y, scaleBy) {
    var scaleBy = scaleBy || 1;
    this.elapsedTime += tick;
    if (this.loop) {
        if (this.isDone()) {
            this.elapsedTime = 0;
        }
    } else if (this.isDone()) {
        return;
    }
    var index = this.reverse ? this.frames - this.currentFrame() - 1 : this.currentFrame();
    var vindex = 0;
    if ((index + 1) * this.frameWidth + this.startX > this.spriteSheet.width) {
        index -= Math.floor((this.spriteSheet.width - this.startX) / this.frameWidth);
        vindex++;
    }
    while ((index + 1) * this.frameWidth > this.spriteSheet.width) {
        index -= Math.floor(this.spriteSheet.width / this.frameWidth);
        vindex++;
    }

    var locX = x;
    var locY = y;
    var offset = vindex === 0 ? this.startX : 0;
    ctx.drawImage(this.spriteSheet,
                  index * this.frameWidth + offset, vindex * this.frameHeight + this.startY,  // source from sheet
                  this.frameWidth, this.frameHeight,
                  locX, locY,
                  this.frameWidth * scaleBy,
                  this.frameHeight * scaleBy);
}

Animation.prototype.currentFrame = function () {
    return Math.floor(this.elapsedTime / this.frameDuration);
}

Animation.prototype.isDone = function () {
    return (this.elapsedTime >= this.totalTime);
}

function Timer() {
    this.gameTime = 0;
    this.maxStep = 0.05;
    this.wallLastTimestamp = 0;
}

Timer.prototype.tick = function () {
    var wallCurrent = Date.now();
    var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
    this.wallLastTimestamp = wallCurrent;

    var gameDelta = Math.min(wallDelta, this.maxStep);
    this.gameTime += gameDelta;
    return gameDelta;
}

function GameEngine() {
    this.entities = [];
    this.ctx = null;
    this.click = null;
    this.mouse = null;
    this.wheel = null;
    this.w = null;
    this.surfaceWidth = null;
    this.surfaceHeight = null;
}

GameEngine.prototype.init = function (ctx) {
    this.ctx = ctx;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.startInput();
    this.timer = new Timer();
    console.log('game initialized');
}

GameEngine.prototype.start = function () {
    console.log("starting game");
    var that = this;
    (function gameLoop() {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
}

GameEngine.prototype.startInput = function () {
	var map = [];
	
    console.log('Starting input');

    var getXandY = function (e) {
        var x = e.clientX - that.ctx.canvas.getBoundingClientRect().left;
        var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top;

        if (x < 1024) {
            x = Math.floor(x / 32);
            y = Math.floor(y / 32);
        }

        return { x: x, y: y };
    }

    var that = this;

    this.ctx.canvas.addEventListener("click", function (e) {
    	that.click = true;
    }, false);

    this.ctx.canvas.addEventListener("mousemove", function (e) {
        that.mouse = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("mousewheel", function (e) {
        that.wheel = e;
        e.preventDefault();
    }, false);
    
    
    this.ctx.canvas.addEventListener("keydown", function (e) {
    	
    	map[e.keyCode] = true;
        
        for (var i = 0; i < 128; i++) {
        	if (map[87]) {
        		that.w = true;
        	}
        	if (map[65]) {
        		that.a = true;
        	}
        	if (map[83]) {
        		that.s = true;
        	}
        	if (map[68]) {
        		that.d = true;
        	}
        }
        
        e.preventDefault();
    }, false);
    
    this.ctx.canvas.addEventListener("keyup", function (e) {

    	map[e.keyCode] = false;

        for (var i = 0; i < 128; i++) {
        	if (e.keyCode === 87) {
        		that.w = false;
        	}
        	if (e.keyCode === 65) {
        		that.a = false;
        	}
        	if (e.keyCode === 83) {
        		that.s = false;
        	}
        	if (e.keyCode === 68) {
        		that.d = false;
        	}
        }
        e.preventDefault();
    }, false);
    
    

    console.log('Input started');
}

GameEngine.prototype.addEntity = function (entity) {
    console.log('added entity');
    this.entities.push(entity);
}

GameEngine.prototype.draw = function (drawCallback) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(this.ctx);
    }
    if (drawCallback) {
        drawCallback(this);
    }
    this.ctx.restore();
}

GameEngine.prototype.update = function () {
    var entitiesCount = this.entities.length;

    for (var i = 0; i < entitiesCount; i++) {
        var entity = this.entities[i];

        if (!entity.removeFromWorld) {
            entity.update();
        }
    }

    for (var i = this.entities.length - 1; i >= 0; --i) {
        if (this.entities[i].removeFromWorld) {
            this.entities.splice(i, 1);
        }
    }
}

GameEngine.prototype.loop = function () {
    this.clockTick = this.timer.tick();
    this.update();
    this.draw();
    //this.w = null;
    //this.a = null;
    //this.s = null;
    //this.d = null;
    //this.click = null;
    this.wheel = null;
}

function Entity(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.removeFromWorld = false;
}

Entity.prototype.update = function () {
}

Entity.prototype.draw = function (ctx) {
    if (this.game.showOutlines && this.radius) {
        ctx.beginPath();
        ctx.strokeStyle = "green";
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.stroke();
        ctx.closePath();
    }
}

Entity.prototype.rotateAndCache = function (image, angle) {
    var offscreenCanvas = document.createElement('canvas');
    var size = Math.max(image.width, image.height);
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    var offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.save();
    offscreenCtx.translate(size / 2, size / 2);
    offscreenCtx.rotate(angle);
    offscreenCtx.translate(0, 0);
    offscreenCtx.drawImage(image, -(image.width / 2), -(image.height / 2));
    offscreenCtx.restore();
    //offscreenCtx.strokeStyle = "red";
    //offscreenCtx.strokeRect(0,0,size,size);
    return offscreenCanvas;
}

// GameBoard code below

function Background(game) {
    Entity.call(this, game, 0, 400);
}

Background.prototype = new Entity();
Background.prototype.constructor = Background;

Background.prototype.update = function () {
    Entity.prototype.update.call(this);
}

Background.prototype.draw = function (ctx) {
	ctx.drawImage(ASSET_MANAGER.getAsset("./img/stats.png"), 700, 0, 200, 700);
	ctx.drawImage(ASSET_MANAGER.getAsset("./img/castle.png"), 300, 300, 100, 100);
	
    //ctx.fillStyle = "Black";
    //ctx.fillRect(700, 0, 200, 700);

}

function Bastardman(game) {
	this.animation = new Animation(ASSET_MANAGER.getAsset("./img/goomba.png"), 0, 0, 256, 256, 1, 1, true, false);
	
	var spawnWhere = Math.floor(Math.random() * 3);
	var randX;
	var randY;
	
	if (spawnWhere === 0) { //spawn on the top
		randY = -256;
		randX = Math.floor(Math.random() * 700);
	} else if (spawnWhere === 1) { //spawn on the left
		randX = -256;
		randY = Math.floor(Math.random() * 700);
	} else if (spawnWhere === 2) { //spawn on the bottom
		randY = 700;
		randX = Math.floor(Math.random() * 700);
	}
	
	Entity.call(this, game, randX, randY);
}

Bastardman.prototype = new Entity();
Bastardman.prototype.constructor = Bastardman;

Bastardman.prototype.update = function () {	
    Entity.prototype.update.call(this);
}

Bastardman.prototype.draw = function (ctx) {
	if (this.x > 225) {
		this.x--;
	} else if (this.x < 225) {
		this.x++;
	}
	
	if (this.y > 225) {
		this.y--;
	} else if (this.y < 225) {
		this.y++;
	}
	
	this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y);
}

function Hero(game) {
    this.animation = new Animation(ASSET_MANAGER.getAsset("./img/test_hero.png"), 0, 0, 32, 32, 0.1, 6, true, false);
    this.movingUP = false;
    this.movingLEFT = false;
    this.movingDOWN = false;
    this.movingRIGHT = false;

    Entity.call(this, game, 0, 400);
}

Hero.prototype = new Entity();
Hero.prototype.constructor = Hero;

Hero.prototype.update = function () {	
	this.movingUP = this.game.w;
	this.movingLEFT = this.game.a;
	this.movingDOWN = this.game.s;
	this.movingRIGHT = this.game.d;

    Entity.prototype.update.call(this);
}

Hero.prototype.draw = function (ctx) {
    this.movingSpeed = 5;
    if (this.movingUP) 
        this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y -= this.movingSpeed);
    if (this.movingLEFT) 
    	this.animation.drawFrame(this.game.clockTick, ctx, this.x -= this.movingSpeed, this.y);
    if (this.movingDOWN) 
    	this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y += this.movingSpeed);
    if (this.movingRIGHT) 
    	this.animation.drawFrame(this.game.clockTick, ctx, this.x += this.movingSpeed, this.y);

    this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y);
    
    if (this.x > 668) { //hardcoded values bad. change later!
    	this.x = -20;
    } 
    if (this.x < -20) {
    	this.x = 668;
    }
    if (this.y > 700) {
    	this.y = -20;
    }
    if (this.y < -20) {
    	this.y = 700;
    }
}

// the "main" code begins here

var ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload("./img/test_hero.png");
ASSET_MANAGER.queueDownload("./img/stats.png");
ASSET_MANAGER.queueDownload("./img/castle.png");
ASSET_MANAGER.queueDownload("./img/goomba.png");

ASSET_MANAGER.downloadAll(function () {
    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    var gameEngine = new GameEngine();
    var bg = new Background(gameEngine);
    var hero = new Hero(gameEngine);
    var bastardman = new Bastardman(gameEngine);

    gameEngine.addEntity(bg);
    gameEngine.addEntity(hero);
    gameEngine.addEntity(bastardman);

    gameEngine.init(ctx);
    gameEngine.start();
});
