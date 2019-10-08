const gulp = require("gulp");
const nodemon = require("gulp-nodemon");
const ts = require("gulp-typescript");
const exec = require("child_process").exec;
const path = require("path");

const nonTSPathsToCopy = [
  "./**/*.*",
  "!./**/*.ts",
  "!./admin/**/*.*",
  "!./build/**/*.*",
  "!./public/**/*.*",
  "!./node_modules/**/*.*",
  "!./gulpfile.js",
  "!./package-lock.json",
  "!./tsconfig.json",
  "!./README.md"
];

const tsProject = ts.createProject("tsconfig.json");

const gulpTasks = {
  buildRelease: "build_server_release",
  installProductionModules: "Install server production modules",
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

gulp.task(gulpTasks.installProductionModules, async function() {
  exec(`cd ${path.resolve("./build/")} && npm i --only production`, function(
    stdout,
    stderr
  ) {
    console.log(stdout);
    console.log(stderr);
  });
});

gulp.task(
  gulpTasks.buildRelease,
  gulp.series([
    gulpTasks.compile,
    gulpTasks.copyNonTS,
    gulpTasks.installProductionModules
  ])
);

gulp.task(
  "default",
  gulp.series([
    gulpTasks.compile,
    gulpTasks.copyNonTS,
    gulpTasks.startServer,
    gulpTasks.watch
  ])
);
