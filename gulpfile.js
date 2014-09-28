var gulp         = require('gulp');
var browserSync  = require('browser-sync');
var sass         = require('gulp-sass');
var intermediate = require('gulp-intermediate');
var prefix       = require('gulp-autoprefixer');
var cp           = require('child_process');
var path         = require('path');

var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll:build', function () {
    return gulp.src([
            "app/**/*.{html,md,yml}",
            "Gemfile",
            ".ruby-version"
        ])

        .pipe( intermediate({
            output: "dist",
            container: "spawn-jekyll"
        }, function(tempDir, done) {
            browserSync.notify(messages.jekyllBuild);

            var configFile = path.join(__dirname, '_config.yml');

            var jekyll = cp.spawn(
                'bundle', 
                ['exec', 'jekyll', 'build', '-d', 'dist'], 
                {
                    cwd: tempDir,
                    stdio: 'inherit'
                }
            );

            jekyll.on('close', done);
        }) )

        .pipe( gulp.dest("dist") );
});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll:rebuild', ['jekyll:build'], function () {
    browserSync.reload();
});

/**
 * Compile files from app/_scss into both dist/css (for live injecting) and site (for future jekyll builds)
 */
gulp.task('sass', function () {
    return gulp.src('app/_scss/main.scss')
        .pipe(sass({
            includePaths: ['scss'],
            onError: browserSync.notify
        }))
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('build', ['sass', 'jekyll:build']);

/**
 * Wait for jekyll:build, then launch the Server
 */
gulp.task('browser-sync', ['build'], function() {
    browserSync({
        server: {
            baseDir: 'dist'
        }
    });
});

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch('app/_scss/*.scss', ['sass']);
    gulp.watch(['app/**/*.html'], ['jekyll:rebuild']);
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch']);
