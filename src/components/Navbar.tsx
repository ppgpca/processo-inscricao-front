import { useContext, useState } from "react";
import {
	AppBar,
	Box,
	Divider,
	Drawer,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Toolbar,
	Typography,
	useTheme,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GavelIcon from "@mui/icons-material/Gavel";
import GroupIcon from "@mui/icons-material/Group";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Permissoes } from "../enums/permissoes";
import PermissionContext from "../contexts/PermissionContext";
import UserMenu from "./UserMenu";
import { DrawerContext } from "../App";

const DRAWER_WIDTH = 260;

export default function Navbar() {
	const theme = useTheme();
	const navigate = useNavigate();
	const { isAuthenticated } = useAuth();
	const { drawerOpen, setDrawerOpen } = useContext(DrawerContext);
	const [mobileOpen, setMobileOpen] = useState(false);

	const isMobile =
		typeof window !== "undefined" && window.innerWidth < theme.breakpoints.values.md;

	const handleToggle = () => {
		if (isMobile) {
			setMobileOpen((prev) => !prev);
		} else {
			setDrawerOpen((prev) => !prev);
		}
	};

	const handleClose = () => {
		setMobileOpen(false);
		setDrawerOpen(false);
	};

	const navegar = (rota: string) => {
		navigate(rota);
		handleClose();
	};

	const drawerContent = (
		<Box sx={{ overflow: "auto", width: DRAWER_WIDTH }}>
			<Toolbar>
				<Typography variant="h6" noWrap>
					Menu
				</Typography>
			</Toolbar>
			<Divider />
			<List>
				<PermissionContext
					grupos={[Permissoes.GRUPOS.ADMIN, Permissoes.GRUPOS.COORDENADOR, Permissoes.GRUPOS.DOCENTE]}
					showError={false}
				>
					<ListItem disablePadding>
						<ListItemButton onClick={() => navegar("/gestao")}>
							<ListItemIcon>
								<DashboardIcon />
							</ListItemIcon>
							<ListItemText primary="Dashboard" />
						</ListItemButton>
					</ListItem>
				</PermissionContext>

				<PermissionContext
					grupos={[Permissoes.GRUPOS.ADMIN, Permissoes.GRUPOS.COORDENADOR]}
					showError={false}
				>
					<ListItem disablePadding>
						<ListItemButton onClick={() => navegar("/gestao/candidatos")}>
							<ListItemIcon>
								<GroupIcon />
							</ListItemIcon>
							<ListItemText primary="Gerenciar Candidatos" />
						</ListItemButton>
					</ListItem>
				</PermissionContext>

				<PermissionContext
					grupos={[
						Permissoes.GRUPOS.ADMIN,
						Permissoes.GRUPOS.COORDENADOR,
						Permissoes.GRUPOS.DOCENTE,
					]}
					showError={false}
				>
					<ListItem disablePadding>
						<ListItemButton onClick={() => navegar("/gestao/avaliacao")}>
							<ListItemIcon>
								<GavelIcon />
							</ListItemIcon>
							<ListItemText primary="Avaliar Candidatos" />
						</ListItemButton>
					</ListItem>
				</PermissionContext>
			</List>
		</Box>
	);

	return (
		<Box sx={{ display: "flex" }}>
			<AppBar
				position="fixed"
				elevation={0}
				sx={{
					zIndex: theme.zIndex.drawer + 1,
				}}
			>
				<Toolbar sx={{ py: 1 }}>
					{isAuthenticated && (
						<IconButton
							color="inherit"
							aria-label="abrir menu"
							edge="start"
							onClick={handleToggle}
							sx={{ mr: 1 }}
						>
							<MenuIcon />
						</IconButton>
					)}
					<Box sx={{ flex: 1 }} />
					<Typography
						variant="h6"
						component="div"
						sx={{ flex: 1, textAlign: "center", fontWeight: 600, cursor: "pointer" }}
						onClick={() => navegar("/gestao")}
					>
						Gestão — PPGPCA
					</Typography>
					<Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
						<UserMenu />
					</Box>
				</Toolbar>
			</AppBar>

			{isAuthenticated && (
				<>
					{/* Drawer mobile */}
					<Drawer
						variant="temporary"
						open={mobileOpen}
						onClose={handleClose}
						ModalProps={{ keepMounted: true }}
						sx={{
							display: { xs: "block", md: "none" },
							"& .MuiDrawer-paper": {
								width: DRAWER_WIDTH,
								boxSizing: "border-box",
							},
						}}
					>
						{drawerContent}
					</Drawer>

					{/* Drawer desktop */}
					<Drawer
						variant="temporary"
						open={drawerOpen}
						onClose={handleClose}
						ModalProps={{ keepMounted: true }}
						sx={{
							display: { xs: "none", md: "block" },
							"& .MuiDrawer-paper": {
								width: DRAWER_WIDTH,
								boxSizing: "border-box",
							},
						}}
					>
						{drawerContent}
					</Drawer>
				</>
			)}
		</Box>
	);
}
