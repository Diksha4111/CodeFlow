// Using js2flowchart library
importScripts('/dist/js2flowchart.js');

// Render flowchart based on the input code
self.onmessage = function(message) {
    var code = message.data.code;
    let svg = '',
        shouldUpdate = true;
    try {
        shouldUpdate = true;
        svg = js2flowchart.convertCodeToSvg(code);
    } catch (e) {
        shouldUpdate = false;
        console.log(e);
    } finally {
        shouldUpdate && self.postMessage({
            svg
        });
    }
};


