var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var browserSync = require('browser-sync').create();
const javascriptObfuscator = require('gulp-javascript-obfuscator');


gulp.task('scripts', function () {
    console.log(' task -> scripts')

    return gulp.src([
        //   './lib/*.js'
        "./src/main2.js",
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