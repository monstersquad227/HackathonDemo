import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import EventList from './components/EventList'
import EventCreate from './components/EventCreate'
import EventDetail from './components/EventDetail'
import SponsorManagement from './components/SponsorManagement'
import FundingPoolManagement from './components/FundingPoolManagement'
import TeamManagement from './components/TeamManagement'
import RegistrationManagement from './components/RegistrationManagement'
import CheckInManagement from './components/CheckInManagement'
import CheckIn from './components/CheckIn'
import SubmissionList from './components/SubmissionList'
import SubmissionForm from './components/SubmissionForm'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="container">
            <Link to="/" className="logo">
              <h1>Hackathon Platform</h1>
            </Link>
            <div className="nav-links">
              <Link to="/">活动列表</Link>
              <Link to="/events/create">创建活动</Link>
              <Link to="/sponsors">赞助商管理</Link>
              <Link to="/teams">队伍管理</Link>
            </div>
          </div>
        </nav>
        <main className="container">
          <Routes>
            <Route path="/" element={<EventList />} />
            <Route path="/events/create" element={<EventCreate />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/events/:eventId/funding-pool" element={<FundingPoolManagement />} />
            <Route path="/events/:eventId/registrations" element={<RegistrationManagement />} />
            <Route path="/events/:eventId/check-in" element={<CheckInManagement />} />
            <Route path="/events/:eventId/checkin" element={<CheckIn />} />
            <Route path="/events/:eventId/submissions" element={<SubmissionList />} />
            <Route path="/events/:eventId/submit" element={<SubmissionForm />} />
            <Route path="/sponsors" element={<SponsorManagement />} />
            <Route path="/teams" element={<TeamManagement />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

