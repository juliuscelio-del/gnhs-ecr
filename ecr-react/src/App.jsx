import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import SectionTabs from './components/SectionTabs'
import QuarterTabs from './components/QuarterTabs'
import GradeSheet from './components/GradeSheet'
import RosterModal from './components/RosterModal'
import ProfileModal from './components/ProfileModal'
import WeightsModal from './components/WeightsModal'
import { DEFAULT_SECTIONS, SECTION_KEYS } from './data/sections'
import {
  loadSections,
  saveSections,
  loadClassList,
  saveClassList,
  loadScores,
  saveScores,
  loadWeights,
  saveWeights,
  loadTeacherProfile,
  saveTeacherProfile,
  clearAllData,
} from './utils/storage'

const QUARTERS = ['q1', 'q2', 'q3', 'q4']

export default function App() {
  // ----- Global state -----
  const [sections, setSections] = useState(() => loadSections() || { ...DEFAULT_SECTIONS })
  const [activeSection, setActiveSection] = useState(SECTION_KEYS[0])
  const [activeQuarter, setActiveQuarter] = useState('q1')
  const [classList, setClassList] = useState({ male: [], female: [] })
  const [scores, setScores] = useState({})
  const [weights, setWeights] = useState(() => loadWeights() || { ww: 40, pt: 40, qa: 20 })
  const [profile, setProfile] = useState(() => loadTeacherProfile())

  // Modals
  const [showRoster, setShowRoster] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showWeights, setShowWeights] = useState(false)
  const [status, setStatus] = useState(null)

  // ----- Load data when section or quarter changes -----
  useEffect(() => {
    const list = loadClassList(activeSection)
    setClassList(list)
    const sc = loadScores(activeSection, activeQuarter)
    setScores(sc)
  }, [activeSection, activeQuarter])

  // ----- Helpers -----
  const showStatus = useCallback((text, ok = true) => {
    setStatus({ text, ok })
    setTimeout(() => setStatus(null), 3000)
  }, [])

  const handleSaveClassList = (newList) => {
    setClassList(newList)
    saveClassList(activeSection, newList)
    showStatus('Class list saved')
  }

  const handleScoreChange = (studentId, field, value) => {
    setScores(prev => {
      const next = {
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          [field]: value,
        },
      }
      saveScores(activeSection, activeQuarter, next)
      return next
    })
  }

  const handleMaxChange = (field, value) => {
    setScores(prev => {
      const next = {
        ...prev,
        __max: {
          ...(prev.__max || {}),
          [field]: value,
        },
      }
      saveScores(activeSection, activeQuarter, next)
      return next
    })
  }

  const handleSaveProfile = (newProfile) => {
    setProfile(newProfile)
    saveTeacherProfile(newProfile)
    showStatus('Profile saved')
    setShowProfile(false)
  }

  const handleSaveWeights = (newWeights) => {
    setWeights(newWeights)
    saveWeights(newWeights)
    showStatus('Weights updated')
    setShowWeights(false)
  }

  const handleSaveSections = (newSections) => {
    setSections(newSections)
    saveSections(newSections)
    showStatus('Sections updated — reloading…')
    // Simple approach: keep current active if still exists
    if (!newSections[activeSection]) {
      setActiveSection(Object.keys(newSections)[0])
    }
  }

  const handleClearAll = () => {
    if (!window.confirm('This will erase ALL class lists, scores, and settings on this device. Continue?')) return
    clearAllData()
    setSections({ ...DEFAULT_SECTIONS })
    setClassList({ male: [], female: [] })
    setScores({})
    setWeights({ ww: 40, pt: 40, qa: 20 })
    setProfile(loadTeacherProfile())
    showStatus('All data cleared', false)
  }

  const currentSectionLabel = sections[activeSection]
    ? `Grade ${sections[activeSection].grade} – ${sections[activeSection].name}`
    : activeSection

  return (
    <div className="app">
      <Header
        profile={profile}
        onOpenProfile={() => setShowProfile(true)}
        onOpenRoster={() => setShowRoster(true)}
        onOpenWeights={() => setShowWeights(true)}
        onClearAll={handleClearAll}
      />

      <main className="main">
        <SectionTabs
          sections={sections}
          active={activeSection}
          onChange={setActiveSection}
        />

        <QuarterTabs
          quarters={QUARTERS}
          active={activeQuarter}
          onChange={setActiveQuarter}
        />

        {status && (
          <div className={`status-msg ${status.ok ? 'ok' : 'err'}`} style={{ marginBottom: 12 }}>
            {status.text}
          </div>
        )}

        <GradeSheet
          sectionKey={activeSection}
          sectionLabel={currentSectionLabel}
          quarter={activeQuarter}
          classList={classList}
          scores={scores}
          weights={weights}
          onScoreChange={handleScoreChange}
          onMaxChange={handleMaxChange}
          onOpenRoster={() => setShowRoster(true)}
        />
      </main>

      {showRoster && (
        <RosterModal
          sectionKey={activeSection}
          sectionLabel={currentSectionLabel}
          sections={sections}
          classList={classList}
          onSave={handleSaveClassList}
          onSaveSections={handleSaveSections}
          onClose={() => setShowRoster(false)}
        />
      )}

      {showProfile && (
        <ProfileModal
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setShowProfile(false)}
        />
      )}

      {showWeights && (
        <WeightsModal
          weights={weights}
          onSave={handleSaveWeights}
          onClose={() => setShowWeights(false)}
        />
      )}
    </div>
  )
}
