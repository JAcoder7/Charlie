let chatHistory = document.querySelector("#chatHistory");
let input = document.querySelector("#input");
input.focus();

var userdata = {
    money: 4807
}

var json;
fetch("data.json").then(v => v.json()).then(v => {
    json = v;
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

async function ask(text, type = "text") {
    if (text) {
        answer(text);
    }
    input.type = type;
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
    let words = input.toLowerCase().split(" ");
    input = input.toLowerCase();
    let probabilities = [];
    json.forEach(element => {
        let bestP = 0;
        for (const keyword of element.keywords) {
            let p = 0;

            words.forEach(word => {
                let incl = levenshteinIncludes(keyword.replaceAll("*", "").toLowerCase().split(" "), word, 0.3);
                if (incl[0]) {
                    let key = keyword.toLowerCase().split(" ")[incl[1]];
                    let a = 1;
                    while (key.startsWith("*")) {
                        key = key.substring(1);
                        a++;
                    }

                    p += a;
                }
            });
            if (bestP < p) {
                bestP = p;
            }
        }
        probabilities.push(bestP);
    });
    let max = Math.max(...probabilities);
    let index = probabilities.indexOf(max);

    if (max > 3) {
        if (json[index].answer != undefined) {
            if (json[index].answer.constructor == [].constructor) {
                answer(json[index].answer[Math.floor(Math.random() * json[index].answer.length)]);
            } else {
                answer(json[index].answer);
            }
            begin();
        } else if (json[index].function != undefined) {
            window[json[index].function](input);
        }
    } else {
        let answers = [
            "Ich habe Sie leider nicht verstanden.",
            "Ich habe Ihre Frage leider nicht verstanden.",
            "Ich konnte Ihre Aussage leider nicht nachvollziehen.",
            "Ihre Aussage war für mich leider unklar.",
            "Damit kann ich ihnen leider nicht helfen."
        ]
        begin(answers[Math.floor(Math.random() * answers.length)]);
    }
    console.log(json[index]);
}

//#region levenshtein
function levenshteinIncludes(array, searchElement, maxProb) {
    let incl = false;
    for (let i = 0; i < array.length; i++) {
        const element = array[i];

        if (levenshteinDistance(element, searchElement) / element.length < maxProb) {
            return [true, i];
        }
    }

    return [false, -1];
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
//#endregion

async function uberweisung(input) {
    let words = input.split(" ");
    words = words.filter(v => v != "mein" && v != "meine" && v != "meinen");

    answer("Gerne, ich kann Ihnen beim Überweisungsprozess assistieren!")
    let iban = null;
    if (words.includes("an")) {
        iban = words[words.indexOf("an") + 1];
        if (!/\d/.test(iban)) {
            iban = await ask(`Wie lautet die IBAN vom Kontakt "${iban}"?`);
            while (!/\d/.test(iban)) {
                switch (Math.floor(Math.random() * 3)) {
                    case 0:
                        iban = await ask("Das ist keine valide IBAN. Bitte geben Sie die IBAN an, an die Sie überweisen wollen.");
                        break;
                    case 1:
                        iban = await ask("Bitte geben Sie eine valide IBAN an.");
                        break;
                    case 2:
                        iban = await ask("Diese IBAN ist leider nicht valide. Bitte geben Sie eine valide IBAN an, an die Sie überweisen wollen.");
                        break;
                    default:
                        iban = await ask("Das ist keine valide IBAN. Bitte geben Sie die IBAN an, an die Sie überweisen wollen.");
                        break;
                }
            }
        } else {
            if ((await ask(`Wollen Sie an die IBAN <b>${iban}</b> überweisen? (Ja/Nein)`)).toLowerCase() != "ja") {
                iban = await ask("An welche IBAN wollen Sie Geld überweisen?");
            }
        }
    } else {
        iban = await ask("An welche IBAN wollen Sie überweisen?");
    }

    let betrag = words.find(v => (v.includes("€") && v != "€") || (v.includes("euro") && v != "euro"));
    if (betrag == undefined || betrag == "" || betrag == "€") {
        if (words.includes("euro")) {
            betrag = words[words.indexOf("euro") - 1];
        } else if (words.includes("€")) {
            betrag = words[words.indexOf("€") - 1];
        } else {
            betrag = await ask("Welchen Betrag in Euro wollen Sie überweisen?", "number");
        }
    }
    betrag = betrag.replaceAll("€", "");
    betrag = betrag.replaceAll("euro", "");
    console.log(betrag);
    betrag = Number(betrag);
    while (betrag > userdata.money) {
        betrag = await ask(`Der Betrag von ${betrag}€ übersteigt Ihren aktuellen Kontostand von ${userdata.money}€.<br>Wie viel Geld wollen Sie überweisen?`, "number");
    }

    if (confirm(`Wollen Sie wirklich ${betrag}€ an ${iban} überweisen?\nDas Überweisen von Geld ist unwiderruflich!`)) {
        answer(`Es wurden <b>${betrag}€</b> an die IBAN <b>${iban}</b> überwiesen.`, undefined, "#7f7f7f");
        userdata.money -= betrag;
    } else {
        answer("Die Überweisung wurde abgebrochen.")
    }
    begin();
}

function kontostand(input) {
    answer(`Ihr aktueller Kontostand liegt bei <b>${userdata.money}€.</b>`)
    begin()
}