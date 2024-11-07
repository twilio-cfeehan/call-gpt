const mockDatabase = require("../data/mock-database");
const twilio = require("twilio");

// Send SMS using Twilio API
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Call controls
async function endCall(args) {
  const { callSid } = args;
  try {
    setTimeout(async () => {
      const call = await client.calls(callSid).update({
        twiml: "<Response><Hangup></Hangup></Response>",
      });
      console.log("Call ended for:", call.sid);
    }, 3000);
    return {
      status: "success",
      message: `Call has ended`,
    };
  } catch (error) {
    console.error("Twilio end error: ", error);
    return {
      status: "error",
      message: `An error occurred whilst trying to hangup`,
    };
  }
}

// Utility function to normalize various time formats to the database's 12-hour AM/PM format
function normalizeTimeFormat(time) {
  // Check if time is already in the desired AM/PM format
  if (/^(0?[1-9]|1[0-2]):[0-5][0-9] ?(AM|PM)$/i.test(time.trim())) {
    return time.toUpperCase().trim(); // Return as-is if it's already correct
  }

  // Handle 24-hour format (e.g., "14:00")
  let [hour, minute] = time.split(":");
  minute = minute.replace(/[^0-9]/g, ""); // Clean any non-numeric characters from minutes
  hour = parseInt(hour, 10);

  let period = "AM"; // Default to AM

  // Convert 24-hour to 12-hour format
  if (hour >= 12) {
    period = "PM";
    if (hour > 12) hour -= 12;
  } else if (hour === 0) {
    hour = 12; // Midnight is 12:00 AM
  }

  // Pad minutes to ensure it's always two digits
  minute = minute.padStart(2, "0");

  // Return time in the database's expected format
  return `${hour}:${minute} ${period}`;
}

// Function to handle live agent handoff
async function liveAgentHandoff(args) {
  const { reason, context } = args;

  // Log the reason for the handoff
  console.log(`[LiveAgentHandoff] Initiating handoff with reason: ${reason}`);
  if (context) {
    console.log(`[LiveAgentHandoff] Context provided: ${context}`);
  }

  // Create a result message for the LLM after processing the handoff tool call
  return {
    reason: reason,
    context: context || "No additional context provided",
    message: `Handoff initiated due to: ${reason}. Context: ${
      context || "No additional context provided."
    }`,
  };
}
// Function to send SMS confirmation for a scheduled tour
async function sendAppointmentConfirmationSms(args) {
  const { appointmentDetails, to, from, userProfile } = args;

  // Check if appointment details are complete
  if (
    !appointmentDetails ||
    !appointmentDetails.date ||
    !appointmentDetails.time ||
    !appointmentDetails.type ||
    !appointmentDetails.apartmentType
  ) {
    return {
      status: "error",
      message:
        "The SMS could not be sent because some appointment details were incomplete.",
    };
  }

  // Check if phone numbers are available
  if (!to || !from) {
    return {
      status: "error",
      message:
        "The SMS could not be sent because either the 'to' or 'from' phone numbers were missing.",
    };
  }

  // Personalize the message using the userProfile
  const name = userProfile?.firstName || "user";
  const apartmentType = appointmentDetails.apartmentType;
  const tourType =
    appointmentDetails.type === "in-person" ? "an in-person" : "a self-guided";
  const message = `Hi ${name}, your tour for a ${apartmentType} apartment at Parkview is confirmed for ${appointmentDetails.date} at ${appointmentDetails.time}. This will be ${tourType} tour. We'll be ready for your visit! Let us know if you have any questions.`;

  try {
    const smsResponse = await client.messages.create({
      body: message,
      from: to, // The "to" is the Twilio number (sender)
      to: from, // The "from" is the user's phone number (recipient)
    });

    console.log(
      `[sendAppointmentConfirmationSms] SMS sent successfully: ${smsResponse.sid}`
    );

    return {
      status: "success",
      message: `An SMS confirmation has been sent to ${from}.`,
    };
  } catch (error) {
    console.error(
      `[sendAppointmentConfirmationSms] Error sending SMS: ${error.message}`
    );
    return {
      status: "error",
      message: "An error occurred while sending the SMS confirmation.",
    };
  }
}

