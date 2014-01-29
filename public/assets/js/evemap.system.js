EveMap.System = function(region, data, colors) {
    THREE.Vector3.call(this, data.x, data.y, data.z);

    this.label              = null;
    this.uid                = data.uid;
    this.name               = data.name;
    this.region             = region;
    this.constellationID    = data.constellationID;
    this.security           = data.security;
    this.radius             = data.radius;
    this.luminosity         = data.luminosity;
    this.sunTypeID          = data.sunTypeID;
    this.active             = false;

    this.actualColor        = colors.getSystemActualColor(this.sunTypeID);
    this.securityColor      = colors.getSystemSecurityColor(this.security);
};

EveMap.System.prototype = Object.create(THREE.Vector3.prototype);
EveMap.System.prototype.constructor = EveMap.System;