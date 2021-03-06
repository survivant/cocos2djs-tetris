KEY_LEFT = 37;
KEY_RIGHT = 39;
KEY_UP = 38;
KEY_DOWN = 40;
KEY_A = 65;
KEY_B = 66;

function GameController(){
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
    this.a = false;

    this.init = function(){
        this.dead = [];
        for (var i = 0; i < g_block_cols; i++) {
            this.dead[i] = [];
            for (var j = 0; j < g_block_rows; j++)
                this.dead[i][j] = null;
        }
        var sched = cc.director.getScheduler();
        sched.scheduleCallbackForTarget(
            this,
            this.onTick,
            g_tick_interval);
        this.listener_key = {
            event:cc.EventListener.KEYBOARD,
            onKeyPressed:this.onKeyPressed
        };
/*
        this.listener_mouse = {
            event:cc.EventListener.MOUSE,
            onMouseDown:function(ev){
                g_ctrl.handleClick(ev.getLocationX(), ev.getLocationY());
            }
        };
        cc.eventManager.addListener(this.listener_mouse, 1);
*/
        this.listener_touch = {
            event:cc.EventListener.TOUCH_ONE_BY_ONE,
            onTouchBegan:function() {
                return true;
            },
            onTouchMove:function() {
                return true;
            },
            onTouchEnded:function(ev) {
                g_ctrl.handleClick(ev.getLocationX(), ev.getLocationY());
                return true;
            }
        };
        cc.eventManager.addListener(this.listener_touch, 1);

        //cc.eventManager.addListener(this.listener_key, 1);
    };

    this.handlePause = function() {
        if (this.pause_state == true) {
            this.pause_state = false;
            cc.director.resume();
        } else {
            this.pause_state = true;
            cc.director.pause();
        }
    }
    this.handleClick = function(x, y) {
        this.handleRestart();
        if (x > g_gscreen_width) {
            this.handlePause();
            this.a = true;
        }
        else {
            var c0 = false, c1 = false;
            if (g_gscreen_height/g_gscreen_width*x + y - g_gscreen_height < 0)
                c0 = false;
            else
                c0 = true;
            if (g_gscreen_height*x - g_gscreen_width*y > 0)
                c1 = false;
            else
                c1 = true;
            if ((!c0) && !c1)
                this.down = true;
            if ((!c0) && c1)
                this.left = true;
            if (c0 && !c1)
                this.right = true;
            if (c0 && c1)
                this.up = true;
        }
    };

    this.del = function(){
        sched = cc.director.getScheduler();
        //sched.unscheduleAllCallbackForTarget(this);
        sched.unscheduleAllCallbacks();
        //cc.eventManager.removeListener(this.listener_key);
        //cc.eventManager.removeListener(this.listener_mouse);
        cc.eventManager.removeListener(this.listener_touch);
    }

    this.handleRestart = function() {
        if (g_ctrl.quit == 1) {
            g_ctrl.del();
            cc.director.runScene(new MainScene());
            g_ctrl = new GameController();
            g_ctrl.init();
            cc.director.resume();
        }
    }
    this.onKeyPressed = function(key, ev){
        g_ctrl.handleRestart();
        switch(key) {
        case KEY_LEFT:
            g_ctrl.left = true;
            break;
        case KEY_RIGHT:
            g_ctrl.right = true;
            break;
        case KEY_UP:
            g_ctrl.up = true;
            break;
        case KEY_DOWN:
            g_ctrl.down = true;
            break;
        case KEY_A:
            g_ctrl.a = true;
            g_ctrl.handlePause();
            break;
        case KEY_B:
            g_ctrl.b = true;
            cc.director.resume();
            break;
        }
        console.log("get pressed: " + key);
    };

    this.onKeyReleased = function(key, ev){
        switch(key) {
        case KEY_LEFT:
            g_ctrl.left = false;
            break;
        case KEY_RIGHT:
            g_ctrl.right = false;
            break;
        case KEY_UP:
            g_ctrl.up = false;
            break;
        case KEY_DOWN:
            g_ctrl.down = false;
            break;
        case KEY_A:
            g_ctrl.a = false;
            break;
        case KEY_B:
            g_ctrl.b = false;
            break;

        }
        console.log("get release: " + key);
    };

    this.next = null;
    this.on_the_fly = null;
    this.turn = 0;
    this.quit = 0;
    this.onTick = function(){
        this.guard_on_the_fly();
        this.turn++;
        if (this.turn % 2 == 0)//player logic
            this.playerMove();
        else {
            if (this.on_the_fly.isLanded(this.dead)) {
                this.handleLand();
                this.guard_on_the_fly();
                if (this.on_the_fly.isLanded(this.dead)) {
                    g_ctrl.quit = 1;
                    g_main_layer.addChild(new OverLayer());
                }
            }
            if (Math.floor(this.turn/2) % g_speed == 0) {
                this.cpuMove();
            }
        }
    }

    this.shape_cnt = 0;
    this.getANumber = function() {
        this.shape_cnt++;
        return this.shape_cnt*this.shape_cnt*this.shape_cnt;
    };

    this.guard_on_the_fly = function(){
        if (this.next == null) {
            this.next = factory(this.getANumber());
            this.next.init(g_main_layer,
                           g_samp_col,
                           g_samp_row);
        }
        if (this.on_the_fly == null) {
            this.on_the_fly = this.next;
            this.on_the_fly.moveToNoCheck(
                Math.floor(g_block_cols/2),
                g_block_rows-1);

            this.next = factory(this.shape_cnt++);
            this.next.init(g_main_layer,
                           g_samp_col,
                           g_samp_row);
        }
    };

    this.dead = null;
    this.playerMove = function(){
        if (this.up) {
            this.up = false;
            this.on_the_fly.rotate(this.dead);
        } else if (this.down) {
            this.down = false;
            this.on_the_fly.move(0, -1, this.dead);
        } else if (this.left) {
            this.left = false;
            this.on_the_fly.move(-1, 0, this.dead);
        } else if (this.right) {
            this.right = false;
            this.on_the_fly.move(1, 0, this.dead);
        } else if (this.a) {
            this.a = false;
        }
    };

    this.cpuMove = function(){
        this.on_the_fly.move(0, -1 ,this.dead);
    };

    this.score = 0;
    this.handleLand = function(){
        var blks = this.on_the_fly.blks;
        var candidate_rows = {};
        for (var i = 0; i < blks.length; i++) {
            var col = blks[i]._x;
            var row = blks[i]._y;
            this.dead[col][row] = blks[i];
            //a set to save candidate rows
            candidate_rows[row] = 0;
        }
        //set to list
        var clist = [];
        for (var i in candidate_rows) {
            clist.push(Number(i));
        }
        for (var i = clist.length-1; i >= 0; i--) {
            var row = clist[i];
            var j = 0;
            for (j = 0; j < g_block_cols; j++) {
                if (this.dead[j][row] == null)
                    break;
            }
            if (j != g_block_cols)
                clist.splice(i, 1);

        }
         //insertion sort
        for (var i = 1; i < clist.length; i++) {
            var cur = clist[i];
            for (var j = i; j != 0 && cur < clist[j-1]; j--) {
                clist[j] = clist[j-1];
            }
            clist[j] = cur;
        }
        //actually do erasing if there is any
        var step = 0;
        if (clist.length != 0) {
            var head = clist[0];
            clist.splice(0, 1);
            for (var j = head; j < g_block_rows; j++) {
                if (j == head) {
                    for (var i = 0; i < g_block_cols; i++) {
                        if (this.dead[i][j] != null) {
                            this.dead[i][j].del();
                            this.dead[i][j] = null;
                        }
                    }
                    step++;
                    head = clist[0];
                    clist.splice(0, 1);
                } else {
                    for (var i = 0; i < g_block_cols; i++) {
                        this.dead[i][j-step] = this.dead[i][j];
                        if (this.dead[i][j-step] != null)
                            this.dead[i][j-step].moveBy(0, -step);
                        this.dead[i][j] = null;
                    }
                }
            }
        }
        this.on_the_fly = null;
        this.score += step;
        g_status_layer.updateScore(this.score)
    };
}
