const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const header = require('gulp-header');

const banner = [
  '// jslab -- Building blocks for online experiments',
  '// (c) 2015- Felix Henninger',
  '\n'
  ].join('\n');

gulp.task('transpile', function() {
  return gulp.src(['src/base.js', 'src/core.js', 'src/data.js'])
  	.pipe(sourcemaps.init())
    .pipe(concat('jslab.js'))
    .pipe(babel({
      comments: false,
      sourceMaps: true,
      moduleIds: true,
      moduleId: 'jslab'
    }))
    .pipe(header(banner))
  	.pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', function() {
  gulp.watch('src/*.js', ['transpile']);
});

gulp.task('default', ['transpile', 'watch']);
