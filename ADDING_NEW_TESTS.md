# How to Add a New Cognitive Test

This document outlines the steps to add a new cognitive test to the application, following the established refactored structure. This structure is designed to be modular and make adding new tests as straightforward as possible.

## Overview of the Process

Adding a new test involves these main steps:

1.  **Create the Test Logic Component**: This is the React component that contains the actual UI and interactive logic for your test.
2.  **Define Result Types**: Specify the structure of the data your test will produce.
3.  **Update Test Configuration**: Add metadata for your new test (like its name, path, and instructions) to a central configuration file.
4.  **Create the Test Page**: This is the Next.js page file that will host your test component using a standard layout.
5.  **(Optional) Update Navigation**: If applicable, add your new test to any central navigation or test listing pages.

## Detailed Steps

### 1. Create the Test Logic Component

This component will handle the presentation and interaction of your specific test.

*   **Location**: `web/src/components/tests/`
*   **Naming**: Use a descriptive name, e.g., `YourNewTestNameTest.tsx`.
*   **Props**:
    *   The component **must** accept props conforming to the `TestComponentProps` interface (defined in `web/src/types/index.ts`).
    *   Crucially, it must accept an `onComplete` callback function.
*   **Functionality**:
    *   Implement all UI elements and logic for the test.
    *   When the test concludes, call the `onComplete` prop with an object containing the test results. Define a specific TypeScript interface for this results object (see next step).

**Example Structure (`YourNewTestNameTest.tsx`):**

```tsx
"use client";

import React, { useState /*, other hooks */ } from "react";
import { TestComponentProps } from "@/types";

// Define the specific structure of results this test will produce
interface YourNewTestResults {
  score: number;
  accuracy?: number;
  // ... other specific result fields
}

// Extend TestComponentProps to specify the exact results type for onComplete
interface YourNewTestNameTestProps extends TestComponentProps {
  onComplete: (results: YourNewTestResults) => void;
}

const YourNewTestNameTest: React.FC<YourNewTestNameTestProps> = ({ onComplete }) => {
  // ... Your test's state and logic ...

  const handleFinishTest = () => {
    // ... calculate results ...
    const results: YourNewTestResults = {
      score: 100,
      accuracy: 0.95,
    };
    onComplete(results);
  };

  return (
    <div>
      {/* Your test UI */}
      <button onClick={handleFinishTest}>Finish Test</button>
    </div>
  );
};

export default YourNewTestNameTest;
```

### 2. Define Result Types

Standardize the data structure for your new test's results.

*   **Location**: `web/src/types/index.ts`
*   **Actions**:
    1.  Create a new TypeScript interface for your test's specific results. It should extend the base `TestResult` interface.
        ```typescript
        export interface YourNewTestNameResult extends TestResult {
          // Fields specific to YourNewTestNameTest's results, matching YourNewTestResults from above
          score: number;
          accuracy?: number;
          // ... other specific result fields
        }
        ```
    2.  Add your new result type to the `AnyTestResult` union type:
        ```typescript
        export type AnyTestResult = 
          | ReactionTimeResult 
          | ScooterReadinessResult
          | YourNewTestNameResult; // <-- Add your new type here
        ```

### 3. Update Test Configuration

Add metadata for your new test to the central configuration. This allows it to be easily listed and its page to be set up with standard information.

*   **Location**: `web/src/app/tests/testConfig.ts`
*   **Actions**: Add a new object to the `TESTS_CONFIG` array. This object should conform to the `TestConfig` interface (defined in `web/src/types/index.ts`).

**Example Entry in `TESTS_CONFIG`:**

```typescript
import React from "react"; // If instructions use JSX
// ... (urentColors if needed for JSX instructions)

export const TESTS_CONFIG: TestConfig[] = [
  // ... existing test configurations ...
  {
    id: "your-new-test-id", // Unique kebab-case identifier
    name: "Your New Test Name", // User-friendly display name
    path: "/tests/your-new-test-id", // URL path for the test
    description: "A brief description of what this new test measures.",
    instructionTitle: "Instructions for Your New Test", // Optional: Custom title for instruction box
    instructions: `
