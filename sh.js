/**
 * sh.js
 * 
 * Author: Diego Rivera
 * git@diegorivera.com.es
 * 
 * Shell terminal functions
 */

window.onload = () => {
    document.querySelector('#terminal').appendChild(getPrompt());
} 

function getPrompt() {

    var promptRow = document.createElement('div');
    var promptLabel = document.createElement('label');
    var promptInput = document.createElement('input');
    promptRow.classList.add('prompt')
    promptLabel.textContent = '$';
    promptInput.setAttribute('autofocus', true);
    promptRow.appendChild(promptLabel);
    promptRow.appendChild(promptInput);

    return promptRow;
} 