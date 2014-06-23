class Items {

    /**
     * Init
     * @param game
     */
        constructor(game) {
        this.game = game;
        this.list = [];
    }

    /**
     * Add a item
     * @param i
     */
        add(i) {
        this.list.push(i);
    }

    /**
     * Export all items
     * @returns {Array}
     */
        export() {
        var json = [], i, t;
        for(i in this.list) {
            json.push(this.list[i].export());
        }
        return json;
    }
}