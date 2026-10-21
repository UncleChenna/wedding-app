import { resolve } from "node:path";

// Static inspection of common shell commands, not an interpreter or sandbox.
// Quotes keep command text/data separate from actual operators and operands.
function tokens(shell) {
  const pattern =
    /(?<operator>\d*(?:>&|<&|>>|<<|>|<)|&&|\|\||[;|\n])|(?<word>(?:\\.|"(?:\\.|[^"\\])*"|'[^']*'|[^\s"';&|<>\\])+)/g;
  return [...shell.matchAll(pattern)].map((match) => ({
    operator: Boolean(match.groups.operator),
    value:
      match.groups.operator ??
      match.groups.word.replace(
        /"((?:\\.|[^"\\])*)"|'([^']*)'|\\(.)/g,
        (_, double, single, escaped) => double ?? single ?? escaped,
      ),
  }));
}

export function shellAccess(shell, cwd) {
  const reads = [];
  const writes = [];
  let directory = cwd;
  const path = (value) => resolve(directory, value);
  const add = (list, value) => {
    if (!value || value === "-") return;
    if (list === writes && /[$`*?{}]/.test(value))
      throw new Error("Cannot verify a dynamic shell write target; use an explicit path.");
    list.push(path(value));
  };
  const inspect = (segment) => {
    const words = [];
    for (let i = 0; i < segment.length; i++) {
      const token = segment[i];
      if (!token.operator) {
        words.push(token.value);
        continue;
      }
      const target = segment[++i]?.value;
      if (/>&|<&|<</.test(token.value)) continue;
      add(token.value.includes(">") ? writes : reads, target);
    }
    while (
      words[0] &&
      (/^[A-Za-z_][A-Za-z_0-9]*=/.test(words[0]) || ["command", "env"].includes(words[0]))
    )
      words.shift();
    const command = words.shift()?.split("/").at(-1);
    if (!command) return;
    if (command === "cd") {
      if (words[0] && !words[0].startsWith("-")) directory = path(words[0]);
      return;
    }
    const operands = [];
    let targetDirectory;
    let scriptSeen = false;
    let inPlace = false;
    let options = true;
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (options && word === "--") {
        options = false;
        continue;
      }
      if (options && word.startsWith("-")) {
        if (["cp", "mv", "install"].includes(command) && /^-t.+/.test(word)) {
          targetDirectory = word.slice(2);
          continue;
        }
        if (
          ["cp", "mv", "install"].includes(command) &&
          ["-t", "--target-directory"].includes(word)
        )
          targetDirectory = words[++i];
        else if (
          ["cp", "mv", "install"].includes(command) &&
          word.startsWith("--target-directory=")
        )
          targetDirectory = word.slice(19);
        else if (["sed", "perl"].includes(command) && /^-[^-]*i|^--in-place/.test(word)) {
          inPlace = true;
          // BSD sed -i '' script file; GNU -i suffix is attached to the flag.
          if (words[i + 1] === "") i++;
        } else if (
          ["sed", "perl", "grep", "rg"].includes(command) &&
          ["-e", "--expression", "--regexp"].includes(word)
        ) {
          i++;
          scriptSeen = true;
        } else if (
          ["sed", "perl", "grep", "rg"].includes(command) &&
          ["-f", "--file"].includes(word)
        ) {
          add(reads, words[++i]);
          scriptSeen = true;
        }
        continue;
      }
      if (["sed", "perl", "grep", "rg"].includes(command) && !scriptSeen) {
        scriptSeen = true;
        continue;
      }
      operands.push(word);
    }
    if (["cp", "mv", "install"].includes(command)) {
      const destination = targetDirectory ?? operands.pop();
      add(writes, destination);
      operands.forEach((value) => add(command === "mv" ? writes : reads, value));
    } else if (["rm", "rmdir", "mkdir", "touch", "tee", "truncate"].includes(command)) {
      operands.forEach((value) => add(writes, value));
    } else if (["sed", "perl"].includes(command)) {
      operands.forEach((value) => add(inPlace ? writes : reads, value));
    } else if (
      ["cat", "head", "tail", "less", "more", "grep", "rg", "sort", "wc"].includes(command)
    ) {
      operands.forEach((value) => add(reads, value));
    }
  };
  let segment = [];
  let comment = false;
  for (const token of tokens(shell)) {
    if (comment && token.value !== "\n") continue;
    if (!token.operator && token.value.startsWith("#")) {
      comment = true;
      continue;
    }
    if (token.operator && [";", "|", "&&", "||", "\n"].includes(token.value)) {
      inspect(segment);
      segment = [];
      comment = false;
    } else segment.push(token);
  }
  inspect(segment);
  return { reads, writes };
}
