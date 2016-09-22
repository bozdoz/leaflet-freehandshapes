ConcaveHull
===================

![Travis](http://img.shields.io/travis/Wildhoney/ConcaveHull.svg?style=flat)
&nbsp;
![npm](http://img.shields.io/npm/v/concavehull.svg?style=flat)
&nbsp;
![License MIT](http://img.shields.io/badge/License-MIT-lightgrey.svg?style=flat)

* **Heroku**: [http://freedraw.herokuapp.com/](http://freedraw.herokuapp.com/) &mdash; uses `ConcaveHull` by default;
* **npm:** `npm install concavehull`
* **Bower:** `bower install concavehull`

---

Based on the [StackOverflow question](http://stackoverflow.com/questions/16407533/translating-concave-hull-algorithm-to-c-sharp) about the CSharp implementation of a [paper written by Adriano Moreira and Maribel Yasmina Santos](http://repositorium.sdum.uminho.pt/bitstream/1822/6429/1/ConcaveHull_ACM_MYS.pdf) from the  University of Minho.

Initially a prototype was [created by nredko](http://nredko.github.io/ConcaveHull) &ndash; and this implementation is a refactor to transform it into a fully working module.

## Getting Started

Using `ConcaveHull` is terribly simple &ndash; all you have to do is pass an array of objects that conform to the `{ x: {Number}, y: {Number} }` format &ndash; in the case of [Leaflet.js](http://leafletjs.com/) this is just an array of `L.LatLng` objects.

Once you have your array of latitudinal and longitudinal values, you can instantiate the object, and then invoke the `getLatLngs` method:

```javascript
var latLngs = new ConcaveHull(latLngs).getLatLngs();
```

You can manually specify the maximum length of edges in metres by passing it into the constructor as the second argument:

```javascript
var edgeLength = 35,
    latLngs    = new ConcaveHull(latLngs, edgeLength).getLatLngs();
```