var gulp = require('gulp'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    uglify = require('gulp-uglify'),
    browserSync = require('browser-sync').create(),
    derequire = require('gulp-derequire');

gulp.task('default', ['watch']);

gulp.task('build-dev', function() {
	return browserifyTemplate('./src/index.js', 'leaflet-freehandshapes.js', {
            standalone : 'L.freeHandShapes'
        })
        .pipe(derequire())
        .pipe(buffer())
        .pipe(uglify({
            mangle: false,
            compress : false,
            output : {
                beautify : true
            },
            preserveComments: 'license'
        }))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('build', ['build-dev'], function() {
    return browserifyTemplate('./src/index.js', 'leaflet-freehandshapes.min.js', {
            standalone : 'L.freeHandShapes'
        })
        .pipe(derequire())
        .pipe(buffer())
        .pipe(uglify({
            preserveComments: 'license'
        }))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('browserify-web-worker', function() {
    return browserifyTemplate('./example/js/turf-web-worker.js', 'turf-web-worker.min.js')
        .pipe(gulp.dest('./example/js/'));
});

gulp.task('browserify-example', ['build-dev', 'browserify-web-worker'], function() {
    return browserifyTemplate('./example/js/script.js', 'main.js')
        .pipe(gulp.dest('./example/js/'))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('bs', ['browserify-example'], function() {
    return browserSync.init({
        server: {
            baseDir: "./",
            directory : true
        },
        startPath : "/example/index.html",
        ui : false,
		files : ['./**/*.html','./**/*.css']
    });
});

gulp.task('watch', ['bs'], function() {
    gulp.watch(['./src/*.js','./example/js/*.js', '!./example/js/main.js'], ['browserify-example']);
});

function browserifyTemplate (file, output, options) {
    var options = options || {};

    return browserify( file, options )
        .bundle()
        .on('error', errorHandler)
        .pipe(source( output ));
}

function errorHandler (err) {
    console.log( err );
    browserSync.notify( err.message );
    this.emit('end');
}