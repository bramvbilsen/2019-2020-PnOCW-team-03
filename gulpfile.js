const gulp = require("gulp");
const nodemon = require("gulp-nodemon");
const exec = require("child_process").exec;
const path = require("path");
const del = require("del");
const fs = require("fs");

const nonTSPathsToCopy_server = [
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

const nonTSPathsToCopy_client = [
  "./public/**/*.*",
  "!./**/*.ts",
  "!./public/build/**/*.*",
  "!./public/node_modules/**/*.*",
  "!./public/gulpfile.js",
  "!./public/package-lock.json",
  "!./public/tsconfig.json"
];

const gulpTasks = {
  buildClientRelease: "build_client_release",
  installClientProductionModules: "Install client production modules",
  watch_client_build: "watch client build",
  watch_client_TS: "watch TS client",

  copy_client_non_TS: "Copy client non static TS files",
  copy_client_build_to_server: "Copy client build to server",
  buildServerRelease: "build_server_release",
  installServerProductionModules: "Install server production modules",
  compileServer: "Compile server TS",
  copyServerNonTS: "Copy server non TS files",
  copyCompiledClientToServer: "Copy compiled client to server",
  recompileServer: "Recompile server TS",
  startServer: "Start server",
  watch_server_static: "watch static server",
  watch_server_TS: "watch TS server"
};

const firstEntryFromPath = path => path.substring(0, path.indexOf("/") + 1);
const removeLastEntryFromPath = path =>
  path.substring(0, path.lastIndexOf("/"));
const fileInRoot = path => path.split("/");
const publicRootPathToPublicBuildPath = path => {
  if (fileInRoot(path)) {
  }
  return "public/" + "build" + path.substring(path.indexOf("/"));
};

gulp.task(gulpTasks.copyServerNonTS, function() {
  return gulp
    .src(nonTSPathsToCopy_client, { base: "." })
    .pipe(gulp.dest("./build"));
});

gulp.task(gulpTasks.copyCompiledClientToServer, function() {
  console.log("CLIENT COMPILED CHANGED");
  return gulp
    .src("./public/build/**/*.*", { base: "." })
    .pipe(gulp.dest("./build"));
});

gulp.task(gulpTasks.startServer, async function(done) {
  nodemon({
    script: "./build/index.js",
    ext: "js",
    done: done
  });
});

gulp.task(gulpTasks.watch_server_TS, async function() {
  exec(`cd ${path.resolve("./build/")} && tsc -w`);
});

gulp.task(gulpTasks.watch_server_static, async function() {
  return (
    gulp
      // .watch(nonTSPathsToCopy_server, gulp.task(gulpTasks.copyServerNonTS))
      .watch(nonTSPathsToCopy_server)
      .on("add", path => {
        console.log("Added in server: " + path);
        gulp
          .src(path)
          .pipe(gulp.dest("./build/" + removeLastEntryFromPath(path)));
      })
      .on("change", path => {
        console.log("Changed in server: " + path);
        gulp
          .src(path)
          .pipe(gulp.dest("./build/" + removeLastEntryFromPath(path)));
      })
      .on("unlink", path => {
        console.log("Removing from server: " + path);
        del("./build/" + path);
      })
  );
});

gulp.task(gulpTasks.watch_client_TS, async function() {
  exec(`cd ${path.resolve("./build/")} && tsc -w`);
});

gulp.task(gulpTasks.copy_client_non_TS, function() {
  if (!fs.existsSync("public")) {
    fs.mkdirSync("public");
  }
  return gulp
    .src(nonTSPathsToCopy_client, { allowEmpty: true })
    .pipe(gulp.dest("public/build"));
});

gulp.task(gulpTasks.copy_client_build_to_server, function() {
  if (!fs.existsSync("public/build")) {
    fs.mkdirSync("public/build");
  }
  console.log("Copying to server!");
  return gulp
    .src("public/build/**/*.*", {
      base: "./public/build/.",
      allowEmpty: true
    })
    .pipe(gulp.dest("build/public"));
});

gulp.task(gulpTasks.watch_client_build, async function() {
  return gulp.watch(
    nonTSPathsToCopy_client,
    gulp.series([
      gulpTasks.copy_client_non_TS,
      gulpTasks.copy_client_build_to_server
    ])
  );
});

gulp.task(gulpTasks.installServerProductionModules, async function() {
  exec(`cd ${path.resolve("./build/")} && npm i --only production`);
});

gulp.task(
  gulpTasks.buildServerRelease,
  gulp.series([
    gulpTasks.copyServerNonTS,
    gulpTasks.installServerProductionModules
  ])
);

gulp.task(
  "default",
  gulp.series([
    gulpTasks.copyServerNonTS,
    gulpTasks.copy_client_non_TS,
    gulpTasks.startServer,
    gulpTasks.watch_client_build,
    gulpTasks.watch_client_TS,
    gulpTasks.watch_server_static,
    gulpTasks.watch_server_TS
  ])
);
