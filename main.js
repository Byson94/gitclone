const fs = require("node:fs"); // for accessing filesystem and changing files.
const path = require("path");
const { createHash } = require("crypto"); // for hashing strings.
const zlib = require("zlib");

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
      if (!fs.existsSync("./.gitclone/refs/heads")) {
        fs.mkdirSync("./.gitclone/refs/heads");
      }
    } catch (err) {
      console.error(err);
    }
    console.log("stage-1: pass");

    try {
      if (!fs.existsSync("./.gitcloneignore")) {
        fs.writeFileSync(
          "./.gitcloneignore",
          `[".git", ".gitclone", ".gitcloneignore"]`
        );
      }
      if (!fs.existsSync("./.gitclone/index")) {
        fs.writeFileSync("./.gitclone/index", "");
      }
      if (!fs.existsSync("./.gitclone/HEAD")) {
        fs.writeFileSync("./.gitclone/HEAD", "refs: refs/heads/master"); // current branch
      }
      if (!fs.existsSync("./.gitclone/refs/heads/master")) {
        fs.writeFileSync("./.gitclone/refs/heads/master", ""); // get current active dir
      }
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
      const cloneignore = JSON.parse(
        fs.readFileSync(`./.gitcloneignore`, "utf8")
      );

      function getAllFiles(dirPath) {
        let results = [];

        const entries = fs.readdirSync(dirPath);
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry);

          // skip ignored
          if (cloneignore.some((pattern) => fullPath.includes(pattern)))
            continue;

          const stats = fs.statSync(fullPath);
          if (stats.isDirectory()) {
            results = results.concat(getAllFiles(fullPath));
          } else {
            results.push(fullPath);
          }
        }

        return results;
      }

      const allFiles = getAllFiles(process.cwd());

      allFiles.forEach((file) => {
        console.log(file);
        const data = fs.readFileSync(file, "utf8");
        // console.log(dirPath);
        let dataHash = createHash("sha256").update(data).digest("base64");
        zlib.gzip(data, (err, compressedData) => {
          if (err) {
            console.error("Compression error:", err);
            return;
          }
          const dirPath = path.join(
            ".gitclone",
            "objects",
            ...dataHash.split("/").slice(0, -1)
          );
          const filePath = path.join(dirPath, dataHash.split("/").pop());
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, compressedData, "utf8");
          }
        });
        // console.log(dataHash);

        // index
        let indexLines = fs
          .readFileSync("./.gitclone/index", "utf8")
          .split("\n");

        let indexUpdated = false;
        indexLines = indexLines.map((line) => {
          let [filePath, hash] = line.split(" > ");
          if (filePath === file) {
            indexUpdated = true;
            return `${file} > ${dataHash}`;
          }
          return line;
        });

        if (!indexUpdated) {
          indexLines.push(`${file} > ${dataHash}`);
        }

        // write the updated index back to the file
        fs.writeFileSync("./.gitclone/index", indexLines.join("\n"), "utf8");
      });
    } else if (arguments[2]) {
      try {
        const data = fs.readFileSync(`./${arguments[2]}`, "utf8");
        let dirPath = `${process.cwd()}/${arguments[2]}`; // we use process.cwd() instead of __dirname so that we get the current active directory
        // console.log(dirPath);
        let dataHash = createHash("sha256").update(data).digest("base64");
        zlib.gzip(data, (err, compressedData) => {
          if (err) {
            console.error("Compression error:", err);
            return;
          }
          const dirPath = path.join(
            ".gitclone",
            "objects",
            ...dataHash.split("/").slice(0, -1)
          );
          const filePath = path.join(dirPath, dataHash.split("/").pop());
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, compressedData, "utf8");
          }
        });
        // console.log(dataHash);

        // index
        let indexLines = fs
          .readFileSync("./.gitclone/index", "utf8")
          .split("\n");

        let indexUpdated = false;
        indexLines = indexLines.map((line) => {
          let [filePath, hash] = line.split(" > ");
          if (filePath === dirPath) {
            indexUpdated = true;
            return `${dirPath} > ${dataHash}`;
          }
          return line;
        });

        if (!indexUpdated) {
          indexLines.push(`${dirPath} > ${dataHash}`);
        }

        // write the updated index back to the file
        fs.writeFileSync("./.gitclone/index", indexLines.join("\n"), "utf8");
      } catch (err) {
        console.error(err);
      }
    } else {
      console.error("ERROR: Invalid argument found");
    }
  } else if (arguments[1] === "commit") {
    if (arguments[2] === "-m") {
      if (arguments[3]) {
        // we will read the index and copy it directly to the tree
        let indexData = fs
          .readFileSync("./.gitclone/index", "utf8")
          .split("\n")
          .slice(1); // slice because the 1st line will be a \n
        let parentName = fs.readFileSync(
          "./.gitclone/refs/heads/master",
          "utf8"
        );
        let treeData = "";

        indexData = indexData.map((line) => {
          treeData += `${line} \n`;
        });

        if (parentName === "") {
          treeData += `[parent] > none \n`;
        } else {
          treeData += `[parent] > ${parentName} \n`;
        } // write the parent hash

        treeData += `[message] > ${arguments[3]}`;

        const treeHash = createHash("sha256").update(treeData).digest("base64");

        const dirPath = path.join(
          ".gitclone",
          "objects",
          ...treeHash.split("/").slice(0, -1)
        );
        const filePath = path.join(dirPath, treeHash.split("/").pop());
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, treeData, "utf8");
        }
        fs.writeFileSync(".gitclone/refs/heads/master", treeHash, "utf8");
        fs.writeFileSync(".gitclone/index", "", "utf8");

        // console.log(indexData);
      } else {
        console.error("ERROR: Invalid argument found!");
      }
    }
  } else if (arguments[1] === "log") {
    let latestCommit = fs.readFileSync("./.gitclone/refs/heads/master", "utf8");

    if (latestCommit === "") {
      console.error("ERROR: No commits found!");
    } else {
      let currentCommit = latestCommit;

      while (currentCommit !== "none") {
        let commitData = fs.readFileSync(
          `${process.cwd()}/.gitclone/objects/${currentCommit}`,
          "utf8"
        );

        let lines = commitData.split("\n");

        console.log(`Commit: ${currentCommit}`);
        console.log(
          lines.find((line) => line.startsWith("[message] > ")) + "\n"
        );

        // continue the loop
        let parentLine = lines.find((line) => line.startsWith("[parent] > "));
        let parentHash = parentLine
          ? parentLine.split(" > ")[1].trim()
          : "none";

        if (parentHash === "none") {
          console.log("End of commit history.");
          break;
        }

        currentCommit = parentHash;
      }
    }
  } else if (arguments[1] === "reset") {
    if (arguments[2]) {
      if (arguments[3] === "--hard" || !arguments[3]) {
        if (
          fs.readFileSync(
            `${process.cwd()}/.gitclone/objects/${arguments[2]}`,
            "utf8"
          )
        ) {
          let treeContent = fs
            .readFileSync(
              `${process.cwd()}/.gitclone/objects/${arguments[2]}`,
              "utf8"
            )
            .split("\n");

          let parentLineFound = treeContent.find((line) =>
            line.startsWith("[parent] > ")
          );
          if (parentLineFound) {
            // now we start moving to the previous commit
            // find all data
            let filteredTreeContent = treeContent.filter(
              (line) =>
                !line.startsWith("[parent] > ") &&
                !line.startsWith("[message] > ")
            );

            filteredTreeContent = filteredTreeContent.map((line) => {
              let [filePath, hash] = line.split(" > ");
              let dataInHashFile;
              if (
                !fs.existsSync(
                  `${process.cwd()}/.gitclone/objects/${hash.trim()}` // trim to ensure that no space exist
                )
              ) {
                console.warn(
                  `Warning: Object not found for hash ${hash.trim()}`
                );
                return;
              }
              dataInHashFile = fs.readFileSync(
                `${process.cwd()}/.gitclone/objects/${hash.trim()}`
              );

              const compressedBuffer = Buffer.from(dataInHashFile, "base64");

              try {
                // Decompress synchronously
                const decompressedBuffer = zlib.gunzipSync(compressedBuffer);
                const decompressedStr = decompressedBuffer.toString();

                fs.writeFileSync(filePath.trim(), decompressedStr);
              } catch (err) {
                console.error("Decompression error:", err);
              }

              // post revert
              fs.writeFileSync("./.gitclone/index", ""); // clean the index
              fs.writeFileSync("./.gitclone/refs/heads/master", hash.trim());
            });
          } else {
            console.error("ERROR: Described commit is not a commit!");
          }
        } else {
          console.error("ERROR: Commit not found!");
        }
      }
    } else {
      console.error("ERROR: Invalid argument found!");
    }
  } else {
    console.error("ERROR: Command not found!");
  }
}

// cons
