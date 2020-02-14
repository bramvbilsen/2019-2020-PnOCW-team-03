import * as fs from 'fs';
import * as path from "path";

/**
 * 
 * @param args `fileName`: Name of the wanted CSV file.  
 * `columNames`: Names of the columns.  
 * `columnDatas`: Data to put in each column (length should be equal to `columnNames`) (each item should have the same length)
 */
export function createCSV(args: { fileName: string, columnNames: string[], columnDatas: Array<number[]> }) {
    if (args.columnNames.length != args.columnDatas.length) {
        throw new Error("Amount of column data should equal the amount of column names.");
    }
    let rows: Array<any> = [args.columnNames]
    for (let i = 0; i < args.columnDatas[0].length; i++) {
        const newRow = [];
        for (let j = 0; j < args.columnDatas.length; j++) {
            newRow.push(args.columnDatas[j][i]);
        }
        rows.push(newRow);
    }
    const csvString = { rows }.rows.join("\n");
    fs.writeFile(`${path.resolve(__dirname + "/../../" + "/scientific_test_results")}/${args.fileName}.csv`, csvString, err => {
        if (err) return console.log(err);
        console.log('FILE SUCCESSFULLY WRITTEN!\n');
    });
}