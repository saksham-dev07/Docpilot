import 'dart:io';
import 'dart:ui';
import 'package:syncfusion_flutter_pdf/pdf.dart';
import 'package:path_provider/path_provider.dart';

Future<String> generateMedicalReportPdf(Map<String, dynamic> data, [Map<String, dynamic> patientData = const {}]) async {
  final PdfDocument document = PdfDocument();
  final PdfPage page = document.pages.add();
  final PdfGraphics graphics = page.graphics;

  final PdfFont headerFont = PdfStandardFont(PdfFontFamily.helvetica, 18, style: PdfFontStyle.bold);
  final PdfFont titleFont = PdfStandardFont(PdfFontFamily.helvetica, 14, style: PdfFontStyle.bold);
  final PdfFont normalFont = PdfStandardFont(PdfFontFamily.helvetica, 12);
  final PdfFont smallFont = PdfStandardFont(PdfFontFamily.helvetica, 10);
  final PdfFont boldFont = PdfStandardFont(PdfFontFamily.helvetica, 12, style: PdfFontStyle.bold);

  // Draw header
  graphics.drawString(
    'DocPilot Medical Center',
    headerFont,
    brush: PdfSolidBrush(PdfColor(0, 0, 140)),
    bounds: const Rect.fromLTWH(0, 10, 500, 30),
    format: PdfStringFormat(alignment: PdfTextAlignment.center),
  );

  graphics.drawString(
    'VIT Bhopal University, Kothri Kalan',
    smallFont,
    brush: PdfSolidBrush(PdfColor(0, 0, 0)),
    bounds: const Rect.fromLTWH(0, 40, 500, 20),
    format: PdfStringFormat(alignment: PdfTextAlignment.center),
  );

  graphics.drawString(
    'Phone: (123) 456-7890 | Email: info@docpilot.com',
    smallFont,
    brush: PdfSolidBrush(PdfColor(0, 0, 0)),
    bounds: const Rect.fromLTWH(0, 60, 500, 20),
    format: PdfStringFormat(alignment: PdfTextAlignment.center),
  );

  // Draw a line separator
  graphics.drawLine(
    PdfPen(PdfColor(0, 0, 0), width: 1),
    const Offset(50, 90),
    const Offset(550, 90),
  );

  // Draw prescription title
  graphics.drawString(
    'MEDICAL RECORD / PRESCRIPTION',
    titleFont,
    brush: PdfSolidBrush(PdfColor(0, 0, 0)),
    bounds: const Rect.fromLTWH(0, 110, 500, 30),
    format: PdfStringFormat(alignment: PdfTextAlignment.center),
  );

  double currentY = 150;
  PdfPage currentPage = page;

  // Helper to draw grids
  double drawGrid(String title, List<List<String>> rowsData, double startY, {int columnsCount = 2, List<double>? columnWidths}) {
    if (rowsData.isEmpty) return startY;

    final PdfGrid grid = PdfGrid();
    grid.style = PdfGridStyle(
      font: normalFont,
      cellPadding: PdfPaddings(left: 10, right: 10, top: 5, bottom: 5),
    );

    grid.columns.add(count: columnsCount);
    grid.headers.add(1);

    final PdfGridRow headerRow = grid.headers[0];
    headerRow.cells[0].value = title;
    headerRow.cells[0].columnSpan = columnsCount;
    headerRow.style.font = boldFont;
    headerRow.style.backgroundBrush = PdfSolidBrush(PdfColor(220, 220, 220));

    for (var rowData in rowsData) {
      final row = grid.rows.add();
      for (int i = 0; i < rowData.length; i++) {
        if (i < columnsCount) {
          row.cells[i].value = rowData[i];
        }
      }
    }

    if (columnWidths != null) {
      for (int i = 0; i < columnWidths.length; i++) {
        grid.columns[i].width = columnWidths[i];
      }
    }

    final PdfLayoutFormat format = PdfLayoutFormat(layoutType: PdfLayoutType.paginate);
    PdfLayoutResult result = grid.draw(
      page: currentPage,
      bounds: Rect.fromLTWH(50, startY, 400, 0),
      format: format,
    )!;

    currentPage = result.page;
    return result.bounds.bottom + 20;
  }

  // 1. Patient Info
  final String pFirstName = patientData['firstName'] ?? '';
  final String pLastName = patientData['lastName'] ?? '';
  final String pName = '$pFirstName $pLastName'.trim();
  final String finalName = pName.isNotEmpty ? pName : (data['patientInformation']?['name'] ?? 'Unknown');
  
  String pAge = 'N/A';
  if (patientData['dob'] != null && patientData['dob'].toString().isNotEmpty) {
      try {
          final dob = DateTime.parse(patientData['dob'].toString());
          final now = DateTime.now();
          int age = now.year - dob.year;
          if (now.month < dob.month || (now.month == dob.month && now.day < dob.day)) {
              age--;
          }
          pAge = age.toString();
      } catch (e) {
          pAge = patientData['dob'].toString();
      }
  }

  final String pGender = patientData['gender'] ?? 'N/A';
  final String pBloodType = patientData['bloodType'] ?? 'N/A';
  final List<dynamic> symptomsList = data['patientInformation']?['symptoms'] ?? [];
  
  List<List<String>> patientRows = [
    ['Name:', finalName],
    ['Age:', pAge],
    ['Sex:', pGender],
    ['Blood Type:', pBloodType],
    ['Date:', DateTime.now().toString().split(' ')[0]],
    ['Symptoms:', symptomsList.join(', ')]
  ];
  currentY = drawGrid('Patient Information', patientRows, currentY, columnsCount: 2, columnWidths: [100, 300]);

  // 2. Diagnosis
  final diagnosis = data['diagnosis'] ?? {};
  final List<dynamic> possibleDiagnoses = diagnosis['possibleDiagnoses'] ?? [];
  if (possibleDiagnoses.isNotEmpty) {
    List<List<String>> diagRows = possibleDiagnoses.map((d) => [d.toString()]).toList();
    currentY = drawGrid('Diagnosis', diagRows, currentY, columnsCount: 1);
  }

  // 3. Tests
  final tests = data['tests'] ?? {};
  final List<dynamic> recommendedTests = tests['recommendedTests'] ?? [];
  if (recommendedTests.isNotEmpty) {
    List<List<String>> testRows = recommendedTests.map((t) => [t.toString()]).toList();
    currentY = drawGrid('Recommended Tests', testRows, currentY, columnsCount: 1);
  }

  // 4. Medications
  final medications = data['medications'] ?? {};
  final List<dynamic> prescribedMeds = medications['prescribedMedications'] ?? [];
  if (prescribedMeds.isNotEmpty) {
    List<List<String>> medRows = prescribedMeds.map((m) => [m.toString()]).toList();
    currentY = drawGrid('Prescribed Medications', medRows, currentY, columnsCount: 1);
  }

  // 5. Precautions
  final precautions = data['precautions'] ?? {};
  final List<dynamic> avoid = precautions['avoid'] ?? [];
  final List<dynamic> prophylactic = precautions['prophylactic'] ?? [];
  if (avoid.isNotEmpty || prophylactic.isNotEmpty) {
    List<List<String>> precRows = [];
    if (avoid.isNotEmpty) precRows.add(['Avoid', avoid.join(', ')]);
    if (prophylactic.isNotEmpty) precRows.add(['Prophylactic', prophylactic.join(', ')]);
    currentY = drawGrid('Precautions', precRows, currentY, columnsCount: 2, columnWidths: [100, 300]);
  }

  // 6. Follow up
  final followUp = data['followUp'] ?? {};
  final List<dynamic> nextSteps = followUp['nextSteps'] ?? [];
  if (nextSteps.isNotEmpty) {
    List<List<String>> followRows = nextSteps.map((n) => [n.toString()]).toList();
    currentY = drawGrid('Follow-up Instructions', followRows, currentY, columnsCount: 1);
  }

  // Doctor Signature
  currentY += 10;
  if (currentY > currentPage.getClientSize().height - 60) {
    currentPage = document.pages.add();
    currentY = 20;
  }

  currentPage.graphics.drawString(
    'Doctor: _________________________',
    normalFont,
    brush: PdfSolidBrush(PdfColor(0, 0, 0)),
    bounds: Rect.fromLTWH(250, currentY, 250, 20),
  );

  currentPage.graphics.drawString(
    'Signature',
    smallFont,
    brush: PdfSolidBrush(PdfColor(100, 100, 100)),
    bounds: Rect.fromLTWH(250, currentY + 20, 250, 20),
  );

  // Save the document
  final List<int> bytes = await document.save();
  document.dispose();

  final publicDir = Directory('/storage/emulated/0/Download/');
  String savePath;
  if (await publicDir.exists()) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    savePath = '${publicDir.path}/MedicalReport_$timestamp.pdf';
  } else {
    final Directory directory = await getApplicationDocumentsDirectory();
    savePath = '${directory.path}/MedicalReport.pdf';
  }

  final File file = File(savePath);
  await file.writeAsBytes(bytes, flush: true);

  return savePath;
}
