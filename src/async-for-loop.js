function asyncForLoop (arr, process_fn, cb_fn) {
    // Copyright 2009 Nicholas C. Zakas. All rights reserved.
    // MIT Licensed
    // http://www.nczonline.net/blog/2009/08/11/timed-array-processing-in-javascript/
    
    var i = 0,
        len = arr.length,
        loop_finished = cb_fn || function () {};

    if (!len) {
        loop_finished();
        return;
    }

    window.setTimeout(function () {

        var start = +new Date();
        do {
            process_fn.call(this, arr[i], i);
        } while (++i < len && (+new Date() - start < 50));

        if (i < len) {
            // call next item
            window.setTimeout(arguments.callee, 25);
        } else {
            loop_finished();
        }
    }, 25);
}

// define for Node module pattern loaders, including Browserify
if (typeof module === 'object' && 
    typeof module.exports === 'object') {
    module.exports = asyncForLoop;
}