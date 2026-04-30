import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/jiawenzhu/Developer/teamusa-oracle/outputs/simple_spreadsheet";
const outputPath = `${outputDir}/simple_monthly_expense_tracker.xlsx`;

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Expense Tracker");

const expenseRows = [
  [new Date("2026-04-01"), "Rent", "Housing", "Bank Transfer", 1850, "Paid"],
  [new Date("2026-04-03"), "Groceries", "Food", "Credit Card", 164.75, "Paid"],
  [new Date("2026-04-05"), "Internet", "Utilities", "Credit Card", 79.99, "Paid"],
  [new Date("2026-04-08"), "Fuel", "Transportation", "Debit Card", 52.4, "Paid"],
  [new Date("2026-04-12"), "Dinner", "Food", "Credit Card", 68.2, "Paid"],
  [new Date("2026-04-16"), "Pharmacy", "Health", "Debit Card", 42.15, "Paid"],
  [new Date("2026-04-21"), "Electricity", "Utilities", "Bank Transfer", 118.6, "Pending"],
  [new Date("2026-04-25"), "Streaming", "Entertainment", "Credit Card", 18.99, "Paid"],
];

const categories = ["Housing", "Food", "Utilities", "Transportation", "Health", "Entertainment", "Other"];
const methods = ["Credit Card", "Debit Card", "Bank Transfer", "Cash"];
const statuses = ["Paid", "Pending"];

sheet.getRange("A1:H1").values = [["Monthly Expense Tracker", null, null, null, null, null, null, null]];
sheet.getRange("A2:H2").values = [["Simple workbook for tracking monthly spending by category.", null, null, null, null, null, null, null]];

sheet.getRange("A4:B8").values = [
  ["Monthly Budget", 2800],
  ["Total Spent", null],
  ["Remaining", null],
  ["Largest Expense", null],
  ["Paid Ratio", null],
];
sheet.getRange("B5:B8").formulas = [
  ["=SUM(E12:E31)"],
  ["=B4-B5"],
  ["=MAX(E12:E31)"],
  ['=IFERROR(COUNTIF(F12:F31,"Paid")/COUNTA(F12:F31),0)'],
];

sheet.getRange("D4:E4").values = [["Category", "Total"]];
sheet.getRange("D5:D11").values = categories.map((category) => [category]);
sheet.getRange("E5:E11").formulas = categories.map((category) => [`=SUMIF(C$12:C$31,"${category}",E$12:E$31)`]);

sheet.getRange("A11:F11").values = [["Date", "Description", "Category", "Payment Method", "Amount", "Status"]];
sheet.getRange("A12:F19").values = expenseRows;
sheet.getRange("A20:F31").values = Array.from({ length: 12 }, () => [null, null, null, null, null, null]);

sheet.getRange("A1:H1").format = {
  fill: "#1F4E5F",
  font: { name: "Aptos Display", size: 18, bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
sheet.getRange("A2:H2").format = {
  fill: "#EAF3F5",
  font: { name: "Aptos", size: 10, color: "#385A64" },
  horizontalAlignment: "center",
};
sheet.getRange("A4:B8").format = {
  fill: "#F7FAFB",
  font: { name: "Aptos", size: 11, color: "#1F2933" },
  borders: { preset: "all", style: "thin", color: "#D8E2E6" },
};
sheet.getRange("A4:A8").format = {
  fill: "#DCEEEF",
  font: { name: "Aptos", size: 11, bold: true, color: "#12343B" },
};
sheet.getRange("D4:E11").format = {
  fill: "#F7FAFB",
  font: { name: "Aptos", size: 11, color: "#1F2933" },
  borders: { preset: "all", style: "thin", color: "#D8E2E6" },
};
sheet.getRange("D4:E4").format = {
  fill: "#C9E4E7",
  font: { name: "Aptos", size: 11, bold: true, color: "#12343B" },
  horizontalAlignment: "center",
};
sheet.getRange("A11:F31").format = {
  fill: "#FFFFFF",
  font: { name: "Aptos", size: 10, color: "#1F2933" },
  borders: { preset: "all", style: "thin", color: "#E5E7EB" },
  verticalAlignment: "center",
};
sheet.getRange("A11:F11").format = {
  fill: "#1F4E5F",
  font: { name: "Aptos", size: 10, bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
};

sheet.getRange("A12:A31").format.numberFormat = "yyyy-mm-dd";
sheet.getRange("B4:B7").format.numberFormat = "$#,##0.00";
sheet.getRange("E5:E11").format.numberFormat = "$#,##0.00";
sheet.getRange("E12:E31").format.numberFormat = "$#,##0.00";
sheet.getRange("B8").format.numberFormat = "0%";
sheet.getRange("B5:B8").format.font = { bold: true, color: "#12343B" };
sheet.getRange("E12:E31").format.horizontalAlignment = "right";

sheet.getRange("A12:F31").format.borders = { preset: "inside", style: "thin", color: "#EEF2F4" };
sheet.getRange("C12:C31").dataValidation = { allowBlank: true, list: { inCellDropDown: true, source: categories } };
sheet.getRange("D12:D31").dataValidation = { allowBlank: true, list: { inCellDropDown: true, source: methods } };
sheet.getRange("F12:F31").dataValidation = { allowBlank: true, list: { inCellDropDown: true, source: statuses } };
sheet.getRange("F12:F31").conditionalFormats.add("containsText", {
  text: "Pending",
  format: { fill: "#FEF3C7", font: { color: "#92400E", bold: true } },
});
sheet.getRange("B6").conditionalFormats.addCellIs({
  operator: "lessThan",
  formula: 0,
  format: { fill: "#FEE2E2", font: { color: "#991B1B", bold: true } },
});

sheet.getRange("A:A").format.columnWidthPx = 96;
sheet.getRange("B:B").format.columnWidthPx = 160;
sheet.getRange("C:C").format.columnWidthPx = 132;
sheet.getRange("D:D").format.columnWidthPx = 132;
sheet.getRange("E:E").format.columnWidthPx = 96;
sheet.getRange("F:F").format.columnWidthPx = 96;
sheet.getRange("G:G").format.columnWidthPx = 24;
sheet.getRange("H:H").format.columnWidthPx = 220;
sheet.getRange("A1:H1").format.rowHeight = 30;
sheet.freezePanes.freezeRows(11);

const chart = sheet.charts.add("ColumnClustered", sheet.getRange("D4:E11"), "Auto");
chart.title.text = "Spending by Category";
chart.setPosition(sheet.getRange("H4:L16"));
chart.width = 420;
chart.height = 280;
chart.hasLegend = false;
chart.axes.valueAxis.title = "Amount";
chart.axes.valueAxis.majorGridlines.format.line.color = "#D8E2E6";

const check = await workbook.inspect({
  kind: "table",
  range: "Expense Tracker!A1:L31",
  include: "values,formulas",
  tableMaxRows: 32,
  tableMaxCols: 12,
});
console.log(check.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 50 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

await workbook.render({ sheetName: "Expense Tracker", range: "A1:L31", scale: 2 });

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`Saved ${outputPath}`);
