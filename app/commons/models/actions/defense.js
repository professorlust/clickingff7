import Action from '../action';

export default class ActionDefense extends Action {

    constructor(character) {
        super(character);

        this.ref = 'defense';

        this.img = 'resources/images/icons/armor.png';
    }

}