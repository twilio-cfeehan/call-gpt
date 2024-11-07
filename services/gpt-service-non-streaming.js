const OpenAI = require("openai"); // or the appropriate module import
const EventEmitter = require("events");
const availableFunctions = require("../functions/available-functions");
const tools = require("../functions/function-manifest");
let prompt = require("../prompts/prompt");
//const welcomePrompt = require("../prompts/welcomePrompt");
const model = "gpt-4o";

const currentDate = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

prompt = prompt.replace("{{currentDate}}", currentDate);

class GptService extends EventEmitter {
  constructor() {
    super();
    this.openai = new OpenAI();
    this.userContext = [
      { role: "system", content: prompt },
      // Only do this if you're going to use the WelcomePrompt in VoxRay config
      // {
      //   role: "assistant",
      //   content: `${welcomePrompt}`,
      // },
    ];
    this.smsSendNumber = null; // Store the "To" number (Twilio's "from")
    this.phoneNumber = null; // Store the "From" number (user's phone)
  }

  // Arrow function for getTtsMessageForTool, so it can access `this`
  getTtsMessageForTool = (toolName) => {
    const name = this.userProfile?.profile?.firstName
      ? this.userProfile.profile.firstName
      : ""; // Get the user's name if available

    const nameIntroOptions = name
      ? [
          `Sure ${name},`,
          `Okay ${name},`,
          `Alright ${name},`,
          `Got it ${name},`,
          `Certainly ${name},`,
        ]
      : ["Sure,", "Okay,", "Alright,", "Got it,", "Certainly,"];

    const randomIntro =
      nameIntroOptions[Math.floor(Math.random() * nameIntroOptions.length)];

    let message;

    switch (toolName) {
      case "listAvailableApartments":
        message = `${randomIntro} let me check on the available apartments for you.`;
        break;
      case "checkExistingAppointments":
        message = `${randomIntro} I'll look up your existing appointments.`;
        break;
      case "scheduleTour":
        message = `${randomIntro} I'll go ahead and schedule that tour for you.`;
        break;
      case "checkAvailability":
        message = `${randomIntro} let me verify the availability for the requested time.`;
        break;
      case "commonInquiries":
        message = `${randomIntro} one moment.`;
        break;
      case "sendAppointmentConfirmationSms":
        message = `${randomIntro} I'll send that SMS off to you shortly, give it a few minutes and you should see it come through.`;
        break;
      case "liveAgentHandoff":
        message = `${randomIntro} that may be a challenging topic to discuss, so I'm going to get you over to a live agent so they can discuss this with you, hang tight.`;
        break;
      case "complexRequest":
        message = `${randomIntro} that's a bit of a complex request, gimme just a minute to try to sort that out.`;
        break;
      default:
        message = `${randomIntro} give me a moment while I fetch the information.`;
        break;
    }

    // Log the message to the userContext in gptService
    this.updateUserContext("assistant", message);

    return message; // Return the message for TTS
  };

  setUserProfile(userProfile) {
    this.userProfile = userProfile;
    if (userProfile) {
      const { firstName } = userProfile.profile;
      const historySummaries = userProfile.conversationHistory
        .map(
          (history) =>
            `On ${history.date}, ${firstName} asked: ${history.summary}`
        )
        .join(" ");
      // Add the conversation history to the system context
      this.userContext.push({
        role: "system",
        content: `${firstName} has had previous interactions. Conversation history: ${historySummaries}`,
      });
    }
  }

  // Method to store the phone numbers from app.js
  setPhoneNumbers(smsSendNumber, phoneNumber) {
    this.smsSendNumber = smsSendNumber;
    this.phoneNumber = phoneNumber;
  }

  // Method to retrieve the stored numbers (can be used in the function calls)
  getPhoneNumbers() {
    return { to: this.smsSendNumber, from: this.phoneNumber };
  }
  // Store call SID from app.js
  setCallSid(callSid) {
    this.callSid = callSid;
  }

