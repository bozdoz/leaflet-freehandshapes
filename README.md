Leaflet.FreeHandShapes
================

![MIT License](http://img.shields.io/badge/license-MIT-lightgrey.svg)
&nbsp;
![Leaflet](http://img.shields.io/badge/leaflet-0.7.7-green.svg?style=flat)

Forked from [L.FreeDraw](https://github.com/Wildhoney/Leaflet.FreeDraw)

![Washes Right Off](http://images1.fanpop.com/images/photos/2500000/Calvin-and-Hobbes-Comic-Strips-calvin-and-hobbes-2509598-600-191.gif)

### Exit Create Mode

After drawing a polygon the `L.FreeHandShapes.MODES.CREATE` mode will automatically be exited &ndash; but this can be suppressed by specifying `freeHandShapes.options.exitModeAfterCreate(false)` in which case the create mode will be persisted until the user explicitly exits it.

## Modes

FreeHandShapes by default uses the `L.FreeHandShapes.MODES.VIEW` mode which prevents the user from creating, editing, or deleting any polygons. 

In specifying the mode you are using [bitwise operators](http://en.wikipedia.org/wiki/Bitwise_operation) with the mapping being as follows:

```javascript
L.FreeHandShapes.MODES = {
    VIEW:        1,
    CREATE:      2,
    EDIT:        4,
    DELETE:      8,
    APPEND:      16,
    EDIT_APPEND: 4 | 16,
    ALL:         1 | 2 | 4 | 8 | 16
}
```

Therefore you're able to combine the bitwise operators to specify multiple modes. For example, if you would like to allow the user to create and delete, then you would specify the options as `L.FreeHandShapes.MODES.CREATE | L.FreeHandShapes.MODES.DELETE`. 

Using the `L.FreeHandShapes.MODES.ALL` property you could easily enable all the modes **except** edit with the following: `L.FreeHandShapes.MODES.ALL ^ L.FreeHandShapes.MODES.EDIT`.

It's quite likely that you'll want to change the mode as the user interacts with your application &ndash; for this you have the `setMode` method which accepts an aforementioned bitwise operator for determining what actions the user is able to perform.

```javascript
// Change the mode to allow the user to only edit and delete polygons.
var freeHandShapes = new L.FreeHandShapes();
freeHandShapes.setMode(L.FreeHandShapes.MODES.EDIT | L.FreeHandShapes.MODES.DELETE);
```

`L.FreeHandShapes` also ships with the `freeHandShapes.unsetMode` for unsetting a mode based on the current mode.

You may also listen to updates of the mode using the `freeHandShapes.on('mode')` event.

# Common Issues

## Invisible Drawing Path

When you're drawing a polygon on the map, the path that is being drawn is invisible &ndash; this is caused by a handful of missing styles that you need to apply to the `svg.tracer` node:

```css
svg.tracer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
```