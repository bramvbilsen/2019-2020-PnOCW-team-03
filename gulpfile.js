const WAITING_TIME_MS = 25000;

const gulp = require("gulp");
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const tsify = require("tsify");
const babelify = require("babelify");
const ts = require("gulp-typescript");
const nodemon = require("gulp-nodemon");
const path = require("path");
const del = require("del");
const internalIp = require("internal-ip");

// ------ SERVER ------ //

const tsPaths_server = ["./**/*.ts", "!./public/**/*.ts"];
const nonTsPaths_server = [
	"./**/*.*",
	"!gulpfile*",
	"!./admin/**/*",
	"!./build/**/*",
	"!./public/**/*",
	"!tsconfig*",
	"!./**/*.ts",
	"!package-lock.json"
];

gulp.task("Compile server", function(done) {
	const tsProject = ts.createProject("./tsconfig.json");
	tsProject
		.src()
		.pipe(tsProject())
		.pipe(gulp.dest(path.resolve("./build")));
	done();
});

gulp.task("Watch server TS", function() {
	return gulp.watch(tsPaths_server, gulp.series("Compile server"));
});

gulp.task("Copy server non-TS", function(done) {
	gulp.src(nonTsPaths_server, { base: "." }).pipe(
		gulp.dest(path.resolve("./build"))
	);
	done();
});

gulp.task("Watch server non-TS", function() {
	return gulp.watch(nonTsPaths_server, gulp.series("Copy server non-TS"));
});

gulp.task(
	"Watch server",
	gulp.parallel(
		gulp.series("Compile server", "Watch server TS"),
		gulp.series("Copy server non-TS", "Watch server non-TS")
	)
);

// ------ CLIENT ------ //

const tsPaths_client = ["./public/**/*.ts"];
const nonTsPaths_client = [
	"./public/**/*.*",
	"!./public/build/**/*.*",
	"!./public/tsconfig*",
	"!./**/*.ts",
	"!./public/package-lock.json"
];

gulp.task("Compile client", function() {
	// const tsProject = ts.createProject("./public/tsconfig.json");
	// tsProject
	// 	.src()
	// 	.pipe(tsProject())
	// 	.pipe(gulp.dest(path.resolve("./build/public")));
	// done();

	return browserify({
		basedir: path.resolve("./public/"),
		debug: true,
		entries: ["index.ts"],
		// transform: ["babelify"],
		cache: {},
		packageCache: {}
	})
		.plugin(tsify, require("./public/tsconfig.json").compilerOptions)
		.transform(babelify.configure({ extensions: [".ts", ".js"] }))
		.bundle()
		.pipe(source("bundle.js"))
		.pipe(gulp.dest(path.resolve("./build/public")));
});

gulp.task("Watch client TS", function() {
	return gulp.watch(tsPaths_client, gulp.series("Compile client"));
});

gulp.task("Copy client non-TS", function(done) {
	gulp.src(nonTsPaths_client, { base: "./public" }).pipe(
		gulp.dest(path.resolve("./build/public"))
	);
	done();
});

gulp.task("Watch client non-TS", function() {
	return gulp.watch(nonTsPaths_client, gulp.series("Copy client non-TS"));
});

gulp.task(
	"Watch client",
	gulp.parallel(
		gulp.series("Compile client", "Watch client TS"),
		gulp.series("Copy client non-TS", "Watch client non-TS")
	)
);

// ------ SHARED ------ //

gulp.task("Clean", function(done) {
	del.sync(["./build", "./public/build"]);
	done();
});

gulp.task(
	"build:production",
	gulp.series(
		"Compile server",
		"Copy server non-TS",
		"Compile client",
		"Copy client non-TS"
	)
);

gulp.task("Open localhost", function(done) {
	setTimeout(() => {
		nodemon({
			script: "./build/index.js",
			ext: "js",
			done: done
		});
		console.log(
			"Server running on network: " + internalIp.v4.sync() + ":3000"
		);
	}, WAITING_TIME_MS);
});

// ------ DEFAULT ------ //
/*gulp.task("default", gulp.parallel(
    "Watch client",
    "Watch server",
    "Open localhost"
));*/

gulp.task(
	"default",
	gulp.series(
		"Clean",
		gulp.parallel("Watch client", "Watch server", "Open localhost")
	)
);
