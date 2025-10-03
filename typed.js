const phrase = 
 "Welcome to Campus Events & Ticketing"
;

const typewriter = document.getElementById("typed");
let letterIndex = 0;

function type() {
    if (letterIndex < phrase.length) {
    typewriter.textContent += phrase.charAt(letterIndex);
    letterIndex++;
    setTimeout(type, 100); 
    } else{
        showButtons();
    }
}

function showButtons(){
    const buttonRow = document.querySelector('.button-row');
    const buttons = buttonRow.querySelectorAll('button');
    buttonRow.classList.add('show');
    buttons.forEach((btn, i) => {
        setTimeout(() => {
            btn.style.opacity = 1;
        }, i * 600);
    });
}


document.addEventListener("DOMContentLoaded", type);