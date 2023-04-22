# decipher_EVM_puzzles

> **[ 🌟 Featured in Week In Ethereum News-April 2023](https://weekinethereumnews.com/week-in-ethereum-news-april-1-2023/)** 

![EVM Puzzle](https://user-images.githubusercontent.com/42082608/227203303-cb635c7a-a495-435b-9695-5f2fd1c75425.png)
Decipher EVM puzzles are basically a collection of EVM opcodes puzzles that includes a bunch of different opcodes which can be executed successfully only if you provide the right inputs.

The Decipher EVM Puzzle game is an extended version of [Franco's EVM puzzles](https://github.com/fvictorio/evm-puzzles) but with *additional complexity, a difficulty-level selector making it available not just for senior devs but also beginners, and more interesting puzzles covering a wide range of opcodes*.

Every puzzle might require one of the following as input from the player:
* CallData only 
* CallValue only 
* Both CallData & CallValue

Your main goal as a player is to provide the right set of inputs so that the transaction doesn't get reverted. 

>If it reverts, you FAIL...❌ If it executes successfully, You SOLVED that particular puzzle. ✅

### Imperative Note
* Solutions to puzzles can have more a formulae instead of one specific value.
    * For instance, some puzzles may require a type of input where **Calldata size must be n** and **CallValue must be n+4**,in order for you to solve it correctly.
    * For such cases, correct **CallData Size can be 4 or 5 or 6 and CallValue can be 8 or 9 or 10 respectively**
    * It's imperative to understand the formulae rather than chasing 1 specific calldata size or callvalue as the right answer, for such a puzzle
* Solutions to the same puzzle can also be more than 1 specific input.

## How to Play?
1. Clone this repository
```
git clone https://github.com/zaryab2000/decipher_EVM_Puzzles.git
```

2. Install Packages
```
npm install 
```

3. Run the following command 

```
npx hardhat play
```

That's it.

Once done, you should be prompted to do this 👇
![](https://i.imgur.com/aHbwB8B.png)

Then, simply select the difficulty level and start playing.

## Tools that can help
While you can approach the game however you wish, I would like to recommend two tools that will undoubtedly make your life easier.
1. [Evm Codes Playground](https://www.evm.codes/playground?fork=merge)
2. [ETHERVM's list of Opcodes](https://ethervm.io/)

*More details [here](https://zaryabs.com/decipher-evm-puzzle-game-for-smart-contract-devs)*
