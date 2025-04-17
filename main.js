const fs = require("node:fs");
const { createHash } = require("crypto");

process.removeAllListeners("warning"); // remove all runtime warnings from nodejs

// process.argv[ process the arguments
let arguments = process.argv;

if (arguments[0].slice(-4) === "node") {
  arguments = arguments.slice(1);
}

// console.log(arguments);

if (!arguments[1]) {
  // if no arguments, then:
  console.log("Welcome to gitclone!");
  console.log(
    "This is an educational tool made to understand how git works under the hood."
  );
}

if (arguments[1]) {
  // dis is where stuff get interesting
  if (arguments[1] === "init") {
    // this just creates the necessary folders and files for later.
    // stage-1 is creating directories and stage-2 is creating files.
    try {
      if (!fs.existsSync("./.gitclone")) {
        fs.mkdirSync("./.gitclone");
      }
      if (!fs.existsSync("./.gitclone/objects")) {
        fs.mkdirSync("./.gitclone/objects");
      }
      if (!fs.existsSync("./.gitclone/refs")) {
        fs.mkdirSync("./.gitclone/refs");
      }
    } catch (err) {
      console.error(err);
    }
    console.log("stage-1: pass");

    try {
      fs.writeFileSync("./.gitclone/index", "");
      fs.writeFileSync("./.gitclone/ROOT", process.cwd()); // get current active dir
    } catch (err) {
      console.error(err);
    }
    console.log("stage-2: pass");

    console.log("Gitclone repository has been initialized!");
  } else if (arguments[1] === "add") {
    // here we would want ot check the next argument since add requires another argument to continue
    if (!fs.existsSync("./.gitclone")) {
      console.error(
        "ERROR: .gitclone not found! Run `gitclone init` to initialize the repository or run the command in the root folder."
      );
      return;
    }

    if (arguments[2] === ".") {
      console.log("not yet implemented");
    } else if (arguments[2]) {
      try {
        const data = fs.readFileSync(`./${arguments[2]}`, "utf8");
        let dirPath = `${process.cwd()}/${arguments[2]}`; // we use process.cwd() instead of __dirname so that we get the current active directory
        // console.log(dirPath);
        let dataHash = createHash("sha256").update(data).digest("base64");
        // console.log(dataHash);
        fs.writeFileSync(
          "./.gitclone/objects/" + dataHash,
          `${dirPath} > ${dataHash}`
        );
      } catch (err) {
        console.error(err);
      }
    } else {
      console.error("ERROR: Invalid argument found");
    }
  } else if (arguments[1] === "commit") {
    console.log("Not yet implemented");
  }
}
