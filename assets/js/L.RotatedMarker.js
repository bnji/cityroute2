// https://github.com/bbecquet/Leaflet.PolylineDecorator/blob/master/src/L.RotatedMarker.js
L.RotatedMarker = L.Marker.extend({
    options: {
        position: 0,
        angle: 0
    },

    _setPos: function (pos) {
        //console.log(pos);
        //console.log(this.options.angle)
        this.options.position = pos;
        L.Marker.prototype._setPos.call(this, pos);

        if (L.DomUtil.TRANSFORM) {
            // use the CSS transform rule if available
            this._icon.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.angle + 'deg)';
        } else if(L.Browser.ie) {
            // fallback for IE6, IE7, IE8
            var rad = this.options.angle * (Math.PI / 180),
                costheta = Math.cos(rad),
                sintheta = Math.sin(rad);
            this._icon.style.filter += ' progid:DXImageTransform.Microsoft.Matrix(sizingMethod=\'auto expand\', M11=' +
                costheta + ', M12=' + (-sintheta) + ', M21=' + sintheta + ', M22=' + costheta + ')';
        }
    },

    rotate: function(angle) {
        this.options.angle = angle;
        this._setPos(this.options.position);
    }
});

L.rotatedMarker = function (pos, options) {
    return new L.RotatedMarker(pos, options);
};