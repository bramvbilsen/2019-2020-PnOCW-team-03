const gulp = require("gulp");
const ts = require("gulp-typescript");
const exec = require("child_process").exec;
const path = require("path");

const tsProject = ts.createProject("tsconfig.json");

const nonTSPathsToCopy = [
  "./**/*.*",
  "!./**/*.ts",
  "!./build/**/*.*",
  "!./node_modules/**/*.*",
  "!./gulpfile.js",
  "!./package-lock.json",
  "!./tsconfig.json"
];
const tsPathToCompile = "./**/*.ts";

const gulpTasks = {
  buildRelease: "build_client_release",
  installProductionModules: "Install client production modules",
  compile: "Compile client TS",
  copyNonTS: "Copy client non TS files",
  copyToServer: "Copy client to server",
  compileAndCopyToServer: "Compile client TS & Copy to server",
  copyNonTSAndCopyToServer: "Copy client non TS files & Copy to server",
  watch: "watch client"
};

gulp.task(gulpTasks.compile, function() {
  let tsResult = tsProject.src().pipe(tsProject());
  return tsResult.js.pipe(gulp.dest("./build"));
});

gulp.task(gulpTasks.copyNonTS, function() {
  return gulp.src(nonTSPathsToCopy).pipe(gulp.dest("./build"));
});

gulp.task(gulpTasks.copyToServer, function() {
  return gulp.src("./build/**/*").pipe(gulp.dest("../build/public"));
});

gulp.task(
  gulpTasks.compileAndCopyToServer,
  gulp.series([gulpTasks.compile, gulpTasks.copyToServer])
);
gulp.task(
  gulpTasks.copyNonTSAndCopyToServer,
  gulp.series([gulpTasks.copyNonTS, gulpTasks.copyToServer])
);

gulp.task(gulpTasks.watch, function() {
  gulp.watch(tsPathToCompile, gulp.task(gulpTasks.compileAndCopyToServer));
  gulp.watch(nonTSPathsToCopy, gulp.task(gulpTasks.copyNonTSAndCopyToServer));
});

gulp.task(gulpTasks.installProductionModules, async function() {
  exec(
    `cd ${path.resolve("../build/public")} && ls && npm i --only production`,
    function(stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
    }
  );
});

gulp.task(
  gulpTasks.buildRelease,
  gulp.series([
    gulpTasks.compileAndCopyToServer,
    gulpTasks.copyNonTSAndCopyToServer,
    gulpTasks.installProductionModules
  ])
);

gulp.task(
  "default",
  gulp.series([
    gulpTasks.compile,
    gulpTasks.copyNonTS,
    gulpTasks.copyToServer,
    gulpTasks.watch
  ])
);
