// Import necessary modules
const OpenAI = require("openai");
const EventEmitter = require("events");
const availableFunctions = require("../functions/available-functions");
const tools = require("../functions/function-manifest");
let prompt = require("../prompts/prompt");
const model = "gpt-4o-mini";

// Import helper functions
const {
  generateMockDatabase,
  getTtsMessageForTool,
} = require("../functions/helper-functions");

// Set current date for prompt
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
    this.userContext = [{ role: "system", content: prompt }];
    this.smsSendNumber = null;
    this.phoneNumber = null;
    this.callSid = null;
    this.userProfile = null;

    // Generate dynamic mock database
    this.mockDatabase = generateMockDatabase();

    // No need to bind methods as helper functions are now imported
  }

  // Set user profile and update context with conversation history
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
      this.userContext.push({
        role: "system",
        content: `${firstName} has had previous interactions. Conversation history: ${historySummaries}`,
      });
    }
  }

  // Store phone numbers from app.js
  setPhoneNumbers(smsSendNumber, phoneNumber) {
    this.smsSendNumber = smsSendNumber;
    this.phoneNumber = phoneNumber;
  }

  // Retrieve stored numbers
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

  // Logging utility
  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  // Update user context
  updateUserContext(role, content) {
    this.userContext.push({ role, content });
  }

  // Summarize conversation
  async summarizeConversation() {
    const summaryPrompt = "Summarize the conversation so far in 2-3 sentences.";
    const summaryResponse = await this.openai.chat.completions.create({
      model,
      messages: [
        ...this.userContext,
        { role: "system", content: summaryPrompt },
      ],
    });
    return summaryResponse.choices[0]?.message?.content || "";
  }

  // Main completion method
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
      const response = await this.openai.chat.completions.create({
        model,
        messages: this.userContext,
        tools,
        stream: true,
      });

      let toolCalls = {};
      let functionCallResults = [];
      let contentAccumulator = "";
      let finalMessageObject = {
        role: "assistant",
        content: null,
        tool_calls: [],
        refusal: null,
      };
      let currentToolCallId = null;

      for await (const chunk of response) {
        const { choices } = chunk;

        // Handle tool calls
        if (choices[0]?.delta?.tool_calls) {
          const toolCall = choices[0].delta.tool_calls[0];
          if (toolCall.id && toolCall.id !== currentToolCallId) {
            const isFirstToolCall = currentToolCallId === null;
            currentToolCallId = toolCall.id;

            if (!toolCalls[currentToolCallId]) {
              if (choices[0]?.delta?.content) {
                this.emit(
                  "gptreply",
                  choices[0].delta.content,
                  true,
                  interactionCount,
                  contentAccumulator
                );
              } else {
                this.emit(
                  "gptreply",
                  "",
                  true,
                  interactionCount,
                  contentAccumulator
                );
              }

              if (contentAccumulator.length > 0 && isFirstToolCall) {
                this.userContext.push({
                  role: "assistant",
                  content: contentAccumulator.trim(),
                });

                // // Emit TTS message related to the tool call
                // if (!dtmfTriggered) {
                //   const ttsMessage = getTtsMessageForTool(
                //     toolCall.functionName,
                //     this.userProfile,
                //     this.updateUserContext.bind(this)
                //   );
                //   this.emit(
                //     "gptreply",
                //     ttsMessage,
                //     true,
                //     interactionCount,
                //     ttsMessage
                //   );
                // }
              }

              toolCalls[currentToolCallId] = {
                id: currentToolCallId,
                functionName: toolCall.function.name,
                arguments: "",
              };

              this.log(
                `[GptService] Detected new tool call: ${toolCall.function.name}`
              );
            }
          }
        }

        // Finish reason is 'tool_calls'
        if (choices[0]?.finish_reason === "tool_calls") {
          this.log(`[GptService] All tool calls have been completed`);
          const systemMessages = [];

          // Process each tool call
          for (const toolCallId in toolCalls) {
            const toolCall = toolCalls[toolCallId];
            let parsedArguments;
            try {
              parsedArguments = JSON.parse(toolCall.arguments);
            } catch {
              parsedArguments = toolCall.arguments;
            }
            // Log the function name and arguments after collecting all arguments
            this.log(
              `[GptService] Tool call function: ${toolCall.functionName}`
            );
            this.log(
              `[GptService] Calling function ${
                toolCall.functionName
              } with arguments: ${JSON.stringify(parsedArguments)}`
            );
            finalMessageObject.tool_calls.push({
              id: toolCall.id,
              type: "function",
              function: {
                name: toolCall.functionName,
                arguments: JSON.stringify(parsedArguments),
              },
            });

            // Inject phone numbers for SMS function
            if (toolCall.functionName === "sendAppointmentConfirmationSms") {
              parsedArguments = {
                ...parsedArguments,
                ...this.getPhoneNumbers(),
              };
            }

            // Inject callSid for call controls
            if (toolCall.functionName === "endCall") {
              parsedArguments = { ...parsedArguments, ...this.getCallSid() };
            }

            // Call the respective function
            const functionToCall = availableFunctions[toolCall.functionName];
            const functionResponse = await functionToCall(parsedArguments);

            // Store function call result
            functionCallResults.push({
              role: "tool",
              content: JSON.stringify(functionResponse),
              tool_call_id: toolCall.id,
            });

            // Additional system messages
            if (toolCall.functionName === "listAvailableApartments") {
              systemMessages.push({
                role: "system",
                content:
                  "Provide a summary of available apartments without using symbols or markdown.",
              });
            }

            if (
              toolCall.functionName === "scheduleTour" &&
              functionResponse.available
            ) {
              systemMessages.push({
                role: "system",
                content:
                  "If the user agrees to receive an SMS confirmation, immediately trigger the 'sendAppointmentConfirmationSms' tool with the appointment details and the UserProfile. Do not ask for their phone number or any other details from the user.",
              });
            }

            if (toolCall.functionName === "liveAgentHandoff") {
              setTimeout(async () => {
                const conversationSummary = await this.summarizeConversation();
                this.emit("endSession", {
                  reasonCode: "live-agent-handoff",
                  reason: functionResponse.reason,
                  conversationSummary,
                });
                this.log(
                  `[GptService] Emitting endSession event with reason: ${functionResponse.reason}`
                );
              }, 3000);
            }
          }

          // Prepare the chat completion call payload
          const completionPayload = {
            model,
            messages: [
              ...this.userContext,
              ...systemMessages,
              finalMessageObject,
              ...functionCallResults,
            ],
          };

          // Call the API again with streaming for final response
          const finalResponseStream = await this.openai.chat.completions.create(
            {
              model: completionPayload.model,
              messages: completionPayload.messages,
              stream: true,
            }
          );

          // Handle the final response stream
          let finalContentAccumulator = "";
          for await (const chunk of finalResponseStream) {
            const { choices } = chunk;

            if (!choices[0]?.delta?.tool_calls) {
              if (choices[0].finish_reason === "stop") {
                if (choices[0]?.delta?.content) {
                  finalContentAccumulator += choices[0].delta.content;
                  this.emit(
                    "gptreply",
                    choices[0].delta.content,
                    true,
                    interactionCount,
                    finalContentAccumulator
                  );
                } else {
                  this.emit(
                    "gptreply",
                    "",
                    true,
                    interactionCount,
                    finalContentAccumulator
                  );
                }

                this.userContext.push({
                  role: "assistant",
                  content: finalContentAccumulator.trim(),
                });

                //Log the full userContext before making the API call
                console.log(
                  `[GptService] Full userContext after tool call: ${JSON.stringify(
                    this.userContext,
                    null,
                    2
                  )}`
                );
                break;
              } else if (
                !choices[0]?.delta?.role &&
                choices[0]?.delta?.content
              ) {
                this.emit(
                  "gptreply",
                  choices[0].delta.content,
                  false,
                  interactionCount
                );
                finalContentAccumulator += choices[0].delta.content;
              }
            }
          }

          // Reset tool call state
          toolCalls = {};
          currentToolCallId = null;
        } else {
          // Accumulate arguments for the current tool call
          if (currentToolCallId && toolCalls[currentToolCallId]) {
            if (choices[0]?.delta?.tool_calls[0]?.function?.arguments) {
              toolCalls[currentToolCallId].arguments +=
                choices[0].delta.tool_calls[0].function.arguments;
            }
          }
        }

        // Handle non-tool_call content chunks
        if (!choices[0]?.delta?.tool_calls) {
          if (choices[0].finish_reason === "stop") {
            if (choices[0]?.delta?.content) {
              contentAccumulator += choices[0].delta.content;
              this.emit(
                "gptreply",
                choices[0].delta.content,
                true,
                interactionCount,
                contentAccumulator
              );
            } else {
              this.emit(
                "gptreply",
                "",
                true,
                interactionCount,
                contentAccumulator
              );
            }

            this.userContext.push({
              role: "assistant",
              content: contentAccumulator.trim(),
            });
            break;
          } else if (!choices[0]?.delta?.role && choices[0]?.delta?.content) {
            this.emit(
              "gptreply",
              choices[0].delta.content,
              false,
              interactionCount
            );
            contentAccumulator += choices[0].delta.content;
          }
        }
      }
    } catch (error) {
      this.log(`[GptService] Error during completion: ${error.stack}`);

      // Friendly error message
      const friendlyMessage =
        "I apologize, that request might have been a bit too complex. Could you try asking one thing at a time? I'd be happy to help step by step!";

      // Emit the friendly message
      this.emit("gptreply", friendlyMessage, true, interactionCount);

      // Update user context
      this.updateUserContext("assistant", friendlyMessage);
    }
  }
}

module.exports = { GptService };
