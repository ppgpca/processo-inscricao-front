import { useState, useCallback } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import loginController from "../controllers/login-controller";

interface LoginFormData {
	userId: string;
	senha: string;
}

export function useLogin() {
	const [formData, setFormData] = useState<LoginFormData>({
		userId: "",
		senha: "",
	});
	const [error, setError] = useState("");
	const { login, loading } = useAuth();
	const navigate = useNavigate();

	const handleInputChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			setFormData((prev) => ({
				...prev,
				[e.target.name]: e.target.value,
			}));
			setError("");
		},
		[],
	);

	const handleSubmit = useCallback(
		async (e: FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			setError("");

			const validation = loginController.validateLoginForm(
				formData.userId,
				formData.senha,
			);

			if (!validation.isValid) {
				setError(validation.message ?? "");
				return;
			}

			try {
				const resultado = await login(formData.userId, formData.senha);
				const processedResult =
					loginController.processLoginResult(resultado);

				if (processedResult.success) {
					navigate("/gestao");
				} else {
					setError(processedResult.error ?? "");
				}
			} catch (err) {
				const errorMessage = loginController.handleLoginError(
					err as Error,
				);
				setError(errorMessage);
			}
		},
		[formData, login, navigate],
	);

	return {
		formData,
		error,
		loading,
		handleInputChange,
		handleSubmit,
	};
}
