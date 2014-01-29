EveMap.GUI.Window = function( title, content, height, width, domElement ) {

    this.title              = title;
    this.content            = content;

    this.domElement         = undefined;
    this.headerDomElement   = undefined;
    this.contentDomElement  = undefined;

    this.domParent          = domElement;
    this.height             = height;
    this.width              = width;

    this.activated          = false;

    this._events = {
        _onMouseUp:   undefined,
        _onMouseMove: undefined
    };

    this._init();
};

EveMap.GUI.Window.prototype = {
    constructor: EveMap.GUI.Window,
    _init: function() {
        this.domElement = document.createElement( 'div' );
        this.domElement.setAttribute( 'class', 'gui-window' );
        this.domElement.style.display = 'none';
        this.domElement.style.height = this.height + 'px';
        this.domElement.style.width = this.width + 'px';

        this.domParent.appendChild( this.domElement );

        this.headerDomElement = document.createElement( 'div' );
        this.headerDomElement.setAttribute( 'class', 'gui-window-header' );
        this.headerDomElement.textContent = this.title;
        this.headerDomElement.addEventListener( 'mousedown', this._onMouseDown.bind( this ) );

        var btnClose = document.createElement( 'div' );
        btnClose.setAttribute( 'class', 'gui-window-close' );
        btnClose.textContent = 'x';
        btnClose.addEventListener( 'click', this.close.bind( this ) );

        this.contentDomElement = document.createElement( 'div' );
        this.contentDomElement.setAttribute( 'class', 'gui-window-content' );
    },
    _onMouseUp: function( event ) {
        this.domParent.removeEventListener( 'mousemove', this._events._onMouseMove );
        this.domParent.removeEventListener( 'mouseup', this._events._onMouseUp );
    },
    _onMouseDown: function( event ) {
        if ( event.target !== this.headerDomElement ) {
            return;
        }

        this._events._onMouseMove = this.domParent.addEventListener( 'mousemove', this._onMouseMove.bind( this ) );
        this._events._onMouseUp = this.domParent.addEventListener( 'mouseup', this._onMouseMove.bind( this ) );
    },
    _onMouseMove: function( event ) {

    },
    close: function() {
        this.domElement.style.display = 'none';
    },
    open: function() {
        if ( ! this.activated ) {
            if ( typeof this.content === 'function' ) {
                this.content( this );
            } else {
                this.contentDomElement.textContent = this.content;
            }

            this.activated = true;
        }

        this.domElement.style.display = 'block';
    },
    update: function( width, height ) {

    }
};