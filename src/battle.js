class Battle {

    constructor(game) {
        this.game = game;
        this.isBattle = false;
    }

    /**
     * Characters start auto-attacking
     */
        startRandom() {
        if (!this.isBattle) {
            this.isBattle = true;

            this.game.characters.autoFighting();

            this.game.enemies.fightRandom();
            this.game.enemies.refresh();
            this.game.enemies.autoFighting();
        }
    }

    /**
     * Returns true if zone boss is available
     * @returns {boolean}
     */
        canFightBoss() {
        var levelMax = this.game.characters.levelMax;
        var zone = this.game.zones.current();
        return (!this.isBattle && levelMax >= zone.level * 4 && !zone.completed);
    }

    /**
     * Characters start auto-attacking
     */
        startBoss() {
        if (!this.isBattle) {
            this.isBattle = true;

            this.game.characters.autoFighting();

            this.game.enemies.fightBoss();
            this.game.enemies.refresh();
            this.game.enemies.autoFighting();
        }
    }

    /**
     * Characters stop attacking and wait for next fight
     * @param  {boolean} victory
     */
        end(victory) {
        this.isBattle = false;

        this.game.characters.stopFighting();
        this.game.enemies.stopFighting();

        var enemies = this.game.enemies.list;
        var characters = this.game.characters.getTeam();
        var materias = this.game.materias.getEquipped();

        for (var enemy of enemies) {

            // Rewards if victory
            if (victory) {
                this.game.gils += enemy.gilsReward();

                if (enemy.boss && this.game.zones.level + 1 > this.game.zones.levelMax) {
                    // Complete zone
                    this.game.zones.complete();
                }

                // XP for characters, AP for materias
                for (var character of characters) {
                    var xp = enemy.xpReward();
                    character.setXp(xp);
                }
                for (var materia of materias) {
                    var ap = enemy.apReward();
                    materia.setAp(ap);
                }
            }
        }

        this.game.enemies.remove();
        this.game.enemies.refresh();
        this.game.characters.refresh();
    }
}