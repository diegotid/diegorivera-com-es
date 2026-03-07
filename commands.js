/**
 * commands.js
 * 
 * Author: Diego Rivera
 * git@diegorivera.com.es
 * 
 * Shell terminal commands
 */

async function ls(args) {

    var originalPath;
    if (args[0] && args[0].trim().indexOf("-") != 0) {
        originalPath = [...currentPath];
        try {
            await changeDir(args[0]);
        } catch (error) {
            showDisplay(error);
            showPrompt();
            return;
        }
    }
    var contents = await getCurentPathContents();
    var list = "total " + Object.keys(contents.childs).length + "<br/>";
    list += lsLine(".", contents);
    list += lsLine("..", contents);
    for (const child in contents.childs) {
        try {
            list += lsLine(child, contents.childs[child]);
        } catch (e) {
            console.log(e)
        }
    }
    if (!!originalPath) {
        currentPath = originalPath;
    }
    showDisplay(list);
    showPrompt();
}

async function cd(args, options = {}) {

    let updateLocation = options.updateLocation !== false;
    let replaceLocation = options.replaceLocation === true;

    if (args.length == 0 || args[0].trim() == "~") {
        currentPath = [];
        if (updateLocation) {
            syncWindowLocation(replaceLocation);
        }
    } else {
        try {
            await changeDir(args[0]);
            if (updateLocation) {
                syncWindowLocation(replaceLocation);
            }
        } catch (error) {
            showDisplay(error);
        }
    }
    showPrompt();
}

function pwd() {

    showDisplay("/" + currentPath.join("/"));
    showPrompt();
}

async function open(args) {

    if (args.length == 0 || !args[0].trim()) {
        showDisplay("usage: open [entry]");
        showPrompt();
        return;
    }

    try {
        await openEntry(args[0].trim());
    } catch (error) {
        showDisplay(error);
        showPrompt();
    }
}

function help() {

    let help = "<b>ls</b> [dir] -- list [dir] (current directory if not specified) contents<br/>"
            + "<b>cd</b> [dir] -- change directory to [dir] (home if not specified)<br/>"
            + "<b>pwd</b> -- print the current working directory<br/>"
            + "<b>open</b> [entry] -- open [entry] in the web browser<br/>"
            + "<b>./[entry]</b> -- shortcut to open [entry] in the web browser<br/>";
    showDisplay(help);
    showPrompt();
}
