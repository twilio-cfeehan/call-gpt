require("colors");

const cfg = require("./config");

const express = require("express");
const ExpressWs = require("express-ws");

const { GptService } = require("./services/gpt-service-streaming");
//const { GptService } = require("./services/gpt-service-non-streaming");
const { TextService } = require("./services/text-service");
const { EndSessionService } = require("./services/end-session-service");

const customerProfiles = require("./data/personalization");

// Import helper functions
const {
  processUserInputForHandoff,
  handleLiveAgentHandoff,
  handleDtmfInput,
} = require("./functions/helper-functions");

const { app } = ExpressWs(express());
app.use(express.urlencoded({ extended: true })).use(express.json());

app.post("/incoming", (req, res) => {
  console.log(`[App.js] Incoming call webhook, callSid ${req.body?.CallSid}`);

  try {
    // Build the response for Twilio's <Connect><ConversationRelay> verb
    const response = `\
    <Response>
      <Connect action="https://voxray-6456.twil.io/live-agent-handoff">
        <ConversationRelay url="wss://${cfg.server}/sockets" ttsProvider="${cfg.ttsProvider}" voice="${cfg.ttsVoice}" dtmfDetection="true" interruptByDtmf="true" />
      </Connect>
    </Response>`;

    res.type("text/xml");
    res.send(response);
  } catch (err) {
    console.error(`[App.js] Error in /incoming route: ${err}`);
    res.status(500).send("Internal Server Error");
  }
});

app.ws("/sockets", (ws) => {
  try {
    ws.on("error", console.error);

    const gptService = new GptService();
    const endSessionService = new EndSessionService(ws);
    const textService = new TextService(ws);

    let interactionCount = 0;
    let awaitingUserInput = false;
    let userProfile = null;

    // Handle incoming messages from the WebSocket
    ws.on("message", async (data) => {
      try {
        const msg = JSON.parse(data);
        console.log(`[App.js] Message received: ${JSON.stringify(msg)}`);

        // Handle DTMF input
        if (msg.type === "dtmf" && msg.digit) {
          console.log("[App.js] DTMF input received, processing...");
          awaitingUserInput = false; // Allow new input processing
          interactionCount += 1;
          await handleDtmfInput(
            msg.digit,
            gptService,
            textService,
            interactionCount,
            userProfile
          );
          return;
        }

        if (awaitingUserInput) {
          console.log("[App.js] Awaiting user input, skipping new API call.");
          return;
        }

        if (msg.type === "setup") {
          // Extract information from the setup message
          const phoneNumber = msg.from; // Caller's phone number
          const smsSendNumber = msg.to; // Twilio's "to" number
          const callSid = msg.callSid; // Call SID for call controls

          // Store phone numbers and callSid in gptService
          gptService.setPhoneNumbers(smsSendNumber, phoneNumber);
          gptService.setCallSid(callSid);

          // Retrieve user profile based on phone number
          userProfile = customerProfiles[phoneNumber];

          // Set the user profile in gptService
          if (userProfile) {
            gptService.setUserProfile(userProfile);
          }

          // Generate a personalized greeting
          const greetingText = userProfile
            ? `Generate a warm, personalized greeting for ${userProfile.profile.firstName}, a returning prospect. Keep it brief, and use informal/casual language so you sound like a friend, not a call center agent.`
            : "Generate a warm greeting for a new potential prospect. Keep it brief, and use informal/casual language so you sound like a friend, not a call center agent.";

          // Send the greeting as a system prompt to the assistant
          await gptService.completion(greetingText, interactionCount, "system");

          interactionCount += 1;
        } else if (
          msg.type === "prompt" ||
          (msg.type === "interrupt" && msg.voicePrompt)
        ) {
          const trimmedVoicePrompt = msg.voicePrompt.trim();
          const shouldHandoff = await processUserInputForHandoff(
            trimmedVoicePrompt
          );

          if (shouldHandoff) {
            // Initiate live agent handoff
            handleLiveAgentHandoff(
              gptService,
              endSessionService,
              textService,
              userProfile,
              trimmedVoicePrompt
            );
            return; // Exit after handoff
          }

          // Process the user's voice prompt
          awaitingUserInput = true;
          await gptService.completion(trimmedVoicePrompt, interactionCount);
          interactionCount += 1;
        }
      } catch (error) {
        console.error(`[App.js] Error processing message: ${error}`);
      }
    });

    // Listen for assistant replies
    gptService.on(
      "gptreply",
      (gptReply, final, interactionCount, accumulatedText) => {
        textService.sendText(gptReply, final, accumulatedText);

        if (final) {
          awaitingUserInput = false; // Reset waiting state after final response
        }
      }
    );

    // Listen for session end events
    gptService.on("endSession", (handoffData) => {
      console.log(
        `[App.js] Received endSession event: ${JSON.stringify(handoffData)}`
      );
      endSessionService.endSession(handoffData);
    });
  } catch (err) {
    console.error(`[App.js] Error in WebSocket connection: ${err}`);
  }
});

app.listen(cfg.port, () => {
  console.log(`Server running on port ${cfg.port}`);
});
