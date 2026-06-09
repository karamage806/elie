import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const exportCheckinsPDF = (checkins, companyName = 'WellDesk') => {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.setTextColor(83, 74, 183)
  doc.text('💚 WellDesk', 14, 20)

  doc.setFontSize(13)
  doc.setTextColor(60, 60, 60)
  doc.text(`${companyName} — Wellness Check-in Report`, 14, 30)

  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38)
  doc.text(`Total records: ${checkins.length}`, 14, 44)

  // Table
  autoTable(doc, {
    startY: 52,
    head: [['Date', 'Employee', 'Mood', 'Energy', 'Notes']],
    body: checkins.map(c => [
      c.checkin_date,
      c.user_name || 'Me',
      `${c.mood_score}/5`,
      `${c.energy_score}/5`,
      (c.notes || '').slice(0, 60),
    ]),
    headStyles: { fillColor: [83, 74, 183] },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    styles: { fontSize: 10 },
  })

  doc.save(`welldesk-report-${new Date().toISOString().split('T')[0]}.pdf`)
}
