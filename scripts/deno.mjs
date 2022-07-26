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
  const sourceInfo = await stat(source);
  switch (true) {
    case sourceInfo.isDirectory(): {
      if (
        await stat(destination).then(
          () => true,
          () => false
        )
      )
        await rm(destination, { recursive: true });
      await mkdir(destination);
      const content = await readdir(source);
      await writeFile(
        join(destination, "README.md"),
        "Copy of `src/agnostic/**/*.ts` for deno by node `scripts/deno.mjs`"
      );
      for (let path of content)
        await copy(join(source, path), join(destination, path));
      break;
    }
    case sourceInfo.isFile(): {
      let content = await readFile(source);
      if (extname(source) === ".ts") {
        content = content
          .toString("utf-8")
          .replace(/from "(\.[^"]+)";/g, (_, path) => `from "${path}.ts";`);
        await writeFile(destination, content);
      }
      break;
    }
  }
}

await copy(join(cwd(), "src/agnostic"), join(cwd(), "deno/agnostic"));
