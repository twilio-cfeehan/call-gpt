const EventEmitter = require("events");

class EndSessionService extends EventEmitter {
  constructor(websocket) {
    super();
    this.ws = websocket;
  }

  // Method to end the session with handoff data
  endSession(handoffData) {
    const endSessionMessage = {
      type: "end",
      // Stringify the HandoffData content, which is an object
      handoffData: JSON.stringify(handoffData), // This ensures it's a string as per the API requirements
    };

    console.log(
      "[EndSessionService] Ending session with data: ",
      endSessionMessage
    );

    // Send the entire end session message, with handoffData properly formatted
    this.ws.send(JSON.stringify(endSessionMessage));
  }
}

module.exports = { EndSessionService };
