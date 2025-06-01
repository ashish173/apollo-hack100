export const attendanceExtractionPrompt = `Please analyze this attendance register image and extract the structured data.
Return the data in JSON format. Prioritize one of the following structures:

1. For multi-day attendance (e.g., a month's register):
{
  "employees": [ // or "students" if applicable
    {
      "name": "Employee/Student Name",
      "attendance": {
        "1": "P/A/S", // Day 1 status (e.g., P, A, S, L, H)
        "2": "P/A/S", // Day 2 status
        // ... for all days shown
      }
    },
    // ... more employees/students
  ],
  "legend": {
    "P": "Present",
    "A": "Absent",
    "S": "Sick/Leave",
    "L": "Late",
    "H": "Holiday"
  }
}

2. For single-day attendance (e.g., a daily roll call):
{
  "attendance_data": [
    {"student_name": "Student Name", "status": "P/A/S"},
    {"student_name": "Another Name", "status": "A"},
    // ... more students
  ]
}

Extract all names and their corresponding attendance status. Use 'P' for Present, 'A' for Absent, 'S' for Sick/Leave, 'L' for Late, 'H' for Holiday, or other relevant codes you identify. Ensure the JSON is valid and directly parsable.`;
