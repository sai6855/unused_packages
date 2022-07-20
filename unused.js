const package = require("./package.json");
const config = require("./unused.config.json");
const fs = require("fs");

const packagesInFiles = [];

const getDirectories = async (source) => {
  const data = await fs.promises.readdir(source, { withFileTypes: true });

  for (let i = 0; i < data.length; i++) {
    const file = data[i];
    if (file.isDirectory()) {
      await getDirectories(`${source}/${file.name}`);
    } else {
      if (
        config.extensions.some((extension) =>
          file.name.trim().endsWith(extension)
        )
      ) {
        const path = `./${source}/${file.name}`;
        const fileData = fs.readFileSync(path, "utf-8");
        const codeLines = fileData.split("\n");
        codeLines
          .filter((line) => line.includes("import"))
          .forEach((statement) => {
            if (statement.includes("from") && !statement.includes("//")) {
              let packageName = statement.split("from")[1];
              if (!packageName.trim().includes(".")) {
                packageName = packageName
                  .replace('"', "")
                  .replace('"', "")
                  .replace(";", "")
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

(async () => {
  await getDirectories(config.entry[0]);
  const packageJsonDeps = Object.keys(package.dependencies);
  const unusedPackages = [];
  packageJsonDeps.forEach((package) => {
    const isUsed = packagesInFiles.some((packageInFile) =>
      packageInFile.includes(package)
    );

    if (!isUsed) {
      unusedPackages.push(package);
    }
  });

  console.warn(
    `You "might" not be using following packages: ${unusedPackages.join(", ")}`
  );

  //console.log(packagesInFiles);
})();
