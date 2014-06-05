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

function MusicManager() {
    this.successCount = 0;
    this.errorCount = 0;
    this.cache = [];
    this.downloadQueue = [];
}

MusicManager.prototype.queueDownload = function (path) {
    console.log(path.toString());
    this.downloadQueue.push(path);
}

MusicManager.prototype.isDone = function () {
    return (this.downloadQueue.length == this.successCount + this.errorCount);
}
MusicManager.prototype.downloadAll = function () {
    if (this.downloadQueue.length === 0) window.setTimeout(callback, 100);
    for (var i = 0; i < this.downloadQueue.length; i++) {
        var path = this.downloadQueue[i];
        var sound = new Audio();
        var that = this;
        sound.addEventListener("load", function () {
            console.log("dun: " + this.src.toString());
            that.successCount += 1;
            if (that.isDone()) { return }
        });
        sound.addEventListener("error", function () {
            that.errorCount += 1;
            if (that.isDone()) { return }
        });
        sound.src = path;
        this.cache[path] = sound;
    }
}

MusicManager.prototype.getAsset = function (path) {
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
    
    return this.maxStep;
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
    this.map = [];
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
    
    //spawn one enemy, useful for debugging if you drop the spawn rate
	var temp = new Monster(this, "./img/monster_sprite.png", 104.4, 0, 52.2, 50, .5, 2)
    this.addEntity(temp);
    this.enemies.push(temp);
    this.spawnCounter = 0;
    this.numEnemiesSpawned = 0;
    (function gameLoop() {
        that.loop();
        that.spawnEnemy();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
}

GameEngine.prototype.spawnEnemy = function () {
	
    this.spawnCounter += this.timer.tick() * this.spawnRate;	
    this.random_monster_type = Math.floor(Math.random() * 5);


    if (Math.floor(this.spawnCounter) >= .5) {
		this.numEnemiesSpawned += 1;
		if (this.numEnemiesSpawned >= 25) {
			this.numEnemiesSpawned = 0;
			this.spawnRate += .1;
		}
        this.random_number = Math.floor(Math.random() * 50);
        //console.log(this.random_number);
        //Original Monster
        if (Math.floor(this.spawnCounter) >= .5) {
            this.random_number = Math.floor(Math.random() * 50);
            //console.log(this.random_number);

            if (this.random_monster_type == 0) {
                if (this.random_number <= 12) { // Top
                    var temp = new Monster(this, "./img/monster_sprite.png", 104.4, 0, 52.2, 50, .5, 2, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                } else if (this.random_number > 12 && this.random_number <= 25) { // right
                    var temp = new Monster(this, "./img/monster_sprite.png", 208.8, 0, 52.2, 50, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                } else if (this.random_number > 25 && this.random_number <= 38) { // Bottom
                    var temp = new Monster(this, "./img/monster_sprite.png", 0, 0, 52.2, 50, .5, 2, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                } else {    // Right
                    var temp = new Monster(this, "./img/monster_sprite.png", 365.4, 0, 52.2, 50, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                }
            } else if (this.random_monster_type === 1) {
                if (this.random_number <= 12) { // Top
                    var temp = new Monster(this, "./img/monsters_sprites.png", 0, 0, 32, 32, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                } else if (this.random_number > 12 && this.random_number <= 25) { // right
                    var temp = new Monster(this, "./img/monsters_sprites.png", 0, 32, 32, 32, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                } else if (this.random_number > 25 && this.random_number <= 38) { // Bottom
                    var temp = new Monster(this, "./img/monsters_sprites.png", 0, 96, 32, 32, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                } else {    // Left
                    var temp = new Monster(this, "./img/monsters_sprites.png", 0, 64, 32, 32, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                }

            } else if (this.random_monster_type === 2) {
                if (this.random_number <= 12) { // Top
                    var temp = new Monster(this, "./img/monsters_sprites.png", 0, 128, 32, 32, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                } else if (this.random_number > 12 && this.random_number <= 25) { // right
                    var temp = new Monster(this, "./img/monsters_sprites.png", 0, 160, 32, 32, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                } else if (this.random_number > 25 && this.random_number <= 38) { // Bottom
                    var temp = new Monster(this, "./img/monsters_sprites.png", 0, 224, 32, 32, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                } else {    // Left
                    var temp = new Monster(this, "./img/monsters_sprites.png", 0, 192, 32, 32, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                }

            } else if (this.random_monster_type === 3) {
                if (this.random_number <= 12) { // Top
                    var temp = new Monster(this, "./img/monsters_sprites.png", 96, 128, 32, 32, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                } else if (this.random_number > 12 && this.random_number <= 25) { // right
                    var temp = new Monster(this, "./img/monsters_sprites.png", 96, 160, 32, 32, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                } else if (this.random_number > 25 && this.random_number <= 38) { // Bottom
                    var temp = new Monster(this, "./img/monsters_sprites.png", 96, 224, 32, 32, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                } else {    // Left
                    var temp = new Monster(this, "./img/monsters_sprites.png", 96, 192, 32, 32, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                }

            } else {
                if (this.random_number <= 12) { // Top
                    var temp = new Monster(this, "./img/monsters_sprites.png", 96, 0, 32, 32, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                } else if (this.random_number > 12 && this.random_number <= 25) { // right
                    var temp = new Monster(this, "./img/monsters_sprites.png", 96, 32, 32, 32, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                } else if (this.random_number > 25 && this.random_number <= 38) { // Bottom
                    var temp = new Monster(this, "./img/monsters_sprites.png", 96, 96, 32, 32, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                } else {    // Left
                    var temp = new Monster(this, "./img/monsters_sprites.png", 96, 64, 32, 32, .5, 3, this.random_number)
                    this.addEntity(temp);
                    this.enemies.push(temp);
                    this.spawnCounter = 0;
                }
            }

        }
	}
}

GameEngine.prototype.startInput = function () {

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
    	if (!that.running) {
    		that.start();
    		that.running = true;
    	}
        that.introText.innerHTML = "";
    	if (that.MusicPlayer.BgAudio.paused) {
    		that.MusicPlayer.BgAudio.play();
    	}
    }, false);

    this.ctx.canvas.addEventListener("mousemove", function (e) {
        that.mouse = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("mousewheel", function (e) {
        that.wheel = e;
        e.preventDefault();
    }, false);


    this.ctx.canvas.addEventListener("keydown", function (e) {
    	//console.log(e.keyCode);
    	if (e.keyCode == 77) {
    		if (that.MusicPlayer.BgAudio.paused) {
    			that.MusicPlayer.BgAudio.play();
    		} else {
    			that.MusicPlayer.BgAudio.pause();
    		}
    	} else if (e.keyCode == 81 && that.gold >= 200) { //upgrade tower range if user hits q (and has 200 gold)
			that.gold -= 200;
			that.tower.towerRange += that.tower.towerRangeUpgrade;
			if(that.tower.towerRangeUpgrade >= 5) {
				that.tower.towerRangeUpgrade -= 3;
			}
            that.scoreDisplay.innerHTML = "Gold: " + that.gold;
            MUSIC_MANAGER.getAsset("./music/rangeup.mp3").play();
		} else if (e.keyCode == 69 && that.gold >= 300) { //upgrade tower attack speed if user hits e (and has 300 gold)
			that.gold -= 300;
			that.tower.chargingRate += that.tower.chargingRateUpgrade;
			if(that.tower.chargingRateUpgrade >= .25) {		//initially upgrades charging rate by .5, .45, .4, .35, .3, .25, .25, .25 ........
				that.tower.chargingRateUpgrade -= .05;
			}
            that.scoreDisplay.innerHTML = "Gold: " + that.gold;
            MUSIC_MANAGER.getAsset("./music/chargeup.mp3").play();
		} else if (e.keyCode == 82 && that.gold >= 250) { //restore 5 tower health if user hits r (and has 250 gold)
			that.gold -= 250;
			that.towerHp += 12;
            that.towerHpDisplay.innerHTML = "Tower Health: " + that.towerHp;
            that.scoreDisplay.innerHTML = "Gold: " + that.gold;
			MUSIC_MANAGER.getAsset("./music/healthup.mp3").play();
		} else if (e.keyCode == 70 && that.kp >= 100000) { //restore hero movement speed if user hits f (and has 100,000 kill points)
			that.kp -= 100000;
			that.kpDisplay.innerHTML = "Kill Points: " + that.kp;
			that.hero.movingSpeed += that.hero.moveSpdUpgd;
			that.hero2.movingSpeed += that.hero2.moveSpdUpgd;
			if(that.hero.moveSpdUpgd >= .25) {				//initially upgrades movement speed by .5, then by .45, .4, .35, .3, .25, .25, .25 and so on...
				that.hero.moveSpdUpgd -= .05;
			}
			if(that.hero2.moveSpdUpgd >= .25) {
				that.hero2.moveSpdUpgd -= .05;
			}
			MUSIC_MANAGER.getAsset("./music/speedup.mp3").play();
		}
        that.map[e.keyCode] = true;

    }, false);

    this.ctx.canvas.addEventListener("keyup", function (e) {
        that.map[e.keyCode] = false;
    }, false);

    console.log('Input started');
}

GameEngine.prototype.addEntity = function (entity) {
    //console.log('added entity');
    this.entities.push(entity);
}

GameEngine.prototype.draw = function (drawCallback) {
	if (!this.running) return;
	
    this.ctx.clearRect(-this.ctx.canvas.width / 2, -this.ctx.canvas.height / 2,
    		this.ctx.canvas.width, this.ctx.canvas.height);
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
	if (!this.running) {
		if (!this.MusicPlayer.BgAudio.paused) {
			this.MusicPlayer.BgAudio.pause();
		}
		return;
	}
	
	if (this.dead) {
		this.gameOver();
	}
	
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

GameEngine.prototype.gameOver = function () {
	this.towerHpDisplay.innerHTML = "You have failed. You lasted " + Math.floor(this.timer.gameTime) + " seconds against the onslaught.";
	this.entities = {};
	this.enemies = {};
	this.MusicPlayer.BgAudio.pause();
	this.MusicPlayer.BgAudio = this.MusicPlayer.BgAudio = MUSIC_MANAGER.getAsset("./music/sad time uh oh.mp3");
	this.MusicPlayer.BgAudio.loop = false;
	this.MusicPlayer.BgAudio.volume = .25;
	this.MusicPlayer.BgAudio.play();
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

function BoundingBox(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
}

BoundingBox.prototype.collide = function (oth) {
    if (Math.sqrt((this.x - oth.x) * (this.x - oth.x) + (this.y - oth.y) * (this.y - oth.y)) < this.radius + oth.radius) {
        return true;
    } else {
        return false;
    }
}

function Background(game) {
    Entity.call(this, game, 0, 400);
}

Background.prototype = new Entity();
Background.prototype.constructor = Background;

Background.prototype.update = function () {
    Entity.prototype.update.call(this);
}

Background.prototype.draw = function (ctx) {

}

function Tower(game) {
	this.towerRange = 100;
	this.towerRangeUpgrade = 20;
    this.towerImg = ASSET_MANAGER.getAsset("./img/castle.png");
    this.boundingBox = new BoundingBox(0, 0, this.towerImg.width / 3);
    this.rangeBox = new BoundingBox(0, 0, this.towerRange);
    this.chargingPower = 0;
    this.lazerShotX;
    this.lazerShotY;
    this.lazerActive = false;
    this.lazerOpacity = 0;
    this.chargingRate = 1;
	this.chargingRateUpgrade = .5;
	
    Entity.call(this, game, 0, 0);
}

Tower.prototype = new Entity();
Tower.prototype.constructor = Tower;

Tower.prototype.update = function () {
    if (this.chargingPower <= 100) {
    	this.chargingPower += this.chargingRate;	//change this to change the rate at which the tower attacks.
    }
    
    this.rangeBox.radius = this.towerRange;
    
    if (this.chargingPower >= 100) {
		this.chargingPower = 100;
	    for (var i = 0; i < this.game.enemies.length; i++) {
	        if (!this.game.enemies[i].dead && this.rangeBox.collide(this.game.enemies[i].boundingBox)) {
	            this.game.enemies[i].dead = true;
	            this.lazerShotX = this.game.enemies[i].boundingBox.x;
	            this.lazerShotY = this.game.enemies[i].boundingBox.y;
	            this.lazerActive = true;
	            this.lazerOpacity = 1;
	            this.test = this.game.enemies[i];
	            this.game.gold += this.game.enemies[i].pointValue;
	            this.game.scoreDisplay.innerHTML = "Gold: " + this.game.gold;
				this.game.kp += this.game.enemies[i].pointValue * 100 / 5;
				this.game.kpDisplay.innerHTML = "Kill Points: " + this.game.kp;
	            this.chargingPower = 0;
	            break;
	        }
	    }
    }


    for (var i = 0; i < this.game.enemies.length; i++) {
        if (!this.game.enemies[i].dead && this.boundingBox.collide(this.game.enemies[i].boundingBox)) {
            this.game.enemies[i].dead = true;
            this.game.enemies[i].boundingBox = null;
            this.game.towerHp -= 10;
            this.game.towerHpDisplay.innerHTML = "Tower Health: " + this.game.towerHp;
        }
    }
    
    if (this.game.towerHp <= 0) {
    	this.game.dead = true;
    }

    
	
    Entity.prototype.update.call(this);
}

Tower.prototype.draw = function (ctx) {
	
	if (this.game.dead) return;
	
    ctx.beginPath();
    ctx.fillStyle = "gray";
    ctx.arc(0, 0, this.towerImg.width / 3, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.closePath();
	
    ctx.drawImage(this.towerImg, 0 - this.towerImg.width / 2, 0 - this.towerImg.height / 2,
		    		this.towerImg.width, this.towerImg.height);
    
    ctx.lineWidth = 1;
    
    
    ctx.beginPath();
    ctx.strokeStyle = "blue";
    ctx.rect(-53, 75, 103, 5);
    ctx.stroke();
    ctx.closePath();
    
    ctx.beginPath();
    ctx.fillStyle = "#FFFFFF"
    ctx.rect(-52, 75 + 1, this.chargingPower, 5 - 2);
    ctx.fill();
    ctx.closePath();
    
    if (this.lazerActive) {
        this.drawLazer(ctx);
    }

    if (this.game.showOutlines) {
        ctx.beginPath();
        ctx.strokeStyle = "green";
        ctx.arc(0, 0, this.towerImg.width / 3, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.closePath();
    }
    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.arc(0, 0, this.towerRange, 0, Math.PI * 2, true);
    ctx.stroke();
    ctx.closePath();
}

Tower.prototype.drawLazer = function (ctx) {
	ctx.beginPath();
	ctx.lineWidth = 5;
	ctx.strokeStyle = "rgba(255, 0, 0, " + this.lazerOpacity + ")";
	ctx.moveTo(0, 0);
	ctx.lineTo(this.lazerShotX, this.lazerShotY);
	ctx.stroke();
	ctx.lineWidth = 1;
	ctx.closePath();
	this.lazerOpacity -= 0.05;
	if (this.lazerOpacity <= 0) {
		MUSIC_MANAGER.getAsset("./music/laser.mp3").volume = .25;
	    MUSIC_MANAGER.getAsset("./music/laser.mp3").play();

		this.lazerActive = false;
		this.lazerOpacity = 0;
	}

	
}


function Monster(game, image, xOrigin, yOrigin, imgWidth, imgHeight, interval, frames, spawn_position) {
    this.monsterImg = ASSET_MANAGER.getAsset(image);
    this.animation = new Animation(this.monsterImg, xOrigin, yOrigin, imgWidth,
    		imgHeight, interval, frames, true, false);

    this.monsterImgWidth = imgWidth;
    this.monsterImgHeight = imgHeight;
    this.dead = false;
    this.pointValue = 10;

    var spawnWhere = spawn_position;
    var randX;
    var randY;
	
	if (spawnWhere === 0) { //spawn from the top
		randX = -500;
		randY = -400;
	} else if (spawnWhere === 1) {
		randX = -427;
		randY = -400;
	} else if (spawnWhere === 2) {
		randX = -354;
		randY = -400;
	} else if (spawnWhere === 3) {
		randX = -281;
		randY = -400;
	} else if (spawnWhere === 4) {
		randX = -208;
		randY = -400;
	} else if (spawnWhere === 5) {
		randX = -135;
		randY = -400;
	} else if (spawnWhere === 6) {
		randX = -62;
		randY = -400;
	} else if (spawnWhere === 7) {
		randX = 11;
		randY = -400;
	} else if (spawnWhere === 8) {
		randX = 84;
		randY = -400;
	} else if (spawnWhere === 9) {
		randX = 157;
		randY = -400;
	} else if (spawnWhere === 10) {
		randX = 230;
		randY = -400;
	} else if (spawnWhere === 11) {
		randX = 303;
		randY = -400;
	} else if (spawnWhere === 12) {
		randX = 376;
		randY = -400;
	} else if (spawnWhere === 13) { //spawn from the right
		randX = 450;
		randY = -335;
	} else if (spawnWhere === 14) {
		randX = 450;
		randY = -271;
	} else if (spawnWhere === 15) {
		randX = 450;
		randY = -206;
	} else if (spawnWhere === 16) {
		randX = 450;
		randY = -142;
	} else if (spawnWhere === 17) {
		randX = 450;
		randY = -77;
	} else if (spawnWhere === 18) {
		randX = 450;
		randY = -13;
	} else if (spawnWhere === 19) {
		randX = 450;
		randY = 51;
	} else if (spawnWhere === 20) {
		randX = 450;
		randY = 116;
	} else if (spawnWhere === 21) {
		randX = 450;
		randY = 180;
	} else if (spawnWhere === 22) {
		randX = 450;
		randY = 245;
	} else if (spawnWhere === 23) {
		randX = 450;
		randY = 309;
	} else if (spawnWhere === 24) {
		randX = 450;
		randY = 373;
	} else if (spawnWhere === 25) {
		randX = 450;
		randY = 400;
	} else if (spawnWhere === 26) { //spawn from the bottom
		randX = 377;
		randY = 400;
	} else if (spawnWhere === 27) {
		randX = 304;
		randY = 400;
	} else if (spawnWhere === 28) {
		randX = 231;
		randY = 400;
	} else if (spawnWhere === 29) {
		randX = 158;
		randY = 400;
	} else if (spawnWhere === 30) {
		randX = 85;
		randY = 400;
	} else if (spawnWhere === 31) {
		randX = 12;
		randY = 400;
	} else if (spawnWhere === 32) {
		randX = -61;
		randY = 400;
	} else if (spawnWhere === 33) {
		randX = -134;
		randY = 400;
	} else if (spawnWhere === 34) {
		randX = -207;
		randY = 400;
	} else if (spawnWhere === 35) {
		randX = -280;
		randY = 400;
	} else if (spawnWhere === 36) {
		randX = -353;
		randY = 400;
	} else if (spawnWhere === 37) {
		randX = -426;
		randY = 400;
	} else if (spawnWhere === 38) {
		randX = -500;
		randY = 400;
	} else if (spawnWhere === 39) { // spawn from left
		randX = -500;
		randY = 327;
	} else if (spawnWhere === 40) {
		randX = -500;
		randY = 254;
	} else if (spawnWhere === 41) {
		randX = -500;
		randY = 181;
	} else if (spawnWhere === 42) {
		randX = -500;
		randY = 108;
	} else if (spawnWhere === 43) {
		randX = -500;
		randY = 35;
	} else if (spawnWhere === 44) {
		randX = -500;
		randY = -38;
	} else if (spawnWhere === 45) {
		randX = -500;
		randY = -111;
	} else if (spawnWhere === 46) {
		randX = -500;
		randY = -184;
	} else if (spawnWhere === 47) {
		randX = -500;
		randY = -257;
	} else if (spawnWhere === 48) {
		randX = -500;
		randY = -330;
	} else if (spawnWhere === 49) {
		randX = -500;
		randY = -400;
	}

    this.boundingBox = new BoundingBox(randX, randY, 13);

    Entity.call(this, game, randX, randY);
}

Monster.prototype = new Entity();
Monster.prototype.constructor = Monster;

Monster.prototype.update = function () {
    if (this.dead) {
        this.removeFromWorld = true;
    }
    Entity.prototype.update.call(this);
}

Monster.prototype.draw = function (ctx) {
    if (!this.boundingBox.collide(this.game.tower.boundingBox)) {
		var enemySpeed = .008;
		if (this.x + this.monsterImgWidth / 2 > 0 ) {
            this.x = this.x - (this.x * enemySpeed);
        } else if (this.x + this.monsterImgWidth / 2 < 0) {
            this.x = this.x - (this.x * enemySpeed);
        }

        if (this.y + this.monsterImgHeight / 2 > 0) {
            this.y = this.y - (this.y * enemySpeed);
        } else if (this.y + this.monsterImgHeight / 2 < 0) {
            this.y = this.y - (this.y * enemySpeed);
        }
		/*
		
		if (this.x + this.monsterImgWidth / 2 > 0 ) {
            this.x--;
        } else if (this.x + this.monsterImgWidth / 2 < 0) {
            this.x++;
        }

        if (this.y + this.monsterImgHeight / 2 > 0) {
            this.y--;
        } else if (this.y + this.monsterImgHeight / 2 < 0) {
            this.y++;
        }
*/
  }

    if (this.game.showOutlines) {
        ctx.beginPath();
        ctx.strokeStyle = "green";
        ctx.arc(this.x + this.monsterImgWidth / 2, this.y + this.monsterImgHeight / 2, 17, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.closePath();
    }
    this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y);
    this.boundingBox = new BoundingBox(this.x + this.monsterImgWidth / 2, this.y + this.monsterImgHeight / 2, 17);
}


function Hero(game) {
    this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite.png"), 0, 0, 102, 102, 2, 1, true, false);

    this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite.png"), 0, 0, 102, 102, 1, 1, true, false);
    this.movingUP = false;
    this.movingLEFT = false;
    this.movingDOWN = false;
    this.movingRIGHT = false;
    this.movingRIGHTDOWN = false;
    this.flag = 0;
    this.movingSpeed = 2.5;
	this.moveSpdUpgd = .5;
    this.boundingBox = new BoundingBox(-game.surfaceWidth / 2 - this.animation.frameWidth / 2, 0, 13);

    Entity.call(this, game, -170, -40);
}

Hero.prototype = new Entity();
Hero.prototype.constructor = Hero;

Hero.prototype.update = function () {
    this.movingUP = this.game.w;
    this.movingLEFT = this.game.a;
    this.movingDOWN = this.game.s;
    this.movingRIGHT = this.game.d;
    this.movingRIGHTDOWN = this.game.sd;

    Entity.prototype.update.call(this);
}

Hero.prototype.draw = function (ctx) {
   	this.game.ctx.drawImage(background, -450, -350);
    if (!this.boundingBox.collide(this.game.tower.boundingBox)) {
        if (this.game.map["87"] && this.game.map["68"]) {
            this.animation.drawFrame(this.game.clockTick, ctx, this.x += this.movingSpeed, this.y -= this.movingSpeed);
        }

        else if (this.game.map["87"] && this.game.map["65"]) {
            this.animation.drawFrame(this.game.clockTick, ctx, this.x -= this.movingSpeed, this.y -= this.movingSpeed);
        }

        else if (this.game.map["83"] && this.game.map["68"]) {
            this.animation.drawFrame(this.game.clockTick, ctx, this.x += this.movingSpeed, this.y += this.movingSpeed);
        }

        else if (this.game.map["83"] && this.game.map["65"]) {
            this.animation.drawFrame(this.game.clockTick, ctx, this.x -= this.movingSpeed, this.y += this.movingSpeed);
        }

        else if (this.game.map["87"]) {
            if (this.flag === 1) {
                this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y -= this.movingSpeed);
            } else {
                this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite.png"), 901, 0, 102, 102, 2, 4, true, false);
                this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite.png"), 901, 0, 102, 102, 1, 4, true, false);
                this.flag = 1;
            }
        }

        else if (this.game.map["65"]) {
            if (this.flag === 2) {
                this.animation.drawFrame(this.game.clockTick, ctx, this.x -= this.movingSpeed, this.y);
            } else {
                this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite.png"), 101, 0, 102, 102, 2, 2, true, false);
                this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite.png"), 101, 0, 102, 102, 1, 2, true, false);
                this.flag = 2;
            }
        }

        else if (this.game.map["83"]) {
            if (this.flag === 3) {
                this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y += this.movingSpeed);
            } else {
                this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite.png"), 501, 0, 102, 102, 2, 4, true, false);
                this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite.png"), 501, 0, 102, 102, 1, 4, true, false);
                this.flag = 3;
            }
        }

        else if (this.game.map["68"]) {
            if (this.flag === 4) {
                this.animation.drawFrame(this.game.clockTick, ctx, this.x += this.movingSpeed, this.y);
            } else {
                this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite.png"), 301, 0, 102, 102, 2, 2, true, false);
                this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite.png"), 301, 0, 102, 102, 1, 2, true, false);
                this.flag = 4;
            }
        }
    } else {
        if (this.flag === 1)
            this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y += this.movingSpeed);
        if (this.flag === 2)
            this.animation.drawFrame(this.game.clockTick, ctx, this.x += this.movingSpeed, this.y);
        if (this.flag === 3)
            this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y -= this.movingSpeed);
        if (this.flag === 4)
            this.animation.drawFrame(this.game.clockTick, ctx, this.x -= this.movingSpeed, this.y);

    }

	var heroBoundingBoxSize = 15;
	
    if (this.flag === 1) {
        this.boundingBox = new BoundingBox(this.x + this.animation.frameWidth / 1.5, this.y + this.animation.frameHeight / 5, heroBoundingBoxSize);
    } else if (this.flag === 2) {
        this.boundingBox = new BoundingBox(this.x + this.animation.frameWidth / 4, this.y + this.animation.frameHeight / 2, heroBoundingBoxSize);
    } else if (this.flag === 3) {
        this.boundingBox = new BoundingBox(this.x + this.animation.frameWidth / 1.65, this.y + this.animation.frameHeight / 1.35, heroBoundingBoxSize);
    } else if (this.flag === 4) {
        this.boundingBox = new BoundingBox(this.x + this.animation.frameWidth / 1.25, this.y + this.animation.frameHeight / 2, heroBoundingBoxSize);
    }

    for (var i = 0; i < this.game.enemies.length; i++) {
        if (!this.game.enemies[i].dead && this.boundingBox.collide(this.game.enemies[i].boundingBox)) {
            this.game.enemies[i].dead = true;
            this.game.gold += this.game.enemies[i].pointValue;
            this.game.scoreDisplay.innerHTML = "Gold: " + this.game.gold;
			this.game.kp += this.game.enemies[i].pointValue * 100;
			this.game.kpDisplay.innerHTML = "Kill Points: " + this.game.kp;
			this.game.MusicPlayer.swordHitSound();
        }
    }

    this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y);

    if (this.x > this.game.surfaceWidth / 2 + this.animation.frameWidth + 1 - 150) {
        this.x = -this.game.surfaceWidth / 2 - this.animation.frameWidth;
    }
    if (this.x < -this.game.surfaceWidth / 2 - this.animation.frameWidth - 1) {
        this.x = this.game.surfaceWidth / 2 + this.animation.frameWidth - 150;
    }
    if (this.y > this.game.surfaceHeight / 2 + 1) {
        this.y = -this.game.surfaceHeight / 2 - this.animation.frameHeight / 2;
    }
    if (this.y < -this.game.surfaceHeight / 2 - this.animation.frameHeight / 2 - 1) {
        this.y = this.game.surfaceHeight / 2;
    }

	
	
    if (this.game.showOutlines) {
        ctx.beginPath();
        ctx.strokeStyle = "green";

        if (this.flag === 1) {
            ctx.arc(this.x + this.animation.frameWidth / 1.5, this.y + this.animation.frameHeight / 5, heroBoundingBoxSize, 0, Math.PI * 2, true);
        } else if (this.flag === 2) {
            ctx.arc(this.x + this.animation.frameWidth / 4, this.y + this.animation.frameHeight / 2, heroBoundingBoxSize, 0, Math.PI * 2, true);
        } else if (this.flag === 3) {
            ctx.arc(this.x + this.animation.frameWidth / 1.65, this.y + this.animation.frameHeight / 1.35, heroBoundingBoxSize, 0, Math.PI * 2, true);
        } else if (this.flag === 4) {
            ctx.arc(this.x + this.animation.frameWidth / 1.25, this.y + this.animation.frameHeight / 2, heroBoundingBoxSize, 0, Math.PI * 2, true);
        }

        ctx.stroke();
        ctx.closePath();
    }
}

function Hero2(game) {
    this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite2.png"), 0, 0, 102, 102, 2, 1, true, false);
    this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite2.png"), 0, 0, 102, 102, 1, 1, true, false);
    this.movingUP = false;
    this.movingLEFT = false;
    this.movingDOWN = false;
    this.movingRIGHT = false;
    this.movingRIGHTDOWN = false;
    this.flag = 0;
    this.movingSpeed = 2.5;
	this.moveSpdUpgd = .5;
	
    this.boundingBox = new BoundingBox(-game.surfaceWidth / 2 - this.animation.frameWidth / 2, 0, 13);

    Entity.call(this, game, 70, -40);
}

Hero2.prototype = new Entity();
Hero2.prototype.constructor = Hero2;

Hero2.prototype.update = function () {
    this.movingUP = this.game.w;
    this.movingLEFT = this.game.a;
    this.movingDOWN = this.game.s;
    this.movingRIGHT = this.game.d;
    this.movingRIGHTDOWN = this.game.sd;

    Entity.prototype.update.call(this);
}

Hero2.prototype.draw = function (ctx) {
   
    //console.log(this.boundingBox.collide(this.game.tower.boundingBox));
    if (!this.boundingBox.collide(this.game.tower.boundingBox)) {
        if (this.game.map["73"] && this.game.map["76"]) {
            this.animation.drawFrame(this.game.clockTick, ctx, this.x += this.movingSpeed, this.y -= this.movingSpeed);
        }

        else if (this.game.map["73"] && this.game.map["74"]) {
            this.animation.drawFrame(this.game.clockTick, ctx, this.x -= this.movingSpeed, this.y -= this.movingSpeed);
        }

        else if (this.game.map["75"] && this.game.map["76"]) {
            this.animation.drawFrame(this.game.clockTick, ctx, this.x += this.movingSpeed, this.y += this.movingSpeed);
        }

        else if (this.game.map["75"] && this.game.map["74"]) {
            this.animation.drawFrame(this.game.clockTick, ctx, this.x -= this.movingSpeed, this.y += this.movingSpeed);
        }

        else if (this.game.map["73"]) {
            if (this.flag === 1) {
                this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y -= this.movingSpeed);
            } else {
                this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite2.png"), 901, 0, 102, 102, 2, 4, true, false);
                this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite2.png"), 901, 0, 102, 102, 1, 4, true, false);
                this.flag = 1;
            }
        }

        else if (this.game.map["74"]) {
            if (this.flag === 2) {
                this.animation.drawFrame(this.game.clockTick, ctx, this.x -= this.movingSpeed, this.y);
            } else {
                this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite2.png"), 101, 0, 102, 102, 2, 2, true, false);
                this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite2.png"), 101, 0, 102, 102, 1, 2, true, false);
                this.flag = 2;
            }

        }

        else if (this.game.map["75"]) {
            if (this.flag === 3) {
                this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y += this.movingSpeed);
            } else {
                this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite2.png"), 501, 0, 102, 102, 2, 4, true, false);
                this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite2.png"), 501, 0, 102, 102, 1, 4, true, false);
                this.flag = 3;
            }
        }

        else if (this.game.map["76"]) {
            if (this.flag === 4) {
                this.animation.drawFrame(this.game.clockTick, ctx, this.x += this.movingSpeed, this.y);
            } else {
                this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite2.png"), 301, 0, 102, 102, 2, 2, true, false);
                this.animation = new Animation(ASSET_MANAGER.getAsset("./img/sprite2.png"), 301, 0, 102, 102, 1, 2, true, false);
                this.flag = 4;
            }
        }
    } else {
        if (this.flag === 1)
            this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y += this.movingSpeed);
        if (this.flag === 2)
            this.animation.drawFrame(this.game.clockTick, ctx, this.x += this.movingSpeed, this.y);
        if (this.flag === 3)
            this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y -= this.movingSpeed);
        if (this.flag === 4)
            this.animation.drawFrame(this.game.clockTick, ctx, this.x -= this.movingSpeed, this.y);

    }

	var heroBoundingBoxSize = 15;
	
    if (this.flag === 1) {
        this.boundingBox = new BoundingBox(this.x + this.animation.frameWidth / 1.5, this.y + this.animation.frameHeight / 5, heroBoundingBoxSize);
    } else if (this.flag === 2) {
        this.boundingBox = new BoundingBox(this.x + this.animation.frameWidth / 4, this.y + this.animation.frameHeight / 2, heroBoundingBoxSize);
    } else if (this.flag === 3) {
        this.boundingBox = new BoundingBox(this.x + this.animation.frameWidth / 1.65, this.y + this.animation.frameHeight / 1.35, heroBoundingBoxSize);
    } else if (this.flag === 4) {
        this.boundingBox = new BoundingBox(this.x + this.animation.frameWidth / 1.25, this.y + this.animation.frameHeight / 2, heroBoundingBoxSize);
    }

    for (var i = 0; i < this.game.enemies.length; i++) {
        if (!this.game.enemies[i].dead && this.boundingBox.collide(this.game.enemies[i].boundingBox)) {
            this.game.enemies[i].dead = true;
            this.game.gold += this.game.enemies[i].pointValue;
            this.game.scoreDisplay.innerHTML = "Gold: " + this.game.gold;
            this.game.kp += this.game.enemies[i].pointValue * 100;
            this.game.kpDisplay.innerHTML = "Kill Points: " + this.game.kp;
            this.game.MusicPlayer.swordHitSound();
        }
    }


    this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y);

    if (this.x > this.game.surfaceWidth / 2 + this.animation.frameWidth + 1 - 150) {
        this.x = -this.game.surfaceWidth / 2 - this.animation.frameWidth;
    }
    if (this.x < -this.game.surfaceWidth / 2 - this.animation.frameWidth - 1) {
        this.x = this.game.surfaceWidth / 2 + this.animation.frameWidth - 150;
    }
    if (this.y > this.game.surfaceHeight / 2 + 1) {
        this.y = -this.game.surfaceHeight / 2 - this.animation.frameHeight / 2;
    }
    if (this.y < -this.game.surfaceHeight / 2 - this.animation.frameHeight / 2 - 1) {
        this.y = this.game.surfaceHeight / 2;
    }

    if (this.game.showOutlines) {
        ctx.beginPath();
        ctx.strokeStyle = "green";

        if (this.flag === 1) {
            ctx.arc(this.x + this.animation.frameWidth / 1.5, this.y + this.animation.frameHeight / 5, heroBoundingBoxSize, 0, Math.PI * 2, true);
        } else if (this.flag === 2) {
            ctx.arc(this.x + this.animation.frameWidth / 4, this.y + this.animation.frameHeight / 2, heroBoundingBoxSize, 0, Math.PI * 2, true);
        } else if (this.flag === 3) {
            ctx.arc(this.x + this.animation.frameWidth / 1.65, this.y + this.animation.frameHeight / 1.35, heroBoundingBoxSize, 0, Math.PI * 2, true);
        } else if (this.flag === 4) {
            ctx.arc(this.x + this.animation.frameWidth / 1.25, this.y + this.animation.frameHeight / 2, heroBoundingBoxSize, 0, Math.PI * 2, true);
        }

        ctx.stroke();
        ctx.closePath();
    }
}

function MusicPlayer(game) {
//    this.BgAudio = new Audio("music/what is wrong with me.mp3");
}

MusicPlayer.prototype.swordHitSound = function() {
    var random = Math.floor(Math.random() * 5);
    if (random === 0) {
		MUSIC_MANAGER.getAsset("./music/C chank.mp3").play();
	} else if (random === 1) {
		MUSIC_MANAGER.getAsset("./music/D chank.mp3").play();
	} else if (random === 2) {
		MUSIC_MANAGER.getAsset("./music/E chank.mp3").play();
	} else if (random === 3) {
		MUSIC_MANAGER.getAsset("./music/G chank.mp3").play();
	} else {
		MUSIC_MANAGER.getAsset("./music/A chank.mp3").play();
	}
}


// the "main" code begins here

var ASSET_MANAGER = new AssetManager();
var MUSIC_MANAGER = new MusicManager();

ASSET_MANAGER.queueDownload("./img/stats.png");
ASSET_MANAGER.queueDownload("./img/castle.png");
ASSET_MANAGER.queueDownload("./img/sprite.png");
ASSET_MANAGER.queueDownload("./img/sprite2.png");
ASSET_MANAGER.queueDownload("./img/monster_sprite.png");
ASSET_MANAGER.queueDownload("./img/monsters_sprites.png");
ASSET_MANAGER.queueDownload("./img/map.png");

MUSIC_MANAGER.queueDownload("./music/laser.mp3");
MUSIC_MANAGER.queueDownload("./music/sad time uh oh.mp3");
MUSIC_MANAGER.queueDownload("./music/what is wrong with me.mp3");
MUSIC_MANAGER.queueDownload("./music/A chank.mp3");
MUSIC_MANAGER.queueDownload("./music/C chank.mp3");
MUSIC_MANAGER.queueDownload("./music/D chank.mp3");
MUSIC_MANAGER.queueDownload("./music/E chank.mp3");
MUSIC_MANAGER.queueDownload("./music/G chank.mp3");
MUSIC_MANAGER.queueDownload("./music/speedup.mp3");
MUSIC_MANAGER.queueDownload("./music/healthup.mp3");
MUSIC_MANAGER.queueDownload("./music/rangeup.mp3");
MUSIC_MANAGER.queueDownload("./music/chargeup.mp3");

MUSIC_MANAGER.downloadAll();

ASSET_MANAGER.downloadAll(function () {
    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');
    var gold = document.getElementById('gold');
	var kp = document.getElementById('kp');
	var introText = document.getElementById('introText');
	var towerHealth = document.getElementById('towerHealth');
	var gameOverText = document.getElementById('gameOverText');
	var map = document.getElementById('background');
    ctx.translate(canvas.width / 2, canvas.height / 2);

    var enemies = [];
    var gameEngine = new GameEngine();
    gameEngine.init(ctx);
    var bg = new Background(gameEngine);
    var hero = new Hero(gameEngine);
    var hero2 = new Hero2(gameEngine);
    var tower = new Tower(gameEngine);	
	
    var background = map;
    ctx.drawImage(background, -450, -350);
		
    gameEngine.MusicPlayer = new MusicPlayer();
    gameEngine.MusicPlayer.BgAudio = MUSIC_MANAGER.getAsset("./music/what is wrong with me.mp3");
    gameEngine.MusicPlayer.BgAudio.loop = true;
    gameEngine.MusicPlayer.volume = .25;

    gameEngine.showOutlines = false;

    gameEngine.addEntity(bg);
    gameEngine.addEntity(hero);
    gameEngine.addEntity(hero2);
    gameEngine.addEntity(tower);
    
    gameEngine.hero = hero;
    gameEngine.hero2 = hero2;

    
    gameEngine.scoreDisplay = gold;
    gameEngine.gold = 0;
	gameEngine.kpDisplay = kp;
	gameEngine.kp = 0;
    gameEngine.tower = tower;
    gameEngine.enemies = enemies;
    gameEngine.spawnRate = .5;
    gameEngine.spawnCounter = 0;
    gameEngine.towerHp = 100;
    gameEngine.towerHpDisplay = towerHealth;
    gameEngine.introText = introText;
    gameEngine.gameOverText = gameOverText;
    gameEngine.running = false;
    gameEngine.dead = false;
   
    
});
