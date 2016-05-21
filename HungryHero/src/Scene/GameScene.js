﻿var GameScene = cc.Scene.extend({

    _background: null,
    _hero:null,
    ctor: function () {
        this._super();

        var layer = new cc.Layer();
        this.addChild(layer);

        this._background = new GameBackground();
        layer.addChild(this._background);

        this._hero = new Hero();    
        layer.addChild(this._hero);


        this.init();
    },
    inti:function(){
        var winSize = cc.director.getWinSize();
        //var winSize = cc.winSize;
        this._hero.x = winSize.width / 2;
        this._hero.y = winSize.height / 2;

        this.scheduleUpdate();
    },
});