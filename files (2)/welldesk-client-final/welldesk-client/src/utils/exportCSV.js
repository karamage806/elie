import Papa from 'papaparse'

export const exportCheckinsCSV = (checkins) => {
  const rows = checkins.map(c => ({
    Date:         c.checkin_date,
    Employee:     c.user_name || 'Me',
    Mood:         c.mood_score,
    Energy:       c.energy_score,
    Notes:        c.notes || '',
    'Sick Note':  c.sick_note_url ? 'Yes' : 'No',
  }))

  const csv = Papa.unparse(rows)
  downloadCSV(csv, `welldesk-checkins-${today()}.csv`)
}

export const exportTeamCSV = (team) => {
  const rows = team.map(u => ({
    Name:           u.name,
    Email:          u.email,
    Role:           u.role,
    'Avg Mood':     u.avg_mood || 'N/A',
    'Last Check-in': u.last_checkin ? new Date(u.last_checkin).toLocaleDateString() : 'Never',
    Joined:         new Date(u.created_at).toLocaleDateString(),
  }))

  const csv = Papa.unparse(rows)
  downloadCSV(csv, `welldesk-team-${today()}.csv`)
}

const downloadCSV = (csv, filename) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const today = () => new Date().toISOString().split('T')[0]
