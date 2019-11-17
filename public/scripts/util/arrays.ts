/**
 * Flattens `arr` 1 level: [[1, 2], [3, 4]] => [1, 2, 3, 4]
 * @param arr
 */
export function flattenOneLevel(arr: Array<any>) {
    return arr.reduce((arr, curr) => {
        return arr.concat(curr);
    }, []);
}
