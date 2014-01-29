EveMap.Logger = function() {
    THREE.Object3D.call(this);

    this.GUI = null;
};

EveMap.Logger.prototype = {
    constructor: EveMap.Logger,
    log: function(message) {
        var msg;
        if ( console && console.log ) {
            for (var i = 0; i < arguments.length; i++) {
                msg = arguments[i];

                if (msg === undefined) {
                    var error = new Error('Log undefined variable.');
                    this.log(error);
                    continue;
                }

                if (msg.message) {
                    console.log(msg.message);
                    if (msg.stack) {
                        console.log(msg.stack);
                    }
                }

                console.log(msg);
            }
        }
    },
    GUILog: function(message) {
        this.GUI.log(message);
    }
};