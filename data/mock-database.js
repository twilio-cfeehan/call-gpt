const mockDatabase = {
  availableAppointments: [
    // Existing Week
    {
      date: makeFutureDate(1),
      time: "10:00 AM",
      type: "in-person",
      apartmentType: "one-bedroom",
    },
    {
      date: makeFutureDate(2),
      time: "1:00 PM",
      type: "in-person",
      apartmentType: "two-bedroom",
    },
    {
      date: makeFutureDate(3),
      time: "11:00 AM",
      type: "self-guided",
      apartmentType: "studio",
    },
    {
      date: makeFutureDate(3),
      time: "2:00 PM",
      type: "in-person",
      apartmentType: "three-bedroom",
    },
    {
      date: makeFutureDate(3),
      time: "3:00 PM",
      type: "self-guided",
      apartmentType: "one-bedroom",
    },
    {
      date: makeFutureDate(4),
      time: "9:00 AM",
      type: "in-person",
      apartmentType: "two-bedroom",
    },
    {
      date: makeFutureDate(5),
      time: "11:00 AM",
      type: "in-person",
      apartmentType: "two-bedroom",
    },
    {
      date: makeFutureDate(6),
      time: "10:00 AM",
      type: "self-guided",
      apartmentType: "studio",
    },
    {
      date: makeFutureDate(6),
      time: "4:00 PM",
      type: "in-person",
      apartmentType: "three-bedroom",
    },

    // Extended Week 1
    {
      date: makeFutureDate(7),
      time: "8:00 AM",
      type: "in-person",
      apartmentType: "studio",
    },
    {
      date: makeFutureDate(7),
      time: "11:00 AM",
      type: "in-person",
      apartmentType: "one-bedroom",
    },
    {
      date: makeFutureDate(7),
      time: "3:00 PM",
      type: "self-guided",
      apartmentType: "two-bedroom",
    },
    {
      date: makeFutureDate(8),
      time: "1:00 PM",
      type: "in-person",
      apartmentType: "three-bedroom",
    },
    {
      date: makeFutureDate(8),
      time: "4:00 PM",
      type: "in-person",
      apartmentType: "one-bedroom",
    },
    {
      date: makeFutureDate(9),
      time: "9:00 AM",
      type: "self-guided",
      apartmentType: "studio",
    },
    {
      date: makeFutureDate(9),
      time: "2:00 PM",
      type: "in-person",
      apartmentType: "two-bedroom",
    },
    {
      date: makeFutureDate(10),
      time: "10:00 AM",
      type: "in-person",
      apartmentType: "three-bedroom",
    },
    {
      date: makeFutureDate(10),
      time: "4:00 PM",
      type: "self-guided",
      apartmentType: "two-bedroom",
    },
    {
      date: makeFutureDate(11),
      time: "12:00 PM",
      type: "in-person",
      apartmentType: "studio",
    },

    // Extended Week 2
    {
      date: makeFutureDate(12),
      time: "11:00 AM",
      type: "in-person",
      apartmentType: "two-bedroom",
    },
    {
      date: makeFutureDate(12),
      time: "3:00 PM",
      type: "in-person",
      apartmentType: "three-bedroom",
    },
    {
      date: makeFutureDate(13),
      time: "9:00 AM",
      type: "self-guided",
      apartmentType: "one-bedroom",
    },
    {
      date: makeFutureDate(13),
      time: "2:00 PM",
      type: "in-person",
      apartmentType: "studio",
    },
    {
      date: makeFutureDate(14),
      time: "4:00 PM",
      type: "in-person",
      apartmentType: "two-bedroom",
    },
    {
      date: makeFutureDate(14),
      time: "12:00 PM",
      type: "self-guided",
      apartmentType: "three-bedroom",
    },
    {
      date: makeFutureDate(15),
      time: "10:00 AM",
      type: "in-person",
      apartmentType: "one-bedroom",
    },
    {
      date: makeFutureDate(15),
      time: "3:00 PM",
      type: "in-person",
      apartmentType: "two-bedroom",
    },
    {
      date: makeFutureDate(16),
      time: "1:00 PM",
      type: "in-person",
      apartmentType: "three-bedroom",
    },
    {
      date: makeFutureDate(16),
      time: "5:00 PM",
      type: "self-guided",
      apartmentType: "studio",
    },
  ],
  appointments: [],
  apartmentDetails: {
    studio: {
      layout: "Studio",
      squareFeet: 450,
      rent: 1050,
      moveInDate: makeFutureDayOfMonth(1, 1),
      features: ["1 bathroom", "open kitchen", "private balcony"],
      petPolicy: "No pets allowed.",
      fees: {
        applicationFee: 50,
        securityDeposit: 300,
      },
      parking: "1 reserved parking spot included.",
      specials: "First month's rent free if you move in before 2024-11-30.",
      incomeRequirements: "Income must be 2.5x the rent.",
      utilities:
        "Water, trash, and Wi-Fi internet included. Tenant pays electricity and gas.",
      location: {
        street: "1657 Coolidge Street",
        city: "Missoula",
        state: "Montana",
        zipCode: "59802",
      },
    },
    "one-bedroom": {
      layout: "One-bedroom",
      squareFeet: 600,
      rent: 1200,
      moveInDate: makeFutureDayOfMonth(1, 15),
      features: ["1 bedroom", "1 bathroom", "walk-in closet"],
      petPolicy: "Cats only. No dogs or any other animals.",
      fees: {
        applicationFee: 50,
        securityDeposit: 400,
      },
      parking: "1 reserved parking spot included.",
      specials: "First month's rent free if you move in before 2024-11-25.",
      incomeRequirements: "Income must be 3x the rent.",
      utilities:
        "Water, trash, gas, and Wi-Fi internet included. Tenant pays electricity.",
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
      moveInDate: makeFutureDayOfMonth(2, 1),
      features: ["2 bedrooms", "2 bathrooms", "walk-in closets", "balcony"],
      petPolicy: "Cats and dogs allowed, but only 1 each.",
      fees: {
        applicationFee: 50,
        securityDeposit: 500,
      },
      parking: "2 reserved parking spots included.",
      specials: "Waived application fee if you move in before 2024-11-20.",
      incomeRequirements: "Income must be 3x the rent.",
      utilities:
        "Water, trash, gas, and Wi-Fi internet included. Tenant pays electricity.",
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
      moveInDate: makeFutureDayOfMonth(2, 1),
      features: [
        "3 bedrooms",
        "2 bathrooms",
        "walk-in closets",
        "private balcony",
        "extra storage",
      ],
      petPolicy:
        "Up to 2 dogs and 2 cats are allowed, and other small pets like hamsters are allowed as well. No more than 4 total pets.",
      fees: {
        applicationFee: 50,
        securityDeposit: 600,
      },
      parking: "2 reserved parking spots included.",
      specials: "No move-in fees if you sign a 12-month lease.",
      incomeRequirements: "Income must be 3x the rent.",
      utilities:
        "Water, trash, gas, and Wi-Fi internet included. Tenant pays electricity.",
      location: {
        street: "1945 Roosevelt Way",
        city: "Missoula",
        state: "Montana",
        zipCode: "59802",
      },
    },
  },
};

function makeFutureDate(daysToAdd) {
  if (daysToAdd === undefined) daysToAdd = Math.floor(Math.random() * 10) + 1;

  const dt = new Date();
  dt.setDate(dt.getDate() + daysToAdd);

  const year = dt.getFullYear();
  const mo = `${dt.getMonth() + 1}`.padStart(2, "0");
  const da = `${dt.getDate()}`.padStart(2, "0");

  return `${year}-${mo}-${da}`;
}

function makeFutureDayOfMonth(monthsToAdd, dayOfMonth = 1) {
  if (monthsToAdd === undefined)
    monthsToAdd = Math.floor(Math.random() * 3) + 1;

  const dt = new Date();
  dt.setMonth(dt.getMonth() + monthsToAdd);

  const year = dt.getFullYear();
  const mo = `${dt.getMonth() + 1}`.padStart(2, "0");
  const da = `${dt.getDate()}`.padStart(2, "0");
  return `${year}-${mo}-${dayOfMonth}`;
}

module.exports = mockDatabase;
