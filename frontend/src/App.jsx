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
import WalletConnect from './components/WalletConnect'
import { WalletProvider } from './contexts/WalletContext'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'

function App() {
  return (
    <WalletProvider>
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
          <AppBar 
            position="static" 
            color="primary" 
            elevation={0}
            sx={{
              bgcolor: 'primary.main',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          >
            <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
              <Typography
                variant="h6"
                component={RouterLink}
                to="/"
                sx={{
                  flexGrow: 1,
                  textDecoration: 'none',
                  color: 'inherit',
                  fontWeight: 600,
                  fontSize: '1.25rem',
                  '&:hover': {
                    opacity: 0.9,
                  },
                }}
              >
                Hackathon Platform
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  活动列表
                </Button>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/events/create"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  创建活动
                </Button>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/sponsors"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  赞助商管理
                </Button>
                <Box sx={{ ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 } }}>
                  <WalletConnect />
                </Box>
              </Box>
            </Toolbar>
          </AppBar>
          <Container 
            maxWidth="lg" 
            sx={{ 
              py: { xs: 3, sm: 4 }, 
              flex: 1,
              px: { xs: 2, sm: 3 },
            }}
          >
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
    </WalletProvider>
  )
}

export default App

