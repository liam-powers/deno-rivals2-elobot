import { cleanNickname } from './helpers.ts';
import { assertEquals } from "jsr:@std/assert";

const testCases = [
  { input: "John Doe (1503|#766)", expected: "John Doe" },
  { input: "Jane Smith (315|#12543)", expected: "Jane Smith" },
  { input: "Jane Smith (000|#1212)", expected: "Jane Smith" },
]

Deno.test("cleanNickname", () => {
    for (const testCase of testCases) {
        const result = cleanNickname(testCase.input);
        assertEquals(result, testCase.expected);
    }
});