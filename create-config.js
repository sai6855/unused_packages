const fs = require("fs");

const defaultConfig = {
  entry: ["src"],
  extensions: ["js", "ts"],
};

fs.writeFile("../../unused.config.json", defaultConfig, (err, data) => {
  if (err) {
    console.error(err);
  }
});
