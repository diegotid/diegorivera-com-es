/**
 * sh.js
 * 
 * Author: Diego Rivera
 * git@diegorivera.com.es
 * 
 * Shell terminal functions
 */

/**
 * TO-DO
 * - ls <dir>
 * - cd ../<dir>
 * - cd no such directory as 404 page (eg, http://diegorivera.com.es/drappstudio)
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
            path.forEach(dir => {
                contents = contents.childs[dir];
            })
            let resultRow = getDisplay();
            let date = new Date(contents.data.date);
            resultRow.innerHTML = "total " + Object.keys(contents.childs).length + "<br/>";
            resultRow.innerHTML += lsLine(".", contents);
            resultRow.innerHTML += lsLine("..", contents);
            Object.keys(contents.childs).forEach(child => {
                try {
                    resultRow.innerHTML += lsLine(child, contents.childs[child]);
                } catch (e) {
                    console.log(e)
                }
            })
            showPrompt();
        });
}

function lsLine(name, content) {

    let dateOptions = { year: 'numeric', month: 'short', day: '2-digit' };

    let d = !!content.childs ? "d" : "-";
    let x = !!content.data.link || !!content.childs ? "x" : "-";
    let date = new Date(content.data.date);

    if (!!content.data.link) {
        name = "<a href='" + content.data.link + "' target='_blank'>" + name + "</a>";
    }

    return d + "r-" + x + "r-" + x + "r-" + x + "&nbsp;diego&nbsp;staff&nbsp;" + date.toLocaleDateString("es-ES", dateOptions) +  "&nbsp;" + name + "<br/>";
}

function cd(args) {

    fetch('contents.json')
        .then(response => response.json())
        .then(contents => {
            path.forEach(dir => {
                contents = contents.childs[dir];
            })
            let dir = args[0];
            if (dir != '.') {
                if (dir == '..') {
                    path.pop();
                } else if (Object.keys(contents.childs).includes(dir)) {
                    path.push(dir);
                } else {
                    let resultRow = getDisplay();
                    resultRow.innerHTML = "no such file or directory: " + dir;
                }
            }
            showPrompt();
        });
}
