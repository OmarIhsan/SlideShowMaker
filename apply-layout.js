const fs = require('fs');

// 1. lib/slide-layout.ts
let sl = fs.readFileSync('lib/slide-layout.ts', 'utf8');
sl = sl.replace(/bodyX: 1.72,/, 'bodyX: 1.72,'); // already done
fs.writeFileSync('lib/slide-layout.ts', sl);

// 2. lib/presentation-exporters.ts
let pe = fs.readFileSync('lib/presentation-exporters.ts', 'utf8');

// PPTX structural line
pe = pe.replace(/x: 0\.5,\s*y: 1\.1,\s*w: 0\.0,\s*h: 3\.4,\s*line: { color: "0F4C81", width: 1 }/g,
  'x: 1.5,\n      y: 1.1,\n      w: 0.0,\n      h: 3.4,\n      line: { color: "E2E8F0", width: 1 }');

// PPTX Footer Right
pe = pe.replace(/x: 4\.0,\s*y: 4\.8,\s*w: 3\.0,\s*h: 0\.3,\s*fontSize: 8,\s*bold: true,\s*color: "94A3B8", \/\/ Slate Gray\s*fontFace: "Inter",\s*align: "right"/g,
  'x: 3.5,\n      y: 4.8,\n      w: 1.5,\n      h: 0.3,\n      fontSize: 8,\n      bold: true,\n      color: "94A3B8", // Slate Gray\n      fontFace: "Plus Jakarta Sans",\n      align: "right"');

// PPTX Body text
pe = pe.replace(/fontSize: 17,/g, 'fontSize: 15,');
pe = pe.replace(/fontFace: "Inter",\s*color: "1E293B",\s*bullet: segment\.isListItem \? { code: "2022" } : false,\s*bold: true/g,
  'fontFace: "Plus Jakarta Sans",\n          color: "1E293B",\n          bullet: segment.isListItem ? { code: "2022" } : false,\n          bold: true,\n          lineSpacingMultiple: 1.2');

// PDF structural line
pe = pe.replace(/doc\.setDrawColor\("#0F4C81"\)\s*doc\.setLineWidth\(0\.01\)\s*doc\.line\(0\.5, 1\.1, 0\.5, 4\.5\)/g,
  'doc.setDrawColor("#E2E8F0")\n  doc.setLineWidth(0.01)\n  doc.line(1.5, 1.1, 1.5, 4.5)');

// PDF Footer Right
pe = pe.replace(/doc\.setFont\("Inter", "bold"\)\s*doc\.setFontSize\(8\)\s*doc\.setTextColor\("#94A3B8"\) \/\/ Slate Gray\s*doc\.text\(footerRightText, 7\.0, 4\.95, { align: "right" }\)/g,
  'doc.setFont("Plus Jakarta Sans", "bold")\n  doc.setFontSize(8)\n  doc.setTextColor("#94A3B8") // Slate Gray\n  doc.text(footerRightText, 5.0, 4.95, { align: "right" })');

// PDF font sizes and face
pe = pe.replace(/doc\.setFontSize\(17\)/g, 'doc.setFontSize(15)');
pe = pe.replace(/\(17 \/ 72\)/g, '(15 / 72)');
pe = pe.replace(/doc\.setFont\(fontToUse, "bold"\)/g, 'doc.setFont("Plus Jakarta Sans", "bold")');

fs.writeFileSync('lib/presentation-exporters.ts', pe);

// 3. components/slide-preview.tsx
let sp = fs.readFileSync('components/slide-preview.tsx', 'utf8');

sp = sp.replace(/left: "6\.67%", top: "19\.6%", width: "1px", height: "60\.4%", backgroundColor: TOKEN\.cobalt/g,
  'left: "20.0%", top: "19.6%", width: "1px", height: "60.4%", backgroundColor: "#E2E8F0"');

sp = sp.replace(/left: "7\.33%", top: "22\.22%", width: "86\.0%", height: "60\.44%"/g,
  'left: "22.93%", top: "22.22%", width: "43.73%", height: "60.44%", fontFamily: "Plus Jakarta Sans, sans-serif"');

sp = sp.replace(/left: "6\.67%", width: "86\.66%"/g,
  'left: "20.0%", width: "46.66%"');

sp = sp.replace(/text-\[17px\]/g, 'text-[15px] font-["Plus_Jakarta_Sans"]');
sp = sp.replace(/lineHeight: "1\.3"/g, 'lineHeight: "1.2"');

fs.writeFileSync('components/slide-preview.tsx', sp);

console.log('done');