// Function to schedule a tour
async function scheduleTour(args) {
  const { date, time, type, apartmentType } = args;

  console.log(
    `[scheduleTour] Current available appointments:`,
    mockDatabase.availableAppointments
  );
  console.log(`[scheduleTour] Received arguments:`, args);

  // Normalize the time input
  const normalizedTime = normalizeTimeFormat(time);
  console.log(`[scheduleTour] Normalized Time: ${normalizedTime}`);

  // Find the index of the matching available appointment slot
  const index = mockDatabase.availableAppointments.findIndex(
    (slot) =>
      slot.date === date &&
      slot.time === normalizedTime &&
      slot.type === type &&
      slot.apartmentType === apartmentType
  );

  console.log(`[scheduleTour] Index found: ${index}`);

  // If no matching slot is found, return a message indicating unavailability
  if (index === -1) {
    console.log(`[scheduleTour] The requested slot is not available.`);
    return {
      available: false,
      message: `The ${normalizedTime} slot on ${date} is no longer available. Would you like to choose another time or date?`,
    };
  }

  // Schedule the appointment and remove the slot from available appointments
  mockDatabase.appointments.push({
    date,
    time: normalizedTime,
    type,
    apartmentType,
    id: mockDatabase.appointments.length + 1,
  });
  mockDatabase.availableAppointments.splice(index, 1); // Remove the slot from available appointments

  console.log(`[scheduleTour] Appointment successfully scheduled.`);

  // Return confirmation message for the successful scheduling
  return {
    available: true,
    message: `Your tour is scheduled for ${date} at ${normalizedTime}. Would you like a confirmation via SMS?`,
  };
}

// Function to check availability
async function checkAvailability(args) {
  const { date, time, type, apartmentType } = args;

  console.log(
    `[checkAvailability] Current available appointments:`,
    mockDatabase.availableAppointments
  );
  console.log(`[checkAvailability] Received arguments:`, args);

  // Step 1: Check for missing fields and create messages for the LLM to ask the user for them
  const missingFields = [];

  if (!date) {
    missingFields.push("date");
  }

  if (!type) {
    missingFields.push("tour type (e.g., in-person or self-guided)");
  }

  if (!apartmentType) {
    missingFields.push("apartment type (e.g., studio, one-bedroom, etc.)");
  }

  // If there are missing fields, return the structured message for the LLM to prompt the user
  if (missingFields.length > 0) {
    return {
      missing_fields: missingFields,
      message: `Please provide the following details: ${missingFields.join(
        ", "
      )}.`,
    };
  }

  let normalizedTime = null;
  if (time) {
    normalizedTime = normalizeTimeFormat(time);
  }

  // Step 2: Check for an exact match (date, time, type, apartmentType)
  let exactMatchSlot = null;
  if (time) {
    exactMatchSlot = mockDatabase.availableAppointments.find(
      (slot) =>
        slot.date === date &&
        slot.time === normalizedTime &&
        slot.type === type &&
        slot.apartmentType === apartmentType
    );
  }

  if (exactMatchSlot) {
    console.log(`[checkAvailability] Exact match found.`);
    return {
      availableSlots: [exactMatchSlot],
      message: `The ${time} slot on ${date} is available for an ${type} tour of a ${apartmentType} apartment. Would you like to book this?`,
    };
  }

  // Step 3: Check for similar matches (same date, type, apartmentType but different time)
  let similarDateSlots = mockDatabase.availableAppointments.filter(
    (slot) =>
      slot.date === date &&
      slot.type === type &&
      slot.apartmentType === apartmentType
  );

  if (similarDateSlots.length > 0) {
    console.log(
      `[checkAvailability] Similar matches found (different time on the same date).`
    );
    return {
      availableSlots: similarDateSlots,
      message: `The ${time} slot on ${date} isn't available. Here are other available times for that day: ${similarDateSlots
        .map((slot) => slot.time)
        .join(", ")}. Would any of these work for you?`,
    };
  }

  // Step 4: Check for broader matches (same type, apartmentType but different date)
  let broaderSlots = mockDatabase.availableAppointments.filter(
    (slot) => slot.type === type && slot.apartmentType === apartmentType
  );

  if (broaderSlots.length > 0) {
    console.log(`[checkAvailability] Broader matches found (different date).`);
    return {
      availableSlots: broaderSlots,
      message: `There are no available slots on ${date} for a ${apartmentType} apartment, but here are other available dates: ${broaderSlots
        .map((slot) => `${slot.date} at ${slot.time}`)
        .join(", ")}. Would any of these work for you?`,
    };
  }

  // Step 5: If no matches are found at all
  console.log(`[checkAvailability] No available slots found.`);
  return {
    availableSlots: [],
    message: `There are no available slots for a ${apartmentType} apartment at this time. Would you like to explore other options or check availability later?`,
  };
}

