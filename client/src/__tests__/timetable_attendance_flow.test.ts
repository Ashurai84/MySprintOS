import { describe, it, expect } from 'vitest'
import { initialLectures } from '../data/defaultData'
import { calculateSubjectAttendance } from '../utils/attendanceCalculator'
import type { Lecture } from '../types'

describe('Timetable to Attendance Flow & Marking Verification', () => {
  it('correctly reflects DSA-III baseline 3/3 held sessions (100%)', () => {
    const stats = calculateSubjectAttendance('S5-CS01', initialLectures)
    expect(stats.attended).toBe(3)
    expect(stats.totalHeld).toBe(3)
    expect(stats.percentage).toBe(100)
    expect(stats.isWarning).toBe(false)
  })

  it('immediately increments to 4/4 held when Monday Oct 26 class is marked Present', () => {
    const updatedLectures: Lecture[] = [
      ...initialLectures,
      {
        id: 'lec-oct26-slot1',
        date: '2026-10-26',
        subjectId: 'S5-CS01',
        title: 'Data Structures & Algorithm - III',
        faculty: 'Sanjay Sahu (VF)',
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        status: 'attended',
        classroom: 'Classroom No. - 20',
        createdAt: '2026-10-26T09:00:00Z',
        updatedAt: '2026-10-26T09:00:00Z'
      }
    ]

    const stats = calculateSubjectAttendance('S5-CS01', updatedLectures)
    expect(stats.attended).toBe(4)
    expect(stats.totalHeld).toBe(4)
    expect(stats.percentage).toBe(100)
  })

  it('correctly updates to 3/4 held (75%) when Monday Oct 26 class is marked Absent', () => {
    const updatedLectures: Lecture[] = [
      ...initialLectures,
      {
        id: 'lec-oct26-slot1',
        date: '2026-10-26',
        subjectId: 'S5-CS01',
        title: 'Data Structures & Algorithm - III',
        faculty: 'Sanjay Sahu (VF)',
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        status: 'absent',
        classroom: 'Classroom No. - 20',
        createdAt: '2026-10-26T09:00:00Z',
        updatedAt: '2026-10-26T09:00:00Z'
      }
    ]

    const stats = calculateSubjectAttendance('S5-CS01', updatedLectures)
    expect(stats.attended).toBe(3)
    expect(stats.totalHeld).toBe(4)
    expect(stats.percentage).toBe(75)
    expect(stats.absent).toBe(1)
  })

  it('resets to 3/3 held (100%) when attendance is toggled off / unrecorded', () => {
    // When unrecorded or reset, the lecture record is removed or status is 'scheduled'
    const resetLectures: Lecture[] = initialLectures.filter(l => l.date !== '2026-10-26')
    const stats = calculateSubjectAttendance('S5-CS01', resetLectures)
    expect(stats.attended).toBe(3)
    expect(stats.totalHeld).toBe(3)
    expect(stats.percentage).toBe(100)
  })

  it('correctly maps raw title "Data Structures & Algorithm - III" to canonical ID S5-CS01', () => {
    const rawLecture: Lecture = {
      id: 'lec-oct26-slot1',
      date: '2026-10-26',
      subjectId: 'Data Structures & Algorithm - III',
      title: 'Data Structures & Algorithm - III',
      faculty: 'Sanjay Sahu (VF)',
      startTime: '09:00',
      endTime: '10:00',
      durationMinutes: 60,
      status: 'attended',
      classroom: 'Classroom No. - 20',
      createdAt: '2026-10-26T09:00:00Z',
      updatedAt: '2026-10-26T09:00:00Z'
    }

    const testList = [...initialLectures, rawLecture]
    const stats = calculateSubjectAttendance('S5-CS01', testList)
    expect(stats.attended).toBe(4)
    expect(stats.totalHeld).toBe(4)
    expect(stats.percentage).toBe(100)
  })

  it('allows independent attendance marking across multiple slots of the same subject on the same day without cross-slot contamination', () => {
    // Tuesday Oct 27 has 4 slots of DSA-III
    const slot1Lec: Lecture = {
      id: 'lec-oct27-slot1',
      date: '2026-10-27',
      subjectId: 'S5-CS01',
      title: 'Data Structures & Algorithm - III',
      startTime: '09:00',
      endTime: '10:00',
      durationMinutes: 60,
      status: 'attended',
      createdAt: '2026-10-27T09:00:00Z',
      updatedAt: '2026-10-27T09:00:00Z'
    }

    const slot2Lec: Lecture = {
      id: 'lec-oct27-slot2',
      date: '2026-10-27',
      subjectId: 'S5-CS01',
      title: 'Data Structures & Algorithm - III',
      startTime: '10:00',
      endTime: '11:00',
      durationMinutes: 60,
      status: 'absent',
      createdAt: '2026-10-27T10:00:00Z',
      updatedAt: '2026-10-27T10:00:00Z'
    }

    const currentLectures = [...initialLectures, slot1Lec, slot2Lec]

    // Slot 1 is attended, Slot 2 is absent -> baseline 3 + 1 attended = 4, 1 absent = 1, total held = 5
    const stats = calculateSubjectAttendance('S5-CS01', currentLectures)
    expect(stats.attended).toBe(4)
    expect(stats.absent).toBe(1)
    expect(stats.totalHeld).toBe(5)
    expect(stats.percentage).toBe(80)

    // Slot matching simulation: Slot 1 matches slot1Lec, Slot 2 matches slot2Lec, Slot 3 & 4 match nothing
    const findSlotLec = (slotStart: string) => {
      return currentLectures.find(l => 
        l.date === '2026-10-27' && 
        l.subjectId === 'S5-CS01' && 
        l.startTime === slotStart
      )
    }

    expect(findSlotLec('09:00')?.status).toBe('attended')
    expect(findSlotLec('10:00')?.status).toBe('absent')
    expect(findSlotLec('11:10')).toBeUndefined()
    expect(findSlotLec('12:20')).toBeUndefined()
  })
})
