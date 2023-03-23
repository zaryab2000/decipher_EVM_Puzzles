const fs = require("fs-extra");
const { resolve } = require("path");
const inquirer = require("inquirer");
const chalk = require("chalk");
const { getOpcode } = require("./opcodes");

module.exports.play = async function play() {
    printIntroText()
    const playerChoice = await fetchDifficultyLevel();

    while (true) {
        const puzzle = getNextPuzzle(playerChoice.value);

        if (puzzle === undefined) {
        printNextSteps(playerChoice.value);
        process.exit(0);
        }

        const solution = await playPuzzle(puzzle);

        if (solution) {
        saveSolution(puzzle.number, solution, playerChoice.value);

        if (await askPlayNext()) {
        } else {
            console.log("Thanks for playing!");
            process.exit(0);
        }
        } else {
        if (!(await askTryAgain())) {
            console.log("Thanks for playing!");
            process.exit(0);
        }
        }
    }
};

async function playPuzzle(puzzle) {
  printTitle(puzzle.number);
  console.log();
  printCode(puzzle.code);
  console.log();

  const solution = await readSolution(puzzle.askForData, puzzle.askForValue);

  const [success, evmCodesUrl] = await runPuzzle(puzzle.code, solution);

  console.log();
  if (success) {
    console.log(chalk.green("Puzzle solved!"));
  } else {
    console.error(chalk.red("Wrong solution :("));
    await checkForHint(puzzle);
  }
  console.log();
  console.log(chalk.blue("To get more clarity, Run it in evm.codes as well:"), evmCodesUrl);
  console.log();

  if (success) {
    return solution;
  }
}

async function askPlayNext() {
  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "playNext",
      message: "Do you want to play the next puzzle?"
    }
  ]);

  console.log();

  return answers.playNext;
}

async function askTryAgain() {
  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "tryAgain",
      message: "Do you want to try again?"
    }
  ]);

  console.log();

  return answers.tryAgain;
}

async function askIfHintNeeded() {
  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "hintNeeded",
      message: "Do you Need Some HINT ?"
    }
  ]);

  console.log();

  return answers.hintNeeded;
}

function printCode(code) {
  code = code.toUpperCase();
  let i = 0;

  const positions = [];
  const opcodesHex = [];
  const opcodes = [];

  let opcodeHexColumnWidth = 0;

  while (i < code.length) {
    let opcodeHex = code.slice(i, i + 2);
    let [opcode, pushSize] = getOpcode(opcodeHex);

    const position = (i / 2)
      .toString(16)
      .toUpperCase()
      .padStart(2, "0");

    positions.push({ value: position, color: "gray" });

    let opcodeHexItem;
    let opcodeItem;
    if (pushSize) {
      const pushArg = code.slice(i + 2, i + 2 + 2 * pushSize);
      opcodeHexItem = { value: opcodeHex + pushArg, color: null };
      opcodeItem = { value: `${opcode}${pushSize} ${pushArg}`, color: null };
      i += 2 + 2 * pushSize;
    } else {
      let color = null;
      if (opcode === "STOP") {
        color = "green";
      } else if (opcode === "REVERT") {
        color = "red";
      } else if (opcode === "JUMPDEST") {
        color = "cyan";
      }
      opcodeHexItem = { value: opcodeHex, color };
      opcodeItem = { value: opcode, color };
      i += 2;
    }

    opcodeHexColumnWidth = Math.max(
      opcodeHexColumnWidth,
      opcodeHexItem.value.length
    );

    opcodes.push(opcodeItem);
    opcodesHex.push(opcodeHexItem);
  }

  const colorize = ({ value, color }, padEnd = 0) => {
    const paddedValue = value.padEnd(padEnd, " ");
    return color ? chalk[color](paddedValue) : paddedValue;
  };

  for (let i = 0; i < positions.length; i++) {
    console.log(
      colorize(positions[i]),
      "    ",
      colorize(opcodesHex[i], opcodeHexColumnWidth + 5),
      colorize(opcodes[i])
    );
  }
}

async function readSolution(askForData, askForValue) {
  const solution = await inquirer.prompt([
    {
      type: "number",
      name: "value",
      message: "Enter the value to send:",
      default: 0,
      when: askForValue
    },
    {
      type: "input",
      name: "data",
      message: "Enter the calldata:",
      when: askForData,
      filter: function normalizeCallData(x) {
        x = x.startsWith("0x") ? x.slice(2) : x;
        x = x.length % 2 === 0 ? x : "0" + x;
        return "0x" + x;
      },
    }
  ]);

  if (!askForValue) {
    solution.value = 0;
  }
  if (!askForData) {
    solution.data = "0x";
  }

  return solution;
}

