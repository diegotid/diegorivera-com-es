/**
 * sh.js
 * 
 * Author: Diego Rivera
 * git@diegorivera.com.es
 * 
 * Shell terminal functions
 */

window.onload = () => {

    showPrompt();
}

document.addEventListener("keyup", event => {

    if (event.key === 'Enter') {
        let entries = document.querySelectorAll('input');
        let prompt = [].slice.call(entries).pop();
        prompt.readOnly = true;
        var arguments = prompt.value;
        console.log(arguments);
        arguments = arguments.split(" ");
        let command = arguments.shift();
        if (!!window[command]) {
            window[command](arguments);
        } else {
            let resultRow = getDisplay();
            resultRow.textContent = "command not found: " + command;
            showPrompt();
        }
    }
})

function showPrompt() {

    var promptRow = document.createElement('div');
    var promptLabel = document.createElement('label');
    var promptInput = document.createElement('input');
    promptRow.classList.add('prompt')
    promptLabel.textContent = '$';
    promptRow.appendChild(promptLabel);
    promptRow.appendChild(promptInput);
    document.querySelector('#terminal').appendChild(promptRow);
    promptInput.focus();

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
            resultRow.textContent = Object.keys(contents).join(" ");
            showPrompt();
        });
}