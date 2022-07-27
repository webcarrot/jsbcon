import { cwd } from "node:process";
import { join, extname } from "node:path";
import {
  stat,
  mkdir,
  rm,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";

async function copy(source, destination) {
  const sourcePath = join(cwd(), source);
  const destinationPath = join(cwd(), destination);
  const sourceInfo = await stat(sourcePath);
  switch (true) {
    case sourceInfo.isDirectory(): {
      if (
        await stat(destinationPath).then(
          () => true,
          () => false
        )
      )
        await rm(destinationPath, { recursive: true });
      await mkdir(destinationPath);
      const content = await readdir(sourcePath);
      for (let path of content)
        await copy(join(source, path), join(destination, path));
      break;
    }
    case sourceInfo.isFile(): {
      let content = await readFile(sourcePath);
      if (extname(sourcePath) === ".ts") {
        content = content
          .toString("utf-8")
          .replace(/from "(\.[^"]+)";/g, (_, path) => `from "${path}.ts";`);
        await writeFile(destinationPath, `// Copy of "${source}"\n${content}`);
      }
      break;
    }
  }
}

await copy("src/agnostic", "deno/agnostic");
