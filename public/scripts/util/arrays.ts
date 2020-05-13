/**
 * Flattens `arr` 1 level: [[1, 2], [3, 4]] => [1, 2, 3, 4]
 * @param arr
 */
export function flattenOneLevel(arr: Array<any>) {
    return arr.reduce((arr, curr) => {
        return arr.concat(curr);
    }, []);
}

export function median(arr: Array<number>) {
    const i = Math.floor(arr.length / 2);
    arr = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? arr[i] : (arr[i - 1] + arr[i]) / 2;
}
