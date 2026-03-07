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
 * - pwd
 * - su <user>
 * - autocomplete from tab
 * - cat/head/tail
 * - cp/mkdir/mv/rm just showing not allowed
 * - mail to leave comments (su mandatory)
 */

var currentPath = [];
var user = "guest";
var historyPointer = 0;
var historyCommands = [];
var currentCommand = "";

window.onload = async () => {

    let dir = window.location.pathname.replace(/^(\/)/,"");
    await cd(dir.length > 0 ? [dir] : []);
}

document.addEventListener("keyup", async (event) => {

    let entries = document.querySelectorAll('input');
    let prompt = [].slice.call(entries).pop();
    switch (event.key) {
        case 'Enter':
            prompt.readOnly = true;
            prompt.onblur = null;
            var input = prompt.value.trim();
            if (input.indexOf("./") == 0) {
                let requestedEntry = input.replace(/^(\.\/)/, "").trim();
                try {
                    await openEntry(requestedEntry);
                } catch (error) {
                    showDisplay(error);
                    showPrompt();
                }
                historyPointer = 0;
                currentCommand = "";
                return;
            }
            var arguments = input.split(" ");
            let command = arguments.shift();
            if (!command) {
                showPrompt();
            } else if (!!window[command]) {
                historyCommands.push(input);
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

function getContentsTree() {

    return new Promise(resolve => {
        fetch('contents.json')
        .then(response => response.json())
        .then(contents => resolve(contents));
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

async function openEntry(requestedEntry) {

    let content = await getEntryAtPath(requestedEntry);
    if (!!content.data.link) {
        if (!openExternalLink(content.data.link)) {
            throw "popup blocked while opening: " + requestedEntry;
        }
        openLink(requestedEntry);
        return;
    }
    throw "not a link: " + requestedEntry;
}

function openExternalLink(url) {

    let anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    return true;
}

async function getEntryAtPath(path) {

    let contents = await getContentsTree();
    let resolvedPath = path.indexOf("/") == 0 ? [] : [...currentPath];
    let parts = path.split("/").filter(part => part.length > 0);

    for (const part of parts) {
        if (part == ".") {
            continue;
        }
        if (part == "..") {
            resolvedPath.pop();
            continue;
        }

        let currentContents = contents;
        for (const dir of resolvedPath) {
            currentContents = currentContents.childs[dir];
        }

        let match = Object.keys(currentContents.childs).find(entry => entry.toLowerCase() == part.toLowerCase());
        if (!match) {
            throw "no such file or directory: " + path;
        }

        resolvedPath.push(match);
    }

    let result = contents;
    for (const dir of resolvedPath) {
        result = result.childs[dir];
    }

    return result;
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
