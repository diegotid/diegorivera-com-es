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

    let dir = decodeURIComponent(window.location.pathname).replace(/^(\/)/,"");
    if (dir.length > 0 && dir.indexOf(".") == -1) {
        await cd([dir], { replaceLocation: true });
        return;
    }

    await cd([], { replaceLocation: true });
}

document.addEventListener("keydown", async (event) => {

    if (event.key != 'Tab') {
        return;
    }

    let entries = document.querySelectorAll('input');
    let prompt = [].slice.call(entries).pop();
    if (!prompt || prompt.readOnly) {
        return;
    }

    event.preventDefault();

    let completed = await autocompleteInput(prompt.value);
    if (!!completed && completed != prompt.value) {
        prompt.value = completed;
        currentCommand = prompt.value;
        prompt.setSelectionRange(prompt.value.length, prompt.value.length);
    }
});

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

function syncWindowLocation(replaceLocation) {

    let path = currentPath.length > 0
        ? "/" + currentPath.map(dir => encodeURIComponent(dir)).join("/")
        : "/";

    if (replaceLocation) {
        window.history.replaceState(null, "", path);
        return;
    }

    window.history.pushState(null, "", path);
}

async function changeDir(to) {

    if (to.indexOf("/") == 0) {
        currentPath = [];
    }

    var contents = await getCurentPathContents();
    let path = to.split("/").filter(part => part.length > 0);
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

async function autocompleteInput(input) {

    if (!input || input.trim().length == 0) {
        return input;
    }

    if (input.indexOf("./") == 0) {
        return await autocompletePathInput("./", input.substring(2));
    }

    let parts = input.split(" ");
    if (parts.length == 1 && input[input.length - 1] != " ") {
        return autocompleteCommand(parts[0]);
    }

    let command = parts.shift();
    if (command == "cd" || command == "open" || command == "ls") {
        let hasTrailingSpace = input[input.length - 1] == " ";
        let pathInput = parts.join(" ");
        if (hasTrailingSpace) {
            pathInput += " ";
        }
        return command + " " + await autocompletePath(pathInput);
    }

    return input;
}

function autocompleteCommand(commandInput) {

    let commands = ["help", "ls", "cd", "pwd", "open"];
    let matches = commands.filter(command => command.indexOf(commandInput.toLowerCase()) == 0);
    if (matches.length == 0) {
        return commandInput;
    }
    if (matches.length == 1) {
        return matches[0] + " ";
    }

    return getLongestCommonPrefix(matches, commandInput);
}

async function autocompletePathInput(prefix, pathInput) {

    return prefix + await autocompletePath(pathInput);
}

async function autocompletePath(pathInput) {

    let originalInput = pathInput;
    let normalizedInput = pathInput.trim();
    let endsWithSlash = normalizedInput.length > 0 && normalizedInput[normalizedInput.length - 1] == "/";
    let pathParts = normalizedInput.split("/").filter(part => part.length > 0);
    let searchTerm = endsWithSlash ? "" : (pathParts.pop() || "");
    let baseParts = normalizedInput.indexOf("/") == 0 ? [] : [...currentPath];

    try {
        for (const part of pathParts) {
            if (part == ".") {
                continue;
            }
            if (part == "..") {
                baseParts.pop();
                continue;
            }
            let match = await findMatchingEntry(baseParts, part);
            if (!match || !match.content.childs) {
                return originalInput;
            }
            baseParts.push(match.name);
        }

        let matches = await listMatchingEntries(baseParts, searchTerm);
        if (matches.length == 0) {
            return originalInput;
        }

        let completedName = matches.length == 1
            ? matches[0].name + (matches[0].content.childs ? "/" : "")
            : getLongestCommonPrefix(matches.map(match => match.name), searchTerm);

        let prefix = normalizedInput.indexOf("/") == 0 ? "/" : "";
        let completedParts = [...pathParts];
        if (completedName.length > 0) {
            completedParts.push(completedName);
        }

        let completedPath = prefix + completedParts.join("/");
        if (normalizedInput == "" && matches.length == 1 && matches[0].content.childs) {
            return completedName;
        }
        if (completedPath.length == 0 && originalInput.indexOf("/") == 0) {
            return "/";
        }

        return completedPath;
    } catch (error) {
        return originalInput;
    }
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

async function listMatchingEntries(baseParts, searchTerm) {

    let contents = await getContentsTree();
    for (const dir of baseParts) {
        contents = contents.childs[dir];
    }

    return Object.keys(contents.childs)
        .filter(entry => entry.toLowerCase().indexOf(searchTerm.toLowerCase()) == 0)
        .map(entry => ({ name: entry, content: contents.childs[entry] }));
}

async function findMatchingEntry(baseParts, entryName) {

    let matches = await listMatchingEntries(baseParts, entryName);
    return matches.find(match => match.name.toLowerCase() == entryName.toLowerCase());
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

function getLongestCommonPrefix(values, fallback) {

    if (values.length == 0) {
        return fallback;
    }

    let prefix = values[0];
    for (const value of values.slice(1)) {
        while (value.toLowerCase().indexOf(prefix.toLowerCase()) != 0 && prefix.length > 0) {
            prefix = prefix.substring(0, prefix.length - 1);
        }
    }

    return prefix.length >= fallback.length ? prefix : fallback;
}

function formatShortDate(date) {

    const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    let day = String(date.getDate()).padStart(2, "0");

    return day + " " + months[date.getMonth()] + " " + date.getFullYear();
}

function lsLine(name, content) {

    let d = !!content.childs ? "d" : "-";
    let x = !!content.data.link || !!content.childs ? "x" : "-";
    let date = new Date(content.data.date);

    if (!!content.data.link) {
        name = "<a href=\"" + content.data.link + "\" target=\"_blank\" onclick=\"onFollowLink('" + name + "')\">" + name + "</a>";
    }

    return d + "r-" + x + "r-" + x + "r-" + x + "&nbsp;diego&nbsp;staff&nbsp;" + formatShortDate(date) +  "&nbsp;" + name + "<br/>";
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
