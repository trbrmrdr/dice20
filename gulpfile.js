var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var browserSync = require('browser-sync').create();
const javascriptObfuscator = require('gulp-javascript-obfuscator');

//###################################################################################################################
var browserify = require("browserify");
var source = require('vinyl-source-stream');
var watchify = require("watchify");
var tsify = require("tsify");
var gutil = require("gulp-util");
var paths = {
    pages: ['public/index.html']
};


var watchedBrowserify = watchify(browserify({
    basedir: '.',
    debug: true,
    entries: ['public/lib/client.ts'],
    cache: {},
    packageCache: {}
}).plugin(tsify));

gulp.task("copy-html", function () {
    return gulp.src(paths.pages)
        .pipe(gulp.dest("./public/dist/"));
});

function bundle() {
    return watchedBrowserify
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./public/dist/'));
}

gulp.task('default', gulp.series("copy-html",function(done){
    bundle();
    done();
}));
watchedBrowserify.on("update", bundle);
watchedBrowserify.on("log", gutil.log);
/*
//###################################################################################################################


var ts = require("gulp-typescript");
// var sourcemaps = require('gulp-sourcemaps');

gulp.task('scripts', function () {
    console.log(' task -> scripts')

    var tsProject = ts.createProject("tsconfig.json");

    return tsProject.src()
        .pipe(ts(tsProject)).js
        .pipe(concat('main2.js'))
        .pipe(gulp.dest('./public/dist/'));

    var reporter = ts.reporter.fullReporter();
    var tsResult = tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject(reporter));

    return tsResult.js
        .pipe(sourcemaps.write())
        .pipe(concat('main2.js'))
        .pipe(gulp.dest('./public/dist/'));

    return gulp.src([
        //   './lib/*.js'// путь к папке со скриптами
        // "./public/lib/v6.0.0-rc.2/pixi.js",
        "./public/lib/main2.js",
        // "./public/lib/pixi-spine/dist/pixi-spine.umd.js",
    ])

        .pipe(concat('main2.js'))
        .pipe(gulp.dest('./public/dist/'))
});

gulp.task('js_watch', gulp.series('scripts', function (done) {
    console.log(' task -> js_watch')
    browserSync.reload();
    done()


}));

gulp.task('server', gulp.series('scripts', function (done) {

    console.log(' task -> server')

    browserSync.init({
        server: {
            baseDir: "./public/",
            index: "index.html"
        },
    });



    gulp.watch([
        "tsconfig.json",
        "./public/lib/*.ts"
    ]).on('change', gulp.series('js_watch'));
    gulp.watch("./public/lib/*.js").on('change', gulp.series('js_watch'));
    gulp.watch("*.js").on('change', browserSync.reload);

    gulp.watch("./public/*.html").on('change', browserSync.reload);
    gulp.watch("./public/data/*.*").on('change', browserSync.reload);
}));

gulp.task('default', gulp.series('server'));


//###################################################################################################################
//###################################################################################################################


gulp.task('release_src', function () {
    return gulp.src([
        "./public/lib/main2.js",
    ])

        .pipe(javascriptObfuscator())
        .pipe(uglify())

        .pipe(concat('main2.js'))
        .pipe(gulp.dest('./public/dist/'))

});


const shell = require('gulp-shell');
const { getSystemErrorMap } = require('util');
const { exit } = require('process');
gulp.task('release', gulp.series('release_src', function (done) {
    shell.task([
        'firebase deploy'
    ])()
    done()
})
)
*/