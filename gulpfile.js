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
  clean: "Clean",

  buildClient: "Build client",
  copy_client_non_TS: "Copy client non static TS files",
  copy_client_build_to_server: "Copy client build to server",

  copyServerNonTS: "Copy server non TS files",

  buildServer: "Build server",
  startServer: "Start server",

  watch_client_build: "watch client build",
  watch_client_TS: "watch TS client",
  watch_server_static: "watch static server",
  watch_server_TS: "watch TS server",

  installClientProductionModules: "Install client production modules",
  installServerProductionModules: "Install server production modules",
  buildRelease: "Build_release"
};

const removeLastEntryFromPath = path =>
  path.substring(0, path.lastIndexOf("/"));

gulp.task(gulpTasks.clean, async function() {
  del.sync("./build");
  del.sync("./public/build");
});

gulp.task(gulpTasks.copyServerNonTS, function() {
  return gulp
    .src(nonTSPathsToCopy_server, { base: "." })
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
  exec(`cd ${path.resolve("./")} && tsc -w`);
});

gulp.task(gulpTasks.watch_server_static, async function() {
  return gulp
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
    });
});

gulp.task(gulpTasks.watch_client_TS, async function() {
  exec(`cd ${path.resolve("./public/")} && tsc -w`);
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

gulp.task(gulpTasks.buildServer, async function() {
  exec(`cd ${path.resolve("./")} && tsc`);
}),
  gulp.task(gulpTasks.buildClient, async function() {
    exec(`cd ${path.resolve("./public")} && tsc`);
  });

gulp.task(gulpTasks.installServerProductionModules, async function() {
  exec(`cd ${path.resolve("./build/")} && npm i --only production`);
});

gulp.task(gulpTasks.installClientProductionModules, async function() {
  exec(`cd ${path.resolve("./build/public/")} && npm i --only production`);
});

gulp.task(
  gulpTasks.buildRelease,
  gulp.series([
    gulpTasks.copyServerNonTS,
    gulpTasks.buildServer,
    gulpTasks.installServerProductionModules,
    gulpTasks.buildClient,
    gulpTasks.copy_client_non_TS,
    gulpTasks.copy_client_build_to_server,
    gulpTasks.installClientProductionModules
  ])
);

gulp.task(
  "default",
  gulp.series([
    gulpTasks.buildClient,
    gulpTasks.buildServer,
    gulpTasks.copyServerNonTS,
    gulpTasks.copy_client_non_TS,
    gulpTasks.copy_client_build_to_server,
    gulpTasks.startServer,
    gulpTasks.watch_client_build,
    gulpTasks.watch_client_TS,
    gulpTasks.watch_server_static,
    gulpTasks.watch_server_TS
  ])
);
