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
  console.log("YAY an argument!");
}
