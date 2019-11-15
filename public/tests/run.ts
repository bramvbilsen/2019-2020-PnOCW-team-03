import env from "../env/env";
import * as tests from "./tests";

export default function () {
    $(() => {
        $("#test-results").css("display", "inherit");
        const testResultsTextDiv = $("#test-results-text");

        if (Object.keys(env.testArgs).length === 0) {
            for (let [test_suite, tests_runner] of Object.entries(tests)) {
                const id = `${test_suite}-results-text`;
                testResultsTextDiv.append(
                    `<div id=${id}><h3>${test_suite}</h3></div>`
                );
                const div = $(`#${id}`);
                tests_runner(testResult => {
                    $("#loading").css("display", "none");
                    div.append(testResult.htmlMsg);
                }).then(totalExecutionTime => {
                    div.append(
                        `==========👌 COMPLETED IN ${totalExecutionTime}ms 👌==========<br/><br/><br/><br/>`
                    );
                });
            }
        } else {
            for (let [test_suite, test_suite_tests] of Object.entries(env.testArgs)) {
                const id = `${test_suite}-results-text`;
                testResultsTextDiv.append(
                    `<div id=${id}><h3>${test_suite}</h3></div>`
                );
                const div = $(`#${id}`);
                //@ts-ignore
                tests[test_suite](testResult => {
                    $("#loading").css("display", "none");
                    div.append(testResult.htmlMsg);
                }, test_suite_tests as string[]).then((totalExecutionTime: number) => {
                    div.append(
                        `==========👌 COMPLETED IN ${totalExecutionTime}ms 👌==========<br/><br/><br/><br/>`
                    );
                })
            }
        }
    });
}