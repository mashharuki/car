import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Hardhat Ignition Module for ERC-4337 License Plate Wallet System
 *
 * Deploys:
 * 1. AccountFactory - Base factory for PrivacyProtectedAccount
 * 2. LicensePlateAccountFactory - Extended factory with ZK proof support
 * 3. VehicleRegistry - Optional registry for vehicle-to-wallet mappings
 *
 * Network: Base Sepolia (testnet) / Base Mainnet
 * EntryPoint: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789 (ERC-4337 v0.6)
 */
const LicensePlateAccountFactoryModule = buildModule(
  "LicensePlateAccountFactoryModule",
  (m) => {
    // EntryPoint address (official ERC-4337 v0.6 - same on all networks)
    const ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

    // Deploy AccountFactory
    const accountFactory = m.contract("AccountFactory", [ENTRYPOINT_ADDRESS], {
      id: "AccountFactory",
    });

    // Deploy LicensePlateAccountFactory
    const licensePlateAccountFactory = m.contract(
      "LicensePlateAccountFactory",
      [ENTRYPOINT_ADDRESS],
      {
        id: "LicensePlateAccountFactory",
      }
    );

    // Deploy VehicleRegistry
    const vehicleRegistry = m.contract("VehicleRegistry", [], {
      id: "VehicleRegistry",
    });

    return {
      accountFactory,
      licensePlateAccountFactory,
      vehicleRegistry,
    };
  }
);

export default LicensePlateAccountFactoryModule;
