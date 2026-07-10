import { Route, Routes, Navigate } from "react-router";
import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./contexts/ProtectedRoute";

import ThemeSwitch from "./components/ThemeSwitch";
import UserMenu from "./components/UserMenu";
import InscricaoStepper from "./components/InscricaoStepper";
import Login from "./components/login/Login";
import Dashboard from "./components/Dashboard";

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

function GestaoLayout({ children }: { children: ReactNode }) {
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
						Gestão — PPGPCA
					</Typography>
					<Box
						sx={{
							flex: 1,
							display: "flex",
							justifyContent: "flex-end",
						}}
					>
						<UserMenu />
					</Box>
				</Toolbar>
			</AppBar>

			<Box component="main" sx={{ flex: 1, p: { xs: 2, md: 4 } }}>
				{children}
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
						<GestaoLayout>
							<Dashboard />
						</GestaoLayout>
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
