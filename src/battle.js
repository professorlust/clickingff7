import Enemy from './enemy';

export default class Battle {

    constructor(game, story) {
        this.game = game;
        this.story = story;

        this.reload();
    }

    reload() {
        this.results = false;

        // list of actions to execute
        // Action[]
        this.actionsPanel = [];

        // choose enemies
        this.chooseEnemies();

        // check actions
        console.log('[BATTLE BEGINS]');
        this.run();
    }

    /**
     *
     */
    chooseEnemies() {
        let enemies = this.story.data.enemies;
        let nbr = 1;//_.random(1, 3);
        let choose = _.sample(enemies, nbr);

        this.enemies = [];
        for (let e of choose) {
            this.enemies.push(Enemy.get(this, e));
        }
    }

    /**
     *
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
     * DO THE BATTLE
     */
    run() {
        console.log('');
        console.log('waiting 2s..');
        console.log('');
        this.timer = this.game.$timeout(() => {

            // check end
            if (this.checkEnd()) {
                this.game.$timeout.cancel(this.timer);
                this.end();
                return;
            }

            console.log('begin turn');

            // move all units
            let units = this.units();
            for (let u of units) {
                u.atb += u.dex;
            }

            // choose the fastest unit
            let unit = _.max(units, "atb");

            // set its atb to 0
            unit.atb = 0;

            // make his move
            console.log('-unit ai', unit.id);
            unit.ai(this, () => {

                // when his move over, go next turn
                console.log('-end turn');
                this.run();

            });
        }, 1500);
    }

    /**
     *
     * @param action
     */
    addAction(action) {
        this.actionsPanel.push(action);
    }

    /**
     *
     * @returns {boolean}
     */
    checkEnd() {
        let sumHpAllies = _.reduce(this.game.team, function (sum, ally) {
            return sum + ally.hp;
        }, 0);

        let sumHpEnemies = _.reduce(this.enemies, function (sum, ally) {
            return sum + ally.hp;
        }, 0);

        return (sumHpAllies == 0 || sumHpEnemies == 0);
    }

    /**
     *
     */
    end() {
        console.log('[BATTLE ENDS]');
        this.results = true;

        let sumHpAllies = _.reduce(this.game.team, function (sum, ally) {
            return sum + ally.hp;
        }, 0);

        let fail = (sumHpAllies <= 0);

        if (!fail) {
            this.count = 5;
            this.newBattle();
        } else {
            this.goStory();
        }
    }

    newBattle() {
        if (this.count == 0) {
            this.game.battle = new Battle(this.game, this.story);
            this.game.$timeout.cancel(this.timer);
            return;
        }
        this.timer = this.game.$timeout(() => {
            this.count--;
            this.newBattle();
        }, 1000);
    }

}