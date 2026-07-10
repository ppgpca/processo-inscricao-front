import { createTheme } from "@mui/material/styles";
import type { ThemeMode } from "../types";
import { customColors } from "./customColors";

declare module "@mui/material/styles" {
	interface Palette {
		custom: {
			veronica: string;
			glaucous: string;
			trueBlue: string;
			frenchGray: string;
			raisinBlack: string;
			taupe: string;
		};
	}
	interface PaletteOptions {
		custom?: {
			veronica?: string;
			glaucous?: string;
			trueBlue?: string;
			frenchGray?: string;
			raisinBlack?: string;
			taupe?: string;
		};
	}
}

export function createMuiTheme(mode: ThemeMode) {
	return createTheme({
		palette: {
			mode,
			primary: {
				main: customColors.teal,
				light: customColors.tiffanyBlue,
				dark: customColors.darkGray,
			},
			secondary: {
				main: customColors.orange,
				light: "#ffe082",
				dark: "#f57c00",
			},
			info: {
				main: customColors.glaucous,
				light: customColors.frenchGray,
				dark: customColors.trueBlue,
			},
			warning: {
				main: customColors.orange,
				light: "#ffe082",
				dark: "#e69500",
			},
			error: {
				main: "#d32f2f",
				light: "#ef5350",
				dark: "#c62828",
			},
			success: {
				main: customColors.tiffanyBlue,
				light: "#81c784",
				dark: customColors.teal,
			},
			background: {
				default:
					mode === "light"
						? customColors.whiteSmoke
						: customColors.raisinBlack,
				paper: mode === "light" ? "#ffffff" : customColors.jet,
			},
			text: {
				primary:
					mode === "light"
						? customColors.eerieBlack
						: customColors.whiteSmoke,
				secondary:
					mode === "light"
						? customColors.taupe
						: customColors.platinum,
			},
			divider:
				mode === "light"
					? customColors.platinum
					: customColors.frenchGray,
			custom: {
				veronica: customColors.veronica,
				glaucous: customColors.glaucous,
				trueBlue: customColors.trueBlue,
				frenchGray: customColors.frenchGray,
				raisinBlack: customColors.raisinBlack,
				taupe: customColors.taupe,
			},
		},
		typography: {
			fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
			h1: {
				color: mode === "light" ? customColors.darkGray : "#ffffff",
			},
			h2: {
				color: mode === "light" ? customColors.darkGray : "#ffffff",
			},
			h3: {
				color:
					mode === "light"
						? customColors.teal
						: customColors.tiffanyBlue,
			},
			h4: {
				color:
					mode === "light"
						? customColors.teal
						: customColors.tiffanyBlue,
			},
		},
		components: {
			MuiAppBar: {
				styleOverrides: {
					root: {
						backgroundColor: customColors.teal,
					},
				},
			},
			MuiButton: {
				styleOverrides: {
					root: {
						borderRadius: 8,
						textTransform: "none",
						fontWeight: 600,
					},
				},
				variants: [
					{
						props: { variant: "contained", color: "primary" },
						style: {
							backgroundColor: customColors.teal,
							"&:hover": {
								backgroundColor: customColors.darkGray,
							},
						},
					},
					{
						props: { variant: "contained", color: "secondary" },
						style: {
							backgroundColor: customColors.orange,
							color: "#ffffff",
							"&:hover": {
								backgroundColor: "#e69500",
							},
						},
					},
				],
			},
			MuiCard: {
				styleOverrides: {
					root: {
						borderRadius: 12,
						boxShadow:
							mode === "light"
								? "0 2px 8px rgba(0,0,0,0.1)"
								: "0 2px 8px rgba(0,0,0,0.3)",
					},
				},
			},
			MuiTextField: {
				styleOverrides: {
					root: {
						"& .MuiOutlinedInput-root.Mui-focused fieldset": {
							borderColor: customColors.teal,
						},
						"& .MuiInputLabel-root.Mui-focused": {
							color: customColors.teal,
						},
					},
				},
			},
			MuiChip: {
				styleOverrides: {
					root: {
						backgroundColor: customColors.tiffanyBlue,
						color: customColors.darkGray,
						"&:hover": {
							backgroundColor: customColors.teal,
							color: "#ffffff",
						},
					},
				},
			},
			MuiPaper: {
				styleOverrides: {
					root: {
						borderRadius: 8,
						border: `1px solid ${mode === "light" ? customColors.platinum : customColors.frenchGray}`,
					},
				},
			},
			MuiTableHead: {
				styleOverrides: {
					root: {
						backgroundColor:
							mode === "light"
								? customColors.glaucous
								: customColors.trueBlue,
						"& .MuiTableCell-head": {
							color: "#ffffff",
							fontWeight: 600,
						},
					},
				},
			},
			MuiTableRow: {
				styleOverrides: {
					root: {
						"&:nth-of-type(odd)": {
							backgroundColor:
								mode === "light"
									? customColors.whiteSmoke
									: customColors.raisinBlack,
						},
						"&:hover": {
							backgroundColor:
								mode === "light"
									? customColors.platinum
									: customColors.taupe,
						},
					},
				},
			},
			MuiAlert: {
				variants: [
					{
						props: { severity: "info", variant: "standard" },
						style: {
							backgroundColor: customColors.glaucous,
							color: "#ffffff",
						},
					},
					{
						props: { severity: "warning", variant: "standard" },
						style: {
							backgroundColor: customColors.orange,
							color: "#ffffff",
						},
					},
				],
			},
			MuiTab: {
				styleOverrides: {
					root: {
						textTransform: "none",
						fontWeight: 500,
						"&.Mui-selected": {
							color: customColors.veronica,
						},
					},
				},
			},
			MuiTabs: {
				styleOverrides: {
					indicator: {
						backgroundColor: customColors.veronica,
						height: 3,
					},
				},
			},
			MuiIconButton: {
				styleOverrides: {
					root: {
						color:
							mode === "light"
								? customColors.platinum
								: customColors.frenchGray,
						"&:hover": {
							backgroundColor:
								mode === "light"
									? customColors.platinum
									: customColors.taupe,
							color: customColors.veronica,
						},
					},
				},
			},
		},
	});
}
