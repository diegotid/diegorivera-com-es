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
 * - cd
 * - cd ~
 * - ls -la
 * - cd no such directory as 404 page (eg, http://diegorivera.com.es/drappstudio)
 * - su <user>
 */

var currentPath = [];
var user = "guest";
var historyPointer = 0;
var historyCommands = [];
var currentCommand = "";

window.onload = () => {

    showPrompt();
}

document.addEventListener("keyup", async (event) => {

    let entries = document.querySelectorAll('input');
    let prompt = [].slice.call(entries).pop();
    switch (event.key) {
        case 'Enter':
            prompt.readOnly = true;
            prompt.onblur = null;
            var arguments = prompt.value.replace(/^(\.\/)/,"");;

            var contents = await getCurentPathContents();
            for (const entry in contents.childs) {
                if (entry.toLowerCase() == arguments.toLowerCase().trim()) {
                    let content = contents.childs[entry];
                    if (!!content.data.link) {
                        window.open(content.data.link, "_blank");
                        openLink(entry);
                        return;
                    }
                }
            }
            arguments = arguments.split(" ");
            let command = arguments.shift();
            if (!command) {
                showPrompt();
            } else if (!!window[command]) {
                historyCommands.push(prompt.value);
                window[command](arguments);
            } else {
                showDisplay("command not found: " + command);
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

function getCurentPathContents() {

    return new Promise(resolve => {
        fetch('contents.json')
        .then(response => response.json())
        .then(contents => {
            for (const i in currentPath) {
                let dir = currentPath[i];
                contents = contents.childs[dir];
            }
            resolve(contents);
        })
    });
}

function getPath() {

    return user + ":~" + (currentPath.length > 0 ? "/"  : "") + currentPath.join("/");
}

async function changeDir(to) {

    var contents = await getCurentPathContents();
    let path = to.split("/");
    for (const i in path) {
        let dir = path[i];
        if (dir != '.') {
            if (dir == '..') {
                currentPath.pop();
                contents = await getCurentPathContents();
            } else if (Object.keys(contents.childs).includes(dir)) {
                if (Object.keys(contents.childs[dir]).includes("childs")) {
                    currentPath.push(dir);
                    contents = contents.childs[dir];
                } else {
                    throw "not a directory: " + dir;
                }
            } else {
                throw "no such file or directory: " + dir;
            }
        }
    }
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

function showDisplay(content) {

    var resultRow = document.createElement('div');
    document.querySelector('#terminal').appendChild(resultRow);
    resultRow.innerHTML = content;
}

function lsLine(name, content) {

    let dateOptions = { year: 'numeric', month: 'short', day: '2-digit' };

    let d = !!content.childs ? "d" : "-";
    let x = !!content.data.link || !!content.childs ? "x" : "-";
    let date = new Date(content.data.date);

    if (!!content.data.link) {
        name = "<a href=\"" + content.data.link + "\" target=\"_blank\" onclick=\"onFollowLink('" + name + "')\">" + name + "</a>";
    }

    return d + "r-" + x + "r-" + x + "r-" + x + "&nbsp;diego&nbsp;staff&nbsp;" + date.toLocaleDateString("es-ES", dateOptions) +  "&nbsp;" + name + "<br/>";
}

function onFollowLink(entry) {

    let entries = document.querySelectorAll('input');
    let prompt = [].slice.call(entries).pop();
    prompt.readOnly = true;
    prompt.onblur = null;
    historyPointer = 0;
    currentCommand = "";

    openLink(entry);
}

function openLink(entry) {

    historyCommands.push("./" + entry);
    showDisplay("opening '" + entry + "' in the web browser...");
    showPrompt();
}
