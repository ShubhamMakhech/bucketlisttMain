/**
 * Test file for the get-time-slots edge function
 * Run this using Deno: deno run --allow-net test.ts
 */

const SUPABASE_URL = "YOUR_SUPABASE_URL"; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY"; // Replace with your anon key

// Or if testing locally:
// const FUNCTION_URL = "http://localhost:54321/functions/v1/get-time-slots";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/get-time-slots`;

interface TestCase {
  name: string;
  input: {
    date: string;
    name?: string;
  };
  description: string;
}

const testCases: TestCase[] = [
  {
    name: "Test 1: Today's date with exact activity name",
    input: {
      date: new Date().toISOString().split('T')[0],
      name: "Paragliding Adventure"
    },
    description: "Should return only future time slots for today with exact activity name"
  },
  {
    name: "Test 2: Future date with exact activity name",
    input: {
      date: "2025-12-25",
      name: "Mountain Trekking"
    },
    description: "Should return all time slots for future date"
  },
  {
    name: "Test 3: Activity name mapping - FlyingFox",
    input: {
      date: "2025-12-26",
      name: "FlyingFox(Tandem/Triple)"
    },
    description: "Should map to 'Fying Fox (Tandem or triple Ride)' and return time slots"
  },
  {
    name: "Test 4: Activity name mapping - RE Hunter",
    input: {
      date: "2025-12-26",
      name: "RE Hunter 350cc"
    },
    description: "Should map to 'Royal Enfield Hunter 350 CC' and return time slots"
  },
  {
    name: "Test 5: Activity name mapping - Bungy Jump combo",
    input: {
      date: "2025-12-26",
      name: "BungyJump+Cut Chord Rope"
    },
    description: "Should map to 'Bungy Jump + Valley Rope Jump/Cut chord rope' and return time slots"
  },
  {
    name: "Test 6: Invalid date format",
    input: {
      date: "25-12-2025",  // Wrong format
      name: "Paragliding Adventure"
    },
    description: "Should return error for invalid date format"
  },
  {
    name: "Test 7: Missing date",
    input: {
      date: "",
      name: "Adventure Activity"
    },
    description: "Should return error for missing date"
  },
  {
    name: "Test 8: Missing activity name",
    input: {
      date: "2025-12-25",
      name: ""
    },
    description: "Should return error for missing activity name"
  },
  {
    name: "Test 9: Activity not found",
    input: {
      date: "2025-12-25",
      name: "Non-Existent Activity XYZ"
    },
    description: "Should return error for non-existent activity"
  }
];

async function runTest(testCase: TestCase) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`${testCase.name}`);
  console.log(`Description: ${testCase.description}`);
  console.log(`Input:`, JSON.stringify(testCase.input, null, 2));
  console.log("-".repeat(60));

  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(testCase.input)
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log(`✅ Test passed`);
    } else {
      console.log(`❌ Test returned error (expected for invalid inputs)`);
    }
  } catch (error) {
    console.log(`❌ Test failed with error:`, error);
  }
}

async function runAllTests() {
  console.log("\n🚀 Starting get-time-slots Edge Function Tests");
  console.log(`Function URL: ${FUNCTION_URL}`);
  console.log(`Current Time (IST): ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

  for (const testCase of testCases) {
    await runTest(testCase);
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("✅ All tests completed!");
  console.log(`${"=".repeat(60)}\n`);
}

// Run all tests
runAllTests();
