﻿var GameScene = cc.Scene.extend({
//测试一下
    _background: null,
    _hero:null,
    _ui:null,
    _foodManager:null,
    _obstacleManager:null,

    _touchY:0,

    ctor: function () {
        this._super();

        var layer = new cc.Layer();
        this.addChild(layer);

        this._background = new GameBackground();
        layer.addChild(this._background);

        this._hero = new Hero();    
        layer.addChild(this._hero);

        this._ui=new GameSceneUI();
        layer.addChild(this._ui);
        this._ui.update();

        if("touches" in cc.sys.capabilities)
            cc.eventManager.addListener({event: cc.EventListener.TOUCH_ALL_AT_ONCE, onTouchesMoved: this._onTouchMoved.bind(this)}, this);
        else
            cc.eventManager.addListener({event: cc.EventListener.MOUSE, onMouseMove: this._onMouseMove.bind(this)}, this);
        cc.eventManager.addListener({event: cc.EventListener.KEYBOARD, onKeyReleased: this._back}, this);

        this._foodManager = new FoodManager(this);
        this._obstacleManager = new ObstacleManager(this);
        
        this.init();
    },
    init:function(){

        var winSize = cc.director.getWinSize();
        this._ui.setVisible(true);

        Game.user.lives = GameConstants.HERO_LIVES;
        Game.user.score = Game.user.distance = 0;
        Game.gameState = GameConstants.GAME_STATE_IDLE;
        Game.user.heroSpeed = this._background.speed = 0;
        this._touchY = winSize.height/2;

        this._hero.x = -winSize.width/2;
        this._hero.y = winSize.height/2;

        this.scheduleUpdate();
    },
    _onTouchMoved:function(touches, event) {
        if(Game.gameState != GameConstants.GAME_STATE_OVER)
            this._touchY = touches[0].getLocation().y;
    },

    _onMouseMove:function(event) {
        if(Game.gameState != GameConstants.GAME_STATE_OVER)
            this._touchY = event.getLocationY();
    },
    _handleHeroPose:function() {
        var winSize = cc.director.getWinSize();
        // Rotate this._hero based on mouse position.
        if (Math.abs(-(this._hero.y - this._touchY) * 0.2) < 30)
            this._hero.setRotation((this._hero.y - this._touchY) * 0.2);

        // Confine the this._hero to stage area limit
        if (this._hero.y < this._hero.height * 0.5)
        {
            this._hero.y = this._hero.height * 0.5;
            this._hero.setRotation(0);
        }
        if (this._hero.y > winSize.height - this._hero.height * 0.5)
        {
            this._hero.y = winSize.height - this._hero.height * 0.5;
            this._hero.setRotation(0);
        }
    },
    showWindEffect:function() {
        if(this._windEffect)
            return;
        this._windEffect = new cc.ParticleSystem("res/particles/wind.plist");
        this._windEffect.x = cc.director.getWinSize().width;
        this._windEffect.y = cc.director.getWinSize().height/2;
        this._windEffect.setScaleX(100);
        this.addChild(this._windEffect);
    },

    stopWindEffect:function() {
        if(this._windEffect){
            this._windEffect.stopSystem();
            this.removeChild(this._windEffect);
            this._windEffect = null;
        }
    },
    showCoffeeEffect:function(){
        if(this._coffeeEffect)
            return;
        this._coffeeEffect = new cc.ParticleSystem("res/particles/coffee.plist");
        this.addChild(this._coffeeEffect);
        this._coffeeEffect.x = this._hero.x + this._hero.width/4;
        this._coffeeEffect.y = this._hero.y;
    },

    stopCoffeeEffect:function(){
        if(this._coffeeEffect){
            this._coffeeEffect.stopSystem();
            this.removeChild(this._coffeeEffect);
            this._coffeeEffect = null;
        }
    },

    showMushroomEffect:function(){
        if(this._mushroomEffect)
            return;
        this._mushroomEffect = new cc.ParticleSystem("res/particles/mushroom.plist");
        this.addChild(this._mushroomEffect);
        this._mushroomEffect.x = this._hero.x + this._hero.width/4;
        this._mushroomEffect.y = this._hero.y;
    },

    stopMushroomEffect:function(){
        if(this._mushroomEffect){
            this._mushroomEffect.stopSystem();
            this.removeChild(this._mushroomEffect);
            this._mushroomEffect = null;
        }
    },
    update:function(elapsed) {
        var winSize = cc.director.getWinSize();
        switch(Game.gameState) {
            case GameConstants.GAME_STATE_IDLE:
                // Take off.
                if (this._hero.x < winSize.width * 0.5 * 0.5) {
                    this._hero.x += ((winSize.width * 0.5 * 0.5 + 10) - this._hero.x) * 0.05;
                    this._hero.y -= (this._hero.y - this._touchY) * 0.1;

                    Game.user.heroSpeed += (GameConstants.HERO_MIN_SPEED - Game.user.heroSpeed) * 0.05;
                    this._background.speed = Game.user.heroSpeed * elapsed;
                }
                else {
                    Game.gameState = GameConstants.GAME_STATE_FLYING;
                    this._hero.state = GameConstants.HERO_STATE_FLYING;
                }
                this._handleHeroPose();
                this._ui.update();
                break;

            case GameConstants.GAME_STATE_FLYING:
                // If drank coffee, fly faster for a while.
                if (Game.user.coffee > 0)
                    Game.user.heroSpeed += (GameConstants.HERO_MAX_SPEED - Game.user.heroSpeed) * 0.2;
                else
                    this.stopCoffeeEffect();

                // If not hit by obstacle, fly normally.
                if (Game.user.hitObstacle <= 0) {
                    this._hero.state = GameConstants.HERO_STATE_FLYING;
                    this._hero.y -= (this._hero.y - this._touchY) * 0.1;

                    // If this._hero is flying extremely fast, create a wind effect and show force field around this._hero.
                    if (Game.user.heroSpeed > GameConstants.HERO_MIN_SPEED + 100) {
                        this.showWindEffect();
                        // Animate this._hero faster.
                        this._hero.toggleSpeed(true);
                    }
                    else {
                        // Animate this._hero normally.
                        this._hero.toggleSpeed(false);
                        this.stopWindEffect();
                    }
                    this._handleHeroPose();

                } else {
                    // Hit by obstacle
                    if (Game.user.coffee <= 0)
                    {
                        // Play this._hero animation for obstacle hit.
                        if (this._hero.state != GameConstants.HERO_STATE_HIT){
                            this._hero.state = GameConstants.HERO_STATE_HIT;
                        }

                        // Move hero to center of the screen.
                        this._hero.y -= (this._hero.y - winSize.height/2) * 0.1;

                        // Spin the this._hero.
                        if (this._hero.y > winSize.height * 0.5)
                            this._hero.rotation -= Game.user.hitObstacle * 2;
                        else
                            this._hero.rotation += Game.user.hitObstacle * 2;
                    }

                    // If hit by an obstacle.
                    Game.user.hitObstacle--;

                    // // Camera shake.
                    // this._shakeAnimation();
                }

                // If we have a mushroom, reduce the value of the power.
                if (Game.user.mushroom > 0) Game.user.mushroom -= elapsed;
                else this.stopMushroomEffect();

                // If we have a coffee, reduce the value of the power.
                if (Game.user.coffee > 0) Game.user.coffee -= elapsed;

                Game.user.heroSpeed -= (Game.user.heroSpeed - GameConstants.HERO_MIN_SPEED) * 0.01;

                // Create food items.
                this._foodManager.update(this._hero, elapsed);
                // Create obstacles.
                this._obstacleManager.update(this._hero, elapsed);

                // Set the background's speed based on hero's speed.
                this._background.speed = Game.user.heroSpeed * elapsed;

                // Calculate maximum distance travelled.
                Game.user.distance += (Game.user.heroSpeed * elapsed) * 0.1;
                this._ui.update();

                break;
        }

    }
});