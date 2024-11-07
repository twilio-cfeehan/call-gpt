const tools = [
  {
    type: "function",
    function: {
      name: "endCall",
      description:
        "Ends the call by hanging up when the user explicitly requests it or when the conversation has naturally concluded with no further actions required.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "liveAgentHandoff",
      description:
        "Initiates a handoff to a live agent based on user request or sensitive topics.",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description:
              "The reason for the handoff, such as user request, legal issue, financial matter, or other sensitive topics.",
          },
          context: {
            type: "string",
            description:
              "Any relevant conversation context or details leading to the handoff.",
          },
        },
        required: ["reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sendAppointmentConfirmationSms",
      description:
        "Sends an SMS confirmation for a scheduled tour to the user.",
      parameters: {
        type: "object",
        properties: {
          appointmentDetails: {
            type: "object",
            properties: {
              date: {
                type: "string",
                description: "The date of the scheduled tour (YYYY-MM-DD).",
              },
              time: {
                type: "string",
                description:
                  "The time of the scheduled tour (e.g., '10:00 AM').",
              },
              type: {
                type: "string",
                enum: ["in-person", "self-guided"],
                description:
                  "The type of tour (either in-person or self-guided).",
              },
              apartmentType: {
                type: "string",
                enum: ["studio", "one-bedroom", "two-bedroom", "three-bedroom"],
                description: "The type of apartment for the tour.",
              },
            },
            required: ["date", "time", "type", "apartmentType"],
          },
          to: {
            type: "string",
            description: "The user's phone number (to send the SMS).",
          },
          from: {
            type: "string",
            description:
              "The phone number used to send the SMS (Twilio 'from' number).",
          },
          userProfile: {
            type: "object",
            properties: {
              firstName: {
                type: "string",
                description: "The user's first name.",
              },
              lastName: {
                type: "string",
                description: "The user's last name.",
              },
              email: {
                type: "string",
                description: "The user's email address.",
              },
            },
            required: ["firstName"],
          },
        },
        required: ["appointmentDetails", "to", "from", "userProfile"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "scheduleTour",
      description: "Schedules a tour for the user at the apartment complex.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description:
              "The date the user wants to schedule the tour for (YYYY-MM-DD). **Convert any relative date expressions to this format based on {{currentDate}}.**",
          },
          time: {
            type: "string",
            description:
              'The time the user wants to schedule the tour for (e.g., "10:00 AM").',
          },
          type: {
            type: "string",
            enum: ["in-person", "self-guided"],
            description: "The type of tour, either in-person or self-guided.",
          },
          apartmentType: {
            type: "string",
            enum: ["studio", "one-bedroom", "two-bedroom", "three-bedroom"],
            description:
              "The layout of the apartment the user is interested in.",
          },
        },
        required: ["date", "time", "type", "apartmentType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkAvailability",
      description:
        "Checks the availability of tour slots based on the user’s preferences.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description:
              "The date the user wants to check for tour availability (YYYY-MM-DD). **Convert any relative date expressions to this format based on {{currentDate}}.**",
          },
          time: {
            type: "string",
            description:
              'The time the user wants to check for availability (e.g., "10:00 AM").',
          },
          type: {
            type: "string",
            enum: ["in-person", "self-guided"],
            description: "The type of tour, either in-person or self-guided.",
          },
          apartmentType: {
            type: "string",
            enum: ["studio", "one-bedroom", "two-bedroom", "three-bedroom"],
            description:
              "The layout of the apartment the user is interested in.",
          },
        },
        required: ["date", "type", "apartmentType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listAvailableApartments",
      description:
        "Lists available apartments based on optional user criteria.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description:
              "The move-in date the user prefers (optional, YYYY-MM-DD). **Convert any relative date expressions to this format based on {{currentDate}}.**",
          },
          budget: {
            type: "integer",
            description:
              "The budget the user has for rent per month (optional).",
          },
          apartmentType: {
            type: "string",
            enum: ["studio", "one-bedroom", "two-bedroom", "three-bedroom"],
            description:
              "The layout of the apartment the user is interested in (optional).",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkExistingAppointments",
      description: "Retrieves the list of appointments already booked.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "commonInquiries",
      description:
        "Handles common inquiries such as pet policy, fees, and other complex details, with the option to specify the apartment type.",
      parameters: {
        type: "object",
        properties: {
          inquiryType: {
            type: "string",
            enum: [
              "pet policy",
              "fees",
              "parking",
              "specials",
              "income requirements",
              "utilities",
            ],
            description:
              "The type of inquiry the user wants information about.",
          },
          apartmentType: {
            type: "string",
            enum: ["studio", "one-bedroom", "two-bedroom", "three-bedroom"],
            description:
              "The apartment type for which the inquiry is being made (optional).",
          },
        },
        required: ["inquiryType"],
      },
    },
  },
];

module.exports = tools;
