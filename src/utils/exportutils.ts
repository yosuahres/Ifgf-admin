import { utils, writeFile } from 'xlsx';

export function exportToExcel(data: any[], title: string) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create worksheet from data
  const worksheet = utils.json_to_sheet(data);
  
  // Create workbook
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Data');
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `${title.replace(/\s+/g, '_')}_${timestamp}.xlsx`;
  
  // Export file
  writeFile(workbook, filename);
}