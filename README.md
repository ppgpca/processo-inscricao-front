# Processo de Inscrição — Frontend

Interface web do sistema de **Processo de Inscrição** do PPCPCA (Programa de Pós-Graduação em Ciência da Computação e Aplicações) da UFFS.

## Tecnologias

- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) 8
- [Material UI (MUI)](https://mui.com/) 9

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou superior (recomendado: LTS)
- [Yarn](https://yarnpkg.com/) 1.x (Classic)

Para verificar as versões instaladas:

```bash
node --version
yarn --version
```

## Instalação

1. Clone o repositório:

```bash
git clone <url-do-repositorio>
cd processo-inscricao-front
```

2. Instale as dependências:

```bash
yarn install
```

## Executando em desenvolvimento

Inicie o servidor de desenvolvimento com hot reload:

```bash
yarn dev
```

A aplicação ficará disponível em [http://localhost:5173](http://localhost:5173).

## Outros comandos

| Comando         | Descrição                                      |
| --------------- | ---------------------------------------------- |
| `yarn dev`      | Servidor de desenvolvimento                    |
| `yarn build`    | Compila o projeto para produção (`dist/`)      |
| `yarn preview`  | Pré-visualiza o build de produção localmente   |
| `yarn lint`     | Executa o ESLint no código                     |

### Build de produção

```bash
yarn build
```

Os arquivos gerados ficam na pasta `dist/`. Para testar o build localmente:

```bash
yarn preview
```

## Estrutura do projeto

```
processo-inscricao-front/
├── public/              # Arquivos estáticos
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── theme/           # Tema MUI e provider de tema claro/escuro
│   ├── App.tsx          # Componente raiz da aplicação
│   └── main.tsx         # Ponto de entrada
├── index.html
├── package.json
└── vite.config.ts
```

## Licença

Este projeto está licenciado sob a [GNU General Public License v3.0](LICENSE).
