// helper-functions.js

// Helper function to format dates to 'YYYY-MM-DD'
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// Helper function to add days to a date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Function to generate a mock database
function generateMockDatabase(currentDate = new Date()) {
  // Arrays for random selection
  const apartmentTypes = [
    "studio",
    "one-bedroom",
    "two-bedroom",
    "three-bedroom",
  ];
  const tourTypes = ["in-person", "self-guided"];
  const times = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
  ];

  // Generate available appointments for the next 20 days
  const availableAppointments = Array.from({ length: 20 }, (_, i) => {
    const date = addDays(currentDate, i + 1);
    return {
      date: formatDate(date),
      time: times[Math.floor(Math.random() * times.length)],
      type: tourTypes[Math.floor(Math.random() * tourTypes.length)],
      apartmentType:
        apartmentTypes[Math.floor(Math.random() * apartmentTypes.length)],
    };
  });

  // Dynamic move-in dates and specials for apartment details
  const apartmentDetails = {
    studio: {
      layout: "Studio",
      squareFeet: 450,
      rent: 1050,
      moveInDate: formatDate(addDays(currentDate, 15)),
      features: [
        "Open floor plan",
        "Compact kitchen with modern appliances",
        "Large windows with city views",
        "Walk-in shower",
        "In-unit washer and dryer",
      ],
      amenities: [
        "Fitness center access",
        "Community lounge",
        "24-hour maintenance",
      ],
      petPolicy: "No pets allowed.",
      fees: {
        applicationFee: 50,
        securityDeposit: 300,
      },
      parking: "Street parking available.",
      storage: "No additional storage available.",
      specials: `First month's rent free if you move in before ${formatDate(
        addDays(currentDate, 30)
      )}.`,
      leaseTerms: "12-month lease required.",
      incomeRequirements: "Income must be 2.5x the rent.",
      utilities:
        "Water, trash, and Wi-Fi included. Tenant pays electricity and gas.",
      location: {
        street: "1657 Coolidge Street",
        city: "Missoula",
        state: "Montana",
        zipCode: "59802",
      },
    },
    "one-bedroom": {
      layout: "One-bedroom",
      squareFeet: 650,
      rent: 1250,
      moveInDate: formatDate(addDays(currentDate, 20)),
      features: [
        "Separate bedroom",
        "Full kitchen with dishwasher",
        "Private balcony",
        "Walk-in closet",
        "In-unit washer and dryer",
      ],
      amenities: ["Swimming pool access", "Fitness center", "On-site laundry"],
      petPolicy: "Cats allowed with a $200 pet deposit.",
      fees: {
        applicationFee: 50,
        securityDeposit: 400,
        petDeposit: 200,
      },
      parking: "One reserved parking spot included.",
      storage: "Additional storage units available for $50/month.",
      specials: `Free parking for the first 6 months if you move in before ${formatDate(
        addDays(currentDate, 35)
      )}.`,
      leaseTerms: "Flexible lease terms from 6 to 12 months.",
      incomeRequirements: "Income must be 3x the rent.",
      utilities:
        "Water and trash included. Tenant pays electricity, gas, and internet.",
      location: {
        street: "1705 Adams Street",
        city: "Missoula",
        state: "Montana",
        zipCode: "59802",
      },
    },
    "two-bedroom": {
      layout: "Two-bedroom",
      squareFeet: 950,
      rent: 1800,
      moveInDate: formatDate(addDays(currentDate, 10)),
      features: [
        "Two bedrooms",
        "Two bathrooms",
        "Open living and dining area",
        "Modern kitchen with granite countertops",
        "In-unit washer and dryer",
      ],
      amenities: [
        "Fitness center",
        "Community garden",
        "BBQ area",
        "Covered parking",
      ],
      petPolicy: "Cats and small dogs allowed with a $250 pet deposit.",
      fees: {
        applicationFee: 50,
        securityDeposit: 500,
        petDeposit: 250,
      },
      parking: "Two reserved covered parking spots included.",
      storage: "Complimentary storage unit included.",
      specials: `Reduced security deposit if you move in before ${formatDate(
        addDays(currentDate, 25)
      )}.`,
      leaseTerms: "12-month lease preferred.",
      incomeRequirements: "Income must be 3x the rent.",
      utilities:
        "Water, trash, and gas included. Tenant pays electricity and internet.",
      location: {
        street: "1833 Jefferson Avenue",
        city: "Missoula",
        state: "Montana",
        zipCode: "59802",
      },
    },
    "three-bedroom": {
      layout: "Three-bedroom",
      squareFeet: 1200,
      rent: 2500,
      moveInDate: formatDate(addDays(currentDate, 25)),
      features: [
        "Three spacious bedrooms",
        "Two bathrooms",
        "Large kitchen with island",
        "Private patio",
        "Fireplace",
        "In-unit washer and dryer",
        "Smart home features",
      ],
      amenities: [
        "Swimming pool",
        "Fitness center",
        "Business center",
        "Playground",
      ],
      petPolicy: "Pets allowed with breed restrictions; up to 2 pets.",
      fees: {
        applicationFee: 50,
        securityDeposit: 600,
        petDeposit: 300,
      },
      parking: "Two reserved parking spots included.",
      storage: "Large storage units available for $75/month.",
      specials: "No application fee if you sign a 12-month lease.",
      leaseTerms: "12 or 18-month lease options.",
      incomeRequirements: "Income must be 3x the rent.",
      utilities:
        "Water, trash, gas, and Wi-Fi included. Tenant pays electricity.",
      location: {
        street: "1945 Roosevelt Way",
        city: "Missoula",
        state: "Montana",
        zipCode: "59802",
      },
    },
  };

  return {
    availableAppointments,
    appointments: [],
    apartmentDetails,
  };
}

