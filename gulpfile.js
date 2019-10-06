const gulp = require("gulp");
const nodemon = require("gulp-nodemon");
const ts = require("gulp-typescript");

const nonTSPathsToCopy = [
  "./**/*.*",
  "!./**/*.ts",
  "!./admin/**/*.*",
  "!./build/**/*.*",
  "!./public/**/*.*",
  "!./node_modules/**/*.*",
  "!./gulpfile.js",
  "!./package.json",
  "!./package-lock.json",
  "!./tsconfig.json",
  "!./README.md"
];

const tsProject = ts.createProject("tsconfig.json");

const gulpTasks = {
  compile: "Compile server TS",
  copyNonTS: "Copy server non TS files",
  recompile: "Recompile server TS",
  startServer: "Start server",
  watch: "watch server"
};

gulp.task(gulpTasks.compile, function() {
  let tsResult = tsProject.src().pipe(tsProject());
  return tsResult.js.pipe(gulp.dest("./build"));
});

gulp.task(gulpTasks.copyNonTS, function() {
  return gulp.src(nonTSPathsToCopy).pipe(gulp.dest("./build"));
});

gulp.task(gulpTasks.startServer, function(done) {
  nodemon({
    script: "./build/index.js",
    done: done
  });
});

gulp.task(gulpTasks.watch, function() {
  gulp.watch("./**/*.ts", gulp.task(gulpTasks.compile));
  gulp.watch(nonTSPathsToCopy, gulp.task(gulpTasks.copyNonTS));
});

gulp.task(
  "default",
  gulp.series([
    gulpTasks.compile,
    gulpTasks.copyNonTS,
    gulpTasks.startServer,
    gulpTasks.watch
  ])
);
