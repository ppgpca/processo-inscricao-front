import { useAuth } from "../contexts/AuthContext";
import { Permissoes } from "../enums/permissoes";
import DashboardCoordenador from "./dashboard/DashboardCoordenador";
import DashboardDocente from "./dashboard/DashboardDocente";

export default function Dashboard() {
	const { gruposUsuario } = useAuth();

	const isAdmin = gruposUsuario.some((g) => g.id === Permissoes.GRUPOS.ADMIN);
	const isCoordenador = gruposUsuario.some(
		(g) => g.id === Permissoes.GRUPOS.COORDENADOR,
	);

	if (isAdmin || isCoordenador) {
		return <DashboardCoordenador />;
	}

	return <DashboardDocente />;
}
