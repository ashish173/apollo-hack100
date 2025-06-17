## Relevant Files

- `src/app/student/dashboard/page.tsx` - Contains the student dashboard where the download button will be added.
- `src/components/ui/button.tsx` - Existing UI component for buttons.
- `src/services/firestoreService.ts` - Service for interacting with Firestore to fetch project data and hints.
- `src/lib/utils.ts` - To add a new utility function for generating the Excel file.
- `package.json` - To add a new dependency for Excel generation (e.g., `xlsx`).
- `src/hooks/use-toast.tsx` - For displaying success/error messages to the user.
- `src/types/index.ts` - To define or update types related to project plans, tasks, and hints.
- `src/app/student/dashboard/__tests__/page.test.tsx` - Unit tests for the student dashboard page.
- `src/lib/__tests__/utils.test.ts` - Unit tests for the new Excel utility function.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Implement UI for Download Button
  - [x] 1.1 Locate the `Project Plan` section within `src/app/student/dashboard/page.tsx` or its child components.
  - [x] 1.2 Add a new `Button` component from `src/components/ui/button.tsx` in the top right corner of the `Project Plan` section.
  - [x] 1.3 Style the button to align with the existing UI guidelines of the student dashboard.
- [x] 2.0 Fetch Project Data and Hints
  - [x] 2.1 Develop or extend a function in `src/services/firestoreService.ts` to fetch the complete project plan data, including all tasks and their associated hints, from the "assigned project collection" for the current student's project.
  - [x] 2.2 Ensure the fetched data includes all necessary task fields as defined in the PRD (task name, ID, duration, start date, end date, and hints).
- [x] 3.0 Generate Excel File
  - [x] 3.1 Research and select a suitable client-side JavaScript library for generating Excel files (e.g., `xlsx` or `exceljs`).
  - [x] 3.2 Add the chosen library as a dependency in `package.json`.
  - [x] 3.3 Create a new utility function in `src/lib/utils.ts` that takes the project data and hints as input.
  - [x] 3.4 Inside the utility function, process the data to concatenate all hints for a single task into a single cell.
  - [x] 3.5 Use the chosen Excel library to generate an Excel workbook from the processed data.
  - [x] 3.6 Ensure the Excel file is formatted clearly with appropriate column headers (Task Name, Task ID, Duration, Start Date, End Date, Task Hints).
- [x] 4.0 Implement Download Functionality
  - [x] 4.1 Create an event handler for the "Download" button's `onClick` event.
  - [x] 4.2 In the event handler, call the data fetching function (from Task 2.1) to retrieve the project data.
  - [x] 4.3 Pass the fetched data to the Excel generation utility function (from Task 3.3).
  - [x] 4.4 Trigger the download of the generated Excel file to the user's browser.
  - [x] 4.5 Implement a dynamic naming convention for the downloaded file (e.g., `[Project Name]_Project_Plan.xlsx`).
- [x] 5.0 Error Handling and User Feedback
  - [x] 5.1 Implement error handling for potential issues during data fetching (e.g., network errors, data not found).
  - [x] 5.2 Implement error handling for potential issues during Excel file generation.
  - [x] 5.3 Utilize `src/hooks/use-toast.tsx` to display success messages upon successful download and informative error messages if the download fails. 