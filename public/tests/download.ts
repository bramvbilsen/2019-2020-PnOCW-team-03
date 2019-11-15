import { TestResult, ITestResult } from "./image_processing/helpers";

/**
 * Downloads the provided test results in JSON format.
 * @param testResults 
 */
export default function (testResults: { [test_suite: string]: ITestResult[] }) {
    const downloadLink = document.createElement("a");

    // const formattedResults = testResults.map((res) => res.toJsonObject());
    downloadLink.setAttribute("href", "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(testResults)));
    downloadLink.setAttribute("download", "test_results.json");
    downloadLink.click();
}