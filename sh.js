/**
 * sh.js
 * 
 * Author: Diego Rivera
 * git@diegorivera.com.es
 * 
 * Shell terminal functions
 */

var path = [];
var user = "guest";
var historyPointer = 0;
var historyCommands = [];
var currentCommand = "";

window.onload = () => {

    showPrompt();
}

document.addEventListener("keyup", event => {

    let entries = document.querySelectorAll('input');
    let prompt = [].slice.call(entries).pop();
    switch (event.key) {
        case 'Enter':
            prompt.readOnly = true;
            prompt.onblur = null;
            var arguments = prompt.value;
            arguments = arguments.split(" ");
            let command = arguments.shift();
            if (!command) {
                showPrompt();
            } else if (!!window[command]) {
                historyCommands.push(prompt.value);
                window[command](arguments);
            } else {
                let resultRow = getDisplay();
                resultRow.textContent = "command not found: " + command;
                showPrompt();
            }
            historyPointer = 0;
            currentCommand = "";
            break;
        case 'ArrowUp':
            if (historyPointer < historyCommands.length) {
                historyPointer++;
                prompt.value = historyCommands[historyCommands.length - historyPointer];
            }
            break;
        case 'ArrowDown':
            if (historyPointer > 0) {
                historyPointer--;
                if (historyPointer == 0) {
                    prompt.value = currentCommand;
                } else {
                    prompt.value = historyCommands[historyCommands.length - historyPointer];
                }
            }
            break;
        default:
            currentCommand = prompt.value;
            break;
    }
})

function getPath() {

    return user + ":~" + (path.length > 0 ? "/"  : "") + path.join("/");
}

function showPrompt() {

    var promptRow = document.createElement('div');
    var promptLabel = document.createElement('label');
    var promptInput = document.createElement('input');
    promptRow.classList.add('prompt')
    promptLabel.textContent = getPath() + '$';
    promptRow.appendChild(promptLabel);
    promptRow.appendChild(promptInput);
    document.querySelector('#terminal').appendChild(promptRow);
    promptInput.focus();
    promptInput.onblur = () => {
        promptInput.focus();
    }

    return promptRow;
}

function getDisplay() {

    var resultRow = document.createElement('div');
    document.querySelector('#terminal').appendChild(resultRow);

    return resultRow;
}

function ls(args) {

    fetch('contents.json')
        .then(response => response.json())
        .then(contents => {
            let resultRow = getDisplay();
            resultRow.innerHTML = Object.keys(contents).join("&emsp;");
            showPrompt();
        });
}

function cd(args) {

    fetch('contents.json')
        .then(response => response.json())
        .then(contents => {
            let dir = args[0];
            if (dir != '.') {
                if (dir == '..') {
                    path.pop();
                } else if (Object.keys(contents).includes(dir)) {
                    path.push(dir);
                } else {
                    let resultRow = getDisplay();
                    resultRow.innerHTML = "no such file or directory: " + dir;
                }
            }
            showPrompt();
        });
}
