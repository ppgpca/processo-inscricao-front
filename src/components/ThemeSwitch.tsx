import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { Box, Switch } from "@mui/material";
import { useThemeContext } from "../theme/ThemeProvider";

export default function ThemeSwitch() {
	const { mode, toggleTheme } = useThemeContext();
	const isDarkMode = mode === "dark";

	return (
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
				sx={{
					"& .MuiSwitch-thumb": {
						bgcolor: "background.paper",
					},
				}}
			/>
		</Box>
	);
}
