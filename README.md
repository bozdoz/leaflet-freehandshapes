Leaflet.FreeHandShapes
================

![MIT License](http://img.shields.io/badge/license-MIT-lightgrey.svg)
&nbsp;
![Leaflet](http://img.shields.io/badge/leaflet-1.0.2-green.svg)

Initially forked from and inspired by [L.FreeDraw](https://github.com/Wildhoney/Leaflet.FreeDraw)

## What Is This?

This is a Leaflet plugin for adding/manipulating polygons from a Leaflet map.  It is a freehand drawer that supports mobile, canvas, and multiple instances.  Each instance adds polygons to a Leaflet FeatureGroup, optionally merging with other polygons using [TurfJS](http://turfjs.org/).  Polygons can also be subtracted by other polygons using TurfJS.

[See the demo](https://bozdoz.github.io/Leaflet.FreeHandShapes/)

![Screenshot](http://i.imgur.com/5Zis4Q4.png)

## Usage

```javascript
// initialize
var drawer = new L.FreeHandShapes();

// enable drawing
drawer.setMode('add');

// stop drawing
drawer.setMode('view');

// enable substraction
drawer.setMode('subtract');

// enable click-to-delete
drawer.setMode('delete');
```

## Options

L.FreeHandShapes takes the following options:

* `polygon` (object) : Same options as [L.Polygon](http://leafletjs.com/reference-1.0.2.html#polygon)

**Default:**
```javascript
{
    className: 'leaflet-free-hand-shapes',
    smoothFactor: 1,
    fillOpacity : 0.5,
    noClip : true,
}
```
* `polyline` (object) : Same options as [L.Polyline](http://leafletjs.com/reference-1.0.2.html#polyline)

**Default:**
```javascript
{
    color:'#5cb85c',
    opacity:1,
    smoothFactor: 0,
    noClip : true,
    clickable : false,
    weight:2
}
```
* `simplify_tolerance` (float) : how much to simplify the polygon (argument given to [L.LineUtil.simplify](https://github.com/Leaflet/Leaflet/blob/master/src/geometry/LineUtil.js)). 

**Default:**
`0.005`
* `merge_polygons` (boolean)

**Default:**
`true

## Controls

There is no default control available for this plugin, because it is made to be more flexible, allowing for multiple instances and two drawing methods (addition/subtraction).  For an example on how to build your own, take a look at the example, where multiple instances are created for a sample land use development project and bound to some controls (built with [Bootstrap CSS](http://getbootstrap.com/)) : 

* [HTML](https://github.com/bozdoz/Leaflet.FreeHandShapes/blob/master/example/index.html)
* [JS](https://github.com/bozdoz/Leaflet.FreeHandShapes/blob/master/example/js/draw-controller.js) (See [Line 14](https://github.com/bozdoz/Leaflet.FreeHandShapes/blob/master/example/js/draw-controller.js#L14) for iteration/creation of instances, and [Line 246](https://github.com/bozdoz/Leaflet.FreeHandShapes/blob/master/example/js/draw-controller.js#L246) for handlers bound to the control buttons)

## Pull Requests

Please limit each PR to one clear improvement each (PR's offering several improvements are harder to read).  Any number of bug fixes are welcome!

## Goals

* A built-in control (L.Control) for UI (probably for each instance)