// Helper function to generate TTS messages for tools
function getTtsMessageForTool(toolName, userProfile, updateUserContext) {
  const name = userProfile?.profile?.firstName || "";
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

  const toolMessages = {
    listAvailableApartments: `${randomIntro} let me check on the available apartments for you.`,
    checkExistingAppointments: `${randomIntro} I'll look up your existing appointments.`,
    scheduleTour: `${randomIntro} I'll go ahead and schedule that tour for you.`,
    checkAvailability: `${randomIntro} let me verify the availability for the requested time.`,
    commonInquiries: `${randomIntro} one moment while I look that up.`,
    sendAppointmentConfirmationSms: `${randomIntro} I'll send that SMS off to you shortly. Give it a few minutes, and you should see it come through.`,
    liveAgentHandoff: `${randomIntro} that may be a challenging topic to discuss, so I'm going to get you over to a live agent. Hang tight.`,
  };

  const message =
    toolMessages[toolName] ||
    `${randomIntro} give me a moment while I fetch the information.`;

  // Log the message to the userContext
  updateUserContext("assistant", message);

  return message;
}
// Function to process user input for handoff
async function processUserInputForHandoff(userInput) {
  const handoffKeywords = [
    "live agent",
    "real person",
    "talk to a representative",
    "transfer me to a human",
    "speak to a person",
    "customer service",
  ];

  // Check if the input contains any of the keywords
  if (
    handoffKeywords.some((keyword) =>
      userInput.toLowerCase().includes(keyword.toLowerCase())
    )
  ) {
    console.log(
      `[AppHelperFunctions] Live agent handoff requested by user input.`
    );
    return true; // Signals that we should perform a handoff
  }
  return false; // No handoff needed
}

// Function to handle live agent handoff
async function handleLiveAgentHandoff(
  gptService,
  endSessionService,
  textService,
  userProfile,
  userInput
) {
  const name = userProfile?.profile?.firstName
    ? userProfile.profile.firstName
    : ""; // Get user's name if available

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

  const handoffMessages = [
    `${randomIntro} one moment, I'll transfer you to a live agent now.`,
    `${randomIntro} let me get a live agent to assist you. One moment please.`,
    `${randomIntro} I'll connect you with a live person right away. Just a moment.`,
    `${randomIntro} sure thing, I'll transfer you to customer service. Please hold for a moment.`,
  ];

  const randomHandoffMessage =
    handoffMessages[Math.floor(Math.random() * handoffMessages.length)];

  console.log(`[AppHelperFunctions] Hand off message: ${randomHandoffMessage}`);

  // Send the random handoff message to the user
  textService.sendText(randomHandoffMessage, true); // Final message before handoff

  // Add the final user input to userContext for summarization
  gptService.updateUserContext("user", userInput);

  // Add the randomHandoffMessage to the userContext
  gptService.updateUserContext("assistant", randomHandoffMessage);

  // Proceed with summarizing the conversation, including the latest messages
  const conversationSummary = await gptService.summarizeConversation();

  // End the session and include the conversation summary in the handoff data
  // Introduce a delay before ending the session
  setTimeout(() => {
    // End the session and include the conversation summary in the handoff data
    endSessionService.endSession({
      reasonCode: "live-agent-handoff",
      reason: "User requested to speak to a live agent.",
      conversationSummary: conversationSummary,
    });
  }, 1000); // 1 second delay
}

// Function to handle DTMF input
async function handleDtmfInput(
  digit,
  gptService,
  textService,
  interactionCount,
  userProfile = null // Pass in the user profile
) {
  const name = userProfile?.profile?.firstName
    ? userProfile.profile.firstName
    : ""; // Get user's name if available

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

  switch (digit) {
    case "1":
      textService.sendText(
        `${randomIntro} you want info on available apartments, let me get that for you, it will just take a few moments so hang tight.`,
        true
      ); // Send the message to the user

      // Process the request using gptService
      await gptService.completion(
        "Please provide a listing of all available apartments, but as a summary, not a list.",
        interactionCount,
        "user",
        true // DTMF-triggered flag
      );
      break;

    case "2":
      textService.sendText(
        `${randomIntro} you want me to check on your existing appointments, gimme one sec.`,
        true
      ); // Send the message to the user

      // Process the request using gptService
      await gptService.completion(
        "Please check all available scheduled appointments.",
        interactionCount,
        "user",
        true // DTMF-triggered flag
      );
      break;

    // Add more cases as needed for different DTMF inputs
    default:
      textService.sendText(
        `Oops! That button’s a dud. But hey, press '1' to hear about available apartments or '2' to check your scheduled appointments!`,
        true
      ); // Send the default message
      break;
  }
}

module.exports = {
  generateMockDatabase,
  getTtsMessageForTool,
  processUserInputForHandoff,
  handleLiveAgentHandoff,
  handleDtmfInput,
};
