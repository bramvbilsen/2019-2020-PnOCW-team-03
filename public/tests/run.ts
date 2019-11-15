import env from "../env/env";
import * as tests from "./tests";
import { ITestResult, TestResult } from "./image_processing/helpers";

export default async function () {
    const results: { [test_suite: string]: ITestResult[] } = {};
    const testPromises: Promise<void>[] = [];
    const afterDocLoad: () => Promise<void> = () => new Promise((resolve, reject) => {
        $(() => {
            resolve();
        });
    });
    await afterDocLoad();

    $("#test-results").css("display", "inherit");
    const testResultsTextDiv = $("#test-results-text");

    if (Object.keys(env.testArgs).length === 0) {
        for (let [test_suite, tests_runner] of Object.entries(tests)) {
            const id = `${test_suite}-results-text`;
            testResultsTextDiv.append(
                `<div id=${id}><h3>${test_suite}</h3></div>`
            );
            const div: JQuery<HTMLDivElement> = $(`#${id}`);
            testPromises.push(new Promise((resolve, reject) => {
                tests_runner(testResult => {
                    $("#loading").css("display", "none");
                    div.append(testResult.htmlMsg);
                    if (!results[test_suite]) { results[test_suite] = [testResult] }
                    else results[test_suite].push(testResult);
                    resolve();
                }).then(totalExecutionTime => {
                    handleTestSuiteFinish(totalExecutionTime, div);
                });
            }));
        }
    } else {
        for (let [test_suite, test_suite_tests] of Object.entries(env.testArgs)) {
            const id = `${test_suite}-results-text`;
            testResultsTextDiv.append(
                `<div id=${id}><h3>${test_suite}</h3></div>`
            );
            const div: JQuery<HTMLDivElement> = $(`#${id}`);
            testPromises.push(new Promise((resolve, reject) => {
                //@ts-ignore
                tests[test_suite](testResult => {
                    $("#loading").css("display", "none");
                    div.append(testResult.htmlMsg);
                    if (!results[test_suite]) { results[test_suite] = [testResult] }
                    else results[test_suite].push(testResult);
                    resolve();
                }, test_suite_tests as string[]).then((totalExecutionTime: number) => {
                    handleTestSuiteFinish(totalExecutionTime, div);
                })
            }));

        }
    }
    await Promise.all(testPromises);
    return results;
}

function handleTestSuiteFinish(totalExecutionTime: number, div: JQuery<HTMLDivElement>) {
    div.append(
        `==========👌 COMPLETED IN ${totalExecutionTime}ms 👌==========<br/><br/><br/><br/>`
    );
};