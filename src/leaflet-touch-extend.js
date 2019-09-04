L.Map.mergeOptions({
  touchExtend: true
});

L.Map.TouchExtend = L.Handler.extend({

  initialize: function (map) {
    this._map = map;
    this._container = map._container;
  },

  addHooks: function () {
    L.DomEvent.on(this._container, 'touchstart', this._onTouchStart, this);
    L.DomEvent.on(this._container, 'touchmove', this._onTouchMove, this);
    L.DomEvent.on(this._container, 'touchend', this._onTouchEnd, this);
  },

  removeHooks: function () {
    L.DomEvent.off(this._container, 'touchstart', this._onTouchStart);
    L.DomEvent.on(this._container, 'touchmove', this._onTouchMove, this);
    L.DomEvent.off(this._container, 'touchend', this._onTouchEnd);
  },

  _onTouchStart: function (e) {
    if (!this._map._loaded) { return; }

    var type = 'touchstart',
        touch = e.touches[0],
        rect = this._container.getBoundingClientRect(),
        x = touch.clientX - rect.left - this._container.clientLeft,
        y = touch.clientY - rect.top - this._container.clientTop,
        containerPoint = L.point(x, y),
        layerPoint = this._map.containerPointToLayerPoint(containerPoint),
        latlng = this._map.containerPointToLatLng(containerPoint);

    this._map.fire(type, {
      latlng: latlng,
      layerPoint: layerPoint,
      containerPoint : containerPoint,
      originalEvent: e
    });
  },

  _onTouchMove: function (e) {
    if (!this._map._loaded || !e.changedTouches.length) { 
        return; 
    }

    var type = 'touchmove',
        touch = e.changedTouches[0],
        rect = this._container.getBoundingClientRect(),
        x = touch.clientX - rect.left - this._container.clientLeft,
        y = touch.clientY - rect.top - this._container.clientTop,
        containerPoint = L.point(x, y),
        layerPoint = this._map.containerPointToLayerPoint(containerPoint),
        latlng = this._map.containerPointToLatLng(containerPoint);

    this._map.fire(type, {
      latlng: latlng,
      layerPoint: layerPoint,
      containerPoint : containerPoint,
      originalEvent: e
    });
  },

  _onTouchEnd: function (e) {
    if (!this._map._loaded) { return; }

    var type = 'touchend';

    this._map.fire(type, {
      originalEvent: e
    });
  }
});
L.Map.addInitHook('addHandler', 'touchExtend', L.Map.TouchExtend);
