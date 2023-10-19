let chatHistory = document.querySelector("#chatHistory");
let input = document.querySelector("#input");
input.focus();

var json;
fetch("data.json").then(v => v.json()).then(v => {
    json = v;
    evaluate("Mache eine Überweisung");
});

function answer(text, mode = "left", color) {
    let bubble = document.createElement("div");
    bubble.innerHTML = `<span>${text}</span>`;
    bubble.classList.add(mode);
    if (color != undefined) {
        bubble.style.backgroundColor = color;
    }
    chatHistory.append(bubble);
    chatHistory.scrollTo(0, chatHistory.scrollHeight);
}

async function ask(text) {
    if (text) {
        answer(text);
    }
    return new Promise((resolve, reject) => {
        let keydown = e => {
            if (e.key == "Enter" && input.value != "") {
                resolve(input.value);
                answer(input.value, "right");
                input.value = "";
                input.removeEventListener("keyup", keydown);
            }
        }
        input.addEventListener("keyup", keydown)
    })
}

function begin(t) {
    ask(t).then(v => {
        v = v.toLowerCase();
        evaluate(v);
    });
}
begin("Wie kann ich dir helfen?")

/**
 * 
 * @param {string} input 
 */

function evaluate(input) {
    let words = input.toLocaleLowerCase();
    words = words.split(" ");
    let probabilities = [];
    json.forEach(element => {
        let p = 0;
        words.forEach(word => {
            if (levenshteinIncludes(element.keywords, word, 0.3)) {
                p++;
            }
        });
        probabilities.push(p);
    });
    let max = Math.max(...probabilities);
    let index = probabilities.indexOf(max);

    if (max > 0) {
        if (json[index].answer != undefined) {
            answer(json[index].answer);
        } else if (json[index].function != undefined) {
            window[json[index].function](input);
        }
        begin();
    } else {
        begin("Ich habe dich leider nicht verstanden.");
    }
    console.log(json[index]);
}


function levenshteinIncludes(array, searchElement, maxProb) {
    let incl = false;
    array.forEach(element => {
        if (levenshteinDistance(element, searchElement) / element.length < maxProb) {
            incl = true;
        }
    });
    return incl;
}

const levenshteinDistance = (str1 = '', str2 = '') => {
    const track = Array(str2.length + 1).fill(null).map(() =>
        Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) {
        track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
        track[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j += 1) {
        for (let i = 1; i <= str1.length; i += 1) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1, // deletion
                track[j - 1][i] + 1, // insertion
                track[j - 1][i - 1] + indicator, // substitution
            );
        }
    }
    return track[str2.length][str1.length];
};

async function uberweisung(input,vars={}) {
    let iban = vars["iban"];
    if (iban == undefined) {
        iban = await ask("An welche IBAN wollen Sie überweisen?");
    }
    let betrag = vars["betrag"];
    if (betrag == undefined) {
        betrag = await ask("Welchen Betrag wollen Sie überweisen?");
    }
    if (confirm(`Wollen Sie wirklich ${betrag} an ${iban} überweisen?\nDAS ÜBERWEISEN VON GELD IST UNWIEDERUFLICH!`)) {
        answer(`Es wurden <b>${betrag}</b> an <b>${iban}</b> überwiesen.`, undefined, "red")
    } else {
        answer("Die Überweisung wurde abgebrochen.")
    }
    begin();
}