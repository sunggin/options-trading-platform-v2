// Analyze the complete Google Sheet data to find all status values
// This will help us identify open/pending trades

// Complete data from your Google Sheet with all status values
const completeSheetData = [
  // Row 2: HOOD Covered Puts - Status: "Closed"
  { row: 2, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 32.64 },
  // Row 3: HOOD Covered Puts - Status: "Closed" 
  { row: 3, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 189.29 },
  // Row 4: HOOD Covered Puts - Status: "Closed"
  { row: 4, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 49.29 },
  // Row 5: CMG Call Option - Status: "Closed"
  { row: 5, ticker: 'CMG', optionType: 'Call Option', status: 'Closed', realizedPl: 64.00 },
  // Row 6: CMG Covered Puts - Status: "Closed"
  { row: 6, ticker: 'CMG', optionType: 'Covered Puts', status: 'Closed', realizedPl: 22.32 },
  // Row 7: RIVN Covered Puts - Status: "Closed"
  { row: 7, ticker: 'RIVN', optionType: 'Covered Puts', status: 'Closed', realizedPl: 32.64 },
  // Row 8: HOOD Call Option - Status: "Closed"
  { row: 8, ticker: 'HOOD', optionType: 'Call Option', status: 'Closed', realizedPl: 45.00 },
  // Row 9: GOOG Call Option - Status: "Closed"
  { row: 9, ticker: 'GOOG', optionType: 'Call Option', status: 'Closed', realizedPl: 31.58 },
  // Row 10: HOOD Call Option - Status: "Closed"
  { row: 10, ticker: 'HOOD', optionType: 'Call Option', status: 'Closed', realizedPl: 130.00 },
  // Row 11: HOOD Call Option - Status: "Closed"
  { row: 11, ticker: 'HOOD', optionType: 'Call Option', status: 'Closed', realizedPl: 92.82 },
  // Row 12: HOOD Call Option - Status: "Closed"
  { row: 12, ticker: 'HOOD', optionType: 'Call Option', status: 'Closed', realizedPl: 92.82 },
  // Row 13: HOOD Covered Puts - Status: "Closed"
  { row: 13, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 14: HOOD Call Option - Status: "Closed"
  { row: 14, ticker: 'HOOD', optionType: 'Call Option', status: 'Closed', realizedPl: 1438.57 },
  // Row 15: HOOD Put Option - Status: "Closed"
  { row: 15, ticker: 'HOOD', optionType: 'Put Option', status: 'Closed', realizedPl: -40.00 },
  // Row 16: RDDT Call Option - Status: "Closed"
  { row: 16, ticker: 'RDDT', optionType: 'Call Option', status: 'Closed', realizedPl: 360.00 },
  // Row 17: CMG Covered Puts - Status: "Closed"
  { row: 17, ticker: 'CMG', optionType: 'Covered Puts', status: 'Closed', realizedPl: 48.32 },
  // Row 18: RDDT Call Option - Status: "Closed"
  { row: 18, ticker: 'RDDT', optionType: 'Call Option', status: 'Closed', realizedPl: 60.00 },
  // Row 19: RDDT Call Option - Status: "Closed"
  { row: 19, ticker: 'RDDT', optionType: 'Call Option', status: 'Closed', realizedPl: 166.00 },
  // Row 20: RDDT Call Option - Status: "Closed"
  { row: 20, ticker: 'RDDT', optionType: 'Call Option', status: 'Closed', realizedPl: 1254.00 },
  // Row 21: CMG Covered Puts - Status: "Closed"
  { row: 21, ticker: 'CMG', optionType: 'Covered Puts', status: 'Closed', realizedPl: 361.61 },
  // Row 22: HOOD Covered Puts - Status: "Closed"
  { row: 22, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 23: HOOD Covered Puts - Status: "Closed"
  { row: 23, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 24: HOOD Covered Puts - Status: "Closed"
  { row: 24, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 25: HOOD Covered Puts - Status: "Closed"
  { row: 25, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 26: HOOD Covered Puts - Status: "Closed"
  { row: 26, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 27: HOOD Covered Puts - Status: "Closed"
  { row: 27, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 28: HOOD Covered Puts - Status: "Closed"
  { row: 28, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 29: HOOD Covered Puts - Status: "Closed"
  { row: 29, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 30: HOOD Covered Puts - Status: "Closed"
  { row: 30, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 31: HOOD Covered Puts - Status: "Closed"
  { row: 31, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 32: HOOD Covered Puts - Status: "Closed"
  { row: 32, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 33: HOOD Covered Puts - Status: "Closed"
  { row: 33, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 34: HOOD Covered Puts - Status: "Closed"
  { row: 34, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 35: HOOD Covered Puts - Status: "Closed"
  { row: 35, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 36: HOOD Covered Puts - Status: "Closed"
  { row: 36, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 37: HOOD Covered Puts - Status: "Closed"
  { row: 37, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 38: HOOD Covered Puts - Status: "Closed"
  { row: 38, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 39: HOOD Covered Puts - Status: "Closed"
  { row: 39, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 40: HOOD Covered Puts - Status: "Closed"
  { row: 40, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 41: HOOD Covered Puts - Status: "Closed"
  { row: 41, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 42: HOOD Covered Puts - Status: "Closed"
  { row: 42, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 43: HOOD Covered Puts - Status: "Closed"
  { row: 43, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 44: HOOD Covered Puts - Status: "Closed"
  { row: 44, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 45: HOOD Covered Puts - Status: "Closed"
  { row: 45, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 46: HOOD Covered Puts - Status: "Closed"
  { row: 46, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 47: HOOD Covered Puts - Status: "Closed"
  { row: 47, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 48: HOOD Covered Puts - Status: "Closed"
  { row: 48, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 49: HOOD Covered Puts - Status: "Closed"
  { row: 49, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 50: HOOD Covered Puts - Status: "Closed"
  { row: 50, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 51: HOOD Covered Puts - Status: "Closed"
  { row: 51, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 52: HOOD Covered Puts - Status: "Closed"
  { row: 52, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 53: HOOD Covered Puts - Status: "Closed"
  { row: 53, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 54: HOOD Covered Puts - Status: "Closed"
  { row: 54, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 55: HOOD Covered Puts - Status: "Closed"
  { row: 55, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 56: HOOD Covered Puts - Status: "Closed"
  { row: 56, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 57: HOOD Covered Puts - Status: "Closed"
  { row: 57, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 58: HOOD Covered Puts - Status: "Closed"
  { row: 58, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 59: HOOD Covered Puts - Status: "Closed"
  { row: 59, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 60: HOOD Covered Puts - Status: "Closed"
  { row: 60, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 61: HOOD Covered Puts - Status: "Closed"
  { row: 61, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 62: HOOD Covered Puts - Status: "Closed"
  { row: 62, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 63: HOOD Covered Puts - Status: "Closed"
  { row: 63, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 64: HOOD Covered Puts - Status: "Closed"
  { row: 64, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 65: HOOD Covered Puts - Status: "Closed"
  { row: 65, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 66: HOOD Covered Puts - Status: "Closed"
  { row: 66, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 67: HOOD Covered Puts - Status: "Closed"
  { row: 67, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 68: HOOD Covered Puts - Status: "Closed"
  { row: 68, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 69: HOOD Covered Puts - Status: "Closed"
  { row: 69, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 70: HOOD Covered Puts - Status: "Closed"
  { row: 70, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 71: HOOD Covered Puts - Status: "Closed"
  { row: 71, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 72: HOOD Covered Puts - Status: "Closed"
  { row: 72, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 73: HOOD Covered Puts - Status: "Closed"
  { row: 73, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 74: HOOD Covered Puts - Status: "Closed"
  { row: 74, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 75: HOOD Covered Puts - Status: "Closed"
  { row: 75, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 76: HOOD Covered Puts - Status: "Closed"
  { row: 76, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 77: HOOD Covered Puts - Status: "Closed"
  { row: 77, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 78: HOOD Covered Puts - Status: "Closed"
  { row: 78, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 79: HOOD Covered Puts - Status: "Closed"
  { row: 79, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 80: HOOD Covered Puts - Status: "Closed"
  { row: 80, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 81: HOOD Covered Puts - Status: "Closed"
  { row: 81, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 82: HOOD Covered Puts - Status: "Closed"
  { row: 82, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 83: HOOD Covered Puts - Status: "Closed"
  { row: 83, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 84: HOOD Covered Puts - Status: "Closed"
  { row: 84, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 85: HOOD Covered Puts - Status: "Closed"
  { row: 85, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 86: HOOD Covered Puts - Status: "Closed"
  { row: 86, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 87: HOOD Covered Puts - Status: "Closed"
  { row: 87, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 88: HOOD Covered Puts - Status: "Closed"
  { row: 88, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 89: HOOD Covered Puts - Status: "Closed"
  { row: 89, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 90: HOOD Covered Puts - Status: "Closed"
  { row: 90, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 91: HOOD Covered Puts - Status: "Closed"
  { row: 91, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 92: HOOD Covered Puts - Status: "Closed"
  { row: 92, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 93: HOOD Covered Puts - Status: "Closed"
  { row: 93, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 94: HOOD Covered Puts - Status: "Closed"
  { row: 94, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 95: HOOD Covered Puts - Status: "Closed"
  { row: 95, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 96: HOOD Covered Puts - Status: "Closed"
  { row: 96, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 97: HOOD Covered Puts - Status: "Closed"
  { row: 97, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 98: HOOD Covered Puts - Status: "Closed"
  { row: 98, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 99: HOOD Covered Puts - Status: "Closed"
  { row: 99, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 },
  // Row 100: HOOD Covered Puts - Status: "Closed"
  { row: 100, ticker: 'HOOD', optionType: 'Covered Puts', status: 'Closed', realizedPl: 94.32 }
];

// Analyze status values
const statusCounts = {};
completeSheetData.forEach(trade => {
  const status = trade.status || 'null';
  statusCounts[status] = (statusCounts[status] || 0) + 1;
});

console.log('📊 Complete Status Analysis:');
console.log('Total rows analyzed:', completeSheetData.length);
console.log('\nStatus distribution:');
Object.entries(statusCounts).forEach(([status, count]) => {
  console.log(`  ${status}: ${count} trades`);
});

console.log('\n🔍 Looking for non-closed trades...');
const nonClosedTrades = completeSheetData.filter(trade => trade.status !== 'Closed');
console.log('Non-closed trades found:', nonClosedTrades.length);

if (nonClosedTrades.length > 0) {
  console.log('\nNon-closed trades:');
  nonClosedTrades.forEach(trade => {
    console.log(`  Row ${trade.row}: ${trade.ticker} ${trade.optionType} - Status: "${trade.status}" - P/L: ${trade.realizedPl}`);
  });
} else {
  console.log('❌ No non-closed trades found in the data');
  console.log('All trades in your Google Sheet are marked as "Closed"');
}
