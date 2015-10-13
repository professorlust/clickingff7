import Enemy from './enemy';
import History from './history';
import _ from 'lodash';

export default class Battle {

    constructor(game, data) {
        this.game = game;
        this.story = game.story;

        this.init();
    }

    init() {

        // list of enemies to fight
        // Enemy[]
        this.enemies = [];

        // if battle is win
        this.rewards = null;

        // if battle is lost
        this.lost = 0;

        // boss battle?
        this.boss = false;

        // no of enemies wave
        this.wave = 0;

        // selected target: unit
        this.target = null;
        
        // history logs
        this.history = new History();
    }

    /**
     *
     * @param data
     */
    load(data) {
        for (let i of data.enemies) {
            this.enemies.push(Enemy.get(this, i));
        }

        if (data.boss) {
            this.boss = data.boss;
        }
    }

    /**
     * Choose randomly enemies & update wave number
     */
    chooseEnemies() {
        let enemies = this.story.data.enemies;
        let nbr = 1;//_.random(1, 3);
        let choose = _.sample(enemies, nbr);

        this.wave++;
        this.enemies = [];
        for (let e of choose) {
            this.enemies.push(Enemy.get(this, e));
        }
    }

    /**
     *
     */
    chooseBoss() {
        let boss = this.story.data.boss;

        this.boss = true;

        for (let e of boss) {
            this.enemies.push(Enemy.get(this, e));
        }
    }

    /**
     * Returns alive units
     * @returns {Array|*}
     */
    units() {
        let units;
        units = _.union(this.game.team, this.enemies);
        units = _.filter(units, (u) => {
            return u.hp > 0;
        });
        return units;
    }

    /**
     * Units begin to fight
     */
    start() {
        this.history.add('battle', 'New wave #' + this.wave);

        // list of actions
        this.actions = [];

        // todo list of events
        this.events = [];

        for (let i of this.units()) {
            if (!i.battle) {
                i.setBattle(this);
            }
            i.cts = 0;
        }
        
        // todo check events before the battle begins
        // this.check();

        // pause off
        this.checking = false;
        this.setPause(false);
    }

    /**
     * Pause ON/OFF
     */
    setPause(state) {
        if (state) {
            this.stop();
        } else {
            this.run();
        }
        this.pause = state;
    }

    /**
     * Units move
     */
    run() {
        this.timer = this.game.$timeout(() => {
            
            let checking = false;

            // move all units
            for (let i of this.units()) {
                if (i.cts < i.ctsMax) {
                    i.cts += 100;
                }
                if (i.cts >= i.ctsMax) {
                    checking = true;
                    this.addAction(i.ai(this));
                }
            }
            
            // pause off if checking
            if (checking) {
                this.checking = false;
                this.setPause(false);
            }
            
            // recursive
            this.run();

        }, 100);
    }

    /**
     * Units stop
     */
    stop() {
        this.game.$timeout.cancel(this.timer);
    }

    /**
     * Check for actions (todo: or events)
     */
    check() {

        // no checking
        if (this.actions.length == 0 || this.checking) {
            return;
        }

        // start checking
        this.checking = true;
        this.setPause(true);

        // checking the oldest action
        let action = this.actions.shift();
        action.setBattle(this);
        action.execute(() => {

            // checking health
            let health = this.getHealth();

            if (health.team == 0) {

                // chain fail
                this.game.story.chain = 0;

                // redirect
                this.game.$location.path('/home');
                return;
            }

            if (health.enemies == 0) {

                // complete story if boss battle
                if (this.boss) {

                    // story complete
                    this.game.story.complete();

                    // redirect
                    this.game.$location.path('/story');
                    return;
                }

                // chain success
                this.game.story.chain++;

                // new enemies wave
                this.chooseEnemies();
                
                // [saving]
                this.game.save();
                
                // battle begin
                this.start();
                return;
            }

            // resuming unit cts
            action.unit.cts = 0;

            // recursive until actions is empty
            this.check();

        });
    }

    /**
     * Add an action & check
     * @param action
     */
    addAction(action) {
        this.actions.push(action);
        this.check();
    }

    /**
     *
     * @returns {{}}
     */
    getHealth() {
        var res = {};

        res.team = _.reduce(this.game.team, function (sum, ally) {
            return sum + ally.hp;
        }, 0);

        res.enemies = _.reduce(this.enemies, function (sum, ally) {
            return sum + ally.hp;
        }, 0);

        return res;
    }

    /**
     *
     * @returns {{}}
     */
    save() {
        var save = {};

        save.enemies = [];
        for (let i of this.enemies) {
            save.enemies.push(i.ref);
        }

        if (this.boss) {
            save.boss = true;
        }

        return save;
    }

}