'use strict';

var dirs = require('./package.json').config;

var gulp = require('gulp');
var sass = require('gulp-sass'); //препроцессор sass
var plumber = require('gulp-plumber'); //плагин чтоб не слетело во время ошибок
var postcss = require('gulp-postcss'); // плагин для автопрефикса, минифик
var autoprefixer = require('autoprefixer'); // автопрефикс для браузеров
var server = require('browser-sync').create(); //автоперазгрузки браузера
var mqpacker = require('css-mqpacker'); //обьединение медиавыражения, объединяем «одинаковые селекторы» в одно правило
var minify = require('gulp-csso'); //минификация css
var rename = require('gulp-rename'); // перемейноввывние имя css
var imagemin = require('gulp-imagemin'); // ужимаем изображение
var svgstore = require('gulp-svgstore'); // собиральщик cvg
var svgmin = require('gulp-svgmin'); // свг минификация
//var run = require('run-sequence'); //запуск плагинов очередью
var del = require('del'); //удаление ненужных файлов
//var concat = require('gulp-concat'); // Конкатинация
var uglify = require('gulp-uglify'); // минификация js
var pug = require('gulp-pug'); // pug
var atImport = require('postcss-import'); // Импорт стороним плагином чтоб избежать ошибки
var csscomb = require('gulp-csscomb'); // Красота Css
var prettyHtml = require('gulp-pretty-html'); // Красота HTML
var tinify = require('gulp-tinypng'); // Сжатие изображения
var rollup = require('gulp-better-rollup');
var babel = require('rollup-plugin-babel');
var resolve = require('rollup-plugin-node-resolve');
var commonjs = require('rollup-plugin-commonjs');

var prettyOption = {
  indent_size: 4,
  indent_char: ' ',
  unformatted: ['code', 'em', 'strong', 'span', 'i', 'b', 'br', 'script'],
  content_unformatted: [],
};

gulp.task('clean', function () {
  return del(dirs.build);
});

gulp.task('copy', function () {
  return gulp.src([
    dirs.source + '/fonts/**',
    dirs.source + '/img/**',
    dirs.source + '/video/**',
    dirs.source + '/libs/**',
    'robots.txt'
  ], {
    base: './src/'
  })
  .pipe(gulp.dest(dirs.build));
});

gulp.task('copy:fonts', function () {
  return gulp.src(dirs.source + '/fonts/**')
    .pipe(gulp.dest(dirs.build + '/fonts'));
});

gulp.task('copy:img', function () {
  return gulp.src(dirs.source + '/img/**')
    .pipe(gulp.dest(dirs.build + '/img'));
});

gulp.task('copy:video', function () {
  return gulp.src(dirs.source + '/video/**')
    .pipe(gulp.dest(dirs.build + '/video'));
});

gulp.task('copy:libs', function () {
  return gulp.src([
    'node_modules/jquery/**',
    'node_modules/popper.js/**',
    'node_modules/bootstrap/**',
    'node_modules/owl.carousel/**',
    'node_modules/jquery-mask-plugin/**',
    'node_modules/@fancyapps/fancybox/**',
    'node_modules/normalize.css/**',
    ], {
      base: 'node_modules/'
    })
    .pipe(gulp.dest('src/libs'));
});

gulp.task('style', function (done) {
  gulp.src(dirs.source + '/sass/style.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer({
        browsers: [
          'last 1 versions'
        ]
      }),
      mqpacker({
        sort: true
      }),
      atImport()
    ]))
    .pipe(csscomb())
    .pipe(gulp.dest(dirs.build + '/css'))
    .pipe(minify())
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest(dirs.build + '/css'))
    .pipe(server.stream());

    done();
});

gulp.task('pug', function () {
  return gulp.src(dirs.source + '/*.pug')
    .pipe(plumber())
    .pipe(pug({
      pretty: true,
      cache: true
    }))
    .pipe(prettyHtml(prettyOption))
    .pipe(gulp.dest(dirs.build))
    .pipe(server.stream());
});


gulp.task('js', function () {
  return gulp.src(dirs.source + '/js/*.js')
    .pipe(rollup({ plugins: [babel(), resolve(), commonjs()] }, 'umd'))
    .pipe(plumber())
    .pipe(gulp.dest(dirs.build + '/js'))
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(dirs.build + '/js'));
});

gulp.task('images', function () {
  return gulp.src(dirs.source + '/img/**/*.{png,jpg,gif}')
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true})
    ]))
    .pipe(gulp.dest(dirs.build + '/img'));
});

gulp.task('symbols', function () {
  return gulp.src(dirs.source + '/img/sprite/*.svg')
    .pipe(plumber())
    .pipe(svgmin())
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('symbols.svg'))
    .pipe(gulp.dest(dirs.build + '/img'));
});

gulp.task('build', gulp.series('clean', 'copy:libs', 'copy', 'js', 'style', 'images', 'symbols', 'pug'));

gulp.task('serve', function () {
  server.init({
    server: dirs.build,
    startPath: 'index.html'
  });
  gulp.watch(['src/blocks/**/**/*.scss', 'src/sass/**/*.scss'], gulp.series('watch:style'));
  gulp.watch(dirs.source + '/blocks/**/**/*.pug', gulp.series('watch:pug'));
  gulp.watch(dirs.source + '/*.pug', gulp.series('watch:pug'));
  gulp.watch(dirs.source + '/pug/*.pug', gulp.series('watch:pug'));

  gulp.watch([dirs.source + '/js/*.js'], gulp.series('watch:js'));
  gulp.watch(['src/img/**'], gulp.series('watch:img'));
  gulp.watch(['src/fonts/**'], gulp.series('watch:fonts'));
  gulp.watch(['src/video/**'], gulp.series('watch:video'));
  gulp.watch(['src/img/**'], gulp.series('watch:symbols'));
});

gulp.task('watch:pug', gulp.series('pug'), reload);
gulp.task('watch:js', gulp.series('js'), reload);
gulp.task('watch:img', gulp.series('copy:img'), reload);
gulp.task('watch:fonts', gulp.series('copy:fonts'), reload);
gulp.task('watch:video', gulp.series('copy:video'), reload);
gulp.task('watch:libs', gulp.series('copy:libs'), reload);
gulp.task('watch:symbols', gulp.series('symbols'), reload);
gulp.task('watch:style', gulp.series('style'), reload);

function reload(done) {
  server.reload();
  done();
}

gulp.task('tinify', function () {
  return gulp.src('src/img/**/*.{png,jpg}')
    .pipe(tinify('q2jg3LuY5Bktm617swAOD7nk3X3Mc8OH'))
    .pipe(gulp.dest('src/tiny-img'));
});
