/* inspired by https://gist.github.com/1129031 */
/*global document, DOMParser*/

(function(DOMParser) {
    "use strict";

    const proto = DOMParser.prototype;
    const nativeParse = proto.parseFromString;

    // Check if the browser already supports text/html parsing
    try {
        // WebKit (Safari/Chrome) returns null on unsupported types, Firefox/Opera/IE throw errors
        if ((new DOMParser()).parseFromString("", "text/html")) {
            // text/html parsing is natively supported
            return;
        }
    } catch (ex) {
        // Continue to implement the polyfill if an error is thrown
    }

    // Overriding the native parseFromString method
    proto.parseFromString = function(markup, type) {
        if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
            // Create a new HTML document
            const doc = document.implementation.createHTMLDocument("");

            // Check if the markup contains a doctype
            if (markup.toLowerCase().indexOf('<!doctype') > -1) {
                doc.documentElement.innerHTML = markup;
            } else {
                doc.body.innerHTML = markup;
            }
            return doc;
        } else {
            // For other types, use the native parseFromString method
            return nativeParse.apply(this, arguments);
        }
    };
}(DOMParser));
