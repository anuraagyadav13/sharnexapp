const axios = require('axios');

async function testFetch() {
  try {
    const res = await axios.get("https://sharnex.com/api/classes/class-1767726363334-bjdcw5u2x/attendance?date=2026-07-02", {
      headers: {
        "Accept": "application/json",
        "Cookie": "csrf_token=6dadd8dbbdb962da1986a8cfcfdcf8fb8d255f469541bbbbebec49eb50300db1; refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlYWNoZXItMTc2NzcyNjc3MzEzOCIsImlhdCI6MTc4Mjk3MjU1NSwiZXhwIjoxNzgzNTc3MzU1fQ.k69TMMWMhKHxaKXp1UhZrYpEAS9Y8Vk5o7n-HfY9EmE; access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlYWNoZXItMTc2NzcyNjc3MzEzOCIsInJvbGUiOiJURUFDSEVSIiwiaW5zdGl0dXRpb25JZCI6Imluc3RpdHV0aW9uLTE3Njc2Mzk1MDMwODkteXJmMHExcnB3IiwiZW1haWwiOiJhbnVyYWcuMjJiMDMxMTA4MEBhYmVzLmFjLmluIiwibmFtZSI6IlJpc2hpIFNyaXZhc3RhdmEiLCJpc0FjdGl2ZSI6dHJ1ZSwiaXNWZXJpZmllZCI6ZmFsc2UsImlhdCI6MTc4Mjk3MjU1NSwiZXhwIjoxNzgyOTczNDU1fQ.jXyxeepXX5MmOj8efLiZT6JFh_fcRwqMwT844G9wss4"
      }
    });

    console.log("Response Type:", typeof res.data);
    if(res.data.data) {
        console.log("Data Keys:", Object.keys(res.data.data));
        if(res.data.data.attendance) {
            console.log("First attendance record:", JSON.stringify(res.data.data.attendance[0], null, 2));
        } else if(res.data.data.records) {
            console.log("First attendance record:", JSON.stringify(res.data.data.records[0], null, 2));
        }
    } else {
        console.log("Data:", res.data);
    }
  } catch(e) {
    console.error(e.message);
  }
}
testFetch();
