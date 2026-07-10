import { Route, Routes, Navigate } from "react-router";
import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./contexts/ProtectedRoute";
import { Permissoes } from "./enums/permissoes";

import ThemeSwitch from "./components/ThemeSwitch";
import InscricaoStepper from "./components/InscricaoStepper";
import Login from "./components/login/Login";

function GestaoHome() {
	const { gruposUsuario, usuario } = useAuth();

	const isAdmin = gruposUsuario.some((g) => g.id === Permissoes.GRUPOS.ADMIN);
	const isDocente = gruposUsuario.some(
		(g) => g.id === Permissoes.GRUPOS.DOCENTE,
	);

	return (
		<Box sx={{ p: 4 }}>
			<Typography variant="h5" gutterBottom>
				Bem-vindo, {usuario?.nome ?? "usuário"}
			</Typography>
			<Typography variant="body1" color="text.secondary">
				{isAdmin && "Você está logado como administrador."}
				{!isAdmin &&
					isDocente &&
					"Você está logado como docente orientador."}
			</Typography>
		</Box>
	);
}

function PublicLayout({ children }: { children: ReactNode }) {
	return (
		<Box
			sx={{
				minHeight: "100vh",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<AppBar position="static" elevation={0}>
				<Toolbar sx={{ py: 1 }}>
					<Box sx={{ flex: 1 }} />
					<Typography
						variant="h6"
						component="div"
						sx={{ flex: 1, textAlign: "center", fontWeight: 600 }}
					>
						Processo de Inscrição — PPGPCA
					</Typography>
					<Box
						sx={{
							flex: 1,
							display: "flex",
							justifyContent: "flex-end",
						}}
					>
						<ThemeSwitch />
					</Box>
				</Toolbar>
			</AppBar>

			<Box component="main" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>
				<Container maxWidth="md">{children}</Container>
			</Box>
		</Box>
	);
}

function AppRoutes() {
	return (
		<Routes>
			<Route
				path="/"
				element={
					<PublicLayout>
						<Typography
							variant="h5"
							component="h1"
							gutterBottom
							sx={{ fontWeight: 600 }}
						>
							Inscrição para o Processo Seletivo
						</Typography>
						<Typography
							variant="body2"
							color="text.secondary"
							sx={{ mb: 3 }}
						>
							Universidade Federal da Fronteira Sul — UFFS
						</Typography>
						<InscricaoStepper />
					</PublicLayout>
				}
			/>
			<Route path="/login" element={<Login />} />
			<Route
				path="/gestao"
				element={
					<ProtectedRoute>
						<GestaoHome />
					</ProtectedRoute>
				}
			/>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}

function App() {
	return (
		<AuthProvider>
			<AppRoutes />
		</AuthProvider>
	);
}

export default App;
