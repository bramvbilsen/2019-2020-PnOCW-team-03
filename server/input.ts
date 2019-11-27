const readline = require("readline");

export default function startListeningForServerCommands(
    onInput: (input: string) => void
) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question("", (command: string) => {
        rl.close();
        onInput(command);
        startListeningForServerCommands(onInput);
    });
}
