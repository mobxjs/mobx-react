#!./node_modules/.bin/nscript
/* To run this script, nscript is needed: [sudo] npm install -g nscript
/* Publish.js, publish a new version of the npm package as found in the current directory */
module.exports = function(shell, npm, git) {
    var pkg = JSON.parse(shell.read('package.json'));

    // work around; rollup bails out when running npm run build from nscript...
    if (shell.prompt("Did you run 'npm run buid' first?", "Y") !== "Y")
        shell.exit(1, "Aborted.");

    // Bump version number
    var nrs = pkg.version.split(".");
    nrs[2] = 1 + parseInt(nrs[2], 10);
    var version = pkg.version = shell.prompt("Please specify the new package version of '" + pkg.name + "' (Ctrl^C to abort)", nrs.join("."));
    if (!version.match(/^\d+\.\d+\.\d+$/))
        shell.exit(1, "Invalid semantic version: " + version);

    // Check registery data
    if (npm.silent().test("info", pkg.name)) {
        //package is registered in npm?
        var publishedPackageInfo = JSON.parse(npm.get("info", pkg.name, "--json"));
        if (publishedPackageInfo.versions == version || publishedPackageInfo.versions.indexOf(version) != -1)
            shell.exit(2, "Version " + pkg.version + " is already published to npm");

        shell.write('package.json', JSON.stringify(pkg, null, 2));

        npm("publish");
        git("commit","-am","Published version " + version);
        git("tag", version);

        git("push");
        git("push","--tags");
        console.log("Published!");
    }
    else
        shell.exit(1, pkg.name + " is not an existing npm package");
};
