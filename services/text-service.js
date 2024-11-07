// text-service.js

const EventEmitter = require("events");

class TextService extends EventEmitter {
  constructor(websocket) {
    super();
    this.ws = websocket;
  }

  sendText(text, last, fullText = null) {
    this.ws.send(
      JSON.stringify({
        type: "text",
        token: text,
        last: last,
      })
    );
    if (last && fullText) {
      console.log("[TextService] Final Utterance:", fullText);
    }
  }
}

module.exports = { TextService };