async function runPuzzle(puzzleCode, { data, value }) {
  const [s] = await ethers.getSigners();

  const address = "0xffffffffffffffffffffffffffffffffffffffff";

  await hre.network.provider.send("hardhat_setCode", [
    address,
    `0x${puzzleCode}`
  ]);

  data = data.startsWith("0x") ? data : `0x${data}`;

  const evmCodesUrlData = data === "0x" ? "" : data;
  const evmCodesUrl = `https://www.evm.codes/playground?callValue=${value}&unit=Wei&callData=${evmCodesUrlData}&codeType=Bytecode&code='${puzzleCode}'_`;

  try {
    await s.sendTransaction({
      to: address,
      data,
      gasLimit: 1_000_000,
      value
    });
    return [true, evmCodesUrl];
  } catch (e) {
    return [false, evmCodesUrl];
  }
}

function printTitle(i) {
  const text = `Puzzle ${i}`;
  const width = text.length + 4;
  console.log("#".repeat(width));
  console.log(`# ${text} #`);
  console.log("#".repeat(width));
}

function getNextPuzzle(playerChoice) {
  var {solutionsDir, puzzlesDir} = routePlayerChoice(playerChoice);

  fs.ensureDirSync(solutionsDir);

  const numberOfPuzzles = fs
    .readdirSync(puzzlesDir)
    .filter(x => !x.startsWith(".")).length;

  for (let i = 1; i <= numberOfPuzzles; i++) {
    const solutionPath = resolve(solutionsDir, `solution_${i}.json`);
    if (!fs.existsSync(solutionPath)) {
      const puzzle = fs.readJsonSync(resolve(puzzlesDir, `puzzle_${i}.json`));
      return {
        ...puzzle,
        number: i
      };
    }
  }
}

function saveSolution(puzzleNumber, solution, playerChoice) {
  var {solutionsDir, } = routePlayerChoice(playerChoice);

  fs.writeJsonSync(
    resolve(solutionsDir, `solution_${puzzleNumber}.json`),
    solution
  );
}

async function fetchDifficultyLevel() {
  const playerChoice = await inquirer.prompt([
    {
      type: "list",
      name: "value",
      message: chalk.cyan.italic("\t\t Select the Difficulty Level - [ Use arrow to select an option ⬆️ ⬇️ ]\t"),
      choices: [ "EASY", new inquirer.Separator(), "MEDIUM", new inquirer.Separator(), "HARD", new inquirer.Separator() ],
    }
  ]);

  return playerChoice;
}

async function checkForHint(puzzle){
  if(puzzle.hint){
    if ((await askIfHintNeeded())) {
      console.log(chalk.yellow(puzzle.hintMessage))
      console.log('\n')
    }
  }
}

function routePlayerChoice(playerChoice){
  const { root } = hre.config.paths;
  var solutionsDir;
  var puzzlesDir;

  if(playerChoice === "EASY"){
    solutionsDir = resolve(root, "allSolutions/1_easySolutions");
    puzzlesDir = resolve(root, "allPuzzles/1_easyPuzzles");    
  }else if(playerChoice === "MEDIUM"){
    solutionsDir = resolve(root, "allSolutions/2_mediumSolutions");
    puzzlesDir = resolve(root, "allPuzzles/2_mediumPuzzles"); 
  }else{
    solutionsDir = resolve(root, "allSolutions/3_hardSolutions");
    puzzlesDir = resolve(root, "allPuzzles/3_hardPuzzles"); 
  }

  return {solutionsDir, puzzlesDir};
}

function printNextSteps(playerChoice){
  if(playerChoice === "EASY"){
    console.log(chalk.cyan.bold.inverse.underline("\n Congrats! 👏 All Easy Puzzles are SOLVED 👉 Start Deciphering MEDIUM-LEVEL Puzzles \n "));
  }else if(playerChoice === "MEDIUM"){
    console.log(chalk.cyan.bold.inverse.underline("\n Well Done 👏! All Medium Puzzles are SOLVED 👉 Start Deciphering HARD-LEVEL Puzzles \n "));
  }else{
    console.log(chalk.cyan.bold.inverse.underline("\n You are a Rockstart 🔥! You Solved all Puzzles \n"));
  }
}

function printIntroText(){
  const introText = "\n\n\t\t\t\t DECIPHER  EVM  PUZZLES \t\t\t\t\t\t\n\n"
  const width = introText.length + 70;
  console.log("-".repeat(width));
  console.log(` ${chalk.cyanBright.bold.inverse.underline(introText)} `);
  console.log("-".repeat(width));
  console.log('\n\n')
}