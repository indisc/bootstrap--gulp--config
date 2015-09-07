var gulp = require('gulp');
var less = require('gulp-less');
var browserSync = require('browser-sync').create();
var connect = require('gulp-connect');
var minifyCss = require('gulp-minify-css');
var autoprefixer = require('gulp-autoprefixer');
var imageop = require('gulp-image-optimization');
var sourcemaps = require('gulp-sourcemaps');




//browserSync
gulp.task('webserver', ['less'], function(){
	browserSync.init({
		server: '../code/'
	});
	gulp.watch('*.html').on('change', browserSync.reload);
	gulp.watch('bootstrap/build--less/*.less', ['less']);
});

//gulp less

//gulp less
gulp.task('less', function(){
	return gulp.src('bootstrap/build--less/main.less')
		.pipe(less())
		.pipe(autoprefixer('last 10 versions', 'ie 9'))
		.pipe(gulp.dest('bootstrap/public/css/'))
		.pipe(browserSync.stream());
});

gulp.task('sourcemap', function(){
	return gulp.src('bootstrap/build--less/main.less')
		.pipe(sourcemaps.init())
		.pipe(less())
		.pipe(sourcemaps.write('./maps'))
		.pipe(gulp.dest('bootstrap/public/css/'))
});


gulp.task('prefix', function(){
	gulp.src("bootstrap/build--less/main.less")
		.pipe(autoprefixer({
			browsers: ['last 2 versions', 'firefox ESR', 'opera 12.1', '> 1%'],
			cascade: false
		}))
		.pipe(gulp.dest('build'))
});


//css minify
gulp.task('minify-css', function(){
	return gulp.src('bootstrap/public/css/*.css')
		.pipe(minifyCss({compatibility: 'ie8'}))
		.pipe(gulp.dest('bootstrap/public/cssmin'));
});

gulp.task('images', function(cb) {
    gulp.src('bootstrap/public/img/**/*.+(png|jpg|gif|jpeg)').pipe(imageop({
        optimizationLevel: 5,
        progressive: true,
        interlaced: true
    })).pipe(gulp.dest('bootstrap/public/img--min/')).on('end', cb).on('error', cb);
});



gulp.task('watch', function(){
	gulp.watch('bootstrap/build--less/*.less', ['less']);
	gulp.watch(['*.html'], ['html']);
	gulp.watch('bootstrap/public/cssmin/*.css', ['minify-css']);
	gulp.watch('bootstrap/public/css/main.css', ['prefix']);
});

gulp.task('default', ['less','prefix' ,'webserver', 'watch', 'minify-css', 'images', 'sourcemap']);
