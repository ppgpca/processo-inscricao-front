import React from 'react';
import {
	Box,
	Paper,
	TextField,
	Button,
	Typography,
	Alert,
	CircularProgress,
	Container,
} from '@mui/material';
import { useLogin } from '../../hooks/useLogin.js';

export default function Login() {
	const { formData, error, loading, handleInputChange, handleSubmit } = useLogin();

	return (
		<Container maxWidth="sm">
			<Box
				sx={{
					marginTop: 8,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				<Paper
					elevation={3}
					sx={{
						padding: 4,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						width: '100%',
					}}
				>
					<Typography component="h1" variant="h5" sx={{ mb: 1 }}>
						Área Restrita
					</Typography>

					<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
						Processo de Inscrição — PPGPCA / UFFS
					</Typography>

					{error && (
						<Alert severity="error" sx={{ width: '100%', mb: 2 }}>
							{error}
						</Alert>
					)}

					<Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
						<TextField
							margin="normal"
							required
							fullWidth
							id="userId"
							label="ID do Usuário"
							name="userId"
							autoComplete="username"
							autoFocus
							value={formData.userId}
							onChange={handleInputChange}
							disabled={loading}
						/>
						<TextField
							margin="normal"
							required
							fullWidth
							name="senha"
							label="Senha"
							type="password"
							id="senha"
							autoComplete="current-password"
							value={formData.senha}
							onChange={handleInputChange}
							disabled={loading}
						/>
						<Button
							type="submit"
							fullWidth
							variant="contained"
							sx={{ mt: 3, mb: 2 }}
							disabled={loading}
						>
							{loading ? <CircularProgress size={24} /> : 'Entrar'}
						</Button>
					</Box>
				</Paper>
			</Box>
		</Container>
	);
}