Detailed instructions for the user on how to perform the test.
Can be a multi-line string, or JSX for richer formatting (see Scooter Readiness for example).
    `,
    // Example with JSX instructions (remember to import React):
    // instructions: (
    //   <>
    //     <p>First, do this.</p>
    //     <p>Then, do <strong>that</strong>.</p>
    //   </>
    // ),
  },
];
```

### 4. Create the Test Page

This is the Next.js page component that will render your test using the standard layout.

*   **Location**: Create a new folder and file based on the `path` defined in `testConfig.ts`. For example, if `path` is `"/tests/your-new-test-id"`, create `web/src/app/tests/your-new-test-id/page.tsx`.
*   **Content**: The page will be relatively minimal as it leverages `TestPageLayout` and the configuration.

**Example (`web/src/app/tests/your-new-test-id/page.tsx`):**

```tsx
"use client";

import { useRouter } from "next/navigation"; // Optional, if you need specific navigation beyond back button
import TestPageLayout from "@/components/layout/TestPageLayout";
import YourNewTestNameTest from "@/components/tests/YourNewTestNameTest"; // Your test component
import { useTestResults } from "@/context/TestResultsContext";
import { YourNewTestNameResult, TestComponentProps } from "@/types"; // Your specific result type and TestComponentProps
import { getTestConfigById } from "@/app/tests/testConfig";

const TEST_ID = "your-new-test-id"; // Must match the ID in testConfig.ts

export default function YourNewTestNamePage() {
  const router = useRouter(); // Optional
  const { addResult } = useTestResults();

  const testConfig = getTestConfigById(TEST_ID);

  if (!testConfig) {
    return (
      <div>
        <h1>Error: Test Configuration Not Found</h1>
        <p>Could not find configuration for test ID: {TEST_ID}</p>
      </div>
    );
  }

  const { name: TEST_NAME, instructions, instructionTitle } = testConfig;

  // Type the 'results' parameter to match the one defined in YourNewTestNameTest.tsx
  const handleTestComplete: TestComponentProps['onComplete'] = (results: any /* Cast to your specific test component result type e.g. { score: number; accuracy?: number; } */) => {
    const testResultData: YourNewTestNameResult = {
      testId: TEST_ID,
      testName: TEST_NAME, 
      timestamp: Date.now(),
      ...results, // Spread the specific results from your component
    };
    addResult(testResultData);
    console.log("New test completed with results:", testResultData);
    // Optionally navigate to a results summary page or elsewhere
    // router.push("/results"); 
  };

  return (
    <TestPageLayout
      title={TEST_NAME}
      instructions={instructions}
      instructionTitle={instructionTitle} 
      testId={TEST_ID}
    >
      <YourNewTestNameTest onComplete={handleTestComplete} />
      {/* 
        If your test page needs an additional info section below the test component 
        (like the "Как работает оценка?" section in ScooterReadinessPage),
        you can define that JSX in this file and pass it as another child here.
        Example:
        const AdditionalInfo = () => (
          <div className="mt-8 p-6 rounded-xl shadow-lg bg-white border border-gray-200">
            <h3>More Details</h3>
            <p>Some extra info about this test...</p>
          </div>
        );
        return (
          <TestPageLayout ...>
            <YourNewTestNameTest onComplete={handleTestComplete} />
            <AdditionalInfo />
          </TestPageLayout>
        );
      */}
    </TestPageLayout>
  );
}
```

**Note on `handleTestComplete`**: Ensure the `results` parameter in `handleTestComplete` is correctly typed to match the output of your specific test logic component (e.g., `YourNewTestResults` from step 1). The example above uses `any` for brevity in the `TestComponentProps['onComplete']` type hint, but you should cast or type it appropriately when constructing `testResultData`.

### 5. (Optional) Update Navigation / Test Listing

If you have a central page that lists all available tests (e.g., a dashboard or the homepage), you'll need to update it to include your new test. 

*   This might involve dynamically generating the list by importing `TESTS_CONFIG` from `web/src/app/tests/testConfig.ts` and mapping over it to create links or cards for each test.
*   The `Test` interface and `TEST_BANK` array in `web/src/types/index.ts` seem to be an older way of listing tests. Consider migrating fully to using `TESTS_CONFIG` for this purpose if not already done, or ensure both are updated consistently.

---

By following these steps, you can efficiently add new cognitive tests while maintaining a consistent structure and user experience across the application. 