// Function to check existing appointments
async function checkExistingAppointments() {
  const userAppointments = mockDatabase.appointments;

  // If user has appointments, return them
  if (userAppointments.length > 0) {
    return {
      appointments: userAppointments,
      message: `You have the following appointments scheduled: ${userAppointments
        .map(
          (appt) =>
            `${appt.date} at ${appt.time} for a ${appt.apartmentType} tour (${appt.type} tour).`
        )
        .join("\n")}`,
    };
  } else {
    // No appointments found
    return {
      appointments: [],
      message:
        "You don't have any appointments scheduled. Would you like to book a tour or check availability?",
    };
  }
}

// Function to handle common inquiries
async function commonInquiries({ inquiryType, apartmentType }) {
  // Map the inquiry types to the database field names
  const inquiryMapping = {
    "pet policy": "petPolicy",
    "income requirements": "incomeRequirements",
    location: "location",
    address: "location", // Map 'address' to 'location' as well
  };

  // If there's a mapped field, use it; otherwise, use the inquiryType directly
  const inquiryField = inquiryMapping[inquiryType] || inquiryType;

  let inquiryDetails;

  if (apartmentType) {
    // Return specific details for the given apartment type
    inquiryDetails = mockDatabase.apartmentDetails[apartmentType][inquiryField];

    // If inquiry is for location/address, format the location details
    if (inquiryField === "location" && inquiryDetails) {
      inquiryDetails = `${inquiryDetails.street}, ${inquiryDetails.city}, ${inquiryDetails.state}, ${inquiryDetails.zipCode}`;
    }
  } else {
    // Return general details across all apartment types
    inquiryDetails = Object.keys(mockDatabase.apartmentDetails)
      .map((key) => {
        const details = mockDatabase.apartmentDetails[key][inquiryField];
        if (inquiryField === "location" && details) {
          return `${details.street}, ${details.city}, ${details.state}, ${details.zipCode}`;
        }
        return details;
      })
      .filter(Boolean)
      .join(" ");
  }

  // Return the structured result based on the inquiryDetails
  if (inquiryDetails) {
    return {
      inquiryDetails,
      message: `Here are the details about ${inquiryType} for the ${
        apartmentType ? apartmentType : "available apartments"
      }: ${inquiryDetails}`,
    };
  } else {
    // Return structured JSON indicating no information available
    return {
      inquiryDetails: null,
      message: `I'm sorry, I don't have information about ${inquiryType}.`,
    };
  }
}

// Function to list available apartments
async function listAvailableApartments(args) {
  try {
    let apartments = Object.keys(mockDatabase.apartmentDetails).map((type) => ({
      type,
      ...mockDatabase.apartmentDetails[type],
    }));

    // Filter based on user input
    if (args.date) {
      apartments = apartments.filter(
        (apt) => new Date(apt.moveInDate) <= new Date(args.date)
      );
    }
    if (args.budget) {
      apartments = apartments.filter((apt) => apt.rent <= args.budget);
    }
    if (args.apartmentType) {
      apartments = apartments.filter((apt) => apt.type === args.apartmentType);
    }

    // Summarize available apartments
    const summary = apartments
      .map(
        (apt) =>
          `${apt.layout}: ${apt.rent}/month, available from ${
            apt.moveInDate
          }. Features: ${apt.features.join(", ")}.`
      )
      .join("\n\n");

    // If apartments are found, return the structured response
    if (apartments.length > 0) {
      return {
        availableApartments: summary,
        message: `Here are the available apartments based on your search: \n\n${summary}`,
      };
    } else {
      // No apartments found based on the filters
      return {
        availableApartments: [],
        message: "No apartments are available that match your search criteria.",
      };
    }
  } catch (error) {
    console.log(
      `[listAvailableApartments] Error listing available apartments: ${error.message}`
    );
    // Return error message as structured JSON
    return {
      availableApartments: null,
      message: "An error occurred while listing available apartments.",
    };
  }
}

// Export all functions
module.exports = {
  endCall,
  liveAgentHandoff,
  sendAppointmentConfirmationSms,
  scheduleTour,
  checkAvailability,
  checkExistingAppointments,
  commonInquiries,
  listAvailableApartments,
};
