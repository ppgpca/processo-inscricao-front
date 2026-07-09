import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material'

import ThemeSwitch from './components/ThemeSwitch.jsx'
import InscricaoStepper from './components/InscricaoStepper.jsx'

function App() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ flex: 1 }} />
          <Typography
            variant="h6"
            component="div"
            sx={{ flex: 1, textAlign: 'center', fontWeight: 600 }}
          >
            Processo de Inscrição — PPGPCA
          </Typography>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <ThemeSwitch />
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flex: 1,
          py: { xs: 3, md: 5 },
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Inscrição para o Processo Seletivo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Universidade Federal da Fronteira Sul — UFFS
          </Typography>
          <InscricaoStepper />
        </Container>
      </Box>
    </Box>
  )
}

export default App
