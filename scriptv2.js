var json;
fetch("data.json").then(v => v.json()).then(v => {
    json = v;
f("Mache eine Überweisung");

});

/**
 * 
 * @param {string} input 
 */
function f(input) {
    input = input.split(" ");
    let probabilities = [];
    json.forEach(element => {
        let p = 0;
        input.forEach(word => {
            if (element.keywords.includes(word)) {
                p++;
            }
        });
        probabilities.push(p);
    });
    console.log(probabilities);
}
