var gulp = require('gulp'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    uglify = require('gulp-uglify'),
    browserSync = require('browser-sync').create();

gulp.task('default', ['watch']);

gulp.task('build-dev', function() {
	return browserifyTemplate('./src/index.js', 'leaflet-freehandshapes.js')
		.pipe(gulp.dest('./dist/'))
		.pipe(browserSync.reload({stream: true}));
});

gulp.task('build', ['build-dev'], function() {
    return browserifyTemplate('./src/index.js', 'leaflet-freehandshapes.min.js')
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest('./dist/'));
});

gulp.task('browserify-example', ['build-dev'], function() {
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
    gulp.watch(['./src/*.js','./example/js/*.js'], ['browserify-example']);
});

function browserifyTemplate (file, output) {
    return browserify( file )
        .bundle()
        .on('error', errorHandler)
        .pipe(source( output ));
}

function errorHandler (err) {
    console.log( err );
    browserSync.notify( err.message );
    this.emit('end');
}