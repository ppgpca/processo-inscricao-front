import React from 'react'
import { Route, Routes, Navigate } from 'react-router'
import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material'

import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './contexts/ProtectedRoute'
import { Permissoes } from './enums/permissoes'

import ThemeSwitch from './components/ThemeSwitch.jsx'
import InscricaoStepper from './components/InscricaoStepper.jsx'
import Login from './components/login/Login.jsx'

function GestaoHome() {
	const { gruposUsuario, usuario } = useAuth()

	const isAdmin = gruposUsuario.some((g) => g.id === Permissoes.GRUPOS.ADMIN)
	const isDocente = gruposUsuario.some((g) => g.id === Permissoes.GRUPOS.DOCENTE)

	return (
		<Box sx={{ p: 4 }}>
			<Typography variant="h5" gutterBottom>
				Bem-vindo, {usuario?.nome ?? 'usuário'}
			</Typography>
			<Typography variant="body1" color="text.secondary">
				{isAdmin && 'Você está logado como administrador.'}
				{!isAdmin && isDocente && 'Você está logado como docente orientador.'}
			</Typography>
		</Box>
	)
}

function PublicLayout({ children }) {
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

			<Box component="main" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>
				<Container maxWidth="md">{children}</Container>
			</Box>
		</Box>
	)
}

function AppRoutes() {
	return (
		<Routes>
			{/* Área pública: inscrição de candidatos */}
			<Route
				path="/"
				element={
					<PublicLayout>
						<Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
							Inscrição para o Processo Seletivo
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
							Universidade Federal da Fronteira Sul — UFFS
						</Typography>
						<InscricaoStepper />
					</PublicLayout>
				}
			/>

			{/* Login da área restrita */}
			<Route path="/login" element={<Login />} />

			{/* Área restrita: gestão do processo */}
			<Route
				path="/gestao"
				element={
					<ProtectedRoute>
						<GestaoHome />
					</ProtectedRoute>
				}
			/>

			{/* Redireciona qualquer rota desconhecida para a raiz */}
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	)
}

function App() {
	return (
		<AuthProvider>
			<AppRoutes />
		</AuthProvider>
	)
}

export default App
