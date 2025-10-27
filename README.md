# 🗳️ Decentralized Voting System

<h4 align="center">
  Decentralized Voting Platform Built on Ethereum
</h4>

Проект представляет собой полноценную систему децентрализованного голосования на блокчейне Ethereum. Система позволяет создавать голосования, регистрировать участников и проводить прозрачное голосование с автоматическим подсчетом результатов.

## 🎯 Основные возможности

- ✅ **Создание голосований**: Пользователи могут создавать голосования с настраиваемыми параметрами
- 🔐 **Децентрализованная регистрация**: Участники могут самостоятельно регистрироваться для голосования
- 🗳️ **Прозрачное голосование**: Все голоса записываются в блокчейн для полной прозрачности
- 👥 **Управление участниками**: Создатель голосования может управлять списком участников
- 📊 **Автоматический подсчет**: Результаты голосования рассчитываются автоматически
- 🧪 **Полное тестирование**: Комплексные тесты для проверки функционала

## 🛠 Технологический стек

⚙️ Built using **NextJS**, **RainbowKit**, **Hardhat**, **Wagmi**, **Viem**, and **TypeScript**.

- ✅ **Contract Hot Reload**: Your frontend auto-adapts to your smart contract as you edit it.
- 🪝 **[Custom hooks](https://docs.scaffoldeth.io/hooks/)**: Collection of React hooks wrapper around [wagmi](https://wagmi.sh/) to simplify interactions with smart contracts with typescript autocompletion.
- 🧱 [**Components**](https://docs.scaffoldeth.io/components/): Collection of common web3 components to quickly build your frontend.
- 🔥 **Burner Wallet & Local Faucet**: Quickly test your application with a burner wallet and local faucet.
- 🔐 **Integration with Wallet Providers**: Connect to different wallet providers and interact with the Ethereum network.

## 📋 Функционал

### Smart Contract (DecentralizedVoting.sol)

Контракт поддерживает следующие операции:

1. **Создание голосований** (`createProposal`): Создайте новое голосование с названием, описанием и продолжительностью
2. **Добавление кандидатов** (`addCandidate`): Добавьте кандидатов к голосованию до начала голосования
3. **Регистрация участников**:
   - `selfRegisterForProposal`: Участники регистрируются самостоятельно
   - `registerVoterForProposal`: Создатель регистрирует участников вручную
4. **Голосование** (`vote`): Зарегистрированные участники могут проголосовать один раз
5. **Финализация** (`finalizeProposal`): Завершите голосование и определите победителя

### Web Interface

Приложение предоставляет удобный интерфейс для:
- 📊 Просмотра всех активных голосований
- ➕ Создания новых голосований
- 🗳️ Участия в голосовании
- 🧪 Тестирования системы

![Voting Interface](https://via.placeholder.com/800x400/0D1117/FFFFFF?text=Decentralized+Voting+Interface)

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v20.18.3)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

To get started with Scaffold-ETH 2, follow the steps below:

1. Install dependencies if it was skipped in CLI:

```
cd my-dapp-example
yarn install
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `packages/hardhat/hardhat.config.ts`.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract is located in `packages/hardhat/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network. You can also customize the deploy script.

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

### Запуск тестов

Запустите полный набор тестов для проверки функционала контракта:

```bash
yarn test
```

Тесты проверяют:
- ✅ Развертывание контракта
- ✅ Создание голосований
- ✅ Добавление кандидатов
- ✅ Регистрацию участников
- ✅ Процесс голосования
- ✅ Подсчет результатов
- ✅ Финализацию голосования
- ✅ Обработку граничных случаев

### Структура проекта

- **Smart Contract**: `packages/hardhat/contracts/DecentralizedVoting.sol`
- **Frontend Components**: `packages/nextjs/components/voting/`
- **Tests**: `packages/hardhat/test/DecentralizedVoting.test.ts`
- **Deployment**: `packages/hardhat/deploy/00_deploy_your_contract.ts`

### Основные файлы

- **Контракт голосования**: `packages/hardhat/contracts/DecentralizedVoting.sol`
- **Главная страница приложения**: `packages/nextjs/app/voting/page.tsx`
- **Компоненты**: 
  - `ProposalCard.tsx` - Карточка голосования
  - `ProposalList.tsx` - Список голосований
  - `CreateProposal.tsx` - Создание голосований
  - `CandidateList.tsx` - Список кандидатов
  - `TestingPanel.tsx` - Панель тестирования
- **Тесты**: `packages/hardhat/test/DecentralizedVoting.test.ts`


## Documentation

Visit our [docs](https://docs.scaffoldeth.io) to learn how to start building with Scaffold-ETH 2.

To know more about its features, check out our [website](https://scaffoldeth.io).

## Contributing to Scaffold-ETH 2

We welcome contributions to Scaffold-ETH 2!

Please see [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Scaffold-ETH 2.