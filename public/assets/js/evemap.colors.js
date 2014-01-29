EveMap.Colors = function(){

    this._generic       = {};

    this.default        = undefined;
    this.randomize      = true;
    this.unAccessible   = undefined;
    
    this.system         = {
        security:   [], // Colors by sec status
        actual:     []  // Actual colors
    };
};

EveMap.Colors.prototype = {
    constructor: EveMap.Colors,
    getGenericColor: function( name, index ) {
        return this._generic[ name ][ index ] ?
            this._generic[ name ][ index ] : this.default;
    },
    getGenericColors: function( name, length ) {
        if ( ! this._generic[ name ] && length > 0 ) {
            this.generateColors( name, length, this.randomize );
        }
    
        return this._generic[ name ] ?
            this._generic[ name ] : [];
    },
    getSystemSecurityColor: function( security ) {
        if (0 > security) {
            return this.system.security[ 10 ];
        } else if ( 0.15 > security ) {
            return this.system.security[ 9 ];
        } else if ( 0.25 > security ) {
            return this.system.security[ 8 ];
        }else if ( 0.35 > security ) {
            return this.system.security[ 7 ];
        }else if ( 0.45 > security ) {
            return this.system.security[ 6 ];
        }else if ( 0.55 > security ) {
            return this.system.security[ 5 ];
        }else if ( 0.65 > security ) {
            return this.system.security[ 4 ];
        } else if ( 0.75 > security ) {
            return this.system.security[ 3 ];
        } else if ( 0.85 > security ) {
            return this.system.security[ 2 ];
        } else if ( 0.95 > security ) {
            return this.system.security[ 1 ];
        }
    
        return this.system.security[ 0 ];
    },
    getSystemActualColor: function( sunType ) {
        return this.system.actual[ sunType ] || this.default;
    },
    generateColors: function( name, length, randomize ) {
        var color, colors = [];
        for ( var i = 0; i < length; i++ ) {
            color = this.default.clone();
            color.setHSL( i / length, 0.8, 0.5 );
            colors.push( color );
        }

        if ( randomize ) {
            colors.sort( function() {
                return Math.round( Math.random() );
            } );
        }
    
        this._generic[ name ] =  colors;
    }
};
