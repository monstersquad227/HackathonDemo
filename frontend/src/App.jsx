import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom'
import EventList from './components/EventList'
import EventCreate from './components/EventCreate'
import EventDetail from './components/EventDetail'
import SponsorManagement from './components/SponsorManagement'
import FundingPoolManagement from './components/FundingPoolManagement'
import TeamManagement from './components/TeamManagement'
import RegistrationManagement from './components/RegistrationManagement'
import Registration from './components/Registration'
import RegistrationQuery from './components/RegistrationQuery'
import CheckInManagement from './components/CheckInManagement'
import CheckIn from './components/CheckIn'
import SubmissionList from './components/SubmissionList'
import SubmissionForm from './components/SubmissionForm'
import VotingPanel from './components/VotingPanel'
import Results from './components/Results'
import './App.css'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'

function App() {
  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" color="primary" elevation={2}>
          <Toolbar>
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                flexGrow: 1,
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 600,
              }}
            >
              Hackathon Platform
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" component={RouterLink} to="/">
                活动列表
              </Button>
              <Button color="inherit" component={RouterLink} to="/events/create">
                创建活动
              </Button>
              <Button color="inherit" component={RouterLink} to="/sponsors">
                赞助商管理
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ py: 3, flex: 1 }}>
          <Routes>
            <Route path="/" element={<EventList />} />
            <Route path="/events/create" element={<EventCreate />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/events/:eventId/funding-pool" element={<FundingPoolManagement />} />
            <Route path="/events/:eventId/register" element={<Registration />} />
            <Route path="/events/:eventId/registrations" element={<RegistrationManagement />} />
            <Route path="/events/:eventId/registration-query" element={<RegistrationQuery />} />
            <Route path="/events/:eventId/check-in" element={<CheckInManagement />} />
            <Route path="/events/:eventId/checkin" element={<CheckIn />} />
            <Route path="/events/:eventId/submissions" element={<SubmissionList />} />
            <Route path="/events/:eventId/submit" element={<SubmissionForm />} />
            <Route path="/events/:eventId/voting" element={<VotingPanel />} />
            <Route path="/events/:eventId/results" element={<Results />} />
            <Route path="/events/:eventId/teams" element={<TeamManagement />} />
            <Route path="/sponsors" element={<SponsorManagement />} />
            <Route path="/teams" element={<TeamManagement />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  )
}

export default App

