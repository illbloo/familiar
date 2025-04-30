import { Command } from "commander";
import { create } from "./posts";

async function main() {
  const program = new Command()
    .addCommand(new Command("posts")
      .addCommand(new Command("create")
        .argument("<text>", "The text of the post")
        .action(async (text) => {
          const post = await create(text);
          console.log(post);
        })
      ));

  await program.parseAsync();
  process.exit(0);
}

main();