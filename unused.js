const directories = __dirname.split("/");
const nodeModulesIndex = directories.findIndex((dir) => dir === "node_modules");
const startingPath =
  nodeModulesIndex === -1
    ? __dirname
    : directories.filter((dir, i) => i < nodeModulesIndex).join("/");

const package = require(`${startingPath}/package.json`);
const fs = require("fs");

const extensions = ["js", "jsx", "ts", "tsx", "cjs", "mjs"];

const packagesInFiles = [];

const traverseDirectories = async (source) => {
  const data = await fs.promises.readdir(source, { withFileTypes: true });

  for (let i = 0; i < data.length; i++) {
    const file = data[i];
    if (file.isDirectory()) {
      await traverseDirectories(`${source}/${file.name}`);
    } else {
      if (
        extensions.some((extension) => file.name.trim().endsWith(extension))
      ) {
        const path = `${startingPath}/${source}/${file.name}`;
        const fileData = fs.readFileSync(path, "utf-8");
        const codeLines = fileData.split("\n");
        codeLines
          .filter((line) => line.includes("import") || line.includes("require"))
          .forEach((statement) => {
            if (statement.trim().substring(0, 2) === "//") {
              return;
            }

            if (statement.includes("from")) {
              let packageName = statement.split("from")[1];
              if (!packageName.trim().includes(".")) {
                packageName = packageName
                  .replace('"', "")
                  .replace('"', "")
                  .replace(";", "")
                  .replace("'", "")
                  .replace("'", "")
                  .trim();

                if (!packagesInFiles.includes(packageName)) {
                  packagesInFiles.push(packageName);
                }
              }
            }

            if (statement.includes("require(")) {
              let packageName = statement.split("require")[1];
              if (!packageName.trim().includes(".")) {
                packageName = packageName
                  .replace("(", "")
                  .replace(")", "")
                  .replace(";", "")
                  .replace('"', "")
                  .replace('"', "")
                  .replace("'", "")
                  .replace("'", "")
                  .trim();

                if (!packagesInFiles.includes(packageName)) {
                  packagesInFiles.push(packageName);
                }
              }
            }
          });
      }
    }
  }
};

const findUnUsedPackages = async ({ entries = [] }) => {
  if (entries.length === 0) {
    console.error("entry in unused.config.json cannot be empty");
    return;
  }
  for (const entry of entries) {
    await traverseDirectories(entry);
  }
  const packageJsonDeps = Object.keys(package.dependencies);
  const unusedPackages = [];

  packageJsonDeps.forEach((package) => {
    const isUsed = packagesInFiles.some((packageInFile) =>
      packageInFile.startsWith(package.trim())
    );

    if (!isUsed) {
      unusedPackages.push(package);
    }
  });

  return unusedPackages;
};

module.exports = findUnUsedPackages;
