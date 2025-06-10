// Utility to calculate attendance summary for each student
// Present codes: 'P', 'Present', 'L', any number (e.g., 1, 2, 3, ...)
// Absent codes: 'A', 'S', 'H', and any other code not listed as present

export interface AttendanceSummary {
  studentName: string;
  totalPresent: number | '';
  totalAbsent: number | '';
  attendancePercent: number | '';
}

// Accepts an array of attendance records per student
// Each record: { name: string, attendance: { [day: string]: string } }
export function calculateAttendanceSummary(records: Array<{ name: string, attendance: { [day: string]: string } }>): AttendanceSummary[] {
  return records.map(record => {
    const { name, attendance } = record;
    if (!attendance || Object.keys(attendance).length === 0) {
      return {
        studentName: name,
        totalPresent: '',
        totalAbsent: '',
        attendancePercent: ''
      };
    }
    let present = 0;
    let absent = 0;
    const presentCodes = ['P', 'Present', 'L'];
    Object.values(attendance).forEach(val => {
      if (
        presentCodes.includes(val) ||
        (!isNaN(Number(val)) && val.trim() !== '')
      ) {
        present++;
      } else {
        absent++;
      }
    });
    const totalDays = present + absent;
    const percent = totalDays > 0 ? parseFloat(((present / totalDays) * 100).toFixed(2)) : '';
    return {
      studentName: name,
      totalPresent: present,
      totalAbsent: absent,
      attendancePercent: percent
    };
  });
} 