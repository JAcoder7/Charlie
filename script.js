let chatHistory = document.querySelector("#chatHistory");
let input = document.querySelector("#input");
input.focus();

let xml = null;
fetch("data.xml").then(v => v.text()).then(v => {
    xml = (new DOMParser()).parseFromString(v, "text/xml");
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
        evaluate(v.split(" "), xml.documentElement, {}, v);
    });
}
begin("Wie kann ich dir helfen?")

/**
 * 
 * @param {string[]} input 
 * @param {Element} node 
 * @returns 
 */
function evaluate(input, node, vars, original) {
    if (input.length == 0) {
        let a = node.querySelector("& > answer");
        let f = node.querySelector("& > function");
        if (a != null) {
            answer(a.innerHTML.replaceAll("\n","<br>"));
            begin();
        } else if (f != null) {
            window[f.innerHTML](vars, original);
        } else {
            if (node.hasAttribute("else")) {
                answer(node.getAttribute("else"));
            } else {
                answer("Ich habe dich leider nicht verstanden.");
            }
            begin();
        }
        return;
    }

    let childs = Array.from(node.children);
    for (const element of childs) {
        if (levenshteinDistance(element.tagName, input[0]) / element.tagName.length < 0.4) {
            if (element.hasAttribute("goto")) {
                console.log(selectXPath(node, element.getAttribute("goto")));
                evaluate(input.slice(1), selectXPath(node, element.getAttribute("goto"))[0], vars, original);
            } else {
                evaluate(input.slice(1), element, vars, original);
            }
            return;
        } else if (element.tagName == "var") {
            vars[element.getAttribute("name")] = input[0];
            evaluate(input.slice(1), element, vars, original)
            return;
        }
    }

    if (node.hasAttribute("else")) {
        answer(node.getAttribute("else"));
    } else {
        evaluate([], node, vars, original)
        //answer("Ich habe dich leider nicht verstanden.");
    }
    begin();
}


function selectXPath(element, expression) {
    let result = element.ownerDocument.evaluate(expression, element, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    let nodes = []
    for (let i = 0; i < result.snapshotLength; i++) {
        nodes.push(result.snapshotItem(i));
    }
    return nodes;
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



async function uberweisung(vars, input) {
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