  // Retrieve call SID
  getCallSid() {
    return { callSid: this.callSid };
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  updateUserContext(role, text) {
    this.userContext.push({ role: role, content: text });
  }

  async summarizeConversation() {
    const summaryPrompt = "Summarize the conversation so far in 2-3 sentences.";

    // // Log the full userContext before making the API call
    // console.log(
    //   `[GptService] Full userContext: ${JSON.stringify(
    //     this.userContext,
    //     null,
    //     2
    //   )}`
    // );

    // // Validate and log each message in userContext
    // this.userContext.forEach((message, index) => {
    //   if (typeof message.content !== "string") {
    //     console.error(
    //       `[GptService] Invalid content type at index ${index}: ${JSON.stringify(
    //         message
    //       )}`
    //     );
    //   } else {
    //     console.log(
    //       `[GptService] Valid content at index ${index}: ${message.content}`
    //     );
    //   }
    // });

    const summaryResponse = await this.openai.chat.completions.create({
      model: model,
      messages: [
        ...this.userContext,
        { role: "system", content: summaryPrompt },
      ],
      stream: false, // Non-streaming
    });

    const summary = summaryResponse.choices[0]?.message?.content || "";
    return summary;
  }

  async completion(
    text,
    interactionCount,
    role = "user",
    dtmfTriggered = false
  ) {
    if (!text || typeof text !== "string") {
      this.log(`[GptService] Invalid prompt received: ${text}`);
      return;
    }

    this.updateUserContext(role, text);

    try {
      // Streaming is disabled explicitly
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: this.userContext,
        tools: tools, // Include the tools, so the model knows what functions are available
        stream: false, // Always non-streaming
      });

      // Handle tool calls if detected
      const toolCalls = response.choices[0]?.message?.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        this.log(`[GptService] Tool calls length: ${toolCalls.length} tool(s)`);

        const toolResponses = [];
        let systemMessages = [];
        let ttsMessage = ""; // Placeholder for TTS message

        for (const toolCall of toolCalls) {
          this.log(
            `[GptService] Tool call function: ${toolCall.function.name}`
          );

          const functionName = toolCall.function.name;
          let functionArgs = JSON.parse(toolCall.function.arguments);
          const functionToCall = availableFunctions[functionName];

          let function_call_result_message;

          if (functionToCall) {
            this.log(
              `[GptService] Calling function ${functionName} with arguments: ${JSON.stringify(
                functionArgs
              )}`
            );

            // If there's more than one tool call, use a general TTS message
            if (toolCalls.length > 1) {
              ttsMessage = "Let me handle a few things for you, one moment.";
            } else {
              // For a single tool call, use the specific message
              const functionName = toolCalls[0].function.name;
              ttsMessage = this.getTtsMessageForTool(functionName);
            }

            // Inject phone numbers if it's the SMS function
            if (functionName === "sendAppointmentConfirmationSms") {
              const phoneNumbers = this.getPhoneNumbers();
              functionArgs = { ...functionArgs, ...phoneNumbers };
            }

            // Inject callSid for call controls
            if (toolCall.functionName === "endCall") {
              functionArgs = { ...functionArgs, ...this.getCallSid() };
            }
            const functionResponse = await functionToCall(functionArgs);

            function_call_result_message = {
              role: "tool",
              content: JSON.stringify(functionResponse),
              tool_call_id: toolCall.id,
            };

            // Check if specific tool calls require additional system messages
            if (functionName === "listAvailableApartments") {
              systemMessages.push({
                role: "system",
                content:
                  "Do not use asterisks (*) under any circumstances in this response. Summarize the available apartments in a readable format.",
              });
            }

            // Personalize system messages based on user profile during relevant tool calls
            if (functionName === "checkAvailability" && this.userProfile) {
              const { firstName, moveInDate } = this.userProfile.profile;
              systemMessages.push({
                role: "system",
                content: `When checking availability for ${firstName}, remember that they are looking to move in on ${moveInDate}.`,
              });
            }

            if (functionName === "scheduleTour" && functionResponse.available) {
              // Inject a system message to ask about SMS confirmation
              systemMessages.push({
                role: "system",
                content:
                  "If the user agrees to receive an SMS confirmation, immediately trigger the 'sendAppointmentConfirmationSms' tool with the appointment details and the UserProfile. Do not ask for their phone number or any other details from the user. Do not call the 'scheduleTour' function again.",
              });
            }

            // Check if the tool call is for the 'liveAgentHandoff' function
            if (functionName === "liveAgentHandoff") {
              // Proceed with summarizing the conversation, including the latest messages
              // Introduce a delay before summarizing the conversation
              setTimeout(async () => {
                const conversationSummary = await this.summarizeConversation();

                this.emit("endSession", {
                  reasonCode: "live-agent-handoff",
                  reason: functionResponse.reason,
                  conversationSummary: conversationSummary,
                });

                // Log the emission for debugging
                this.log(
                  `[GptService] Emitting endSession event with reason: ${functionResponse.reason}`
                );
              }, 3000); // 3-second delay

              // Log the emission for debugging
              this.log(
                `[GptService] Emitting endSession event with reason: ${functionResponse.reason}`
              );
            }

            // Push the tool response to be used in the final completion call
            toolResponses.push(function_call_result_message);
          } else {
            this.log(
              `[GptService] No available function found for ${functionName}`
            );
          }
        }

        // Emit a single TTS message after processing all tool calls
        if (!dtmfTriggered && ttsMessage) {
          this.emit("gptreply", ttsMessage, true, interactionCount);
        }

        // Prepare the chat completion call payload with the tool result
        const completion_payload = {
          model: model,
          messages: [
            ...this.userContext,
            ...systemMessages, // Inject dynamic system messages when relevant
            response.choices[0].message, // the tool_call message
            ...toolResponses, // The result of the tool calls
          ],
        };

        // // Log the payload to the console
        // console.log(
        //   `[GptService] Completion payload: ${JSON.stringify(
        //     completion_payload,
        //     null,
        //     2
        //   )}`
        // );

        // Call the API again to get the final response after tool processing
        const finalResponse = await this.openai.chat.completions.create({
          model: completion_payload.model,
          messages: completion_payload.messages,
          stream: false, // Always non-streaming
        });

        const finalContent = finalResponse.choices[0]?.message?.content || "";
        this.userContext.push({
          role: "assistant",
          content: finalContent,
        });

        // Emit the final response to the user
        this.emit(
          "gptreply",
          finalContent,
          true,
          interactionCount,
          finalContent
        );
        return; // Exit after processing the tool call
      } else {
        // If no tool call is detected, emit the final completion response
        const finalResponse = response.choices[0]?.message?.content || "";
        if (finalResponse.trim()) {
          this.userContext.push({
            role: "assistant",
            content: finalResponse,
          });
          this.emit(
            "gptreply",
            finalResponse,
            true,
            interactionCount,
            finalResponse
          );
        }
      }
    } catch (error) {
      this.log(`[GptService] Error during completion: ${error.stack}`);

      // Friendly response for any error encountered
      const friendlyMessage =
        "I apologize, that request might have been a bit too complex. Could you try asking one thing at a time? I'd be happy to help step by step!";

      // Emit the friendly message to the user
      this.emit("gptreply", friendlyMessage, true, interactionCount);

      // Push the message into the assistant context
      this.updateUserContext("assistant", friendlyMessage);

      return; // Stop further processing
    }
  }
}
module.exports = { GptService };
