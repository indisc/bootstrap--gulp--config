var gulp = require('gulp');
var less = require('gulp-less');
var livereload = require('gulp-livereload');
var connect = require('gulp-connect');
var minifyCss = require('gulp-minify-css');
var autoprefixer = require('gulp-autoprefixer');
var imageop = require('gulp-image-optimization');
var sourcemaps = require('gulp-sourcemaps');
var gutil    = require('gulp-util');
var uglify  = require('gulp-uglify');
var concat  = require('gulp-concat');
var jshint = require('gulp-jshint');

//gulp webserver
gulp.task('webserver', function(){
	connect.server({
		root: '../code/',
		livereload: true
	});
});

//gulp less 

//gulp less
gulp.task('less', function(){
	return gulp.src('bootstrap/build--less/main.less')
		.pipe(less())
		.pipe(gulp.dest('bootstrap/public/css/'))
		.pipe(connect.reload());
});

gulp.task('sourcemap', function(){
	return gulp.src('bootstrap/build--less/main.less')
		.pipe(sourcemaps.init())
		.pipe(less())
		.pipe(sourcemaps.write('./maps'))
		.pipe(gulp.dest('bootstrap/public/css/'))
});


///autoprefixer

gulp.task('default', function(){
	return gulp.src('bootstrap/less/main.less')
  .pipe(less({
    plugins: [autoprefix]
  }))
  .pipe(gulp.dest('bootstrap/dist/css/'));
});


// gulp js
gulp.task('js', function () {
    gulp.src('bootstrap/js/*.js')
        .pipe(uglify())
        .pipe(concat('all.js'))
        .pipe(gulp.dest('bootstrap/public/js/compact.js'));
});

gulp.task('lint', function(){
	return gulp.src(['bootstrap/js/*.js'])
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});



//livereload
gulp.task('css', function(){
	gulp.src('bootstrap/public/css/*.css')
		.pipe(connect.reload());
});

gulp.task('html', function(){
	gulp.src('*.html')
		.pipe(connect.reload());
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
	gulp.watch(['bootstrap/public/css/*.css'], ['css']);
	gulp.watch('bootstrap/public/cssmin/*.css', ['minify-css']);
	gulp.watch('bootstrap/js/*.js', ['js']);
});

gulp.task('default', ['less','webserver', 'watch', 'minify-css', 'js', 'images', 'sourcemap']);