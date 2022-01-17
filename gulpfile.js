const { src, dest, watch, series, parallel } = require('gulp');
const pug = require('gulp-pug');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const postcss = require('gulp-postcss');
const postcssNormalize = require('postcss-normalize');
const babel = require('gulp-babel');
const preset = require('@babel/preset-env');
const browsersync = require('browser-sync').create();

const dir = {
    src : './src',
    build : './build'
}

const IsProduction = getArg("--env") === "production";

const options = {
    pug: {
        pretty: false,
        
    },
    sass : {
        /*
            # Type: String
            # Default: nested
            # Values: nested, expanded, compact, compressed
        */
        outputStyle: IsProduction ? 'nested' : 'compressed'
        /* 
        sourceComments: True
            # Type: Boolean
            # Default: false */
    },
    autoprefixer : {
        /* soporte de versiones. */
        browsers: ['last 3 versions'],
        /* cascade: true */
    },
    babel : {
        presets: ['env'],
        /* default.
        comments: true
        */
        compact: IsProduction ? true : false
    },
    browsersync: {
        server: {
            baseDir: dir.build
        }
        /*
            Type: Number
            Default: 3000
            port: 3000 
        */
    },
    postcss: [
        postcssNormalize({ browsers: 'defaults' })
    ]
}

function pugToHTML(cb) {
    src(`${dir.src}/pug/*.pug`)
        .pipe(pug(options.pug))
        .pipe(dest(`${dir.build}/`))
    cb();
}

function scssToCSS(cb) {
    src(`${dir.src}/scss/*.scss`)
        .pipe(sass(options.sass).on('error', sass.logError))
        // .pipe(autoprefixer(options.autoprefixer))
        .pipe(postcss(options.postcss))
        .pipe(dest(`${dir.build}/css/`))
        .pipe(browsersync.stream())
    cb();
}

function ecmaScriptToJS(cb) {
    src(`${dir.src}/javascript/*.js`)
        .pipe(babel(options.babel))
        .pipe(dest(`${dir.build}/js/`))
    cb();
}

function watchFiles(cb) {
    watch(`${dir.src}/pug/**/*.pug`, pugToHTML).on('change', reload)
    watch(`${dir.src}/scss/**/*.scss`, scssToCSS).on('change', change)
    watch(`${dir.src}/javascript/**/*.js`, ecmaScriptToJS).on('change', reload)
    cb();
}

function serve(cb) {
    browsersync.init(options.browsersync)
    cb();
}

// funcion encargada de recargar el navegador.
function reload(){
    return browsersync.reload();
}

// funcion encargada de decirnos donde se realizo el cambio.
function change(e){
    console.log('File ' + e.path + ' was ' + e.type + ', running tasks...');
}

// Funcion encargada de obtener el valor la linea de comandos si para saber si tiene que compilar en modo producción
function getArg(key) {
    var index = process.argv.indexOf(key);
    var next = process.argv[index + 1];
    return (index < 0) ? null : (!next || next[0] === "-") ? true : next;
}

exports.pugToHTML = pugToHTML
exports.scssToCSS = scssToCSS
exports.ecmaScriptToJS = ecmaScriptToJS
exports.default = series(pugToHTML, scssToCSS, ecmaScriptToJS, parallel(watchFiles, serve))
exports.build = series(pugToHTML, scssToCSS, ecmaScriptToJS)
exports.serve = series(pugToHTML, scssToCSS, ecmaScriptToJS, serve)