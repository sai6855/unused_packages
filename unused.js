const package = require("./package.json");
const config = require("./unused.config.json");
const fs = require("fs");

const packagesInFiles = [];

const traverseDirectories = async (source) => {
  const data = await fs.promises.readdir(source, { withFileTypes: true });

  for (let i = 0; i < data.length; i++) {
    const file = data[i];
    if (file.isDirectory()) {
      await traverseDirectories(`${source}/${file.name}`);
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

(async () => {
  const entries = config.entry;
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

  console.warn(
    `Some of the packages listed below could be devDependencies or you might not be using some packages or there is legitimate usecase for some of packages. \n 1) if a package is devDependency then install it as devDependency \n 2) if there is usecase for some of the packages then ignore the warning \n 3) if you are not using any of the listed below packages in any which way  then consider uninstalling those. \n \n Packages: \n ${unusedPackages.join(
      ",\n "
    )}`
  );

  //console.log(packagesInFiles);
})();
