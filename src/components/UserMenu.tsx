import { useState } from "react";
import {
	Avatar,
	Box,
	Divider,
	IconButton,
	ListItemIcon,
	Menu,
	MenuItem,
	Switch,
	Typography,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import LightModeIcon from "@mui/icons-material/LightMode";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useThemeContext } from "../theme/ThemeProvider";

export default function UserMenu() {
	const { usuario, logout } = useAuth();
	const { mode, toggleTheme } = useThemeContext();
	const navigate = useNavigate();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	const isDarkMode = mode === "dark";

	if (!usuario) return null;

	const inicialNome = usuario.nome
		? usuario.nome.charAt(0).toUpperCase()
		: "U";

	const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleLogout = () => {
		handleClose();
		logout();
		navigate("/login");
	};

	const handleLimparCache = () => {
		handleClose();
		localStorage.clear();
		window.location.reload();
	};

	return (
		<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
			<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
				{isDarkMode ? (
					<DarkModeIcon sx={{ fontSize: 20, color: "common.white" }} />
				) : (
					<LightModeIcon sx={{ fontSize: 20, color: "common.white" }} />
				)}
				<Switch
					checked={isDarkMode}
					onChange={toggleTheme}
					size="small"
					sx={{ "& .MuiSwitch-thumb": { bgcolor: "background.paper" } }}
				/>
			</Box>

			<IconButton
				size="large"
				aria-label="menu do usuário"
				aria-controls="menu-usuario"
				aria-haspopup="true"
				onClick={handleOpen}
				color="inherit"
			>
				<Avatar sx={{ width: 32, height: 32, bgcolor: "primary.dark" }}>
					{inicialNome}
				</Avatar>
			</IconButton>

			<Menu
				id="menu-usuario"
				anchorEl={anchorEl}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
				transformOrigin={{ vertical: "top", horizontal: "right" }}
				keepMounted
				open={Boolean(anchorEl)}
				onClose={handleClose}
			>
				<MenuItem disabled>
					<Box sx={{ display: "flex", flexDirection: "column" }}>
						<Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
							{usuario.nome}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							{usuario.id}
						</Typography>
					</Box>
				</MenuItem>

				<Divider />

				<MenuItem onClick={handleLimparCache}>
					<ListItemIcon>
						<DeleteSweepIcon fontSize="small" />
					</ListItemIcon>
					Limpar cache
				</MenuItem>

				<MenuItem onClick={handleLogout}>
					<ListItemIcon>
						<LogoutIcon fontSize="small" />
					</ListItemIcon>
					Sair
				</MenuItem>
			</Menu>
		</Box>
	);
}
